import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  CARDS,
  EMPIRICAL,
  INITIAL_BROKEN,
  SLOPES,
  clamp,
  evaluateCascade,
  projectSlotsToCanvas,
  sweetSpreadRange,
} from "./model.js";

const $ = (id) => document.getElementById(id);

// =========================================================================
// 工具：圆角矩形路径（兼容所有浏览器，不依赖 ctx.roundRect）
// =========================================================================
function rrect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function getDpr() {
  return window.innerWidth <= 640 ? pixelRatio(1.25) : pixelRatio(2);
}

// =========================================================================
// HERO：五幕瀑布级联编排台
// =========================================================================
const heroWrap = $("hero-wrap");
const heroCanvas = $("hero-canvas");
const hctx = heroCanvas.getContext("2d");

const state = {
  order: [...INITIAL_BROKEN.order],
  spread: INITIAL_BROKEN.spread,
  zDir: INITIAL_BROKEN.zDir,
  slope: INITIAL_BROKEN.slope,
  selectedSlot: null,
  hoverSlot: null,
};

// 平滑动画显示的几何插值态（每个 cardId 的当前绘制矩形）
const animCards = CARDS.map(() => ({ x: 0, y: 0, w: 100, h: 120, ready: false }));
let heroW = 640;
let heroH = 440;
let heroDpr = 1;
let bgCache = null;
let bgKey = "";
// 离屏缓存 5 张卡片贴图（避免每帧反复 clip + bezier + fillText，软件渲染同样 60fps）
const cardSpriteCache = new Map();
const SPRITE_PAD = 12;
let lastEval = evaluateCascade(state);
let lastProj = null;
let railDragging = false;
let pendingDomSync = false;
let lastDomSig = "";

// 拖卡互换状态
const cardDrag = {
  active: false,
  pointerId: null,
  fromSlot: -1,
  startX: 0,
  startY: 0,
  curX: 0,
  curY: 0,
  moved: false,
};

// 离屏缓存静态水墨瀑布与远石（避免每帧重绘渐变，保障低端机与软件渲染 60fps）
function ensureBgCache(w, h, dpr) {
  const key = `${w}x${h}@${dpr}`;
  if (bgCache && bgKey === key) return bgCache;
  bgKey = key;
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * dpr));
  c.height = Math.max(1, Math.round(h * dpr));
  const g = c.getContext("2d");
  g.scale(dpr, dpr);

  // 1. 浅雾瓷蓝渐变底
  const sky = g.createLinearGradient(0, 0, w, h);
  sky.addColorStop(0, "#F8FCFE");
  sky.addColorStop(0.55, "#EAF4F8");
  sky.addColorStop(1, "#DCEEF5");
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);

  // 2. 右侧多层水墨岩石与瀑布轮廓（承袭 060 原海报右侧水墨瀑布母题）
  const rx = w * 0.52;
  const ry = h * 0.25;

  // 远景雾石群
  g.fillStyle = "rgba(132, 180, 198, 0.22)";
  const rocksBack = [
    [w * 0.78, h * 0.30, w * 0.08],
    [w * 0.87, h * 0.35, w * 0.09],
    [w * 0.96, h * 0.42, w * 0.08],
    [w * 0.62, h * 0.84, w * 0.08],
    [w * 0.94, h * 0.84, w * 0.09],
  ];
  for (const [cx, cy, rad] of rocksBack) {
    g.beginPath();
    g.arc(cx, cy, rad, Math.PI, 0);
    g.lineTo(cx + rad, h);
    g.lineTo(cx - rad, h);
    g.closePath();
    g.fill();
  }

  // 主瀑布级联水流（两级落水台阶）
  const fall1 = g.createLinearGradient(0, ry, 0, h * 0.92);
  fall1.addColorStop(0, "rgba(255, 255, 255, 0.85)");
  fall1.addColorStop(0.22, "rgba(195, 228, 238, 0.78)");
  fall1.addColorStop(0.7, "rgba(147, 199, 215, 0.42)");
  fall1.addColorStop(1, "rgba(232, 244, 249, 0.08)");
  g.fillStyle = fall1;
  g.beginPath();
  g.moveTo(rx + w * 0.02, ry + h * 0.05);
  g.quadraticCurveTo(w * 0.76, ry - h * 0.02, w * 0.84, ry + h * 0.08);
  g.lineTo(w * 0.88, h * 0.88);
  g.lineTo(rx - w * 0.04, h * 0.88);
  g.closePath();
  g.fill();

  // 右端第二级高瀑
  const fall2 = g.createLinearGradient(0, h * 0.38, 0, h * 0.92);
  fall2.addColorStop(0, "rgba(255, 255, 255, 0.86)");
  fall2.addColorStop(0.28, "rgba(180, 220, 233, 0.72)");
  fall2.addColorStop(1, "rgba(220, 238, 245, 0.06)");
  g.fillStyle = fall2;
  g.beginPath();
  g.moveTo(w * 0.82, h * 0.41);
  g.quadraticCurveTo(w * 0.93, h * 0.37, w * 0.99, h * 0.44);
  g.lineTo(w, h * 0.88);
  g.lineTo(w * 0.80, h * 0.88);
  g.closePath();
  g.fill();

  // 瀑布细竖水纹线
  g.strokeStyle = "rgba(255, 255, 255, 0.62)";
  g.lineWidth = 1.4;
  for (let i = 0; i < 11; i++) {
    const lx = w * (0.56 + i * 0.038);
    const topY = i < 7 ? ry + h * 0.04 + (i % 2) * 8 : h * 0.41 + (i % 3) * 6;
    g.beginPath();
    g.moveTo(lx, topY);
    g.quadraticCurveTo(lx + 4, (topY + h * 0.86) * 0.5, lx + 2, h * 0.86);
    g.stroke();
  }

  // 底部水潭与青灰近石
  g.fillStyle = "rgba(92, 146, 166, 0.24)";
  const rocksFront = [
    [w * 0.56, h * 0.88, w * 0.055],
    [w * 0.61, h * 0.90, w * 0.042],
    [w * 0.91, h * 0.88, w * 0.06],
    [w * 0.97, h * 0.91, w * 0.048],
  ];
  for (const [cx, cy, rad] of rocksFront) {
    g.beginPath();
    g.arc(cx, cy, rad, Math.PI, 0);
    g.closePath();
    g.fill();
  }

  // 底部淡白水雾层
  const mist = g.createLinearGradient(0, h * 0.80, 0, h);
  mist.addColorStop(0, "rgba(237, 244, 247, 0)");
  mist.addColorStop(0.55, "rgba(237, 244, 247, 0.72)");
  mist.addColorStop(1, "rgba(237, 244, 247, 0.96)");
  g.fillStyle = mist;
  g.fillRect(0, h * 0.80, w, h * 0.20);

  // 原海报右上方长虚线引导弧
  g.save();
  g.strokeStyle = "rgba(13, 148, 143, 0.46)";
  g.lineWidth = 1.4;
  g.setLineDash([4, 4]);
  g.beginPath();
  g.moveTo(w * 0.56, h * 0.08);
  g.bezierCurveTo(w * 0.72, h * 0.06, w * 0.72, h * 0.22, w * 0.84, h * 0.26);
  g.stroke();
  g.setLineDash([]);
  g.beginPath();
  g.moveTo(w * 0.825, h * 0.238);
  g.lineTo(w * 0.845, h * 0.263);
  g.lineTo(w * 0.818, h * 0.273);
  g.stroke();
  g.restore();

  bgCache = c;
  return c;
}

// 绘制单张原海报风级联白卡
function drawCascadeCard(ctx, card, rect, opts = {}) {
  const { x, y, w, h } = rect;
  const r = clamp(w * 0.095, 6, 14);
  const lift = opts.selected ? -4 : opts.hover ? -2 : 0;
  const cy = y + lift;

  ctx.save();

  // 轻量双层软影（避开高开销 shadowBlur，软件渲染同样 60fps）
  rrect(ctx, x + 2, cy + 7, w, h, r);
  ctx.fillStyle = "rgba(6, 24, 56, 0.075)";
  ctx.fill();
  rrect(ctx, x + 1, cy + 3, w, h, r);
  ctx.fillStyle = "rgba(6, 24, 56, 0.055)";
  ctx.fill();

  // 卡片白底
  rrect(ctx, x, cy, w, h, r);
  ctx.fillStyle = "#FDFDFB";
  ctx.fill();

  // 裁切内部：绘制原海报右下双层波浪装饰角 + 圆点 + 左侧色条
  ctx.save();
  ctx.clip();

  // 左上侧色条（贴合 060 原海报卡片细条）
  const stripeW = Math.max(3, w * 0.028);
  ctx.fillStyle = card.color;
  ctx.fillRect(x, cy + h * 0.07, stripeW, h * 0.26);

  // 右下波浪装饰（两层柔弧，专门用来承接下一张卡的左上咬边）
  ctx.beginPath();
  ctx.moveTo(x + w * 0.34, cy + h);
  ctx.bezierCurveTo(
    x + w * 0.44, cy + h * 0.72,
    x + w * 0.72, cy + h * 0.62,
    x + w, cy + h * 0.64
  );
  ctx.lineTo(x + w, cy + h);
  ctx.closePath();
  ctx.fillStyle = card.waveDark;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + w * 0.56, cy + h);
  ctx.bezierCurveTo(
    x + w * 0.66, cy + h * 0.79,
    x + w * 0.84, cy + h * 0.74,
    x + w, cy + h * 0.76
  );
  ctx.lineTo(x + w, cy + h);
  ctx.closePath();
  ctx.fillStyle = card.waveLight;
  ctx.fill();

  // 右中色点（060 原海报标志元素）
  const dotR = clamp(w * 0.076, 4.5, 12);
  ctx.beginPath();
  ctx.arc(x + w * 0.82, cy + h * 0.42, dotR, 0, Math.PI * 2);
  ctx.fillStyle = card.color;
  ctx.fill();

  // 左上阅读安全区微弱辅助角标（仅当宽幅足够或被遮挡时可见）
  if (opts.occluded) {
    ctx.fillStyle = "rgba(240, 94, 64, 0.09)";
    ctx.fillRect(x + w * 0.07, cy + h * 0.06, w * 0.56, h * 0.50);
  }

  // 文字排版（随卡片像素宽自适应，手机端只显号+两字标题，绝不溢出）
  const padX = Math.max(8, w * 0.10);
  const numSize = clamp(w * 0.155, 13, 23);
  const zhSize = clamp(w * 0.135, 12, 19);

  ctx.textBaseline = "top";
  const numY = cy + h * 0.08;
  ctx.fillStyle = card.textColor;
  ctx.font = `800 ${numSize.toFixed(1)}px "Sora", sans-serif`;
  ctx.fillText(card.num, x + padX, numY);

  const zhY = numY + numSize * 1.18;
  ctx.fillStyle = "#061838";
  ctx.font = `700 ${zhSize.toFixed(1)}px "Noto Sans SC", sans-serif`;
  ctx.fillText(card.title, x + padX, zhY);

  let nextY = zhY + zhSize * 1.25;
  if (w >= 104) {
    const enSize = clamp(w * 0.064, 9.5, 11);
    ctx.fillStyle = card.textColor;
    ctx.font = `600 ${enSize.toFixed(1)}px "Sora", sans-serif`;
    ctx.fillText(card.en, x + padX, nextY);
    nextY += enSize * 1.65;
  }

  if (w >= 122) {
    const bodySize = clamp(w * 0.078, 11, 13);
    ctx.fillStyle = "#1A2D46";
    ctx.font = `400 ${bodySize.toFixed(1)}px "Noto Sans SC", sans-serif`;
    const parts = card.body.split("，");
    const baseY = Math.max(cy + h * 0.49, nextY + 3);
    ctx.fillText(parts[0] + "，", x + padX, baseY);
    if (parts[1]) {
      ctx.fillText(parts[1], x + padX, baseY + bodySize * 1.42);
    }
  }

  ctx.restore();

  // 外框描边
  rrect(ctx, x, cy, w, h, r);
  ctx.lineWidth = opts.selected ? 2.5 : opts.hover ? 1.8 : 1.1;
  ctx.strokeStyle = opts.selected ? "#F05E40" : opts.hover ? "#061838" : "#C9DCE7";
  ctx.stroke();

  ctx.restore();
}

// 绘制 01→02→03→04→05 视流虚线跃迁弧 + 成立时的瀑布光珠
function drawNarrativePaths(ctx, evalRes, rectByCardId, t, still) {
  const { hops, passedCount } = evalRes;
  const allGood = passedCount === 4;

  // 若全部成立，计算沿着 4 段弧均匀滑落的水珠位置
  const totalSegs = 4;
  const flowPhase = still ? -1 : (t * 0.55) % totalSegs;

  for (let i = 0; i < hops.length; i++) {
    const hop = hops[i];
    const rA = rectByCardId[hop.fromId];
    const rB = rectByCardId[hop.toId];
    if (!rA || !rB) continue;

    let sx, sy, ex, ey, cpx, cpy;
    if (hop.isBack) {
      // 折返打结：醒目的珊瑚色高抛回头弧
      sx = rA.x + rA.w * 0.45;
      sy = rA.y + 4;
      ex = rB.x + rB.w * 0.55;
      ey = rB.y + 4;
      cpx = (sx + ex) * 0.5;
      cpy = Math.min(sy, ey) - Math.max(36, rA.h * 0.36);
    } else if (hop.isSkip) {
      // 跳槽前进：越过中间卡的长弧
      sx = rA.x + rA.w * 0.72;
      sy = rA.y + 8;
      ex = rB.x + rB.w * 0.35;
      ey = rB.y + 4;
      cpx = (sx + ex) * 0.5 + 16;
      cpy = Math.min(sy, ey) - Math.max(24, rA.h * 0.24);
    } else {
      // 原海报标准相邻跃迁小弧：从前卡右上角轻跃到后卡顶沿
      sx = rA.x + rA.w + 2;
      sy = rA.y + rA.h * 0.32;
      ex = rB.x + rB.w * 0.52;
      ey = rB.y - 4;
      cpx = Math.max(sx + 18, ex + 8);
      cpy = Math.min(sy - 12, ey - 18);
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(cpx, cpy, ex, ey);
    ctx.strokeStyle = hop.isBack
      ? "#C1391E"
      : hop.isSkip
        ? "#D05A3B"
        : allGood
          ? "#076B68"
          : "rgba(13, 148, 143, 0.72)";
    ctx.lineWidth = hop.isBack ? 2.2 : allGood ? 2.0 : 1.5;
    ctx.setLineDash(hop.isBack ? [5, 3] : [4, 3.5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 箭头切线方向
    const ang = Math.atan2(ey - cpy, ex - cpx);
    const aLen = hop.isBack ? 7.5 : 6;
    ctx.beginPath();
    ctx.moveTo(ex - aLen * Math.cos(ang - 0.5), ey - aLen * Math.sin(ang - 0.5));
    ctx.lineTo(ex, ey);
    ctx.lineTo(ex - aLen * Math.cos(ang + 0.5), ey - aLen * Math.sin(ang + 0.5));
    ctx.strokeStyle = hop.isBack ? "#C1391E" : allGood ? "#076B68" : "#0D948F";
    ctx.lineWidth = hop.isBack ? 2.1 : 1.7;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // 折返标注胶囊
    if (hop.isBack) {
      const mx = 0.25 * sx + 0.5 * cpx + 0.25 * ex;
      const my = 0.25 * sy + 0.5 * cpy + 0.25 * ey;
      const bw = 42;
      const bh = 18;
      rrect(ctx, mx - bw * 0.5, my - bh * 0.5, bw, bh, 9);
      ctx.fillStyle = "#C1391E";
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = '700 10.5px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("折返", mx, my + 0.5);
    }

    // 全达标水珠沿弧轻跃
    if (allGood && flowPhase >= i && flowPhase < i + 1) {
      const u = flowPhase - i;
      const mu = 1 - u;
      const bx = mu * mu * sx + 2 * mu * u * cpx + u * u * ex;
      const by = mu * mu * sy + 2 * mu * u * cpy + u * u * ey;
      ctx.beginPath();
      ctx.arc(bx, by, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(13, 148, 143, 0.28)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx, by, 3.6, 0, Math.PI * 2);
      ctx.fillStyle = i === 3 ? "#F05E40" : "#0D948F";
      ctx.fill();
    }

    ctx.restore();
  }
}

// 获取或生成单张卡片的离屏贴图（按卡片 ID + 状态缓存，尺寸变化超过 4px 才重建，拖动时零重建）
function getCardSprite(card, w, h, dpr, selected, hover, occluded) {
  const key = `${card.id}@${dpr}|${selected ? 1 : 0}${hover ? 1 : 0}${occluded ? 1 : 0}`;
  let entry = cardSpriteCache.get(key);
  if (entry && Math.abs(entry.rw - w) <= 4 && Math.abs(entry.rh - h) <= 4) {
    return entry;
  }
  const rw = Math.max(24, Math.round(w));
  const rh = Math.max(28, Math.round(h));
  const cw = rw + SPRITE_PAD * 2;
  const ch = rh + SPRITE_PAD * 2;
  const c = document.createElement("canvas");
  c.width = Math.round(cw * dpr);
  c.height = Math.round(ch * dpr);
  const g = c.getContext("2d");
  g.scale(dpr, dpr);
  drawCascadeCard(g, card, { x: SPRITE_PAD, y: SPRITE_PAD, w: rw, h: rh }, { selected, hover, occluded });
  entry = { canvas: c, rw, rh, cw, ch };
  cardSpriteCache.set(key, entry);
  return entry;
}

// 渲染完整一帧开场瀑布画布
function renderHero(t, dt, { still }) {
  if (!heroW || !heroH) return;
  if (pendingDomSync) {
    pendingDomSync = false;
    flushDragDom();
  }
  const ctx = hctx;
  ctx.save();
  ctx.setTransform(heroDpr, 0, 0, heroDpr, 0, 0);

  // 1. 静态水墨瀑布背景缓存
  const bg = ensureBgCache(heroW, heroH, heroDpr);
  ctx.drawImage(bg, 0, 0, heroW, heroH);

  // 2. 轻柔动态落水丝线（单条 path 合并提交，极低绘制开销）
  const flowShift = still ? 0 : (t * 28) % 32;
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = 1.3;
  ctx.setLineDash([12, 20]);
  ctx.lineDashOffset = -flowShift;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const lx = heroW * (0.60 + i * 0.08);
    const y0 = i < 3 ? heroH * 0.30 : heroH * 0.44;
    ctx.moveTo(lx, y0);
    ctx.lineTo(lx + 2, heroH * 0.85);
  }
  ctx.stroke();
  ctx.restore();

  // 3. 计算目标投影并做阻尼插值
  const pad = heroW < 420 ? { l: 14, r: 14, t: 26, b: 18 } : { l: 28, r: 28, t: 36, b: 22 };
  const proj = projectSlotsToCanvas(lastEval, heroW, heroH, pad);
  lastProj = proj;

  const k = still || !dt || railDragging ? 1 : 1 - Math.exp(-dt * 16);
  const rectByCardId = {};
  const slotRects = [];

  for (const s of proj.pxSlots) {
    const a = animCards[s.cardId];
    if (!a.ready || still) {
      a.x = s.px.x;
      a.y = s.px.y;
      a.w = s.px.w;
      a.h = s.px.h;
      a.ready = true;
    } else {
      a.x += (s.px.x - a.x) * k;
      a.y += (s.px.y - a.y) * k;
      a.w += (s.px.w - a.w) * k;
      a.h += (s.px.h - a.h) * k;
    }
    const r = { x: a.x, y: a.y, w: a.w, h: a.h };
    rectByCardId[s.cardId] = r;
    slotRects.push({ slot: s, rect: r });
  }

  // 4. 若处于断链散开状态，在相邻空缝合并画出红标提示
  if (lastEval.overlapPct < EMPIRICAL.overlapMin) {
    ctx.save();
    ctx.strokeStyle = "#C1391E";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < proj.pxSlots.length - 1; i++) {
      const a = rectByCardId[proj.pxSlots[i].cardId];
      const b = rectByCardId[proj.pxSlots[i + 1].cardId];
      const gx0 = a.x + a.w;
      const gx1 = b.x;
      if (gx1 - gx0 > 3) {
        const gy = (a.y + a.h * 0.55 + b.y + b.h * 0.35) * 0.5;
        ctx.moveTo(gx0 + 1, gy - 5);
        ctx.lineTo(gx0 + 1, gy + 5);
        ctx.moveTo(gx0 + 1, gy);
        ctx.lineTo(gx1 - 1, gy);
        ctx.moveTo(gx1 - 1, gy - 5);
        ctx.lineTo(gx1 - 1, gy + 5);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  // 5. 按真实 Z 序从后往前贴出 5 张离屏缓存卡片贴图（仅 5 次 drawImage）
  const occludedIds = new Set(lastEval.occlusions.map((o) => o.cardId));
  const sorted = [...slotRects].sort((a, b) => a.slot.z - b.slot.z);

  for (const item of sorted) {
    const isDragged = cardDrag.active && cardDrag.moved && cardDrag.fromSlot === item.slot.slotIndex;
    const dx = isDragged ? cardDrag.curX - cardDrag.startX : 0;
    const dy = isDragged ? cardDrag.curY - cardDrag.startY : 0;
    const sp = getCardSprite(
      item.slot.card,
      item.rect.w,
      item.rect.h,
      heroDpr,
      state.selectedSlot === item.slot.slotIndex || isDragged,
      state.hoverSlot === item.slot.slotIndex,
      occludedIds.has(item.slot.cardId)
    );
    const sx = item.rect.w / sp.rw;
    const sy = item.rect.h / sp.rh;
    ctx.drawImage(
      sp.canvas,
      item.rect.x + dx - SPRITE_PAD * sx,
      item.rect.y + dy - SPRITE_PAD * sy,
      sp.cw * sx,
      sp.ch * sy
    );
  }

  // 6. 画出真实的标题安全区遮挡红框（从同一几何模型投影）
  if (proj.pxOcclusions.length) {
    ctx.save();
    ctx.fillStyle = "rgba(240, 94, 64, 0.28)";
    ctx.strokeStyle = "#C1391E";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2.5]);
    for (const occ of proj.pxOcclusions) {
      for (const box of occ.boxesPx) {
        if (box.w < 3 || box.h < 3) continue;
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.strokeRect(box.x, box.y, box.w, box.h);
      }
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 7. 画出 01→02→03→04→05 叙事视流弧
  drawNarrativePaths(ctx, lastEval, rectByCardId, t, still);

  ctx.restore();
}

const heroLoop = loop(heroWrap, renderHero);

function resizeHero() {
  const r = heroWrap.getBoundingClientRect();
  heroW = Math.max(120, Math.round(r.width));
  heroH = Math.max(120, Math.round(r.height));
  heroDpr = getDpr();
  heroCanvas.width = Math.round(heroW * heroDpr);
  heroCanvas.height = Math.round(heroH * heroDpr);
  heroLoop.draw();
}
new ResizeObserver(resizeHero).observe(heroWrap);

// =========================================================================
// HERO DOM 读数、圆徽与控制台同步（全部源自 model.js 同一计算结果）
// =========================================================================
const slotBar = $("slot-bar");
const spreadBar = $("spread-bar");
const spreadThumb = $("spread-thumb");
const railSweet = $("rail-sweet");

function renderSlotBar() {
  slotBar.innerHTML = "";
  state.order.forEach((cardId, slotIdx) => {
    const card = CARDS[cardId];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot-btn";
    if (state.selectedSlot === slotIdx) btn.classList.add("is-selected");
    if (cardId === slotIdx) btn.classList.add("is-ok-pos");
    btn.dataset.slot = String(slotIdx);
    btn.setAttribute(
      "aria-label",
      `第 ${slotIdx + 1} 槽：${card.num} ${card.title}。点击选中后点另一槽互换，或按左右方向键移位`
    );
    btn.setAttribute("aria-pressed", String(state.selectedSlot === slotIdx));
    btn.innerHTML = `<span class="slot-dot" style="background:${card.color}" aria-hidden="true"></span><span class="slot-num" lang="en">${card.num}</span><span class="slot-zh">${card.title}</span>`;

    btn.addEventListener("click", () => handleSlotPick(slotIdx));
    btn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" && slotIdx > 0) {
        e.preventDefault();
        swapSlots(slotIdx, slotIdx - 1);
        slotBar.children[slotIdx - 1]?.focus();
      } else if (e.key === "ArrowRight" && slotIdx < 4) {
        e.preventDefault();
        swapSlots(slotIdx, slotIdx + 1);
        slotBar.children[slotIdx + 1]?.focus();
      }
    });
    slotBar.appendChild(btn);
  });
}

function swapSlots(i, j) {
  if (i === j || i < 0 || j < 0 || i > 4 || j > 4) return;
  const tmp = state.order[i];
  state.order[i] = state.order[j];
  state.order[j] = tmp;
  state.selectedSlot = null;
  syncHero();
}

function handleSlotPick(slotIdx) {
  if (state.selectedSlot === null) {
    state.selectedSlot = slotIdx;
    syncHero();
  } else if (state.selectedSlot === slotIdx) {
    state.selectedSlot = null;
    syncHero();
  } else {
    swapSlots(state.selectedSlot, slotIdx);
  }
}

function syncHero() {
  lastEval = evaluateCascade(state);
  const res = lastEval;

  // 1. 诊断框
  const diagBox = $("diag-box");
  diagBox.dataset.status = res.status;
  $("diag-pill").textContent = res.badge;
  $("diag-score").textContent = `${res.passedCount} / 4`;
  $("diag-headline").textContent = res.headline;
  $("diag-explain").textContent = res.explain;

  $("m-overlap").textContent = `${Math.round(res.overlapPct)}%`;
  $("m-occ").textContent = `${Math.round(res.maxTitleOccPct)}%`;
  $("m-slope").textContent = `${Math.round(res.slopeDeg)}°`;
  $("m-back").textContent = `${res.backtrackCount} 处`;

  // 2. 四枚原海报圆徽实时达标灯
  document.querySelectorAll("#status-badges .sbadge").forEach((el) => {
    const key = el.dataset.key;
    el.classList.toggle("is-pass", !!res.passes[key]);
  });

  // 3. 舞台顶条说明
  const zText = state.zDir === "forward" ? "后压前" : "前压后";
  const sText = SLOPES[state.slope]?.label || "斜瀑";
  $("stage-tag").textContent = `当前：${zText} · ${sText}`;
  if (state.selectedSlot !== null) {
    const c = CARDS[state.order[state.selectedSlot]];
    $("stage-tip").textContent = `已选中 ${c.num} ${c.title}，再点另一张卡即可互换位置`;
  } else {
    $("stage-tip").textContent = "点画布上两张卡互换顺序 · 拖底沿步距轨调压边";
  }

  // 4. 按钮高亮状态
  document.querySelectorAll("#zdir-btns .seg-btn").forEach((b) => {
    const active = b.dataset.zdir === state.zDir;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll("#slope-btns .seg-btn").forEach((b) => {
    const active = b.dataset.slope === state.slope;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });

  // 5. 步距轨游标与甜区色带（完全由同一几何模型算出）
  const sweet = sweetSpreadRange(state.slope);
  railSweet.style.left = `${(sweet.lo * 100).toFixed(1)}%`;
  railSweet.style.width = `${Math.max(8, (sweet.hi - sweet.lo) * 100).toFixed(1)}%`;

  const pct = clamp(state.spread, 0, 1) * 100;
  spreadThumb.style.left = `${pct.toFixed(1)}%`;
  spreadThumb.setAttribute("aria-valuenow", String(Math.round(pct)));
  $("track-val").textContent = `交叠 ${Math.round(res.overlapPct)}%（经验甜区 ${EMPIRICAL.overlapMin}–${EMPIRICAL.overlapMax}%）`;

  renderSlotBar();
  heroLoop.draw();
}

// 绑定叠压朝向、坡度与重置
document.querySelectorAll("#zdir-btns .seg-btn").forEach((b) => {
  b.addEventListener("click", () => {
    state.zDir = b.dataset.zdir;
    syncHero();
  });
});
document.querySelectorAll("#slope-btns .seg-btn").forEach((b) => {
  b.addEventListener("click", () => {
    state.slope = b.dataset.slope;
    syncHero();
  });
});
$("btn-reset").addEventListener("click", () => {
  state.order = [...INITIAL_BROKEN.order];
  state.spread = INITIAL_BROKEN.spread;
  state.zDir = INITIAL_BROKEN.zDir;
  state.slope = INITIAL_BROKEN.slope;
  state.selectedSlot = null;
  syncHero();
});

// 步距游标拖动（rAF 合帧更新 DOM 与画布，杜绝单帧双绘，保障软渲染高帧率）
function spreadFromClientX(clientX) {
  const r = spreadBar.getBoundingClientRect();
  return clamp((clientX - r.left) / Math.max(1, r.width), 0, 1);
}
function flushDragDom() {
  const res = lastEval;
  const pct = state.spread * 100;
  spreadThumb.style.left = `${pct.toFixed(1)}%`;
  const ov = Math.round(res.overlapPct);
  const oc = Math.round(res.maxTitleOccPct);
  const sl = Math.round(res.slopeDeg);
  const sig = `${Math.round(pct)}|${ov}|${oc}|${sl}|${res.badge}|${res.passedCount}`;
  if (sig === lastDomSig) return;
  lastDomSig = sig;
  spreadThumb.setAttribute("aria-valuenow", String(Math.round(pct)));
  $("track-val").textContent = `交叠 ${ov}%（经验甜区 ${EMPIRICAL.overlapMin}–${EMPIRICAL.overlapMax}%）`;
  $("diag-box").dataset.status = res.status;
  $("diag-pill").textContent = res.badge;
  $("diag-score").textContent = `${res.passedCount} / 4`;
  $("diag-headline").textContent = res.headline;
  $("diag-explain").textContent = res.explain;
  $("m-overlap").textContent = `${ov}%`;
  $("m-occ").textContent = `${oc}%`;
  $("m-slope").textContent = `${sl}°`;
  $("m-back").textContent = `${res.backtrackCount} 处`;
  document.querySelectorAll("#status-badges .sbadge").forEach((el) => {
    el.classList.toggle("is-pass", !!res.passes[el.dataset.key]);
  });
}
function applySpread(v) {
  state.spread = clamp(v, 0, 1);
  lastEval = evaluateCascade(state);
  pendingDomSync = true;
  if (reducedMotion.matches) {
    pendingDomSync = false;
    flushDragDom();
    heroLoop.draw();
  }
}

spreadThumb.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  railDragging = true;
  if (spreadThumb.setPointerCapture) {
    try { spreadThumb.setPointerCapture(e.pointerId); } catch {}
  }
  spreadThumb.focus({ preventScroll: true });
});
spreadThumb.addEventListener("pointermove", (e) => {
  if (!railDragging) return;
  applySpread(spreadFromClientX(e.clientX));
});
const stopRailDrag = () => {
  if (!railDragging) return;
  railDragging = false;
  syncHero();
};
spreadThumb.addEventListener("pointerup", stopRailDrag);
spreadThumb.addEventListener("pointercancel", stopRailDrag);

// 兼容原生触摸事件（确保 CDP dispatchTouchEvent 100% 驱动）
spreadThumb.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  e.preventDefault();
  railDragging = true;
}, { passive: false });
spreadThumb.addEventListener("touchmove", (e) => {
  if (!railDragging || !e.touches.length) return;
  e.preventDefault();
  applySpread(spreadFromClientX(e.touches[0].clientX));
}, { passive: false });
spreadThumb.addEventListener("touchend", stopRailDrag);

spreadBar.addEventListener("pointerdown", (e) => {
  if (e.target === spreadThumb || spreadThumb.contains(e.target)) return;
  applySpread(spreadFromClientX(e.clientX));
  railDragging = true;
  if (spreadBar.setPointerCapture) {
    try { spreadBar.setPointerCapture(e.pointerId); } catch {}
  }
});
spreadBar.addEventListener("pointermove", (e) => {
  if (!railDragging) return;
  applySpread(spreadFromClientX(e.clientX));
});
spreadBar.addEventListener("pointerup", stopRailDrag);
spreadBar.addEventListener("pointercancel", stopRailDrag);

spreadThumb.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.01 : 0.03;
  if (e.key === "ArrowLeft") { e.preventDefault(); applySpread(state.spread - step); flushDragDom(); }
  else if (e.key === "ArrowRight") { e.preventDefault(); applySpread(state.spread + step); flushDragDom(); }
  else if (e.key === "PageDown") { e.preventDefault(); applySpread(state.spread - 0.1); flushDragDom(); }
  else if (e.key === "PageUp") { e.preventDefault(); applySpread(state.spread + 0.1); flushDragDom(); }
});

// 画布点击 & 拖拽换位（按真实 Z 序从顶层往下命中）
function hitTestSlot(clientX, clientY) {
  if (!lastProj) return -1;
  const r = heroCanvas.getBoundingClientRect();
  const x = clientX - r.left;
  const y = clientY - r.top;
  const topDown = [...lastProj.pxSlots].sort((a, b) => b.z - a.z);
  for (const s of topDown) {
    const a = animCards[s.cardId];
    if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) {
      return s.slotIndex;
    }
  }
  return -1;
}

heroCanvas.addEventListener("pointerdown", (e) => {
  const hit = hitTestSlot(e.clientX, e.clientY);
  if (hit < 0) {
    if (state.selectedSlot !== null) {
      state.selectedSlot = null;
      syncHero();
    }
    return;
  }
  cardDrag.active = true;
  cardDrag.pointerId = e.pointerId;
  cardDrag.fromSlot = hit;
  cardDrag.startX = e.clientX;
  cardDrag.startY = e.clientY;
  cardDrag.curX = e.clientX;
  cardDrag.curY = e.clientY;
  cardDrag.moved = false;
  if (e.pointerType === "mouse" && heroCanvas.setPointerCapture) {
    try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
  }
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (cardDrag.active) {
    const dx = e.clientX - cardDrag.startX;
    const dy = e.clientY - cardDrag.startY;
    if (!cardDrag.moved && Math.hypot(dx, dy) > 10) {
      // 触屏竖滑时让给页面滚动
      if (e.pointerType === "touch" && Math.abs(dy) > Math.abs(dx) * 1.3) {
        cardDrag.active = false;
        return;
      }
      cardDrag.moved = true;
    }
    if (cardDrag.moved) {
      cardDrag.curX = e.clientX;
      cardDrag.curY = e.clientY;
      heroLoop.draw();
    }
    return;
  }
  const hit = hitTestSlot(e.clientX, e.clientY);
  if (hit !== state.hoverSlot) {
    state.hoverSlot = hit;
    heroCanvas.style.cursor = hit >= 0 ? "grab" : "default";
    heroLoop.draw();
  }
});

const finishCardPointer = (e) => {
  if (!cardDrag.active) return;
  const from = cardDrag.fromSlot;
  const moved = cardDrag.moved;
  cardDrag.active = false;
  cardDrag.moved = false;
  if (moved) {
    const drop = hitTestSlot(e.clientX, e.clientY);
    if (drop >= 0 && drop !== from) {
      swapSlots(from, drop);
      return;
    }
    heroLoop.draw();
  } else {
    handleSlotPick(from);
  }
};
heroCanvas.addEventListener("pointerup", finishCardPointer);
heroCanvas.addEventListener("pointercancel", () => {
  cardDrag.active = false;
  cardDrag.moved = false;
  heroLoop.draw();
});
heroCanvas.addEventListener("pointerleave", () => {
  if (!cardDrag.active && state.hoverSlot !== null) {
    state.hoverSlot = null;
    heroLoop.draw();
  }
});

// =========================================================================
// 01 节：五幕点击解剖台
// =========================================================================
const ACT_DETAILS = [
  {
    kicker: "第 01 幕解剖 · 青绿起点",
    prevNum: "视流入口",
    prevTxt: "左上首要视觉区",
    nextNum: "02 展开",
    nextTxt: "后卡压住 01 的右下波浪角",
    hopLabel: "交棒给 02",
    caption: "原海报刻意把编号和文字放在卡片左上角，把色块波浪和圆点放在右下角：下一张卡压住右下装饰区时，既把五幕粘成连贯瀑布，又不会遮掉半个字。",
    isEnd: false,
  },
  {
    kicker: "第 02 幕解剖 · 钴蓝接力",
    prevNum: "01 引入",
    prevTxt: "青绿底角被 02 稳压",
    nextNum: "03 深化",
    nextTxt: "换回青绿继续向下顺流",
    hopLabel: "交棒给 03",
    caption: "从青绿跳到钴蓝，靠色相变化告诉眼睛「进入下一段了」；但同样的卡片比例、字号与波浪位置又保持了同一套家族语言。",
    isEnd: false,
  },
  {
    kicker: "第 03 幕解剖 · 青绿中腰",
    prevNum: "02 展开",
    prevTxt: "承接中段展开内容",
    nextNum: "04 过渡",
    nextTxt: "顺势下探进入收束准备",
    hopLabel: "交棒给 04",
    caption: "03 位于整条对角瀑布的几何中心，既要稳稳接住 02 展开的细节，又把斜流角度锁稳，防止后半程越走越散。",
    isEnd: false,
  },
  {
    kicker: "第 04 幕解剖 · 钴蓝蓄势",
    prevNum: "03 深化",
    prevTxt: "把深入细节收拢归队",
    nextNum: "05 总结",
    nextTxt: "准备交给暖珊瑚橘收口",
    hopLabel: "交棒给 05",
    caption: "前四幕刻意保持青—蓝—青—蓝的冷静节拍，就是为了替最后一幕的珊瑚橘留出最大反差，避免中段提前抢戏。",
    isEnd: false,
  },
  {
    kicker: "第 05 幕解剖 · 珊瑚收束",
    prevNum: "04 过渡",
    prevTxt: "冷色铺垫在此收官",
    nextNum: "视觉落点",
    nextTxt: "最前端完整展露，不再被压",
    hopLabel: "稳停潭底",
    caption: "第 05 幕既是 Z 序最顶层，又是唯一一块高饱和暖珊瑚橘，整张卡片 100% 完整露面——倾泻了一路的视线终于有地方安稳停住。",
    isEnd: true,
  },
];

function selectAct(idx) {
  const card = CARDS[idx];
  const info = ACT_DETAILS[idx];
  document.querySelectorAll("#act-list .act-card").forEach((b) => {
    const active = Number(b.dataset.act) === idx;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  $("ana-kicker").textContent = info.kicker;
  $("ana-stripe").setAttribute("fill", card.color);
  $("ana-wave-1").setAttribute("fill", card.waveDark);
  $("ana-wave-2").setAttribute("fill", card.waveLight);
  $("ana-dot").setAttribute("fill", card.color);
  $("ana-num").textContent = card.num;
  $("ana-num").setAttribute("fill", card.textColor);
  $("ana-zh").textContent = card.title;
  $("ana-en").textContent = card.en;
  $("ana-en").setAttribute("fill", card.textColor);
  $("ana-body").textContent = card.body;

  $("ana-prev-num").textContent = info.prevNum;
  $("ana-prev-txt").textContent = info.prevTxt;
  $("ana-next-num").textContent = info.nextNum;
  $("ana-next-txt").textContent = info.nextTxt;
  $("ana-hop-label").textContent = info.hopLabel;
  $("ana-caption").textContent = info.caption;

  const nextStroke = info.isEnd ? "#F05E40" : CARDS[idx + 1].color;
  const nextRect = $("ana-next").querySelector("rect");
  nextRect.setAttribute("stroke", nextStroke);
  $("ana-next-num").setAttribute("fill", info.isEnd ? "#C1391E" : CARDS[idx + 1].textColor);
}

document.querySelectorAll("#act-list .act-card").forEach((b) => {
  b.addEventListener("click", () => selectAct(Number(b.dataset.act)));
});

// =========================================================================
// 02 节：二维 Δx × Δy 步距矩阵坐标板 + 实时验算画布
// =========================================================================
const matPad = $("matrix-pad");
const matPadCanvas = $("matrix-pad-canvas");
const matDot = $("matrix-dot");
const matPreview = $("matrix-preview");
const mpCtx = matPreview.getContext("2d");

const MAT_RANGE = { xMin: 0.30, xMax: 1.12, yMin: 0.04, yMax: 0.72 };
const MAT_PRESETS = {
  tight: { stepX: 0.44, stepY: 0.22 },
  sweet: { stepX: 0.71, stepY: 0.36 },
  loose: { stepX: 1.04, stepY: 0.46 },
  flat:  { stepX: 0.78, stepY: 0.08 },
};
const matState = { ...MAT_PRESETS.sweet };

function drawMatrixPadBg() {
  const r = matPad.getBoundingClientRect();
  const w = Math.max(120, Math.round(r.width));
  const h = Math.max(90, Math.round(r.height));
  const dpr = getDpr();
  matPadCanvas.width = Math.round(w * dpr);
  matPadCanvas.height = Math.round(h * dpr);
  const g = matPadCanvas.getContext("2d");
  g.scale(dpr, dpr);

  g.fillStyle = "#F7FAFC";
  g.fillRect(0, 0, w, h);

  // 逐格实算安全走廊（直接调用 evaluateCascade，零硬编码边界）
  const cols = 42;
  const rows = 32;
  const cw = w / cols;
  const ch = h / rows;
  for (let c = 0; c < cols; c++) {
    const sx = MAT_RANGE.xMin + ((c + 0.5) / cols) * (MAT_RANGE.xMax - MAT_RANGE.xMin);
    for (let row = 0; row < rows; row++) {
      const sy = MAT_RANGE.yMin + ((row + 0.5) / rows) * (MAT_RANGE.yMax - MAT_RANGE.yMin);
      const ev = evaluateCascade({ order: [0, 1, 2, 3, 4], stepX: sx, stepY: sy, zDir: "forward" });
      if (ev.passes.continuity && ev.passes.rhythm) {
        g.fillStyle = "rgba(13, 148, 143, 0.24)";
      } else if (ev.maxTitleOccPct > EMPIRICAL.titleOccLimit || ev.overlapPct > EMPIRICAL.overlapMax) {
        g.fillStyle = "rgba(240, 94, 64, 0.14)";
      } else if (ev.overlapPct < EMPIRICAL.overlapMin) {
        g.fillStyle = "rgba(17, 78, 206, 0.08)";
      } else {
        g.fillStyle = "rgba(64, 86, 110, 0.06)";
      }
      g.fillRect(c * cw, row * ch, cw + 0.5, ch + 0.5);
    }
  }

  // 淡网格线
  g.strokeStyle = "rgba(148, 180, 198, 0.32)";
  g.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    g.beginPath();
    g.moveTo((w * i) / 4, 0);
    g.lineTo((w * i) / 4, h);
    g.moveTo(0, (h * i) / 4);
    g.lineTo(w, (h * i) / 4);
    g.stroke();
  }

  // 区域语义标注
  g.font = '700 11px "Noto Sans SC", sans-serif';
  g.fillStyle = "#C1391E";
  g.fillText("过紧压字", 10, 20);
  g.fillStyle = "#076B68";
  g.fillText("经验安全走廊", w * 0.42, h * 0.72);
  g.fillStyle = "#0D41B2";
  g.fillText("断链散开", w - 58, h - 12);
  g.fillStyle = "#40566E";
  g.fillText("横平无落", w * 0.58, 20);
}

function drawMatrixPreview() {
  const wrap = matPreview.parentElement;
  const r = wrap.getBoundingClientRect();
  const w = Math.max(160, Math.round(r.width));
  const h = Math.max(160, Math.round(r.height));
  const dpr = getDpr();
  if (matPreview.width !== Math.round(w * dpr) || matPreview.height !== Math.round(h * dpr)) {
    matPreview.width = Math.round(w * dpr);
    matPreview.height = Math.round(h * dpr);
  }
  mpCtx.save();
  mpCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  mpCtx.fillStyle = "#EDF5F9";
  mpCtx.fillRect(0, 0, w, h);

  const ev = evaluateCascade({
    order: [0, 1, 2, 3, 4],
    stepX: matState.stepX,
    stepY: matState.stepY,
    zDir: "forward",
  });
  const proj = projectSlotsToCanvas(ev, w, h, { l: 18, r: 18, t: 22, b: 18 });

  const occluded = new Set(ev.occlusions.map((o) => o.cardId));
  for (const s of proj.pxSlots) {
    drawCascadeCard(mpCtx, s.card, s.px, { occluded: occluded.has(s.cardId) });
  }
  for (const occ of proj.pxOcclusions) {
    for (const box of occ.boxesPx) {
      if (box.w < 2 || box.h < 2) continue;
      mpCtx.fillStyle = "rgba(240, 94, 64, 0.34)";
      mpCtx.fillRect(box.x, box.y, box.w, box.h);
      mpCtx.strokeStyle = "#C1391E";
      mpCtx.lineWidth = 1.4;
      mpCtx.strokeRect(box.x, box.y, box.w, box.h);
    }
  }
  mpCtx.restore();

  // 更新坐标点位置与读数
  const ux = (matState.stepX - MAT_RANGE.xMin) / (MAT_RANGE.xMax - MAT_RANGE.xMin);
  const uy = (matState.stepY - MAT_RANGE.yMin) / (MAT_RANGE.yMax - MAT_RANGE.yMin);
  matDot.style.left = `${(clamp(ux, 0, 1) * 100).toFixed(1)}%`;
  matDot.style.top = `${(clamp(uy, 0, 1) * 100).toFixed(1)}%`;

  $("mat-xy").textContent = `Δx ${matState.stepX.toFixed(2)} · Δy ${matState.stepY.toFixed(2)}`;
  $("mat-nums").textContent = `交叠 ${Math.round(ev.overlapPct)}% · 遮字 ${Math.round(ev.maxTitleOccPct)}% · 倾角 ${Math.round(ev.slopeDeg)}°`;
  const badge = $("mat-badge");
  badge.dataset.tone = ev.status;
  badge.textContent = ev.status === "ok" ? "安全顺流 · 走廊内" : ev.badge;
  $("mat-explain").textContent = ev.explain;
}

function updateMatrixFromPointer(clientX, clientY) {
  const r = matPad.getBoundingClientRect();
  const u = clamp((clientX - r.left) / Math.max(1, r.width), 0, 1);
  const v = clamp((clientY - r.top) / Math.max(1, r.height), 0, 1);
  matState.stepX = MAT_RANGE.xMin + u * (MAT_RANGE.xMax - MAT_RANGE.xMin);
  matState.stepY = MAT_RANGE.yMin + v * (MAT_RANGE.yMax - MAT_RANGE.yMin);
  document.querySelectorAll(".preset-btn").forEach((b) => b.classList.remove("is-active"));
  drawMatrixPreview();
}

let matDragging = false;
matPad.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  matDragging = true;
  if (matPad.setPointerCapture) {
    try { matPad.setPointerCapture(e.pointerId); } catch {}
  }
  matPad.focus({ preventScroll: true });
  updateMatrixFromPointer(e.clientX, e.clientY);
});
matPad.addEventListener("pointermove", (e) => {
  if (!matDragging) return;
  updateMatrixFromPointer(e.clientX, e.clientY);
});
const stopMatDrag = () => { matDragging = false; };
matPad.addEventListener("pointerup", stopMatDrag);
matPad.addEventListener("pointercancel", stopMatDrag);
matPad.addEventListener("keydown", (e) => {
  const dx = e.key === "ArrowLeft" ? -0.04 : e.key === "ArrowRight" ? 0.04 : 0;
  const dy = e.key === "ArrowUp" ? -0.04 : e.key === "ArrowDown" ? 0.04 : 0;
  if (!dx && !dy) return;
  e.preventDefault();
  matState.stepX = clamp(matState.stepX + dx, MAT_RANGE.xMin, MAT_RANGE.xMax);
  matState.stepY = clamp(matState.stepY + dy, MAT_RANGE.yMin, MAT_RANGE.yMax);
  document.querySelectorAll(".preset-btn").forEach((b) => b.classList.remove("is-active"));
  drawMatrixPreview();
});

document.querySelectorAll(".preset-btn").forEach((b) => {
  b.addEventListener("click", () => {
    const p = MAT_PRESETS[b.dataset.preset];
    if (!p) return;
    matState.stepX = p.stepX;
    matState.stepY = p.stepY;
    document.querySelectorAll(".preset-btn").forEach((x) => x.classList.toggle("is-active", x === b));
    drawMatrixPreview();
  });
});

new ResizeObserver(() => {
  drawMatrixPadBg();
  drawMatrixPreview();
}).observe(matPad);

// =========================================================================
// 03 节：1987 桌面窗口管理器 Cascade / Tile / Stack
// =========================================================================
const WIN_COPY = {
  cascade: {
    titles: "4 / 4",
    area: "58%",
    note: "级联排布：四份文档对角错开，每张标题栏都完整露在外面，点哪份就能把它提回最前，同时活动窗口还能保住大半屏幕宽度。",
  },
  tile: {
    titles: "4 / 4",
    area: "22%",
    note: "平铺排布：零遮挡，方便同时并排比对；但小屏幕被切成四小块后，每份文档只剩不到四分之一面积，正文字行被压得很碎。",
  },
  stack: {
    titles: "1 / 4",
    area: "68%",
    note: "原地叠死：最上面一份文档视野最大，但底下三份连标题栏都被吞得一干二净——读者根本忘了背后还开着三份文件。",
  },
};

document.querySelectorAll(".win-cmd").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.wmode;
    const info = WIN_COPY[mode];
    if (!info) return;
    $("win-screen").dataset.wmode = mode;
    $("win-titles").textContent = info.titles;
    $("win-area").textContent = info.area;
    $("win-note").textContent = info.note;
    document.querySelectorAll(".win-cmd").forEach((x) => {
      const act = x === btn;
      x.classList.toggle("is-active", act);
      x.setAttribute("aria-pressed", String(act));
    });
  });
});

// =========================================================================
// 04 节：四种应用场景逐幕步进分镜台
// =========================================================================
const SCENARIOS = {
  deck: {
    takeaway: "演示汇报里逐页放出级联卡时，上一幕留在左后方当背景上下文，新的一幕压在前一张右下角接管视线——观众不用记刚才讲了什么，也不会分心提前偷看结尾。",
    steps: [
      { num: "01", tone: "teal",  title: "抛出业务痛点", body: "首单流失集中在注册后第三步，先给全场一个共同锚点。" },
      { num: "02", tone: "blue",  title: "拆出转化漏斗", body: "顺着痛点切出三组核心数据，把问题落到具体表单环节。" },
      { num: "03", tone: "teal",  title: "现场回放录屏", body: "放大报错最密的一屏，让团队一眼看懂用户为何放弃。" },
      { num: "04", tone: "blue",  title: "给出改版方案", body: "把五项必填砍成两项，收拢前段铺垫转向落地动作。" },
      { num: "05", tone: "coral", title: "拍板上线排期", body: "珊瑚红收束底端：本周五灰度 20%，下周二看留存复盘。" },
    ],
  },
  story: {
    takeaway: "品牌或专题故事页需要「起承转合」的情绪递进：相邻卡片轻咬尾角就像分镜翻页，让读者一路顺着时间线读到最后一张情绪高潮。",
    steps: [
      { num: "01", tone: "teal",  title: "清晨五点入窑", body: "雾还没散，陶土刚从阴干架上抱下来，建立环境氛围。" },
      { num: "02", tone: "blue",  title: "手工拉坯修足", body: "镜头贴近转盘与指痕，把器物成形的手感铺陈开来。" },
      { num: "03", tone: "teal",  title: "釉色试片百次", body: "中段深入青釉配比失败记录，让工艺厚度真正立住。" },
      { num: "04", tone: "blue",  title: "千度窑变开盖", body: "降温三十六小时后的开窑瞬间，把悬念推向临门一脚。" },
      { num: "05", tone: "coral", title: "一只杯的归处", body: "暖色落幕：端上餐桌的那一刻，整段匠作之旅完成闭环。" },
    ],
  },
  product: {
    takeaway: "产品功能页最怕五个卖点平铺成一堵参数墙。按「发现→上手→进阶→协作→结果」做成五幕斜瀑，新用户一眼就能顺着使用路径读懂产品价值。",
    steps: [
      { num: "01", tone: "teal",  title: "一键导入素材", body: "把零散表格和截图直接拖进工作区，省去手动整理。" },
      { num: "02", tone: "blue",  title: "自动提取结构", body: "按时间与标签归类片段，初步搭出可编辑的清晰骨架。" },
      { num: "03", tone: "teal",  title: "多维联动筛选", body: "点一条指标，相关原始依据高亮呼应，细节一查到底。" },
      { num: "04", tone: "blue",  title: "评论直指区块", body: "同事不必截图圈画，直接在对应模块留下修改建议。" },
      { num: "05", tone: "coral", title: "单链一键交付", body: "收口成离线可读文档与网页，省去反复发附件改版本。" },
    ],
  },
  timeline: {
    takeaway: "梳理项目或历史里程碑时，级联把「前后因果」直接画成了空间压边——每一代版本都站在上一代肩上长出来，比干巴巴的横轴小圆点更有演进张力。",
    steps: [
      { num: "01", tone: "teal",  title: "Q1 原型验证", body: "完成最小核心回路，邀请十二位种子用户实测可用性。" },
      { num: "02", tone: "blue",  title: "Q2 引擎重构", body: "补齐离线缓存与导出管线，把加载耗电压到一秒以内。" },
      { num: "03", tone: "teal",  title: "Q3 模板生态", body: "上线三十套行业版式，让高频场景开箱就能直接出稿。" },
      { num: "04", tone: "blue",  title: "Q4 团队协同", body: "打通权限管理与版本回滚，承接中小设计团队日常交付。" },
      { num: "05", tone: "coral", title: "年度 2.0 发布", body: "汇聚全年反馈正式定版，开启下一阶段开放插件计划。" },
    ],
  },
};

const sceneState = { key: "deck", count: 3 };

function renderScene() {
  const data = SCENARIOS[sceneState.key];
  const stage = $("scene-stage");
  stage.innerHTML = data.steps
    .map((st, idx) => {
      const pending = idx >= sceneState.count;
      const current = idx === sceneState.count - 1;
      if (pending) {
        return `<button type="button" class="sc-card is-pending" data-step="${idx}" data-tone="${st.tone}" data-jump="${idx + 1}" aria-label="展开到第 ${idx + 1} 幕：${st.title}">
          <span class="sc-num"><i class="sc-dot" aria-hidden="true"></i><span lang="en">${st.num}</span></span>
          <span class="sc-pending-title">待放出</span>
          <span class="sc-pending-tip">点此或按「下一幕」展开</span>
        </button>`;
      }
      return `<article class="sc-card${current ? " is-current" : ""}" data-step="${idx}" data-tone="${st.tone}">
        <span class="sc-num"><i class="sc-dot" aria-hidden="true"></i><span lang="en">${st.num}</span></span>
        <h3>${st.title}</h3>
        <p>${st.body}</p>
      </article>`;
    })
    .join("");

  stage.querySelectorAll("button[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sceneState.count = Number(btn.dataset.jump);
      renderScene();
    });
  });

  $("step-ind").textContent = `第 ${sceneState.count} / 5 幕`;
  $("step-prev").disabled = sceneState.count <= 1;
  $("step-next").disabled = sceneState.count >= 5;
  $("scene-takeaway").textContent = data.takeaway;
}

document.querySelectorAll(".scene-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    sceneState.key = tab.dataset.scene;
    sceneState.count = 3;
    document.querySelectorAll(".scene-tab").forEach((t) => {
      const act = t === tab;
      t.classList.toggle("is-active", act);
      t.setAttribute("aria-selected", String(act));
    });
    renderScene();
  });
});
$("step-prev").addEventListener("click", () => {
  if (sceneState.count > 1) { sceneState.count--; renderScene(); }
});
$("step-next").addEventListener("click", () => {
  if (sceneState.count < 5) { sceneState.count++; renderScene(); }
});
$("step-all").addEventListener("click", () => {
  sceneState.count = 5;
  renderScene();
});

// =========================================================================
// 05 节：同小类七位邻居分工坐标图
// =========================================================================
const SIBLINGS = {
  "057": {
    title: "057 棋盘构图",
    tag: "焦点对比 · 057 vs 060",
    desc: "明暗或图文交替铺满等大格子，靠正负反转制造平权节拍；级联则彻底打破等权，强制观众从 01 入口一路斜落到 05 收束。",
    url: "https://layout.xiaoxiaodong.ai/057/play/",
    cta: "去看 057 棋盘构图互动版 →",
  },
  "058": {
    title: "058 阶梯构图",
    tag: "焦点对比 · 058 vs 060",
    desc: "靠每级抬升的高差拉出单向攀升感，块与块横向相邻而不互相压边；级联则进一步让新卡片压住前一张的尾角，把攀升变成首尾咬合的连续下落流。",
    url: "https://layout.xiaoxiaodong.ai/058/play/",
    cta: "去看 058 阶梯构图互动版 →",
  },
  "059": {
    title: "059 层叠构图",
    tag: "焦点对比 · 059 vs 060",
    desc: "重点在 Z 轴前后景深、遮挡 T 形交点与近实远虚的空间感，未必按编号顺序步步阅读；级联则把叠压绑定在单向阅读路径上，强调故事推进。",
    url: "https://layout.xiaoxiaodong.ai/059/play/",
    cta: "去看 059 层叠构图互动版 →",
  },
  "060": {
    title: "060 级联构图（本页）",
    tag: "当前位置 · 右上角交汇点",
    desc: "同时站在「明显压叠」与「强单线顺序」的交汇处：每一幕既压住前一张的装饰尾角形成咬合，又顺着斜瀑方向把视线一路送达终点。",
    url: "https://layout.xiaoxiaodong.ai/060/play/",
    cta: "本页在线版链接",
  },
  "061": {
    title: "061 聚类构图",
    tag: "焦点对比 · 061 vs 060",
    desc: "利用格式塔接近律把同类元素抱团成组，方便先认清「谁和谁是一伙」；级联则靠连续压边把元素串成「先看谁、再看谁」的链条。",
    url: "https://layout.xiaoxiaodong.ai/061/play/",
    cta: "去看 061 聚类构图互动版 →",
  },
  "062": {
    title: "062 分散构图",
    tag: "焦点对比 · 062 vs 060",
    desc: "刻意把元素散落在宽阔留白中，追求轻盈通透与自由探索；刚好站在级联「紧密咬合、步步牵引」的反面。",
    url: "https://layout.xiaoxiaodong.ai/062/play/",
    cta: "去看 062 分散构图互动版 →",
  },
  "063": {
    title: "063 分支构图",
    tag: "焦点对比 · 063 vs 060",
    desc: "由一个起点分叉出多条平行支路，适合树状结构与因果分流；级联则保持单一主河道，不让读者中途做分叉选择。",
    url: "https://layout.xiaoxiaodong.ai/063/play/",
    cta: "去看 063 分支构图互动版 →",
  },
  "064": {
    title: "064 网络构图",
    tag: "焦点对比 · 064 vs 060",
    desc: "多个节点彼此多向连结成关系网，没有唯一入口和终点；级联则是严格单向的瀑布，从左上起点直奔右下落点。",
    url: "https://layout.xiaoxiaodong.ai/064/play/",
    cta: "去看 064 网络构图互动版 →",
  },
};

function focusSibling(id) {
  const info = SIBLINGS[id];
  if (!info) return;
  $("sp-tag").textContent = info.tag;
  $("sp-title").textContent = info.title;
  $("sp-desc").textContent = info.desc;
  $("sp-link").href = info.url;
  $("sp-link").textContent = info.cta;

  document.querySelectorAll("#sib-svg .sib-node").forEach((n) => {
    n.classList.toggle("is-focus", n.dataset.sib === id && id !== "060");
  });
  document.querySelectorAll("#sib-list li").forEach((li) => {
    li.classList.toggle("is-focus", li.dataset.sib === id);
  });
}

document.querySelectorAll("#sib-svg .sib-node").forEach((node) => {
  node.addEventListener("click", () => focusSibling(node.dataset.sib));
  node.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      focusSibling(node.dataset.sib);
    }
  });
});
document.querySelectorAll("#sib-list li").forEach((li) => {
  li.addEventListener("click", (e) => {
    if (e.target.tagName === "A") return;
    focusSibling(li.dataset.sib);
  });
});

// =========================================================================
// 06 节：什么时候别用级联（三组正反切替台）
// =========================================================================
const SKIP_CASES = {
  pricing: {
    badVerdict: "硬套级联翻车：三档套餐被斜着错开、还互相压边，读者想横着核对「价格、容量、并发数」时，眼球得在斜线上来回扫，上一档右侧条目还被挡住。",
    goodVerdict: "换回等高平铺三栏：同一水平线上对齐价格与权益行，视线水平一扫就能比清三档差价，零遮挡、零额外阅读成本。",
    badHtml: `<div class="skip-mock is-cascade">
      <div class="sm-card is-warn"><h4>基础版 <span class="sm-price">¥49</span></h4><ul><li>50 GB 存储</li><li>3 名成员</li><li>邮件支持</li></ul></div>
      <div class="sm-card is-warn"><h4>专业版 <span class="sm-price">¥129</span></h4><ul><li>500 GB 存储</li><li>15 名成员</li><li>优先工单</li></ul></div>
      <div class="sm-card is-warn"><h4>企业版 <span class="sm-price">¥399</span></h4><ul><li>无限存储</li><li>不限成员</li><li>专属顾问</li></ul></div>
    </div>`,
    goodHtml: `<div class="skip-mock is-clean">
      <div class="sm-card"><h4>基础版 <span class="sm-price">¥49</span></h4><ul><li>50 GB 存储</li><li>3 名成员</li><li>邮件支持</li></ul></div>
      <div class="sm-card"><h4>专业版 <span class="sm-price">¥129</span></h4><ul><li>500 GB 存储</li><li>15 名成员</li><li>优先工单</li></ul></div>
      <div class="sm-card"><h4>企业版 <span class="sm-price">¥399</span></h4><ul><li>无限存储</li><li>不限成员</li><li>专属顾问</li></ul></div>
    </div>`,
  },
  alert: {
    badVerdict: "硬套级联翻车：故障告警讲究零点几秒一眼扫完所有危急项；把卡片叠成斜瀑，第二条压住第一条的右侧耗时与故障码，还让人误以为最靠前的轻告警比严重告警更紧急。",
    goodVerdict: "换回全宽等权清单：严重级别左对齐、时间与操作按钮右对齐，每条告警互不遮挡，值班人一眼直奔最高危项。",
    badHtml: `<div class="skip-mock is-cascade">
      <div class="sm-card is-warn"><h4>P0 数据库主节点失联</h4><p>影响订单写入 · 持续 2 分 18 秒</p></div>
      <div class="sm-card is-warn"><h4>P1 支付回调延迟升高</h4><p>95 分位 3.4 秒 · 重试队列积压</p></div>
      <div class="sm-card is-warn"><h4>P2 缓存命中率微降</h4><p>当前 91.2% · 暂未影响前端</p></div>
    </div>`,
    goodHtml: `<div class="skip-mock is-list">
      <div class="sm-card is-warn"><h4>P0 数据库主节点失联 <span class="sm-price">持续 02:18</span></h4><p>影响订单写入 · 请立即触发主从切换</p></div>
      <div class="sm-card"><h4>P1 支付回调延迟升高 <span class="sm-price">P95 3.4s</span></h4><p>重试队列积压 · 检查网关连接池</p></div>
      <div class="sm-card"><h4>P2 缓存命中率微降 <span class="sm-price">91.2%</span></h4><p>暂未影响前端 · 持续观察即可</p></div>
    </div>`,
  },
  reading: {
    badVerdict: "硬套级联翻车：查文档目录或词条索引的人是按关键词随机跳查，不是从第 1 章读到第 5 章。斜叠把左边缘缩得越来越窄，找任意一章反而费劲。",
    goodVerdict: "换回齐整并列目录：所有章节入口左对齐、留足字宽，想查哪章直接空降，绝不强行把参考工具装扮成单线故事。",
    badHtml: `<div class="skip-mock is-cascade">
      <div class="sm-card is-warn"><h4>A · 接口鉴权规范</h4><p>令牌签发、刷新周期与签名校验规则。</p></div>
      <div class="sm-card is-warn"><h4>B · 错误码速查表</h4><p>4xx 客户端参数校验与 5xx 限流重试策略。</p></div>
      <div class="sm-card is-warn"><h4>C · Webhook 回调</h4><p>事件列表、验签示例与幂等去重建议。</p></div>
    </div>`,
    goodHtml: `<div class="skip-mock is-clean">
      <div class="sm-card"><h4>A · 接口鉴权规范</h4><p>令牌签发、刷新周期与签名校验规则。</p></div>
      <div class="sm-card"><h4>B · 错误码速查表</h4><p>4xx 客户端参数校验与 5xx 限流重试策略。</p></div>
      <div class="sm-card"><h4>C · Webhook 回调</h4><p>事件列表、验签示例与幂等去重建议。</p></div>
    </div>`,
  },
};

const skipState = { caseKey: "pricing", mode: "bad" };

function renderSkip() {
  const c = SKIP_CASES[skipState.caseKey];
  const isBad = skipState.mode === "bad";
  $("skip-stage").innerHTML = `${isBad ? c.badHtml : c.goodHtml}<p class="skip-verdict ${isBad ? "is-bad" : "is-good"}">${isBad ? c.badVerdict : c.goodVerdict}</p>`;
}

document.querySelectorAll(".skip-case").forEach((b) => {
  b.addEventListener("click", () => {
    skipState.caseKey = b.dataset.case;
    document.querySelectorAll(".skip-case").forEach((x) => {
      const act = x === b;
      x.classList.toggle("is-active", act);
      x.setAttribute("aria-selected", String(act));
    });
    renderSkip();
  });
});
document.querySelectorAll(".stog-btn").forEach((b) => {
  b.addEventListener("click", () => {
    skipState.mode = b.dataset.mode;
    document.querySelectorAll(".stog-btn").forEach((x) => {
      const act = x === b;
      x.classList.toggle("is-active", act);
      x.setAttribute("aria-pressed", String(act));
    });
    renderSkip();
  });
});

// =========================================================================
// 07 节：小练习（单一变量四选一）
// =========================================================================
const QUIZ_FEEDBACK = {
  A: {
    right: false,
    title: "选了 A——差了一步：编号顺序和斜流方向打架了",
    body: "A 的步距、压边比例与后压前方向其实都对，但唯独把 04 过渡排在了 02 展开前面、05 总结插在 03 深化前面。读者顺着斜线读完 01 后，视线被迫跨过中段往回折返找编号。正确答案是 C。",
  },
  B: {
    right: false,
    title: "选了 B——差了一步：叠压朝向反了，前卡盖住了后卡标题",
    body: "B 的 01→05 位置与斜率都对，但 Z 序反成了「前卡压后卡」——前一张的右下角正好压在后一张左上编号与标题上，每一幕的入口都被吞掉一块。正确答案是 C。",
  },
  C: {
    right: true,
    title: "答对了！C 是唯一四项全通的顺流级联",
    body: "C 让 01→05 沿舒适斜瀑依次下坠，采用「后卡压前卡」稳咬右下波浪装饰角（阅读安全区零遮挡、压边咬合不断链），最后由最顶端的 05 珊瑚橘稳稳收束整条视线。对比可见：A 错在序列折返、B 错在反叠吞字、D 错在拉太散断链。",
  },
  D: {
    right: false,
    title: "选了 D——差了一步：步距拉得太散，压边咬合彻底断链",
    body: "D 的顺序和方向都没问题，但卡片之间完全脱离、留出宽白缝，失去了「谁接住谁」的视觉搭扣，五幕卡散成了五座斜排孤岛。正确答案是 C。",
  },
};

const quizGrid = $("quiz-grid");
quizGrid.querySelectorAll(".quiz-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    const opt = btn.dataset.opt;
    const fb = QUIZ_FEEDBACK[opt];
    quizGrid.classList.add("is-answered");
    quizGrid.querySelectorAll(".quiz-card").forEach((c) => {
      const o = c.dataset.opt;
      c.classList.remove("is-picked", "is-right", "is-wrong");
      c.setAttribute("aria-pressed", String(o === opt));
      if (o === "C") c.classList.add("is-right");
      if (o === opt) {
        c.classList.add("is-picked");
        if (o !== "C") c.classList.add("is-wrong");
      }
    });
    const v = $("quiz-verdict");
    v.classList.remove("is-right", "is-wrong");
    v.classList.add(fb.right ? "is-right" : "is-wrong");
    $("qv-title").textContent = fb.title;
    $("qv-body").textContent = fb.body;
  });
});

// =========================================================================
// 08 节：原海报放大与拖动平移灯箱（只复用 #poster 的 src，绝不二次内联）
// =========================================================================
const posterImg = $("poster");
const posterTrigger = $("poster-trigger");
const lightbox = $("lightbox");
const lbImg = $("lb-img");
const lbStage = $("lb-stage");

const lb = { zoom: 1, tx: 0, ty: 0, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 };

function applyLbTransform() {
  lbImg.style.transform = `translate(${lb.tx}px, ${lb.ty}px) scale(${lb.zoom})`;
  $("lb-zoom").textContent = `${Math.round(lb.zoom * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lb.zoom = 1.15;
  lb.tx = 0;
  lb.ty = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterTrigger.setAttribute("aria-expanded", "true");
  $("lb-close").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterTrigger.setAttribute("aria-expanded", "false");
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
$("lb-close").addEventListener("click", closeLightbox);
$("lb-in").addEventListener("click", () => { lb.zoom = clamp(lb.zoom + 0.35, 0.7, 3); applyLbTransform(); });
$("lb-out").addEventListener("click", () => { lb.zoom = clamp(lb.zoom - 0.35, 0.7, 3); applyLbTransform(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lb.zoom = clamp(lb.zoom + (e.deltaY < 0 ? 0.18 : -0.18), 0.7, 3);
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) { closeLightbox(); return; }
  e.preventDefault();
  lb.dragging = true;
  lb.sx = e.clientX;
  lb.sy = e.clientY;
  lb.ox = lb.tx;
  lb.oy = lb.ty;
  if (lbStage.setPointerCapture) {
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  }
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lb.dragging) return;
  lb.tx = lb.ox + (e.clientX - lb.sx);
  lb.ty = lb.oy + (e.clientY - lb.sy);
  applyLbTransform();
});
const stopLbDrag = () => { lb.dragging = false; };
lbStage.addEventListener("pointerup", stopLbDrag);
lbStage.addEventListener("pointercancel", stopLbDrag);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// =========================================================================
// 初始化全部模块
// =========================================================================
syncHero();
resizeHero();
selectAct(0);
drawMatrixPadBg();
drawMatrixPreview();
renderScene();
focusSibling("058");
renderSkip();

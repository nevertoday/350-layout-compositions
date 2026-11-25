// 332 起承转合构图 · 高精 2D 观澜四境与 S 形气韵丝带画布
// 1:1 承袭 332 原海报深松绿底、暖米象牙圆镜、S 丝带、琥珀金珠与三套程序化东方画境（无五官剪影）。

import { PHASES, clamp, pct, sampleRibbon } from "./model.js";

const COL = {
  bg: "#014038",
  bgSubtle: "#043830",
  cream: "#F6E2B5",
  creamBright: "#FBF1D4",
  ribbon: "#F3E8BC",
  gold: "#FABA40",
  goldBright: "#FFCB41",
  jadeDeep: "#003F37",
  jadeMid: "#1C5D47",
  jadeHill: "#26634C",
  jadeMist: "#85A27D",
  lineSoft: "rgba(243, 232, 188, 0.24)",
  danger: "#FF7B5C",
  dangerBg: "#7D2315",
  ok: "#6EE0B8",
  textLight: "#E8EFE8",
  textMuted: "#B7CCC1",
};

// 依据当前张力值 energy (0.05..1.0) 与折位 idx 绘制圆镜内部程序化东方画境
function drawMedallionArt(ctx, cx, cy, r, energy, idx, scene, time) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // 暖象牙圆底（原海报圆镜天色）
  ctx.fillStyle = COL.cream;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  const wobble = Math.sin(time * 1.4 + idx * 1.3) * 0.015;

  if (scene === "poster") {
    drawPosterArt(ctx, cx, cy, r, energy, idx, wobble);
  } else if (scene === "scroll") {
    drawScrollArt(ctx, cx, cy, r, energy, idx, wobble);
  } else {
    drawComicArt(ctx, cx, cy, r, energy, idx, wobble);
  }

  ctx.restore();
}

// 题材一：1:1 原海报·观澜四境（随张力连续演化：孤月平波 → 叠山朝日 → 巨浪钩月 → 落日平波）
function drawPosterArt(ctx, cx, cy, r, energy, idx, wobble) {
  const isResolveMode = idx === 3 && energy <= 0.42;

  if (energy <= 0.36 && !isResolveMode) {
    // 静境（原海报 ① 孤月静丘）：极简留白 + 左上深碧小月 + 底部缓丘
    const moonR = r * (0.13 + energy * 0.14);
    ctx.fillStyle = COL.jadeDeep;
    ctx.beginPath();
    ctx.arc(cx - r * 0.26, cy - r * 0.24, moonR, 0, Math.PI * 2);
    ctx.fill();

    // 柔和深碧山丘/静水
    ctx.fillStyle = COL.jadeDeep;
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.05, cy + r * 0.34);
    ctx.bezierCurveTo(
      cx - r * 0.45,
      cy + r * (0.14 - energy * 0.25 + wobble),
      cx + r * 0.25,
      cy + r * (0.38 - energy * 0.15),
      cx + r * 1.05,
      cy + r * 0.44
    );
    ctx.lineTo(cx + r * 1.05, cy + r * 1.05);
    ctx.lineTo(cx - r * 1.05, cy + r * 1.05);
    ctx.closePath();
    ctx.fill();
    return;
  }

  if (isResolveMode) {
    // 合境（原海报 ④ 落日平波）：居中圆满琥珀金日 + 平静水面 + 渐细金色倒影涟漪
    const sunR = r * (0.30 - energy * 0.08);
    ctx.fillStyle = COL.gold;
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.14, sunR, 0, Math.PI * 2);
    ctx.fill();

    // 水平面
    const waterY = cy + r * 0.20;
    ctx.fillStyle = COL.jadeMid;
    ctx.fillRect(cx - r, waterY, r * 2, r * 0.85);

    // 水面渐细柔和米金倒影条（呼应原海报 ④ 五道长短收束涟漪）
    ctx.fillStyle = COL.cream;
    const ripples = [
      { dy: 0.08, w: 0.72, h: 0.085 },
      { dy: 0.22, w: 0.56, h: 0.075 },
      { dy: 0.36, w: 0.42, h: 0.070 },
      { dy: 0.50, w: 0.28, h: 0.060 },
      { dy: 0.63, w: 0.16, h: 0.050 },
    ];
    for (let i = 0; i < ripples.length; i++) {
      const rp = ripples[i];
      const rw = r * rp.w * (1 + wobble * (i % 2 === 0 ? 1 : -1));
      const rh = r * rp.h;
      ctx.beginPath();
      ctx.roundRect(cx - rw * 0.5, waterY + r * rp.dy, rw, rh, rh * 0.5);
      ctx.fill();
    }
    return;
  }

  if (energy < 0.70) {
    // 承境（原海报 ② 叠山朝日）：右上暖琥珀金日 + 浅雾青远山 + 中碧山脊 + 深墨近丘
    const t = (energy - 0.36) / 0.34;
    ctx.fillStyle = COL.gold;
    ctx.beginPath();
    ctx.arc(cx + r * 0.36, cy - r * (0.34 - t * 0.06), r * (0.14 + t * 0.06), 0, Math.PI * 2);
    ctx.fill();

    // 远山雾青
    ctx.fillStyle = COL.jadeMist;
    ctx.beginPath();
    ctx.moveTo(cx - r, cy + r * 0.14);
    ctx.quadraticCurveTo(cx - r * 0.36, cy - r * (0.18 + t * 0.14), cx + r * 0.16, cy + r * 0.18);
    ctx.quadraticCurveTo(cx + r * 0.62, cy + r * 0.02, cx + r, cy + r * 0.22);
    ctx.lineTo(cx + r, cy + r);
    ctx.lineTo(cx - r, cy + r);
    ctx.closePath();
    ctx.fill();

    // 中山翠青
    ctx.fillStyle = COL.jadeHill;
    ctx.beginPath();
    ctx.moveTo(cx - r, cy + r * 0.38);
    ctx.quadraticCurveTo(cx - r * 0.12, cy + r * (0.10 - t * 0.12), cx + r * 0.44, cy + r * (0.04 - t * 0.10));
    ctx.quadraticCurveTo(cx + r * 0.80, cy + r * 0.02, cx + r, cy + r * 0.24);
    ctx.lineTo(cx + r, cy + r);
    ctx.lineTo(cx - r, cy + r);
    ctx.closePath();
    ctx.fill();

    // 前丘深松绿
    ctx.fillStyle = COL.jadeDeep;
    ctx.beginPath();
    ctx.moveTo(cx - r, cy + r * 0.36);
    ctx.bezierCurveTo(cx - r * 0.4, cy + r * 0.24, cx + r * 0.15, cy + r * 0.56, cx + r, cy + r * 0.62);
    ctx.lineTo(cx + r, cy + r);
    ctx.lineTo(cx - r, cy + r);
    ctx.closePath();
    ctx.fill();
    return;
  }

  // 转境（原海报 ③ 巨浪钩月）：张力 ≥ 0.70 掀翻天深碧卷浪 + 琥珀弯月漩涡 + 飞溅浪珠
  const surge = clamp((energy - 0.70) / 0.30, 0, 1);

  // 漩涡琥珀钩月（原海报 ③ 招牌动态钩月）
  ctx.save();
  ctx.translate(cx + r * 0.06, cy - r * 0.08);
  ctx.rotate(-0.18 - surge * 0.22 + wobble * 2);
  ctx.fillStyle = COL.gold;
  ctx.beginPath();
  ctx.arc(0, 0, r * (0.42 + surge * 0.10), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COL.cream;
  ctx.beginPath();
  ctx.arc(-r * 0.20, r * 0.06, r * (0.31 + surge * 0.05), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 翻卷巨浪外层（中碧）
  ctx.fillStyle = COL.jadeHill;
  ctx.beginPath();
  ctx.moveTo(cx - r * 1.05, cy + r * 0.45);
  ctx.bezierCurveTo(
    cx - r * 0.78,
    cy - r * (0.42 + surge * 0.28),
    cx + r * 0.10,
    cy - r * (0.50 + surge * 0.22),
    cx + r * 0.04,
    cy + r * 0.02
  );
  ctx.bezierCurveTo(
    cx - r * 0.06,
    cy - r * 0.14,
    cx - r * 0.34,
    cy + r * 0.12,
    cx - r * 0.02,
    cy + r * 0.42
  );
  ctx.quadraticCurveTo(cx + r * 0.42, cy + r * 0.62, cx + r * 1.05, cy + r * 0.40);
  ctx.lineTo(cx + r * 1.05, cy + r * 1.05);
  ctx.lineTo(cx - r * 1.05, cy + r * 1.05);
  ctx.closePath();
  ctx.fill();

  // 巨浪深碧暗面
  ctx.fillStyle = COL.jadeDeep;
  ctx.beginPath();
  ctx.moveTo(cx - r * 1.05, cy + r * 0.62);
  ctx.bezierCurveTo(
    cx - r * 0.70,
    cy - r * (0.14 + surge * 0.20),
    cx - r * 0.16,
    cy - r * (0.28 + surge * 0.14),
    cx - r * 0.12,
    cy + r * 0.14
  );
  ctx.bezierCurveTo(cx - r * 0.14, cy + r * 0.56, cx + r * 0.35, cy + r * 0.76, cx + r * 1.05, cy + r * 0.56);
  ctx.lineTo(cx + r * 1.05, cy + r * 1.05);
  ctx.lineTo(cx - r * 1.05, cy + r * 1.05);
  ctx.closePath();
  ctx.fill();

  // 飞溅浪珠（金色与碧青点）
  const drops = [
    { x: -0.58, y: -0.44, rad: 0.065, c: COL.jadeMid },
    { x: -0.34, y: -0.56, rad: 0.055, c: COL.gold },
    { x: 0.18, y: -0.52, rad: 0.050, c: COL.jadeMist },
    { x: 0.48, y: 0.26, rad: 0.060, c: COL.jadeMid },
    { x: 0.64, y: 0.12, rad: 0.045, c: COL.gold },
  ];
  for (const d of drops) {
    ctx.fillStyle = d.c;
    ctx.beginPath();
    ctx.arc(cx + r * d.x, cy + r * d.y, r * d.rad * (0.85 + surge * 0.3), 0, Math.PI * 2);
    ctx.fill();
  }
}

// 题材二：长卷·富春行旅（平坡疏林 → 溪桥村舍 → 危崖急峡 → 远汀归帆）
function drawScrollArt(ctx, cx, cy, r, energy, idx, wobble) {
  const isResolveMode = idx === 3 && energy <= 0.42;
  if (energy <= 0.36 && !isResolveMode) {
    // 平坡疏林：浅滩一坡 + 三株极简古松剪影
    ctx.fillStyle = COL.jadeMist;
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.2, cy + r * 0.62, r * 0.95, r * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COL.jadeDeep;
    ctx.lineWidth = Math.max(1.5, r * 0.05);
    for (const tx of [-0.36, -0.18]) {
      const x = cx + r * tx;
      ctx.beginPath();
      ctx.moveTo(x, cy + r * 0.36);
      ctx.lineTo(x, cy - r * 0.02);
      ctx.stroke();
      ctx.fillStyle = COL.jadeDeep;
      ctx.beginPath();
      ctx.arc(x, cy - r * 0.06, r * 0.13, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  if (isResolveMode) {
    // 远汀归帆：平水长洲 + 孤帆剪影 + 暖金余晖
    ctx.fillStyle = COL.gold;
    ctx.beginPath();
    ctx.arc(cx + r * 0.28, cy - r * 0.24, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COL.jadeMid;
    ctx.fillRect(cx - r, cy + r * 0.26, r * 2, r * 0.78);
    // 远汀沙洲
    ctx.fillStyle = COL.jadeMist;
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.32, cy + r * 0.26, r * 0.65, r * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    // 归帆小舟
    ctx.fillStyle = COL.jadeDeep;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.36, cy + r * 0.22);
    ctx.lineTo(cx - r * 0.04, cy + r * 0.22);
    ctx.lineTo(cx - r * 0.12, cy + r * 0.30);
    ctx.lineTo(cx - r * 0.30, cy + r * 0.30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COL.creamBright;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.22, cy + r * 0.20);
    ctx.lineTo(cx - r * 0.22, cy - r * 0.12);
    ctx.lineTo(cx - r * 0.06, cy + r * 0.14);
    ctx.closePath();
    ctx.fill();
    return;
  }
  if (energy < 0.70) {
    // 溪桥重峦：双坡山岭 + 拱桥与水溪
    ctx.fillStyle = COL.jadeMist;
    ctx.beginPath();
    ctx.moveTo(cx - r, cy + r * 0.2);
    ctx.lineTo(cx - r * 0.35, cy - r * 0.22);
    ctx.lineTo(cx + r * 0.2, cy + r * 0.12);
    ctx.lineTo(cx + r * 0.65, cy - r * 0.16);
    ctx.lineTo(cx + r, cy + r * 0.24);
    ctx.lineTo(cx + r, cy + r);
    ctx.lineTo(cx - r, cy + r);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COL.jadeHill;
    ctx.fillRect(cx - r, cy + r * 0.32, r * 2, r * 0.7);
    // 拱桥
    ctx.strokeStyle = COL.gold;
    ctx.lineWidth = Math.max(2, r * 0.075);
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.44, r * 0.34, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    return;
  }
  // 危崖急峡：两侧陡峭山崖对峙 + 金光破云急瀑直下
  const s = clamp((energy - 0.70) / 0.30, 0, 1);
  ctx.fillStyle = COL.gold;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.08, cy - r * 0.72);
  ctx.lineTo(cx + r * 0.26, cy - r * 0.18);
  ctx.lineTo(cx - r * 0.12, cy + r * 0.78);
  ctx.lineTo(cx - r * 0.22, cy - r * 0.08);
  ctx.closePath();
  ctx.fill();
  // 左崖
  ctx.fillStyle = COL.jadeDeep;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r * (0.48 + s * 0.25));
  ctx.lineTo(cx - r * 0.24, cy - r * (0.30 + s * 0.16));
  ctx.lineTo(cx - r * 0.10, cy + r * 0.25);
  ctx.lineTo(cx - r * 0.32, cy + r);
  ctx.lineTo(cx - r, cy + r);
  ctx.closePath();
  ctx.fill();
  // 右崖
  ctx.fillStyle = COL.jadeHill;
  ctx.beginPath();
  ctx.moveTo(cx + r, cy - r * (0.36 + s * 0.22));
  ctx.lineTo(cx + r * 0.18, cy - r * (0.14 + s * 0.16));
  ctx.lineTo(cx + r * 0.28, cy + r * 0.42);
  ctx.lineTo(cx + r * 0.12, cy + r);
  ctx.lineTo(cx + r, cy + r);
  ctx.closePath();
  ctx.fill();
}

// 题材三：分镜·四格画帖（纯黑墨无五官背影剪影，绝不画五官）
function drawComicArt(ctx, cx, cy, r, energy, idx, wobble) {
  const isResolveMode = idx === 3 && energy <= 0.42;
  if (energy <= 0.36 && !isResolveMode) {
    // 独院静坐：空院一窗 + 极小背影剪影
    ctx.strokeStyle = COL.jadeHill;
    ctx.lineWidth = Math.max(1.5, r * 0.045);
    ctx.strokeRect(cx - r * 0.46, cy - r * 0.34, r * 0.92, r * 0.62);
    ctx.fillStyle = COL.jadeDeep;
    ctx.fillRect(cx - r, cy + r * 0.42, r * 2, r * 0.6);
    // 静坐背影（圆头+圆肩，无五官）
    ctx.beginPath();
    ctx.arc(cx - r * 0.16, cy + r * 0.14, r * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.16, cy + r * 0.38, r * 0.18, r * 0.18, 0, Math.PI, 0);
    ctx.fill();
    return;
  }
  if (isResolveMode) {
    // 雨歇残阳：低落暖金夕阳 + 远檐平线 + 檐下一盏静灯
    ctx.fillStyle = COL.gold;
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.10, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COL.jadeDeep;
    ctx.fillRect(cx - r, cy + r * 0.34, r * 2, r * 0.70);
    ctx.strokeStyle = COL.cream;
    ctx.lineWidth = Math.max(1.5, r * 0.04);
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.62, cy + r * 0.48);
    ctx.lineTo(cx + r * 0.62, cy + r * 0.48);
    ctx.stroke();
    return;
  }
  if (energy < 0.70) {
    // 听雨烹茶：斜细雨丝 + 暖金炉火 + 窗前茶案与背影
    ctx.strokeStyle = COL.jadeMist;
    ctx.lineWidth = Math.max(1.2, r * 0.032);
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * r * 0.24, cy - r * 0.65);
      ctx.lineTo(cx + i * r * 0.24 - r * 0.18, cy + r * 0.10);
      ctx.stroke();
    }
    ctx.fillStyle = COL.jadeDeep;
    ctx.fillRect(cx - r, cy + r * 0.32, r * 2, r * 0.72);
    // 茶炉暖金微光
    ctx.fillStyle = COL.gold;
    ctx.beginPath();
    ctx.arc(cx + r * 0.22, cy + r * 0.22, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
    // 侧影人物（无五官）
    ctx.fillStyle = COL.jadeDeep;
    ctx.beginPath();
    ctx.arc(cx - r * 0.24, cy + r * 0.04, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.24, cy + r * 0.32, r * 0.20, r * 0.20, 0, Math.PI, 0);
    ctx.fill();
    return;
  }
  // 骤风折枝：狂斜疾雨 + 劈空金电 + 急弯折枝
  ctx.fillStyle = COL.jadeDeep;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // 闪电破空
  ctx.fillStyle = COL.goldBright;
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.18, cy - r * 0.78);
  ctx.lineTo(cx - r * 0.18, cy - r * 0.06);
  ctx.lineTo(cx + r * 0.08, cy - r * 0.02);
  ctx.lineTo(cx - r * 0.26, cy + r * 0.72);
  ctx.lineTo(cx + r * 0.34, cy - r * 0.16);
  ctx.lineTo(cx + r * 0.06, cy - r * 0.20);
  ctx.closePath();
  ctx.fill();
  // 狂风折枝斜影
  ctx.strokeStyle = COL.cream;
  ctx.lineWidth = Math.max(2, r * 0.065);
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.9, cy + r * 0.55);
  ctx.quadraticCurveTo(cx - r * 0.2, cy + r * 0.15, cx + r * 0.52, cy - r * 0.32 + wobble * r);
  ctx.stroke();
}

export function renderHeroCanvas(canvas, state, evalRes, time) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w < 20 || h < 20) return;
  // 窄屏高 DPR 手机封顶 1.5，兼顾清晰度与软件渲染满帧（GUIDE.md 建议）
  const dpr = Math.min(window.devicePixelRatio || 1, w < 520 ? 1.5 : 2);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const { circles, segments, waveBox } = evalRes.layout;
  const compact = w < 520;

  // 1. 深松石墨绿底（与页面无缝融合）
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, w, h);

  // 极轻微的四拍竖向节拍参考线（低对比装饰丝，不抢画境）
  ctx.save();
  ctx.strokeStyle = "rgba(243, 232, 188, 0.08)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  for (let i = 0; i < 4; i++) {
    const c = circles[i];
    ctx.beginPath();
    ctx.moveTo(c.cx, 12);
    ctx.lineTo(c.cx, waveBox.y - 8);
    ctx.stroke();
  }
  ctx.restore();

  // 2. 绘制 S 形暖米白气韵丝带（原海报标志母题）
  const ribbonColor = evalRes.pathOk ? COL.ribbon : "#E8A67C";
  ctx.save();
  // 外层轻柔光晕（无昂贵 shadowBlur）
  ctx.strokeStyle = evalRes.pathOk ? "rgba(243, 232, 188, 0.18)" : "rgba(255, 123, 92, 0.24)";
  ctx.lineWidth = compact ? 9 : 11;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(segments[0].p0.x, segments[0].p0.y);
  for (const s of segments) {
    ctx.bezierCurveTo(s.cp1.x, s.cp1.y, s.cp2.x, s.cp2.y, s.p1.x, s.p1.y);
  }
  ctx.stroke();

  // 主暖米丝带
  ctx.strokeStyle = ribbonColor;
  ctx.lineWidth = compact ? 4.2 : 5.2;
  ctx.beginPath();
  ctx.moveTo(segments[0].p0.x, segments[0].p0.y);
  for (const s of segments) {
    ctx.bezierCurveTo(s.cp1.x, s.cp1.y, s.cp2.x, s.cp2.y, s.p1.x, s.p1.y);
  }
  ctx.stroke();
  ctx.restore();

  // 3. 依次绘制 4 枚圆形画境（1 起 / 2 承 / 3 转 / 4 合）
  for (let i = 0; i < 4; i++) {
    const c = circles[i];
    const check = evalRes.phaseChecks[i];
    const isActive = state.active === i;

    // 选中态外环呼吸圈
    if (isActive) {
      ctx.save();
      ctx.strokeStyle = check.ok ? COL.goldBright : COL.danger;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, c.r + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 内部程序化东方画境
    drawMedallionArt(ctx, c.cx, c.cy, c.r, c.energy, i, state.scene, time);

    // 圆镜暖米/状态细边框
    ctx.save();
    ctx.strokeStyle = check.ok ? COL.creamBright : COL.danger;
    ctx.lineWidth = isActive ? 3 : 2;
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 原海报锚珠（扣在丝带与圆镜交界处的琥珀金珠）
    ctx.save();
    ctx.fillStyle = check.ok ? COL.gold : COL.danger;
    ctx.beginPath();
    ctx.arc(c.bx, c.by, compact ? 5.5 : 6.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COL.bg;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    // 圆镜正上方或正下方工整标牌（四列独立领地，永不互撞压字）
    const shortH = h < 310;
    const above = c.labelPos === "above";
    const row1Y = above ? c.cy - c.r - (shortH ? 24 : 30) : c.cy + c.r + (shortH ? 16 : 20);
    const row2Y = above ? c.cy - c.r - (shortH ? 9 : 13) : c.cy + c.r + (shortH ? 31 : 37);

    ctx.save();
    ctx.textBaseline = "middle";
    // 数字金圆徽 + 汉字「起/承/转/合」居中并排
    const badgeR = compact || shortH ? 8.5 : 10;
    const badgeX = c.cx - (compact || shortH ? 15 : 18);
    ctx.fillStyle = check.ok ? COL.gold : COL.danger;
    ctx.beginPath();
    ctx.arc(badgeX, row1Y, badgeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COL.jadeDeep;
    ctx.font = `700 ${compact || shortH ? 10.5 : 11.5}px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText(c.phase.num, badgeX, row1Y + 0.5);

    ctx.textAlign = "left";
    ctx.fillStyle = COL.creamBright;
    ctx.font = `700 ${compact || shortH ? 16 : 19}px "ZCOOL XiaoWei", "Noto Serif SC", serif`;
    ctx.fillText(c.phase.zh, badgeX + badgeR + 5, row1Y + 1);

    // 实时百分比 & 成败短签居中（限制单列宽避免极窄屏越界）
    ctx.textAlign = "center";
    ctx.fillStyle = check.ok ? COL.goldBright : "#FFB199";
    ctx.font = `500 ${compact || shortH ? 10.5 : 11.5}px "DM Mono", monospace`;
    ctx.fillText(check.tag, c.cx, row2Y, Math.max(54, w / 4 - 8));
    ctx.restore();
  }

  // 4. 绘制沿 S 丝带游走的「视线金珠」及柔和尾迹
  const trailSteps = 6;
  for (let s = trailSteps; s >= 1; s--) {
    const pt = sampleRibbon(segments, state.cursor - s * 0.016);
    ctx.fillStyle = `rgba(255, 203, 65, ${(0.28 * (trailSteps - s + 1)) / trailSteps})`;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, (compact ? 6 : 7.5) * (1 - s / (trailSteps + 2)), 0, Math.PI * 2);
    ctx.fill();
  }
  const head = sampleRibbon(segments, state.cursor);
  ctx.save();
  ctx.fillStyle = "rgba(255, 203, 65, 0.28)";
  ctx.beginPath();
  ctx.arc(head.x, head.y, compact ? 13 : 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COL.goldBright;
  ctx.beginPath();
  ctx.arc(head.x, head.y, compact ? 6.5 : 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COL.jadeDeep;
  ctx.beginPath();
  ctx.arc(head.x, head.y, compact ? 2.5 : 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. 顶沿轻标牌（若当前存在真错态，给出清晰醒目但不遮圆镜的警报胶囊）
  ctx.save();
  const pillText = evalRes.isSolved
    ? `✓ ${evalRes.badge}`
    : `× ${evalRes.badge} · 拖圆镜调张力或横拖演视线`;
  ctx.font = `600 ${compact ? 11 : 12}px "Noto Serif SC", serif`;
  const tw = ctx.measureText(pillText).width;
  const pw = Math.min(w - 20, tw + 24);
  const ph = 26;
  const px = (w - pw) / 2;
  const py = 10;
  ctx.fillStyle = evalRes.isSolved ? "rgba(20, 102, 75, 0.92)" : "rgba(125, 35, 21, 0.92)";
  ctx.strokeStyle = evalRes.isSolved ? COL.ok : COL.danger;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, 13);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#FFF8E8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pillText, w / 2, py + ph / 2 + 0.5, pw - 16);
  ctx.restore();

  // 6. 底沿实时「节奏波动曲线（慢入 → 铺陈 → 骤转 → 缓收）」
  drawRhythmWave(ctx, waveBox, state, evalRes, compact);
}

function drawRhythmWave(ctx, box, state, evalRes, compact) {
  ctx.save();
  // 微暗底槽
  ctx.fillStyle = "rgba(4, 46, 40, 0.85)";
  ctx.strokeStyle = "rgba(243, 232, 188, 0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 8);
  ctx.fill();
  ctx.stroke();

  const innerPadX = compact ? 22 : 34;
  const topPad = 14;
  const botPad = 18;
  const plotW = Math.max(80, box.w - innerPadX * 2);
  const plotH = Math.max(24, box.h - topPad - botPad);
  const xAt = (i) => box.x + innerPadX + (plotW * i) / 3;
  const yAt = (e) => box.y + topPad + plotH * (1 - clamp(e, 0, 1));

  // 理想起承转合参考虚线带（轻淡背景参考，标明理想趋势）
  const ideal = [0.18, 0.50, 0.88, 0.24];
  ctx.strokeStyle = "rgba(243, 232, 188, 0.26)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(xAt(0), yAt(ideal[0]));
  for (let i = 0; i < 3; i++) {
    const x0 = xAt(i), y0 = yAt(ideal[i]);
    const x1 = xAt(i + 1), y1 = yAt(ideal[i + 1]);
    const mx = (x0 + x1) / 2;
    ctx.bezierCurveTo(mx, y0, mx, y1, x1, y1);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // 实测四拍曲线（与画布四圆 100% 同步）
  const pts = state.energies.map((e, i) => ({ x: xAt(i), y: yAt(e), e }));
  ctx.strokeStyle = evalRes.isSolved ? COL.goldBright : "#F7A072";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < 3; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    ctx.bezierCurveTo(mx, pts[i].y, mx, pts[i + 1].y, pts[i + 1].x, pts[i + 1].y);
  }
  ctx.stroke();

  // 当前游标同步点
  const curIdx = clamp(state.cursor, 0, 1) * 3;
  const i0 = Math.min(2, Math.floor(curIdx));
  const frac = curIdx - i0;
  const curX = xAt(i0) + (xAt(i0 + 1) - xAt(i0)) * frac;
  const curE = state.energies[i0] * (1 - frac) + state.energies[i0 + 1] * frac;
  ctx.strokeStyle = "rgba(255, 203, 65, 0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(curX, box.y + 6);
  ctx.lineTo(curX, box.y + box.h - 14);
  ctx.stroke();
  ctx.fillStyle = COL.goldBright;
  ctx.beginPath();
  ctx.arc(curX, yAt(curE), 4, 0, Math.PI * 2);
  ctx.fill();

  // 四个节点圆与标名
  for (let i = 0; i < 4; i++) {
    const p = pts[i];
    const ok = evalRes.phaseChecks[i].ok;
    const active = state.active === i;
    ctx.fillStyle = ok ? COL.gold : COL.danger;
    ctx.beginPath();
    ctx.arc(p.x, p.y, active ? 5.2 : 3.8, 0, Math.PI * 2);
    ctx.fill();
    if (active) {
      ctx.strokeStyle = COL.creamBright;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.fillStyle = active ? COL.goldBright : COL.textMuted;
    ctx.font = `600 11px "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${PHASES[i].zh} ${pct(p.e)}`, p.x, box.y + box.h - 2);
  }

  // 左上角微型说明
  ctx.fillStyle = COL.textMuted;
  ctx.font = `400 10px "DM Mono", monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(compact ? "RHYTHM" : "RHYTHM CURVE · 虚线为参考势", box.x + 10, box.y + 4);
  ctx.restore();
}

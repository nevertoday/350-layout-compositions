// 8 幅源自 275 号原海报的现代几何展品定义。
// 同一套几何真源同时驱动开场 2D Canvas 主展画、缩略图 SVG、灯箱精看以及正文各实验台。

export const PALETTES = {
  plum: {
    label: "深梅紫卡纸（原海报）",
    wall: "#3F1935",
    wallDeep: "#2D1026",
    mat: "#F7E3CE",
    matStroke: "rgba(247, 227, 206, 0.25)",
    activeFrame: "#F69B83",
    dark: "#491D39",
    coral: "#EE6D5F",
    blush: "#F1B6A8",
    beige: "#EED4C2",
    cream: "#F7E3CE",
  },
  stone: {
    label: "美术馆暖石白墙",
    wall: "#EAE2D7",
    wallDeep: "#DDD3C5",
    mat: "#FCF9F4",
    matStroke: "rgba(53, 20, 44, 0.16)",
    activeFrame: "#B83B2E",
    dark: "#2E2529",
    coral: "#C75A46",
    blush: "#DFB8AA",
    beige: "#EAE0D5",
    cream: "#F8F3EC",
  },
  washed: {
    label: "惨白过曝（无卡纸融边）",
    wall: "#FFFFFF",
    wallDeep: "#F7F7F7",
    mat: "#FFFFFF",
    matStroke: "rgba(0, 0, 0, 0.04)",
    activeFrame: "#D8D8D8",
    dark: "#C9C4C8",
    coral: "#F2CEC8",
    blush: "#F9ECE8",
    beige: "#FBF8F6",
    cream: "#FFFFFF",
  },
};

// 错态「杂色无框」：每幅画彼此色彩系统分裂、冷暖冲突，真实还原未做氛围统一的杂乱图库
const CLASH_SETS = [
  { dark: "#1B3B6F", coral: "#D93848", blush: "#1E9E89", beige: "#E7C24A", cream: "#EAF3F8" },
  { dark: "#17594A", coral: "#C43670", blush: "#4A8FE7", beige: "#E5B82E", cream: "#F3EDF7" },
  { dark: "#582C83", coral: "#E06D2B", blush: "#7CB342", beige: "#D5EEF5", cream: "#FAF3D3" },
  { dark: "#8C1D2C", coral: "#199A9E", blush: "#E5A93B", beige: "#CEC2EB", cream: "#E4F6F1" },
  { dark: "#224870", coral: "#D64579", blush: "#9AB832", beige: "#F0C5A0", cream: "#EDF2FA" },
  { dark: "#234E52", coral: "#D9532F", blush: "#DEC344", beige: "#A8DCE8", cream: "#FBF1E3" },
  { dark: "#5C1A33", coral: "#28A76E", blush: "#E6952E", beige: "#E8C3C8", cream: "#EDF9EB" },
  { dark: "#283044", coral: "#2E86DE", blush: "#D94862", beige: "#BFE0C2", cream: "#E8F1FA" },
];

export const ARTWORKS = [
  {
    id: "sun-slope",
    code: "01",
    title: "落日斜坡",
    en: "SUN & SLOPE",
    tag: "主视觉",
    aspect: "1:1",
    ratio: 1,
    caption: "大面积柔粉与米杏承托斜坡，珊瑚红圆盘作为唯一高纯度视觉落点。",
  },
  {
    id: "arch-plinth",
    code: "02",
    title: "拱门基座",
    en: "ARCH & PLINTH",
    tag: "结构立面",
    aspect: "3:4",
    ratio: 0.75,
    caption: "暖米高拱门与深梅紫阶座形成厚重反差，顶部留足呼吸弧顶。",
  },
  {
    id: "eclipse-horizon",
    code: "03",
    title: "日蚀地平",
    en: "ECLIPSE HORIZON",
    tag: "正视图",
    aspect: "1:1",
    ratio: 1,
    caption: "中心圆盘被地平线上下一分为二，深浅互换制造安静的平衡感。",
  },
  {
    id: "diagonal-peaks",
    code: "04",
    title: "对角双峰",
    en: "DIAGONAL PEAKS",
    tag: "几何剖面",
    aspect: "4:3",
    ratio: 1.333,
    caption: "一条 45° 斜线切开暖米与珊瑚面，底部深梅三角稳稳压住重心。",
  },
  {
    id: "terrace-moon",
    code: "05",
    title: "阶梯悬月",
    en: "TERRACE & MOON",
    tag: "细节角度",
    aspect: "16:9",
    ratio: 1.778,
    caption: "三级珊瑚色阶梯自左下逐级抬升，小枚深梅圆月悬停阶顶。",
  },
  {
    id: "chevron-orb",
    code: "06",
    title: "折角微日",
    en: "CHEVRON & ORB",
    tag: "尺寸标注",
    aspect: "1:1",
    ratio: 1,
    caption: "右侧锐利深梅折角指向左方小圆，形成干脆利落的视线折返。",
  },
  {
    id: "vertical-triptych",
    code: "07",
    title: "垂幕三柱",
    en: "VERTICAL TRIPTYCH",
    tag: "材质微距",
    aspect: "3:4",
    ratio: 0.75,
    caption: "珊瑚、柔粉、深梅三道竖向色带依次递增重量，测试色阶过渡。",
  },
  {
    id: "quarter-arcade",
    code: "08",
    title: "弧带回廊",
    en: "QUARTER ARCADE",
    tag: "场景氛围",
    aspect: "4:3",
    ratio: 1.333,
    caption: "左下深梅四分之一圆撑起暖米弧带，把视线顺滑导回画框中心。",
  },
];

export function paletteFor(artIndex, mood) {
  if (mood === "clash") return CLASH_SETS[artIndex % CLASH_SETS.length];
  return PALETTES[mood] || PALETTES.plum;
}

// 在任意 2D Canvas 矩形区域内绘制 8 幅几何作品之一（支持 0..1 入场进度）
export function drawArtwork(ctx, x, y, w, h, artIndex, mood = "plum", t = 1) {
  const p = paletteFor(artIndex, mood);
  const art = ARTWORKS[artIndex] || ARTWORKS[0];
  const e = 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3); // easeOutCubic

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const fill = (color) => {
    ctx.fillStyle = color;
  };

  switch (art.id) {
    case "sun-slope": {
      // 275 原海报主视觉：左柔粉、右米杏、右上珊瑚圆日、左下深梅斜三角、右下珊瑚斜坡、右下暖米缺口
      fill(p.beige);
      ctx.fillRect(x, y, w, h);

      fill(p.blush);
      ctx.fillRect(x, y, w * 0.44 * (0.85 + 0.15 * e), h);

      // 右下珊瑚斜坡（自中部右侧斜升）
      fill(p.coral);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.44, y + h * (0.68 + 0.08 * (1 - e)));
      ctx.lineTo(x + w, y + h * (0.43 + 0.08 * (1 - e)));
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w * 0.68, y + h);
      ctx.lineTo(x + w * 0.68, y + h * 0.75);
      ctx.closePath();
      ctx.fill();

      // 左下深梅斜楔
      fill(p.dark);
      ctx.beginPath();
      ctx.moveTo(x, y + h * (0.46 + 0.06 * (1 - e)));
      ctx.lineTo(x + w * 0.68, y + h * 0.75);
      ctx.lineTo(x + w * 0.08, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fill();

      // 左下米色三角底垫（在深梅楔下方右侧）
      fill(p.beige);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.08, y + h);
      ctx.lineTo(x + w * 0.68, y + h * 0.75);
      ctx.lineTo(x + w * 0.68, y + h);
      ctx.closePath();
      ctx.fill();

      // 右上珊瑚圆日
      const r = Math.min(w, h) * 0.155 * (0.72 + 0.28 * e);
      fill(p.coral);
      ctx.beginPath();
      ctx.arc(x + w * 0.715, y + h * (0.28 - 0.03 * (1 - e)), r, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "arch-plinth": {
      fill(p.blush);
      ctx.fillRect(x, y, w, h);
      // 右上柔和珊瑚过渡
      fill(p.coral);
      ctx.globalAlpha = 0.35;
      ctx.fillRect(x + w * 0.56, y, w * 0.44, h);
      ctx.globalAlpha = 1;

      // 暖米高拱门
      const aw = w * 0.78;
      const ax = x + w * 0.11;
      const ar = aw / 2;
      const topY = y + h * (0.14 + 0.05 * (1 - e));
      fill(p.cream);
      ctx.beginPath();
      ctx.arc(ax + ar, topY + ar, ar, Math.PI, 0, false);
      ctx.lineTo(ax + aw, y + h);
      ctx.lineTo(ax, y + h);
      ctx.closePath();
      ctx.fill();

      // 左下深梅台阶底座
      fill(p.dark);
      ctx.fillRect(x, y + h * 0.72, w * 0.52, h * 0.28);
      ctx.fillRect(x, y + h * 0.9, w, h * 0.1);
      break;
    }

    case "eclipse-horizon": {
      fill(p.beige);
      ctx.fillRect(x, y, w, h * 0.5);
      fill(p.coral);
      ctx.fillRect(x, y + h * 0.5, w, h * 0.5);

      const cx = x + w * 0.5;
      const cy = y + h * 0.5;
      const r = Math.min(w, h) * 0.36 * (0.8 + 0.2 * e);

      fill(p.dark);
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();

      fill(p.beige);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI, false);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case "diagonal-peaks": {
      fill(p.beige);
      ctx.fillRect(x, y, w, h);

      fill(p.coral);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();

      fill(p.dark);
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w * 0.52, y + h * (0.5 + 0.08 * (1 - e)));
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case "terrace-moon": {
      fill(p.beige);
      ctx.fillRect(x, y, w, h);

      fill(p.coral);
      const lift = (1 - e) * h * 0.06;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + h * 0.78 + lift);
      ctx.lineTo(x + w * 0.34, y + h * 0.78 + lift);
      ctx.lineTo(x + w * 0.34, y + h * 0.56 + lift);
      ctx.lineTo(x + w * 0.66, y + h * 0.56 + lift);
      ctx.lineTo(x + w * 0.66, y + h * 0.32 + lift);
      ctx.lineTo(x + w, y + h * 0.32 + lift);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();

      fill(p.dark);
      ctx.beginPath();
      ctx.arc(x + w * 0.44, y + h * 0.28, Math.min(w, h) * 0.145 * (0.75 + 0.25 * e), 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "chevron-orb": {
      fill(p.beige);
      ctx.fillRect(x, y, w, h);

      fill(p.dark);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.34, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w * 0.34, y + h);
      ctx.lineTo(x + w * (0.76 - 0.04 * (1 - e)), y + h * 0.5);
      ctx.closePath();
      ctx.fill();

      fill(p.coral);
      ctx.beginPath();
      ctx.arc(x + w * 0.26, y + h * 0.72, Math.min(w, h) * 0.135 * (0.75 + 0.25 * e), 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "vertical-triptych": {
      fill(p.beige);
      ctx.fillRect(x, y, w, h);

      fill(p.coral);
      ctx.fillRect(x, y, w * 0.3, h);

      fill(p.blush);
      ctx.fillRect(x + w * 0.3, y, w * 0.3, h);

      fill(p.dark);
      const top = y + h * (0.3 + 0.08 * (1 - e));
      ctx.fillRect(x + w * 0.6, top, w * 0.4, y + h - top);
      break;
    }

    case "quarter-arcade": {
      fill(p.coral);
      ctx.fillRect(x, y, w, h);

      const R1 = Math.min(w, h) * 0.96;
      const R2 = Math.min(w, h) * 0.68;

      fill(p.beige);
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.arc(x, y + h, R1, -Math.PI / 2, 0, false);
      ctx.closePath();
      ctx.fill();

      fill(p.dark);
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.arc(x, y + h, R2 * (0.88 + 0.12 * e), -Math.PI / 2, 0, false);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

// 同一组几何坐标生成的轻量 SVG，专供缩略图与静态示意使用，零失真、零重绘负担
export function artworkSvgMarkup(artIndex, mood = "plum", aspect = "1:1") {
  const p = paletteFor(artIndex, mood);
  const art = ARTWORKS[artIndex] || ARTWORKS[0];
  let inner = "";

  switch (art.id) {
    case "sun-slope":
      inner = `
        <rect width="100" height="100" fill="${p.beige}"/>
        <rect width="44" height="100" fill="${p.blush}"/>
        <polygon points="44,68 100,43 100,100 68,100 68,75" fill="${p.coral}"/>
        <polygon points="0,46 68,75 8,100 0,100" fill="${p.dark}"/>
        <polygon points="8,100 68,75 68,100" fill="${p.beige}"/>
        <circle cx="71.5" cy="28" r="15.5" fill="${p.coral}"/>`;
      break;
    case "arch-plinth":
      inner = `
        <rect width="100" height="100" fill="${p.blush}"/>
        <rect x="56" width="44" height="100" fill="${p.coral}" fill-opacity="0.35"/>
        <path d="M11,100 L11,53 A39,39 0 0 1 89,53 L89,100 Z" fill="${p.cream}"/>
        <rect y="72" width="52" height="28" fill="${p.dark}"/>
        <rect y="90" width="100" height="10" fill="${p.dark}"/>`;
      break;
    case "eclipse-horizon":
      inner = `
        <rect width="100" height="50" fill="${p.beige}"/>
        <rect y="50" width="100" height="50" fill="${p.coral}"/>
        <path d="M14,50 A36,36 0 0 1 86,50 Z" fill="${p.dark}"/>
        <path d="M14,50 A36,36 0 0 0 86,50 Z" fill="${p.beige}"/>`;
      break;
    case "diagonal-peaks":
      inner = `
        <rect width="100" height="100" fill="${p.beige}"/>
        <polygon points="0,0 100,0 100,100" fill="${p.coral}"/>
        <polygon points="0,100 52,50 100,100" fill="${p.dark}"/>`;
      break;
    case "terrace-moon":
      inner = `
        <rect width="100" height="100" fill="${p.beige}"/>
        <polygon points="0,100 0,78 34,78 34,56 66,56 66,32 100,32 100,100" fill="${p.coral}"/>
        <circle cx="44" cy="28" r="14.5" fill="${p.dark}"/>`;
      break;
    case "chevron-orb":
      inner = `
        <rect width="100" height="100" fill="${p.beige}"/>
        <polygon points="34,0 100,0 100,100 34,100 76,50" fill="${p.dark}"/>
        <circle cx="26" cy="72" r="13.5" fill="${p.coral}"/>`;
      break;
    case "vertical-triptych":
      inner = `
        <rect width="100" height="100" fill="${p.beige}"/>
        <rect width="30" height="100" fill="${p.coral}"/>
        <rect x="30" width="30" height="100" fill="${p.blush}"/>
        <rect x="60" y="30" width="40" height="70" fill="${p.dark}"/>`;
      break;
    case "quarter-arcade":
      inner = `
        <rect width="100" height="100" fill="${p.coral}"/>
        <path d="M0,100 L0,4 A96,96 0 0 1 96,100 Z" fill="${p.beige}"/>
        <path d="M0,100 L0,32 A68,68 0 0 1 68,100 Z" fill="${p.dark}"/>`;
      break;
  }

  const preserve = aspect === "stretch" ? "none" : "xMidYMid slice";
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="${preserve}" aria-hidden="true">${inner}</svg>`;
}

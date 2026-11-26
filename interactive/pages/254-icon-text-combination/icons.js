// 254 图标文字组合 — 双色几何矢量图标库（Canvas 2D + SVG 同源）
// 1:1 承袭 254 原海报的「纯墨黑主体 + 皇家钴蓝点缀」双色构成语言；人物只画几何无五官剪影。

export const ICON_PALETTE = {
  ink: "#11120D",
  blue: "#2950A5",
  cream: "#F6E0C1",
  vermilion: "#EC4109",
};

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

// 在以 (cx, cy) 为圆心、r 为参考半径的圆盘内绘制双色几何图标
export function drawIcon2D(ctx, id, cx, cy, r, colors = ICON_PALETTE) {
  const ink = colors.ink || ICON_PALETTE.ink;
  const blue = colors.blue || ICON_PALETTE.blue;
  const s = r / 48; // 归一化坐标系 [-48, 48]

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (id) {
    // ── 原海报 6 枚 ──
    case "goal": {
      // 山峰主三角（墨黑）
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(31, 24);
      ctx.lineTo(-31, 24);
      ctx.closePath();
      ctx.fill();
      // 旗杆（墨黑）
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(0, -32);
      ctx.stroke();
      // 峰顶蓝旗（钴蓝）
      ctx.fillStyle = blue;
      ctx.beginPath();
      ctx.moveTo(1.4, -32);
      ctx.lineTo(22, -24.5);
      ctx.lineTo(1.4, -17);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "time": {
      // 表盘外环（墨黑）
      ctx.strokeStyle = ink;
      ctx.lineWidth = 5.4;
      ctx.beginPath();
      ctx.arc(0, 0, 31, 0, Math.PI * 2);
      ctx.stroke();
      // 时针 12 点向心（墨黑）
      ctx.lineWidth = 5.2;
      ctx.beginPath();
      ctx.moveTo(0, -19);
      ctx.lineTo(0, 0);
      ctx.stroke();
      // 分针斜指右下（钴蓝）
      ctx.strokeStyle = blue;
      ctx.lineWidth = 5.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(14.5, 11.5);
      ctx.stroke();
      // 中心轴点（墨黑）
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "idea": {
      // 灯泡发散射线（墨黑）
      ctx.strokeStyle = ink;
      ctx.lineWidth = 4.2;
      const rays = [
        [0, -35, 0, -27.5],
        [-22, -25, -17, -20],
        [22, -25, 17, -20],
        [-29, -4, -22, -4],
        [29, -4, 22, -4],
      ];
      for (const [x1, y1, x2, y2] of rays) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      // 灯泡主体（墨黑）
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(0, -5, 16.5, Math.PI * 0.78, Math.PI * 0.22, false);
      ctx.quadraticCurveTo(10.5, 10, 9.5, 17);
      ctx.lineTo(-9.5, 17);
      ctx.quadraticCurveTo(-10.5, 10, -12.7, 5.6);
      ctx.closePath();
      ctx.fill();
      // 螺口底座（钴蓝）
      ctx.fillStyle = blue;
      roundRectPath(ctx, -9, 20.5, 18, 5, 2.4);
      ctx.fill();
      roundRectPath(ctx, -6, 28, 12, 4.5, 2.2);
      ctx.fill();
      break;
    }
    case "learning": {
      // 左书页（墨黑）
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(-29, -20);
      ctx.quadraticCurveTo(-14, -22, -2.2, -16);
      ctx.lineTo(-2.2, 18);
      ctx.quadraticCurveTo(-14, 13, -29, 15.5);
      ctx.closePath();
      ctx.fill();
      // 右书页（墨黑）
      ctx.beginPath();
      ctx.moveTo(29, -20);
      ctx.quadraticCurveTo(14, -22, 2.2, -16);
      ctx.lineTo(2.2, 18);
      ctx.quadraticCurveTo(14, 13, 29, 15.5);
      ctx.closePath();
      ctx.fill();
      // 底部弧形书托（钴蓝）
      ctx.strokeStyle = blue;
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.moveTo(-29, 21.5);
      ctx.quadraticCurveTo(-14, 19, 0, 25);
      ctx.quadraticCurveTo(14, 19, 29, 21.5);
      ctx.stroke();
      break;
    }
    case "growth": {
      // 三根递增柱体（墨黑）
      ctx.fillStyle = ink;
      roundRectPath(ctx, -26, 8, 13, 18, 2.4);
      ctx.fill();
      roundRectPath(ctx, -6.5, -1, 13, 27, 2.4);
      ctx.fill();
      roundRectPath(ctx, 13, -11, 13, 37, 2.4);
      ctx.fill();
      // 上升折线箭（钴蓝）
      ctx.strokeStyle = blue;
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.moveTo(-24, -1);
      ctx.lineTo(-5, -16);
      ctx.lineTo(4, -9);
      ctx.lineTo(21, -26);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(11, -26);
      ctx.lineTo(21.5, -26.5);
      ctx.lineTo(21, -16);
      ctx.stroke();
      break;
    }
    case "collab": {
      // 左人几何剪影（墨黑，无五官）
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(-14, -10, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-14, 24, 17, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();
      // 右人几何剪影（头墨黑 + 肩钴蓝，无五官）
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(14, -10, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = blue;
      ctx.beginPath();
      ctx.arc(14, 24, 17, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();
      break;
    }

    // ── UI 导航栏 6 枚 ──
    case "home": {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(0, -27);
      ctx.lineTo(29, -3);
      ctx.lineTo(22, -3);
      ctx.lineTo(22, 24);
      ctx.lineTo(-22, 24);
      ctx.lineTo(-22, -3);
      ctx.lineTo(-29, -3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = blue;
      roundRectPath(ctx, -7, 4, 14, 20, 2);
      ctx.fill();
      break;
    }
    case "search": {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(-6, -6, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = blue;
      ctx.lineWidth = 7.2;
      ctx.beginPath();
      ctx.moveTo(8, 8);
      ctx.lineTo(25, 25);
      ctx.stroke();
      break;
    }
    case "explore": {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = blue;
      ctx.beginPath();
      ctx.moveTo(14, -14);
      ctx.lineTo(5, 5);
      ctx.lineTo(-14, 14);
      ctx.lineTo(-5, -5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "bookmark": {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(-19, -26);
      ctx.lineTo(19, -26);
      ctx.lineTo(19, 26);
      ctx.lineTo(0, 12);
      ctx.lineTo(-19, 26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = blue;
      roundRectPath(ctx, -11, -17, 22, 7.5, 2);
      ctx.fill();
      break;
    }
    case "bell": {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(0, -6, 18, Math.PI, 0, false);
      ctx.lineTo(23, 14);
      ctx.lineTo(-23, 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = blue;
      ctx.beginPath();
      ctx.arc(0, 21, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(0, -25, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "settings": {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 5.2;
      for (const y of [-16, 0, 16]) {
        ctx.beginPath();
        ctx.moveTo(-25, y);
        ctx.lineTo(25, y);
        ctx.stroke();
      }
      ctx.fillStyle = blue;
      for (const [x, y] of [[-9, -16], [11, 0], [-4, 16]]) {
        ctx.beginPath();
        ctx.arc(x, y, 6.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // ── 操作列表 6 枚 ──
    case "export": {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(-24, 6);
      ctx.lineTo(-24, 22);
      ctx.lineTo(24, 22);
      ctx.lineTo(24, 6);
      ctx.stroke();
      ctx.strokeStyle = blue;
      ctx.lineWidth = 5.8;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(0, -23);
      ctx.moveTo(-13, -11);
      ctx.lineTo(0, -24);
      ctx.lineTo(13, -11);
      ctx.stroke();
      break;
    }
    case "schedule": {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 5;
      roundRectPath(ctx, -24, -18, 48, 42, 5);
      ctx.stroke();
      ctx.fillStyle = ink;
      ctx.fillRect(-24, -18, 48, 12);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-12, -26);
      ctx.lineTo(-12, -14);
      ctx.moveTo(12, -26);
      ctx.lineTo(12, -14);
      ctx.stroke();
      ctx.fillStyle = blue;
      roundRectPath(ctx, -6, 1, 16, 13, 3);
      ctx.fill();
      break;
    }
    case "cloud": {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(-11, 4, 13, 0, Math.PI * 2);
      ctx.arc(7, -2, 16, 0, Math.PI * 2);
      ctx.arc(17, 7, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-13, 5, 32, 13);
      ctx.strokeStyle = blue;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 26);
      ctx.lineTo(0, 7);
      ctx.moveTo(-8, 14);
      ctx.lineTo(0, 6);
      ctx.lineTo(8, 14);
      ctx.stroke();
      break;
    }
    case "history": {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.arc(2, 0, 24, -Math.PI * 0.72, Math.PI * 0.92, false);
      ctx.stroke();
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(-25, -20);
      ctx.lineTo(-27, -4);
      ctx.lineTo(-11, -8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = blue;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(2, -12);
      ctx.lineTo(2, 1);
      ctx.lineTo(12, 7);
      ctx.stroke();
      break;
    }
    case "lock": {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 5.6;
      ctx.beginPath();
      ctx.arc(0, -10, 14, Math.PI, 0, false);
      ctx.lineTo(14, 0);
      ctx.moveTo(-14, -10);
      ctx.lineTo(-14, 0);
      ctx.stroke();
      ctx.fillStyle = ink;
      roundRectPath(ctx, -22, -2, 44, 30, 5);
      ctx.fill();
      ctx.fillStyle = blue;
      ctx.beginPath();
      ctx.arc(0, 11, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-2.4, 13, 4.8, 8);
      break;
    }
    default: {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// 对应底部实黑成品匣与小节演示的轻量内联 SVG（与 drawIcon2D 视觉同源）
export function iconSvg(id, { size = 44, disc = true, ink = "#11120D", blue = "#2950A5", cream = "#F6E0C1" } = {}) {
  const inner = {
    goal: `<polygon points="50,38 82,74 18,74" fill="${ink}"/><line x1="50" y1="38" x2="50" y2="17" stroke="${ink}" stroke-width="3.4" stroke-linecap="round"/><polygon points="51.5,17 72,24.5 51.5,32" fill="${blue}"/>`,
    time: `<circle cx="50" cy="50" r="30" fill="none" stroke="${ink}" stroke-width="5.5"/><line x1="50" y1="30" x2="50" y2="50" stroke="${ink}" stroke-width="5.2" stroke-linecap="round"/><line x1="50" y1="50" x2="65" y2="62" stroke="${blue}" stroke-width="5.2" stroke-linecap="round"/><circle cx="50" cy="50" r="4.2" fill="${ink}"/>`,
    idea: `<g stroke="${ink}" stroke-width="4.2" stroke-linecap="round"><line x1="50" y1="14" x2="50" y2="22"/><line x1="27" y1="24" x2="32" y2="29"/><line x1="73" y1="24" x2="68" y2="29"/><line x1="20" y1="45" x2="27" y2="45"/><line x1="80" y1="45" x2="73" y2="45"/></g><path d="M37,56 A17,17 0 1,1 63,56 Q60,61 59.5,67 L40.5,67 Q40,61 37,56 Z" fill="${ink}"/><rect x="41" y="70.5" width="18" height="5" rx="2.5" fill="${blue}"/><rect x="44" y="78" width="12" height="4.5" rx="2.2" fill="${blue}"/>`,
    learning: `<path d="M21,30 Q36,28 48,34 L48,68 Q36,63 21,65.5 Z" fill="${ink}"/><path d="M79,30 Q64,28 52,34 L52,68 Q64,63 79,65.5 Z" fill="${ink}"/><path d="M21,71.5 Q36,69 50,75 Q64,69 79,71.5" fill="none" stroke="${blue}" stroke-width="4.8" stroke-linecap="round"/>`,
    growth: `<rect x="24" y="58" width="13" height="18" rx="2.2" fill="${ink}"/><rect x="43.5" y="49" width="13" height="27" rx="2.2" fill="${ink}"/><rect x="63" y="39" width="13" height="37" rx="2.2" fill="${ink}"/><polyline points="26,49 45,34 54,41 71,24" fill="none" stroke="${blue}" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round"/><polyline points="61,24 71.5,23.5 71,34" fill="none" stroke="${blue}" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    collab: `<circle cx="36" cy="40" r="9.5" fill="${ink}"/><path d="M19,74 A17,17 0 0,1 53,74 Z" fill="${ink}"/><circle cx="64" cy="40" r="9.5" fill="${ink}"/><path d="M47,74 A17,17 0 0,1 81,74 Z" fill="${blue}"/>`,
    home: `<polygon points="50,23 79,47 72,47 72,74 28,74 28,47 21,47" fill="${ink}"/><rect x="43" y="54" width="14" height="20" rx="2" fill="${blue}"/>`,
    search: `<circle cx="44" cy="44" r="18" fill="none" stroke="${ink}" stroke-width="6"/><line x1="58" y1="58" x2="75" y2="75" stroke="${blue}" stroke-width="7.2" stroke-linecap="round"/>`,
    explore: `<circle cx="50" cy="50" r="28" fill="none" stroke="${ink}" stroke-width="5"/><polygon points="64,36 55,55 36,64 45,45" fill="${blue}"/><circle cx="50" cy="50" r="3.5" fill="${ink}"/>`,
    bookmark: `<polygon points="31,24 69,24 69,76 50,62 31,76" fill="${ink}"/><rect x="39" y="33" width="22" height="7.5" rx="2" fill="${blue}"/>`,
    bell: `<path d="M32,44 A18,18 0 0,1 68,44 L73,64 L27,64 Z" fill="${ink}"/><circle cx="50" cy="71" r="7" fill="${blue}"/><circle cx="50" cy="25" r="4" fill="${ink}"/>`,
    settings: `<g stroke="${ink}" stroke-width="5.2" stroke-linecap="round"><line x1="25" y1="34" x2="75" y2="34"/><line x1="25" y1="50" x2="75" y2="50"/><line x1="25" y1="66" x2="75" y2="66"/></g><circle cx="41" cy="34" r="6.5" fill="${blue}"/><circle cx="61" cy="50" r="6.5" fill="${blue}"/><circle cx="46" cy="66" r="6.5" fill="${blue}"/>`,
    export: `<polyline points="26,56 26,72 74,72 74,56" fill="none" stroke="${ink}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="50" y1="60" x2="50" y2="27" stroke="${blue}" stroke-width="5.8" stroke-linecap="round"/><polyline points="37,39 50,26 63,39" fill="none" stroke="${blue}" stroke-width="5.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    schedule: `<rect x="26" y="32" width="48" height="42" rx="5" fill="none" stroke="${ink}" stroke-width="5"/><rect x="26" y="32" width="48" height="12" fill="${ink}"/><line x1="38" y1="24" x2="38" y2="36" stroke="${ink}" stroke-width="5" stroke-linecap="round"/><line x1="62" y1="24" x2="62" y2="36" stroke="${ink}" stroke-width="5" stroke-linecap="round"/><rect x="44" y="51" width="16" height="13" rx="3" fill="${blue}"/>`,
    cloud: `<path d="M38,67 H69 A11,11 0 0,0 69,46 A16,16 0 0,0 41,38 A13,13 0 0,0 38,67 Z" fill="${ink}"/><line x1="50" y1="76" x2="50" y2="57" stroke="${blue}" stroke-width="5" stroke-linecap="round"/><polyline points="42,64 50,56 58,64" fill="none" stroke="${blue}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
    history: `<path d="M35,32 A24,24 0 1,1 28,58" fill="none" stroke="${ink}" stroke-width="5.5" stroke-linecap="round"/><polygon points="25,30 23,46 39,42" fill="${ink}"/><polyline points="52,38 52,51 62,57" fill="none" stroke="${blue}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
    lock: `<path d="M36,48 V40 A14,14 0 0,1 64,40 V48" fill="none" stroke="${ink}" stroke-width="5.6"/><rect x="28" y="48" width="44" height="30" rx="5" fill="${ink}"/><circle cx="50" cy="61" r="5.5" fill="${blue}"/><rect x="47.6" y="63" width="4.8" height="8" fill="${blue}"/>`,
  }[id] || `<circle cx="50" cy="50" r="20" fill="${ink}"/>`;

  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${disc ? `<circle cx="50" cy="50" r="48" fill="${cream}"/>` : ""}${inner}</svg>`;
}

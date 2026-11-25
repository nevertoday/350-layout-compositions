// 150 图文谜语版式 · 定制平面向量图标库（2D Canvas + SVG 共享同一套几何语言）
// 忠实延续 150 号原海报的翡翠青绿（#0C8A75）、暖象牙纸（#F9F4EA）与利落印刷线描。

const JADE = "#0C8A75";
const PAPER = "#F9F4EA";
const INK = "#0A0A09";

// 在 2D Canvas 上以 (cx, cy) 为中心、size 为边长绘制高质量平面图形
export function drawCanvasIcon(ctx, iconId, cx, cy, size, opts = {}) {
  const color = opts.color || JADE;
  const strokePaper = opts.paper || PAPER;
  const s = size * 0.5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (iconId) {
    case "leaf": {
      // 忠实复刻 150 号原海报核心母题：斜向饱满翠绿树叶 + 暖白叶脉 + 弯柄
      ctx.rotate(-0.08);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-s * 0.68, s * 0.62);
      ctx.bezierCurveTo(-s * 0.92, -s * 0.18, -s * 0.16, -s * 0.88, s * 0.82, -s * 0.86);
      ctx.bezierCurveTo(s * 0.88, s * 0.16, s * 0.24, s * 0.86, -s * 0.68, s * 0.62);
      ctx.closePath();
      ctx.fill();

      // 弯叶柄
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2.2, size * 0.068);
      ctx.beginPath();
      ctx.moveTo(-s * 0.66, s * 0.60);
      ctx.quadraticCurveTo(-s * 0.84, s * 0.78, -s * 0.94, s * 0.92);
      ctx.stroke();

      // 暖白叶脉（主脉 + 三支侧脉）
      ctx.strokeStyle = strokePaper;
      ctx.lineWidth = Math.max(1.8, size * 0.055);
      ctx.beginPath();
      ctx.moveTo(-s * 0.54, s * 0.48);
      ctx.quadraticCurveTo(-s * 0.04, 0, s * 0.36, -s * 0.36);
      ctx.moveTo(-s * 0.20, s * 0.16);
      ctx.lineTo(-s * 0.24, -s * 0.22);
      ctx.moveTo(-s * 0.02, 0.0);
      ctx.lineTo(s * 0.34, -s * 0.04);
      ctx.moveTo(-s * 0.34, s * 0.28);
      ctx.lineTo(s * 0.04, s * 0.26);
      ctx.stroke();
      break;
    }

    case "heart":
    case "heartRed": {
      const fill = iconId === "heartRed" ? "#C63829" : color;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.78);
      ctx.bezierCurveTo(-s * 0.98, s * 0.22, -s * 0.96, -s * 0.66, -s * 0.44, -s * 0.76);
      ctx.bezierCurveTo(-s * 0.14, -s * 0.82, -s * 0.02, -s * 0.52, 0, -s * 0.36);
      ctx.bezierCurveTo(s * 0.02, -s * 0.52, s * 0.14, -s * 0.82, s * 0.44, -s * 0.76);
      ctx.bezierCurveTo(s * 0.96, -s * 0.66, s * 0.98, s * 0.22, 0, s * 0.78);
      ctx.closePath();
      ctx.fill();
      // 极简高光弧
      ctx.strokeStyle = strokePaper;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = Math.max(1.6, size * 0.048);
      ctx.beginPath();
      ctx.arc(-s * 0.38, -s * 0.34, s * 0.20, Math.PI * 1.08, Math.PI * 1.56);
      ctx.stroke();
      break;
    }

    case "maple": {
      ctx.fillStyle = "#C45228";
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.92);
      ctx.lineTo(s * 0.20, -s * 0.36);
      ctx.lineTo(s * 0.76, -s * 0.54);
      ctx.lineTo(s * 0.50, -s * 0.04);
      ctx.lineTo(s * 0.92, s * 0.16);
      ctx.lineTo(s * 0.36, s * 0.44);
      ctx.lineTo(s * 0.46, s * 0.64);
      ctx.lineTo(s * 0.08, s * 0.52);
      ctx.lineTo(0, s * 0.88);
      ctx.lineTo(-s * 0.08, s * 0.52);
      ctx.lineTo(-s * 0.46, s * 0.64);
      ctx.lineTo(-s * 0.36, s * 0.44);
      ctx.lineTo(-s * 0.92, s * 0.16);
      ctx.lineTo(-s * 0.50, -s * 0.04);
      ctx.lineTo(-s * 0.76, -s * 0.54);
      ctx.lineTo(-s * 0.20, -s * 0.36);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = strokePaper;
      ctx.lineWidth = Math.max(1.5, size * 0.042);
      ctx.beginPath();
      ctx.moveTo(0, s * 0.46);
      ctx.lineTo(0, -s * 0.48);
      ctx.moveTo(0, s * 0.22);
      ctx.lineTo(s * 0.44, -s * 0.14);
      ctx.moveTo(0, s * 0.22);
      ctx.lineTo(-s * 0.44, -s * 0.14);
      ctx.stroke();
      break;
    }

    case "oneBar": {
      // 单节翠绿横竹，直接贴合「一」字形态
      ctx.fillStyle = color;
      const barH = s * 0.34;
      ctx.beginPath();
      ctx.roundRect(-s * 0.88, -barH * 0.5, s * 1.76, barH, barH * 0.42);
      ctx.fill();
      // 竹节切线与细嫩芽
      ctx.strokeStyle = strokePaper;
      ctx.lineWidth = Math.max(1.6, size * 0.045);
      ctx.beginPath();
      ctx.moveTo(-s * 0.18, -barH * 0.45);
      ctx.lineTo(-s * 0.18, barH * 0.45);
      ctx.moveTo(s * 0.24, -barH * 0.45);
      ctx.lineTo(s * 0.24, barH * 0.45);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(s * 0.36, -s * 0.34, s * 0.24, s * 0.11, -0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "halfMoon": {
      // 几何半圆：左半翡翠实心 + 右半虚线空框，直指「半」
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.78, Math.PI * 0.5, Math.PI * 1.5);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, size * 0.055);
      ctx.setLineDash([Math.max(3, size * 0.08), Math.max(2.5, size * 0.06)]);
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.78, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      // 中轴切分线
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(1.6, size * 0.042);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.90);
      ctx.lineTo(0, s * 0.90);
      ctx.stroke();
      break;
    }

    case "doubleX": {
      // 双叠倍块（后块浅薄荷、前块深翡翠 + 醒目 ×2 几何刻纹）
      ctx.fillStyle = "#B6DACD";
      ctx.beginPath();
      ctx.roundRect(-s * 0.78, -s * 0.78, s * 1.12, s * 1.12, s * 0.18);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-s * 0.34, -s * 0.34, s * 1.12, s * 1.12, s * 0.18);
      ctx.fill();
      // 内部十字倍增标
      ctx.strokeStyle = strokePaper;
      ctx.lineWidth = Math.max(2.2, size * 0.075);
      const cx2 = s * 0.22;
      const cy2 = s * 0.22;
      const r = s * 0.24;
      ctx.beginPath();
      ctx.moveTo(cx2 - r, cy2 - r);
      ctx.lineTo(cx2 + r, cy2 + r);
      ctx.moveTo(cx2 + r, cy2 - r);
      ctx.lineTo(cx2 - r, cy2 + r);
      ctx.stroke();
      break;
    }

    case "eye": {
      // 经典平面之眼（呼应原海报「联想」与 Paul Rand Eye-Bee-M）
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2.4, size * 0.075);
      ctx.fillStyle = strokePaper;
      ctx.beginPath();
      ctx.moveTo(-s * 0.88, 0);
      ctx.quadraticCurveTo(0, -s * 0.74, s * 0.88, 0);
      ctx.quadraticCurveTo(0, s * 0.74, -s * 0.88, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = strokePaper;
      ctx.beginPath();
      ctx.arc(-s * 0.10, -s * 0.10, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "bulb": {
      // 灵光灯泡（借代「意 / 知」）
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -s * 0.16, s * 0.52, Math.PI * 0.8, Math.PI * 0.2, false);
      ctx.lineTo(s * 0.24, s * 0.42);
      ctx.lineTo(-s * 0.24, s * 0.42);
      ctx.closePath();
      ctx.fill();
      // 灯座横杠
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(2, size * 0.065);
      ctx.beginPath();
      ctx.moveTo(-s * 0.22, s * 0.58);
      ctx.lineTo(s * 0.22, s * 0.58);
      ctx.moveTo(-s * 0.15, s * 0.76);
      ctx.lineTo(s * 0.15, s * 0.76);
      ctx.stroke();
      // 顶部三条短光线
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.8, size * 0.055);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.90);
      ctx.lineTo(0, -s * 0.78);
      ctx.moveTo(-s * 0.66, -s * 0.66);
      ctx.lineTo(-s * 0.54, -s * 0.54);
      ctx.moveTo(s * 0.66, -s * 0.66);
      ctx.lineTo(s * 0.54, -s * 0.54);
      ctx.stroke();
      break;
    }

    case "gear": {
      // 离题干扰项：工业齿轮
      const fill = opts.brokenColor || "#B83A22";
      ctx.fillStyle = fill;
      const teeth = 8;
      ctx.beginPath();
      for (let i = 0; i < teeth * 2; i++) {
        const ang = (i * Math.PI) / teeth;
        const rad = i % 2 === 0 ? s * 0.80 : s * 0.58;
        const x = Math.cos(ang) * rad;
        const y = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = strokePaper;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.26, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "cup": {
      // 离题干扰项：热饮杯
      const fill = opts.brokenColor || "#B83A22";
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(-s * 0.62, -s * 0.26, s * 1.00, s * 0.92, [s * 0.08, s * 0.08, s * 0.34, s * 0.34]);
      ctx.fill();
      ctx.strokeStyle = fill;
      ctx.lineWidth = Math.max(2.2, size * 0.07);
      ctx.beginPath();
      ctx.arc(s * 0.38, s * 0.14, s * 0.26, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
      // 两条热气
      ctx.lineWidth = Math.max(1.6, size * 0.05);
      ctx.beginPath();
      ctx.moveTo(-s * 0.28, -s * 0.44);
      ctx.quadraticCurveTo(-s * 0.38, -s * 0.64, -s * 0.24, -s * 0.82);
      ctx.moveTo(s * 0.06, -s * 0.44);
      ctx.quadraticCurveTo(s * 0.16, -s * 0.64, s * 0.02, -s * 0.82);
      ctx.stroke();
      break;
    }

    case "cloud": {
      // 泛化云团
      const fill = opts.color || "#6B8E85";
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(-s * 0.36, s * 0.12, s * 0.38, 0, Math.PI * 2);
      ctx.arc(0, -s * 0.12, s * 0.46, 0, Math.PI * 2);
      ctx.arc(s * 0.42, s * 0.12, s * 0.34, 0, Math.PI * 2);
      ctx.fillRect(-s * 0.40, s * 0.04, s * 0.82, s * 0.46);
      ctx.fill();
      break;
    }

    case "wave":
    default: {
      // 抽象折线波纹
      const stroke = opts.brokenColor || "#B83A22";
      ctx.strokeStyle = stroke;
      ctx.lineWidth = Math.max(2.6, size * 0.08);
      for (const dy of [-s * 0.34, 0, s * 0.34]) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.72, dy);
        ctx.quadraticCurveTo(-s * 0.36, dy - s * 0.22, 0, dy);
        ctx.quadraticCurveTo(s * 0.36, dy + s * 0.22, s * 0.72, dy);
        ctx.stroke();
      }
      break;
    }
  }

  ctx.restore();
}

// 生成同风格的精简内联 SVG（供按钮芯片、02/04/06 节与海报四图标使用）
export function iconSvg(iconId, size = 28) {
  const map = {
    leaf: `<path d="M8 29 C4 16 14 5 30 5 C31 19 22 30 8 29 Z" fill="currentColor"/><path d="M9 28 Q5 31 3 34" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M11 26 Q18 18 24 12 M15 21 L14 14 M19 17 L25 16 M13 23 L19 23" stroke="#F9F4EA" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    heart: `<path d="M18 30 C4 21 4 9 11 7 C15 6 17 10 18 12 C19 10 21 6 25 7 C32 9 32 21 18 30 Z" fill="currentColor"/>`,
    heartRed: `<path d="M18 30 C4 21 4 9 11 7 C15 6 17 10 18 12 C19 10 21 6 25 7 C32 9 32 21 18 30 Z" fill="#C63829"/>`,
    maple: `<path d="M18 4 L21 12 L30 9 L26 17 L32 20 L24 25 L25 28 L19 26 L18 32 L17 26 L11 28 L12 25 L4 20 L10 17 L6 9 L15 12 Z" fill="#C45228"/>`,
    oneBar: `<rect x="4" y="14" width="28" height="7" rx="3" fill="currentColor"/><line x1="15" y1="14" x2="15" y2="21" stroke="#F9F4EA" stroke-width="1.8"/><line x1="22" y1="14" x2="22" y2="21" stroke="#F9F4EA" stroke-width="1.8"/><ellipse cx="25" cy="10" rx="4.2" ry="2" transform="rotate(-24 25 10)" fill="currentColor"/>`,
    halfMoon: `<path d="M18 5 A13 13 0 0 0 18 31 Z" fill="currentColor"/><path d="M18 5 A13 13 0 0 1 18 31" fill="none" stroke="currentColor" stroke-width="2.2" stroke-dasharray="3.5 3"/><line x1="18" y1="3" x2="18" y2="33" stroke="#0A0A09" stroke-width="1.8"/>`,
    doubleX: `<rect x="5" y="5" width="17" height="17" rx="3" fill="#B6DACD"/><rect x="13" y="13" width="18" height="18" rx="3" fill="currentColor"/><path d="M18 18 L26 26 M26 18 L18 26" stroke="#F9F4EA" stroke-width="2.4" stroke-linecap="round"/>`,
    eye: `<path d="M4 18 Q18 6 32 18 Q18 30 4 18 Z" fill="#F9F4EA" stroke="currentColor" stroke-width="2.4"/><circle cx="18" cy="18" r="5.5" fill="currentColor"/><circle cx="16.2" cy="16.2" r="1.5" fill="#F9F4EA"/>`,
    bulb: `<path d="M11 16 A7 7 0 1 1 25 16 L22 23 L14 23 Z" fill="currentColor"/><line x1="14" y1="26.5" x2="22" y2="26.5" stroke="#0A0A09" stroke-width="2.2" stroke-linecap="round"/><line x1="15.5" y1="30" x2="20.5" y2="30" stroke="#0A0A09" stroke-width="2.2" stroke-linecap="round"/><path d="M18 3 V6 M7 8 L9.5 10.5 M29 8 L26.5 10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    gear: `<path d="M15.5 4 H20.5 L21.4 8.2 A9.5 9.5 0 0 1 24.4 9.5 L28.1 7.3 L31.2 10.8 L28.6 14.3 A9.5 9.5 0 0 1 29.2 17.5 L33 19.2 L32 23.8 L27.7 23.8 A9.5 9.5 0 0 1 25.5 26.5 L26.9 30.5 L22.5 32.5 L19.8 29.1 A9.5 9.5 0 0 1 16.2 29.1 L13.5 32.5 L9.1 30.5 L10.5 26.5 A9.5 9.5 0 0 1 8.3 23.8 L4 23.8 L3 19.2 L6.8 17.5 A9.5 9.5 0 0 1 7.4 14.3 L4.8 10.8 L7.9 7.3 L11.6 9.5 A9.5 9.5 0 0 1 14.6 8.2 Z" fill="currentColor"/><circle cx="18" cy="18.5" r="4.5" fill="#F9F4EA"/>`,
    cup: `<rect x="7" y="13" width="16" height="15" rx="3.5" fill="currentColor"/><path d="M23 16 A4 4 0 0 1 23 24" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 10 Q10.5 7 12.5 4.5 M18 10 Q19.5 7 17.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
    cloud: `<path d="M10 26 A6 6 0 0 1 11 14.5 A7.5 7.5 0 0 1 25 14 A5.5 5.5 0 0 1 26 26 Z" fill="currentColor"/>`,
    wave: `<path d="M5 12 Q11.5 7.5 18 12 T31 12 M5 18.5 Q11.5 14 18 18.5 T31 18.5 M5 25 Q11.5 20.5 18 25 T31 25" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
    // 04 节历史真迹专属平面图形：条纹蜜蜂（Paul Rand Eye-Bee-M）、吉祥蝠、寿桃
    bee: `<ellipse cx="14" cy="11" rx="5.5" ry="3.8" transform="rotate(-22 14 11)" fill="#B6DACD" stroke="#0C8A75" stroke-width="1.5"/><ellipse cx="22" cy="11" rx="5.5" ry="3.8" transform="rotate(22 22 11)" fill="#B6DACD" stroke="#0C8A75" stroke-width="1.5"/><ellipse cx="18" cy="21" rx="10.5" ry="7.2" fill="#E3B23C" stroke="#0A0A09" stroke-width="2"/><line x1="13.5" y1="14.6" x2="13.5" y2="27.4" stroke="#0A0A09" stroke-width="2.6"/><line x1="18.5" y1="14" x2="18.5" y2="28" stroke="#0A0A09" stroke-width="2.6"/><line x1="23.5" y1="15.2" x2="23.5" y2="26.8" stroke="#0A0A09" stroke-width="2.6"/><path d="M28.5 21 L32 21" stroke="#0A0A09" stroke-width="2" stroke-linecap="round"/>`,
    bat: `<path d="M18 14 C15 11 10 9 4 12 C6.5 16 7.5 19.5 6 23 C10 21.5 13 22.5 15.5 25 L18 28 L20.5 25 C23 22.5 26 21.5 30 23 C28.5 19.5 29.5 16 32 12 C26 9 21 11 18 14 Z" fill="#B83A22"/><path d="M16 14 L15 10.5 M20 14 L21 10.5" stroke="#B83A22" stroke-width="1.8" stroke-linecap="round"/>`,
    peach: `<path d="M18 31 C8 27 6 16 12 10 C15 7.5 17.5 9.5 18 11.5 C18.5 9.5 21 7.5 24 10 C30 16 28 27 18 31 Z" fill="#D96846"/><path d="M18 10 C15 5.5 10.5 5 8 7.5 C11 9.5 14.5 10 18 10 Z" fill="#0C8A75"/><path d="M18 10 C21 5.5 25.5 5 28 7.5 C25 9.5 21.5 10 18 10 Z" fill="#0C8A75"/>`,
    // 原海报四枚底部线描图标（双关/替代/联想/记忆）
    badge_pun: `<ellipse cx="14" cy="16" rx="8.5" ry="6.8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 22 L7.5 26 L13 22.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><ellipse cx="23" cy="19" rx="7.5" ry="5.8" fill="#F9F4EA" stroke="currentColor" stroke-width="2"/><path d="M26 24.4 L29 27.5 L23.5 24.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`,
    badge_replace: `<rect x="7" y="7" width="22" height="22" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-dasharray="5.2 3.8"/>`,
    badge_flow: `<path d="M4 18 Q18 7 32 18 Q18 29 4 18 Z" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="18" cy="18" r="5" fill="currentColor"/>`,
    // 严格遵守 BRIEF.md：不画五官（眼、嘴），用洁净侧影轮廓 + 脑波云纹
    badge_memory: `<path d="M13 31 V26.5 C10 25.5 9.5 22.5 9 20.5 L7.2 18.8 C6.8 18.3 7.2 17.5 8.5 16.5 C8.5 10.5 13 6 19.5 6 C25.5 6 29.5 10 29.5 15.8 C29.5 20.4 27 23.4 25.5 25.5 V31" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 15.5 C14 13 16 10.5 18.8 11 C20.5 9.8 23.5 10.8 23.5 13.4 C25.5 14 25.5 17.2 23.2 18 C22.8 20.2 19.8 20.6 18.5 19.2 C16.2 19.8 14.2 18 15 15.5 Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
  };
  return `<svg class="r-ico" width="${size}" height="${size}" viewBox="0 0 36 36" aria-hidden="true">${map[iconId] || map.leaf}</svg>`;
}

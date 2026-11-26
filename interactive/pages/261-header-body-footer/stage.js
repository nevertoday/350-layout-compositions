// 261 主角交互画布：三段式网页装配与滚动验真仪（2D Canvas）
// 1:1 承袭 261 原海报的微网页视觉语言（亮黄顶条、黑夜金日双波山峦、金圆/黑三角/金方三联卡、暖沙三点页脚）
// + 右侧全长滚动视口剖面窗，支持拖拽跨段分拣部件、拖拉页眉/页脚分界柄、横拖/拖取景窗实时滚动验真、Space 巡检。

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  MODULES,
  PAGE_W,
  SCENES,
  VIEWPORT_H,
  ZONE_KEYS,
  ZONE_LABELS,
  computeLayout,
  moveModule,
} from "./model.js";

const PALETTE = {
  canvasPaper: "#F6ECDF",
  outerPaper: "#F4EBDE",
  borderGrey: "#99918B",
  borderSoft: "#C8BDB0",
  headerYellow: "#F8C84B",
  headerGold: "#F6B719",
  goldCircle: "#D99F15",
  waveLight: "#FAD063",
  waveDeep: "#F4B91E",
  ink: "#141412",
  inkDark: "#171A16",
  inkMuted: "#565047",
  lineMuted: "#7E766B",
  footerBeige: "#EDDDC2",
  errRed: "#B52B1E",
  errBg: "rgba(181, 43, 30, 0.11)",
  okGreen: "#1B6644",
  okBg: "rgba(27, 102, 68, 0.10)",
  amberText: "#7D5200",
};

const FONT_UI = '"Noto Sans SC", "Space Grotesk", sans-serif';
const FONT_EN = '"Space Grotesk", "Chivo", "Noto Sans SC", sans-serif';
const FONT_MONO = '"IBM Plex Mono", "Noto Sans SC", monospace';

export function createHeroStage(canvas, getState, setState, onLayout) {
  const ctx = canvas.getContext("2d");
  let w = 800;
  let h = 520;
  let dpr = 1;
  let dirty = true;
  let sizeDirty = true;

  function syncCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    const nextW = Math.max(260, Math.round(rect.width));
    const nextH = Math.max(260, Math.round(rect.height));
    const maxDpr = window.innerWidth <= 680 ? 1.5 : 2;
    const nextDpr = pixelRatio(maxDpr);
    if (nextW !== w || nextH !== h || nextDpr !== dpr) {
      w = nextW;
      h = nextH;
      dpr = nextDpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
    }
    sizeDirty = false;
  }

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      sizeDirty = true;
      dirty = true;
    }).observe(canvas);
  }
  window.addEventListener("resize", () => {
    sizeDirty = true;
    dirty = true;
  });

  // 动画态（开场轻轻落下 + 拖拽反馈 + Space 自动滚动巡检）
  let intro = 0;
  let tourActive = false;
  let tourPhase = 0; // 0..1 巡检进度
  let pulsePhase = 0;

  // 指针交互状态
  const drag = {
    mode: null, // "module" | "headerEdge" | "footerEdge" | "rail" | "scrollH"
    pointerId: null,
    modId: null,
    startX: 0,
    startY: 0,
    curX: 0,
    curY: 0,
    startVal: 0,
    hoverZone: null,
    moved: false,
    decidedAxis: false,
  };

  // 最新一帧的画布区域几何（给命中测试用）
  let geom = null;

  function computeCanvasGeom(cw, ch, layout) {
    const compact = cw < 520;
    const pad = compact ? 10 : 14;
    const topBarH = compact ? 26 : 30;
    const gap = compact ? 10 : 16;
    const railW = compact ? Math.max(76, Math.round(cw * 0.21)) : Math.max(126, Math.round(cw * 0.225));
    const webAvailW = cw - pad * 2 - gap - railW;
    const webAvailH = ch - pad * 2 - topBarH;

    // 保持微网页视口不压扁：按 520 : 640 比例缩放适应，并留一点舒展余量
    const scale = Math.min(webAvailW / PAGE_W, webAvailH / VIEWPORT_H);
    const vpW = Math.round(PAGE_W * scale);
    const vpH = Math.round(VIEWPORT_H * scale);
    const vpX = pad + Math.round((webAvailW - vpW) * 0.5);
    const vpY = pad + topBarH + Math.round((webAvailH - vpH) * 0.5);

    const railX = pad + webAvailW + gap;
    const railY = vpY;
    const railH = vpH;

    // 剖面缩略缩放：把整页 docH 完整画进右侧标尺内
    const railHeaderH = compact ? 22 : 26;
    const railTrackX = railX + (compact ? 6 : 10);
    const railTrackW = railW - (compact ? 12 : 20);
    const railTrackY = railY + railHeaderH;
    const railTrackH = railH - railHeaderH - (compact ? 26 : 32);
    const railScale = railTrackH / Math.max(VIEWPORT_H, layout.docH);

    return {
      compact,
      pad,
      topBarH,
      scale,
      vpX,
      vpY,
      vpW,
      vpH,
      railX,
      railY,
      railW,
      railH,
      railTrackX,
      railTrackY,
      railTrackW,
      railTrackH,
      railScale,
    };
  }

  // 把虚拟页面坐标转为画布像素坐标
  const toCanvasX = (g, vx) => g.vpX + vx * g.scale;
  const toCanvasY = (g, vy, scrollY) => g.vpY + (vy - scrollY) * g.scale;

  // ---------- 精细绘制各模块内容（1:1 承袭 261 原海报微网页插画） ----------
  function drawModuleVisual(modId, x, y, mw, mh, logicalH, sceneKey, isWrong, isSelected, inHeader, inFooter) {
    const sc = SCENES[sceneKey] || SCENES.editorial;
    const s = mw / (PAGE_W - 32);

    ctx.save();
    // 卡片底框（仅在错位、选中或主体次级卡时显示轻微外框，让正常状态忠实原海报整洁感）
    if (isWrong) {
      ctx.fillStyle = PALETTE.errBg;
      ctx.fillRect(x, y, mw, mh);
      ctx.strokeStyle = PALETTE.errRed;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(x + 0.75, y + 0.75, mw - 1.5, mh - 1.5);
      ctx.setLineDash([]);
    } else if (isSelected) {
      ctx.fillStyle = "rgba(246, 183, 25, 0.16)";
      ctx.fillRect(x - 2, y - 2, mw + 4, mh + 4);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 1.5, y - 1.5, mw + 3, mh + 3);
    }

    if (modId === "brand") {
      // 原海报顶黄条内：左侧深金圆 logo + 中间粗黑标题杠与细线 + 右侧菜单杠
      const r = Math.min(mh * 0.36, 18 * s);
      const cy = y + mh * 0.5;
      ctx.fillStyle = PALETTE.goldCircle;
      ctx.beginPath();
      ctx.arc(x + r + 6 * s, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // 品牌名与导航文字
      const textX = x + r * 2 + 16 * s;
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${Math.max(10, Math.round(12.5 * s))}px ${FONT_UI}`;
      ctx.textBaseline = "middle";
      ctx.fillText(sc.brandName, textX, cy - 6 * s);

      // 原海报风格细横线 + 导航项
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = `500 ${Math.max(9, Math.round(10 * s))}px ${FONT_UI}`;
      ctx.fillText(sc.navItems.join("  ·  "), textX, cy + 9 * s);

      // 若独自占整宽，右侧画原海报招牌两道短黑菜单杠
      if (mw > 340 * s) {
        const bx = x + mw - 38 * s;
        ctx.fillStyle = PALETTE.ink;
        ctx.fillRect(bx, cy - 5 * s, 26 * s, 2.2);
        ctx.fillRect(bx, cy + 3 * s, 20 * s, 2.2);
      }
    } else if (modId === "search") {
      // 搜索入口条 + 菜单双杠
      const boxH = Math.min(mh - 8, 28 * s);
      const by = y + (mh - boxH) * 0.5;
      ctx.fillStyle = inHeader ? "rgba(255,252,244,0.72)" : "#FAF5EC";
      ctx.fillRect(x + 4 * s, by, mw - 8 * s, boxH);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 4 * s, by, mw - 8 * s, boxH);

      // 极简放大镜几何图标
      const mx = x + 15 * s;
      const my = by + boxH * 0.5;
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(mx, my - 1, 4 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mx + 2.8 * s, my + 2 * s);
      ctx.lineTo(mx + 6 * s, my + 5.2 * s);
      ctx.stroke();

      ctx.fillStyle = PALETTE.ink;
      ctx.font = `500 ${Math.max(9, Math.round(10 * s))}px ${FONT_UI}`;
      ctx.textBaseline = "middle";
      ctx.fillText(mw > 180 * s ? "搜索全站内容 · 登录" : "搜索 · 菜单", mx + 12 * s, my);
    } else if (modId === "hero") {
      // 1:1 复刻原海报主体中段：左黑夜金日双波山峦图 + 右侧粗黑标题杠与六行细线
      if (logicalH < 110) {
        // 被错塞进页眉/页脚时的紧凑版
        const imgW = Math.min(82 * s, mh * 1.15);
        drawHeroArt(x + 6 * s, y + 6, imgW, mh - 12, sceneKey);
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `700 ${Math.max(10, Math.round(12 * s))}px ${FONT_UI}`;
        ctx.textBaseline = "top";
        ctx.fillText(sc.heroTitle, x + imgW + 14 * s, y + 10);
        ctx.fillStyle = PALETTE.inkMuted;
        ctx.font = `400 ${Math.max(9, Math.round(10 * s))}px ${FONT_UI}`;
        ctx.fillText(sc.heroSub, x + imgW + 14 * s, y + 30);
      } else {
        const leftW = Math.round(mw * 0.45);
        drawHeroArt(x, y, leftW, mh - 8, sceneKey);

        const rx = x + leftW + 16 * s;
        const rw = mw - leftW - 16 * s;
        // 粗黑主标题杠（原海报母题）
        ctx.fillStyle = PALETTE.ink;
        ctx.fillRect(rx, y + 4 * s, Math.min(rw * 0.72, 160 * s), Math.max(7, 9 * s));

        // 标题与导语真字（根据实际折行行数动态推算副标题与横线坐标，窄画布绝不叠字）
        const titleFont = Math.max(9.5, Math.round(12.5 * s));
        const titleLH = Math.max(12, Math.round(titleFont * 1.28));
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `700 ${titleFont}px ${FONT_UI}`;
        ctx.textBaseline = "top";
        const titleTop = y + Math.max(11, 20 * s);
        const titleRows = drawWrappedText(sc.heroTitle, rx, titleTop, rw, titleLH, 2);

        const subFont = Math.max(8.5, Math.round(10.5 * s));
        const subLH = Math.max(11, Math.round(subFont * 1.28));
        const subTop = titleTop + titleRows * titleLH + 4;
        ctx.fillStyle = PALETTE.inkMuted;
        ctx.font = `400 ${subFont}px ${FONT_UI}`;
        const subRows = drawWrappedText(sc.heroSub, rx, subTop, rw, subLH, 2);

        // 原海报招牌六道细横文本韵律线
        const lineTop = subTop + subRows * subLH + 7;
        const ratios = [1, 0.96, 1, 0.92, 0.98, 0.76];
        ctx.fillStyle = PALETTE.lineMuted;
        ratios.forEach((r, i) => {
          const ly = lineTop + i * Math.max(7, 11.5 * s);
          if (ly < y + mh - 10) ctx.fillRect(rx, ly, rw * r, 1.3);
        });
      }
    } else if (modId === "cards") {
      // 1:1 复刻原海报：左双列要点清单 + 右三联框（金圆 ● / 黑三角 ▲ / 金方 ■）
      if (logicalH < 115) {
        // 紧凑塞在页眉/页脚时横排三图符
        const boxS = Math.min(44 * s, mh - 20);
        for (let i = 0; i < 3; i++) {
          const bx = x + 10 * s + i * (boxS + 12 * s);
          const by = y + (mh - boxS) * 0.5;
          drawTriShapeCard(bx, by, boxS, i, sc.cardLabels[i], false);
        }
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `700 ${Math.max(10, Math.round(11.5 * s))}px ${FONT_UI}`;
        ctx.textBaseline = "middle";
        ctx.fillText("三联要点与细节模块", x + 10 * s + 3 * (boxS + 12 * s) + 6, y + mh * 0.5);
      } else {
        const leftW = Math.round(mw * 0.44);
        // 左侧双列小要点列表（1:1 复刻原海报黑块 + 细黄杠 + 圆点列表）
        const colW = (leftW - 14 * s) * 0.5;
        for (let c = 0; c < 2; c++) {
          const cx = x + c * (colW + 14 * s);
          const cy = y + 8 * s;
          ctx.fillStyle = PALETTE.ink;
          ctx.fillRect(cx, cy, colW * 0.65, 6 * s);
          ctx.fillStyle = PALETTE.headerGold;
          ctx.fillRect(cx, cy + 12 * s, colW * 0.36, 2.2);

          const labels = c === 0 ? sc.listLeft : sc.listRight;
          const showLabelText = colW >= 62;
          for (let r = 0; r < 4; r++) {
            const ry = cy + 26 * s + r * 22 * s;
            if (ry > y + mh - 12) break;
            ctx.fillStyle = PALETTE.ink;
            ctx.beginPath();
            ctx.arc(cx + 3 * s, ry, 2 * s, 0, Math.PI * 2);
            ctx.fill();
            if (showLabelText && r < labels.length) {
              ctx.fillStyle = PALETTE.inkMuted;
              ctx.font = `500 ${Math.max(9, Math.round(9.5 * s))}px ${FONT_UI}`;
              ctx.textBaseline = "middle";
              ctx.fillText(labels[r], cx + 9 * s, ry);
            } else {
              ctx.fillStyle = PALETTE.lineMuted;
              ctx.fillRect(cx + 9 * s, ry - 0.7, Math.max(14, colW - 12 * s) * (r % 2 ? 0.78 : 0.95), 1.3);
            }
          }
          if (c === 0) {
            ctx.strokeStyle = PALETTE.borderSoft;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx + colW + 7 * s, cy);
            ctx.lineTo(cx + colW + 7 * s, y + mh - 10 * s);
            ctx.stroke();
          }
        }

        // 右侧三联卡片（金圆 ● / 黑三角 ▲ / 金方 ■ + 三道细文字线）
        const rx = x + leftW + 16 * s;
        const rw = mw - leftW - 16 * s;
        const cardGap = 10 * s;
        const cardW = (rw - cardGap * 2) / 3;
        const boxH = Math.min(cardW, mh * 0.56);
        for (let i = 0; i < 3; i++) {
          const cx = rx + i * (cardW + cardGap);
          drawTriShapeCard(cx, y + 6 * s, cardW, i, sc.cardLabels[i], true, boxH);
        }
      }
    } else if (modId === "links") {
      // 三栏次级导航 / 门垫链接
      const cols = sc.linksCols;
      const colW = (mw - 24 * s) / 3;
      const top = y + 8 * s;
      cols.forEach((title, i) => {
        const cx = x + 8 * s + i * (colW + 4 * s);
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `700 ${Math.max(9, Math.round(10.5 * s))}px ${FONT_UI}`;
        ctx.textBaseline = "top";
        ctx.fillText(title, cx, top);
        ctx.fillStyle = PALETTE.lineMuted;
        for (let r = 0; r < 2; r++) {
          const ly = top + 18 * s + r * 11 * s;
          if (ly < y + mh - 6) ctx.fillRect(cx, ly, colW * (0.72 - r * 0.16), 1.5);
        }
      });
    } else if (modId === "legal") {
      // 1:1 复刻原海报底部浅沙收束条：左深金圆 + 两道收束横线/版权语 + 右三枚黑圆点 • • •
      const r = Math.min(mh * 0.32, 13 * s);
      const cy = y + mh * 0.5;
      ctx.fillStyle = PALETTE.goldCircle;
      ctx.beginPath();
      ctx.arc(x + r + 8 * s, cy, r, 0, Math.PI * 2);
      ctx.fill();

      const tx = x + r * 2 + 18 * s;
      const rightReserve = isWrong ? 116 : 46 * s;
      const availTextW = Math.max(40, x + mw - rightReserve - tx);
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `500 ${Math.max(9, Math.round(10.5 * s))}px ${FONT_UI}`;
      ctx.textBaseline = "middle";
      let legalDisplay = sc.legalText;
      while (legalDisplay.length > 6 && ctx.measureText(legalDisplay).width > availTextW) {
        legalDisplay = legalDisplay.slice(0, -2) + "…";
      }
      ctx.fillText(legalDisplay, tx, cy - 5 * s);

      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(tx, cy + 7 * s, Math.min(130 * s, mw * 0.34), 2);
      ctx.fillStyle = PALETTE.lineMuted;
      ctx.fillRect(tx + Math.min(138 * s, mw * 0.36), cy + 7 * s, Math.min(72 * s, mw * 0.18), 1.4);

      // 右侧原海报招牌三黑点 • • •
      const dotR = Math.max(2.2, 3 * s);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = PALETTE.ink;
        ctx.beginPath();
        ctx.arc(x + mw - (32 - i * 11) * s, cy, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 错段角标或拖拽小抓手点
    if (isWrong) {
      const badge = `错段 · 宜放${ZONE_LABELS[MODULES[modId].ideal].zh}`;
      ctx.font = `700 ${Math.max(9, Math.round(9.5 * s))}px ${FONT_UI}`;
      const bw = ctx.measureText(badge).width + 10;
      const bh = 16;
      ctx.fillStyle = PALETTE.errRed;
      ctx.fillRect(x + mw - bw - 3, y + 3, bw, bh);
      ctx.fillStyle = "#FAF5EC";
      ctx.textBaseline = "middle";
      ctx.fillText(badge, x + mw - bw + 2, y + 3 + bh * 0.5);
    } else if (isSelected) {
      const badge = `已选 · 拖移或 ↑↓`;
      ctx.font = `700 ${Math.max(9, Math.round(9.5 * s))}px ${FONT_UI}`;
      const bw = ctx.measureText(badge).width + 10;
      const bh = 16;
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(x + mw - bw - 3, y + 3, bw, bh);
      ctx.fillStyle = PALETTE.headerGold;
      ctx.textBaseline = "middle";
      ctx.fillText(badge, x + mw - bw + 2, y + 3 + bh * 0.5);
    }
    ctx.restore();
  }

  // 原海报主图：黑夜金日双波山峦 / SaaS 折线 / 出版刊双环
  function drawHeroArt(x, y, aw, ah, sceneKey) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, aw, ah);
    ctx.clip();

    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(x, y, aw, ah);

    if (sceneKey === "saas") {
      // SaaS：深墨底 + 细网格 + 金色阶梯增长曲线与节点
      ctx.strokeStyle = "rgba(244, 235, 222, 0.14)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const gy = y + (ah * i) / 4;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + aw, gy);
        ctx.stroke();
      }
      const pts = [
        [0.08, 0.78],
        [0.32, 0.64],
        [0.54, 0.52],
        [0.76, 0.34],
        [0.92, 0.22],
      ];
      ctx.fillStyle = "rgba(246, 183, 25, 0.24)";
      ctx.beginPath();
      ctx.moveTo(x + aw * pts[0][0], y + ah);
      pts.forEach(([px, py]) => ctx.lineTo(x + aw * px, y + ah * py));
      ctx.lineTo(x + aw * pts[pts.length - 1][0], y + ah);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = PALETTE.headerGold;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      pts.forEach(([px, py], i) => {
        if (i === 0) ctx.moveTo(x + aw * px, y + ah * py);
        else ctx.lineTo(x + aw * px, y + ah * py);
      });
      ctx.stroke();

      pts.forEach(([px, py], i) => {
        ctx.fillStyle = i === pts.length - 1 ? PALETTE.waveLight : PALETTE.headerGold;
        ctx.beginPath();
        ctx.arc(x + aw * px, y + ah * py, i === pts.length - 1 ? 5 : 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (sceneKey === "journal") {
      // 出版刊：包豪斯几何太阳与切分弧线
      const cx = x + aw * 0.5;
      const cy = y + ah * 0.52;
      const r = Math.min(aw, ah) * 0.34;
      ctx.fillStyle = PALETTE.headerGold;
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.footerBeige;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, cy);
      ctx.lineTo(x + aw, cy);
      ctx.stroke();
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(cx - r * 0.34, cy - r * 0.36, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 原海报默认：黑夜 + 金色圆日 + 浅金后山波 + 亮金前景波
      ctx.fillStyle = PALETTE.waveLight;
      ctx.beginPath();
      ctx.arc(x + aw * 0.27, y + ah * 0.44, Math.min(aw, ah) * 0.085, 0, Math.PI * 2);
      ctx.fill();

      // 后层浅金波浪山
      ctx.fillStyle = PALETTE.waveLight;
      ctx.beginPath();
      ctx.moveTo(x, y + ah);
      ctx.lineTo(x, y + ah * 0.62);
      ctx.bezierCurveTo(
        x + aw * 0.28,
        y + ah * 0.52,
        x + aw * 0.38,
        y + ah * 0.72,
        x + aw * 0.62,
        y + ah * 0.54
      );
      ctx.bezierCurveTo(x + aw * 0.78, y + ah * 0.42, x + aw * 0.9, y + ah * 0.40, x + aw, y + ah * 0.44);
      ctx.lineTo(x + aw, y + ah);
      ctx.closePath();
      ctx.fill();

      // 前层亮芥末金波浪山
      ctx.fillStyle = PALETTE.waveDeep;
      ctx.beginPath();
      ctx.moveTo(x, y + ah);
      ctx.lineTo(x, y + ah * 0.72);
      ctx.bezierCurveTo(
        x + aw * 0.24,
        y + ah * 0.60,
        x + aw * 0.44,
        y + ah * 0.84,
        x + aw * 0.68,
        y + ah * 0.66
      );
      ctx.bezierCurveTo(x + aw * 0.84, y + ah * 0.54, x + aw * 0.94, y + ah * 0.55, x + aw, y + ah * 0.58);
      ctx.lineTo(x + aw, y + ah);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 原海报三联框：金圆 ● / 黑三角 ▲ / 金方 ■
  function drawTriShapeCard(x, y, cw, idx, label, withLines = true, boxH = cw) {
    ctx.save();
    ctx.strokeStyle = PALETTE.inkMuted;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cw, boxH);

    const cx = x + cw * 0.5;
    const cy = y + boxH * 0.5;
    const r = Math.min(cw, boxH) * 0.24;

    if (idx === 0) {
      ctx.fillStyle = PALETTE.headerGold;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (idx === 1) {
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 1.12, cy + r * 0.92);
      ctx.lineTo(cx - r * 1.12, cy + r * 0.92);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = PALETTE.goldCircle;
      ctx.fillRect(cx - r * 0.92, cy - r * 0.92, r * 1.84, r * 1.84);
    }

    if (withLines) {
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${Math.max(9, Math.round(cw * 0.16))}px ${FONT_UI}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(label, cx, y + boxH + 8);
      ctx.textAlign = "left";

      ctx.fillStyle = PALETTE.lineMuted;
      for (let k = 0; k < 3; k++) {
        const ly = y + boxH + 25 + k * 9;
        ctx.fillRect(x + cw * 0.08, ly, cw * (0.84 - k * 0.14), 1.2);
      }
    }
    ctx.restore();
  }

  function drawWrappedText(text, x, y, maxW, lineH, maxLines) {
    let line = "";
    let row = 0;
    for (const ch of text) {
      const next = line + ch;
      if (ctx.measureText(next).width > maxW && line) {
        ctx.fillText(line, x, y + row * lineH);
        row++;
        if (row >= maxLines) return row;
        line = ch;
      } else {
        line = next;
      }
    }
    if (line && row < maxLines) {
      ctx.fillText(line, x, y + row * lineH);
      row++;
    }
    return Math.max(1, row);
  }

  // 斜线警戒填充（用于吞屏遮挡或短页页脚悬空）
  function drawHatchRect(x, y, rw, rh, strokeColor, bgColor) {
    if (rw <= 0 || rh <= 0) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, rw, rh);
    ctx.clip();
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, rw, rh);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    const step = 14;
    ctx.beginPath();
    for (let d = -rh; d < rw + rh; d += step) {
      ctx.moveTo(x + d, y);
      ctx.lineTo(x + d - rh, y + rh);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 绘制 ▼ / ▲ 分界推拉手柄
  function drawEdgeHandle(cx, cy, dir, label, active) {
    ctx.save();
    const pillW = active ? 106 : 94;
    const pillH = 18;
    ctx.fillStyle = active ? PALETTE.headerGold : PALETTE.ink;
    ctx.fillRect(cx - pillW * 0.5, cy - pillH * 0.5, pillW, pillH);
    ctx.fillStyle = active ? PALETTE.ink : PALETTE.canvasPaper;
    ctx.font = `600 10px ${FONT_MONO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dir === "down" ? `▼ ${label}` : `▲ ${label}`, cx, cy + 0.5);
    ctx.restore();
  }

  // ---------- 主渲染函数 ----------
  function render(t, dt, { still }) {
    if (sizeDirty) syncCanvasSize();

    // 开场轻缓动 & 巡检推进
    let needsMore = false;
    if (still) {
      if (intro !== 1) {
        intro = 1;
        dirty = true;
      }
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 2.6);
      needsMore = true;
    }

    const state = getState();
    if (tourActive && !still) {
      tourPhase += Math.max(dt, 0.016) * 0.24;
      pulsePhase += Math.max(dt, 0.016) * 6;
      if (tourPhase >= 1) {
        tourActive = false;
        tourPhase = 1;
        setState({ ...state, scrollNorm: 1 }, { silentStage: true });
      } else {
        setState({ ...state, scrollNorm: tourPhase }, { silentStage: true });
      }
      needsMore = true;
    }

    if (!dirty && !needsMore) return;
    dirty = false;

    const layout = computeLayout(getState());
    if (onLayout) onLayout(layout, getState());

    const g = computeCanvasGeom(w, h, layout);
    geom = g;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 画布外底：暖燕麦原海报底
    ctx.fillStyle = PALETTE.outerPaper;
    ctx.fillRect(0, 0, w, h);

    const sc = SCENES[state.scene] || SCENES.editorial;

    // 顶部极简浏览器信息条（与左网页窗对齐，严格防与右侧状态章碰撞）
    const topMidY = g.pad + g.topBarH * 0.5;
    const statusOk = layout.passCount === 4;
    ctx.font = `700 ${g.compact ? 10 : 11}px ${FONT_MONO}`;
    const badgeW = ctx.measureText(layout.statusTag).width + 16;
    const badgeX = g.vpX + g.vpW - badgeW;

    ctx.fillStyle = PALETTE.ink;
    ctx.font = `600 ${g.compact ? 10 : 11}px ${FONT_MONO}`;
    ctx.textBaseline = "middle";
    const maxLeftW = Math.max(60, badgeX - g.vpX - 10);
    const fullLabel = `${sc.url}  ·  640px 视口 · 滚 ${layout.scrollY}px`;
    const midLabel = `640px 视口 · 已滚 ${layout.scrollY}px`;
    const shortLabel = `640px · 滚 ${layout.scrollY}px`;
    const leftText =
      ctx.measureText(fullLabel).width <= maxLeftW
        ? fullLabel
        : ctx.measureText(midLabel).width <= maxLeftW
          ? midLabel
          : shortLabel;
    ctx.fillText(leftText, g.vpX, topMidY);

    ctx.font = `700 ${g.compact ? 10 : 11}px ${FONT_MONO}`;
    ctx.fillStyle = statusOk ? PALETTE.okGreen : PALETTE.errRed;
    ctx.fillRect(badgeX, topMidY - 10, badgeW, 20);
    ctx.fillStyle = "#FAF5EC";
    ctx.textAlign = "center";
    ctx.fillText(layout.statusTag, badgeX + badgeW * 0.5, topMidY + 0.5);
    ctx.textAlign = "left";

    // ---------- 左侧 76%：原海报微网页活体视口 ----------
    ctx.save();
    // 1px 原海报细暖灰框 + 内底暖燕麦纸
    ctx.fillStyle = PALETTE.canvasPaper;
    ctx.fillRect(g.vpX, g.vpY, g.vpW, g.vpH);

    // 裁切视口内部
    ctx.beginPath();
    ctx.rect(g.vpX, g.vpY, g.vpW, g.vpH);
    ctx.clip();

    const sy = layout.scrollY;
    const easeIntro = 1 - (1 - intro) ** 3;
    const yOffIntro = (1 - easeIntro) * 14;

    // 1) 页眉带（原海报柔金黄 #F8C84B）
    const hY = toCanvasY(g, layout.header.y, sy) + yOffIntro;
    const hH = layout.header.h * g.scale;
    if (layout.header.h > 0) {
      ctx.fillStyle = PALETTE.headerYellow;
      ctx.fillRect(g.vpX, hY, g.vpW, hH);
      if (state.highlightBand === "header" || drag.hoverZone === "header") {
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(g.vpX + 2, hY + 2, g.vpW - 4, hH - 4);
      }
      for (const item of layout.header.items) {
        if (drag.mode === "module" && drag.modId === item.id) continue;
        drawModuleVisual(
          item.id,
          toCanvasX(g, item.x),
          hY + item.y * g.scale,
          item.w * g.scale,
          item.h * g.scale,
          item.h,
          state.scene,
          item.wrong,
          state.selectedMod === item.id,
          true,
          false
        );
      }
    } else {
      // 无头失向警示槽
      const emptyH = 38 * g.scale;
      drawHatchRect(g.vpX, g.vpY, g.vpW, emptyH, "rgba(181,43,30,0.45)", PALETTE.errBg);
      ctx.fillStyle = PALETTE.errRed;
      ctx.font = `700 ${g.compact ? 10 : 11}px ${FONT_UI}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("× 页眉为空（无头失向）· 拖入「品牌与主导航」", g.vpX + g.vpW * 0.5, g.vpY + emptyH * 0.5);
      ctx.textAlign = "left";
    }

    // 2) 主体带（暖燕麦纸）
    const bY = toCanvasY(g, layout.body.y, sy) + yOffIntro;
    const bH = layout.body.h * g.scale;
    if (state.highlightBand === "body" || drag.hoverZone === "body") {
      ctx.fillStyle = "rgba(246, 183, 25, 0.08)";
      ctx.fillRect(g.vpX, bY, g.vpW, bH);
      ctx.strokeStyle = PALETTE.headerGold;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(g.vpX + 2, bY + 2, g.vpW - 4, bH - 4);
      ctx.setLineDash([]);
    }
    for (const item of layout.body.items) {
      if (drag.mode === "module" && drag.modId === item.id) continue;
      drawModuleVisual(
        item.id,
        toCanvasX(g, item.x),
        bY + item.y * g.scale,
        item.w * g.scale,
        item.h * g.scale,
        item.h,
        state.scene,
        item.wrong,
        state.selectedMod === item.id,
        false,
        false
      );
    }

    // 长文/标准正文延伸排版韵律线（让滚动时真实感受到正文流在脚下流过）
    const extraStart = layout.body.items.length
      ? layout.body.items[layout.body.items.length - 1].y + layout.body.items[layout.body.items.length - 1].h + 24
      : 28;
    const extraEnd = layout.body.h - 20;
    if (extraEnd - extraStart > 28) {
      ctx.fillStyle = PALETTE.ink;
      const paraTop = bY + extraStart * g.scale;
      ctx.fillRect(toCanvasX(g, 16), paraTop, 94 * g.scale, 5 * g.scale);
      ctx.fillStyle = PALETTE.lineMuted;
      let py = extraStart + 18;
      let row = 0;
      while (py < extraEnd - 10) {
        const isBreak = row > 0 && row % 4 === 0;
        if (isBreak) py += 12;
        if (py >= extraEnd - 10) break;
        const lineW = (row % 4 === 3 ? 0.68 : 0.94 - (row % 2) * 0.05) * (PAGE_W - 32);
        ctx.fillRect(toCanvasX(g, 16), bY + py * g.scale, lineW * g.scale, 1.4);
        py += 15;
        row++;
      }
    }

    // 3) 原海报标志性水平虚线分隔 + 暖沙页脚带
    const fY = toCanvasY(g, layout.footer.y, sy) + yOffIntro;
    const fH = layout.footer.h * g.scale;

    ctx.strokeStyle = PALETTE.borderGrey;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(g.vpX + 8, fY);
    ctx.lineTo(g.vpX + g.vpW - 8, fY);
    ctx.stroke();
    ctx.setLineDash([]);

    if (layout.footer.h > 0) {
      ctx.fillStyle = PALETTE.footerBeige;
      ctx.fillRect(g.vpX, fY, g.vpW, fH);
      if (state.highlightBand === "footer" || drag.hoverZone === "footer") {
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(g.vpX + 2, fY + 2, g.vpW - 4, fH - 4);
      }
      for (const item of layout.footer.items) {
        if (drag.mode === "module" && drag.modId === item.id) continue;
        drawModuleVisual(
          item.id,
          toCanvasX(g, item.x),
          fY + item.y * g.scale,
          item.w * g.scale,
          item.h * g.scale,
          item.h,
          state.scene,
          item.wrong,
          state.selectedMod === item.id,
          false,
          true
        );
      }
    } else {
      // 无尾断崖槽
      const emptyY = Math.min(g.vpY + g.vpH - 36 * g.scale, fY);
      const emptyH = 36 * g.scale;
      drawHatchRect(g.vpX, emptyY, g.vpW, emptyH, "rgba(181,43,30,0.45)", PALETTE.errBg);
      ctx.fillStyle = PALETTE.errRed;
      ctx.font = `700 ${g.compact ? 10 : 11}px ${FONT_UI}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("× 缺少页脚（无尾断崖）· 拖入「版权与隐私兜底」", g.vpX + g.vpW * 0.5, emptyY + emptyH * 0.5);
      ctx.textAlign = "left";
    }

    // 4) 短页脚下悬空实测区
    if (layout.footer.floatGap > 0) {
      const gapY = fY + fH;
      const gapH = layout.footer.floatGap * g.scale;
      drawHatchRect(g.vpX, gapY, g.vpW, gapH, "rgba(181,43,30,0.42)", "rgba(181,43,30,0.08)");
      ctx.fillStyle = PALETTE.errRed;
      ctx.font = `700 ${g.compact ? 10 : 11}px ${FONT_UI}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`× 页脚悬空 +${layout.footer.floatGap}px（开启粘底锁消除断层）`, g.vpX + g.vpW * 0.5, gapY + gapH * 0.5);
      ctx.textAlign = "left";
    }

    // 5) 滚动时的吸顶叠加层（让吸顶吞屏肉眼可见！）
    if (sy > 4 && layout.header.h > 0 && state.stickyMode !== "scroll") {
      const sH = layout.sticky.height * g.scale;
      ctx.save();
      ctx.fillStyle = PALETTE.headerYellow;
      ctx.fillRect(g.vpX, g.vpY, g.vpW, sH);
      // 底部阴影线
      ctx.fillStyle = "rgba(20, 20, 18, 0.22)";
      ctx.fillRect(g.vpX, g.vpY + sH, g.vpW, 3);

      if (state.stickyMode === "compact") {
        // 紧凑吸顶条：只保留金圆 + 站点名 + 精简导航 + 54px 绿标
        const cy = g.vpY + sH * 0.5;
        ctx.fillStyle = PALETTE.goldCircle;
        ctx.beginPath();
        ctx.arc(g.vpX + 20 * g.scale, cy, 9 * g.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `700 ${Math.max(10, Math.round(11.5 * g.scale))}px ${FONT_UI}`;
        ctx.textBaseline = "middle";
        ctx.fillText(`${sc.brandName}   ${sc.navItems.join(" · ")}`, g.vpX + 36 * g.scale, cy);
        ctx.fillStyle = PALETTE.okGreen;
        ctx.font = `600 10px ${FONT_MONO}`;
        ctx.textAlign = "right";
        ctx.fillText(`紧凑吸顶 ${layout.sticky.height}px`, g.vpX + g.vpW - 10, cy);
        ctx.textAlign = "left";
      } else {
        // 死锁吸顶：全高页眉压在正文上
        for (const item of layout.header.items) {
          drawModuleVisual(
            item.id,
            toCanvasX(g, item.x),
            g.vpY + item.y * g.scale,
            item.w * g.scale,
            item.h * g.scale,
            item.h,
            state.scene,
            item.wrong,
            state.selectedMod === item.id,
            true,
            false
          );
        }
        if (layout.sticky.height > 86) {
          // 在超标吸顶底部画出朱红斜线吞屏警示带
          const warnH = Math.max(22, (layout.sticky.height - 64) * g.scale);
          drawHatchRect(g.vpX, g.vpY + sH - warnH, g.vpW, warnH, "rgba(181,43,30,0.48)", "rgba(181,43,30,0.16)");
          ctx.fillStyle = PALETTE.errRed;
          ctx.fillRect(g.vpX + 10, g.vpY + sH - 22, Math.min(g.vpW - 20, 238), 18);
          ctx.fillStyle = "#FAF5EC";
          ctx.font = `700 10px ${FONT_UI}`;
          ctx.textBaseline = "middle";
          ctx.fillText(`× 死锁吸顶吞屏 ${layout.sticky.pctVp}%（挡住正文）`, g.vpX + 16, g.vpY + sH - 13);
        }
      }
      ctx.restore();
    }

    // 6) 页眉底沿 ▼ 与页脚顶沿 ▲ 推拉句柄（仅在视口内可见时画）
    if (layout.header.h > 0) {
      const edgeY = sy > 4 && state.stickyMode === "locked" ? g.vpY + layout.sticky.height * g.scale : hY + hH;
      if (edgeY > g.vpY + 14 && edgeY < g.vpY + g.vpH - 14) {
        drawEdgeHandle(g.vpX + g.vpW * 0.5, edgeY, "down", `页眉 ${layout.header.h}px`, drag.mode === "headerEdge");
      }
    }
    if (layout.footer.h > 0 && fY > g.vpY + 24 && fY < g.vpY + g.vpH - 14) {
      drawEdgeHandle(g.vpX + g.vpW * 0.5, fY, "up", `页脚 ${layout.footer.h}px`, drag.mode === "footerEdge");
    }

    // 7) Space 自动巡检视线扫描光带
    if (tourActive) {
      const beamY = g.vpY + (0.18 + tourPhase * 0.64) * g.vpH;
      const stageName = tourPhase < 0.25 ? "① 定位 FRAMING" : tourPhase < 0.78 ? "② 序列 SEQUENCE" : "③ 闭合 CLOSURE";
      ctx.fillStyle = "rgba(246, 183, 25, 0.22)";
      ctx.fillRect(g.vpX, beamY - 12, g.vpW, 24);
      ctx.strokeStyle = PALETTE.headerGold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(g.vpX, beamY);
      ctx.lineTo(g.vpX + g.vpW, beamY);
      ctx.stroke();
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(g.vpX + 10, beamY - 10, 128, 20);
      ctx.fillStyle = PALETTE.headerGold;
      ctx.font = `700 10px ${FONT_UI}`;
      ctx.textBaseline = "middle";
      ctx.fillText(`巡检 · ${stageName}`, g.vpX + 16, beamY);
    }

    // 8) 正在拖拽部件时的落位目标指示层
    if (drag.mode === "module" && drag.modId) {
      const zoneRects = getDropZonesCanvas(g, layout);
      for (const zk of ZONE_KEYS) {
        const zr = zoneRects[zk];
        const isHover = drag.hoverZone === zk;
        ctx.save();
        ctx.fillStyle = isHover ? "rgba(246, 183, 25, 0.28)" : "rgba(20, 20, 18, 0.05)";
        ctx.fillRect(zr.x, zr.y, zr.w, zr.h);
        ctx.strokeStyle = isHover ? PALETTE.ink : PALETTE.borderGrey;
        ctx.lineWidth = isHover ? 2.5 : 1.2;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(zr.x + 2, zr.y + 2, zr.w - 4, zr.h - 4);
        ctx.setLineDash([]);
        ctx.fillStyle = isHover ? PALETTE.ink : PALETTE.inkMuted;
        ctx.font = `700 ${g.compact ? 10 : 12}px ${FONT_UI}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`松手放入「${ZONE_LABELS[zk].zh} ${ZONE_LABELS[zk].en}」`, zr.x + zr.w * 0.5, zr.y + zr.h * 0.5);
        ctx.restore();
      }
    }

    ctx.restore(); // 结束视口裁剪

    // 视口细框描边
    ctx.strokeStyle = PALETTE.borderGrey;
    ctx.lineWidth = 1.25;
    ctx.strokeRect(g.vpX + 0.5, g.vpY + 0.5, g.vpW - 1, g.vpH - 1);

    // ---------- 右侧 24%：整页全长滚动剖面标尺 ----------
    drawScrollProfileRail(g, layout, state);

    // 正在拖拽中的浮动模块预览卡（不受视口裁剪）
    if (drag.mode === "module" && drag.modId) {
      const m = MODULES[drag.modId];
      const fw = Math.min(210, g.vpW * 0.62);
      const fh = 42;
      const fx = Math.max(8, Math.min(w - fw - 8, drag.curX - fw * 0.5));
      const fy = Math.max(8, Math.min(h - fh - 8, drag.curY - fh * 0.5));
      ctx.save();
      ctx.fillStyle = "rgba(20,20,18,0.18)";
      ctx.fillRect(fx + 4, fy + 5, fw, fh);
      ctx.fillStyle = PALETTE.inkDark;
      ctx.fillRect(fx, fy, fw, fh);
      ctx.strokeStyle = PALETTE.headerGold;
      ctx.lineWidth = 2;
      ctx.strokeRect(fx, fy, fw, fh);
      ctx.fillStyle = PALETTE.headerGold;
      ctx.font = `700 11px ${FONT_UI}`;
      ctx.textBaseline = "middle";
      ctx.fillText(`拖动中 · ${m.title}`, fx + 10, fy + 15);
      ctx.fillStyle = PALETTE.outerPaper;
      ctx.font = `500 9.5px ${FONT_MONO}`;
      ctx.fillText(m.en, fx + 10, fy + 31);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawScrollProfileRail(g, layout, state) {
    ctx.save();
    // 外框
    ctx.fillStyle = "#FAF5EC";
    ctx.fillRect(g.railX, g.railY, g.railW, g.railH);
    ctx.strokeStyle = PALETTE.borderSoft;
    ctx.lineWidth = 1;
    ctx.strokeRect(g.railX + 0.5, g.railY + 0.5, g.railW - 1, g.railH - 1);

    // 标题
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 ${g.compact ? 9.5 : 10.5}px ${FONT_UI}`;
    ctx.textBaseline = "middle";
    ctx.fillText(g.compact ? "滚动剖面" : "整页滚动剖面", g.railTrackX, g.railY + (g.compact ? 11 : 13));

    const tx = g.railTrackX;
    const ty = g.railTrackY;
    const tw = g.railTrackW;
    const th = g.railTrackH;
    const sc = g.railScale;

    // 文档三段真实比例微缩色条
    const hh = layout.header.h * sc;
    const bh = layout.body.h * sc;
    const fh = layout.footer.h * sc;

    // 背景
    ctx.fillStyle = "#ECE7DD";
    ctx.fillRect(tx, ty, tw, th);

    // 1) 页眉色块
    if (hh > 0) {
      ctx.fillStyle = PALETTE.headerGold;
      ctx.fillRect(tx, ty, tw, hh);
    }
    // 2) 主体色块
    ctx.fillStyle = PALETTE.canvasPaper;
    ctx.fillRect(tx, ty + hh, tw, bh);
    // 主体微缩内容线条
    ctx.fillStyle = "rgba(20,20,18,0.22)";
    if (bh > 18) {
      ctx.fillRect(tx + 6, ty + hh + 6, tw * 0.4, Math.min(26, bh * 0.34));
      ctx.fillStyle = "rgba(20,20,18,0.12)";
      ctx.fillRect(tx + 6 + tw * 0.44, ty + hh + 6, tw * 0.44, 6);
      ctx.fillRect(tx + 6 + tw * 0.44, ty + hh + 16, tw * 0.36, 4);
    }
    // 3) 页脚色块
    if (fh > 0) {
      ctx.fillStyle = PALETTE.inkDark;
      ctx.fillRect(tx, ty + hh + bh, tw, fh);
    }
    // 4) 短页悬空红斜线区
    if (layout.footer.floatGap > 0) {
      drawHatchRect(tx, ty + hh + bh + fh, tw, layout.footer.floatGap * sc, "rgba(181,43,30,0.55)", "rgba(181,43,30,0.12)");
    }

    // 三段微标签（够高才写，防挤）
    ctx.font = `600 9.5px ${FONT_MONO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (hh >= 16) {
      ctx.fillStyle = PALETTE.ink;
      ctx.fillText(`眉 ${layout.header.h}`, tx + tw * 0.5, ty + hh * 0.5);
    }
    if (bh >= 22) {
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.fillText(`主 ${layout.body.pctDoc}%`, tx + tw * 0.5, ty + hh + bh * 0.5);
    }
    if (fh >= 16) {
      ctx.fillStyle = PALETTE.headerGold;
      ctx.fillText(`脚 ${layout.footer.h}`, tx + tw * 0.5, ty + hh + bh + fh * 0.5);
    }
    ctx.textAlign = "left";

    // 当前 640px 视口取景窗框
    const winY = ty + layout.scrollY * sc;
    const winH = Math.min(th, VIEWPORT_H * sc);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(tx - 1, winY, tw + 2, winH);

    // 若吸顶开启，在取景窗顶画出金色/红色吸顶占用标带
    if (layout.scrollY > 4 && layout.sticky.height > 0) {
      const sh = layout.sticky.height * sc;
      ctx.fillStyle = layout.sticky.height > 86 ? "rgba(181,43,30,0.34)" : "rgba(27,102,68,0.26)";
      ctx.fillRect(tx, winY, tw, sh);
    }

    // 取景窗右侧小拖把点
    ctx.fillStyle = PALETTE.headerGold;
    ctx.fillRect(tx + tw - 5, winY + winH * 0.5 - 8, 6, 16);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1;
    ctx.strokeRect(tx + tw - 5, winY + winH * 0.5 - 8, 6, 16);

    // 底部汇总读数
    const footY = g.railY + g.railH - (g.compact ? 12 : 15);
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.font = `500 ${g.compact ? 9 : 10}px ${FONT_MONO}`;
    ctx.textBaseline = "middle";
    ctx.fillText(g.compact ? `净 ${layout.sticky.clearPct}%` : `净窗 ${layout.sticky.clearPct}% · 总 ${layout.docH}px`, tx, footY);

    ctx.restore();
  }

  // 获取三个可放落区在画布上的视觉划分（用于拖拽模块时）
  function getDropZonesCanvas(g, layout) {
    const hBand = Math.max(g.vpH * 0.22, Math.min(g.vpH * 0.30, layout.header.h * g.scale));
    const fBand = Math.max(g.vpH * 0.22, Math.min(g.vpH * 0.30, layout.footer.h * g.scale));
    return {
      header: { x: g.vpX, y: g.vpY, w: g.vpW, h: hBand },
      body: { x: g.vpX, y: g.vpY + hBand, w: g.vpW, h: g.vpH - hBand - fBand },
      footer: { x: g.vpX, y: g.vpY + g.vpH - fBand, w: g.vpW, h: fBand },
    };
  }

  // ---------- 指针与命中逻辑 ----------
  function getLocalPt(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function hitTest(px, py) {
    if (!geom) return { kind: "none" };
    const state = getState();
    const layout = computeLayout(state);
    const g = geom;
    const sy = layout.scrollY;

    // 1. 右侧滚动剖面轨道
    if (px >= g.railX && px <= g.railX + g.railW && py >= g.railY && py <= g.railY + g.railH) {
      return { kind: "rail" };
    }

    // 2. 页眉底沿 ▼ 与页脚顶沿 ▲ 推拉柄
    if (px >= g.vpX && px <= g.vpX + g.vpW && py >= g.vpY && py <= g.vpY + g.vpH) {
      if (layout.header.h > 0) {
        const edgeY = sy > 4 && state.stickyMode === "locked" ? g.vpY + layout.sticky.height * g.scale : toCanvasY(g, layout.header.h, sy);
        if (Math.abs(py - edgeY) <= 13) return { kind: "headerEdge" };
      }
      if (layout.footer.h > 0) {
        const fEdgeY = toCanvasY(g, layout.footer.y, sy);
        if (Math.abs(py - fEdgeY) <= 13) return { kind: "footerEdge" };
      }

      // 3. 吸顶锁死层内命中的模块
      if (sy > 4 && state.stickyMode === "locked" && py <= g.vpY + layout.sticky.height * g.scale) {
        for (const item of layout.header.items) {
          const ix = toCanvasX(g, item.x);
          const iy = g.vpY + item.y * g.scale;
          if (px >= ix && px <= ix + item.w * g.scale && py >= iy && py <= iy + item.h * g.scale) {
            return { kind: "module", modId: item.id };
          }
        }
      }

      // 4. 三段内各个模块卡片
      const zones = [
        { base: layout.header.y, items: layout.header.items },
        { base: layout.body.y, items: layout.body.items },
        { base: layout.footer.y, items: layout.footer.items },
      ];
      for (const z of zones) {
        for (const item of z.items) {
          const ix = toCanvasX(g, item.x);
          const iy = toCanvasY(g, z.base + item.y, sy);
          if (px >= ix && px <= ix + item.w * g.scale && py >= iy && py <= iy + item.h * g.scale) {
            return { kind: "module", modId: item.id };
          }
        }
      }

      return { kind: "viewport" };
    }
    return { kind: "none" };
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const pt = getLocalPt(e);
    const hit = hitTest(pt.x, pt.y);
    const state = getState();

    tourActive = false;
    drag.pointerId = e.pointerId;
    drag.startX = pt.x;
    drag.startY = pt.y;
    drag.curX = pt.x;
    drag.curY = pt.y;
    drag.moved = false;
    drag.decidedAxis = false;
    drag.hoverZone = null;

    if (hit.kind === "headerEdge") {
      drag.mode = "headerEdge";
      drag.startVal = state.headerPad;
      canvas.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    } else if (hit.kind === "footerEdge") {
      drag.mode = "footerEdge";
      drag.startVal = state.footerPad;
      canvas.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    } else if (hit.kind === "rail") {
      drag.mode = "rail";
      applyRailScroll(pt.y);
      canvas.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    } else if (hit.kind === "module") {
      drag.mode = "pendingModule";
      drag.modId = hit.modId;
      drag.startVal = state.scrollNorm;
      setState({ ...state, selectedMod: hit.modId });
      // 鼠标直接捕获便于拖拽；触摸等待判断是水平滑滚还是拖模块/竖滚页
      if (e.pointerType !== "touch") {
        drag.mode = "module";
        canvas.setPointerCapture?.(e.pointerId);
      }
    } else if (hit.kind === "viewport") {
      drag.mode = "scrollH";
      drag.startVal = state.scrollNorm;
      if (e.pointerType !== "touch") canvas.setPointerCapture?.(e.pointerId);
    } else {
      drag.mode = null;
    }
    dirty = true;
  }

  function applyRailScroll(py) {
    if (!geom) return;
    const state = getState();
    const layout = computeLayout(state);
    const maxTrack = Math.max(1, geom.railTrackH - Math.min(geom.railTrackH, VIEWPORT_H * geom.railScale));
    const norm = Math.max(0, Math.min(1, (py - geom.railTrackY - VIEWPORT_H * geom.railScale * 0.5) / maxTrack));
    setState({ ...state, scrollNorm: norm });
  }

  function onPointerMove(e) {
    const pt = getLocalPt(e);
    if (!drag.mode) {
      // 更新悬停光标
      const hit = hitTest(pt.x, pt.y);
      canvas.style.cursor =
        hit.kind === "headerEdge" || hit.kind === "footerEdge"
          ? "ns-resize"
          : hit.kind === "module"
            ? "grab"
            : hit.kind === "rail"
              ? "ns-resize"
              : "ew-resize";
      return;
    }

    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;
    drag.curX = pt.x;
    drag.curY = pt.y;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;

    const state = getState();

    // 触摸按在模块上：若明显横向滑（例如 perf.mjs 左右拖），切为丝滑横向滚动巡检；若抓牢竖拖则拖模块
    if (drag.mode === "pendingModule") {
      if (Math.hypot(dx, dy) < 6) return;
      if (Math.abs(dx) >= Math.abs(dy) * 1.15) {
        drag.mode = "scrollH";
      } else {
        drag.mode = "module";
      }
    }

    if (drag.mode === "headerEdge") {
      const nextPad = Math.max(-18, Math.min(116, Math.round(drag.startVal + dy / (geom?.scale || 1))));
      setState({ ...state, headerPad: nextPad });
      e.preventDefault();
    } else if (drag.mode === "footerEdge") {
      const nextPad = Math.max(-14, Math.min(116, Math.round(drag.startVal - dy / (geom?.scale || 1))));
      setState({ ...state, footerPad: nextPad });
      e.preventDefault();
    } else if (drag.mode === "rail") {
      applyRailScroll(pt.y);
      e.preventDefault();
    } else if (drag.mode === "scrollH") {
      // 横拖平滑驱动滚屏巡检（并在短页没有滚动余量时微调页眉底线，确保无论何种状态横拖都有即时视觉反馈！）
      if (!drag.decidedAxis && Math.hypot(dx, dy) > 5) {
        drag.decidedAxis = true;
        if (Math.abs(dy) > Math.abs(dx) * 1.4 && e.pointerType === "touch") {
          drag.mode = null; // 把竖滑让给手机页面正常滚动
          return;
        }
      }
      const layout = computeLayout(state);
      if (layout.maxScroll > 10) {
        const nextNorm = Math.max(0, Math.min(1, drag.startVal + dx / Math.max(160, (geom?.vpW || 300) * 0.72)));
        setState({ ...state, scrollNorm: nextNorm });
      } else {
        const nextPad = Math.max(-14, Math.min(110, Math.round(state.headerPad + dx * 0.08)));
        setState({ ...state, headerPad: nextPad });
      }
      e.preventDefault();
    } else if (drag.mode === "module") {
      const layout = computeLayout(state);
      const zones = getDropZonesCanvas(geom, layout);
      let hover = null;
      for (const zk of ZONE_KEYS) {
        const zr = zones[zk];
        if (pt.y >= zr.y && pt.y <= zr.y + zr.h) {
          hover = zk;
          break;
        }
      }
      if (!hover) hover = pt.y < geom.vpY ? "header" : "footer";
      drag.hoverZone = hover;
      canvas.style.cursor = "grabbing";
      dirty = true;
      e.preventDefault();
    }
  }

  function onPointerUp() {
    if (!drag.mode) return;
    if (drag.mode === "module" && drag.moved && drag.modId && drag.hoverZone) {
      const state = getState();
      const next = moveModule(state, drag.modId, drag.hoverZone);
      setState(next);
    }
    drag.mode = null;
    drag.modId = null;
    drag.hoverZone = null;
    drag.pointerId = null;
    canvas.style.cursor = "default";
    dirty = true;
  }

  function onWheel(e) {
    // 只有指针位于画布内部且文档真有滚动余量、且未触边时消费滚轮，不锁死整页滚动
    const state = getState();
    const layout = computeLayout(state);
    if (layout.maxScroll <= 0) return;
    const delta = e.deltaY / (layout.maxScroll * 1.15);
    const next = Math.max(0, Math.min(1, state.scrollNorm + delta));
    if (Math.abs(next - state.scrollNorm) > 0.001) {
      e.preventDefault();
      tourActive = false;
      setState({ ...state, scrollNorm: next });
    }
  }

  // 显式兼容 touchstart/touchmove（确保 tools/perf.mjs 的 Input.dispatchTouchEvent 100% 触发丝滑重绘！）
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartScroll = 0;
  let touchAxis = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t0 = e.touches[0];
      touchStartX = t0.clientX;
      touchStartY = t0.clientY;
      touchStartScroll = getState().scrollNorm;
      touchAxis = null;
      tourActive = false;
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length !== 1 || drag.mode === "module" || drag.mode === "headerEdge" || drag.mode === "footerEdge" || drag.mode === "rail") return;
      const t0 = e.touches[0];
      const dx = t0.clientX - touchStartX;
      const dy = t0.clientY - touchStartY;
      if (!touchAxis && Math.hypot(dx, dy) > 4) {
        touchAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (touchAxis === "x") {
        e.preventDefault();
        const state = getState();
        const layout = computeLayout(state);
        if (layout.maxScroll > 10) {
          const nextNorm = Math.max(0, Math.min(1, touchStartScroll + dx / Math.max(150, w * 0.6)));
          setState({ ...state, scrollNorm: nextNorm });
        } else {
          const nextPad = Math.max(-14, Math.min(110, Math.round(state.headerPad + dx * 0.12)));
          setState({ ...state, headerPad: nextPad });
        }
        dirty = true;
      }
    },
    { passive: false }
  );

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  const runner = loop(canvas, render);

  return {
    redraw() {
      dirty = true;
      runner.draw();
    },
    markDirty() {
      dirty = true;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) runner.draw();
    },
    toggleTour() {
      const state = getState();
      if (tourActive) {
        tourActive = false;
      } else {
        tourActive = true;
        tourPhase = 0;
        setState({ ...state, scrollNorm: 0 }, { silentStage: true });
      }
      dirty = true;
      runner.draw();
    },
    isTouring() {
      return tourActive;
    },
  };
}

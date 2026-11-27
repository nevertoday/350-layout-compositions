// 183 矩形绕排 · 开场活体蓝图排印台（2D Canvas）+ 原海报「绕排示意」实时 SVG
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { COLS_CHAR, TOTAL_ROWS, clamp } from "./model.js";

const COLORS = {
  bg: "#01473F",
  bgSheet: "#003E37",
  gridLine: "rgba(233, 218, 185, 0.14)",
  gridStrong: "rgba(233, 218, 185, 0.34)",
  cream: "#F3E7C9",
  creamSoft: "#D5C9A8",
  gold: "#FEC43E",
  goldDeep: "#C99214",
  pineInk: "#052622",
  err: "#FF6B57",
  errSoft: "rgba(255, 107, 87, 0.18)",
  warn: "#F5B841",
  ok: "#5CE0A8",
  okSoft: "rgba(92, 224, 168, 0.16)",
};

export function createHeroStage(canvas, getEval, onMutate) {
  const ctx = canvas.getContext("2d");
  let cssW = 720;
  let cssH = 440;
  let dpr = 1;
  let sheet = { x: 40, y: 34, w: 640, h: 376, rowH: 29, fontSize: 16, compact: false };

  // 开场绘制推进 & 视线扫视验真动画状态（dirty-flag 省电渲染：静置 0 重绘，拖动每帧 1 次精准绘制）
  let introProgress = reducedMotion.matches ? 1 : 0;
  let scanActive = false;
  let scanProgress = 0; // 0..1 沿实绘行段行进
  let hoverPart = ""; // "move" | "resize-l" | "resize-r" | "resize-b" | "standoff" | ""
  let dirty = true;

  function computeLayout() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(260, Math.round(rect.width));
    cssH = Math.max(240, Math.round(rect.height));
    const isNarrow = cssW < 520;
    dpr = pixelRatio(isNarrow ? 1.5 : 2);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const leftRail = isNarrow ? 22 : 38;
    const rightRail = isNarrow ? 12 : 76;
    const topBar = isNarrow ? 26 : 32;
    const botBar = isNarrow ? 24 : 28;
    const w = Math.max(180, cssW - leftRail - rightRail);
    const h = Math.max(160, cssH - topBar - botBar);
    const rowH = h / TOTAL_ROWS;
    // 兼顾手机与桌面：每字符宽度不超过列宽/COLS_CHAR 且不超过行高 74%
    const maxFontByW = (w / COLS_CHAR) * 0.94;
    const maxFontByH = rowH * 0.66;
    const fontSize = clamp(Math.min(maxFontByW, maxFontByH), 10.5, 22);
    sheet = { x: leftRail, y: topBar, w, h, rowH, fontSize, compact: isNarrow };
  }

  function normToPx(ev) {
    return {
      bx0: sheet.x + ev.rect.left * sheet.w,
      bx1: sheet.x + ev.rect.right * sheet.w,
      by0: sheet.y + ev.rect.top * sheet.h,
      by1: sheet.y + ev.rect.bottom * sheet.h,
      ex0: sheet.x + ev.excl.left * sheet.w,
      ex1: sheet.x + ev.excl.right * sheet.w,
      ey0: sheet.y + ev.excl.top * sheet.h,
      ey1: sheet.y + ev.excl.bottom * sheet.h,
    };
  }

  // 绘制矩形图块内部：随三套语境变化（原海报纯金 / 杂志建筑立面 / 课件信息盒）
  function drawBlockArtwork(ev, px) {
    const bw = px.bx1 - px.bx0;
    const bh = px.by1 - px.by0;
    const x = px.bx0;
    const y = px.by0;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, bw, bh);
    ctx.clip();

    const kind = ev.state.context;
    if (kind === "poster") {
      // 1:1 承袭 183 原海报招牌纯金矩形块
      ctx.fillStyle = COLORS.gold;
      ctx.fillRect(x, y, bw, bh);
      // 细微建筑内框边线，呼应印版裁切规线
      ctx.strokeStyle = "rgba(5, 38, 34, 0.22)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 6, y + 6, Math.max(0, bw - 12), Math.max(0, bh - 12));
    } else if (kind === "magazine") {
      // 杂志建筑摄影立面（纯粹现代主义几何光影，无人物五官）
      ctx.fillStyle = "#0F5E53";
      ctx.fillRect(x, y, bw, bh);
      // 天空与斜射阳光面
      ctx.fillStyle = "#1B7A6C";
      ctx.fillRect(x, y, bw, bh * 0.44);
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.moveTo(x + bw * 0.56, y);
      ctx.lineTo(x + bw, y);
      ctx.lineTo(x + bw, y + bh * 0.72);
      ctx.lineTo(x + bw * 0.26, y + bh * 0.72);
      ctx.closePath();
      ctx.fill();
      // 混凝土柱网网格
      ctx.fillStyle = "#07342E";
      ctx.fillRect(x, y + bh * 0.72, bw, bh * 0.28);
      ctx.strokeStyle = "#E9DAB9";
      ctx.lineWidth = 1.5;
      const cols = 4;
      for (let i = 1; i < cols; i++) {
        const cx = x + (bw / cols) * i;
        ctx.beginPath();
        ctx.moveTo(cx, y + bh * 0.14);
        ctx.lineTo(cx, y + bh * 0.72);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(x, y + bh * 0.44);
      ctx.lineTo(x + bw, y + bh * 0.44);
      ctx.stroke();
      // 底部摄影图注条
      ctx.fillStyle = "#042622";
      ctx.fillRect(x, y + bh - 22, bw, 22);
      ctx.fillStyle = COLORS.cream;
      ctx.font = `500 ${sheet.compact ? 9.5 : 10.5}px "IBM Plex Mono", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      if (bw > 74) ctx.fillText("FIG.04 · 建筑立面", x + 8, y + bh - 11);
    } else {
      // 课件页面 · 要点信息盒
      ctx.fillStyle = "#F3E7C9";
      ctx.fillRect(x, y, bw, bh);
      // 顶部深金标题带
      const barH = Math.min(26, bh * 0.22);
      ctx.fillStyle = COLORS.gold;
      ctx.fillRect(x, y, bw, barH);
      ctx.strokeStyle = COLORS.pineInk;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, bw - 2, bh - 2);
      ctx.fillStyle = COLORS.pineInk;
      ctx.font = `700 ${sheet.compact ? 10 : 11.5}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      if (bw > 64) ctx.fillText("要点信息盒", x + 8, y + barH / 2 + 0.5);
      // 内部 3 条简洁要点线
      const itemGap = Math.max(18, (bh - barH - 16) / 3);
      ctx.font = `500 ${sheet.compact ? 9.5 : 10.5}px "Noto Sans SC", sans-serif`;
      const items = ["01 避让 12–24px", "02 侧行 ≥ 12 字", "03 底缘落基线"];
      for (let i = 0; i < 3; i++) {
        const iy = y + barH + 14 + i * itemGap;
        if (iy > y + bh - 10) break;
        ctx.fillStyle = "#01473F";
        ctx.fillRect(x + 8, iy - 4, 4, 8);
        if (bw > 84) {
          ctx.fillStyle = COLORS.pineInk;
          ctx.fillText(items[i], x + 18, iy);
        }
      }
    }

    // 原海报色块中低对比度尺寸铭牌（稳居下半区，避开顶部状态条与中部跨图虚线桥）
    if (kind === "poster" && bw > 68 && bh > 58) {
      const labelY = y + Math.max(bh * 0.66, 46);
      ctx.fillStyle = COLORS.pineInk;
      ctx.font = `700 ${sheet.compact ? 10.5 : 12}px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${ev.blockWidthPct}% × ${Math.round(ev.rect.height * TOTAL_ROWS)}行`, x + bw / 2, labelY - 7);
      ctx.font = `500 ${sheet.compact ? 9.5 : 10.5}px "Noto Sans SC", sans-serif`;
      ctx.fillText("拖动停靠 · 拖边改宽", x + bw / 2, labelY + 9);
    }

    ctx.restore();

    // 交互手柄：左右尺寸竖柄（内收于图块边内侧，0px 啃边时也不遮挡相邻汉字）+ 四角直角折线
    const accent = ev.passed ? COLORS.ok : ev.faults.some((f) => f.axis === "module") ? COLORS.err : COLORS.pineInk;
    const corner = 9;
    ctx.strokeStyle = ev.state.context === "magazine" ? COLORS.gold : COLORS.pineInk;
    ctx.lineWidth = 2;
    const drawCorner = (cx, cy, sx, sy) => {
      ctx.beginPath();
      ctx.moveTo(cx + sx * corner, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + sy * corner);
      ctx.stroke();
    };
    drawCorner(x + 3, y + 3, 1, 1);
    drawCorner(x + bw - 3, y + 3, -1, 1);
    drawCorner(x + 3, y + bh - 3, 1, -1);
    drawCorner(x + bw - 3, y + bh - 3, -1, -1);

    // 左右中点可拖宽窄把柄
    const midY = y + bh / 2;
    const drawEdgeGrip = (gx, active) => {
      ctx.fillStyle = active ? COLORS.cream : COLORS.pineInk;
      ctx.fillRect(gx, midY - 14, 6, 28);
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 1;
      ctx.strokeRect(gx, midY - 14, 6, 28);
    };
    if (!ev.flushLeft) drawEdgeGrip(x + 1, hoverPart === "resize-l");
    if (!ev.flushRight) drawEdgeGrip(x + bw - 7, hoverPart === "resize-r");
    // 底部中点改高把柄
    ctx.fillStyle = hoverPart === "resize-b" ? COLORS.cream : COLORS.pineInk;
    ctx.fillRect(x + bw / 2 - 14, y + bh - 7, 28, 6);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + bw / 2 - 14, y + bh - 7, 28, 6);
  }

  function drawLineText(line, x0, x1, baselineY, align) {
    const str = line.text;
    const len = str.length;
    if (!len) return;
    const availW = Math.max(10, x1 - x0);
    const charW = sheet.w / COLS_CHAR;

    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    if (align === "justify" && len > 1 && line.side !== "full" && len < line.cap + 1) {
      // 真实按字符摊开：当窄侧强开两端对齐时，能肉眼看见字缝被拉出「白河」
      const totalGlyphW = len * Math.min(sheet.fontSize, charW);
      const extra = Math.max(0, availW - totalGlyphW);
      const gap = extra / (len - 1);
      if (gap > sheet.fontSize * 0.42) {
        ctx.fillStyle = "rgba(255, 107, 87, 0.2)";
        ctx.fillRect(x0, baselineY - sheet.fontSize * 0.88, availW, sheet.fontSize * 1.08);
      }
      ctx.fillStyle = COLORS.cream;
      let cx = x0;
      const stepGlyph = Math.min(sheet.fontSize, charW);
      for (let i = 0; i < len; i++) {
        ctx.fillText(str[i], cx, baselineY);
        cx += stepGlyph + gap;
      }
      return;
    }

    // 左齐模式整行单次 fillText + 原生 letterSpacing 对齐 28 字列格（每帧绘制调用降 10×，软件渲染稳守 60fps）
    const extraTrack = Math.max(0, charW - sheet.fontSize);
    ctx.save();
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${extraTrack.toFixed(1)}px`;
    ctx.fillStyle = COLORS.cream;
    ctx.fillText(str, x0, baselineY, availW);
    ctx.restore();
  }

  function drawFrame(t, dt, { still }) {
    const animating = (!still && introProgress < 1) || (scanActive && !still);
    if (!dirty && !animating && !still) return;
    dirty = false;

    computeLayout();
    const ev = getEval();

    if (still) {
      introProgress = 1;
    } else if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + dt * 1.45);
      if (introProgress < 1) dirty = true;
    }

    if (scanActive && !still) {
      scanProgress += dt * 0.24;
      if (scanProgress >= 1) {
        scanProgress = 0;
        scanActive = false;
      } else {
        dirty = true;
      }
    }

    const ease = 1 - Math.pow(1 - introProgress, 3);
    const px = normToPx(ev);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 深松绿全幅蓝图底场
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, cssW, cssH);

    // 2. 版心底面与基线网格（188 视觉呼应）
    ctx.fillStyle = COLORS.bgSheet;
    ctx.fillRect(sheet.x, sheet.y, sheet.w, sheet.h);

    // 双栏中缝辅助线（双栏夹图模式）
    if (ev.state.mode === "twocol") {
      ctx.save();
      ctx.strokeStyle = "rgba(254, 196, 62, 0.28)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(sheet.x + sheet.w * 0.5, sheet.y);
      ctx.lineTo(sheet.x + sheet.w * 0.5, sheet.y + sheet.h);
      ctx.stroke();
      ctx.restore();
    }

    // 基线行网与左侧行号轨
    ctx.font = `500 ${sheet.compact ? 9.5 : 10}px "IBM Plex Mono", monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let r = 0; r <= TOTAL_ROWS; r++) {
      const gy = sheet.y + r * sheet.rowH;
      ctx.strokeStyle = ev.state.baselineLock ? "rgba(233, 218, 185, 0.2)" : COLORS.gridLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sheet.x, gy);
      ctx.lineTo(sheet.x + sheet.w * ease, gy);
      ctx.stroke();

      if (r < TOTAL_ROWS) {
        const isWrap = ev.wrapRows[r];
        ctx.fillStyle = isWrap
          ? (ev.passed ? COLORS.ok : COLORS.gold)
          : "rgba(233, 218, 185, 0.55)";
        ctx.fillText(String(r + 1).padStart(2, "0"), sheet.x - (sheet.compact ? 4 : 8), gy + sheet.rowH * 0.54);
      }
    }

    // 3. 顶部工程比例尺（0% - 100% 与当前图块宽幅标尺）
    ctx.strokeStyle = COLORS.gridStrong;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sheet.x, sheet.y - 8);
    ctx.lineTo(sheet.x + sheet.w, sheet.y - 8);
    ctx.stroke();

    // 图块在顶部标尺上的金色映射条
    ctx.fillStyle = ev.passed ? COLORS.ok : COLORS.gold;
    ctx.fillRect(px.bx0, sheet.y - 11, px.bx1 - px.bx0, 5);

    ctx.fillStyle = COLORS.creamSoft;
    ctx.font = `500 ${sheet.compact ? 9.5 : 10.5}px "IBM Plex Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(`版心 ${COLS_CHAR}字`, sheet.x, sheet.y - 13);
    ctx.textAlign = "center";
    ctx.fillStyle = ev.passed ? COLORS.ok : COLORS.gold;
    ctx.fillText(`图块 ${ev.blockWidthPct}%`, (px.bx0 + px.bx1) / 2, sheet.y - 13);
    ctx.textAlign = "right";
    ctx.fillStyle = ev.axes.standoffOk ? COLORS.creamSoft : COLORS.err;
    ctx.fillText(`避让 ${ev.state.standoffX}×${ev.state.standoffY}px`, sheet.x + sheet.w, sheet.y - 13);

    // 4. 避让距虚线外框（Standoff Exclusion Zone）
    const standoffColor = !ev.axes.standoffOk ? COLORS.err : ev.passed ? COLORS.ok : COLORS.gold;
    ctx.save();
    ctx.fillStyle = !ev.axes.standoffOk ? COLORS.errSoft : "rgba(254, 196, 62, 0.08)";
    ctx.fillRect(px.ex0, px.ey0, px.ex1 - px.ex0, px.ey1 - px.ey0);
    ctx.strokeStyle = standoffColor;
    ctx.lineWidth = hoverPart === "standoff" ? 2 : 1.2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(px.ex0, px.ey0, px.ex1 - px.ex0, px.ey1 - px.ey0);
    ctx.restore();

    // 5. 实绘所有正文行（单真源 ev.lines）
    ctx.font = `400 ${sheet.fontSize}px "Noto Sans SC", sans-serif`;
    const rowWidthMap = new Map();
    for (const line of ev.lines) {
      const lx0 = sheet.x + line.x0 * sheet.w;
      const lx1 = sheet.x + line.x1 * sheet.w;
      const baselineY = sheet.y + (line.row + 0.78) * sheet.rowH;

      // 窄行牙签警示底纹
      if (line.side !== "full" && !ev.axes.measureOk && line.cap < (ev.state.mode === "twocol" ? 9 : 11)) {
        ctx.fillStyle = "rgba(255, 107, 87, 0.14)";
        ctx.fillRect(lx0, sheet.y + line.row * sheet.rowH + 2, lx1 - lx0, sheet.rowH - 4);
      }

      drawLineText(line, lx0, lx1, baselineY, ev.state.align);
      const prev = rowWidthMap.get(line.row) || [];
      prev.push(line.chars);
      rowWidthMap.set(line.row, prev);
    }

    // 6. 桌面端右侧实时行长标尺（每行实绘字数）
    if (!sheet.compact) {
      ctx.font = `500 10px "IBM Plex Mono", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const rx = sheet.x + sheet.w + 10;
      for (let r = 0; r < TOTAL_ROWS; r++) {
        const counts = rowWidthMap.get(r);
        const cy = sheet.y + (r + 0.54) * sheet.rowH;
        if (!counts) {
          ctx.fillStyle = "rgba(233, 218, 185, 0.45)";
          ctx.fillText("— 跳行", rx, cy);
        } else {
          const isSplit = counts.length === 2;
          const minC = Math.min(...counts);
          const bad = (isSplit && ev.hasSplitSentence) || (ev.wrapRows[r] && minC < (ev.state.mode === "twocol" ? 9 : 11));
          ctx.fillStyle = bad ? COLORS.err : ev.wrapRows[r] ? (ev.passed ? COLORS.ok : COLORS.gold) : "rgba(233, 218, 185, 0.65)";
          ctx.fillText(isSplit ? `${counts[0]}+${counts[1]}字` : `${counts[0]}字`, rx, cy);
        }
      }
    }

    // 7. 绘制核心黄金矩形图块
    drawBlockArtwork(ev, px);

    // 8. 现场错态标注（稳居图块内顶带，绝不遮挡第 03 行正文，也避开下方尺寸铭牌）
    const pillY = px.by0 + Math.min(20, (px.by1 - px.by0) * 0.22);
    if (ev.hasSplitSentence) {
      // 跨图跳句珊瑚虚线桥（置于中上区，避开下半区尺寸铭牌）
      const jy = px.by0 + (px.by1 - px.by0) * 0.44;
      ctx.save();
      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px.ex0 - 4, jy);
      ctx.quadraticCurveTo((px.bx0 + px.bx1) / 2, jy - 12, px.ex1 + 4, jy);
      ctx.stroke();
      ctx.restore();
      drawPill(
        (px.bx0 + px.bx1) / 2,
        pillY,
        sheet.compact ? "× 居中劈栏 · 拖向左右边" : "× 居中劈栏跳槽 · 拖到左右边缘",
        COLORS.err,
        "#FFFFFF"
      );
    } else if (!ev.axes.standoffOk) {
      const label =
        ev.state.standoffX < 8 || ev.state.standoffY < 8
          ? sheet.compact
            ? "× 啃边碰撞 · 拉大避让"
            : "× 啃边碰撞 · 拉大避让距"
          : sheet.compact
            ? "× 留白漏气 · 收回气口"
            : "× 留白漏气 · 收回 12–26px";
      drawPill((px.bx0 + px.bx1) / 2, pillY, label, COLORS.err, "#FFFFFF");
    } else if (!ev.axes.measureOk) {
      const label =
        ev.state.mode === "jump"
          ? sheet.compact
            ? "× 图块偏小 · 拉宽或侧绕"
            : "× 图块偏小空跳 · 拉宽或改侧绕"
          : ev.hasJustifyRiver
            ? sheet.compact
              ? "× 窄栏白河 · 改回左齐"
              : "× 窄栏白河 · 改左齐或扩宽"
            : `× 侧边仅 ${ev.minWrapChars} 字过窄`;
      drawPill((px.bx0 + px.bx1) / 2, pillY, label, COLORS.err, "#FFFFFF");
    } else if (!ev.baselineAligned) {
      drawPill(
        (px.bx0 + px.bx1) / 2,
        pillY,
        sheet.compact ? "× 基线错拍 · 开基线锁" : "× 底缘基线错拍 · 开基线锁",
        COLORS.err,
        "#FFFFFF"
      );
    } else if (ev.passed) {
      drawPill((px.bx0 + px.bx1) / 2, pillY, `✓ ${ev.statusShort}`, COLORS.ok, COLORS.pineInk);
    }

    // 9. 视线绕行验真光束（Space / 点击按钮触发）
    if (scanActive && ev.lines.length > 0) {
      drawScanpath(ev);
    }

    // 10. 左下角微提示条
    ctx.fillStyle = "rgba(233, 218, 185, 0.72)";
    ctx.font = `400 ${sheet.compact ? 9.5 : 10.5}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      sheet.compact
        ? "横拖金块改停靠 · 拖边改宽 · 拖虚线改避让"
        : "直拖黄金矩形停靠位置 · 拖左右/底柄调宽窄 · 拖外圈虚线改避让距 · Space 视线扫视验真",
      sheet.x,
      cssH - 11
    );

    ctx.restore();
  }

  function drawPill(cx, cy, text, bg, fg) {
    ctx.save();
    ctx.font = `700 ${sheet.compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
    const w = ctx.measureText(text).width + 16;
    const h = 21;
    const x = clamp(cx - w / 2, sheet.x + 2, sheet.x + sheet.w - w - 2);
    const y = clamp(cy - h / 2, sheet.y + 2, sheet.y + sheet.h - h - 2);
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + w / 2, y + h / 2 + 0.5);
    ctx.restore();
  }

  function drawScanpath(ev) {
    const segs = ev.lines.map((l) => ({
      x0: sheet.x + l.x0 * sheet.w,
      x1: sheet.x + l.x1 * sheet.w,
      y: sheet.y + (l.row + 0.52) * sheet.rowH,
      splitJump: l.splitJump,
    }));
    const total = segs.length;
    const f = scanProgress * total;
    const idx = Math.min(total - 1, Math.floor(f));
    const localT = f - idx;

    ctx.save();
    for (let i = 0; i <= idx; i++) {
      const s = segs[i];
      const endX = i === idx ? s.x0 + (s.x1 - s.x0) * localT : s.x1;
      ctx.strokeStyle = ev.passed ? "rgba(92, 224, 168, 0.78)" : "rgba(254, 196, 62, 0.82)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(s.x0, s.y);
      ctx.lineTo(endX, s.y);
      ctx.stroke();

      // 回扫或跨图跳槽连线
      if (i < idx) {
        const nxt = segs[i + 1];
        const isJumpAcross = Math.abs(nxt.y - s.y) < 3 && nxt.x0 > s.x1 + 12;
        ctx.strokeStyle = isJumpAcross ? COLORS.err : "rgba(243, 231, 201, 0.42)";
        ctx.lineWidth = isJumpAcross ? 2 : 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y);
        if (isJumpAcross) {
          ctx.quadraticCurveTo((s.x1 + nxt.x0) / 2, s.y - 12, nxt.x0, nxt.y);
        } else {
          ctx.lineTo(nxt.x0, nxt.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 当前视线光点
    const cur = segs[idx];
    const dotX = cur.x0 + (cur.x1 - cur.x0) * localT;
    ctx.fillStyle = ev.passed ? COLORS.ok : COLORS.gold;
    ctx.beginPath();
    ctx.arc(dotX, cur.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.pineInk;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  const runner = loop(canvas, drawFrame);

  // ---------- 指针与触屏交互（兼容 perf.mjs 水平 touchMove + 移动端竖向滚动） ----------
  let drag = null;

  function hitTest(lx, ly) {
    const ev = getEval();
    const px = normToPx(ev);
    const tol = 14;
    // 左右边缘改宽把柄
    if (!ev.flushLeft && Math.abs(lx - px.bx0) <= tol && ly >= px.by0 - 6 && ly <= px.by1 + 6) return "resize-l";
    if (!ev.flushRight && Math.abs(lx - px.bx1) <= tol && ly >= px.by0 - 6 && ly <= px.by1 + 6) return "resize-r";
    // 底边改高把柄
    if (Math.abs(ly - px.by1) <= tol && lx >= px.bx0 + 8 && lx <= px.bx1 - 8) return "resize-b";
    // 矩形本体拖动停靠
    if (lx >= px.bx0 && lx <= px.bx1 && ly >= px.by0 && ly <= px.by1) return "move";
    // 外圈虚线避让框拖动改 standoff
    const nearExX = (Math.abs(lx - px.ex0) <= tol || Math.abs(lx - px.ex1) <= tol) && ly >= px.ey0 - tol && ly <= px.ey1 + tol;
    const nearExY = (Math.abs(ly - px.ey0) <= tol || Math.abs(ly - px.ey1) <= tol) && lx >= px.ex0 - tol && lx <= px.ex1 + tol;
    if (nearExX || nearExY) return "standoff";
    // 空白区域水平拖动也能推动图块停靠
    return "scrub";
  }

  function localPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function startDrag(clientX, clientY, isTouch) {
    const p = localPos(clientX, clientY);
    const kind = hitTest(p.x, p.y);
    const ev = getEval();
    drag = {
      kind,
      isTouch,
      locked: !isTouch, // 触屏先判定横/纵方向，保证页面能竖滑
      startX: p.x,
      startY: p.y,
      base: { ...ev.state },
    };
  }

  function moveDrag(clientX, clientY, e) {
    const p = localPos(clientX, clientY);
    if (!drag) {
      const h = hitTest(p.x, p.y);
      hoverPart = h === "scrub" ? "" : h;
      canvas.style.cursor =
        h === "resize-l" || h === "resize-r"
          ? "ew-resize"
          : h === "resize-b"
            ? "ns-resize"
            : h === "standoff"
              ? "nwse-resize"
              : h === "move"
                ? "grab"
                : "ew-resize";
      return;
    }

    const dx = p.x - drag.startX;
    const dy = p.y - drag.startY;
    if (drag.isTouch && !drag.locked) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8 && drag.kind !== "resize-b") {
        drag = null; // 交还浏览器竖向滚动
        return;
      }
      if (Math.abs(dx) >= 3 || (drag.kind === "resize-b" && Math.abs(dy) >= 4)) {
        drag.locked = true;
      } else {
        return;
      }
    }
    if (e && e.cancelable) e.preventDefault();

    const ndx = dx / Math.max(120, sheet.w);
    const ndy = dy / Math.max(120, sheet.h);
    const b = drag.base;

    if (drag.kind === "move" || drag.kind === "scrub") {
      const nextBx = clamp(b.bx + ndx, b.bw / 2, 1 - b.bw / 2);
      const patch = { bx: nextBx };
      if (!drag.isTouch && drag.kind === "move") {
        patch.by = clamp(b.by + ndy, 0, 1 - b.bh);
      }
      onMutate(patch);
    } else if (drag.kind === "resize-r") {
      const leftEdge = b.bx - b.bw / 2;
      const newW = clamp(b.bw + ndx, 0.2, 1 - leftEdge);
      onMutate({ bw: newW, bx: leftEdge + newW / 2 });
    } else if (drag.kind === "resize-l") {
      const rightEdge = b.bx + b.bw / 2;
      const newW = clamp(b.bw - ndx, 0.2, rightEdge);
      onMutate({ bw: newW, bx: rightEdge - newW / 2 });
    } else if (drag.kind === "resize-b") {
      onMutate({ bh: clamp(b.bh + ndy, 0.22, 1 - b.by) });
    } else if (drag.kind === "standoff") {
      const deltaPx = Math.round((Math.abs(dx) > Math.abs(dy) ? dx : dy) * 0.45);
      onMutate({
        standoffX: clamp(b.standoffX + deltaPx, 0, 44),
        standoffY: clamp(b.standoffY + Math.round(deltaPx * 0.8), 0, 40),
      });
    }
  }

  function endDrag() {
    drag = null;
  }

  // 鼠标事件
  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    startDrag(e.clientX, e.clientY, false);
    canvas.style.cursor = "grabbing";
  });
  window.addEventListener("mousemove", (e) => moveDrag(e.clientX, e.clientY, e));
  window.addEventListener("mouseup", () => {
    if (drag && !drag.isTouch) {
      endDrag();
      canvas.style.cursor = "grab";
    }
  });

  // 触屏原生事件（perf.mjs 直接派发 Input.dispatchTouchEvent，原生 touch 监听器响应零延迟）
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      startDrag(e.touches[0].clientX, e.touches[0].clientY, true);
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!drag || e.touches.length !== 1) return;
      moveDrag(e.touches[0].clientX, e.touches[0].clientY, e);
    },
    { passive: false }
  );
  canvas.addEventListener("touchend", endDrag, { passive: true });
  canvas.addEventListener("touchcancel", endDrag, { passive: true });

  window.addEventListener("resize", () => {
    dirty = true;
    runner.draw();
  });

  return {
    redraw: () => {
      dirty = true;
      if (reducedMotion.matches) runner.draw();
    },
    triggerScan: () => {
      scanActive = true;
      scanProgress = reducedMotion.matches ? 0.65 : 0.01;
      dirty = true;
      runner.draw();
    },
    isScanning: () => scanActive,
  };
}

// 实时同步更新 1:1 复刻原海报右侧的「绕排示意」SVG（四向顺时针虚线箭头 + 核心金框）
export function updateSchematicSVG(ev) {
  const rectEl = document.getElementById("schem-rect");
  const zoneEl = document.getElementById("schem-zone");
  if (!rectEl || !zoneEl) return;

  // 把模型里的归一化图块投影进 180×156 示意视口（内页框 x:26..154, y:24..132）
  const ox = 28;
  const oy = 24;
  const ow = 124;
  const oh = 108;

  const rx = ox + ev.rect.left * ow;
  const ry = oy + ev.rect.top * oh;
  const rw = Math.max(18, ev.rect.width * ow);
  const rh = Math.max(18, ev.rect.height * oh);

  const ex = ox + ev.excl.left * ow;
  const ey = oy + ev.excl.top * oh;
  const ew = Math.max(rw, (ev.excl.right - ev.excl.left) * ow);
  const eh = Math.max(rh, (ev.excl.bottom - ev.excl.top) * oh);

  rectEl.setAttribute("x", rx.toFixed(1));
  rectEl.setAttribute("y", ry.toFixed(1));
  rectEl.setAttribute("width", rw.toFixed(1));
  rectEl.setAttribute("height", rh.toFixed(1));

  zoneEl.setAttribute("x", ex.toFixed(1));
  zoneEl.setAttribute("y", ey.toFixed(1));
  zoneEl.setAttribute("width", ew.toFixed(1));
  zoneEl.setAttribute("height", eh.toFixed(1));
  zoneEl.setAttribute("stroke", ev.axes.standoffOk ? "#E9DAB9" : "#FF6B57");

  const colorFor = (st) =>
    st === "err" ? "#FF6B57" : st === "warn" ? "#FEC43E" : st === "ok" ? "#5CE0A8" : "rgba(233,218,185,0.28)";

  for (const side of ["top", "right", "bottom", "left"]) {
    const g = document.getElementById(`schem-arrow-${side}`);
    if (!g) continue;
    const info = ev.schematicArrows[side];
    g.style.opacity = info.active ? "1" : "0.25";
    g.setAttribute("stroke", colorFor(info.status));
  }

  const legBlock = document.getElementById("leg-block");
  const legFlow = document.getElementById("leg-flow");
  const legZone = document.getElementById("leg-zone");
  if (legBlock) legBlock.textContent = `占比 ${ev.blockAreaPct}% · 宽 ${ev.blockWidthPct}%`;
  if (legFlow) {
    const modeMap = {
      both: "跨栏单流（双向）",
      single: ev.flushRight ? "贴右单侧（直左缘）" : ev.flushLeft ? "贴左单侧（右绕）" : "单侧避让",
      twocol: "双栏独立夹图",
      jump: "上下跳行排布",
    };
    legFlow.textContent = modeMap[ev.state.mode] || "";
  }
  if (legZone) {
    legZone.textContent =
      ev.state.mode === "jump"
        ? `通栏 ${COLS_CHAR}字 · 纵避 ${ev.state.standoffY}px`
        : `侧行 ${ev.minWrapChars}字 · 避让 ${ev.state.standoffX}px`;
  }
}

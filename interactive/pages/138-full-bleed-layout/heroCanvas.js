// 138 满出血 版式 · 开场主角玩具：印前裁纸台 · 铡刀实切机 (The Guillotine Bleed Press)
// 纯 2D Canvas 高帧率渲染（无 WebGL 依赖，降级 100% 一致），标 data-perf-drag。
import { loop, pixelRatio } from "../../lib/stage.js";
import { SHEET, SPECIMENS, clamp, evaluate } from "./model.js";

export function mountHeroCanvas(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1;
  let cutAnim = state.trimmed ? 1 : 0; // 0 = 印张展开，1 = 铡刀落切成品
  let bladeFlash = 0; // 刚落刀时的金属刀光脉冲
  let dragMode = null; // "bleed" | "subject" | "text"
  let dragStart = null;
  let activeHit = null;
  let layoutCache = null;
  let dirty = true;
  let pendingSync = false;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const nw = Math.max(240, Math.round(r.width));
    const nh = Math.max(240, Math.round(r.height));
    const ndpr = nw < 520 ? pixelRatio(1.5) : pixelRatio(2);
    const pw = Math.round(nw * ndpr);
    const ph = Math.round(nh * ndpr);
    if (nw !== w || nh !== h || ndpr !== dpr || canvas.width !== pw || canvas.height !== ph) {
      w = nw; h = nh; dpr = ndpr;
      canvas.width = pw;
      canvas.height = ph;
      dirty = true;
    }
  }

  // 计算画布内部几何：宽屏双视窗（左 SRA4 印前裁纸台 + 右 4× 刀口显微剖面）；窄屏单台 + 底部实测刀口尺
  function computeLayout() {
    const wide = w / h > 1.18 && w >= 580;
    const padTop = wide ? 36 : 30;
    const padBot = wide ? 34 : 56;
    const padL = wide ? 24 : 16;
    const padR = wide ? 20 : 16;

    const benchW = wide ? Math.round(w * 0.59) - padL : w - padL - padR;
    const benchH = h - padTop - padBot;

    // 把 236×324 mm 展张按等比缩放放入 bench（绝对等比，圆永不变椭圆）
    const scale = Math.min((benchW - 24) / SHEET.rawW, (benchH - 16) / SHEET.rawH);
    const rawPxW = SHEET.rawW * scale;
    const rawPxH = SHEET.rawH * scale;
    const rawX = padL + (benchW - rawPxW) / 2;
    const rawY = padTop + (benchH - rawPxH) / 2;

    const trimOffsetX = ((SHEET.rawW - SHEET.trimW) / 2) * scale;
    const trimOffsetY = ((SHEET.rawH - SHEET.trimH) / 2) * scale;
    const trimX = rawX + trimOffsetX;
    const trimY = rawY + trimOffsetY;
    const trimPxW = SHEET.trimW * scale;
    const trimPxH = SHEET.trimH * scale;

    const scope = wide
      ? { x: Math.round(w * 0.61), y: padTop, w: Math.round(w * 0.39) - padR, h: benchH }
      : { x: padL, y: h - 46, w: w - padL - padR, h: 36 };

    return {
      wide, scale,
      raw: { x: rawX, y: rawY, w: rawPxW, h: rawPxH },
      trim: { x: trimX, y: trimY, w: trimPxW, h: trimPxH },
      scope,
      mmToX: (mm) => trimX + mm * scale,
      mmToY: (mm) => trimY + mm * scale,
      mmToPx: (mm) => mm * scale,
      pxToMmX: (px) => (px - trimX) / scale,
    };
  }

  // 绘制单个标本的完整艺术画面（裁剪到给定物理边界 clipRect）
  function drawSpecimenArt(c, L, ev, spec, clipRect, shiftXmm = 0, shiftYmm = 0) {
    c.save();
    c.beginPath();
    c.rect(clipRect.x, clipRect.y, clipRect.w, clipRect.h);
    c.clip();

    // 画布偏移（模拟纸堆在切纸机下微移 ±bladeTol）
    c.translate(L.mmToPx(shiftXmm), L.mmToPx(shiftYmm));

    // 色块底面（受 bleedMm 控制，负出血时缩在成品内，正出血时越过刀口！）
    const ax = L.mmToX(ev.artRect.x);
    const ay = L.mmToY(ev.artRect.y);
    const aw = L.mmToPx(ev.artRect.w);
    const ah = L.mmToPx(ev.artRect.h);

    c.fillStyle = spec.bg;
    c.fillRect(ax, ay, aw, ah);

    // 限制图案只画在色块实际覆盖区之内（负出血时主体与斜切也被白框锁住）
    c.save();
    c.beginPath();
    c.rect(ax, ay, aw, ah);
    c.clip();

    const subj = ev.subject;
    const sx = L.mmToX(subj.cx);
    const sy = L.mmToY(subj.cy);
    const sr = L.mmToPx(subj.r);

    if (spec.id === "poster") {
      // 1:1 复刻 138 原海报：顶部出血白楔 + 底部出血白楔 + 右侧出血巨黑圆 + 斜切白杠
      const topTipY = L.mmToY(66);
      c.fillStyle = "#F4F3EE";
      c.beginPath();
      c.moveTo(L.mmToX(97), L.mmToY(-14));
      c.lineTo(L.mmToX(160), L.mmToY(-14));
      c.lineTo(L.mmToX(128), topTipY);
      c.closePath();
      c.fill();

      // 底部出血白楔
      c.beginPath();
      c.moveTo(L.mmToX(82), L.mmToY(312));
      c.lineTo(L.mmToX(132), L.mmToY(312));
      c.lineTo(L.mmToX(106), L.mmToY(264));
      c.closePath();
      c.fill();

      // 巨幅黑色大圆（用户直接拖拽破边！）
      c.fillStyle = "#070707";
      c.beginPath();
      c.arc(sx, sy, sr, 0, Math.PI * 2);
      c.fill();

      // 贯穿黑圆并破出右上与下方的斜切白杠
      c.strokeStyle = "#F4F3EE";
      c.lineWidth = Math.max(2.5, L.mmToPx(4.8));
      c.beginPath();
      c.moveTo(L.mmToX(96), L.mmToY(310));
      c.lineTo(L.mmToX(224), L.mmToY(34));
      c.stroke();

      // 右下原海报小英文 + 钴蓝波浪线
      const brX = L.mmToX(194);
      const brY = L.mmToY(272);
      c.fillStyle = "#070707";
      c.textAlign = "right";
      c.textBaseline = "alphabetic";
      c.font = `700 ${Math.max(5.5, L.mmToPx(4.0))}px "Archivo", sans-serif`;
      c.fillText("BOLD", brX, brY - L.mmToPx(8.5));
      c.fillText("IMMERSIVE", brX, brY - L.mmToPx(4.2));
      c.fillText("POWERFUL", brX, brY);

      // 钴蓝波浪线
      c.strokeStyle = "#001CE7";
      c.lineWidth = Math.max(1.2, L.mmToPx(1.1));
      c.beginPath();
      for (let i = 0; i <= 16; i++) {
        const px = L.mmToX(176 + i * 1.15);
        const py = brY + L.mmToPx(4.8) + Math.sin(i * 1.25) * L.mmToPx(1.2);
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();

      // 底部左侧 DESIGN PRINCIPLES
      c.textAlign = "left";
      c.fillStyle = "#070707";
      c.font = `700 ${Math.max(5.5, L.mmToPx(3.7))}px "Archivo", sans-serif`;
      const tx0 = L.mmToX(ev.safeMm);
      c.fillText("DESIGN PRINCIPLES", tx0, L.mmToY(281));
      c.fillText("FOR VISUAL IMPACT", tx0, L.mmToY(286));

      // 原海报左侧钴蓝印刷套准标
      const regX = L.mmToX(Math.max(4, ev.safeMm + 6));
      const regY = L.mmToY(247);
      const regR = Math.max(4, L.mmToPx(5.2));
      c.strokeStyle = "#001CE7";
      c.fillStyle = "#001CE7";
      c.lineWidth = Math.max(1, L.mmToPx(0.8));
      c.beginPath();
      c.arc(regX, regY, regR, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.arc(regX, regY, regR * 0.36, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.moveTo(regX - regR * 1.5, regY);
      c.lineTo(regX + regR * 1.5, regY);
      c.moveTo(regX, regY - regR * 1.5);
      c.lineTo(regX, regY + regR * 1.5);
      c.stroke();
    } else if (spec.id === "arch") {
      // 建筑画册标本：粗野主义混凝土斜塔与玻璃幕墙破边
      c.fillStyle = "#2A3947";
      c.beginPath();
      c.moveTo(L.mmToX(-12), L.mmToY(210));
      c.lineTo(L.mmToX(225), L.mmToY(155));
      c.lineTo(L.mmToX(225), L.mmToY(312));
      c.lineTo(L.mmToX(-12), L.mmToY(312));
      c.closePath();
      c.fill();

      // 巨构建筑立面（位置随 subject 破边移动）
      const bLeft = L.mmToX(subj.leftMm);
      const bRight = L.mmToX(subj.rightMm + 16);
      const bTop = L.mmToY(24);
      const bBot = L.mmToY(312);
      c.fillStyle = "#E6E0D4";
      c.beginPath();
      c.moveTo(bLeft, bTop + L.mmToPx(24));
      c.lineTo(bRight, bTop - L.mmToPx(18));
      c.lineTo(bRight, bBot);
      c.lineTo(bLeft, bBot);
      c.closePath();
      c.fill();

      // 暗影立面
      c.fillStyle = "#0E141B";
      c.beginPath();
      c.moveTo(bLeft + (bRight - bLeft) * 0.42, bTop + L.mmToPx(8));
      c.lineTo(bRight, bTop - L.mmToPx(18));
      c.lineTo(bRight, bBot);
      c.lineTo(bLeft + (bRight - bLeft) * 0.42, bBot);
      c.closePath();
      c.fill();

      // 建筑结构肋线
      c.strokeStyle = "#19242E";
      c.lineWidth = Math.max(1, L.mmToPx(1.1));
      for (let row = 0; row < 8; row++) {
        const yy = bTop + L.mmToPx(36 + row * 28);
        c.beginPath();
        c.moveTo(bLeft, yy);
        c.lineTo(bRight, yy - L.mmToPx(14));
        c.stroke();
      }
      // 朱红建筑展讯带破边
      c.fillStyle = "#F72F02";
      c.fillRect(L.mmToX(-12), L.mmToY(254), L.mmToPx(238), L.mmToPx(12));
    } else {
      // 音乐节满版海报：同心朱红声浪环破边
      for (let i = 4; i >= 0; i--) {
        const rr = sr * (0.32 + i * 0.22);
        c.fillStyle = i % 2 === 0 ? "#F72F02" : "#15151A";
        c.beginPath();
        c.arc(sx, sy, rr, 0, Math.PI * 2);
        c.fill();
      }
      // 钴蓝脉冲斜带
      c.strokeStyle = "#2E56FF";
      c.lineWidth = Math.max(2, L.mmToPx(4.2));
      c.beginPath();
      c.moveTo(L.mmToX(88), L.mmToY(310));
      c.lineTo(L.mmToX(226), L.mmToY(20));
      c.stroke();
    }

    // 左侧主体标题与原海报四词（受 safeMm 精确控制，贴刀时真被裁切！）
    const tx = L.mmToX(ev.safeMm);
    c.textAlign = "left";
    c.textBaseline = "top";
    c.fillStyle = spec.fg;
    const hSize = Math.max(12, L.mmToPx(25.5));
    c.font = `900 ${hSize}px "Noto Sans SC", sans-serif`;
    c.fillText(spec.headline[0], tx, L.mmToY(40));
    c.fillText(spec.headline[1], tx, L.mmToY(40) + hSize * 1.12);

    const subSize = Math.max(6.5, L.mmToPx(7.4));
    c.font = `800 ${subSize}px "Archivo", sans-serif`;
    c.fillText(spec.subEn[0], tx, L.mmToY(107));
    c.fillText(spec.subEn[1], tx, L.mmToY(115.5));

    // 原海报 ↙ 钴蓝折箭
    const arX = tx;
    const arY = L.mmToY(128);
    const arS = Math.max(4.5, L.mmToPx(5.5));
    c.strokeStyle = spec.mark;
    c.lineWidth = Math.max(1.2, L.mmToPx(1.1));
    c.beginPath();
    c.moveTo(arX + arS, arY);
    c.lineTo(arX, arY + arS);
    c.moveTo(arX, arY + arS * 0.15);
    c.lineTo(arX, arY + arS);
    c.lineTo(arX + arS * 0.85, arY + arS);
    c.stroke();

    // 四词 + 细白横线（原海报标志母题）
    const kws = [["边缘", "EDGE"], ["裁切", "CROP"], ["沉浸", "IMMERSION"], ["冲击", "IMPACT"]];
    const kwBaseY = L.mmToY(156);
    const kwStep = L.mmToPx(17.5);
    const kwW = L.mmToPx(33);
    kws.forEach(([zh, en], idx) => {
      const yy = kwBaseY + idx * kwStep;
      c.fillStyle = spec.fg;
      c.font = `700 ${Math.max(6, L.mmToPx(5.2))}px "Noto Sans SC", sans-serif`;
      c.fillText(zh, tx, yy);
      c.font = `700 ${Math.max(4.8, L.mmToPx(3.5))}px "Archivo", sans-serif`;
      c.fillText(en, tx, yy + L.mmToPx(6.4));
      if (idx < 3) {
        c.strokeStyle = spec.id === "poster" ? "rgba(245,243,238,0.85)" : "rgba(245,243,238,0.35)";
        c.lineWidth = Math.max(0.8, L.mmToPx(0.45));
        c.beginPath();
        c.moveTo(tx, yy + kwStep - L.mmToPx(3.6));
        c.lineTo(tx + kwW, yy + kwStep - L.mmToPx(3.6));
        c.stroke();
      }
    });

    c.restore(); // end artwork clip
    c.restore(); // end outer clip
  }

  // 绘制四角专业裁切角线（Crop Marks）与套准标（Registration Marks）；落刀后随废纸边一同淡去
  function drawCropMarks(c, L, ev) {
    if (cutAnim >= 0.92) return;
    const t = L.trim;
    const len = Math.max(7, L.mmToPx(7.5));
    const gap = Math.max(3, L.mmToPx(3.2));
    c.save();
    c.globalAlpha = Math.max(0, 1 - cutAnim * 1.15);
    c.strokeStyle = "#111111";
    c.lineWidth = 1;

    c.beginPath();
    const corners = [
      [t.x, t.y, -1, -1],
      [t.x + t.w, t.y, 1, -1],
      [t.x, t.y + t.h, -1, 1],
      [t.x + t.w, t.y + t.h, 1, 1],
    ];
    for (const [cx, cy, dx, dy] of corners) {
      c.moveTo(cx + dx * gap, cy);
      c.lineTo(cx + dx * (gap + len), cy);
      c.moveTo(cx, cy + dy * gap);
      c.lineTo(cx, cy + dy * (gap + len));
    }
    c.stroke();

    // 顶部/底部居中套准标（合批绘制）
    const rx = t.x + t.w / 2;
    c.strokeStyle = "#001CE7";
    c.lineWidth = 0.9;
    c.beginPath();
    for (const ry of [L.raw.y + (t.y - L.raw.y) * 0.45, t.y + t.h + (L.raw.y + L.raw.h - (t.y + t.h)) * 0.55]) {
      c.moveTo(rx + 3.2, ry);
      c.arc(rx, ry, 3.2, 0, Math.PI * 2);
      c.moveTo(rx - 5.5, ry); c.lineTo(rx + 5.5, ry);
      c.moveTo(rx, ry - 5.5); c.lineTo(rx, ry + 5.5);
    }
    c.stroke();

    // 三道隐形界线叠加（当 showGuides 开启且未完全落刀时）
    if (state.showGuides) {
      const b3 = L.mmToPx(3);
      c.strokeStyle = "#F72F02";
      c.lineWidth = 1.1;
      c.setLineDash([4, 3]);
      c.strokeRect(t.x - b3, t.y - b3, t.w + b3 * 2, t.h + b3 * 2);

      c.strokeStyle = "#001CE7";
      c.lineWidth = 1.25;
      c.setLineDash([]);
      c.strokeRect(t.x, t.y, t.w, t.h);

      const s6 = L.mmToPx(6);
      c.strokeStyle = "rgba(0, 28, 231, 0.72)";
      c.lineWidth = 1;
      c.setLineDash([3, 3]);
      c.strokeRect(t.x + s6, t.y + s6, t.w - s6 * 2, t.h - s6 * 2);
      c.setLineDash([]);
    }
    c.restore();
  }

  // 绘制画布上的交互手柄与物理问题高亮（全部读自 ev 单真源）
  function drawHandlesAndCallouts(c, L, ev) {
    const t = L.trim;
    c.save();

    // 1) 文字包围盒状态提示（若贴刀或撞图）
    const bx = L.mmToX(ev.textBox.x);
    const by = L.mmToY(ev.textBox.y);
    const bw = L.mmToPx(ev.textBox.w);
    const bh = L.mmToPx(ev.textBox.h);

    if (!ev.safeOk) {
      c.strokeStyle = "#FFDA3D";
      c.fillStyle = "rgba(255, 218, 61, 0.16)";
      c.lineWidth = 1.5;
      c.setLineDash([4, 3]);
      c.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
      c.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
      c.setLineDash([]);
    }

    // 2) 三个简洁几何抓手（仅印张展视态显示，互不遮挡）
    if (cutAnim < 0.2) {
      // 出血底边抓手（置底左下红边，与顶部「字」抓手彻底错开）
      const bleedHandleX = clamp(L.mmToX(ev.artRect.x), L.raw.x + 12, t.x + t.w * 0.36);
      const bleedHandleY = t.y + t.h * 0.84;
      drawPillHandle(c, bleedHandleX, bleedHandleY, "↔", activeHit === "bleed" || dragMode === "bleed", ev.edgeOk ? "#0A663F" : "#F72F02");

      // 主体黑圆抓手
      const subjHandleX = clamp(L.mmToX(ev.subject.leftMm + 16), t.x + 28, t.x + t.w - 14);
      const subjHandleY = L.mmToY(ev.subject.cy);
      drawPillHandle(c, subjHandleX, subjHandleY, "↔", activeHit === "subject" || dragMode === "subject", ev.immersionOk ? "#0A663F" : "#001CE7");

      // 文字安全距抓手
      const txtHandleX = clamp(bx + 14, t.x + 12, t.x + t.w * 0.52);
      const txtHandleY = by - 11;
      drawPillHandle(c, txtHandleX, txtHandleY, "字", activeHit === "text" || dragMode === "text", ev.safeOk ? "#0A663F" : "#F72F02");
    }

    // 3) 落刀后若发生露白边或切字，直接在成品边标出实测毫米签
    if (cutAnim > 0.7 && (ev.sliverMm > 0 || ev.textChoppedMm > 0)) {
      c.globalAlpha = (cutAnim - 0.7) / 0.3;
      if (ev.sliverMm > 0) {
        const tag = `× 露白 ${ev.sliverMm.toFixed(1)}mm`;
        drawBadge(c, t.x + t.w - 4, t.y + 18, tag, "#F72F02", "#FFFFFF", "right");
      }
      if (ev.textChoppedMm > 0) {
        const tag = `× 切字 ${ev.textChoppedMm.toFixed(1)}mm`;
        drawBadge(c, t.x + 6, by + bh + 16, tag, "#070707", "#FFDA3D", "left");
      }
    }

    c.restore();
  }

  function drawPillHandle(c, x, y, text, active, color) {
    c.save();
    c.fillStyle = active ? "#FFFFFF" : color;
    c.strokeStyle = active ? color : "#FFFFFF";
    c.lineWidth = 1.6;
    c.beginPath();
    c.rect(x - 11, y - 10, 22, 20);
    c.fill();
    c.stroke();
    c.fillStyle = active ? color : "#FFFFFF";
    c.font = `700 11px "Space Mono", "Noto Sans SC", monospace`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text, x, y + 0.5);
    c.restore();
  }

  function drawBadge(c, x, y, text, bg, fg, align = "left") {
    c.save();
    c.font = `700 11px "Space Mono", "Noto Sans SC", monospace`;
    const tw = c.measureText(text).width + 12;
    const rx = align === "right" ? x - tw : x;
    c.fillStyle = bg;
    c.fillRect(rx, y - 10, tw, 20);
    c.fillStyle = fg;
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.fillText(text, rx + 6, y + 0.5);
    c.restore();
  }

  // 右侧 4× 刀口显微剖面（宽屏）或底部刀口毫米刻度条（窄屏）
  function drawBladeScope(c, L, ev, spec) {
    const s = L.scope;
    c.save();

    if (!L.wide) {
      // 手机端：紧贴底沿的实时毫米刀口剖面尺（清晰不拥挤）
      c.fillStyle = "#161616";
      c.fillRect(s.x, s.y, s.w, s.h);
      c.strokeStyle = "#333333";
      c.lineWidth = 1;
      c.strokeRect(s.x, s.y, s.w, s.h);

      const barX = s.x + 10;
      const barW = s.w - 20;
      const zeroX = barX + barW * 0.54; // 0mm 裁切刀口位置
      const pxPerMm = barW / 24; // -14mm .. +10mm

      // 红白区底色
      c.fillStyle = "#F5F3EE";
      c.fillRect(barX, s.y + 18, barW, 10);
      const artEndX = clamp(zeroX + ev.bleedMm * pxPerMm, barX, barX + barW);
      c.fillStyle = spec.bg;
      c.fillRect(barX, s.y + 18, Math.max(0, artEndX - barX), 10);

      // 走刀公差带
      const tolW = ev.bladeTol * pxPerMm;
      c.fillStyle = "rgba(0, 28, 231, 0.28)";
      c.fillRect(zeroX - tolW, s.y + 16, tolW * 2, 14);

      // 0mm 刀口蓝线 & +3mm 出血红线
      c.strokeStyle = "#7DA0FF";
      c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(zeroX, s.y + 14); c.lineTo(zeroX, s.y + 32); c.stroke();
      const b3X = zeroX + 3 * pxPerMm;
      c.strokeStyle = "#FF6B4A";
      c.setLineDash([2, 2]);
      c.beginPath(); c.moveTo(b3X, s.y + 14); c.lineTo(b3X, s.y + 32); c.stroke();
      c.setLineDash([]);

      c.fillStyle = "#E8E5DE";
      c.font = `700 10.5px "Space Mono", "Noto Sans SC", monospace`;
      c.textAlign = "left";
      c.textBaseline = "top";
      c.fillText(`出血 ${ev.bleedMm >= 0 ? "+" : ""}${ev.bleedMm.toFixed(1)}mm · 刀偏 ±${ev.bladeTol.toFixed(1)}mm`, s.x + 10, s.y + 4);
      c.textAlign = "right";
      c.fillStyle = ev.sliverMm > 0 ? "#FF7555" : "#5EE0A4";
      c.fillText(ev.sliverMm > 0 ? `露白 ${ev.sliverMm.toFixed(1)}mm` : "零露白", s.x + s.w - 10, s.y + 4);
      c.restore();
      return;
    }

    // 宽屏右侧：4× 实测刀口显微剖面仓
    c.fillStyle = "#121212";
    c.fillRect(s.x, s.y, s.w, s.h);
    c.strokeStyle = "#2E2E2E";
    c.lineWidth = 1;
    c.strokeRect(s.x, s.y, s.w, s.h);

    // 顶部栏标题
    c.fillStyle = "#1C1C1C";
    c.fillRect(s.x, s.y, s.w, 30);
    c.fillStyle = "#F5F3EE";
    c.font = `700 11px "Space Mono", "Noto Sans SC", monospace`;
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.fillText("BLADE MICROSCOPE ×4 · 刀口实时剖面", s.x + 12, s.y + 15);

    // 上半格：右刀口外扩出血 vs 走刀露白剖面
    const box1 = { x: s.x + 14, y: s.y + 44, w: s.w - 28, h: Math.round((s.h - 110) * 0.50) };
    drawZoomPanel(c, box1, "右刀口 · 出血与走刀公差", ev, spec, "bleed");

    // 下半格：左刀口内缩文字安全距剖面
    const box2 = { x: s.x + 14, y: box1.y + box1.h + 26, w: s.w - 28, h: Math.round((s.h - 110) * 0.50) };
    drawZoomPanel(c, box2, "左刀口 · 标题安全距实测", ev, spec, "safe");

    // 底沿操作提示（按仓宽自适应截短，绝不溢出）
    c.save();
    c.beginPath();
    c.rect(s.x + 8, s.y + s.h - 24, s.w - 16, 22);
    c.clip();
    c.fillStyle = "#B8B4AC";
    c.font = `400 11px "Noto Sans SC", sans-serif`;
    c.textAlign = "left";
    c.textBaseline = "bottom";
    const hintLine = s.w < 320
      ? "横拖调出血 · 拖圆破边 · 空格落刀"
      : "横拖白纸调出血 · 拖大圆破边 · 拖标题调安全距 · 空格落刀";
    c.fillText(hintLine, s.x + 12, s.y + s.h - 10);
    c.restore();
    c.restore();
  }

  function drawZoomPanel(c, b, title, ev, spec, kind) {
    c.save();
    c.fillStyle = "#E5E2DA";
    c.font = `700 11px "Noto Sans SC", sans-serif`;
    c.textAlign = "left";
    c.textBaseline = "bottom";
    c.fillText(title, b.x, b.y - 5);

    c.save();
    c.beginPath();
    c.rect(b.x, b.y, b.w, b.h);
    c.clip();

    // 纸张浅白底
    c.fillStyle = "#F5F3EE";
    c.fillRect(b.x, b.y, b.w, b.h);

    if (kind === "bleed") {
      // 坐标映射：-14mm .. +10mm，0mm 在 62% 处
      const zeroX = b.x + b.w * 0.60;
      const ppm = b.w / 25;
      const artEndX = zeroX + ev.bleedMm * ppm;
      const cutX = zeroX + ev.bladeTol * ppm; // 走刀偏外最坏落刀点

      // 画面色块铺到 artEndX
      c.fillStyle = spec.bg;
      c.fillRect(b.x, b.y, Math.max(0, artEndX - b.x), b.h);

      // 裁掉的废纸半透明阴影（落刀后右半变暗飞离）
      if (cutAnim > 0.05) {
        c.fillStyle = `rgba(11, 11, 11, ${0.85 * cutAnim})`;
        c.fillRect(cutX, b.y, b.x + b.w - cutX, b.h);
      }

      // 若有露白边（artEndX < cutX），合批一次画出斜线标出露白区
      if (artEndX < cutX) {
        const sx0 = Math.max(b.x, artEndX);
        c.fillStyle = "#FFFFFF";
        c.fillRect(sx0, b.y, cutX - sx0, b.h);
        c.strokeStyle = "#F72F02";
        c.lineWidth = 1;
        c.beginPath();
        for (let yy = b.y - 30; yy < b.y + b.h + 30; yy += 7) {
          c.moveTo(sx0, yy);
          c.lineTo(cutX, yy + 12);
        }
        c.stroke();
      }

      // +3mm 标准出血红虚线
      const b3X = zeroX + 3 * ppm;
      c.strokeStyle = "#B41F00";
      c.lineWidth = 1.2;
      c.setLineDash([4, 3]);
      c.beginPath(); c.moveTo(b3X, b.y); c.lineTo(b3X, b.y + b.h); c.stroke();
      c.setLineDash([]);

      // 0mm 成品蓝线
      c.strokeStyle = "#001CE7";
      c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(zeroX, b.y); c.lineTo(zeroX, b.y + b.h); c.stroke();

      // 实际钢刀落刀线（含走刀公差）
      c.strokeStyle = "#111111";
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(cutX, b.y); c.lineTo(cutX, b.y + b.h); c.stroke();

      // 顶部清晰标签
      drawBadge(c, b.x + 6, b.y + 15, `出血 ${ev.bleedMm >= 0 ? "+" : ""}${ev.bleedMm.toFixed(1)}mm`, "#0B0B0B", "#F5F3EE", "left");
      drawBadge(c, b.x + b.w - 6, b.y + 15, ev.sliverMm > 0 ? `露白 ${ev.sliverMm.toFixed(1)}mm` : "零露白 ✓", ev.sliverMm > 0 ? "#F72F02" : "#0A663F", "#FFFFFF", "right");

      // 底部标尺刻度
      c.fillStyle = "#111111";
      c.fillRect(b.x, b.y + b.h - 20, b.w, 20);
      c.fillStyle = "#E6E3DC";
      c.font = `700 10px "Space Mono", monospace`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      for (const mm of [-10, -5, 0, 3, 6]) {
        const xx = zeroX + mm * ppm;
        if (xx > b.x + 14 && xx < b.x + b.w - 14) {
          c.fillText(mm > 0 ? `+${mm}` : `${mm}`, xx, b.y + b.h - 10);
        }
      }
    } else {
      // 下半格：左刀口内缩文字安全距剖面（-4mm .. +26mm）
      const zeroX = b.x + b.w * 0.22;
      const ppm = b.w / 30;
      const artStartX = zeroX - ev.bleedMm * ppm;
      const cutInX = zeroX + ev.bladeTol * ppm; // 走刀偏内最坏落刀点
      const textX = zeroX + ev.safeMm * ppm;
      const safe6X = zeroX + 6 * ppm;

      // 背景色
      c.fillStyle = spec.bg;
      c.fillRect(Math.max(b.x, artStartX), b.y, b.x + b.w - Math.max(b.x, artStartX), b.h);

      // 左侧废纸在落刀后变暗
      if (cutAnim > 0.05) {
        c.fillStyle = `rgba(11, 11, 11, ${0.85 * cutAnim})`;
        c.fillRect(b.x, b.y, Math.max(0, cutInX - b.x), b.h);
      }

      // 大字样本「满」放大显示在真实 safeMm 位置
      c.fillStyle = spec.fg;
      c.font = `900 ${Math.min(52, Math.max(32, b.h * 0.44))}px "Noto Sans SC", sans-serif`;
      c.textAlign = "left";
      c.textBaseline = "middle";
      c.fillText(spec.headline[0], textX, b.y + b.h * 0.50);

      // 6mm 安全基准线
      c.strokeStyle = "#001CE7";
      c.lineWidth = 1.2;
      c.setLineDash([4, 3]);
      c.beginPath(); c.moveTo(safe6X, b.y); c.lineTo(safe6X, b.y + b.h); c.stroke();
      c.setLineDash([]);

      // 0mm 成品蓝线 & 偏内刀口黑线
      c.strokeStyle = "#001CE7";
      c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(zeroX, b.y); c.lineTo(zeroX, b.y + b.h); c.stroke();

      c.strokeStyle = "#111111";
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(cutInX, b.y); c.lineTo(cutInX, b.y + b.h); c.stroke();

      drawBadge(c, b.x + 6, b.y + 15, `安全距 ${ev.safeMm.toFixed(1)}mm`, "#0B0B0B", "#F5F3EE", "left");
      const statusTxt = ev.textChoppedMm > 0
        ? `切字 ${ev.textChoppedMm.toFixed(1)}mm`
        : ev.textCollides
          ? "撞上主图"
          : ev.safeOk
            ? "安全 ✓"
            : "切字险";
      drawBadge(c, b.x + b.w - 6, b.y + 15, statusTxt, ev.safeOk ? "#0A663F" : "#F72F02", "#FFFFFF", "right");

      // 底部标尺
      c.fillStyle = "#111111";
      c.fillRect(b.x, b.y + b.h - 20, b.w, 20);
      c.fillStyle = "#E6E3DC";
      c.font = `700 10px "Space Mono", monospace`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      for (const mm of [0, 6, 12, 18]) {
        const xx = zeroX + mm * ppm;
        if (xx > b.x + 14 && xx < b.x + b.w - 14) {
          c.fillText(`${mm}mm`, xx, b.y + b.h - 10);
        }
      }
    }

    c.restore();
    c.strokeStyle = "#333333";
    c.lineWidth = 1;
    c.strokeRect(b.x, b.y, b.w, b.h);
    c.restore();
  }

  // 绘制物理钢制铡刀与滑落废纸边动画（未落刀时仅绘制一次完整印张，省一半开销）
  function drawGuillotineAndWaste(c, L, ev, spec) {
    const t = L.trim;
    const raw = L.raw;
    const ease = cutAnim * cutAnim * (3 - 2 * cutAnim);
    const shiftX = -ev.bladeTol * ease;
    const shiftY = -ev.bladeTol * 0.5 * ease;

    if (ease < 0.01) {
      // 印张完全展开态：单次绘制完整印张（大幅降低软件渲染绘制次数）
      c.fillStyle = "#F5F3EE";
      c.fillRect(raw.x, raw.y, raw.w, raw.h);
      drawSpecimenArt(c, L, ev, spec, raw, 0, 0);
      c.strokeStyle = "rgba(0,0,0,0.12)";
      c.lineWidth = 1;
      c.strokeRect(t.x, t.y, t.w, t.h);
      return;
    }

    // 过渡态：淡出的未裁印张与飞离废纸边
    if (ease < 0.98) {
      c.save();
      c.globalAlpha = 1 - ease * 0.92;
      c.fillStyle = "#F5F3EE";
      c.fillRect(raw.x, raw.y, raw.w, raw.h);
      drawSpecimenArt(c, L, ev, spec, raw, 0, 0);
      c.restore();

      const fly = ease * 30;
      c.save();
      c.globalAlpha = Math.max(0, 1 - ease * 1.15);
      c.fillStyle = "#ECE9E2";
      c.strokeStyle = "rgba(0,0,0,0.22)";
      c.lineWidth = 0.8;
      const strips = [
        [raw.x, raw.y - fly, raw.w, t.y - raw.y],
        [raw.x, t.y + t.h + fly, raw.w, raw.y + raw.h - (t.y + t.h)],
        [raw.x - fly, t.y, t.x - raw.x, t.h],
        [t.x + t.w + fly, t.y, raw.x + raw.w - (t.x + t.w), t.h],
      ];
      for (const [sx, sy, sw, sh] of strips) {
        c.fillRect(sx, sy, sw, sh);
        c.strokeRect(sx, sy, sw, sh);
      }
      c.restore();
    }

    // 成品裁切区（零 shadowBlur，改用硬朗偏移暗影省 GPU/软件渲染开销）
    if (ease > 0.05) {
      c.fillStyle = `rgba(0,0,0,${0.48 * ease})`;
      c.fillRect(t.x + 6 * ease, t.y + 8 * ease, t.w, t.h);
    }
    c.fillStyle = "#FFFFFF";
    c.fillRect(t.x, t.y, t.w, t.h);
    drawSpecimenArt(c, L, ev, spec, t, shiftX, shiftY);

    c.strokeStyle = "rgba(255,255,255,0.28)";
    c.lineWidth = 1;
    c.strokeRect(t.x, t.y, t.w, t.h);

    // 钢制铡刀扫落金属刀锋
    if (bladeFlash > 0.02) {
      const sweepY = raw.y + (1 - bladeFlash) * raw.h;
      const grad = c.createLinearGradient(raw.x, sweepY - 18, raw.x, sweepY + 4);
      grad.addColorStop(0, "rgba(245,243,238,0)");
      grad.addColorStop(0.75, `rgba(245,243,238,${0.85 * bladeFlash})`);
      grad.addColorStop(1, `rgba(247,47,2,${0.95 * bladeFlash})`);
      c.fillStyle = grad;
      c.fillRect(raw.x - 10, sweepY - 18, raw.w + 20, 22);
    }
  }

  function render(t, dt, { still }) {
    resize();

    const targetCut = state.trimmed ? 1 : 0;
    let animating = false;
    if (still) {
      if (cutAnim !== targetCut || bladeFlash !== 0) dirty = true;
      cutAnim = targetCut;
      bladeFlash = 0;
    } else {
      if (Math.abs(targetCut - cutAnim) > 0.002) {
        const speed = Math.min(1, Math.max(0.08, dt * 7.5));
        cutAnim += (targetCut - cutAnim) * speed;
        if (Math.abs(targetCut - cutAnim) < 0.004) cutAnim = targetCut;
        animating = true;
      }
      if (bladeFlash > 0) {
        bladeFlash = Math.max(0, bladeFlash - dt * 2.4);
        animating = true;
      }
    }

    if (pendingSync) {
      pendingSync = false;
      onChange("drag");
    }

    if (!dirty && !animating && !still) return;
    dirty = false;

    const L = computeLayout();
    layoutCache = L;
    const ev = evaluate(state);
    const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 钢黑切纸机工作台底色 + 单次合批暗制图刻格
    ctx.fillStyle = "#0B0B0B";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(245, 243, 238, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const step = 28;
    for (let x = step; x < w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = step; y < h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();

    // 顶沿制图信息带（按画布宽自适应，绝不左右撞字）
    ctx.fillStyle = "#E5E2DA";
    ctx.font = `700 11px "Space Mono", "Noto Sans SC", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const modeLabel = w < 540
      ? (state.trimmed ? "已落刀成品" : "SRA4 未裁印张")
      : (state.trimmed ? `TRIMMED PROOF · 已落刀成品  |  ${spec.tag}` : `PRESS SHEET · SRA4 未裁印张  |  ${spec.tag}`);
    ctx.fillText(modeLabel, 14, 16);

    ctx.textAlign = "right";
    ctx.fillStyle = ev.allOk ? "#5EE0A4" : "#FF6B4A";
    ctx.fillText(ev.badge, w - 14, 16);

    // 主印张 + 铡刀实切
    drawGuillotineAndWaste(ctx, L, ev, spec);
    drawCropMarks(ctx, L, ev);
    drawHandlesAndCallouts(ctx, L, ev);

    // 右侧 4× 显微剖面（宽屏）或底部毫米刀口尺（窄屏）
    drawBladeScope(ctx, L, ev, spec);

    ctx.restore();
  }

  // 指针命中检测（判断抓到了主体大圆、标题文字框，还是背景出血）
  function hitTest(px, py) {
    if (!layoutCache) return "bleed";
    const L = layoutCache;
    const ev = evaluate(state);
    // 命中标题框区域
    const tx = L.mmToX(ev.textBox.x) - 10;
    const ty = L.mmToY(ev.textBox.y) - 18;
    const tw = L.mmToPx(ev.textBox.w) + 16;
    const th = L.mmToPx(ev.textBox.h) + 22;
    if (px >= tx && px <= tx + tw && py >= ty && py <= ty + th) return "text";

    // 命中右侧主体黑圆区域
    const sx = L.mmToX(ev.subject.cx);
    const sy = L.mmToY(ev.subject.cy);
    const sr = L.mmToPx(ev.subject.r);
    if (px >= L.trim.x + L.trim.w * 0.42 && Math.hypot(px - sx, py - sy) <= sr + 16) return "subject";

    return "bleed";
  }

  const getLocal = (e) => {
    const r = canvas.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    return { x: pt.clientX - r.left, y: pt.clientY - r.top };
  };

  let touchStartPt = null;
  let touchLockedAxis = null; // 防止垂直滑屏被拦截

  function onPointerDown(e) {
    if (e.button && e.button !== 0) return;
    const p = getLocal(e);
    const mode = hitTest(p.x, p.y);
    dragMode = mode;
    activeHit = mode;
    dragStart = {
      x: p.x,
      y: p.y,
      bleedMm: state.bleedMm,
      cropPct: state.cropPct,
      safeMm: state.safeMm,
    };
    if (state.trimmed) {
      state.trimmed = false;
      pendingSync = true;
    }
    if (e.pointerId != null && canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
    dirty = true;
  }

  function applyDelta(dx) {
    if (!dragMode || !dragStart) return;
    const L = layoutCache || computeLayout();
    const span = Math.max(120, L.trim.w);
    if (dragMode === "bleed") {
      const deltaMm = (dx / span) * 26;
      let next = clamp(dragStart.bleedMm + deltaMm, -14, 10);
      if (Math.abs(next - 3.5) < 0.45) next = 3.5;
      state.bleedMm = Math.round(next * 10) / 10;
    } else if (dragMode === "subject") {
      const deltaPct = (dx / span) * 85;
      let next = clamp(dragStart.cropPct + deltaPct, 0, 66);
      if (Math.abs(next - 44) < 1.8) next = 44;
      state.cropPct = Math.round(next);
    } else if (dragMode === "text") {
      const deltaMm = (dx / span) * 32;
      let next = clamp(dragStart.safeMm + deltaMm, -1, 24);
      if (Math.abs(next - 12) < 0.5) next = 12;
      state.safeMm = Math.round(next * 10) / 10;
    }
    dirty = true;
    pendingSync = true;
  }

  function onPointerMove(e) {
    const p = getLocal(e);
    if (!dragMode) {
      activeHit = hitTest(p.x, p.y);
      canvas.style.cursor = "ew-resize";
      return;
    }
    applyDelta(p.x - dragStart.x);
  }

  function onPointerUp(e) {
    if (dragMode && e.pointerId != null && canvas.releasePointerCapture) {
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    }
    dragMode = null;
    dragStart = null;
    dirty = true;
  }

  // 触屏支持：只拦截横向拖动，纵向留给页面滚动（GUIDE.md 规矩）
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const p = getLocal(e);
    touchStartPt = p;
    touchLockedAxis = null;
    dragMode = hitTest(p.x, p.y);
    activeHit = dragMode;
    dragStart = {
      x: p.x, y: p.y,
      bleedMm: state.bleedMm,
      cropPct: state.cropPct,
      safeMm: state.safeMm,
    };
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!touchStartPt || e.touches.length !== 1) return;
    const p = getLocal(e);
    const dx = p.x - touchStartPt.x;
    const dy = p.y - touchStartPt.y;
    if (!touchLockedAxis && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      touchLockedAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    if (touchLockedAxis === "x") {
      e.preventDefault();
      if (state.trimmed) {
        state.trimmed = false;
        pendingSync = true;
      }
      applyDelta(dx);
    }
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    touchStartPt = null;
    touchLockedAxis = null;
    dragMode = null;
    dragStart = null;
    dirty = true;
    pendingSync = true;
  });

  // 鼠标事件（非触屏）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    onPointerDown(e);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    onPointerMove(e);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    onPointerUp(e);
  });
  canvas.addEventListener("pointercancel", () => {
    dragMode = null;
    dragStart = null;
    dirty = true;
  });

  const ctrl = loop(canvas, render);

  return {
    draw: () => { dirty = true; ctrl.draw(); },
    markDirty: () => { dirty = true; },
    triggerCut: () => {
      bladeFlash = state.trimmed ? 1 : 0;
      dirty = true;
      ctrl.draw();
    },
  };
}

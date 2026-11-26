// 136 非对称跨页 —— 开场 2D Canvas 跨页视觉杠杆与配重编排台
// 1:1 承袭 136 原海报：暖米棉纸、左页群青巨弧、中缝虚线黑圆支点 ●、左下珊瑚红对角框、
// 右上三枚珊瑚圆点、暖灰山日图框、1宽2窄阶梯排线与底缘珊瑚朱红配重半圆，下方挂接实时光学天平梁。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SPREAD_H, PIVOT_X, GUTTER_HALF, clamp } from "./model.js";

const COL = {
  deskBg: "#E6DFD2",
  paper: "#EFE8DD",
  paperEdge: "#C5BEB0",
  paperShadow: "rgba(9, 25, 40, 0.10)",
  spineShadow: "rgba(9, 25, 40, 0.08)",
  spineDash: "#495364",
  ink: "#091928",
  inkSoft: "#424D5E",
  inkLight: "#727C8C",
  coral: "#ED6042",
  coralDot: "#F06D55",
  coralDark: "#B83519",
  blue: "#2250CD",
  blueDeep: "#173BA3",
  photoBg: "#DDDAD0",
  photoMtn: "#C7C3BE",
  photoSun: "#C1BDB7",
  ok: "#14664A",
  bad: "#B5231C",
  badFill: "rgba(181, 35, 28, 0.12)",
  cream: "#FAF6EE",
};

export function createHeroCanvas(canvas, getComputed, onMutate, onFlowEnd) {
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;

  // 平滑视觉状态（天平倾角、视线流进度、开场缓动、按需重绘脏标志）
  let beamAngle = -0.14;
  let intro = reducedMotion.matches ? 1 : 0;
  let flowT = -1; // -1 表示未播放，0..1 表示播放进度
  let dirty = true;
  let dragMode = null; // "arc" | "photo" | "coral" | "pan"
  let dragStart = null;
  let moved = false;
  let activeHover = null;
  let touchLocked = false;
  let touchStartPt = null;
  let bgCache = null;

  // 摊开跨页与底部天平在画布里的实际像素矩形
  function getLayout() {
    const padX = Math.max(10, Math.round(w * 0.018));
    const padTop = Math.max(14, Math.round(h * 0.04));
    const beamAreaH = Math.max(54, Math.round(h * 0.155));
    const availW = Math.max(120, w - padX * 2);
    const availH = Math.max(100, h - padTop - beamAreaH);
    const scale = Math.min(availW / 1.0, availH / SPREAD_H);
    const sw = scale * 1.0;
    const sh = scale * SPREAD_H;
    const sx = (w - sw) * 0.5;
    const sy = padTop + (availH - sh) * 0.4;
    return { sx, sy, sw, sh, scale, beamY: sy + sh + Math.max(22, beamAreaH * 0.42) };
  }

  function rebuildBgCache() {
    if (!w || !h) return;
    if (!bgCache) bgCache = document.createElement("canvas");
    bgCache.width = Math.round(w * dpr);
    bgCache.height = Math.round(h * dpr);
    const bctx = bgCache.getContext("2d");
    const L = getLayout();
    const { sx, sy, sw, sh, scale } = L;
    bctx.save();
    bctx.scale(dpr, dpr);
    bctx.fillStyle = COL.deskBg;
    bctx.fillRect(0, 0, w, h);
    bctx.strokeStyle = "rgba(9, 25, 40, 0.045)";
    bctx.lineWidth = 1;
    const step = 28;
    bctx.beginPath();
    for (let gx = (sx % step); gx < w; gx += step) {
      bctx.moveTo(gx, 0);
      bctx.lineTo(gx, h);
    }
    for (let gy = (sy % step); gy < h; gy += step) {
      bctx.moveTo(0, gy);
      bctx.lineTo(w, gy);
    }
    bctx.stroke();

    // 纸页阴影与暖米棉纸底板
    bctx.fillStyle = "rgba(9, 25, 40, 0.11)";
    bctx.fillRect(sx + 4, sy + 6, sw, sh);
    bctx.fillStyle = "#E4DCCE";
    bctx.fillRect(sx - 3, sy + 3, sw + 6, sh + 2);
    bctx.fillStyle = COL.paper;
    bctx.fillRect(sx, sy, sw, sh);

    // 静态书脊凹槽微影
    const spineX = sx + PIVOT_X * scale;
    const swHalf = 0.055 * scale;
    const spineGrad = bctx.createLinearGradient(spineX - swHalf, 0, spineX + swHalf, 0);
    spineGrad.addColorStop(0, "rgba(9,25,40,0)");
    spineGrad.addColorStop(0.45, "rgba(9,25,40,0.055)");
    spineGrad.addColorStop(0.5, "rgba(9,25,40,0.11)");
    spineGrad.addColorStop(0.56, "rgba(255,255,255,0.22)");
    spineGrad.addColorStop(1, "rgba(9,25,40,0)");
    bctx.fillStyle = spineGrad;
    bctx.fillRect(spineX - swHalf, sy, swHalf * 2, sh);
    bctx.restore();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    // 遵循 GUIDE.md：窄屏/手机像素比上限 1.5，兼顾锐利与软件渲染高帧率
    dpr = rect.width < 540 ? pixelRatio(1.5) : pixelRatio(2);
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    rebuildBgCache();
    dirty = true;
  }

  function pxToNorm(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const lx = clientX - rect.left;
    const ly = clientY - rect.top;
    const L = getLayout();
    return {
      lx,
      ly,
      nx: (lx - L.sx) / L.scale,
      ny: (ly - L.sy) / L.scale,
      L,
    };
  }

  function hitTest(nx, ny, comp) {
    const { coral, photo, anchor, textBlocks } = comp.geom;
    // 1. 珊瑚朱红配重锚点（即使为 0 也留出底缘热区方便拖出）
    const hitCoralR = Math.max(0.068, coral.r + 0.02);
    if (Math.hypot(nx - coral.cx, ny - coral.cy) <= hitCoralR && ny >= SPREAD_H - hitCoralR && ny <= SPREAD_H + 0.06) {
      return "coral";
    }
    // 2. 主视觉蓝弧前沿（优先于被盖住的图框，方便直接把跨缝过深的蓝弧拉回）
    if (Math.abs(nx - anchor.reachX) <= 0.05 && ny >= 0.02 && ny <= SPREAD_H - 0.02) {
      return "arc";
    }
    // 3. 暖灰图像框（严格框内命中，不侵占书脊中缝）
    if (nx >= photo.x + 0.008 && nx <= photo.x + photo.w && ny >= photo.y && ny <= photo.y + photo.h) {
      return "photo";
    }
    // 4. 正文阶梯区（点按切换密度，横拖仍可推拉主视觉伸展度）
    for (const tb of textBlocks) {
      if (nx >= tb.x && nx <= tb.x + tb.w && ny >= tb.y && ny <= tb.y + tb.h) {
        return "text";
      }
    }
    return "pan";
  }

  function drawSpread(t, dt, { still }) {
    if (!w || !h) resize();
    if (!w || !h) return;

    const comp = getComputed();
    const { state, spec, geom, metrics, diag } = comp;
    const L = getLayout();

    // 动画步进
    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + dt * 2.2);
    }
    const easeIntro = 1 - Math.pow(1 - intro, 3);

    // 实体天平梁倾角（与净偏衡单真源联动）
    const targetAngle = clamp((metrics.torqueImbalancePct / 100) * 0.24, -0.22, 0.22);
    const animating = intro < 1 || flowT >= 0 || Math.abs(targetAngle - beamAngle) > 0.0015;
    if (!dirty && !animating && !still) return;

    if (still) {
      beamAngle = targetAngle;
    } else if (Math.abs(targetAngle - beamAngle) > 0.0015) {
      beamAngle += (targetAngle - beamAngle) * Math.min(1, (dt || 0.016) * 12);
    } else {
      beamAngle = targetAngle;
    }
    dirty = false;

    if (flowT >= 0) {
      if (still) {
        flowT = 1;
      } else {
        flowT += (dt || 0.016) * 0.42;
        if (flowT >= 1.15) {
          flowT = -1;
          dirty = true;
          if (onFlowEnd) onFlowEnd();
        }
      }
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 0. 复用离屏静态桌面网格 + 纸页底板 + 书脊凹槽缓存（每帧仅 1 次 drawImage）
    if (bgCache) {
      ctx.drawImage(bgCache, 0, 0, w, h);
    } else {
      ctx.fillStyle = COL.deskBg;
      ctx.fillRect(0, 0, w, h);
    }

    const { sx, sy, sw, sh, scale } = L;
    const px = (nx) => sx + nx * scale;
    const py = (ny) => sy + ny * scale;
    const ps = (nv) => nv * scale;
    const spineX = px(PIVOT_X);

    // 裁切在跨页纸面内部绘制所有出版物元素
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, sy, sw, sh);
    ctx.clip();

    // 2. 主视觉块（随开场 easeIntro 轻柔推展到位）
    const anchor = geom.anchor;
    ctx.save();
    if (anchor.type === "arc") {
      const animShift = (1 - easeIntro) * (anchor.flipped ? 0.12 : -0.12);
      ctx.fillStyle = spec.primaryColor;
      ctx.beginPath();
      ctx.ellipse(
        px(anchor.cx + animShift),
        py(anchor.cy),
        ps(anchor.rx),
        ps(anchor.ry),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 左下（或反拍时右下）1:1 复刻原海报珊瑚朱红对角线方框 [ / ]
      const boxS = ps(0.088);
      const boxX = anchor.flipped ? sx + sw - ps(0.048) - boxS : sx + ps(0.048);
      const boxY = sy + sh - ps(0.052) - boxS;
      ctx.strokeStyle = COL.coral;
      ctx.lineWidth = Math.max(1.5, ps(0.0032));
      ctx.strokeRect(boxX, boxY, boxS, boxS);
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + boxS);
      ctx.lineTo(boxX + boxS, boxY);
      ctx.stroke();
    } else if (state.specimen === "photo") {
      // 摄影画册标本：深蓝海堤大片 + 极简建筑地平线与光带
      const rx = px(anchor.x);
      const ry = py(anchor.y);
      const rw = ps(anchor.w);
      const rh = ps(anchor.h);
      const g = ctx.createLinearGradient(rx, ry, rx, ry + rh);
      g.addColorStop(0, "#234CC4");
      g.addColorStop(0.56, "#16358E");
      g.addColorStop(1, "#0B1B49");
      ctx.fillStyle = g;
      ctx.fillRect(rx, ry, rw, rh);
      // 极简海平线与光柱（干净建筑摄影语言）
      ctx.fillStyle = "rgba(250, 246, 238, 0.16)";
      ctx.fillRect(rx, ry + rh * 0.54, rw, rh * 0.015);
      ctx.fillStyle = "rgba(250, 246, 238, 0.10)";
      ctx.beginPath();
      ctx.moveTo(rx + rw * 0.14, ry + rh);
      ctx.lineTo(rx + rw * 0.44, ry + rh * 0.34);
      ctx.lineTo(rx + rw * 0.72, ry + rh * 0.34);
      ctx.lineTo(rx + rw * 0.94, ry + rh);
      ctx.closePath();
      ctx.fill();
      // 远景圆月锚点
      ctx.fillStyle = "#FAF6EE";
      ctx.beginPath();
      ctx.arc(rx + rw * (anchor.flipped ? 0.68 : 0.32), ry + rh * 0.25, ps(0.03), 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 建筑年刊标本：深群青蓝图立面 + 细白结构格线与悬挑斜切
      const rx = px(anchor.x);
      const ry = py(anchor.y);
      const rw = ps(anchor.w);
      const rh = ps(anchor.h);
      ctx.fillStyle = spec.primaryColor;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = "rgba(250, 246, 238, 0.22)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const lx = rx + (rw * i) / 5;
        ctx.beginPath();
        ctx.moveTo(lx, ry);
        ctx.lineTo(lx, ry + rh);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(11, 27, 73, 0.42)";
      ctx.beginPath();
      ctx.moveTo(rx, ry + rh * 0.76);
      ctx.lineTo(rx + rw * 0.86, ry + rh * 0.24);
      ctx.lineTo(rx + rw, ry + rh * 0.24);
      ctx.lineTo(rx + rw, ry + rh);
      ctx.lineTo(rx, ry + rh);
      ctx.closePath();
      ctx.fill();
    }

    // 主视觉块上的高对比出版标题（自示范原海报排版，暖白确保对比度 > 6.5:1）
    const titlePad = ps(0.048);
    const titleX = anchor.flipped ? sx + sw - titlePad : sx + titlePad;
    const titleAlign = anchor.flipped ? "right" : "left";
    ctx.textAlign = titleAlign;
    ctx.textBaseline = "middle";
    const bigFs = Math.max(12, Math.round(ps(0.052)));
    ctx.font = `900 ${bigFs}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = COL.cream;
    ctx.fillText(spec.titleZh, titleX, py(SPREAD_H * 0.44));

    const enFs = Math.max(8, Math.round(ps(0.017)));
    ctx.font = `700 ${enFs}px "Chivo", sans-serif`;
    ctx.fillStyle = "rgba(250, 246, 238, 0.86)";
    ctx.fillText(spec.titleEn, titleX, py(SPREAD_H * 0.44) + bigFs * 0.72);

    // 珊瑚短横杠（1:1 原海报细节）
    const barW = ps(0.08);
    const barX = anchor.flipped ? titleX - barW : titleX;
    const barY = py(SPREAD_H * 0.44) + bigFs * 1.15;
    ctx.fillStyle = COL.coralDot;
    ctx.fillRect(barX, barY, barW, Math.max(2, ps(0.004)));

    const subFs = Math.max(8, Math.round(ps(0.0155)));
    ctx.font = `500 ${subFs}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "rgba(250, 246, 238, 0.90)";
    ctx.fillText(spec.subZh, titleX, barY + subFs * 1.45);
    ctx.restore();

    // 3. 右页（或反拍左页）右上角三枚珊瑚圆点 ● ● ●（1:1 原海报）
    const dotR = Math.max(2.6, ps(0.0068));
    for (let i = 0; i < 3; i++) {
      const dx = state.flipped
        ? sx + ps(0.042) + i * ps(0.022)
        : sx + sw - ps(0.042) - (2 - i) * ps(0.022);
      ctx.fillStyle = COL.coralDot;
      ctx.beginPath();
      ctx.arc(dx, sy + ps(0.036), dotR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. 暖灰图像框（可拖拽！）
    const ph = geom.photo;
    const phX = px(ph.x);
    const phY = py(ph.y);
    const phW = ps(ph.w);
    const phH = ps(ph.h);

    ctx.fillStyle = COL.photoBg;
    ctx.fillRect(phX, phY, phW, phH);

    // 框内 1:1 复刻原海报柔和山峰与圆日剪影（或标本副图）
    ctx.save();
    ctx.beginPath();
    ctx.rect(phX, phY, phW, phH);
    ctx.clip();
    ctx.fillStyle = COL.photoSun;
    ctx.beginPath();
    ctx.arc(phX + phW * 0.22, phY + phH * 0.34, Math.min(phW, phH) * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COL.photoMtn;
    ctx.beginPath();
    ctx.moveTo(phX, phY + phH);
    ctx.lineTo(phX + phW * 0.33, phY + phH * 0.54);
    ctx.lineTo(phX + phW * 0.47, phY + phH * 0.70);
    ctx.lineTo(phX + phW * 0.68, phY + phH * 0.38);
    ctx.lineTo(phX + phW, phY + phH * 0.88);
    ctx.lineTo(phX + phW, phY + phH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 图像框轻边与拖动手柄提示
    ctx.strokeStyle =
      dragMode === "photo" || activeHover === "photo" ? COL.blue : "rgba(9, 25, 40, 0.22)";
    ctx.lineWidth = dragMode === "photo" || activeHover === "photo" ? 1.8 : 1;
    ctx.strokeRect(phX, phY, phW, phH);

    // 图像框下 1px 原海报分隔线
    ctx.strokeStyle = "rgba(9, 25, 40, 0.32)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(phX, phY + phH + ps(0.012));
    ctx.lineTo(phX + phW, phY + phH + ps(0.012));
    ctx.stroke();

    // 5. 正文阶梯 / 墙式文字块（直接按单真源矩形绘制）
    const lblFs = Math.max(8, Math.round(ps(0.014)));
    for (const tb of geom.textBlocks) {
      const tx = px(tb.x);
      const ty = py(tb.y);
      const tw = ps(tb.w);
      const th = ps(tb.h);

      const hitsGutter =
        tb.x < PIVOT_X + GUTTER_HALF && tb.x + tb.w > PIVOT_X - GUTTER_HALF;
      if (hitsGutter) {
        ctx.fillStyle = COL.badFill;
        ctx.fillRect(tx, ty, tw, th);
        ctx.strokeStyle = COL.bad;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]);
        ctx.strokeRect(tx, ty, tw, th);
        ctx.setLineDash([]);
      }

      if (tb.diagram) {
        // 1:1 复刻原海报右下「引导视线：橙点 → 蓝方」小框！
        ctx.fillStyle = COL.coralDot;
        ctx.fillRect(tx, ty, ps(0.008), ps(0.008));
        ctx.fillStyle = COL.ink;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.font = `700 ${lblFs}px "Noto Sans SC", sans-serif`;
        ctx.fillText(spec.guideHead, tx + ps(0.015), ty - 1);

        const gx = tx;
        const gy = ty + lblFs + 4;
        const gw = tw;
        const gh = Math.max(20, th - lblFs - 4);
        ctx.strokeStyle = "rgba(9, 25, 40, 0.34)";
        ctx.lineWidth = 1;
        ctx.strokeRect(gx, gy, gw, gh);
        // 橙圆点 → 箭线 → 深蓝小方块
        const ox = gx + gw * 0.22;
        const oy = gy + gh * 0.30;
        const bx = gx + gw * 0.78;
        const by = gy + gh * 0.72;
        ctx.strokeStyle = COL.inkSoft;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(bx - 5, by - 4);
        ctx.stroke();
        // 箭头
        ctx.beginPath();
        ctx.moveTo(bx - 5, by - 4);
        ctx.lineTo(bx - 11, by - 4);
        ctx.moveTo(bx - 5, by - 4);
        ctx.lineTo(bx - 6, by - 10);
        ctx.stroke();
        ctx.fillStyle = COL.coral;
        ctx.beginPath();
        ctx.arc(ox, oy, Math.max(3, ps(0.008)), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COL.blue;
        const sq = Math.max(5, ps(0.013));
        ctx.fillRect(bx - sq * 0.5, by - sq * 0.5, sq, sq);
      } else {
        // 珊瑚小方标 + 标题 + 模拟正文横线
        const hasTitle = tb.id === "wide" || tb.id === "subL" || tb.id === "note";
        let curY = ty;
        if (hasTitle) {
          ctx.fillStyle = COL.coralDot;
          ctx.fillRect(tx, curY + 1, ps(0.010), ps(0.010));
          ctx.fillStyle = COL.ink;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.font = `700 ${lblFs}px "Noto Sans SC", sans-serif`;
          const headStr =
            tb.id === "wide" ? spec.captionHead : tb.id === "subL" ? spec.detailHead : spec.captionHead;
          ctx.fillText(headStr, tx + ps(0.018), curY - 1);
          curY += lblFs + 5;
        }
        const nLines = tb.lines || 3;
        const availH = Math.max(8, ty + th - curY);
        const lineGap = availH / Math.max(1, nLines);
        ctx.strokeStyle = tb.dense ? "rgba(9, 25, 40, 0.55)" : "rgba(9, 25, 40, 0.36)";
        ctx.lineWidth = tb.dense ? Math.max(1.5, ps(0.003)) : 1.1;
        ctx.beginPath();
        for (let i = 0; i < nLines; i++) {
          const ly = curY + i * lineGap + 2;
          const lenFactor = i === nLines - 1 ? 0.72 : 1.0;
          ctx.moveTo(tx, ly);
          ctx.lineTo(tx + tw * lenFactor, ly);
        }
        ctx.stroke();
      }
    }

    // 6. 底缘珊瑚朱红配重半圆（可拖动改写力臂 + 点击切换大小！）
    const co = geom.coral;
    const coX = px(co.cx);
    const coY = py(co.cy);
    if (co.r > 0) {
      ctx.fillStyle = COL.coral;
      ctx.beginPath();
      ctx.arc(coX, coY, ps(co.r), Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();

      // 拖拽高亮外环
      if (dragMode === "coral" || activeHover === "coral") {
        ctx.strokeStyle = COL.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(coX, coY, ps(co.r) + 3, Math.PI, 0, false);
        ctx.stroke();
      }
      // 标注“拖配重”小圆锚
      ctx.fillStyle = COL.cream;
      ctx.beginPath();
      ctx.arc(coX, coY - ps(co.r) * 0.48, Math.max(2.5, ps(0.006)), 0, Math.PI * 2);
      ctx.fill();
    } else if (state.showGuides) {
      // 无配重时画一个虚线缺位提示槽 + 实底高对比药丸签，绝不被红虚框文字压糊
      const rHint = ps(0.068);
      ctx.strokeStyle = COL.coralDark;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(coX, coY, rHint, Math.PI, 0, false);
      ctx.stroke();
      ctx.setLineDash([]);
      const lbl = "缺配重 · 点此加";
      const fs = Math.max(10, Math.round(ps(0.0155)));
      ctx.font = `700 ${fs}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(lbl).width + 12;
      const th = fs + 7;
      ctx.fillStyle = COL.cream;
      ctx.fillRect(coX - tw * 0.5, coY - th - 4, tw, th);
      ctx.strokeStyle = COL.coralDark;
      ctx.lineWidth = 1;
      ctx.strokeRect(coX - tw * 0.5, coY - th - 4, tw, th);
      ctx.fillStyle = COL.coralDark;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(lbl, coX, coY - th * 0.5 - 4);
    }

    // 7. 辅助标尺层（中缝安全吞噬带、蓝弧前沿拖柄、书脊虚线与黑圆支点 ●）
    if (state.showGuides) {
      // 中缝安全带
      const gHalf = ps(GUTTER_HALF);
      ctx.fillStyle = metrics.textHitsGutter
        ? "rgba(181, 35, 28, 0.14)"
        : "rgba(9, 25, 40, 0.04)";
      ctx.fillRect(spineX - gHalf, sy, gHalf * 2, sh);

      // 主视觉前沿控制柄（直接可左右推拉）
      const reachPx = px(anchor.reachX);
      const handleY = py(SPREAD_H * 0.22);
      ctx.strokeStyle =
        dragMode === "arc" || activeHover === "arc" ? COL.coral : "rgba(9, 25, 40, 0.38)";
      ctx.lineWidth = dragMode === "arc" ? 2 : 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(reachPx, sy + 6);
      ctx.lineTo(reachPx, sy + sh - 6);
      ctx.stroke();
      ctx.setLineDash([]);

      // 拖柄胶囊
      const pillW = Math.max(26, ps(0.056));
      const pillH = Math.max(18, ps(0.032));
      ctx.fillStyle = dragMode === "arc" ? COL.coral : COL.ink;
      ctx.fillRect(reachPx - pillW * 0.5, handleY - pillH * 0.5, pillW, pillH);
      ctx.fillStyle = COL.cream;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `600 ${Math.max(9, Math.round(ps(0.015)))}px "IBM Plex Mono", monospace`;
      ctx.fillText("↔", reachPx, handleY);
    }

    // 1:1 复刻原海报贯穿书脊细虚线与中央实心黑圆支点 ●
    ctx.strokeStyle = COL.spineDash;
    ctx.lineWidth = 1.25;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(spineX, sy);
    ctx.lineTo(spineX, sy + sh);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = COL.ink;
    ctx.beginPath();
    ctx.arc(spineX, py(SPREAD_H * 0.5), Math.max(4.5, ps(0.0105)), 0, Math.PI * 2);
    ctx.fill();

    // 8. 视线演练动线（按 Space 或按钮触发，或 reducedMotion 下展示静态轨迹）
    if (flowT >= 0) {
      const pts = geom.flowPoints.map((p) => ({ x: px(p.x), y: py(p.y) }));
      ctx.strokeStyle = COL.coral;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 沿折线插值光球位置
      const clampedT = clamp(flowT, 0, 1);
      const segs = pts.length - 1;
      const segPos = clampedT * segs;
      const idx = Math.min(segs - 1, Math.floor(segPos));
      const frac = segPos - idx;
      const fx = pts[idx].x + (pts[idx + 1].x - pts[idx].x) * frac;
      const fy = pts[idx].y + (pts[idx + 1].y - pts[idx].y) * frac;

      ctx.fillStyle = "rgba(237, 96, 66, 0.25)";
      ctx.beginPath();
      ctx.arc(fx, fy, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COL.coral;
      ctx.beginPath();
      ctx.arc(fx, fy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COL.cream;
      ctx.beginPath();
      ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // 结束跨页纸裁切

    // 纸页锐利 1px 外框
    ctx.strokeStyle = COL.paperEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, sw, sh);

    // 左/右页角小字标注（Verso / Recto）
    const metaFs = Math.max(9, Math.min(11, Math.round(ps(0.017))));
    ctx.font = `500 ${metaFs}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = COL.inkLight;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    ctx.fillText(`VERSO · ${metrics.screenLeftShare}%`, sx + 2, sy - 4);
    ctx.textAlign = "right";
    ctx.fillText(`RECTO · ${metrics.screenRightShare}%`, sx + sw - 2, sy - 4);

    // 9. 底部实体光学天平梁（把抽象的「动态平衡」做成一眼看懂的物理力学跷跷板！）
    const beamCx = spineX;
    const beamCy = L.beamY;
    const beamHalf = sw * 0.41;

    // 水平基准虚线
    ctx.strokeStyle = "rgba(9, 25, 40, 0.20)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(beamCx - beamHalf - 10, beamCy);
    ctx.lineTo(beamCx + beamHalf + 10, beamCy);
    ctx.stroke();
    ctx.setLineDash([]);

    // 支点黑三角
    ctx.fillStyle = COL.ink;
    ctx.beginPath();
    ctx.moveTo(beamCx, beamCy + 2);
    ctx.lineTo(beamCx - 7, beamCy + 14);
    ctx.lineTo(beamCx + 7, beamCy + 14);
    ctx.closePath();
    ctx.fill();

    // 倾转杠杆梁
    ctx.save();
    ctx.translate(beamCx, beamCy);
    ctx.rotate(beamAngle);
    ctx.strokeStyle = diag.tone === "ok" ? COL.ok : COL.ink;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-beamHalf, 0);
    ctx.lineTo(beamHalf, 0);
    ctx.stroke();

    // 左端群青主视觉配重珠 & 右端珊瑚配重珠
    ctx.fillStyle = state.flipped ? COL.coral : COL.blue;
    ctx.beginPath();
    ctx.arc(-beamHalf, 0, state.flipped ? 4 + state.coralSize * 1.4 : 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = state.flipped ? COL.blue : COL.coral;
    ctx.beginPath();
    ctx.arc(beamHalf, 0, state.flipped ? 7.5 : 4 + state.coralSize * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // 实测视觉重心游标
    const cgOffsetPx = clamp((metrics.cgX - PIVOT_X) * sw * 1.35, -beamHalf + 10, beamHalf - 10);
    ctx.fillStyle = diag.tone === "ok" ? COL.ok : COL.bad;
    ctx.beginPath();
    ctx.arc(cgOffsetPx, -7, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 天平下方单行白话力矩读数
    ctx.font = `600 ${Math.max(10, Math.min(12, Math.round(w * 0.015)))}px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = diag.tone === "ok" ? COL.ok : COL.bad;
    const torqueWord =
      Math.abs(metrics.torqueImbalancePct) <= 15
        ? `动态平衡 · 净偏衡 ${metrics.torqueImbalancePct > 0 ? "+" : ""}${metrics.torqueImbalancePct}%（示意）`
        : metrics.torqueImbalancePct < 0
        ? `向左侧沉坠 ${metrics.torqueImbalancePct}%（示意）`
        : `向右侧沉坠 +${metrics.torqueImbalancePct}%（示意）`;
    ctx.fillText(torqueWord, beamCx, beamCy + 17);

    ctx.restore();
  }

  const runner = loop(canvas, drawSpread);

  // ---------- 指针与触屏交互（保证竖滑滚屏丝滑，横拖/拖件响应灵敏） ----------
  function onDown(clientX, clientY) {
    const comp = getComputed();
    const pt = pxToNorm(clientX, clientY);
    const hit = hitTest(pt.nx, pt.ny, comp);
    dragMode = hit;
    moved = false;
    dragStart = {
      nx: pt.nx,
      ny: pt.ny,
      anchorReach: comp.state.anchorReach,
      photoX: comp.state.photoX,
      photoY: comp.state.photoY,
      coralX: comp.state.coralX,
      flipped: comp.state.flipped,
    };
  }

  function onMove(clientX, clientY) {
    const comp = getComputed();
    const pt = pxToNorm(clientX, clientY);
    if (!dragMode) {
      const h2 = hitTest(pt.nx, pt.ny, comp);
      if (h2 !== activeHover) {
        activeHover = h2;
        canvas.style.cursor =
          h2 === "arc" || h2 === "coral"
            ? "ew-resize"
            : h2 === "photo"
            ? "grab"
            : h2 === "text"
            ? "pointer"
            : "ew-resize";
        dirty = true;
        if (reducedMotion.matches) runner.draw();
      }
      return;
    }

    const dnx = pt.nx - dragStart.nx;
    const dny = pt.ny - dragStart.ny;
    if (Math.hypot(dnx, dny) > 0.008) moved = true;
    const dir = dragStart.flipped ? -1 : 1;

    if (dragMode === "arc" || dragMode === "pan" || dragMode === "text") {
      const nextReach = clamp(dragStart.anchorReach + dnx * dir, 0.24, 0.66);
      onMutate({ anchorReach: Number(nextReach.toFixed(3)) });
    } else if (dragMode === "photo") {
      const nextX = clamp(dragStart.photoX + dnx * dir, 0.52, 0.86);
      const nextY = clamp(dragStart.photoY + dny, 0.19, 0.48);
      onMutate({ photoX: Number(nextX.toFixed(3)), photoY: Number(nextY.toFixed(3)) });
    } else if (dragMode === "coral") {
      const nextCx = clamp(dragStart.coralX + dnx * dir, 0.54, 0.91);
      const patch = { coralX: Number(nextCx.toFixed(3)) };
      // 如果原本关着配重，一拖就自动生出原海报半圆
      if (comp.state.coralSize === 0 && moved) patch.coralSize = 2;
      onMutate(patch);
    }
  }

  function onUp() {
    if (!dragMode) return;
    const comp = getComputed();
    // 没怎么拖动 → 视为点按切换构件
    if (!moved) {
      if (dragMode === "coral") {
        onMutate({ coralSize: (comp.state.coralSize + 1) % 4 });
      } else if (dragMode === "text") {
        const order = ["wall", "tiered", "minimal", "centered"];
        const idx = order.indexOf(comp.state.textMode);
        onMutate({ textMode: order[(idx + 1) % order.length] });
      } else if (dragMode === "photo") {
        const scales = [0.76, 0.92, 1.14];
        const cur = comp.state.photoScale;
        const nextScale = scales.find((v) => v > cur + 0.04) ?? scales[0];
        onMutate({ photoScale: nextScale });
      }
    }
    dragMode = null;
    dragStart = null;
    dirty = true;
    if (reducedMotion.matches) runner.draw();
  }

  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    onDown(e.clientX, e.clientY);
  });
  window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
  window.addEventListener("mouseup", onUp);

  // 触摸：优先让纵向滑动正常滚动页面；明确横向拖或拖住可拖构件时锁定水平拖动
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const tc = e.touches[0];
      touchStartPt = { x: tc.clientX, y: tc.clientY };
      touchLocked = false;
      onDown(tc.clientX, tc.clientY);
      if (dragMode === "coral" || dragMode === "photo" || dragMode === "arc") {
        touchLocked = true;
      }
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length !== 1 || !touchStartPt) return;
      const tc = e.touches[0];
      const dx = Math.abs(tc.clientX - touchStartPt.x);
      const dy = Math.abs(tc.clientY - touchStartPt.y);
      if (!touchLocked) {
        if (dx > dy + 4) touchLocked = true;
        else if (dy > dx + 6) {
          // 明显在滚页面，释放拖拽
          dragMode = null;
          return;
        }
      }
      if (touchLocked) {
        e.preventDefault();
        onMove(tc.clientX, tc.clientY);
      }
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchend",
    () => {
      onUp();
      touchStartPt = null;
      touchLocked = false;
    },
    { passive: true }
  );

  const ro = new ResizeObserver(() => {
    resize();
    runner.draw();
  });
  ro.observe(canvas);

  return {
    draw: () => {
      dirty = true;
      // 减少动态效果或离屏时立即同步画一帧；正常模式下交由 rAF 合并每帧只画一次，杜绝双绘掉帧
      if (reducedMotion.matches) runner.draw();
    },
    playFlow: () => {
      flowT = 0;
      dirty = true;
      if (reducedMotion.matches) runner.draw();
    },
  };
}

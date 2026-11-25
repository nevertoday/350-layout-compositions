// 237 覆盖布局主舞台 2D Canvas 光学层叠剧场
// 1:1 承袭原海报午夜黑蓝 + 电青/洋红/薰衣紫三平面光学语言
// 支持 0° 正视实时遮罩拖扫 + 32° Z 轴侧剖透视 + 底层点击穿透压测 + 前景退出/消套娃直点

import { pixelRatio } from "../../lib/stage.js";
import { PALETTE, SCENARIOS, FOCUS_MODES, LAYER_MODES, SCRIM_MIN, SCRIM_MAX, evaluate } from "./model.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

export function createHeroStage(canvas, getState, handlers) {
  let ctx = canvas.getContext("2d");
  const mainCtx = ctx;
  const bgCache = document.createElement("canvas");
  const bgCtx = bgCache.getContext("2d");
  let bgCacheKey = "";
  let W = 640;
  let H = 420;
  let dpr = 1;

  function renderBaseTo(targetCtx, state, ev, t, iso, lm) {
    ctx = targetCtx;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PALETTE.night;
    ctx.fillRect(0, 0, W, H);
    drawPosterMotifs(ev, t);
    drawBackgroundLayer(state, ev, iso);
    if (lm.aboveHeader) drawBaseHeader(state, ev, iso, 0.32, false);
    ctx.restore();
    ctx = mainCtx;
  }

  // 平滑过渡动画状态
  let animIso = 0; // 0 = 正视, 1 = 32° Z轴拆层
  let introT = 0; // 0..1 开场入场（每一帧都清晰好看）
  let dirty = true; // 仅在画面变化/动画/拖动时重绘，省电且软件渲染满帧
  let dragging = false;
  let dragStartX = 0;
  let dragStartScrim = 6;
  let pointerMoved = false;
  let dragHandleAlpha = 0;

  // 互动反馈涟漪（点击穿透红闪 / 阻断护盾洋红环 / 关闭测试青环）
  const ripples = [];

  function markDirty() {
    dirty = true;
  }

  function addRipple(nx, ny, kind, label) {
    ripples.push({ nx, ny, kind, label, age: 0, maxAge: 1.15 });
    dirty = true;
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    dpr = r.width <= 680 ? pixelRatio(1.5) : pixelRatio(2);
    const nw = Math.round(r.width * dpr);
    const nh = Math.round(r.height * dpr);
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
      dirty = true;
    }
    W = r.width;
    H = r.height;
  }

  // 将 (u, v) 平面矩形根据 iso 系数与深度层 zIndex 映射到画布像素
  // iso = 0 时完全贴合正视画框；iso = 1 时斜向拉开成 32° 轴测玻璃片叠层！
  function projectPoint(u, v, zLevel, iso) {
    const padX = W * 0.045;
    const padY = H * 0.055;
    const flatX = padX + u * (W - padX * 2);
    const flatY = padY + v * (H - padY * 2);
    if (iso < 0.001) return { x: flatX, y: flatY };

    // 轴测投影：将水平矩形压成平行四边形薄片，沿竖轴按 zLevel 抬升
    const cx = W * 0.52;
    const cy = H * 0.62;
    const du = u - 0.5;
    const dv = v - 0.5;
    const scaleX = W * 0.58;
    const scaleY = H * 0.34;
    const isoX = cx + (du * 0.92 - dv * 0.42) * scaleX;
    const isoY = cy + (du * 0.24 + dv * 0.68) * scaleY - zLevel * (H * 0.145);
    return {
      x: lerp(flatX, isoX, iso),
      y: lerp(flatY, isoY, iso),
    };
  }

  function traceProjectedRect(rx, ry, rw, rh, zLevel, iso) {
    const p1 = projectPoint(rx, ry, zLevel, iso);
    const p2 = projectPoint(rx + rw, ry, zLevel, iso);
    const p3 = projectPoint(rx + rw, ry + rh, zLevel, iso);
    const p4 = projectPoint(rx, ry + rh, zLevel, iso);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();
    return { p1, p2, p3, p4 };
  }

  // 原海报标志点阵装饰（合批单次 stroke/fill，大幅降低软件渲染绘制调用）
  function drawPosterMotifs(ev, t) {
    ctx.save();
    ctx.strokeStyle = "rgba(83, 239, 252, 0.045)";
    ctx.lineWidth = 1;
    const step = Math.max(32, Math.round(W / 16));
    ctx.beginPath();
    for (let x = step; x < W; x += step) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
    }
    for (let y = step; y < H; y += step) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();

    // 右上原海报同款 6×4 电青点阵（单次合批 fill）
    const dotGap = Math.max(8, Math.min(13, W * 0.017));
    const startX = W - dotGap * 6.8;
    const startY = H * 0.065;
    ctx.fillStyle = "rgba(83, 239, 252, 0.52)";
    ctx.beginPath();
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        const px = startX + c * dotGap;
        const py = startY + r * dotGap;
        ctx.moveTo(px + 1.7, py);
        ctx.arc(px, py, 1.7, 0, Math.PI * 2);
      }
    }
    ctx.fill();

    // 右侧原海报同款洋红竖点阵（单次合批 fill）
    const mGap = Math.max(9, Math.min(14, H * 0.032));
    const mx0 = W - mGap * 3.1;
    const my0 = H * 0.52;
    ctx.fillStyle = "rgba(235, 89, 161, 0.34)";
    ctx.beginPath();
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 3; c++) {
        const px = mx0 + c * mGap;
        const py = my0 + r * mGap;
        ctx.moveTo(px + 1.8, py);
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      }
    }
    ctx.fill();

    // 右下角原海报标志性「实心薰衣紫圆 + 空心电青环」叠圆徽记
    const brR = Math.max(13, Math.min(24, W * 0.034));
    const bx = W - brR * 1.65;
    const by = H - brR * 1.35;
    const pulse = ev.passed ? 1 + Math.sin(t * 2.4) * 0.035 : 1;
    ctx.beginPath();
    ctx.arc(bx - brR * 0.72, by + brR * 0.16, brR * 0.66, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(111, 101, 181, 0.85)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(bx, by, brR * pulse, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(19, 95, 133, 0.25)";
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = ev.passed ? PALETTE.pass : PALETTE.cyanBright;
    ctx.stroke();
    ctx.restore();
  }

  // 绘制背景底层文档页（薰衣紫体系 + 原海报紫方块基因 + 真实可点的「清空草稿」危险按钮）
  function drawBackgroundLayer(state, ev, iso) {
    const zBg = 0;
    const activeGlow = state.activeLayer === "bg";

    ctx.save();
    traceProjectedRect(0.02, 0.03, 0.96, 0.94, zBg, iso);
    ctx.fillStyle = "#14112B";
    ctx.fill();
    ctx.lineWidth = activeGlow ? 2.4 : 1.25;
    ctx.strokeStyle = activeGlow ? "#C4A8FF" : "rgba(152, 101, 197, 0.65)";
    ctx.stroke();

    // 原海报标志：左下大片薰衣紫实体装饰块 + 中心大洋红圆隐影（充当背景工作台的视觉肌理）
    traceProjectedRect(0.055, 0.43, 0.31, 0.34, zBg, iso);
    ctx.fillStyle = "rgba(112, 95, 180, 0.58)";
    ctx.fill();
    ctx.strokeStyle = "rgba(152, 101, 197, 0.75)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 右上/中区紫蓝文档内容卡片（故意给较高亮度，以验证遮罩太淡时的透字打架！）
    const cards = [
      { x: 0.055, y: 0.21, w: 0.29, h: 0.18, title: "文档流 · 01", hi: true },
      { x: 0.375, y: 0.21, w: 0.28, h: 0.28, title: "核心参数卡", hi: true },
      { x: 0.685, y: 0.21, w: 0.26, h: 0.24, title: "部署节点 12", hi: false },
      { x: 0.395, y: 0.53, w: 0.55, h: 0.22, title: "底层正文区 · NORMAL FLOW", hi: false },
    ];

    for (const c of cards) {
      const box = traceProjectedRect(c.x, c.y, c.w, c.h, zBg, iso);
      ctx.fillStyle = c.hi ? "rgba(138, 121, 212, 0.42)" : "rgba(112, 95, 180, 0.24)";
      ctx.fill();
      ctx.strokeStyle = c.hi ? "rgba(186, 170, 248, 0.55)" : "rgba(152, 101, 197, 0.38)";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (iso < 0.55) {
        ctx.globalAlpha = 1 - iso * 1.4;
        ctx.fillStyle = "#E4DDF8";
        ctx.font = `600 ${Math.max(10, Math.round(W * 0.017))}px "Noto Sans SC", sans-serif`;
        ctx.fillText(c.title, box.p1.x + 8, box.p1.y + 18);
        // 卡片内文本条示意（高对比浅条，让 6% 遮罩时明显与前景抢眼）
        ctx.fillStyle = "rgba(232, 226, 252, 0.52)";
        ctx.fillRect(box.p1.x + 8, box.p1.y + 26, (box.p2.x - box.p1.x) * 0.66, 5);
        ctx.fillStyle = "rgba(210, 198, 245, 0.36)";
        ctx.fillRect(box.p1.x + 8, box.p1.y + 36, (box.p2.x - box.p1.x) * 0.48, 4);
        ctx.globalAlpha = 1;
      }
    }

    // 背景左下暴露的可点击危险按钮：「清空草稿」用于实测点击穿透！
    const d = ev.rects.dangerBtn;
    const db = traceProjectedRect(d.x, d.y, d.w, d.h, zBg, iso);
    ctx.fillStyle = state.inert ? "rgba(95, 76, 152, 0.42)" : "rgba(235, 89, 161, 0.28)";
    ctx.fill();
    ctx.lineWidth = state.inert ? 1.1 : 1.8;
    ctx.strokeStyle = state.inert ? "rgba(182, 166, 238, 0.45)" : "#FF7B89";
    ctx.stroke();

    if (iso < 0.65) {
      ctx.save();
      ctx.globalAlpha = 1 - iso * 1.25;
      const bw = db.p2.x - db.p1.x;
      const bh = db.p4.y - db.p1.y;
      ctx.beginPath();
      ctx.rect(db.p1.x + 2, db.p1.y + 1, Math.max(0, bw - 4), Math.max(0, bh - 2));
      ctx.clip();
      ctx.fillStyle = state.inert ? "#C7BCEE" : "#FFD5DB";
      ctx.font = `700 ${Math.max(10, Math.min(13, Math.round(bw * 0.085)))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const btnLabel = state.inert
        ? bw < 115
          ? "已锁背 inert"
          : "底层已锁 (inert)"
        : bw < 115
          ? "点此测穿透"
          : "点此测穿透：清空";
      ctx.fillText(btnLabel, db.p1.x + bw / 2, db.p1.y + bh / 2);
      ctx.restore();
    }

    // 若处于 transform 牢笼模式，在背景卡片区画出红色虚线「局部层叠上下文牢笼」框
    if (state.layerMode === "trap") {
      ctx.save();
      ctx.setLineDash([6, 4]);
      const fg = ev.rects.fg;
      const pad = 0.025;
      const trapBox = traceProjectedRect(
        Math.max(0.03, fg.x - pad),
        Math.max(0.14, fg.y - pad),
        Math.min(0.94, fg.w + pad * 2),
        Math.min(0.82, fg.h + pad * 2),
        zBg + 0.08,
        iso
      );
      ctx.strokeStyle = "rgba(255, 123, 137, 0.85)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.setLineDash([]);
      if (iso > 0.35) {
        ctx.fillStyle = "#FF9CA7";
        ctx.font = `500 11px "DM Mono", monospace`;
        ctx.fillText("transform 局部上下文壳 (权重 0)", trapBox.p1.x + 6, trapBox.p1.y - 6);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // 绘制底层粘性导航栏 (<header> z-index: 20)
  // 根据层叠模式决定它被画在前景后面，还是反穿劈在前景上面！
  function drawBaseHeader(state, ev, iso, zLevel, isPiercing) {
    const h = ev.rects.header;
    ctx.save();
    const hb = traceProjectedRect(h.x, h.y, h.w, h.h, zLevel, iso);
    ctx.fillStyle = isPiercing ? "rgba(56, 20, 56, 0.94)" : "rgba(38, 30, 82, 0.92)";
    ctx.fill();
    ctx.lineWidth = isPiercing ? 2 : 1.2;
    ctx.strokeStyle = isPiercing ? "#FF7B89" : "rgba(152, 101, 197, 0.8)";
    ctx.stroke();

    if (iso < 0.72) {
      const bw = hb.p2.x - hb.p1.x;
      const bh = hb.p4.y - hb.p1.y;
      ctx.globalAlpha = 1 - iso * 1.1;
      ctx.fillStyle = "#F5F6F8";
      ctx.font = `700 ${Math.max(10.5, Math.round(W * 0.017))}px "DM Mono", "Noto Sans SC", monospace`;
      ctx.textBaseline = "middle";
      ctx.fillText("HEADER · z-index: 20", hb.p1.x + 12, hb.p1.y + bh / 2);

      // 右侧提示条
      ctx.textAlign = "right";
      ctx.fillStyle = isPiercing ? "#FF9CA7" : "#BEB2F0";
      ctx.font = `600 ${Math.max(10, Math.round(W * 0.0155))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(
        isPiercing ? "▲ 正反穿压住前景！" : "稳居遮罩之下",
        hb.p1.x + bw - 10,
        hb.p1.y + bh / 2
      );
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.globalAlpha = 1;
    }

    // 如果处于反穿错态，画出醒目的红斜线警示交叠区（合批单次 stroke）
    if (isPiercing && iso < 0.35) {
      const fg = ev.rects.fg;
      const ox1 = Math.max(h.x, fg.x);
      const ox2 = Math.min(h.x + h.w, fg.x + fg.w);
      const oy1 = Math.max(h.y, fg.y);
      const oy2 = Math.min(h.y + h.h, fg.y + fg.h);
      if (ox2 > ox1 && oy2 > oy1) {
        const pA = projectPoint(ox1, oy1, zLevel, iso);
        const pB = projectPoint(ox2, oy2, zLevel, iso);
        ctx.save();
        ctx.beginPath();
        ctx.rect(pA.x, pA.y, pB.x - pA.x, pB.y - pA.y);
        ctx.clip();
        ctx.strokeStyle = "rgba(255, 123, 137, 0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let sx = pA.x - 40; sx < pB.x + 40; sx += 11) {
          ctx.moveTo(sx, pA.y);
          ctx.lineTo(sx + 24, pB.y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // 绘制中景遮罩幕布（原海报洋红框 + 暗夜半透明光学滤幕 + 可选磨砂光感）
  function drawScrimLayer(state, ev, iso, zLevel) {
    const alpha = clamp(state.scrim / 100, 0, 1);
    const activeGlow = state.activeLayer === "mid";
    const badThin = state.scrim < SCRIM_MIN;
    const badWall = state.scrim > SCRIM_MAX;

    ctx.save();
    const sb = traceProjectedRect(0.02, 0.03, 0.96, 0.94, zLevel, iso);

    // 暗夜遮罩主体（带一点原海报洋红暗色光学反光）
    ctx.fillStyle = `rgba(6, 9, 22, ${alpha.toFixed(3)})`;
    ctx.fill();

    // 原海报标志性洋红光学光晕（轻快单圆填充，避免软件渲染每帧重算大面积径向渐变）
    if (alpha > 0.02) {
      const mc = projectPoint(0.56, 0.52, zLevel, iso);
      const mr = Math.min(W, H) * (iso > 0.4 ? 0.14 : 0.2);
      const pinkA = clamp(0.05 + Math.min(alpha, 0.68) * 0.14, 0.04, 0.16);
      ctx.beginPath();
      ctx.arc(mc.x, mc.y, mr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(235, 89, 161, ${pinkA.toFixed(3)})`;
      ctx.fill();
    }

    // 若开启 backdrop-filter 轻模糊，用轻透电青薄雾暗示磨砂玻璃
    if (state.blur > 0 && alpha > 0.08) {
      ctx.fillStyle = "rgba(83, 239, 252, 0.06)";
      ctx.fill();
    }

    // 洋红中景光学边框（原海报中景空心方框色彩）
    ctx.lineWidth = activeGlow ? 2.6 : 1.5;
    ctx.strokeStyle = activeGlow
      ? "#FF8DC6"
      : badThin || badWall
        ? "rgba(255, 123, 137, 0.78)"
        : "rgba(235, 89, 161, 0.78)";
    ctx.stroke();

    // 正视模式下在幕布底沿绘制光学「遮罩透度拖扫刻度尺」指示当前位置（引导用户横拖！）
    if (iso < 0.35) {
      const barX = sb.p4.x + 14;
      const barW = sb.p3.x - sb.p4.x - 28;
      const barY = sb.p4.y - 16;
      ctx.fillStyle = "rgba(10, 15, 34, 0.82)";
      ctx.fillRect(barX, barY - 4, barW, 8);
      // 35%–75% 经验参考甜区高亮条
      const sweetL = barX + barW * (SCRIM_MIN / 100);
      const sweetW = barW * ((SCRIM_MAX - SCRIM_MIN) / 100);
      ctx.fillStyle = "rgba(94, 235, 212, 0.34)";
      ctx.fillRect(sweetL, barY - 4, sweetW, 8);
      ctx.strokeStyle = "rgba(94, 235, 212, 0.75)";
      ctx.lineWidth = 1;
      ctx.strokeRect(sweetL, barY - 4, sweetW, 8);

      // 当前游标
      const curX = barX + barW * alpha;
      ctx.fillStyle = ev.checks.depthOk ? PALETTE.pass : PALETTE.fail;
      ctx.fillRect(curX - 3, barY - 7, 6, 14);

      // 拖扫中显示竖向光学参考线
      if (dragging || dragHandleAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = dragging ? 0.65 : dragHandleAlpha;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = ev.checks.depthOk ? PALETTE.pass : PALETTE.magenta;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(curX, sb.p1.y + 8);
        ctx.lineTo(curX, barY - 8);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // 绘制前景覆盖层（原海报电青玻片 + 厚白焦点方框 + 真实 UI 卡片 + 原海报白圆点/洋红圆元素）
  function drawForegroundLayer(state, ev, iso, zLevel) {
    const sc = SCENARIOS[state.scenario] || SCENARIOS.modal;
    const fm = FOCUS_MODES[state.focusMode] || FOCUS_MODES.broken;
    const fg = ev.rects.fg;
    const activeGlow = state.activeLayer === "fg";

    ctx.save();
    // 锐利光学错位落影（零 Gaussian shadowBlur，避免软件渲染卡顿且更贴原海报几何感）
    traceProjectedRect(fg.x + 0.014, fg.y + 0.022, fg.w, fg.h, zLevel, iso);
    ctx.fillStyle = "rgba(2, 4, 14, 0.56)";
    ctx.fill();

    const fb = traceProjectedRect(fg.x, fg.y, fg.w, fg.h, zLevel, iso);
    // 蓝青光学玻璃体填充（原海报右上青玻片色系）
    ctx.fillStyle = "rgba(14, 48, 78, 0.96)";
    ctx.fill();

    // 原海报标志性「亮电青外框 + 偏位厚白焦点框」双重视觉母题
    ctx.lineWidth = activeGlow ? 2.8 : 1.8;
    ctx.strokeStyle = activeGlow ? "#8CF7FF" : PALETTE.cyanBright;
    ctx.stroke();

    // 偏位内嵌白框（直接致敬 237 原海报中心白框！）
    const inset = 0.018;
    traceProjectedRect(
      fg.x + inset,
      fg.y + inset,
      fg.w - inset * 2,
      fg.h - inset * 2,
      zLevel,
      iso
    );
    ctx.lineWidth = ev.passed ? 2.4 : 1.4;
    ctx.strokeStyle = ev.passed ? PALETTE.frameWhite : "rgba(232, 231, 230, 0.52)";
    ctx.stroke();

    // 卡片内真实 UI 内容（正视与半倾斜均清晰可读）
    if (iso < 0.62) {
      const bw = fb.p2.x - fb.p1.x;
      const bh = fb.p4.y - fb.p1.y;
      const pad = Math.max(14, bw * 0.075);
      ctx.globalAlpha = 1 - iso * 1.25;

      // 顶角原海报白圆徽记（灯箱场景里放大成主图几何）
      if (state.scenario === "sheet") {
        const cx = fb.p1.x + bw * 0.52;
        const cy = fb.p1.y + bh * 0.44;
        const rad = Math.min(bw, bh) * 0.2;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(240, 100, 171, 0.85)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + rad * 0.85, cy - rad * 0.65, rad * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.frameWhite;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(fb.p1.x + pad + 5, fb.p1.y + pad + 4, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.cyanBright;
        ctx.fill();
      }

      // 场景英文小标
      ctx.fillStyle = PALETTE.cyanBright;
      ctx.font = `600 ${Math.max(10, Math.round(W * 0.015))}px "Space Grotesk", sans-serif`;
      ctx.fillText(
        state.layerMode === "top_layer" ? `${sc.en} · TOP LAYER` : sc.en,
        fb.p1.x + pad + (state.scenario === "sheet" ? 0 : 16),
        fb.p1.y + pad + 8
      );

      // 显式关闭按钮（×）——若处于无退出错态则不画并标红警告！
      const cb = ev.rects.closeBtn;
      const cRect = traceProjectedRect(cb.x, cb.y, cb.w, cb.h, zLevel, iso);
      const cw = cRect.p2.x - cRect.p1.x;
      const ch = cRect.p4.y - cRect.p1.y;
      if (fm.hasExit) {
        ctx.fillStyle = "rgba(83, 239, 252, 0.14)";
        ctx.fill();
        ctx.strokeStyle = "rgba(83, 239, 252, 0.72)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = "#F5F6F8";
        ctx.font = `700 ${Math.max(12, Math.round(W * 0.02))}px "Space Grotesk", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("×", cRect.p1.x + cw / 2, cRect.p1.y + ch / 2 + 1);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      } else {
        ctx.fillStyle = "rgba(255, 123, 137, 0.18)";
        ctx.fill();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "#FF7B89";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#FF9CA7";
        ctx.font = `700 10px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("无退", cRect.p1.x + cw / 2, cRect.p1.y + ch / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      }

      // 标题（当 6% 缺遮罩时故意压低背景干扰可视化，实际靠实绘白字对比显示）
      const titleY =
        state.scenario === "sheet" ? fb.p1.y + bh * 0.73 : fb.p1.y + pad + 34;
      ctx.fillStyle = "#F5F6F8";
      ctx.font = `900 ${Math.max(13, Math.round(W * 0.025))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(sc.title, fb.p1.x + pad, titleY);

      // 简短说明（自动裁切避免溢出小屏）
      ctx.fillStyle = "#C7D8EA";
      ctx.font = `400 ${Math.max(10.5, Math.round(W * 0.017))}px "Noto Sans SC", sans-serif`;
      const subText = bw < 230 ? sc.sub.slice(0, 14) + "…" : sc.sub;
      ctx.fillText(subText, fb.p1.x + pad, titleY + 21);

      // 原海报中心光学十字标记（仅在常规弹窗且空间充足时轻示）
      if (state.scenario === "modal" && bh > 170) {
        const mx = fb.p1.x + bw * 0.5;
        const my = fb.p1.y + bh * 0.56;
        ctx.strokeStyle = "rgba(232, 231, 230, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(mx - 10, my);
        ctx.lineTo(mx + 10, my);
        ctx.moveTo(mx, my - 10);
        ctx.lineTo(mx, my + 10);
        ctx.stroke();
      }

      // 底部主次动作条
      const btnH = Math.max(24, Math.min(32, bh * 0.16));
      const btnY = fb.p4.y - pad - btnH;
      const btnW = Math.min(106, (bw - pad * 2 - 10) * 0.52);
      // 主按钮（电青实底配深墨字，高对比）
      ctx.fillStyle = PALETTE.cyanBright;
      ctx.fillRect(fb.p1.x + pad, btnY, btnW, btnH);
      ctx.fillStyle = "#060916";
      ctx.font = `700 ${Math.max(10.5, Math.round(W * 0.016))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sc.primaryBtn, fb.p1.x + pad + btnW / 2, btnY + btnH / 2);

      // 次按钮
      const secX = fb.p1.x + pad + btnW + 8;
      const secW = Math.min(76, bw - pad * 2 - btnW - 8);
      if (secW > 38) {
        ctx.strokeStyle = "rgba(232, 231, 230, 0.55)";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(secX, btnY, secW, btnH);
        ctx.fillStyle = "#E8E7E6";
        ctx.fillText(sc.secondaryBtn, secX + secW / 2, btnY + btnH / 2);
      }

      // 面积闷死告警标签
      if (fm.oversize) {
        ctx.fillStyle = "rgba(255, 123, 137, 0.92)";
        ctx.fillRect(fb.p1.x + pad, fb.p1.y + bh * 0.45, Math.min(bw - pad * 2, 230), 24);
        ctx.fillStyle = "#060916";
        ctx.font = `700 11px "Noto Sans SC", sans-serif`;
        ctx.fillText(`覆盖 ${ev.metrics.coveragePct}% 视口 · 底层语境已闷死`, fb.p1.x + pad + Math.min(bw - pad * 2, 230) / 2, fb.p1.y + bh * 0.45 + 12);
      }

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  // 绘制“双弹套娃”干扰二级弹窗（点击它即可直接消掉！）
  function drawNestedSpamModal(state, ev, iso, zLevel) {
    const fm = FOCUS_MODES[state.focusMode] || FOCUS_MODES.broken;
    if (!fm.hasNested) return;
    const nm = ev.rects.nestedModal;
    ctx.save();
    const nb = traceProjectedRect(nm.x, nm.y, nm.w, nm.h, zLevel + 0.45, iso);
    ctx.fillStyle = "rgba(52, 14, 38, 0.96)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#FF7B89";
    ctx.stroke();

    if (iso < 0.65) {
      const bw = nb.p2.x - nb.p1.x;
      const bh = nb.p4.y - nb.p1.y;
      ctx.save();
      ctx.globalAlpha = 1 - iso * 1.2;
      ctx.beginPath();
      ctx.rect(nb.p1.x, nb.p1.y, Math.max(0, bw), Math.max(0, bh));
      ctx.clip();
      ctx.fillStyle = "#FF7B89";
      ctx.fillRect(nb.p1.x, nb.p1.y, bw, 22);
      ctx.fillStyle = "#060916";
      ctx.font = `700 ${bw < 150 ? 10 : 10.5}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText(bw < 150 ? "套娃弹窗 · 点此消" : "二级套娃弹窗 · 点此移除", nb.p1.x + 8, nb.p1.y + 11);

      ctx.fillStyle = "#FFE5EA";
      ctx.font = `700 ${Math.max(11, Math.min(15, Math.round(bw * 0.08)))}px "Noto Sans SC", sans-serif`;
      ctx.fillText("限时订阅周报？", nb.p1.x + 10, nb.p1.y + bh * 0.56);
      ctx.fillStyle = "#FFB5C1";
      ctx.font = `400 10px "Noto Sans SC", sans-serif`;
      ctx.fillText(bw < 145 ? "打断焦点 · 强制叠弹" : "打断确认流、分裂焦点", nb.p1.x + 10, nb.p1.y + bh * 0.78);
      ctx.restore();
    }
    ctx.restore();
  }

  // 32° 轴测模式下左侧绘制 Z 轴深度标尺（背景 / 顶栏 / 中景 / 前景 Top Layer）
  function drawZAxisRuler(state, ev, iso) {
    if (iso < 0.25) return;
    ctx.save();
    ctx.globalAlpha = clamp((iso - 0.25) / 0.65, 0, 1);
    const rx = W * 0.06;
    const yBot = H * 0.84;
    const yTop = H * 0.14;
    ctx.strokeStyle = "rgba(83, 239, 252, 0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(rx, yBot);
    ctx.lineTo(rx, yTop);
    ctx.stroke();

    // 顶箭头
    ctx.beginPath();
    ctx.moveTo(rx - 5, yTop + 7);
    ctx.lineTo(rx, yTop);
    ctx.lineTo(rx + 5, yTop + 7);
    ctx.stroke();

    ctx.fillStyle = PALETTE.cyanBright;
    ctx.font = `700 11px "Space Grotesk", sans-serif`;
    ctx.fillText("Z-AXIS", rx - 6, yTop - 8);

    const lm = LAYER_MODES[state.layerMode] || LAYER_MODES.trap;
    const ticks = [
      { f: 0.05, label: "背景 文档流", col: PALETTE.violetDot },
      { f: lm.aboveHeader ? 0.3 : 0.76, label: "顶栏 z:20", col: lm.aboveHeader ? "#B7A6EE" : "#FF7B89" },
      { f: 0.52, label: `中景 遮罩 ${ev.metrics.scrimPct}%`, col: PALETTE.magenta },
      {
        f: lm.id === "top_layer" ? 0.94 : lm.aboveHeader ? 0.8 : 0.42,
        label: lm.id === "top_layer" ? "Top Layer 顶层" : lm.aboveHeader ? "前景 z:40" : "前景(被压)",
        col: lm.aboveHeader ? PALETTE.cyanBright : "#FF7B89",
      },
    ];
    for (const tk of ticks) {
      const ty = lerp(yBot, yTop, tk.f);
      ctx.fillStyle = tk.col;
      ctx.beginPath();
      ctx.arc(rx, ty, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `600 11px "Noto Sans SC", "DM Mono", sans-serif`;
      ctx.fillText(tk.label, rx + 10, ty + 4);
    }
    ctx.restore();
  }

  // 绘制点击交互涟漪反馈（穿透告警 / 护盾拦住 / 关闭测试）
  function drawRipples(dt, still) {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      if (!still) rp.age += dt || 0.016;
      const p = clamp(rp.age / rp.maxAge, 0, 1);
      if (p >= 1) {
        ripples.splice(i, 1);
        continue;
      }
      const x = rp.nx * W;
      const y = rp.ny * H;
      const rad = 10 + p * 54;
      const col = rp.kind === "leak" ? PALETTE.fail : rp.kind === "shield" ? PALETTE.magenta : PALETTE.pass;

      ctx.save();
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.stroke();

      if (rp.label) {
        ctx.fillStyle = "rgba(6, 9, 22, 0.9)";
        const tw = ctx.measureText(rp.label).width + 18;
        const lx = clamp(x - tw / 2, 10, W - tw - 10);
        const ly = clamp(y - 34 - p * 18, 12, H - 30);
        ctx.fillRect(lx, ly, tw, 22);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(lx, ly, tw, 22);
        ctx.fillStyle = col;
        ctx.font = `700 11px "Noto Sans SC", sans-serif`;
        ctx.fillText(rp.label, lx + 9, ly + 15);
      }
      ctx.restore();
    }
  }

  // 主绘制帧（按需重绘：静置省电、拖动与动画期间逐帧满速绘制）
  function draw(t, dt, { still }) {
    resize();
    const state = getState();
    const targetIso = state.view === "iso" ? 1 : 0;
    const animating =
      introT < 1 ||
      Math.abs(targetIso - animIso) > 0.002 ||
      ripples.length > 0 ||
      dragging ||
      dragHandleAlpha > 0.01;

    if (!still && !dirty && !animating) return;
    dirty = false;

    const ev = evaluate(state);

    if (still) {
      introT = 1;
      animIso = targetIso;
      dragHandleAlpha = 0;
    } else {
      introT = clamp(introT + (dt || 0.016) * 2.2, 0, 1);
      animIso += (targetIso - animIso) * Math.min(1, (dt || 0.016) * 9);
      if (Math.abs(targetIso - animIso) < 0.002) animIso = targetIso;
      if (!dragging) dragHandleAlpha = Math.max(0, dragHandleAlpha - (dt || 0.016) * 2.2);
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1) 正视下将暗房底 + 点阵 + 背景层缓存到离屏画布，横拖遮罩时仅 1 次 drawImage，软件渲染也能稳跑 60fps
    const lm = LAYER_MODES[state.layerMode] || LAYER_MODES.trap;
    const iso = animIso;

    if (iso < 0.001) {
      const key = `${W}|${H}|${dpr}|${state.scenario}|${state.layerMode}|${state.inert}|${state.activeLayer}|${state.focusMode}|${ev.passed}`;
      if (bgCacheKey !== key) {
        bgCacheKey = key;
        bgCache.width = canvas.width;
        bgCache.height = canvas.height;
        const origCtx = ctx;
        // 借用同一套绘制函数渲染到 bgCache
        renderBaseTo(bgCtx, state, ev, t, iso, lm);
        void origCtx;
      }
      ctx.drawImage(bgCache, 0, 0, W, H);
    } else {
      ctx.fillStyle = PALETTE.night;
      ctx.fillRect(0, 0, W, H);
      drawPosterMotifs(ev, t);
      drawBackgroundLayer(state, ev, iso);
      if (lm.aboveHeader) drawBaseHeader(state, ev, iso, 0.32, false);
    }

    if (lm.aboveHeader) {
      drawScrimLayer(state, ev, iso, 1.05);
      const fgZ = lm.id === "top_layer" ? 2.15 : 1.78;
      drawForegroundLayer(state, ev, iso, fgZ);
      drawNestedSpamModal(state, ev, iso, fgZ);
    } else {
      drawScrimLayer(state, ev, iso, 0.58);
      drawForegroundLayer(state, ev, iso, 0.96);
      drawNestedSpamModal(state, ev, iso, 0.96);
      drawBaseHeader(state, ev, iso, 1.85, true);
    }

    drawZAxisRuler(state, ev, iso);

    // 顶角轻状态徽（单真源读数直接落画布，确保 390 窄屏无需离开画面即知当前状态）
    const hudText =
      iso > 0.5
        ? `32° Z 轴侧剖 · 遮罩 ${ev.metrics.scrimPct}%`
        : `横拖调遮罩 ${ev.metrics.scrimPct}% · 分离 ${ev.metrics.frameSeparation}:1`;
    ctx.save();
    ctx.font = `600 11px "DM Mono", "Noto Sans SC", monospace`;
    const hudW = ctx.measureText(hudText).width + 18;
    ctx.fillStyle = "rgba(6, 9, 22, 0.88)";
    ctx.fillRect(10, 8, hudW, 22);
    ctx.strokeStyle = ev.passed ? PALETTE.pass : "rgba(83, 239, 252, 0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 8, hudW, 22);
    ctx.fillStyle = ev.passed ? PALETTE.pass : "#E6F4FA";
    ctx.fillText(hudText, 19, 23);
    ctx.restore();

    drawRipples(dt, still);
    ctx.restore();
  }

  // ---------- 指针直拖（横向调遮罩，竖向让给手机滚页）与画布内实点热区 ----------
  function hitTestRect(u, v, rect) {
    return u >= rect.x && u <= rect.x + rect.w && v >= rect.y && v <= rect.y + rect.h;
  }

  function toNorm(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;
    const padX = r.width * 0.045;
    const padY = r.height * 0.055;
    return {
      nx: clamp(px / r.width, 0, 1),
      ny: clamp(py / r.height, 0, 1),
      u: clamp((px - padX) / (r.width - padX * 2), 0, 1),
      v: clamp((py - padY) / (r.height - padY * 2), 0, 1),
    };
  }

  function onDown(clientX) {
    dragging = true;
    pointerMoved = false;
    dragStartX = clientX;
    dragStartScrim = getState().scrim;
    dragHandleAlpha = 0.85;
  }

  function onMove(clientX) {
    if (!dragging) return;
    const r = canvas.getBoundingClientRect();
    const dx = clientX - dragStartX;
    if (Math.abs(dx) > 4) pointerMoved = true;
    // 横拖距离映射为遮罩透度变化（灵敏且平滑，perf 拖扫每帧稳定重绘）
    const deltaPct = (dx / Math.max(180, r.width * 0.68)) * 100;
    const next = Math.round(clamp(dragStartScrim + deltaPct, 0, 100));
    dragHandleAlpha = 0.85;
    dirty = true;
    handlers.onScrimChange(next);
  }

  function onUp(clientX, clientY) {
    if (!dragging) return;
    dragging = false;
    if (pointerMoved) return;

    // 非拖动即为点击：测试画布热区（套娃弹窗 / 前景关闭 / 底层危险穿透）
    const state = getState();
    const ev = evaluate(state);
    const fm = FOCUS_MODES[state.focusMode] || FOCUS_MODES.broken;
    const { nx, ny, u, v } = toNorm(clientX, clientY);

    if (state.view === "iso") {
      handlers.onToggleView();
      return;
    }

    // 1) 点二级套娃弹窗 → 直接消掉套娃
    if (fm.hasNested && hitTestRect(u, v, ev.rects.nestedModal)) {
      addRipple(nx, ny, "ok", "已移除二级套娃弹窗");
      handlers.onDismissNested();
      return;
    }
    // 2) 点前景关闭 × 热区
    if (hitTestRect(u, v, ev.rects.closeBtn)) {
      if (fm.hasExit) {
        addRipple(nx, ny, "ok", "退出通路畅通（× / Esc）");
        handlers.onEvent("测试关闭成功：× 与 Esc 都能干脆退回原页，焦点自动归位。");
      } else {
        addRipple(nx, ny, "leak", "出口被藏起，无法关闭！");
        handlers.onEvent("关闭失败：当前未提供关闭钮且屏蔽了 Esc，用户被锁在弹窗里。");
      }
      return;
    }
    // 3) 点暴露的底层危险按钮或前景之外的幕布
    const outsideFg = !hitTestRect(u, v, ev.rects.fg);
    if (hitTestRect(u, v, ev.rects.dangerBtn) || outsideFg) {
      if (!state.inert) {
        addRipple(nx, ny, "leak", "点击穿透！误触底层「清空」");
        handlers.onLeakHit();
      } else {
        addRipple(nx, ny, "shield", "inert 拦截成功，底层安全");
        handlers.onShieldHit();
      }
    }
  }

  // 同时兼容 Pointer Events 与 Touch Events（供 tools/perf.mjs 的 dispatchTouchEvent 满帧触发）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏交由 touch* 统一处理，避免双触发
    canvas.setPointerCapture(e.pointerId);
    onDown(e.clientX);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    onMove(e.clientX);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    onUp(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointercancel", () => {
    dragging = false;
  });

  // 触屏手势：判断主导方向，横向立即响应遮罩拖扫，竖向不拦页面滚动
  let touchAxis = null;
  let touchStartY = 0;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      touchAxis = null;
      touchStartY = t0.clientY;
      onDown(t0.clientX);
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length || !dragging) return;
      const t0 = e.touches[0];
      const dx = Math.abs(t0.clientX - dragStartX);
      const dy = Math.abs(t0.clientY - touchStartY);
      if (touchAxis === null && (dx > 4 || dy > 4)) {
        touchAxis = dx >= dy ? "x" : "y";
      }
      if (touchAxis === "y") {
        dragging = false;
        return;
      }
      onMove(t0.clientX);
    },
    { passive: true }
  );
  canvas.addEventListener("touchend", (e) => {
    const t0 = e.changedTouches[0];
    if (t0) onUp(t0.clientX, t0.clientY);
    else dragging = false;
    touchAxis = null;
  });

  // 键盘操作画布（支持 ← / → 调遮罩、Esc 试退、V 切侧剖）
  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlers.onScrimChange(clamp(st.scrim - (e.shiftKey ? 10 : 4), 0, 100));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handlers.onScrimChange(clamp(st.scrim + (e.shiftKey ? 10 : 4), 0, 100));
    } else if (e.key === "Escape") {
      const fm = FOCUS_MODES[st.focusMode] || FOCUS_MODES.broken;
      if (fm.hasExit) {
        addRipple(0.5, 0.5, "ok", "Esc 退出通路畅通");
        handlers.onEvent("按下 Esc：焦点闭环健康，浮层响应退回原页并归还触发焦点。");
      } else {
        addRipple(0.5, 0.5, "leak", "Esc 被屏蔽！无法退出");
        handlers.onEvent("按下 Esc 无效：当前状态屏蔽了退出快捷键，请恢复「单层 + Esc 退出」。");
      }
    }
  });

  return { draw, resize, addRipple, markDirty };
}

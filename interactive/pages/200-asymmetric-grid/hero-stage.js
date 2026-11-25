// 开场主角舞台：200 非对称网格拉轨平衡台（2D Canvas 1:1 化用原海报「结构示意」+ 视觉杠杆标尺）
// 全部几何与指标读自 model.js，不写死任何常量；通过 lib/stage.js 的 loop() 节电渲染。

import { loop, pixelRatio } from "../../lib/stage.js";
import { computeLayout, POSTER_PALETTE as P } from "./model.js";

function drawDashedRect(ctx, x, y, w, h, dash = [3, 3]) {
  ctx.save();
  ctx.setLineDash(dash);
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}

function drawArrow(ctx, x1, y1, x2, y2, color, dashed = true) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 12) return;
  const ux = dx / len;
  const uy = dy / len;
  const sx = x1 + ux * 10;
  const sy = y1 + uy * 10;
  const ex = x2 - ux * 10;
  const ey = y2 - uy * 10;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.6;
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  ctx.setLineDash([]);
  const head = 7;
  const ang = Math.atan2(ey - sy, ex - sx);
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - head * Math.cos(ang - 0.48), ey - head * Math.sin(ang - 0.48));
  ctx.lineTo(ex - head * Math.cos(ang + 0.48), ey - head * Math.sin(ang + 0.48));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function mountHeroStage(canvas, getState, onChange) {
  const ctx = canvas.getContext("2d");
  let w = 720;
  let h = 480;
  let dpr = 1;

  // 平滑视觉插值（仅用于开场入场与杠杆缓动；drag 时直追不拖泥带水）
  let introProgress = 0;
  let smoothAngle = 0;
  let snapPulse = 0;
  let hoverTarget = null; // "v1" | "v2" | "h1" | "anchor" | "drift" | "block" | null
  let dragMode = null; // "v1" | "v2" | "h1" | "anchor" | null
  let dragStart = null;
  let dragMoved = false;
  let dirty = true;

  // 舞台内部网格画幅布局（给顶尺、左尺、底沿杠杆留出精准空间）
  function getFieldRect() {
    const compact = w < 440;
    const padL = compact ? 22 : 42;
    const padR = compact ? 14 : 24;
    const padT = compact ? 30 : 36;
    const padB = compact ? 62 : 64;
    return {
      x: padL,
      y: padT,
      w: Math.max(120, w - padL - padR),
      h: Math.max(120, h - padT - padB),
      compact,
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    dpr = pixelRatio(2);
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    const cw = Math.round(w * dpr);
    const ch = Math.round(h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
      dirty = true;
    }
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  function hitTest(px, py) {
    const f = getFieldRect();
    const layout = computeLayout(getState());
    const v1x = f.x + layout.state.v1 * f.w;
    const v2x = f.x + layout.state.v2 * f.w;
    const h1y = f.y + layout.state.h1 * f.h;

    // 1. 配重锚条命中
    const ax = f.x + layout.anchorX * f.w;
    const ay = f.y + f.h * 0.88;
    if (Math.abs(px - ax) <= 22 && Math.abs(py - ay) <= 26) {
      return { type: "anchor" };
    }
    // 2. 主垂直分栏轨 V1
    if (Math.abs(px - v1x) <= 18 && py >= f.y - 24 && py <= f.y + f.h + 12) {
      return { type: "v1" };
    }
    // 3. 次垂直分栏轨 V2
    if (Math.abs(px - v2x) <= 16 && py >= f.y - 24 && py <= f.y + f.h + 12) {
      return { type: "v2" };
    }
    // 4. 水平挂线 H1
    if (Math.abs(py - h1y) <= 15 && px >= f.x - 16 && px <= f.x + f.w + 8) {
      return { type: "h1" };
    }
    // 5. 脱轨红框模块命中（点即磁吸回轨）
    for (let i = layout.blocks.length - 1; i >= 0; i--) {
      const b = layout.blocks[i];
      const bx = f.x + b.x * f.w;
      const by = f.y + b.y * f.h;
      const bw = b.w * f.w;
      const bh = b.h * f.h;
      if (px >= bx && px <= bx + bw && py >= by && py <= by + bh) {
        return { type: b.isDrifted ? "drift" : "block", idx: b.idx };
      }
    }
    return { type: "v1-any" };
  }

  function pointerPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function applyDrag(px, py) {
    const f = getFieldRect();
    const s = getState();
    if (dragMode === "v1" || dragMode === "v1-any") {
      const nx = (px - f.x) / f.w;
      // 限制不越过 v2，保留拖动空间
      const nextV1 = Math.max(0.08, Math.min(s.v2 - 0.08, nx));
      onChange({ v1: +nextV1.toFixed(3) });
    } else if (dragMode === "v2") {
      const nx = (px - f.x) / f.w;
      const nextV2 = Math.max(s.v1 + 0.08, Math.min(0.92, nx));
      onChange({ v2: +nextV2.toFixed(3) });
    } else if (dragMode === "h1") {
      const ny = (py - f.y) / f.h;
      const nextH1 = Math.max(0.16, Math.min(0.56, ny));
      onChange({ h1: +nextH1.toFixed(3) });
    } else if (dragMode === "anchor") {
      const nx = (px - f.x) / f.w;
      const nextAx = Math.max(0.06, Math.min(0.94, nx));
      onChange({ anchorX: +nextAx.toFixed(3) });
    }
  }

  // Pointer Events（支持鼠标与触屏；touch-action: pan-y 保证竖向正常滚页、横向丝滑拉轨）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const pt = pointerPos(e);
    const hit = hitTest(pt.x, pt.y);
    dragStart = { x: pt.x, y: pt.y, hit };
    dragMoved = false;

    if (hit.type === "v1" || hit.type === "v2" || hit.type === "h1" || hit.type === "anchor") {
      dragMode = hit.type;
    } else {
      dragMode = "v1-any";
    }
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    dirty = true;
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = pointerPos(e);
    if (!dragStart) {
      const hit = hitTest(pt.x, pt.y);
      const prev = hoverTarget;
      hoverTarget = hit.type;
      canvas.style.cursor =
        hit.type === "v1" || hit.type === "v2" || hit.type === "anchor"
          ? "ew-resize"
          : hit.type === "h1"
            ? "ns-resize"
            : hit.type === "drift" || hit.type === "block"
              ? "pointer"
              : "ew-resize";
      if (prev !== hoverTarget) {
        dirty = true;
        ctrl.draw();
      }
      return;
    }

    const dx = pt.x - dragStart.x;
    const dy = pt.y - dragStart.y;
    if (!dragMoved && Math.hypot(dx, dy) > 5) {
      // 触屏下若是在空白处明显竖滑，放手给页面滚动
      if (e.pointerType === "touch" && dragMode === "v1-any" && Math.abs(dy) > Math.abs(dx) * 1.25) {
        dragStart = null;
        dragMode = null;
        return;
      }
      dragMoved = true;
    }
    if (dragMoved) {
      applyDrag(pt.x, pt.y);
      dirty = true;
      ctrl.draw();
    }
  });

  function endPointer(e) {
    if (!dragStart) return;
    const hit = dragStart.hit;
    if (!dragMoved) {
      // 短按点击：点脱轨红框立即回轨；点普通块切换主次层级
      const s = getState();
      if (hit.type === "drift") {
        snapPulse = 1;
        onChange({ drifted: false });
      } else if (hit.type === "block") {
        const nextHier =
          s.hierarchy === "equal" || s.hierarchy === "mirror" || s.hierarchy === "stuffed"
            ? "hero-left"
            : s.hierarchy === "hero-left"
              ? "hero-right"
              : "hero-left";
        snapPulse = 0.7;
        onChange({ hierarchy: nextHier });
      }
    }
    dragStart = null;
    dragMode = null;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    dirty = true;
    ctrl.draw();
  }

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  // 触屏兼容：perf.mjs 发的 Input.dispatchTouchEvent 只触发 touchstart/touchmove（部分场景不合成 pointer），双重监听确保 100% 响应
  let touchActive = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchLockedHoriz = false;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      const r = canvas.getBoundingClientRect();
      touchActive = true;
      touchStartX = t.clientX - r.left;
      touchStartY = t.clientY - r.top;
      touchLockedHoriz = false;
    },
    { passive: true },
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!touchActive || !e.touches.length || dragStart) return;
      const t = e.touches[0];
      const r = canvas.getBoundingClientRect();
      const px = t.clientX - r.left;
      const py = t.clientY - r.top;
      if (!touchLockedHoriz) {
        if (Math.abs(px - touchStartX) >= Math.abs(py - touchStartY) && Math.abs(px - touchStartX) > 3) {
          touchLockedHoriz = true;
        } else {
          return;
        }
      }
      const f = getFieldRect();
      const s = getState();
      const nextV1 = Math.max(0.08, Math.min(s.v2 - 0.08, (px - f.x) / f.w));
      onChange({ v1: +nextV1.toFixed(3) });
      dirty = true;
      ctrl.draw();
    },
    { passive: true },
  );
  canvas.addEventListener(
    "touchend",
    () => {
      touchActive = false;
      touchLockedHoriz = false;
    },
    { passive: true },
  );

  // 键盘直接操作主舞台
  canvas.addEventListener("keydown", (e) => {
    const s = getState();
    const step = e.shiftKey ? 0.04 : 0.02;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onChange({ v1: +(Math.max(0.08, s.v1 - step)).toFixed(3) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onChange({ v1: +(Math.min(s.v2 - 0.08, s.v1 + step)).toFixed(3) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onChange({ h1: +(Math.max(0.16, s.h1 - step)).toFixed(3) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onChange({ h1: +(Math.min(0.56, s.h1 + step)).toFixed(3) });
    } else if (e.key === "[" || e.key === ",") {
      e.preventDefault();
      onChange({ anchorX: +(Math.max(0.06, s.anchorX - 0.05)).toFixed(3) });
    } else if (e.key === "]" || e.key === ".") {
      e.preventDefault();
      onChange({ anchorX: +(Math.min(0.94, s.anchorX + 0.05)).toFixed(3) });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (s.drifted) {
        snapPulse = 1;
        onChange({ drifted: false });
      } else {
        onChange({ hierarchy: s.hierarchy === "hero-left" ? "hero-right" : "hero-left" });
      }
    }
  });

  function drawSceneBlock(b, bx, by, bw, bh, scene, compact, highlightKey) {
    const isBoneScene = scene === "poster" || scene === "magazine";
    // 模块底与线框风格根据 3 种海报场景切换
    if (scene === "blueprint") {
      ctx.fillStyle = b.isDrifted
        ? "rgba(255, 110, 110, 0.14)"
        : b.tone === "hero"
          ? "rgba(240, 235, 226, 0.085)"
          : "rgba(255, 255, 255, 0.03)";
      ctx.fillRect(bx, by, bw, bh);

      // 原海报「结构示意」招牌白虚线矩形 + 对角 X 交叉线
      ctx.strokeStyle = b.isDrifted ? P.danger : b.tone === "hero" ? "rgba(240, 235, 226, 0.85)" : "rgba(240, 235, 226, 0.56)";
      ctx.lineWidth = b.isDrifted ? 1.8 : 1.1;
      drawDashedRect(ctx, bx, by, bw, bh, b.isDrifted ? [5, 3] : [2.5, 2.5]);

      ctx.save();
      ctx.strokeStyle = b.isDrifted ? "rgba(255, 110, 110, 0.55)" : "rgba(240, 235, 226, 0.34)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2.5, 3]);
      ctx.beginPath();
      ctx.moveTo(bx + 1, by + 1);
      ctx.lineTo(bx + bw - 1, by + bh - 1);
      ctx.moveTo(bx + bw - 1, by + 1);
      ctx.lineTo(bx + 1, by + bh - 1);
      ctx.stroke();
      ctx.restore();

      // 主焦块内部轻叠原海报标志暖骨大圆 + 青小圆缩影
      if (b.tone === "hero" && bw > 90 && bh > 75) {
        const rBig = Math.min(bw, bh) * 0.25;
        const cx = bx + bw * 0.56;
        const cy = by + bh * 0.50;
        ctx.save();
        ctx.fillStyle = "rgba(240, 235, 226, 0.90)";
        ctx.beginPath();
        ctx.arc(cx, cy, rBig, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(23, 179, 211, 0.92)";
        ctx.beginPath();
        ctx.arc(cx + rBig * 0.68, cy + rBig * 0.52, rBig * 0.44, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (scene === "magazine") {
      // 原海报《城市的另一种呼吸方式》双页杂志纸面
      ctx.fillStyle = b.tone === "hero" ? "#1E2228" : "#ECEAE4";
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = b.isDrifted ? P.danger : "rgba(18, 22, 28, 0.25)";
      ctx.lineWidth = b.isDrifted ? 2 : 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

      if (b.tone === "hero") {
        // 建筑立面几何切影（高对比黑白现代大楼）
        ctx.save();
        ctx.beginPath();
        ctx.rect(bx, by, bw, bh);
        ctx.clip();
        ctx.fillStyle = "#CFD3D8";
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = "#191C20";
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.06, by + bh);
        ctx.lineTo(bx + bw * 0.06, by + bh * 0.24);
        ctx.lineTo(bx + bw * 0.48, by + bh * 0.36);
        ctx.lineTo(bx + bw * 0.48, by + bh);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#3A4048";
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.54, by + bh);
        ctx.lineTo(bx + bw * 0.54, by + bh * 0.14);
        ctx.lineTo(bx + bw * 0.94, by + bh * 0.06);
        ctx.lineTo(bx + bw * 0.94, by + bh);
        ctx.closePath();
        ctx.fill();
        // 建筑窗格线
        ctx.strokeStyle = "rgba(240,235,226,0.22)";
        ctx.lineWidth = 1;
        for (let gy = by + bh * 0.28; gy < by + bh - 8; gy += 12) {
          ctx.beginPath();
          ctx.moveTo(bx + bw * 0.56, gy);
          ctx.lineTo(bx + bw * 0.92, gy - 4);
          ctx.stroke();
        }
        // 跨缝标志明黄竖条
        ctx.fillStyle = P.yellow;
        ctx.fillRect(bx + bw * 0.02, by + bh * 0.18, Math.max(8, bw * 0.07), bh * 0.72);
        ctx.restore();
      } else if (b.tone === "lead") {
        // 青色小圆点缀
        ctx.fillStyle = P.cyan;
        ctx.beginPath();
        ctx.arc(bx + bw - Math.min(20, bw * 0.18), by + bh * 0.62, Math.min(13, bh * 0.22), 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 模拟排印细行
        ctx.fillStyle = "rgba(24, 28, 34, 0.28)";
        const lines = Math.min(5, Math.max(2, Math.floor((bh - 34) / 11)));
        for (let i = 0; i < lines; i++) {
          const lw = (bw - 20) * (i === lines - 1 ? 0.62 : 0.92);
          ctx.fillRect(bx + 10, by + 30 + i * 10, Math.max(12, lw), 3);
        }
      }
    } else {
      // SOUND LAB 暖骨纸演艺海报风
      ctx.fillStyle = b.tone === "tall" ? P.yellow : "#EFE9E0";
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = b.isDrifted ? P.danger : "rgba(16, 18, 20, 0.22)";
      ctx.lineWidth = b.isDrifted ? 2 : 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

      if (b.tone === "hero" && bw > 70 && bh > 54) {
        // 斜向细线连接青点与黑点（复刻 SOUND LAB 海报）
        ctx.strokeStyle = "rgba(16, 18, 20, 0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.14, by + bh * 0.80);
        ctx.lineTo(bx + bw * 0.86, by + bh * 0.24);
        ctx.stroke();
        ctx.fillStyle = P.cyan;
        ctx.beginPath();
        ctx.arc(bx + bw * 0.14, by + bh * 0.80, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#101214";
        ctx.beginPath();
        ctx.arc(bx + bw * 0.86, by + bh * 0.24, 6.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 模块角标文字（清晰、不溢界）
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx + 2, by + 2, bw - 4, bh - 4);
    ctx.clip();

    const lightFill = (scene === "magazine" && b.tone !== "hero") || scene === "poster";
    const textInk = b.isDrifted ? (lightFill ? "#A31B28" : "#FF9898") : lightFill ? "#101214" : P.inkLight;
    const subInk = lightFill ? "#4A525C" : "#B5BCC5";

    const fontPx = compact ? 10 : 11;
    ctx.font = `700 ${fontPx}px "Space Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = b.isDrifted ? (lightFill ? "#A81E2B" : "#FF8A8A") : lightFill ? "#005E73" : P.cyanBright;
    ctx.fillText(b.tag, bx + 8, by + 16);

    if (bh > 42 && bw > 64) {
      ctx.font = `700 ${compact ? 11 : b.tone === "hero" ? 15 : 12}px "Noto Sans SC", "Syne", sans-serif`;
      ctx.fillStyle = textInk;
      ctx.fillText(b.title, bx + 8, by + (b.tone === "hero" && !compact ? 36 : 32));
    }

    // 脱轨警告药丸（引导直接点击修复）
    if (b.isDrifted && bw > 56 && bh > 36) {
      const pillText = compact ? "脱轨·点归位" : `脱轨 +${b.driftPxApprox}px · 点此归轨`;
      ctx.font = `700 ${compact ? 10 : 10.5}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(pillText).width + 12;
      const pw = Math.min(bw - 12, tw);
      const px = bx + 6;
      const py = by + bh - 24;
      ctx.fillStyle = "#B81F2D";
      ctx.fillRect(px, py, pw, 18);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(pillText, px + 6, py + 13);
    } else if (highlightKey === "order") {
      // 高亮锁轨角点
      ctx.fillStyle = P.ok;
      ctx.fillRect(bx - 2, by - 2, 5, 5);
      ctx.fillRect(bx + bw - 3, by + bh - 3, 5, 5);
    }

    // 面积占比小角标
    if (!b.isDrifted && bw > 70 && bh > 46) {
      const pctText = `${Math.round(b.area * 100)}%`;
      ctx.font = `700 10px "Space Mono", monospace`;
      ctx.fillStyle = subInk;
      const tw = ctx.measureText(pctText).width;
      ctx.fillText(pctText, bx + bw - tw - 7, by + bh - 8);
    }

    ctx.restore();
  }

  function render(t, dt, { still }) {
    if (still) {
      introProgress = 1;
    } else if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + Math.max(0.02, dt * 1.9));
    }
    if (snapPulse > 0) {
      snapPulse = still ? 0 : Math.max(0, snapPulse - dt * 2.6);
    }

    const layout = computeLayout(getState());
    const targetAngle = layout.beamAngleDeg;
    if (still) {
      smoothAngle = targetAngle;
    } else {
      smoothAngle += (targetAngle - smoothAngle) * Math.min(1, dt * 12 + 0.12);
    }

    // 静置且动画完成后不再重复绘制（省电；交互改状态会调用 draw()）
    const animating = introProgress < 1 || snapPulse > 0.01 || Math.abs(targetAngle - smoothAngle) > 0.06;
    if (!dirty && !animating && !still) return;
    dirty = false;

    const f = getFieldRect();
    const { state: s } = layout;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 纯净墨黑建筑图谱底
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, w, h);

    // 极细腻 12 格辅助暗纹底网
    ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 12; i++) {
      const gx = Math.round(f.x + (f.w * i) / 12) + 0.5;
      ctx.beginPath();
      ctx.moveTo(gx, f.y);
      ctx.lineTo(gx, f.y + f.h);
      ctx.stroke();
    }
    for (let j = 1; j < 6; j++) {
      const gy = Math.round(f.y + (f.h * j) / 6) + 0.5;
      ctx.beginPath();
      ctx.moveTo(f.x, gy);
      ctx.lineTo(f.x + f.w, gy);
      ctx.stroke();
    }

    // 2. 版心外框与 3 列顶沿轨道标尺（显示实时 % 与 fr）
    const isBoneStage = s.scene === "poster" || s.scene === "magazine";
    if (isBoneStage) {
      ctx.fillStyle = s.scene === "magazine" ? "#DDDAD3" : "#F3EDE2";
      ctx.fillRect(f.x, f.y, f.w, f.h);
    }
    ctx.strokeStyle = "rgba(240, 235, 226, 0.24)";
    ctx.lineWidth = 1;
    ctx.strokeRect(f.x + 0.5, f.y + 0.5, f.w - 1, f.h - 1);

    const colStarts = layout.cols;
    for (let i = 0; i < 3; i++) {
      const x0 = f.x + colStarts[i] * f.w;
      const x1 = f.x + colStarts[i + 1] * f.w;
      const cw = x1 - x0;
      const pct = layout.pctValues[i];
      const crushed = layout.colWidths[i] < 0.125;

      // 顶标尺横杠
      ctx.strokeStyle = crushed ? P.danger : i === 1 ? P.yellow : P.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0 + 3, f.y - 8);
      ctx.lineTo(x1 - 3, f.y - 8);
      ctx.stroke();

      // 百分比与 fr 标尺文字
      if (cw > 34) {
        const label = cw > 78 && !f.compact ? `${pct}% · ${layout.frValues[i]}fr` : `${pct}%`;
        ctx.font = `700 ${f.compact ? 10 : 11}px "Space Mono", monospace`;
        ctx.fillStyle = crushed ? P.danger : P.inkLight;
        const tw = ctx.measureText(label).width;
        ctx.fillText(label, x0 + (cw - tw) / 2, f.y - 14);
      }
    }

    // 左侧行高百分比小尺
    const rowStarts = layout.rows;
    ctx.font = `700 10px "Space Mono", monospace`;
    for (let j = 0; j < 3; j++) {
      const y0 = f.y + rowStarts[j] * f.h;
      const y1 = f.y + rowStarts[j + 1] * f.h;
      const rh = y1 - y0;
      const rPct = Math.round(layout.rowHeights[j] * 100);
      if (rh > 26 && !f.compact) {
        ctx.fillStyle = "rgba(240, 235, 226, 0.72)";
        ctx.fillText(`${rPct}%`, 6, y0 + rh / 2 + 4);
      }
    }

    // 3. 若有脱轨块，先在原位画幽灵虚线目标轨，直观对比“脱轨多少”
    for (const b of layout.blocks) {
      if (!b.isDrifted) continue;
      const gx = f.x + b.gridRect.x * f.w;
      const gy = f.y + b.gridRect.y * f.h;
      const gw = b.gridRect.w * f.w;
      const gh = b.gridRect.h * f.h;
      ctx.save();
      ctx.strokeStyle = "rgba(239, 230, 66, 0.35)";
      ctx.lineWidth = 1;
      drawDashedRect(ctx, gx, gy, gw, gh, [3, 4]);
      ctx.restore();
    }

    // 4. 水平与垂直隐性网格线（随开场进度平滑抽线进入）
    const ease = 1 - Math.pow(1 - introProgress, 3);
    const v1x = Math.round(f.x + s.v1 * f.w) + 0.5;
    const v2x = Math.round(f.x + s.v2 * f.w) + 0.5;
    const h1y = Math.round(f.y + s.h1 * f.h) + 0.5;
    const h2y = Math.round(f.y + layout.h2 * f.h) + 0.5;

    // 中心参考暗虚线（让用户看见自己已经偏离中心轴）
    const midX = Math.round(f.x + f.w * 0.5) + 0.5;
    ctx.save();
    ctx.strokeStyle = isBoneStage ? "rgba(16, 18, 20, 0.14)" : "rgba(255, 255, 255, 0.14)";
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.moveTo(midX, f.y);
    ctx.lineTo(midX, f.y + f.h);
    ctx.stroke();
    ctx.restore();

    // 网格水平轨 H1 / H2
    ctx.save();
    ctx.strokeStyle = hoverTarget === "h1" || dragMode === "h1" ? P.yellow : P.cyan;
    ctx.globalAlpha = hoverTarget === "h1" || dragMode === "h1" ? 0.95 : 0.62;
    ctx.lineWidth = hoverTarget === "h1" || dragMode === "h1" ? 2 : 1.2;
    ctx.beginPath();
    ctx.moveTo(f.x, h1y);
    ctx.lineTo(f.x + f.w * ease, h1y);
    ctx.stroke();
    ctx.globalAlpha = 0.32;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(f.x, h2y);
    ctx.lineTo(f.x + f.w * ease, h2y);
    ctx.stroke();
    ctx.restore();

    // 5. 绘制 4 个网格内容模块
    for (const b of layout.blocks) {
      const bx = f.x + b.x * f.w;
      const by = f.y + b.y * f.h;
      const bw = b.w * f.w;
      const bh = b.h * f.h;
      drawSceneBlock(b, bx, by, bw, bh, s.scene, f.compact, s.highlightKey);
    }

    // 6. 复刻原海报「结构示意」明黄顶横条 + 可拖动青色配重竖条 + 暖白小圆点
    // 顶黄条贴在最窄或右侧导轨顶缘
    const yellowBarW = Math.max(36, layout.colWidths[2] * f.w * 0.58);
    const yellowBarX = f.x + s.v2 * f.w + 8;
    ctx.fillStyle = P.yellow;
    ctx.fillRect(Math.min(f.x + f.w - yellowBarW - 4, yellowBarX), f.y + 4, yellowBarW, 6);

    // 可拖动的青色配重竖条 + 底部暖白配重圆（Arnheim 杠杆锚点）
    const ax = f.x + layout.anchorX * f.w;
    const anchorW = f.compact ? 11 : 13;
    const anchorH = f.compact ? 42 : 52;
    const ay = f.y + f.h - anchorH - 10;

    ctx.save();
    if (hoverTarget === "anchor" || dragMode === "anchor" || s.highlightKey === "balance") {
      ctx.strokeStyle = P.yellow;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(ax - anchorW / 2 - 4, ay - 4, anchorW + 8, anchorH + 8);
    }
    ctx.fillStyle = P.cyan;
    ctx.fillRect(ax - anchorW / 2, ay, anchorW, anchorH);
    // 配重圆伴随在配重条下方内侧
    ctx.fillStyle = isBoneStage ? "#111317" : P.bone;
    ctx.beginPath();
    ctx.arc(ax + (layout.anchorX > 0.5 ? -18 : 18), ay + anchorH - 8, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // 配重锚小标签
    const aLabel = "↔ 配重锚";
    ctx.font = `700 10px "Noto Sans SC", sans-serif`;
    const atw = ctx.measureText(aLabel).width + 10;
    const alx = Math.max(f.x + 4, Math.min(f.x + f.w - atw - 4, ax - atw / 2));
    const aly = ay - 20;
    ctx.fillStyle = layout.checks.passBalance ? "#0B4D5C" : "#B81F2D";
    ctx.fillRect(alx, aly, atw, 16);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(aLabel, alx + 5, aly + 12);
    ctx.restore();

    // 7. 青色虚线视觉动线箭头（复刻原海报结构示意动线）
    const arrowColor = layout.checks.passMovement ? P.cyanBright : P.danger;
    for (let i = 0; i < layout.pathOrder.length - 1; i++) {
      const p1 = layout.pathOrder[i];
      const p2 = layout.pathOrder[i + 1];
      drawArrow(ctx, f.x + p1.x * f.w, f.y + p1.y * f.h, f.x + p2.x * f.w, f.y + p2.y * f.h, arrowColor, true);
    }
    // 动线序号圆章 ①②③④
    layout.pathOrder.forEach((pt, idx) => {
      const cx = f.x + pt.x * f.w;
      const cy = f.y + pt.y * f.h;
      ctx.save();
      ctx.fillStyle = idx === 0 ? P.yellow : P.bg;
      ctx.strokeStyle = idx === 0 ? P.bg : arrowColor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.font = `700 10px "Space Mono", monospace`;
      ctx.fillStyle = idx === 0 ? P.bg : P.inkLight;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(idx + 1), cx, cy + 0.5);
      ctx.restore();
    });

    // 8. 垂直分栏轨 V1（主拖动轨）与 V2（次拖动轨）画在最上层，清晰可抓
    const drawVerticalRail = (rx, name, isPrimary) => {
      const active =
        (isPrimary && (dragMode === "v1" || dragMode === "v1-any" || hoverTarget === "v1")) ||
        (!isPrimary && (dragMode === "v2" || hoverTarget === "v2")) ||
        s.highlightKey === "tension";

      ctx.save();
      ctx.strokeStyle = isPrimary ? P.yellow : P.cyanBright;
      ctx.lineWidth = active ? 2.4 : isPrimary ? 1.8 : 1.3;
      ctx.beginPath();
      ctx.moveTo(rx, f.y);
      ctx.lineTo(rx, f.y + f.h * ease);
      ctx.stroke();

      // 轨道拉手胶囊
      const handleY = f.y + (isPrimary ? f.h * 0.14 : f.h * 0.42);
      const pillTxt = isPrimary ? (f.compact ? "↔ V1" : "↔ 拖分栏 V1") : "↔ V2";
      ctx.font = `700 10.5px "Space Mono", "Noto Sans SC", sans-serif`;
      const pw = ctx.measureText(pillTxt).width + 12;
      const ph = 20;
      const px = Math.max(f.x + 2, Math.min(f.x + f.w - pw - 2, rx - pw / 2));
      ctx.fillStyle = isPrimary ? P.yellow : P.cyan;
      ctx.fillRect(px, handleY - ph / 2, pw, ph);
      ctx.fillStyle = "#08090B";
      ctx.fillText(pillTxt, px + 6, handleY + 4);
      ctx.restore();
    };
    drawVerticalRail(v1x, "V1", true);
    drawVerticalRail(v2x, "V2", false);

    // 磁吸回轨瞬时绿青闪光
    if (snapPulse > 0.02) {
      ctx.save();
      ctx.strokeStyle = P.ok;
      ctx.globalAlpha = snapPulse * 0.7;
      ctx.lineWidth = 3;
      ctx.strokeRect(f.x + 1, f.y + 1, f.w - 2, f.h - 2);
      ctx.restore();
    }

    // 9. 底沿嵌入实时「视觉杠杆标尺（Fulcrum Beam · 示意）」——严格夹在画布内永不裁边
    const beamY = f.y + f.h + 23;
    const beamCx = f.x + f.w * 0.5;
    const beamHalf = Math.min(f.w * 0.40, 210);
    const dyEnd = Math.max(-13, Math.min(13, (smoothAngle / 14) * 13));
    const dxEnd = Math.sqrt(Math.max(100, beamHalf * beamHalf - dyEnd * dyEnd));
    const balanceColor = layout.checks.passBalance ? P.ok : P.danger;

    ctx.save();
    // 基准水平虚线
    ctx.strokeStyle = "rgba(240, 235, 226, 0.22)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(beamCx - beamHalf, beamY);
    ctx.lineTo(beamCx + beamHalf, beamY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 倾斜的杠杆梁（dyEnd < 0 表示左倾，左侧下沉、右侧抬高）
    const lx = beamCx - dxEnd;
    const ly = beamY - dyEnd;
    const rx = beamCx + dxEnd;
    const ry = beamY + dyEnd;

    ctx.strokeStyle = balanceColor;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(rx, ry);
    ctx.stroke();

    // 梁端配重圆点
    ctx.fillStyle = P.bone;
    ctx.beginPath();
    ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.cyan;
    ctx.beginPath();
    ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 中央支点三角
    ctx.fillStyle = P.yellow;
    ctx.beginPath();
    ctx.moveTo(beamCx, beamY + 2);
    ctx.lineTo(beamCx - 6.5, beamY + 13);
    ctx.lineTo(beamCx + 6.5, beamY + 13);
    ctx.closePath();
    ctx.fill();

    // 支点读数标签（明确标「示意」，不装假精确）
    const beamText = layout.checks.passBalance
      ? `视觉杠杆 平衡（偏差 ${layout.torquePct > 0 ? "+" : ""}${layout.torquePct}% · 示意）`
      : `视觉杠杆 ${layout.torquePct < 0 ? "左倾" : "右倾"} ${Math.abs(layout.torquePct)}%（示意）`;
    ctx.font = `700 ${f.compact ? 10 : 11}px "Space Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = balanceColor;
    ctx.textAlign = "center";
    ctx.fillText(beamText, beamCx, beamY + 29);
    ctx.restore();

    ctx.restore();
  }

  const ctrl = loop(canvas, render);

  return {
    redraw() {
      dirty = true;
      ctrl.draw();
    },
    destroy() {
      ro.disconnect();
    },
  };
}

// 220 双向文字排版 · 开场交互舞台：十字双轴交汇排字台（2D Canvas）
// 1:1 承袭原海报哑光曜黑底场、横纵双轨、中央电光青 + 枢纽、四象限斜折线引注与实测视线转轨。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, computeLayout } from "./model.js";

const FONT_CJK = '"Noto Sans SC", sans-serif';
const FONT_SYNE = '"Syne", "Space Grotesk", sans-serif';
const FONT_MONO = '"IBM Plex Mono", monospace';

export function mountHeroStage(canvas, getState, onPatch, onAfterLayout) {
  const ctx = canvas.getContext("2d");
  let dpr = pixelRatio(2);
  let width = 960;
  let height = 470;
  let lastLayout = null;
  let dirty = true;

  // 开场 1.05s 绘制进场动效（0.9s 截图时已清晰完整）
  let introT = reducedMotion.matches ? 1 : 0;

  // 视线切轨光束演练（按 Space 或按钮触发）
  let sweep = { active: false, t: 0, duration: 2.6 };

  // 指针交互状态
  let drag = null; // { mode: 'hub' | 'axisX' | 'axisY', startX, startY, startHubX, startHubY, moved }
  let hoverZone = null; // 'hub' | 'hRail' | 'vRail' | null

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = pixelRatio(2);
    width = Math.round(rect.width);
    height = Math.round(rect.height);
    const cw = Math.round(width * dpr);
    const ch = Math.round(height * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    dirty = true;
  }

  function triggerSweep() {
    if (reducedMotion.matches) {
      sweep = { active: true, t: 0.62, duration: 2.6 };
      dirty = true;
      ctl.draw();
      return;
    }
    sweep = { active: true, t: 0, duration: 2.6 };
    dirty = true;
  }

  function markDirty() {
    dirty = true;
    ctl.draw();
  }

  function getPoint(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top,
    };
  }

  function hitTest(pt, lay) {
    if (!lay) return null;
    const { hub, hRail, vRail } = lay;
    const pad = 14;
    if (
      pt.x >= hub.x - pad &&
      pt.x <= hub.x + hub.w + pad &&
      pt.y >= hub.y - pad &&
      pt.y <= hub.y + hub.h + pad
    ) {
      return "hub";
    }
    if (pt.x >= hRail.x && pt.x <= hRail.x + hRail.w && pt.y >= hRail.y && pt.y <= hRail.y + hRail.h) {
      return "hRail";
    }
    if (pt.x >= vRail.x && pt.x <= vRail.x + vRail.w && pt.y >= vRail.y && pt.y <= vRail.y + vRail.h) {
      return "vRail";
    }
    return "bg";
  }

  // ---- 指针事件（支持桌面鼠标 + 手机触屏横拖不锁竖滚 + data-perf-drag 实时重画） ----
  canvas.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0 && ev.pointerType === "mouse") return;
    const pt = getPoint(ev);
    const lay = lastLayout || computeLayout(getState(), width, height);
    const zone = hitTest(pt, lay);
    const st = getState();
    drag = {
      pointerId: ev.pointerId,
      pointerType: ev.pointerType,
      zone,
      startX: pt.x,
      startY: pt.y,
      startHubX: st.hubX,
      startHubY: st.hubY,
      moved: false,
      lockedDir: zone === "hub" ? "both" : null,
    };
    if (zone === "hub" || ev.pointerType === "mouse") {
      try {
        canvas.setPointerCapture(ev.pointerId);
      } catch {}
    }
  });

  canvas.addEventListener("pointermove", (ev) => {
    const pt = getPoint(ev);
    const lay = lastLayout || computeLayout(getState(), width, height);
    if (!drag) {
      const z = hitTest(pt, lay);
      if (z !== hoverZone) {
        hoverZone = z;
        canvas.style.cursor = z === "hub" ? "grab" : z === "hRail" || z === "vRail" ? "pointer" : "ew-resize";
        dirty = true;
        ctl.draw();
      }
      return;
    }
    if (drag.pointerId !== ev.pointerId) return;

    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 4) {
      drag.moved = true;
      if (!drag.lockedDir) {
        // 触屏时若明显纵向滑动且没抓在枢纽上，则让位给页面滚动
        if (drag.pointerType === "touch" && Math.abs(dy) > Math.abs(dx) * 1.35) {
          drag = null;
          return;
        }
        drag.lockedDir = drag.zone === "hRail" && Math.abs(dy) > Math.abs(dx) ? "y" : "xy";
      }
      try {
        canvas.setPointerCapture(ev.pointerId);
      } catch {}
    }
    if (!drag.moved) return;

    const innerW = Math.max(120, lay.w - lay.padX * 2);
    const innerH = Math.max(120, lay.h - lay.padY * 2);
    let nx = clamp(drag.startHubX + dx / innerW, 0.16, 0.84);
    let ny = clamp(drag.startHubY + dy / innerH, 0.22, 0.78);

    // 靠近正中 50% / 53% 时极轻吸附
    if (Math.abs(nx - 0.5) < 0.016) nx = 0.5;
    if (Math.abs(ny - 0.53) < 0.016) ny = 0.53;

    if (drag.lockedDir === "y") {
      onPatch({ hubY: Number(ny.toFixed(3)) });
    } else if (drag.zone === "bg" || drag.pointerType === "touch") {
      // 横拖画布或触屏拖动时平滑调节交汇 X（若按住枢纽则 X/Y 同时动）
      if (drag.zone === "hub") {
        onPatch({ hubX: Number(nx.toFixed(3)), hubY: Number(ny.toFixed(3)) });
      } else {
        const nextY = drag.pointerType === "mouse" ? Number(ny.toFixed(3)) : drag.startHubY;
        onPatch({ hubX: Number(nx.toFixed(3)), hubY: nextY });
      }
    } else {
      onPatch({ hubX: Number(nx.toFixed(3)), hubY: Number(ny.toFixed(3)) });
    }
    canvas.style.cursor = "grabbing";
  });

  function finishPointer(ev) {
    if (!drag || drag.pointerId !== ev.pointerId) return;
    const wasMoved = drag.moved;
    const zone = drag.zone;
    drag = null;
    canvas.style.cursor = hoverZone === "hub" ? "grab" : "pointer";
    try {
      canvas.releasePointerCapture(ev.pointerId);
    } catch {}

    // 轻点交互：直点横轨/纵轨切换主导路径，直点 + 枢纽播演视线转轨
    if (!wasMoved) {
      const st = getState();
      if (zone === "hRail") {
        const nextBal = st.axisBalance >= 0.3 ? 0.0 : 0.46;
        onPatch({ axisBalance: nextBal });
      } else if (zone === "vRail") {
        const nextBal = st.axisBalance <= -0.3 ? 0.0 : -0.46;
        onPatch({ axisBalance: nextBal });
      } else if (zone === "hub") {
        triggerSweep();
      }
    }
  }

  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", finishPointer);
  canvas.addEventListener("pointerleave", () => {
    if (!drag && hoverZone) {
      hoverZone = null;
      dirty = true;
      ctl.draw();
    }
  });

  // ---- 辅助绘图函数（无高开销 shadowBlur，保证软件渲染 60fps） ----
  function drawCornerBrackets(x, y, bw, bh, len, color, lw = 1.2) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    // TL
    ctx.moveTo(x, y + len);
    ctx.lineTo(x, y);
    ctx.lineTo(x + len, y);
    // TR
    ctx.moveTo(x + bw - len, y);
    ctx.lineTo(x + bw, y);
    ctx.lineTo(x + bw, y + len);
    // BL
    ctx.moveTo(x, y + bh - len);
    ctx.lineTo(x, y + bh);
    ctx.lineTo(x + len, y + bh);
    // BR
    ctx.moveTo(x + bw - len, y + bh);
    ctx.lineTo(x + bw, y + bh);
    ctx.lineTo(x + bw, y + bh - len);
    ctx.stroke();
  }

  function drawTriangle(cx, cy, size, dir, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    if (dir === "up") {
      ctx.moveTo(cx, cy - size);
      ctx.lineTo(cx - size * 0.9, cy + size * 0.7);
      ctx.lineTo(cx + size * 0.9, cy + size * 0.7);
    } else if (dir === "down") {
      ctx.moveTo(cx, cy + size);
      ctx.lineTo(cx - size * 0.9, cy - size * 0.7);
      ctx.lineTo(cx + size * 0.9, cy - size * 0.7);
    } else if (dir === "left") {
      ctx.moveTo(cx - size, cy);
      ctx.lineTo(cx + size * 0.7, cy - size * 0.9);
      ctx.lineTo(cx + size * 0.7, cy + size * 0.9);
    } else {
      ctx.moveTo(cx + size, cy);
      ctx.lineTo(cx - size * 0.7, cy - size * 0.9);
      ctx.lineTo(cx - size * 0.7, cy + size * 0.9);
    }
    ctx.closePath();
    ctx.fill();
  }

  // 绘制带字距的中文横排，并在挤爆时如实按臂宽裁切+高亮红警
  function drawTrackedHorizontal(text, box, fontSize, weight, tracking, color, align = "center") {
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x + 2, box.y + 2, Math.max(4, box.w - 4), Math.max(4, box.h - 4));
    ctx.clip();

    ctx.font = `${weight} ${fontSize}px ${FONT_CJK}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    const chars = [...text];
    const step = fontSize * (1 + tracking * 0.65);
    const totalW = (chars.length - 1) * step + fontSize;
    let startX = box.x + box.w / 2 - totalW / 2 + fontSize / 2;
    if (align === "left") startX = box.x + 12 + fontSize / 2;
    const y = box.y + box.h * 0.43;

    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], startX + i * step, y);
    }
    ctx.restore();
    return totalW;
  }

  // 绘制真实直排中文列
  function drawVerticalColumn(text, box, fontSize, weight, stepRatio, color, anchorPos = "mid") {
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x + 2, box.y + 2, Math.max(4, box.w - 4), Math.max(4, box.h - 4));
    ctx.clip();

    ctx.font = `${weight} ${fontSize}px ${FONT_CJK}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    const chars = [...text];
    const step = fontSize * stepRatio;
    const totalH = (chars.length - 1) * step + fontSize;
    let startY = box.y + box.h / 2 - totalH / 2 + fontSize / 2;
    if (anchorPos === "top") startY = box.y + 10 + fontSize / 2;
    if (anchorPos === "bottom") startY = box.y + box.h - 10 - totalH + fontSize / 2;
    const x = box.x + box.w / 2;

    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], x, startY + i * step);
    }
    ctx.restore();
    return totalH;
  }

  function render(t, dt, { still }) {
    if (!width || !height) resize();
    const st = getState();

    // 推进开场进场动效
    let animating = false;
    if (still) {
      introT = 1;
    } else if (introT < 1) {
      introT = Math.min(1, introT + (dt || 0.016) / 0.85);
      animating = true;
    }

    // 推进视线演练光束
    if (sweep.active && !still) {
      sweep.t += (dt || 0.016) / sweep.duration;
      if (sweep.t >= 1) {
        sweep.active = false;
        sweep.t = 0;
      } else {
        animating = true;
      }
    }

    if (!dirty && !animating) return;
    dirty = false;

    const lay = computeLayout(st, width, height);
    lastLayout = lay;
    if (onAfterLayout) onAfterLayout(lay);

    const ease = 1 - Math.pow(1 - introT, 3);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 原海报哑光曜黑底场 + 极淡工程坐标微网格
    ctx.fillStyle = "#0E1011";
    ctx.fillRect(0, 0, lay.w, lay.h);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.032)";
    ctx.lineWidth = 1;
    const gridStep = lay.compact ? 28 : 36;
    ctx.beginPath();
    for (let gx = lay.padX; gx <= lay.w - lay.padX; gx += gridStep) {
      ctx.moveTo(gx + 0.5, lay.padY);
      ctx.lineTo(gx + 0.5, lay.h - lay.padY);
    }
    for (let gy = lay.padY; gy <= lay.h - lay.padY; gy += gridStep) {
      ctx.moveTo(lay.padX, gy + 0.5);
      ctx.lineTo(lay.w - lay.padX, gy + 0.5);
    }
    ctx.stroke();

    // 配色依据统一归属状态动态切换（单真源！）
    const isSplit = st.unity === "split";
    const isWashed = st.unity === "washed";
    const cyan = isWashed ? "#68737A" : "#2DC8FC";
    const cyanSoft = isWashed ? "rgba(120, 132, 140, 0.25)" : "rgba(45, 200, 252, 0.32)";
    const white = isWashed ? "#A7B1B7" : "#F8FBFC";
    const muted = "#8C9AA3";
    const errRed = "#FF6B6B";
    const okMint = "#3BE8B0";

    // 读向切换时的视觉权重（只看横向 / 只看纵向 / 双向）
    const hAlpha = st.readMode === "vertical" ? 0.28 : 1.0;
    const vAlpha = st.readMode === "horizontal" ? 0.28 : 1.0;

    // 2. 四象限斜线蓝图底区与原海报风格斜折引注
    const quadEntries = [
      { key: "nw", rect: lay.quads.nw, info: lay.spec.quads.nw, pct: lay.quadPct.nw, corner: [lay.hub.x, lay.hub.y] },
      { key: "ne", rect: lay.quads.ne, info: lay.spec.quads.ne, pct: lay.quadPct.ne, corner: [lay.hub.x + lay.hub.w, lay.hub.y] },
      { key: "sw", rect: lay.quads.sw, info: lay.spec.quads.sw, pct: lay.quadPct.sw, corner: [lay.hub.x, lay.hub.y + lay.hub.h] },
      { key: "se", rect: lay.quads.se, info: lay.spec.quads.se, pct: lay.quadPct.se, corner: [lay.hub.x + lay.hub.w, lay.hub.y + lay.hub.h] },
    ];

    for (const q of quadEntries) {
      const { rect } = q;
      if (rect.w < 20 || rect.h < 20) continue;

      // 象限过小红警底纹
      const squeezed = q.pct < 8;
      if (st.showGuides) {
        ctx.save();
        ctx.fillStyle = squeezed ? "rgba(255, 107, 107, 0.08)" : "rgba(255, 255, 255, 0.015)";
        ctx.fillRect(rect.x + 6, rect.y + 6, Math.max(0, rect.w - 12), Math.max(0, rect.h - 12));
        ctx.strokeStyle = squeezed ? "rgba(255, 107, 107, 0.45)" : "rgba(255, 255, 255, 0.06)";
        ctx.setLineDash([3, 4]);
        ctx.strokeRect(rect.x + 6.5, rect.y + 6.5, Math.max(0, rect.w - 13), Math.max(0, rect.h - 13));
        ctx.setLineDash([]);
        ctx.restore();
      }

      // 仅当象限有足够空间时绘制原海报斜折线 + 「标题 + 说明，防止窄区重叠
      const canShowFull = !lay.compact && rect.w >= 175 && rect.h >= 96;
      const canShowCompact = rect.w >= 68 && rect.h >= 42;
      if (canShowFull) {
        const isLeft = q.key === "nw" || q.key === "sw";
        const isTop = q.key === "nw" || q.key === "ne";
        const anchorX = isLeft ? rect.x + rect.w - 30 : rect.x + 30;
        const anchorY = isTop ? rect.y + rect.h - 24 : rect.y + 26;
        const textX = isLeft ? Math.max(rect.x + 22, anchorX - 165) : Math.min(rect.x + rect.w - 185, anchorX + 20);
        const textY = isTop ? Math.max(rect.y + 24, anchorY - 58) : Math.min(rect.y + rect.h - 62, anchorY + 14);

        // 原海报斜折电光青引线
        ctx.save();
        ctx.strokeStyle = squeezed ? errRed : cyanSoft;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(q.corner[0], q.corner[1]);
        const elbowX = isLeft ? q.corner[0] - 26 : q.corner[0] + 26;
        const elbowY = isTop ? q.corner[1] - 24 : q.corner[1] + 24;
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(isLeft ? Math.min(elbowX, textX + 128) : Math.max(elbowX, textX + 128), elbowY);
        ctx.stroke();

        // 「 标志直角钩
        ctx.strokeStyle = cyan;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(textX - 8, textY + 4);
        ctx.lineTo(textX - 8, textY - 6);
        ctx.lineTo(textX + 2, textY - 6);
        ctx.stroke();

        ctx.font = `700 13px ${FONT_CJK}`;
        ctx.fillStyle = cyan;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(q.info.title, textX, textY - 3);

        ctx.font = `400 11.5px ${FONT_CJK}`;
        ctx.fillStyle = "#A9B5BD";
        ctx.fillText(q.info.body.slice(0, 14), textX, textY + 16);
        if (q.info.body.length > 14) {
          ctx.fillText(q.info.body.slice(14), textX, textY + 32);
        }

        // 象限面积百分比小标
        if (st.showGuides) {
          ctx.font = `500 10.5px ${FONT_MONO}`;
          ctx.fillStyle = squeezed ? errRed : "#7D8C96";
          ctx.fillText(`${q.key.toUpperCase()} ${q.pct}%`, isLeft ? rect.x + 14 : rect.x + rect.w - 60, isTop ? rect.y + 12 : rect.y + rect.h - 20);
        }
        ctx.restore();
      } else if (canShowCompact && st.showGuides) {
        ctx.save();
        ctx.font = `500 10.5px ${FONT_MONO}`;
        ctx.fillStyle = squeezed ? errRed : "#7E8E98";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${q.key.toUpperCase()} ${q.pct}%`, rect.x + rect.w / 2, rect.y + rect.h / 2);
        ctx.restore();
      }
    }

    // 3. 纵向轨道柱（先画纵轨或横轨：按主次决定谁在视觉上更强，交汇方块始终最顶层）
    const drawVerticalRail = () => {
      ctx.save();
      ctx.globalAlpha = vAlpha;
      const r = lay.vRail;
      const animH = r.h * ease;
      const animY = lay.cy - (lay.cy - r.y) * ease;

      // 裂变杂拼模式下：纵轴突兀变成暖橘实心厚块+圆角，破坏统一归属
      if (isSplit) {
        ctx.fillStyle = "rgba(240, 128, 42, 0.20)";
        ctx.fillRect(r.x, animY, r.w, animH);
        ctx.strokeStyle = "#F59E3D";
        ctx.lineWidth = 2.2;
        ctx.strokeRect(r.x + 1, animY + 1, r.w - 2, animH - 2);
      } else {
        const isDom = lay.domDir === "vertical";
        ctx.fillStyle = isDom ? "rgba(45, 200, 252, 0.08)" : "rgba(255, 255, 255, 0.025)";
        ctx.fillRect(r.x, animY, r.w, animH);
        ctx.strokeStyle =
          st.highlightDim === "juxtapose" || hoverZone === "vRail"
            ? cyan
            : isDom
              ? "rgba(255, 255, 255, 0.56)"
              : "rgba(255, 255, 255, 0.28)";
        ctx.lineWidth = isDom ? 1.5 : 1.0;
        ctx.strokeRect(r.x + 0.5, animY + 0.5, r.w - 1, animH - 1);
      }

      // 顶底虚线分隔 + 三角箭头（原海报标志母题）
      const capH = lay.compact ? 20 : 22;
      ctx.strokeStyle = isSplit ? "rgba(245, 158, 61, 0.5)" : "rgba(255, 255, 255, 0.24)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(r.x, r.y + capH);
      ctx.lineTo(r.x + r.w, r.y + capH);
      ctx.moveTo(r.x, r.y + r.h - capH);
      ctx.lineTo(r.x + r.w, r.y + r.h - capH);
      ctx.stroke();
      ctx.setLineDash([]);

      const triColor = isSplit ? "#F59E3D" : cyan;
      drawTriangle(lay.cx, r.y + capH * 0.5, 4.5, "up", triColor);
      drawTriangle(lay.cx, r.y + r.h - capH * 0.5, 4.5, "down", triColor);

      // 上纵臂文字
      const vTextColor = isSplit ? "#FFD39E" : white;
      const vSubColor = isSplit ? "#F59E3D" : cyan;
      if (lay.topArm.h > 34) {
        if (!lay.compact && lay.topArm.h > 105) {
          ctx.font = `600 9.5px ${FONT_MONO}`;
          ctx.fillStyle = vSubColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(lay.spec.vTopEn, lay.cx, lay.topArm.y + 4);
        }
        drawVerticalColumn(
          lay.spec.vTopTitle,
          {
            x: lay.topArm.x,
            y: lay.topArm.y + (lay.compact ? 4 : 16),
            w: lay.topArm.w,
            h: Math.max(12, lay.topArm.h - (lay.compact ? 8 : 22)),
          },
          lay.vFontSize,
          lay.vWeight,
          lay.vStepRatio,
          vTextColor,
          "mid"
        );
      }

      // 下纵臂文字
      if (lay.botArm.h > 34) {
        drawVerticalColumn(
          lay.spec.vBotTitle,
          {
            x: lay.botArm.x,
            y: lay.botArm.y + 4,
            w: lay.botArm.w,
            h: Math.max(12, lay.botArm.h - (lay.compact ? 8 : 24)),
          },
          lay.vFontSize,
          lay.vWeight,
          lay.vStepRatio,
          vTextColor,
          "mid"
        );
        if (!lay.compact && lay.botArm.h > 105) {
          ctx.font = `600 9.5px ${FONT_MONO}`;
          ctx.fillStyle = vSubColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(lay.spec.vBotEn, lay.cx, lay.botArm.y + lay.botArm.h - 4);
        }
      }

      // 上/下纵臂挤窄红框警报
      if (lay.armFits.top < 0.84) {
        ctx.strokeStyle = errRed;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(lay.topArm.x + 2, lay.topArm.y + 2, lay.topArm.w - 4, lay.topArm.h - 4);
        ctx.setLineDash([]);
        const bx = clamp(lay.vRail.x + lay.vRail.w + 6, 8, lay.w - 82);
        const by = Math.max(24, lay.topArm.y + 2);
        ctx.fillStyle = errRed;
        ctx.fillRect(bx, by, 74, 18);
        ctx.font = `700 10.5px ${FONT_CJK}`;
        ctx.fillStyle = "#0E1011";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("× 上臂挤窄", bx + 37, by + 9);
      }
      if (lay.armFits.bot < 0.84) {
        ctx.strokeStyle = errRed;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(lay.botArm.x + 2, lay.botArm.y + 2, lay.botArm.w - 4, lay.botArm.h - 4);
        ctx.setLineDash([]);
        const bx = clamp(lay.vRail.x + lay.vRail.w + 6, 8, lay.w - 82);
        const by = Math.min(lay.h - 24, lay.botArm.y + lay.botArm.h - 20);
        ctx.fillStyle = errRed;
        ctx.fillRect(bx, by, 74, 18);
        ctx.font = `700 10.5px ${FONT_CJK}`;
        ctx.fillStyle = "#0E1011";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("× 下臂挤窄", bx + 37, by + 9);
      }
      ctx.restore();
    };

    // 4. 横向主轨
    const drawHorizontalRail = () => {
      ctx.save();
      ctx.globalAlpha = hAlpha;
      const r = lay.hRail;
      const animW = r.w * ease;
      const animX = lay.cx - (lay.cx - r.x) * ease;
      const isDom = lay.domDir === "horizontal";

      ctx.fillStyle = isDom ? "rgba(45, 200, 252, 0.08)" : "rgba(255, 255, 255, 0.025)";
      ctx.fillRect(animX, r.y, animW, r.h);

      ctx.strokeStyle =
        st.highlightDim === "juxtapose" || hoverZone === "hRail"
          ? cyan
          : isDom
            ? "rgba(255, 255, 255, 0.56)"
            : "rgba(255, 255, 255, 0.28)";
      ctx.lineWidth = isDom ? 1.5 : 1.0;
      ctx.strokeRect(animX + 0.5, r.y + 0.5, animW - 1, r.h - 1);

      // 左右端虚线分隔 + 电光青三角箭头
      const capW = lay.compact ? 18 : 28;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(r.x + capW, r.y);
      ctx.lineTo(r.x + capW, r.y + r.h);
      ctx.moveTo(r.x + r.w - capW, r.y);
      ctx.lineTo(r.x + r.w - capW, r.y + r.h);
      ctx.stroke();
      ctx.setLineDash([]);

      drawTriangle(r.x + capW * 0.5, lay.cy, 4.5, "left", cyan);
      drawTriangle(r.x + r.w - capW * 0.5, lay.cy, 4.5, "right", cyan);

      // 左横臂大字 + 底部副标签
      drawTrackedHorizontal(lay.spec.hLeftTitle, lay.leftArm, lay.hFontSize, lay.hWeight, lay.hTracking, white);
      if (lay.leftArm.w > 110 && lay.hRail.h >= 62) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(lay.leftArm.x + 4, lay.leftArm.y, lay.leftArm.w - 8, lay.leftArm.h);
        ctx.clip();
        if (!lay.compact && lay.hRail.h >= 78) {
          ctx.font = `600 9.5px ${FONT_MONO}`;
          ctx.fillStyle = cyan;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(lay.spec.hEn, lay.leftArm.x + 12, lay.leftArm.y + 6);
        }
        ctx.font = `500 ${lay.compact ? 10 : 11.5}px ${FONT_CJK}`;
        ctx.fillStyle = cyan;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(lay.spec.hLeftTags, lay.leftArm.x + lay.leftArm.w / 2, lay.leftArm.y + lay.leftArm.h - 7);
        ctx.restore();
      }

      // 右横臂大字 + 底部副标签
      drawTrackedHorizontal(lay.spec.hRightTitle, lay.rightArm, lay.hFontSize, lay.hWeight, lay.hTracking, white);
      if (lay.rightArm.w > 110 && lay.hRail.h >= 62) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(lay.rightArm.x + 4, lay.rightArm.y, lay.rightArm.w - 8, lay.rightArm.h);
        ctx.clip();
        ctx.font = `500 ${lay.compact ? 10 : 11.5}px ${FONT_CJK}`;
        ctx.fillStyle = cyan;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(lay.spec.hRightTags, lay.rightArm.x + lay.rightArm.w / 2, lay.rightArm.y + lay.rightArm.h - 7);
        ctx.restore();
      }

      // 左/右横臂挤窄红框与碰撞警报
      if (lay.armFits.left < 0.84) {
        ctx.strokeStyle = errRed;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(lay.leftArm.x + 2, lay.leftArm.y + 2, lay.leftArm.w - 4, lay.leftArm.h - 4);
        ctx.setLineDash([]);
        const lx = Math.max(lay.padX + 2, Math.min(lay.leftArm.x, lay.vRail.x - 76));
        const ly = lay.leftArm.y + lay.leftArm.h + 6;
        ctx.fillStyle = errRed;
        ctx.fillRect(lx, ly, 74, 18);
        ctx.font = `700 10.5px ${FONT_CJK}`;
        ctx.fillStyle = "#0E1011";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("× 左臂挤窄", lx + 37, ly + 9);
      }
      if (lay.armFits.right < 0.84) {
        ctx.strokeStyle = errRed;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(lay.rightArm.x + 2, lay.rightArm.y + 2, lay.rightArm.w - 4, lay.rightArm.h - 4);
        ctx.setLineDash([]);
        ctx.fillStyle = errRed;
        ctx.fillRect(lay.rightArm.x + lay.rightArm.w - 78, lay.rightArm.y - 20, 74, 18);
        ctx.font = `700 10.5px ${FONT_CJK}`;
        ctx.fillStyle = "#0E1011";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("× 右臂挤窄", lay.rightArm.x + lay.rightArm.w - 41, lay.rightArm.y - 11);
      }
      ctx.restore();
    };

    if (lay.domDir === "vertical") {
      drawHorizontalRail();
      drawVerticalRail();
    } else {
      drawVerticalRail();
      drawHorizontalRail();
    }

    // 5. 中央「+」交汇枢纽（原海报最标志性的电光青核心！）
    {
      const hb = lay.hub;
      const hubFill = isWashed ? "#2C3338" : isSplit ? "#27221E" : "#2DC8FC";
      const plusColor = isWashed ? "#748088" : isSplit ? "#F59E3D" : "#0D1113";
      const hubErr = !lay.dims.anchor.ok;

      // 脉冲外框（点击枢纽或高亮「视觉重心」时提示可拖拽）
      if (hoverZone === "hub" || drag?.zone === "hub" || st.highlightDim === "anchor") {
        drawCornerBrackets(hb.x - 8, hb.y - 8, hb.w + 16, hb.h + 16, 10, hubErr ? errRed : cyan, 1.8);
      } else {
        drawCornerBrackets(hb.x - 5, hb.y - 5, hb.w + 10, hb.h + 10, 7, hubErr ? "rgba(255,107,107,0.75)" : "rgba(45,200,252,0.45)", 1.2);
      }

      ctx.fillStyle = hubFill;
      ctx.fillRect(hb.x, hb.y, hb.w, hb.h);

      if (hubErr) {
        ctx.strokeStyle = errRed;
        ctx.lineWidth = 2;
        ctx.strokeRect(hb.x + 1, hb.y + 1, hb.w - 2, hb.h - 2);
      }

      // 精准粗 + 号
      const arm = Math.min(hb.w, hb.h) * 0.28;
      const thick = Math.max(4.5, Math.min(hb.w, hb.h) * 0.11);
      ctx.fillStyle = plusColor;
      ctx.fillRect(hb.cx - arm, hb.cy - thick / 2, arm * 2, thick);
      ctx.fillRect(hb.cx - thick / 2, hb.cy - arm, thick, arm * 2);

      // 枢纽外角微型坐标标签（放在横轨下沿+纵轨右沿的象限空处，绝不遮挡字或红标）
      if (st.showGuides) {
        const tagText = lay.hubScale > 1.38 ? "× 枢纽压字" : `X ${Math.round(lay.hubX * 100)}% · Y ${Math.round(lay.hubY * 100)}%`;
        ctx.font = `600 10px ${FONT_MONO}`;
        const tw = ctx.measureText(tagText).width + 12;
        const placeRight = lay.hubX < 0.72;
        const tx = clamp(placeRight ? Math.max(hb.x + hb.w, lay.vRail.x + lay.vRail.w) + 8 : Math.min(hb.x, lay.vRail.x) - tw - 8, 8, lay.w - tw - 8);
        const ty = clamp(Math.max(hb.y + hb.h, lay.hRail.y + lay.hRail.h) + 6, 24, lay.h - 24);
        ctx.fillStyle = "rgba(14, 16, 17, 0.92)";
        ctx.fillRect(tx, ty, tw, 17);
        ctx.strokeStyle = hubErr ? errRed : cyanSoft;
        ctx.lineWidth = 1;
        ctx.strokeRect(tx + 0.5, ty + 0.5, tw - 1, 16);
        ctx.fillStyle = hubErr ? errRed : cyan;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tagText, tx + tw / 2, ty + 9);
      }
    }

    // 6. 视线切轨光束演练（按 Space 或按钮触发：先顺主轴扫入 → 在 + 枢纽 90° 转轨切入副轴；错态下真实暴露卡顿/分叉）
    if (sweep.active) {
      const p = clamp(sweep.t, 0, 1);
      const isOk = lay.score === 4;
      const beamColor = isOk ? okMint : errRed;
      const firstH = lay.domDir !== "vertical";

      ctx.save();
      ctx.lineCap = "round";
      if (p < 0.5) {
        const q = p / 0.5;
        if (firstH) {
          const x0 = lay.hRail.x + 22;
          const x1 = x0 + (lay.cx - x0) * q;
          ctx.strokeStyle = beamColor;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(x0, lay.cy);
          ctx.lineTo(x1, lay.cy);
          ctx.stroke();
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(x1, lay.cy, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const y0 = lay.vRail.y + 22;
          const y1 = y0 + (lay.cy - y0) * q;
          ctx.strokeStyle = beamColor;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(lay.cx, y0);
          ctx.lineTo(lay.cx, y1);
          ctx.stroke();
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(lay.cx, y1, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const q = (p - 0.5) / 0.5;
        // 枢纽处亮起转轨环
        ctx.strokeStyle = beamColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lay.cx, lay.cy, 12 + q * 22, 0, Math.PI * 2);
        ctx.globalAlpha = Math.max(0, 1 - q);
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (!isOk && lay.domDir === "tie") {
          // 五五打架：在交叉口同时向两条轨道分叉抖动，演示视线犹豫
          const hx = lay.cx + (lay.hRail.x + lay.hRail.w - 24 - lay.cx) * q * 0.65;
          const vy = lay.cy + (lay.vRail.y + lay.vRail.h - 24 - lay.cy) * q * 0.65;
          ctx.strokeStyle = errRed;
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(lay.cx, lay.cy);
          ctx.lineTo(hx, lay.cy);
          ctx.moveTo(lay.cx, lay.cy);
          ctx.lineTo(lay.cx, vy);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (firstH) {
          const y1 = lay.cy + (lay.vRail.y + lay.vRail.h - 22 - lay.cy) * q;
          ctx.strokeStyle = beamColor;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(lay.cx, lay.cy);
          ctx.lineTo(lay.cx, y1);
          ctx.stroke();
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(lay.cx, y1, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const x1 = lay.cx + (lay.hRail.x + lay.hRail.w - 22 - lay.cx) * q;
          ctx.strokeStyle = beamColor;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(lay.cx, lay.cy);
          ctx.lineTo(x1, lay.cy);
          ctx.stroke();
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(x1, lay.cy, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 7. 顶角微型状态栏（单真源）
    {
      ctx.font = `500 10.5px ${FONT_MONO}`;
      ctx.fillStyle = muted;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const ratioStr = lay.domRatio >= 1 ? `H:V ${lay.domRatio.toFixed(2)}:1` : `V:H ${(1 / lay.domRatio).toFixed(2)}:1`;
      const topLeft = `${ratioStr} · 反差 ${lay.rhythmContrast.toFixed(2)}×`;
      ctx.fillText(topLeft, lay.padX + 6, 4);

      const badge = lay.diagnosis.short;
      const bw = ctx.measureText(badge).width + 14;
      ctx.fillStyle = lay.score === 4 ? "rgba(59, 232, 176, 0.14)" : "rgba(255, 107, 107, 0.15)";
      ctx.fillRect(lay.w - lay.padX - bw, 2, bw, 17);
      ctx.strokeStyle = lay.score === 4 ? okMint : errRed;
      ctx.lineWidth = 1;
      ctx.strokeRect(lay.w - lay.padX - bw + 0.5, 2.5, bw - 1, 16);
      ctx.fillStyle = lay.score === 4 ? okMint : errRed;
      ctx.textAlign = "center";
      ctx.fillText(badge, lay.w - lay.padX - bw / 2, 5);
    }

    ctx.restore();
  }

  const ctl = loop(canvas, render);
  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);
  resize();
  ctl.draw();

  return {
    draw: markDirty,
    triggerSweep,
    getLayout: () => lastLayout,
  };
}

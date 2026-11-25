// 313 横向调度 · 开场宽银幕横向推轨 2D Canvas 舞台
// 视觉母题 1:1 承袭 313 原海报：暖米纸天空、6×5 点阵、五线谱横线、琥珀金圆、暖沙/钢蓝/炭墨递进体块、
// 贯通钢蓝地平带与三枚右向金三角；零五官极简侧影剪影，三层横向推轨视差，软件渲染下轻松稳跑 60fps。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";
import { ASPECTS, HORIZON_Y, NODE_META, clamp, evaluate, flipNodeDir, moveNode } from "./model.js";

export function mountHeroStage({ canvas, state, onChange }) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let w = 960;
  let h = 400;
  let dpr = 1;

  // 平滑动画状态（只在有变化或开场前 1.1s 缓动）
  let intro = reducedMotion.matches ? 1 : 0;
  let smoothPan = state.pan;
  let smoothCurtain = 0; // 0 for 2.39, 0.11 for 1.78, 0.22 for 1.33
  let flowPhase = 0;
  let draggingNode = -1;
  let dragStartPx = null;
  let dragMoved = false;
  let hoverNode = -1;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = pixelRatio(2);
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
  };

  // 将模型相对坐标 (x, y) 映射到当前画布像素（考虑横向推轨 pan 的轻微镜头平移）
  function stageMetrics() {
    const padX = Math.max(12, Math.round(w * 0.025));
    const innerW = w - padX * 2;
    // 推轨横移时，中景主体微微反向平移制造真实摄影机横向移动感，同时保留完全在画框内的拖拽精度
    const panShiftPx = -smoothPan * Math.min(w * 0.055, 58);
    return { padX, innerW, panShiftPx };
  }

  function nodeToPx(n, metrics) {
    const { padX, innerW, panShiftPx } = metrics;
    return {
      px: padX + n.x * innerW + panShiftPx,
      py: n.y * h,
    };
  }

  function pxToModel(px, py) {
    const { padX, innerW, panShiftPx } = stageMetrics();
    return {
      x: clamp((px - padX - panShiftPx) / innerW, 0.06, 0.94),
      y: clamp(py / h, 0.24, 0.76),
    };
  }

  // 绘制零五官极简建筑感电影侧影（严格无眼鼻嘴，靠头颈轮廓、微倾躯干与肩线表达朝向）
  function drawSilhouette(px, py, scale, dir, colorHex, isSelected, isHovered, badge, isClipped) {
    ctx.save();
    ctx.translate(px, py);
    if (isClipped) ctx.globalAlpha = 0.35;

    const headR = 11.5 * scale;
    const bodyH = 66 * scale;
    const bodyW = 24 * scale;
    const footY = bodyH * 0.56;
    const headY = -bodyH * 0.48;

    // 脚下水平投影（暗示脚踩在同一条水平地平带上）
    ctx.fillStyle = "rgba(24, 35, 46, 0.22)";
    ctx.beginPath();
    ctx.ellipse(dir * 2 * scale, footY + 3 * scale, bodyW * 0.85, 4.2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 柔和朝向目光锥（只画方向光带，不画五官）
    const coneLen = 68 * scale;
    const grad = ctx.createLinearGradient(0, headY, dir * coneLen, headY);
    grad.addColorStop(0, colorHex === PALETTE.gold ? "rgba(205, 150, 57, 0.30)" : "rgba(250, 247, 240, 0.24)");
    grad.addColorStop(1, "rgba(250, 247, 240, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(dir * headR * 0.65, headY - 2 * scale);
    ctx.lineTo(dir * coneLen, headY - 19 * scale);
    ctx.lineTo(dir * coneLen, headY + 15 * scale);
    ctx.closePath();
    ctx.fill();

    // 选中 / 悬停外框光环（简洁建筑方括，无圆角仪表盘感）
    if (isSelected || isHovered) {
      ctx.strokeStyle = isSelected ? PALETTE.gold : "rgba(27, 34, 31, 0.45)";
      ctx.lineWidth = isSelected ? 1.8 : 1.2;
      const bw = bodyW * 1.45;
      const top = headY - headR - 8 * scale;
      const bot = footY + 8 * scale;
      const tick = 7 * scale;
      ctx.beginPath();
      // 四角 L 形取景角标
      ctx.moveTo(-bw, top + tick); ctx.lineTo(-bw, top); ctx.lineTo(-bw + tick, top);
      ctx.moveTo(bw - tick, top); ctx.lineTo(bw, top); ctx.lineTo(bw, top + tick);
      ctx.moveTo(-bw, bot - tick); ctx.lineTo(-bw, bot); ctx.lineTo(-bw + tick, bot);
      ctx.moveTo(bw - tick, bot); ctx.lineTo(bw, bot); ctx.lineTo(bw, bot - tick);
      ctx.stroke();
    }

    // 躯干侧影（干净的现代主义大衣/立领剪影，带方向微倾）
    ctx.fillStyle = PALETTE.charcoal;
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.42, headY + headR + 3 * scale);
    ctx.lineTo(bodyW * 0.48 * dir + (dir > 0 ? 0 : 0), headY + headR + 4 * scale);
    // 用对称控制但朝向略前倾的梯形风衣廓形
    const shoulderFront = dir * bodyW * 0.56;
    const shoulderBack = -dir * bodyW * 0.46;
    const hemFront = dir * bodyW * 0.66;
    const hemBack = -dir * bodyW * 0.52;
    ctx.moveTo(shoulderBack, headY + headR + 5 * scale);
    ctx.quadraticCurveTo(0, headY + headR + 1 * scale, shoulderFront, headY + headR + 6 * scale);
    ctx.lineTo(hemFront, footY - 12 * scale);
    ctx.lineTo(dir * bodyW * 0.34, footY);
    ctx.lineTo(dir * bodyW * 0.08, footY);
    ctx.lineTo(dir * bodyW * 0.04, footY - 14 * scale);
    ctx.lineTo(-dir * bodyW * 0.14, footY);
    ctx.lineTo(-dir * bodyW * 0.40, footY);
    ctx.lineTo(hemBack, footY - 12 * scale);
    ctx.closePath();
    ctx.fill();

    // 角色色带肩章 / 竖条识别色（直接呼应 313 海报的琥珀金/暖沙/钢蓝/炭墨）
    ctx.fillStyle = colorHex;
    ctx.fillRect(
      dir > 0 ? -bodyW * 0.20 : -bodyW * 0.34,
      headY + headR + 10 * scale,
      bodyW * 0.54,
      14 * scale
    );
    // 若是炭墨角色，加一道极细浅米描边使其在深色块前依然清晰
    if (colorHex === PALETTE.charcoal) {
      ctx.strokeStyle = PALETTE.paperLight;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(
        dir > 0 ? -bodyW * 0.20 : -bodyW * 0.34,
        headY + headR + 10 * scale,
        bodyW * 0.54,
        14 * scale
      );
    }

    // 头部无五官侧影（纯圆头 + 极简帽檐/侧向鼻梁轮廓暗示朝向，绝不画眼嘴）
    ctx.fillStyle = PALETTE.charcoal;
    ctx.beginPath();
    ctx.arc(dir * 1.2 * scale, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    // 侧影帽檐小折角（清楚传达朝向）
    ctx.fillStyle = colorHex === PALETTE.charcoal ? PALETTE.paperLight : colorHex;
    ctx.beginPath();
    ctx.moveTo(dir * (headR * 0.35), headY - headR * 0.55);
    ctx.lineTo(dir * (headR * 1.45), headY - headR * 0.25);
    ctx.lineTo(dir * (headR * 0.78), headY - headR * 0.02);
    ctx.closePath();
    ctx.fill();

    // 编号与方向小签
    const tagY = headY - headR - 14 * scale;
    ctx.font = `700 ${Math.max(10, Math.round(10.5 * scale))}px "Space Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const arrow = dir > 0 ? "→" : "←";
    const tagText = `${badge} ${arrow}`;
    const tw = ctx.measureText(tagText).width + 10;
    ctx.fillStyle = isSelected ? PALETTE.ink : "rgba(246, 242, 233, 0.92)";
    ctx.fillRect(-tw / 2, tagY - 9, tw, 18);
    ctx.strokeStyle = isSelected ? PALETTE.gold : PALETTE.line;
    ctx.lineWidth = 1;
    ctx.strokeRect(-tw / 2, tagY - 9, tw, 18);
    ctx.fillStyle = isSelected ? PALETTE.paperLight : PALETTE.ink;
    ctx.fillText(tagText, 0, tagY + 0.5);

    ctx.restore();
  }

  // 绘制 313 原海报几何同构体块（琥珀金圆 / 暖沙块 / 钢蓝块 / 炭墨块）
  function drawPosterBlock(px, py, scale, dir, meta, colorHex, isSelected, isHovered, isClipped) {
    ctx.save();
    ctx.translate(px, py);
    if (isClipped) ctx.globalAlpha = 0.35;

    const r = 34 * scale;
    const bw = 78 * scale * meta.widthFactor;
    const bh = 48 * scale;

    if (meta.id === "gold") {
      // 原海报标志性琥珀金大圆
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 原海报横向体块
      ctx.fillStyle = colorHex;
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      if (meta.id === "sand") {
        ctx.strokeStyle = "rgba(27, 34, 31, 0.16)";
        ctx.lineWidth = 1;
        ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
      }
    }

    // 块内极简方向箭头，直观展示视流朝向
    const arrowColor = meta.id === "sand" ? PALETTE.ink : PALETTE.paperLight;
    ctx.strokeStyle = arrowColor;
    ctx.fillStyle = arrowColor;
    ctx.lineWidth = 1.8;
    const al = 16 * scale;
    ctx.beginPath();
    ctx.moveTo(-dir * al, 0);
    ctx.lineTo(dir * al, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dir * (al + 5 * scale), 0);
    ctx.lineTo(dir * (al - 3 * scale), -4.5 * scale);
    ctx.lineTo(dir * (al - 3 * scale), 4.5 * scale);
    ctx.closePath();
    ctx.fill();

    // 选中角标
    if (isSelected || isHovered) {
      ctx.strokeStyle = isSelected ? PALETTE.ink : PALETTE.steel;
      ctx.lineWidth = isSelected ? 2 : 1.2;
      const ox = (meta.id === "gold" ? r : bw / 2) + 6;
      const oy = (meta.id === "gold" ? r : bh / 2) + 6;
      ctx.strokeRect(-ox, -oy, ox * 2, oy * 2);
    }

    // 顶部编号签
    const tagY = -(meta.id === "gold" ? r : bh / 2) - 16;
    ctx.font = `700 ${Math.max(10, Math.round(10.5 * scale))}px "Space Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const tagText = `${meta.badge} ${dir > 0 ? "→" : "←"}`;
    const tw = ctx.measureText(tagText).width + 10;
    ctx.fillStyle = isSelected ? PALETTE.ink : "rgba(246, 242, 233, 0.94)";
    ctx.fillRect(-tw / 2, tagY - 9, tw, 18);
    ctx.strokeStyle = isSelected ? PALETTE.gold : PALETTE.line;
    ctx.lineWidth = 1;
    ctx.strokeRect(-tw / 2, tagY - 9, tw, 18);
    ctx.fillStyle = isSelected ? PALETTE.paperLight : PALETTE.ink;
    ctx.fillText(tagText, 0, tagY + 0.5);

    ctx.restore();
  }

  function render(t, dt, { still }) {
    resize();
    if (!w || !h) return;

    // 缓动推进
    if (still) {
      intro = 1;
      smoothPan = state.pan;
      smoothCurtain = ASPECTS[state.aspect].visibleMin;
    } else {
      intro = Math.min(1, intro + dt * 1.45);
      const ease = 1 - Math.exp(-dt * 14);
      smoothPan += (state.pan - smoothPan) * (dt ? ease : 1);
      const targetCurtain = ASPECTS[state.aspect].visibleMin;
      smoothCurtain += (targetCurtain - smoothCurtain) * (dt ? ease : 1);
      flowPhase = (flowPhase + dt * 0.42) % 1;
    }

    const introEase = 1 - Math.pow(1 - intro, 3);
    const ev = evaluate(state);
    const metrics = stageMetrics();
    const scale = clamp(Math.min(w / 920, h / 340), 0.62, 1.24);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 暖米纸天空底（完全采自 313 原海报）
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    // 2. 远景层（随 pan 轻微 0.35× 视差移动）：保留原海报顶部细水平线、左上 6×5 点阵与右上五线谱亚麻板
    const farShift = -smoothPan * w * 0.085;
    const bandTop = Math.round(h * 0.38);
    const horizonLineY = Math.round(h * HORIZON_Y);
    const lowerBandTop = Math.round(h * 0.56);
    const lowerBandBot = Math.round(h * 0.88);

    // 顶部精细水平基准线（带开场从左向右绘制动画）
    ctx.strokeStyle = "rgba(27, 34, 31, 0.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, Math.round(h * 0.07));
    ctx.lineTo(16 + (w * 0.68) * introEase, Math.round(h * 0.07));
    ctx.stroke();

    // 左上 6×5 极细圆点阵（原海报经典母题，带远景视差）
    ctx.fillStyle = "rgba(27, 34, 31, 0.46)";
    const dotStepX = Math.max(10, Math.round(14 * scale));
    const dotStepY = Math.max(9, Math.round(13 * scale));
    const dotOriginX = 24 + farShift * 0.6;
    const dotOriginY = Math.round(h * 0.13);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        ctx.beginPath();
        ctx.arc(dotOriginX + c * dotStepX, dotOriginY + r * dotStepY, 1.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 右上暖亚麻五线谱横向面板（原海报经典母题，向右延展至画外以支持推轨露景）
    const staffX = Math.round(w * 0.66 + farShift);
    const staffW = Math.round(w * 0.48);
    const staffY = Math.round(h * 0.07);
    const staffH = bandTop - staffY;
    ctx.fillStyle = PALETTE.linenPanel;
    ctx.fillRect(staffX, staffY, staffW, staffH);
    ctx.strokeStyle = "rgba(27, 34, 31, 0.42)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const ly = staffY + (staffH / 6) * i;
      ctx.beginPath();
      ctx.moveTo(staffX + 18, ly);
      ctx.lineTo(staffX + staffW, ly);
      ctx.stroke();
    }

    // 3. 中景建筑色带走廊（随 pan 0.72× 视差移动，复现原海报暖沙→钢蓝→炭墨横向色阶）
    const midShift = -smoothPan * w * 0.16;
    const stripH = lowerBandTop - bandTop;
    const segStart = -w * 0.25 + midShift;
    const totalWallW = w * 1.5;

    // 暖沙段
    ctx.fillStyle = state.skin === "cinema" ? PALETTE.sand : "rgba(219, 210, 193, 0.55)";
    ctx.fillRect(segStart, bandTop, totalWallW * 0.42, stripH);
    // 中钢蓝段
    ctx.fillStyle = state.skin === "cinema" ? PALETTE.steelMid : "rgba(64, 90, 113, 0.28)";
    ctx.fillRect(segStart + totalWallW * 0.42, bandTop, totalWallW * 0.34, stripH);
    // 深炭墨段
    ctx.fillStyle = state.skin === "cinema" ? PALETTE.charcoal : "rgba(31, 38, 38, 0.22)";
    ctx.fillRect(segStart + totalWallW * 0.76, bandTop, totalWallW * 0.30, stripH);

    // 电影模式下加极细建筑立柱垂线，让推轨横移的视差流动极清晰可感！
    if (state.skin === "cinema") {
      ctx.strokeStyle = "rgba(238, 231, 220, 0.16)";
      ctx.lineWidth = 1;
      const colStep = Math.max(54, Math.round(w * 0.082));
      const firstCol = Math.floor((midShift % colStep) - colStep);
      for (let x = firstCol; x < w + colStep; x += colStep) {
        ctx.beginPath();
        ctx.moveTo(x, bandTop);
        ctx.lineTo(x, lowerBandTop);
        ctx.stroke();
      }
    }

    // 4. 贯通左右的标志性宽幅钢蓝地平带（#4C6A84）
    ctx.fillStyle = PALETTE.steel;
    ctx.fillRect(0, lowerBandTop, w * introEase, lowerBandBot - lowerBandTop);

    // 钢蓝地平带内极细水平推进线 + 右下角原海报同款三枚向右金三角 ▶ ▶ ▶
    const arrowY = lowerBandBot - Math.round((lowerBandBot - lowerBandTop) * 0.26);
    const triX = w - 26;
    ctx.strokeStyle = "rgba(246, 242, 233, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(w * 0.56, arrowY);
    ctx.lineTo(triX - 44, arrowY);
    ctx.stroke();

    const triDir = ev.checks.flow.dir === "rtl" ? -1 : 1;
    ctx.fillStyle = PALETTE.gold;
    for (let i = 0; i < 3; i++) {
      const tx = triX - (2 - i) * 12;
      ctx.beginPath();
      if (triDir > 0) {
        ctx.moveTo(tx - 4, arrowY - 4.5);
        ctx.lineTo(tx + 4, arrowY);
        ctx.lineTo(tx - 4, arrowY + 4.5);
      } else {
        ctx.moveTo(tx + 4, arrowY - 4.5);
        ctx.lineTo(tx - 4, arrowY);
        ctx.lineTo(tx + 4, arrowY + 4.5);
      }
      ctx.closePath();
      ctx.fill();
    }

    // 5. 共享水平基准带（HORIZON_Y = 0.50）与实时辅助量尺
    const bandTolPx = h * 0.06;
    ctx.fillStyle = ev.checks.stability.ok ? "rgba(205, 150, 57, 0.10)" : "rgba(179, 58, 43, 0.07)";
    ctx.fillRect(0, horizonLineY - bandTolPx, w, bandTolPx * 2);

    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = ev.checks.stability.ok ? PALETTE.gold : "rgba(27, 34, 31, 0.42)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(12, horizonLineY);
    ctx.lineTo(w - 12, horizonLineY);
    ctx.stroke();
    ctx.restore();

    // 标注地平轴字样（字号 ≥ 10px）
    ctx.font = `600 10px "Space Mono", monospace`;
    ctx.fillStyle = "rgba(27, 34, 31, 0.65)";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("HORIZON AXIS", 14, horizonLineY - bandTolPx - 4);

    // 6. 视线流动轨迹线（按从左到右排序连线，显示顺流光点或对撞断裂）
    const sortedPx = ev.sorted.map((item) => ({
      item,
      ...nodeToPx(item, metrics),
    }));

    let clashLabelDrawn = false;
    // 全成立时的流畅视流金线；未成立时显示虚线路径与紧凑对撞标记
    for (let i = 0; i < sortedPx.length - 1; i++) {
      const a = sortedPx[i];
      const b = sortedPx[i + 1];
      const hasClash = ev.checks.flow.clashes.some(
        (c) => (c.a.index === a.item.index && c.b.index === b.item.index)
      );

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(a.px, a.py - 18 * scale);
      const midX = (a.px + b.px) / 2;
      const archY = Math.max(24, Math.min(a.py, b.py) - 38 * scale);
      ctx.quadraticCurveTo(midX, archY, b.px, b.py - 18 * scale);

      if (hasClash) {
        ctx.strokeStyle = PALETTE.alert;
        ctx.lineWidth = 1.9;
        ctx.setLineDash([4, 4]);
      } else if (ev.checks.flow.ok) {
        ctx.strokeStyle = PALETTE.gold;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([8, 5]);
        ctx.lineDashOffset = (ev.checks.flow.dir === "rtl" ? 1 : -1) * flowPhase * 26;
      } else {
        ctx.strokeStyle = "rgba(27, 34, 31, 0.25)";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 5]);
      }
      ctx.stroke();
      ctx.restore();

      // 冲突点用极简红点标出，仅在顶部安全空带显示 1 枚清晰提示签，绝不压住人物头顶与编号牌
      if (hasClash) {
        const apexY = 0.25 * (a.py - 18 * scale) + 0.5 * archY + 0.25 * (b.py - 18 * scale);
        ctx.save();
        ctx.fillStyle = PALETTE.alert;
        ctx.beginPath();
        ctx.arc(midX, apexY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = PALETTE.paperLight;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();

        if (!clashLabelDrawn && w >= 340) {
          clashLabelDrawn = true;
          const badgeText = ev.checks.flow.clashes.length > 1
            ? `视流断撞 ×${ev.checks.flow.clashes.length}`
            : (a.item.dir < 0 && b.item.dir > 0 ? "背向断流" : "视流对撞");
          ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
          const bw = ctx.measureText(badgeText).width + 14;
          const labelX = clamp(midX, bw / 2 + 14, w - bw / 2 - 14);
          const labelY = Math.max(16, Math.round(h * 0.085));
          ctx.fillStyle = PALETTE.alert;
          ctx.fillRect(labelX - bw / 2, labelY - 9, bw, 19);
          ctx.fillStyle = "#FAF7F0";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(badgeText, labelX, labelY + 0.5);
        }
      }
    }

    // 7. 若有节点脱轴（偏离 HORIZON_Y > 0.06），画出垂直铁锈红脱轴拉线
    for (const sp of sortedPx) {
      const dy = Math.abs(sp.item.y - HORIZON_Y);
      if (dy > 0.06) {
        ctx.save();
        ctx.strokeStyle = PALETTE.alert;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(sp.px, horizonLineY);
        ctx.lineTo(sp.px, sp.py);
        ctx.stroke();
        ctx.fillStyle = PALETTE.alert;
        ctx.beginPath();
        ctx.arc(sp.px, horizonLineY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 8. 绘制 4 个主体节点（按排序渲染，选中节点置顶）
    const drawOrder = [...ev.sorted].sort((a, b) => (a.index === state.selected ? 1 : b.index === state.selected ? -1 : 0));
    for (const item of drawOrder) {
      const { px, py } = nodeToPx(item, metrics);
      const isSelected = item.index === state.selected;
      const isHovered = item.index === hoverNode;
      const isClipped = ev.clippedIds.includes(item.meta.badge);
      const colorHex = PALETTE[item.meta.colorKey] || PALETTE.gold;

      if (state.skin === "cinema") {
        drawSilhouette(px, py, scale, item.dir, colorHex, isSelected, isHovered, item.meta.badge, isClipped);
      } else {
        drawPosterBlock(px, py, scale, item.dir, item.meta, colorHex, isSelected, isHovered, isClipped);
      }
    }

    // 9. 钢蓝地平带上的「三段间距节奏尺」与「重心支点」
    const rulerY = lowerBandTop + Math.round((lowerBandBot - lowerBandTop) * 0.40);
    for (let i = 0; i < 3; i++) {
      const x1 = sortedPx[i].px;
      const x2 = sortedPx[i + 1].px;
      const gap = ev.gaps[i];
      const midX = (x1 + x2) / 2;
      const isBadGap =
        (ev.checks.rhythm.code === "crowded" && gap === ev.minGap) ||
        (ev.checks.rhythm.code === "broken-chain" && gap === ev.maxGap) ||
        ev.checks.rhythm.code === "clothesline";

      ctx.strokeStyle = isBadGap ? PALETTE.goldDarkBg : "rgba(246, 242, 233, 0.55)";
      ctx.lineWidth = isBadGap ? 1.8 : 1.1;
      ctx.beginPath();
      ctx.moveTo(x1 + 4, rulerY);
      ctx.lineTo(x2 - 4, rulerY);
      ctx.moveTo(x1 + 4, rulerY - 4);
      ctx.lineTo(x1 + 4, rulerY + 4);
      ctx.moveTo(x2 - 4, rulerY - 4);
      ctx.lineTo(x2 - 4, rulerY + 4);
      ctx.stroke();

      if (x2 - x1 > 28) {
        const label = ev.checks.rhythm.code === "clothesline" ? `=${Math.round(gap * 100)}%` : `${Math.round(gap * 100)}%`;
        ctx.font = `700 10px "Space Mono", monospace`;
        ctx.fillStyle = isBadGap ? PALETTE.goldDarkBg : PALETTE.paperLight;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(label, midX, rulerY - 5);
      }
    }

    // 底沿视觉重心标尺（避开左右文字区，绝不穿过文字）
    const balanceY = lowerBandBot + Math.round((h - lowerBandBot) * 0.54);
    const barLeft = Math.max(145, Math.round(w * 0.24));
    const barRight = Math.min(w - 92, Math.round(w * 0.76));
    if (barRight - barLeft > 40) {
      const barW = barRight - barLeft;
      const idealMidX = barLeft + 0.5 * barW;
      const cogX = barLeft + clamp(ev.centerX, 0.04, 0.96) * barW;
      ctx.strokeStyle = PALETTE.line;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(barLeft, balanceY);
      ctx.lineTo(barRight, balanceY);
      ctx.stroke();

      // 理想中点刻度
      ctx.strokeStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.moveTo(idealMidX, balanceY - 5);
      ctx.lineTo(idealMidX, balanceY + 5);
      ctx.stroke();

      // 实测重心三角
      ctx.fillStyle = Math.abs(ev.balanceOffset) > 0.115 ? PALETTE.alert : PALETTE.gold;
      ctx.beginPath();
      ctx.moveTo(cogX, balanceY - 6);
      ctx.lineTo(cogX - 5.5, balanceY + 4);
      ctx.lineTo(cogX + 5.5, balanceY + 4);
      ctx.closePath();
      ctx.fill();
    }

    // 左下推轨位置读数与右下达标章
    ctx.font = `700 10px "Space Mono", monospace`;
    ctx.fillStyle = PALETTE.steelDeep;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const panPct = Math.round(smoothPan * 100);
    const panSign = panPct > 0 ? `+${panPct}` : `${panPct}`;
    ctx.fillText(`DOLLY ${panSign}% · ${ev.aspect.short}`, 14, balanceY);

    ctx.textAlign = "right";
    ctx.fillStyle = ev.score === 4 ? PALETTE.ok : PALETTE.alert;
    ctx.fillText(ev.score === 4 ? "4/4 成立" : `${ev.score}/4 待调`, w - 14, balanceY);

    // 10. 窄幅画框遮幅黑帘（当切 16:9 或 4:3 时从两侧平滑合拢）
    if (smoothCurtain > 0.004) {
      const curtainW = metrics.padX + smoothCurtain * metrics.innerW;
      ctx.fillStyle = "rgba(24, 35, 46, 0.84)";
      ctx.fillRect(0, 0, curtainW, h);
      ctx.fillRect(w - curtainW, 0, curtainW, h);
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(curtainW, 0); ctx.lineTo(curtainW, h);
      ctx.moveTo(w - curtainW, 0); ctx.lineTo(w - curtainW, h);
      ctx.stroke();

      ctx.font = `700 10px "Space Mono", monospace`;
      ctx.fillStyle = PALETTE.paperLight;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (curtainW > 46) {
        ctx.fillText(ev.aspect.short, curtainW / 2, h * 0.22);
        ctx.fillText("裁切区", curtainW / 2, h * 0.29);
      }
    }

    ctx.restore();
  }

  const ctrl = loop(canvas, render);

  // 指针命中检测（点击翻转朝向，拖动调整位置与高度）
  function hitTest(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const metrics = stageMetrics();
    const hitR = state.skin === "cinema" ? 36 : 42;
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < state.nodes.length; i++) {
      const p = nodeToPx(state.nodes[i], metrics);
      const d = Math.hypot(px - p.px, py - p.py);
      if (d < hitR && d < bestD) {
        best = i;
        bestD = d;
      }
    }
    return { idx: best, px, py };
  }

  canvas.addEventListener("pointerdown", (e) => {
    const { idx, px, py } = hitTest(e.clientX, e.clientY);
    if (idx < 0) return;
    draggingNode = idx;
    dragStartPx = { px, py };
    dragMoved = false;
    state.selected = idx;
    canvas.setPointerCapture(e.pointerId);
    onChange();
    ctrl.draw();
  });

  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    if (draggingNode >= 0) {
      if (dragStartPx && Math.hypot(px - dragStartPx.px, py - dragStartPx.py) > 5) {
        dragMoved = true;
      }
      if (dragMoved) {
        const m = pxToModel(px, py);
        moveNode(state, draggingNode, m.x, m.y, true);
        onChange();
        ctrl.draw();
      }
    } else {
      const { idx } = hitTest(e.clientX, e.clientY);
      if (idx !== hoverNode) {
        hoverNode = idx;
        canvas.style.cursor = idx >= 0 ? "grab" : "default";
        ctrl.draw();
      }
    }
  });

  const endDrag = (e) => {
    if (draggingNode < 0) return;
    if (!dragMoved) {
      // 单击节点即翻转朝向（← / →），极其直觉！
      flipNodeDir(state, draggingNode);
      onChange();
      ctrl.draw();
    }
    draggingNode = -1;
    dragStartPx = null;
    dragMoved = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
  };

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => {
    if (hoverNode !== -1) {
      hoverNode = -1;
      ctrl.draw();
    }
  });

  // 键盘可访问操控：焦点落在画布时 ←/→/↑/↓ 移动选中主体，Tab/1-4 切主体，Space/Enter 翻转朝向
  canvas.addEventListener("keydown", (e) => {
    const n = state.nodes[state.selected];
    if (!n) return;
    const step = e.shiftKey ? 0.04 : 0.02;
    if (e.key === "ArrowLeft") { e.preventDefault(); moveNode(state, state.selected, n.x - step, n.y, false); onChange(); ctrl.draw(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); moveNode(state, state.selected, n.x + step, n.y, false); onChange(); ctrl.draw(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveNode(state, state.selected, n.x, n.y - step, true); onChange(); ctrl.draw(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); moveNode(state, state.selected, n.x, n.y + step, true); onChange(); ctrl.draw(); }
    else if (e.key === " " || e.key === "Enter" || e.key === "f" || e.key === "F") {
      e.preventDefault();
      flipNodeDir(state, state.selected);
      onChange();
      ctrl.draw();
    } else if (e.key >= "1" && e.key <= "4") {
      state.selected = Number(e.key) - 1;
      onChange();
      ctrl.draw();
    }
  });

  window.addEventListener("resize", () => ctrl.draw());

  return {
    draw: () => ctrl.draw(),
  };
}

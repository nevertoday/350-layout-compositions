// 121 共同命运原则 · 开场 100% 通栏 2D 活体矢量流场画布
// 1:1 承袭 121 原海报暖象牙纸、朱橘弧线轨迹、三连渐隐残影与 12 颗静点，并支持直拖齐向、点圆点入队/脱队与点红警签纠错。
import { pixelRatio } from "../../lib/stage.js";
import { applyQuickFix, clamp, diagnose, sampleArcPoint } from "./model.js";

const PALETTE = {
  paper: "#FAF6F1",
  paperGrid: "#EBE3D7",
  ink: "#0E1110",
  mutedInk: "#4D504B",
  orange: "#E55207",
  orangeDeep: "#B53A00",
  ghost1: "#F8C6D4",
  ghost2: "#FB9E97",
  green: "#0E553B",
  pink: "#F598C0",
  sand: "#D7CCBB",
  navy: "#07045E",
  alert: "#B41C24",
  alertBg: "#FFF4F4",
  okBg: "#ECF7F1",
};

const ROLE_COLOR = {
  orange: PALETTE.orange,
  green: PALETTE.green,
  pink: PALETTE.pink,
  sand: PALETTE.sand,
};

function drawArrowHead(ctx, x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(size * 0.9, 0);
  ctx.lineTo(-size * 0.55, -size * 0.58);
  ctx.lineTo(-size * 0.25, 0);
  ctx.lineTo(-size * 0.55, size * 0.58);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function createHeroCanvas(canvas, { getState, setState, onFrameDiagnose }) {
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;
  let lastParticles = [];
  let fixHitBoxes = [];
  let hoverId = -1;
  let hoverFix = -1;
  let dragFeedback = 0;
  let simTime = 0.72; // 初始即呈现清晰弧线中段位置，确保 0.9s 截图与静态降级皆极佳
  const bgCache = document.createElement("canvas");
  let bgKey = "";

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = pixelRatio(rect.width < 640 ? 1.5 : 2);
    const nw = Math.round(rect.width * dpr);
    const nh = Math.round(rect.height * dpr);
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
    }
    w = rect.width;
    h = rect.height;

    const nextKey = `${nw}x${nh}`;
    if (bgKey !== nextKey) {
      bgKey = nextKey;
      bgCache.width = nw;
      bgCache.height = nh;
      const bctx = bgCache.getContext("2d");
      bctx.save();
      bctx.scale(dpr, dpr);
      bctx.fillStyle = PALETTE.paper;
      bctx.fillRect(0, 0, w, h);
      bctx.strokeStyle = PALETTE.paperGrid;
      bctx.lineWidth = 1;
      const step = w < 520 ? 48 : 64;
      bctx.beginPath();
      for (let x = step; x < w; x += step) {
        bctx.moveTo(x + 0.5, 0);
        bctx.lineTo(x + 0.5, h);
      }
      for (let y = step; y < h; y += step) {
        bctx.moveTo(0, y + 0.5);
        bctx.lineTo(w, y + 0.5);
      }
      bctx.stroke();
      bctx.restore();
    }
  }

  function mapPoint(u, v, padX, padY, fieldW, fieldH) {
    return {
      x: padX + u * fieldW,
      y: padY + v * fieldH,
    };
  }

  function render(t, dt, { still } = { still: false }) {
    resize();
    if (!w || !h) return;

    const state = getState();
    if (!still && !state.paused && dt > 0) {
      simTime += dt;
    }
    if (dragFeedback > 0 && dt > 0) {
      dragFeedback = Math.max(0, dragFeedback - dt * 2.4);
    }

    const diag = diagnose(state, simTime);
    lastParticles = diag.particles;
    fixHitBoxes = [];

    const isCompact = w < 520;
    const showRightNotes = state.showGuides && w >= 960;
    const padX = isCompact ? 16 : 30;
    const padY = isCompact ? 16 : 22;
    const fieldW = showRightNotes ? w * 0.65 : w - padX * 2;
    const fieldH = h - padY * 2;
    const unitR = Math.min(fieldW, fieldH);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // 1. 离屏缓存的暖象牙原纸 + 网格一次铺底
    ctx.drawImage(bgCache, 0, 0);
    ctx.scale(dpr, dpr);

    // 看板模式：在右侧绘制温和的「明日清单目标槽」
    if (state.scene === "kanban") {
      const targetX = padX + fieldW * 0.72;
      const targetW = fieldW * 0.25;
      const targetY = padY + fieldH * 0.08;
      const targetH = fieldH * 0.84;
      ctx.save();
      ctx.fillStyle = "rgba(14, 85, 59, 0.06)";
      ctx.strokeStyle = diag.isValid ? PALETTE.green : "#BDB4A5";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      drawRoundedRect(ctx, targetX, targetY, targetW, targetH, 8);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = diag.isValid ? PALETTE.green : PALETTE.mutedInk;
      ctx.font = `600 ${isCompact ? 11 : 12}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("目标列 · 明日清单", targetX + targetW / 2, targetY + 20);
      ctx.restore();
    }

    // 2. 先绘制背景静点 / 躁动点的锚位与抖动矢
    const bgItems = diag.particles.filter((p) => !p.inFlock);
    const flockItems = diag.particles.filter((p) => p.inFlock);

    for (const p of bgItems) {
      const pos = mapPoint(p.u, p.v, padX, padY, fieldW, fieldH);
      const rad = clamp(p.r * unitR, isCompact ? 11 : 15, isCompact ? 19 : 27);
      p._px = pos.x;
      p._py = pos.y;
      p._pr = rad;

      if (state.scene === "kanban") {
        const cw = clamp(fieldW * 0.175, 76, 136);
        const ch = clamp(fieldH * 0.145, 36, 52);
        p._cw = cw;
        p._ch = ch;
        const cx = pos.x - cw / 2;
        const cy = pos.y - ch / 2;
        ctx.save();
        ctx.fillStyle = "#FFFDF9";
        ctx.strokeStyle = p.isNoisy ? PALETTE.alert : "#CFC6B8";
        ctx.lineWidth = p.isNoisy ? 1.5 : 1.2;
        if (p.isNoisy) ctx.setLineDash([4, 3]);
        drawRoundedRect(ctx, cx, cy, cw, ch, 6);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        // 左侧空白复选框
        ctx.strokeStyle = "#9A9387";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(cx + 9, cy + ch / 2 - 5, 10, 10);
        ctx.fillStyle = PALETTE.mutedInk;
        ctx.font = `500 ${isCompact ? 10 : 11}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(isCompact ? p.tag : p.card, cx + 25, cy + ch / 2 + 0.5);
        ctx.restore();
      } else {
        // 如果背景躁动，绘出干扰虚箭与锚圈
        if (p.isNoisy) {
          const anchor = mapPoint(p.anchorU, p.anchorV, padX, padY, fieldW, fieldH);
          ctx.save();
          ctx.strokeStyle = "rgba(180, 28, 36, 0.5)";
          ctx.lineWidth = 1.4;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(anchor.x, anchor.y, rad * 1.15, 0, Math.PI * 2);
          ctx.stroke();
          const ax = pos.x + Math.cos(p.tangentRad) * (rad + 14);
          const ay = pos.y + Math.sin(p.tangentRad) * (rad + 14);
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(ax, ay);
          ctx.stroke();
          ctx.setLineDash([]);
          drawArrowHead(ctx, ax, ay, p.tangentRad, 6, PALETTE.alert);
          ctx.restore();
        }

        // 圆点本体（纯墨盲测全用墨黑；原海报模式用松绿 / 樱粉 / 暖砂）
        ctx.save();
        ctx.fillStyle = state.scene === "camouflage" ? "#1A1E24" : ROLE_COLOR[p.role];
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, rad, 0, Math.PI * 2);
        ctx.fill();
        if (hoverId === p.id) {
          ctx.strokeStyle = PALETTE.navy;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, rad + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // 3. 绘制编队成员：先绘弧形虚线轨道与终点箭头，再绘三连渐隐残影，最后绘主体
    const trackColor = state.scene === "camouflage"
      ? (diag.isValid ? "#1A1E24" : "#6D232A")
      : (diag.dims.direction.status === "ok" ? PALETTE.orange : "#C83A18");

    for (const p of flockItems) {
      const pos = mapPoint(p.u, p.v, padX, padY, fieldW, fieldH);
      const rad = clamp(p.r * unitR, isCompact ? 12 : 16, isCompact ? 20 : 28);
      p._px = pos.x;
      p._py = pos.y;
      p._pr = rad;

      // 3a. 弧形虚线轨迹（原海报招牌母题！）
      if (state.showGuides || state.scene === "poster") {
        const p0 = mapPoint(p.arc.p0x, p.arc.p0y, padX, padY, fieldW, fieldH);
        const p1 = mapPoint(p.arc.p1x, p.arc.p1y, padX, padY, fieldW, fieldH);
        const p2 = mapPoint(p.arc.p2x, p.arc.p2y, padX, padY, fieldW, fieldH);

        ctx.save();
        ctx.strokeStyle = state.scene === "camouflage" ? "rgba(26, 30, 36, 0.36)" : trackColor;
        ctx.lineWidth = isCompact ? 2.2 : 3.2;
        ctx.lineCap = "round";
        ctx.setLineDash(isCompact ? [7, 6] : [11, 8]);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // 在轨迹前沿画出指向箭（长短随当前粒子速度变化，体现速度差）
        const tipDist = clamp((p.speed / 130) * (isCompact ? 26 : 40), 16, isCompact ? 34 : 52);
        const tipX = pos.x + Math.cos(p.tangentRad) * (rad + tipDist);
        const tipY = pos.y + Math.sin(p.tangentRad) * (rad + tipDist);
        ctx.strokeStyle = trackColor;
        ctx.lineWidth = isCompact ? 2.6 : 3.6;
        ctx.beginPath();
        ctx.moveTo(pos.x + Math.cos(p.tangentRad) * (rad + 4), pos.y + Math.sin(p.tangentRad) * (rad + 4));
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        drawArrowHead(ctx, tipX, tipY, p.tangentRad, isCompact ? 8 : 11, trackColor);
        ctx.restore();
      }

      // 3b. 三连渐隐残影（1:1 复刻原海报左下角 MOTION 图形，同时让 reduced-motion 静态也读得出速度！）
      if (state.scene !== "kanban" && p.ghosts.length) {
        const ghostColors = state.scene === "camouflage"
          ? ["rgba(26, 30, 36, 0.14)", "rgba(26, 30, 36, 0.32)"]
          : [PALETTE.ghost1, PALETTE.ghost2];
        p.ghosts.forEach((g, gi) => {
          const gp = mapPoint(g.u, g.v, padX, padY, fieldW, fieldH);
          ctx.save();
          ctx.fillStyle = ghostColors[gi];
          ctx.beginPath();
          ctx.arc(gp.x, gp.y, rad * (0.9 + gi * 0.05), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // 3c. 主体绘制
      if (state.scene === "kanban") {
        const cw = clamp(fieldW * 0.18, 82, 144);
        const ch = clamp(fieldH * 0.15, 38, 54);
        p._cw = cw;
        p._ch = ch;
        const cx = pos.x - cw / 2;
        const cy = pos.y - ch / 2;

        // 卡片轻残影
        if (p.ghosts.length) {
          const gp = mapPoint(p.ghosts[1].u, p.ghosts[1].v, padX, padY, fieldW, fieldH);
          ctx.save();
          ctx.fillStyle = "rgba(229, 82, 7, 0.14)";
          drawRoundedRect(ctx, gp.x - cw / 2, gp.y - ch / 2, cw, ch, 6);
          ctx.fill();
          ctx.restore();
        }

        ctx.save();
        ctx.fillStyle = PALETTE.orange;
        ctx.strokeStyle = PALETTE.navy;
        ctx.lineWidth = hoverId === p.id ? 2.4 : 1.6;
        drawRoundedRect(ctx, cx, cy, cw, ch, 6);
        ctx.fill();
        ctx.stroke();

        // 选中白色对勾框
        ctx.fillStyle = "#FFFDF9";
        drawRoundedRect(ctx, cx + 9, cy + ch / 2 - 6, 12, 12, 2);
        ctx.fill();
        ctx.strokeStyle = PALETTE.green;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 11.5, cy + ch / 2);
        ctx.lineTo(cx + 14.2, cy + ch / 2 + 2.8);
        ctx.lineTo(cx + 18.8, cy + ch / 2 - 3);
        ctx.stroke();

        ctx.fillStyle = "#FFFDF9";
        ctx.font = `700 ${isCompact ? 10 : 11.5}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(isCompact ? p.tag : p.card, cx + 27, cy + ch / 2 + 0.5);
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = state.scene === "camouflage" ? "#1A1E24" : PALETTE.orange;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, rad, 0, Math.PI * 2);
        ctx.fill();

        // 若纯墨盲测时 hover，或错态高亮边界
        if (hoverId === p.id) {
          ctx.strokeStyle = PALETTE.navy;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, rad + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // 4. 宽屏右侧复刻 121 原海报三条虚线折箭实时注释（动态联动状态，不写死！）
    if (showRightNotes) {
      const noteX = w * 0.705;
      const noteW = w - noteX - 24;
      const notes = [
        {
          y: h * 0.16,
          ok: diag.dims.direction.status === "ok",
          title: diag.dims.direction.status === "ok"
            ? "共同的运动方向使这些元素被知觉为一组。"
            : `方向散开 ${diag.maxAngleSpan}°，轨迹劈叉无法成组。`,
          en: "A SHARED DIRECTION OF MOTION MAKES THESE ELEMENTS PERCEIVED AS A GROUP.",
          target: flockItems[0] || diag.particles[0],
        },
        {
          y: h * 0.46,
          ok: diag.dims.sync.status === "ok" && diag.dims.motion.status === "ok",
          title: diag.dims.sync.status === "ok" && diag.dims.motion.status === "ok"
            ? "一致的运动轨迹与步调强化了整体感。"
            : `快慢差 ${diag.actualSpeedRatio.toFixed(1)}× / 错拍 ${Math.round(state.phaseLag)}%，编队撕裂。`,
          en: "CONSISTENT MOTION TRAJECTORIES STRENGTHEN THE SENSE OF UNITY.",
          target: flockItems[1] || flockItems[0] || diag.particles[1],
        },
        {
          y: h * 0.74,
          ok: diag.dims.unity.status === "ok",
          title: diag.dims.unity.status === "ok"
            ? `其余 ${diag.bgCount} 枚静止元素退居背景。`
            : diag.noisyBgCount > 0
              ? `有 ${diag.noisyBgCount} 枚背景点在乱晃，干扰动静分离。`
              : `运动占比 ${diag.flockShare}%，缺少静止背景参照。`,
          en: "THE OTHER, STATIONARY ELEMENTS ARE PERCEIVED AS THE BACKGROUND.",
          target: bgItems[bgItems.length - 1] || diag.particles[14],
        },
      ];

      for (const note of notes) {
        const dotColor = note.ok ? PALETTE.green : PALETTE.alert;
        // 细虚线折箭连向对应元素
        if (note.target && note.target._px) {
          const tx = note.target._px + (note.target._pr || 18) + 8;
          const ty = note.target._py;
          const startX = noteX - 10;
          const startY = note.y + 8;
          ctx.save();
          ctx.strokeStyle = note.ok ? PALETTE.ink : PALETTE.alert;
          ctx.lineWidth = 1.25;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          const midX = Math.max(tx + 12, startX - 28);
          ctx.lineTo(midX, startY);
          ctx.lineTo(tx + 4, ty);
          ctx.stroke();
          ctx.setLineDash([]);
          drawArrowHead(ctx, tx + 4, ty, Math.atan2(ty - startY, tx + 4 - midX), 6.5, note.ok ? PALETTE.ink : PALETTE.alert);
          ctx.restore();
        }

        // 中文主注（完整折行不截字）
        ctx.save();
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(noteX, note.y + 7, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = note.ok ? PALETTE.ink : PALETTE.alert;
        ctx.font = `700 13.5px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const lines = wrapTextZh(ctx, note.title, noteW - 14, 3);
        lines.forEach((ln, li) => ctx.fillText(ln, noteX + 11, note.y + li * 19));

        ctx.fillStyle = PALETTE.mutedInk;
        ctx.font = `600 10px "IBM Plex Mono", monospace`;
        const enLines = wrapTextEn(ctx, note.en, noteW - 14, 3);
        enLines.forEach((ln, li) => ctx.fillText(ln, noteX + 11, note.y + lines.length * 19 + 4 + li * 13));
        ctx.restore();
      }
    }

    // 5. 画布顶沿实时徽标（左上：手势与状态胶囊；右上：单真源矢量合度徽标）
    ctx.save();
    // 5a. 右上矢量合度黑/绿徽标
    const rightText = diag.isValid
      ? `✓ 4/4 ${diag.unityTier} · 散度 ${diag.maxAngleSpan}°`
      : `散度 ${diag.maxAngleSpan}° · 速度比 ${diag.actualSpeedRatio.toFixed(1)}×`;
    ctx.font = `600 ${isCompact ? 10.5 : 11.5}px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
    const rtw = ctx.measureText(rightText).width + 20;
    const rtx = w - rtw - 14;
    const rty = 12;
    ctx.fillStyle = diag.isValid ? PALETTE.green : PALETTE.navy;
    drawRoundedRect(ctx, rtx, rty, rtw, 26, 13);
    ctx.fill();
    ctx.fillStyle = "#FFFDF9";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(rightText, rtx + rtw / 2, rty + 13.5);

    // 5b. 左上可点击红警纠错签（存在错态时最多显示 1-2 枚，不挤占画布）
    const maxPills = isCompact ? 1 : 2;
    let pxCursor = 14;
    const pyCursor = 12;
    diag.issues.slice(0, maxPills).forEach((iss, idx) => {
      const label = `× ${iss.fixLabel}`;
      ctx.font = `700 ${isCompact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(label).width + 20;
      if (pxCursor + tw > rtx - 10) return;
      ctx.fillStyle = hoverFix === idx ? "#FDE2E3" : PALETTE.alertBg;
      ctx.strokeStyle = PALETTE.alert;
      ctx.lineWidth = 1.4;
      drawRoundedRect(ctx, pxCursor, pyCursor, tw, 26, 13);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PALETTE.alert;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, pxCursor + tw / 2, pyCursor + 13.5);
      fixHitBoxes.push({ x: pxCursor, y: pyCursor, w: tw, h: 26, action: iss.fixAction, idx });
      pxCursor += tw + 8;
    });

    // 5c. 底部轻提示条（极简，不遮挡圆点）
    const tipText = dragFeedback > 0
      ? `正在理顺编队航向 · 散度 ${diag.maxAngleSpan}° · 航向 ${state.headingDeg > 0 ? "+" : ""}${Math.round(state.headingDeg)}°`
      : isCompact
        ? "↔ 横拖理顺方向 · 点圆点切入队/静定 · 点红签纠错"
        : "↔ 在画布上左右横拖连续理顺编队航向 · 直点任意圆点切入队/静定 · 方向键微调 · Space 启停";
    ctx.font = `500 ${isCompact ? 10 : 11.5}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = dragFeedback > 0 ? PALETTE.navy : PALETTE.mutedInk;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(tipText, 14, h - 8);
    ctx.restore();

    ctx.restore();

    if (onFrameDiagnose) onFrameDiagnose(diag);
  }

  function wrapTextZh(ctx, text, maxW, maxLines) {
    const out = [];
    let cur = "";
    for (const ch of text) {
      if (ctx.measureText(cur + ch).width > maxW && cur.length > 0) {
        out.push(cur);
        cur = ch;
        if (out.length >= maxLines) break;
      } else {
        cur += ch;
      }
    }
    if (cur && out.length < maxLines) out.push(cur);
    return out;
  }

  function wrapTextEn(ctx, text, maxW, maxLines) {
    const words = text.split(/\s+/);
    const out = [];
    let cur = "";
    for (const word of words) {
      const next = cur ? `${cur} ${word}` : word;
      if (ctx.measureText(next).width > maxW && cur) {
        out.push(cur);
        cur = word;
        if (out.length >= maxLines) break;
      } else {
        cur = next;
      }
    }
    if (cur && out.length < maxLines) out.push(cur);
    return out;
  }

  function hitTestFix(x, y) {
    return fixHitBoxes.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) || null;
  }

  function hitTestParticle(x, y) {
    const state = getState();
    for (let i = lastParticles.length - 1; i >= 0; i--) {
      const p = lastParticles[i];
      if (state.scene === "kanban" && p._cw) {
        if (Math.abs(x - p._px) <= p._cw / 2 + 4 && Math.abs(y - p._py) <= p._ch / 2 + 4) {
          return p;
        }
      } else if (p._pr) {
        if (Math.hypot(x - p._px, y - p._py) <= p._pr + 8) {
          return p;
        }
      }
    }
    return null;
  }

  // 指针交互（触屏只锁横向手势，竖向滑动让页面自由滚；兼容 mouse / touch / pointer）
  let pointerState = null;

  function localXY(ev) {
    const r = canvas.getBoundingClientRect();
    const pt = ev.touches ? ev.touches[0] : ev;
    return { x: pt.clientX - r.left, y: pt.clientY - r.top };
  }

  canvas.addEventListener("pointerdown", (ev) => {
    if (ev.button > 0) return;
    const { x, y } = localXY(ev);
    const st = getState();
    pointerState = {
      id: ev.pointerId,
      startX: x,
      startY: y,
      startSpread: st.spreadDeg,
      startHeading: st.headingDeg,
      startCurve: st.curve,
      locked: null, // "drag" | "scroll"
      moved: false,
      pointerType: ev.pointerType,
    };
  });

  canvas.addEventListener("pointermove", (ev) => {
    const { x, y } = localXY(ev);
    if (!pointerState) {
      // 悬停指针反馈
      const fx = hitTestFix(x, y);
      const pt = fx ? null : hitTestParticle(x, y);
      const nextFix = fx ? fx.idx : -1;
      const nextId = pt ? pt.id : -1;
      if (nextFix !== hoverFix || nextId !== hoverId) {
        hoverFix = nextFix;
        hoverId = nextId;
        canvas.style.cursor = (fx || pt) ? "pointer" : "ew-resize";
      }
      return;
    }
    if (ev.pointerId !== pointerState.id) return;

    const dx = x - pointerState.startX;
    const dy = y - pointerState.startY;
    const dist = Math.hypot(dx, dy);

    if (!pointerState.locked && dist > 6) {
      if (pointerState.pointerType === "touch" && Math.abs(dy) > Math.abs(dx) * 1.25) {
        // 手机竖滑让浏览器滚屏
        pointerState.locked = "scroll";
        return;
      }
      pointerState.locked = "drag";
      try { canvas.setPointerCapture(ev.pointerId); } catch {}
    }

    if (pointerState.locked === "drag") {
      pointerState.moved = true;
      dragFeedback = 1;
      // 向右拖理顺方向散度，向左拖拉散；若原本已经很整齐，则微调航向角，确保每次横拖都有真实可见变化
      const span = Math.max(160, w * 0.34);
      const deltaSpread = (-dx / span) * 68;
      let nextSpread = clamp(Math.round(pointerState.startSpread + deltaSpread), 0, 125);
      // 靠近 0° 时轻柔吸附
      if (nextSpread <= 4 && dx > 0) nextSpread = 0;

      // 同时联动航向微调与曲率，让拖动体验更富流动感
      const nextHeading = pointerState.startSpread <= 6
        ? clamp(Math.round(pointerState.startHeading + (dx / span) * 28), -52, 52)
        : clamp(Math.round(pointerState.startHeading + (dy / Math.max(140, h * 0.5)) * 28), -52, 52);

      setState((prev) => ({
        ...prev,
        spreadDeg: nextSpread,
        headingDeg: nextHeading,
        activePreset: "custom",
      }));
    }
  });

  function finishPointer(ev) {
    if (!pointerState || ev.pointerId !== pointerState.id) return;
    const ps = pointerState;
    pointerState = null;
    if (!ps.moved && ps.locked !== "scroll") {
      const { x, y } = localXY(ev);
      const fx = hitTestFix(x, y);
      if (fx) {
        setState((prev) => applyQuickFix(prev, fx.action));
        return;
      }
      const pt = hitTestParticle(x, y);
      if (pt) {
        setState((prev) => {
          const nextFlags = prev.memberFlags.slice();
          nextFlags[pt.id] = !nextFlags[pt.id];
          return { ...prev, memberFlags: nextFlags, activePreset: "custom" };
        });
      }
    }
  }

  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", () => { pointerState = null; });
  canvas.addEventListener("pointerleave", () => {
    hoverId = -1;
    hoverFix = -1;
  });

  // 键盘操作支持
  canvas.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowRight") {
      ev.preventDefault();
      setState((prev) => ev.shiftKey
        ? { ...prev, headingDeg: clamp(prev.headingDeg + 4, -52, 52), activePreset: "custom" }
        : { ...prev, spreadDeg: clamp(prev.spreadDeg - 6, 0, 125), activePreset: "custom" });
    } else if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      setState((prev) => ev.shiftKey
        ? { ...prev, headingDeg: clamp(prev.headingDeg - 4, -52, 52), activePreset: "custom" }
        : { ...prev, spreadDeg: clamp(prev.spreadDeg + 6, 0, 125), activePreset: "custom" });
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      setState((prev) => ({ ...prev, curve: clamp(+(prev.curve - 0.06).toFixed(2), -0.45, 0.45), activePreset: "custom" }));
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      setState((prev) => ({ ...prev, curve: clamp(+(prev.curve + 0.06).toFixed(2), -0.45, 0.45), activePreset: "custom" }));
    } else if (ev.key === " ") {
      ev.preventDefault();
      setState((prev) => ({ ...prev, paused: !prev.paused }));
    }
  });

  return { render };
}

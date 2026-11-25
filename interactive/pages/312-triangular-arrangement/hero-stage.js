// 312 三角调度 · 开场双联导演台（宽银幕 3D 透视取景框 ↔ 俯视片场走位图 × 机位环轨）
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  STAGE_BOUNDS,
  POSTURES,
  SCRIPTS,
  VIEW_ASPECT,
  clamp,
  createInitialState,
  evaluateState,
} from "./model.js";

const PAL = {
  paper: "#F4EADC",
  sand: "#EDDFCB",
  sandDeep: "#E1CEB6",
  stageTop: "#F8F1E6",
  stageFloor: "#E8DAC5",
  ink: "#11100E",
  inkSoft: "#4B463F",
  inkLine: "rgba(17, 16, 14, 0.16)",
  vermilion: "#E54B1A",
  vermilionInk: "#B8350C",
  vermilionSoft: "rgba(229, 75, 26, 0.14)",
  warn: "#A62614",
  warnSoft: "rgba(166, 38, 20, 0.15)",
  grid: "rgba(17, 16, 14, 0.10)",
};

export function initHeroStage() {
  const vfCanvas = document.getElementById("vf-canvas");
  const fpCanvas = document.getElementById("fp-canvas");
  const orbitTrack = document.getElementById("orbit-track");
  const orbitThumb = document.getElementById("orbit-thumb");
  const orbitValue = document.getElementById("orbit-value");
  if (!vfCanvas || !fpCanvas) return;

  const vfCtx = vfCanvas.getContext("2d");
  const fpCtx = fpCanvas.getContext("2d");
  const state = createInitialState("upright");
  let evalRes = evaluateState(state);

  // DOM 引用
  const scriptBtns = [...document.querySelectorAll("[data-script]")];
  const lensBtns = [...document.querySelectorAll("[data-lens]")];
  const actorBtns = [...document.querySelectorAll("[data-select-actor]")];
  const postureBtns = [...document.querySelectorAll("[data-posture]")];
  const nudgeBtns = [...document.querySelectorAll("[data-nudge]")];
  const posterGuideBtn = document.getElementById("toggle-poster-guide");
  const resetBtn = document.getElementById("hero-reset");

  const diagBox = document.getElementById("hero-diagnosis");
  const diagBadge = document.getElementById("diag-badge");
  const diagHead = document.getElementById("diag-headline");
  const diagBody = document.getElementById("diag-body");
  const diagHint = document.getElementById("diag-hint");
  const metricBase = document.getElementById("m-base");
  const metricApex = document.getElementById("m-apex");
  const metricLead = document.getElementById("m-lead");
  const selectedLabel = document.getElementById("selected-actor-label");
  const principleEls = Object.fromEntries(
    ["stability", "guide", "hierarchy", "focus"].map((k) => [
      k,
      {
        card: document.getElementById(`p-card-${k}`),
        status: document.getElementById(`p-status-${k}`),
      },
    ])
  );

  // 动画计时与开场渐现
  let introProgress = 0;
  let arrowPhase = 0;
  let dirty = true;

  // 尺寸缓存（防止每帧布局抖动）
  let vfW = 640, vfH = 380, fpW = 360, fpH = 240;

  function resizeCanvases() {
    const dpr = pixelRatio(2);
    const vr = vfCanvas.getBoundingClientRect();
    if (vr.width > 10 && vr.height > 10) {
      vfW = Math.round(vr.width);
      vfH = Math.round(vr.height);
      const nw = Math.round(vfW * dpr);
      const nh = Math.round(vfH * dpr);
      if (vfCanvas.width !== nw || vfCanvas.height !== nh) {
        vfCanvas.width = nw;
        vfCanvas.height = nh;
      }
      vfCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const fr = fpCanvas.getBoundingClientRect();
    if (fr.width > 10 && fr.height > 10) {
      fpW = Math.round(fr.width);
      fpH = Math.round(fr.height);
      const nw = Math.round(fpW * dpr);
      const nh = Math.round(fpH * dpr);
      if (fpCanvas.width !== nw || fpCanvas.height !== nh) {
        fpCanvas.width = nw;
        fpCanvas.height = nh;
      }
      fpCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    dirty = true;
  }

  function syncUI() {
    evalRes = evaluateState(state);
    const { diagnosis, principles, baseSpan, apexDeg, apexLead, passedCount } = evalRes;

    // 轨道滑柄与角度读数
    const pct = ((state.orbitDeg + 55) / 110) * 100;
    if (orbitThumb) orbitThumb.style.left = `${clamp(pct, 2, 98)}%`;
    if (orbitTrack) orbitTrack.setAttribute("aria-valuenow", String(Math.round(state.orbitDeg)));
    if (orbitValue) {
      const sign = state.orbitDeg > 0.4 ? "+" : "";
      orbitValue.textContent = `${sign}${Math.round(state.orbitDeg)}°`;
    }

    // 按钮激活态
    for (const b of scriptBtns) {
      const on = b.dataset.script === state.script;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    for (const b of lensBtns) {
      const on = Number(b.dataset.lens) === state.focalMm;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    for (const b of actorBtns) {
      const on = b.dataset.selectActor === state.selected;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    const curActor = state.actors[state.selected];
    if (selectedLabel) {
      selectedLabel.textContent = `${curActor.name} · ${POSTURES[curActor.posture].label}`;
    }
    for (const b of postureBtns) {
      const on = b.dataset.posture === curActor.posture;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    if (posterGuideBtn) {
      posterGuideBtn.classList.toggle("is-active", state.showPosterGuide);
      posterGuideBtn.setAttribute("aria-pressed", String(state.showPosterGuide));
    }

    // 诊单更新
    const isPass = diagnosis.code === "pass";
    if (diagBox) diagBox.dataset.state = isPass ? "pass" : "error";
    if (diagBadge) diagBadge.textContent = diagnosis.badge;
    if (diagHead) diagHead.textContent = diagnosis.headline;
    if (diagBody) diagBody.textContent = diagnosis.explanation;
    if (diagHint) diagHint.textContent = diagnosis.hint;

    if (metricBase) metricBase.textContent = `${Math.round(baseSpan * 100)}%`;
    if (metricApex) metricApex.textContent = `${Math.round(apexDeg)}°`;
    if (metricLead) {
      const v = Math.round(apexLead * 100);
      metricLead.textContent = `${v > 0 ? "+" : ""}${v}%`;
    }

    // 底沿原海报四原则检核带
    for (const p of principles) {
      const ref = principleEls[p.key];
      if (!ref) continue;
      ref.card?.classList.toggle("is-ok", p.ok);
      ref.card?.classList.toggle("is-err", !p.ok);
      if (ref.status) ref.status.textContent = p.status;
    }

    // 顶右圆形印章实时读数
    const sealScore = document.getElementById("seal-score");
    if (sealScore) sealScore.textContent = `${passedCount} / 4`;

    dirty = true;
  }

  // ---------- 绘制宽银幕取景框 ----------
  function drawViewfinder(alphaIntro) {
    const ctx = vfCtx;
    const W = vfW;
    const H = vfH;
    const { cam, actors, apexActor, baseLeft, baseRight, useInvertedGeom, passedCount, diagnosis } = evalRes;
    const isPass = diagnosis.code === "pass";

    ctx.clearRect(0, 0, W, H);

    // 1. 片场背景：上暖象牙墙面 + 地平线 + 暖沙片场地板
    const horY = Math.round(H * 0.52);
    ctx.fillStyle = PAL.stageTop;
    ctx.fillRect(0, 0, W, horY);
    ctx.fillStyle = PAL.stageFloor;
    ctx.fillRect(0, horY, W, H - horY);

    // 建筑背景细纵柱（随相机水平旋转移动，增强真实镜头绕拍空间感）
    ctx.save();
    ctx.strokeStyle = "rgba(17, 16, 14, 0.08)";
    ctx.lineWidth = 1;
    for (let wx = -3.0; wx <= 3.01; wx += 1.0) {
      const pTop = projectFloorOrWall(cam, wx, 2.75, 2.5);
      const pBot = projectFloorOrWall(cam, wx, 0, 2.5);
      if (pTop.visible && pBot.visible) {
        ctx.beginPath();
        ctx.moveTo(pTop.u * W, pTop.v * H);
        ctx.lineTo(pBot.u * W, pBot.v * H);
        ctx.stroke();
      }
    }
    // 后墙顶檐与踢脚线
    const wallL = projectFloorOrWall(cam, -3.4, 0, 2.45);
    const wallR = projectFloorOrWall(cam, 3.4, 0, 2.45);
    ctx.strokeStyle = "rgba(17, 16, 14, 0.22)";
    ctx.beginPath();
    ctx.moveTo(wallL.u * W, wallL.v * H);
    ctx.lineTo(wallR.u * W, wallR.v * H);
    ctx.stroke();

    // 地板透视格栅（纯 3D 针孔投影）
    ctx.strokeStyle = "rgba(17, 16, 14, 0.11)";
    for (let x = -2.5; x <= 2.51; x += 0.625) {
      const a = projectFloorOrWall(cam, x, 0, -1.9);
      const b = projectFloorOrWall(cam, x, 0, 2.1);
      if (a.visible && b.visible) {
        ctx.beginPath();
        ctx.moveTo(a.u * W, a.v * H);
        ctx.lineTo(b.u * W, b.v * H);
        ctx.stroke();
      }
    }
    for (let z = -1.6; z <= 2.01; z += 0.6) {
      const a = projectFloorOrWall(cam, -2.5, 0, z);
      const b = projectFloorOrWall(cam, 2.5, 0, z);
      if (a.visible && b.visible) {
        ctx.beginPath();
        ctx.moveTo(a.u * W, a.v * H);
        ctx.lineTo(b.u * W, b.v * H);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 2. 可选「312 原海报几何原型叠加」
    if (state.showPosterGuide) {
      ctx.save();
      const pxApexX = W * 0.5;
      const pxApexY = H * 0.14;
      const pxBaseY = H * 0.86;
      const pxBaseHalf = W * 0.34;
      ctx.fillStyle = "rgba(229, 75, 26, 0.06)";
      ctx.beginPath();
      ctx.moveTo(pxApexX, pxApexY);
      ctx.lineTo(pxApexX - pxBaseHalf, pxBaseY);
      ctx.lineTo(pxApexX + pxBaseHalf, pxBaseY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(229, 75, 26, 0.42)";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 原海报中心大朱红虚环
      ctx.beginPath();
      ctx.arc(pxApexX, H * 0.56, Math.min(W, H) * 0.14, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(229, 75, 26, 0.28)";
      ctx.stroke();
      ctx.restore();
    }

    // 3. 312 风格三角几何力场（暖沙半透明三角面 + 汇聚虚线 + 箭头 + 顶芒）
    const ax = apexActor.head.u * W;
    const ay = apexActor.head.v * H;
    const lx = baseLeft.head.u * W;
    const ly = baseLeft.head.v * H;
    const rx = baseRight.head.u * W;
    const ry = baseRight.head.v * H;

    ctx.save();
    ctx.globalAlpha = alphaIntro;
    const flatOrBad = evalRes.triH < 0.14 || !evalRes.allInFrame || !evalRes.noOverlap;
    const triColor = isPass ? PAL.vermilion : flatOrBad ? PAL.warn : PAL.vermilion;

    // 填面（仅在构出一定面积时淡填）
    if (evalRes.triH >= 0.05) {
      ctx.fillStyle = isPass ? "rgba(229, 75, 26, 0.13)" : "rgba(166, 38, 20, 0.08)";
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(lx, ly);
      ctx.lineTo(rx, ry);
      ctx.closePath();
      ctx.fill();
    }

    // 三边虚线（复刻 312 原海报斜边朱红虚线）
    ctx.strokeStyle = triColor;
    ctx.lineWidth = isPass ? 2.2 : 1.75;
    ctx.setLineDash(isPass ? [6, 5] : [4, 4]);
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(ax, ay);
    ctx.lineTo(rx, ry);
    ctx.stroke();

    // 底/顶横边线
    ctx.setLineDash([]);
    ctx.lineWidth = isPass ? 2.4 : 1.4;
    ctx.strokeStyle = isPass ? PAL.ink : "rgba(166, 38, 20, 0.55)";
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(rx, ry);
    ctx.stroke();

    // 两侧汇聚方向箭头（沿两腰指向顶点，正三角向上、倒三角向下）
    if (evalRes.triH >= 0.09) {
      const flowT = 0.48 + 0.12 * Math.sin(arrowPhase * 2.4);
      drawSlopeArrow(ctx, lx, ly, ax, ay, flowT, triColor);
      drawSlopeArrow(ctx, rx, ry, ax, ay, flowT, triColor);
    }

    // 重心垂线（小细点线落到底边，可视化稳定性）
    const cx = evalRes.centroid.u * W;
    const cy = evalRes.centroid.v * H;
    ctx.strokeStyle = "rgba(17, 16, 14, 0.28)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, H - 14);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = isPass ? PAL.vermilion : PAL.ink;
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. 按远近深度排序（painter's algorithm）绘制三名无五官电影剪影角色
    const sortedDepth = [...actors].sort((a, b) => b.head.cz - a.head.cz);
    for (const p of sortedDepth) {
      drawCinemaSilhouette(ctx, p, W, H, p.id === state.selected, p.id === apexActor.id && isPass);
    }

    // 5. 顶点朱红圆与 312 原海报三道顶芒（\ | /）—— 形成明显三角后浮起在顶点上方
    if (evalRes.triH >= 0.08 || isPass) {
      ctx.save();
      ctx.globalAlpha = alphaIntro;
      const badgeR = isPass ? 7 : 5;
      const dir = useInvertedGeom ? 1 : -1;
      const dotY = ay + dir * (isPass ? 18 : 16);
      ctx.fillStyle = isPass ? PAL.vermilion : flatOrBad ? PAL.warn : PAL.vermilion;
      ctx.beginPath();
      ctx.arc(ax, dotY, badgeR, 0, Math.PI * 2);
      ctx.fill();

      if (isPass) {
        const sparkBaseY = dotY + dir * (badgeR + 4);
        ctx.strokeStyle = PAL.vermilion;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        const rays = [-0.42, 0, 0.42];
        for (const ang of rays) {
          const sx = ax + Math.sin(ang) * 6;
          const sy = sparkBaseY;
          const ex = ax + Math.sin(ang) * 13;
          const ey = sparkBaseY + dir * Math.cos(ang) * 8.5;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 6. 取景器四角细折标 + 顶部焦段/机位参数标（高对比印刷风）
    ctx.save();
    ctx.strokeStyle = "rgba(17, 16, 14, 0.35)";
    ctx.lineWidth = 1.25;
    const m = 12, L = 14;
    // 左上、右上、左下、右下
    drawCorner(ctx, m, m, L, L);
    drawCorner(ctx, W - m, m, -L, L);
    drawCorner(ctx, m, H - m - 8, L, -L);
    drawCorner(ctx, W - m, H - m - 8, -L, -L);

    // 左上微标签
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(16, 14, 134, 22);
    ctx.fillStyle = PAL.paper;
    ctx.font = '600 11px "IBM Plex Mono", monospace';
    ctx.textBaseline = "middle";
    const sign = state.orbitDeg > 0.4 ? "+" : "";
    ctx.fillText(`CAM ${sign}${Math.round(state.orbitDeg)}° · ${state.focalMm}mm`, 23, 25.5);

    // 右上状态小签
    const pillW = isPass ? 106 : 112;
    ctx.fillStyle = isPass ? PAL.vermilion : PAL.warn;
    ctx.fillRect(W - pillW - 16, 14, pillW, 22);
    ctx.fillStyle = "#FAF4EC";
    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(isPass ? `三角锁定 ${passedCount}/4` : `${evalRes.naturalOrientation === "flat" ? "一字失序" : "待调三角"} ${passedCount}/4`, W - pillW / 2 - 16, 25.5);
    ctx.textAlign = "left";
    ctx.restore();

    // 7. 312 原海报同款底沿厚黑基座横梁
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(0, H - 9, W, 9);
  }

  function projectFloorOrWall(cam, x, y, z) {
    const dx = x - cam.pos.x;
    const dy = y - cam.pos.y;
    const dz = z - cam.pos.z;
    const cx = dx * cam.right.x + dy * cam.right.y + dz * cam.right.z;
    const cy = dx * cam.up.x + dy * cam.up.y + dz * cam.up.z;
    const cz = dx * cam.fwd.x + dy * cam.fwd.y + dz * cam.fwd.z;
    const safeZ = Math.max(0.5, cz);
    return {
      u: 0.5 + cx / (2 * safeZ * cam.halfTanH),
      v: 0.5 - cy / (2 * safeZ * cam.halfTanV),
      visible: cz > 0.5,
    };
  }

  function drawCorner(ctx, x, y, dx, dy) {
    ctx.beginPath();
    ctx.moveTo(x + dx, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy);
    ctx.stroke();
  }

  function drawSlopeArrow(ctx, x1, y1, x2, y2, t, color) {
    const mx = x1 + (x2 - x1) * t;
    const my = y1 + (y2 - y1) * t;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const sz = 9;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(ang);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-sz, -sz * 0.55);
    ctx.lineTo(0, 0);
    ctx.lineTo(-sz, sz * 0.55);
    ctx.stroke();
    ctx.restore();
  }

  // 无五官电影剪影：严格不画眼鼻嘴，以头肩廓形 + 姿态台座 + 字母标区分角色
  function drawCinemaSilhouette(ctx, p, W, H, isSelected, isLockedApex) {
    const hx = p.head.u * W;
    const hy = p.head.v * H;
    const sy = p.shoulder.v * H;
    const fy = Math.min(H - 10, p.foot.v * H);
    const dy = Math.min(H - 10, p.daisTop.v * H);
    const halfW = clamp(p.shoulderHalfU * W, 13, 44);
    const headR = clamp(halfW * 0.44, 7, 18);
    const isLead = p.id === "A";

    ctx.save();

    // 脚下阴影椭圆
    ctx.fillStyle = "rgba(17, 16, 14, 0.18)";
    ctx.beginPath();
    ctx.ellipse(hx, fy, halfW * 0.95, Math.max(3, headR * 0.34), 0, 0, Math.PI * 2);
    ctx.fill();

    // 若为登台姿态，绘制厚实木盒台座
    if (p.posture === "rise") {
      const boxW = halfW * 2.15;
      const boxH = Math.max(8, fy - dy);
      ctx.fillStyle = "#2A2520";
      ctx.fillRect(hx - boxW / 2, dy, boxW, boxH);
      ctx.strokeStyle = PAL.paper;
      ctx.lineWidth = 1;
      ctx.strokeRect(hx - boxW / 2 + 0.5, dy + 0.5, boxW - 1, boxH - 1);
    }

    // 若为坐姿，绘制极简片场方凳
    if (p.posture === "sit") {
      const stoolW = halfW * 1.5;
      const stoolTop = sy + (fy - sy) * 0.42;
      ctx.fillStyle = "#C7B59D";
      ctx.fillRect(hx - stoolW / 2, stoolTop, stoolW, fy - stoolTop);
      ctx.strokeStyle = "rgba(17, 16, 14, 0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(hx - stoolW / 2, stoolTop, stoolW, fy - stoolTop);
    }

    // 躯干剪影（纯色零五官几何廓形：主角 A 深炭带朱红领口标，B/C 炭黑灰）
    const bodyFill = isLead ? "#14110F" : "#35302A";
    const standBottom = p.posture === "rise" ? dy : fy;
    ctx.fillStyle = bodyFill;
    ctx.beginPath();
    ctx.moveTo(hx - halfW * 0.72, standBottom);
    ctx.lineTo(hx - halfW, sy + headR * 0.65);
    ctx.quadraticCurveTo(hx - halfW * 0.96, sy - headR * 0.15, hx - halfW * 0.34, sy - headR * 0.15);
    ctx.lineTo(hx + halfW * 0.34, sy - headR * 0.15);
    ctx.quadraticCurveTo(hx + halfW * 0.96, sy - headR * 0.15, hx + halfW, sy + headR * 0.65);
    ctx.lineTo(hx + halfW * 0.72, standBottom);
    ctx.closePath();
    ctx.fill();

    // 选中态清晰外描边
    if (isSelected) {
      ctx.strokeStyle = PAL.vermilion;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 头部纯圆剪影（无五官）
    ctx.fillStyle = isLead ? PAL.vermilion : "#1C1916";
    ctx.beginPath();
    ctx.arc(hx, hy + headR * 0.55, headR, 0, Math.PI * 2);
    ctx.fill();

    if (isSelected || isLockedApex) {
      ctx.strokeStyle = isLead ? PAL.ink : PAL.vermilion;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      ctx.arc(hx, hy + headR * 0.55, headR + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 胸口极简字符徽标（A / B / C）
    ctx.fillStyle = PAL.paper;
    ctx.font = `700 ${Math.round(clamp(headR * 1.05, 10, 14))}px "Archivo", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.id, hx, sy + (standBottom - sy) * 0.28);
    ctx.restore();
  }

  // ---------- 绘制俯视片场走位图（Overhead Blocking Floorplan） ----------
  function floorInsets() {
    const compact = fpH < 140;
    return {
      padX: 24,
      padTop: compact ? 22 : 26,
      padBot: compact ? 38 : 50,
    };
  }

  function worldToFloor(x, z) {
    const { padX, padTop, padBot } = floorInsets();
    const usableW = Math.max(40, fpW - padX * 2);
    const usableH = Math.max(40, fpH - padTop - padBot);
    const nx = (x - STAGE_BOUNDS.minX) / (STAGE_BOUNDS.maxX - STAGE_BOUNDS.minX);
    // 俯视图：z 越大（远景/后墙）越靠近图顶，z 越小（前景/镜头）越靠近图底
    const nz = (STAGE_BOUNDS.maxZ - z) / (STAGE_BOUNDS.maxZ - STAGE_BOUNDS.minZ);
    return {
      px: padX + nx * usableW,
      py: padTop + nz * usableH,
    };
  }

  function floorToWorld(px, py) {
    const { padX, padTop, padBot } = floorInsets();
    const usableW = Math.max(40, fpW - padX * 2);
    const usableH = Math.max(40, fpH - padTop - padBot);
    const nx = clamp((px - padX) / usableW, 0, 1);
    const nz = clamp((py - padTop) / usableH, 0, 1);
    return {
      x: STAGE_BOUNDS.minX + nx * (STAGE_BOUNDS.maxX - STAGE_BOUNDS.minX),
      z: STAGE_BOUNDS.maxZ - nz * (STAGE_BOUNDS.maxZ - STAGE_BOUNDS.minZ),
    };
  }

  function drawFloorplan() {
    const ctx = fpCtx;
    const W = fpW;
    const H = fpH;
    const { cam, diagnosis } = evalRes;
    const isPass = diagnosis.code === "pass";

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = PAL.sand;
    ctx.fillRect(0, 0, W, H);

    // 1. 建筑制图点阵与坐标网格
    const tl = worldToFloor(STAGE_BOUNDS.minX, STAGE_BOUNDS.maxZ);
    const br = worldToFloor(STAGE_BOUNDS.maxX, STAGE_BOUNDS.minZ);
    ctx.strokeStyle = "rgba(17, 16, 14, 0.11)";
    ctx.lineWidth = 1;
    for (let x = -2.0; x <= 2.01; x += 1.0) {
      const a = worldToFloor(x, STAGE_BOUNDS.maxZ);
      const b = worldToFloor(x, STAGE_BOUNDS.minZ);
      ctx.beginPath();
      ctx.moveTo(a.px, a.py);
      ctx.lineTo(b.px, b.py);
      ctx.stroke();
    }
    for (let z = -1.5; z <= 1.51; z += 0.75) {
      const a = worldToFloor(STAGE_BOUNDS.minX, z);
      const b = worldToFloor(STAGE_BOUNDS.maxX, z);
      ctx.beginPath();
      ctx.moveTo(a.px, a.py);
      ctx.lineTo(b.px, b.py);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(17, 16, 14, 0.25)";
    ctx.strokeRect(tl.px, tl.py, br.px - tl.px, br.py - tl.py);

    // 标注后景/前景方向
    ctx.fillStyle = PAL.inkSoft;
    ctx.font = '500 10px "IBM Plex Mono", monospace';
    ctx.fillText("UPSTAGE 后景", tl.px + 2, tl.py - 8);
    ctx.textAlign = "right";
    ctx.fillText(`${state.focalMm}mm FOV`, br.px - 2, tl.py - 8);
    ctx.textAlign = "left";

    // 2. 机位弧形滑轨与视锥（FOV 扇面）
    const pivot = worldToFloor(0, 0);
    const orbitR = Math.min(W * 0.44, H - pivot.py - 16);
    const arcCenterY = pivot.py;

    ctx.save();
    ctx.strokeStyle = "rgba(17, 16, 14, 0.28)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(
      pivot.px,
      arcCenterY,
      orbitR,
      Math.PI / 2 - (55 * Math.PI) / 180,
      Math.PI / 2 + (55 * Math.PI) / 180
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // 机位在俯视弧轨上的实际落点
    const camRad = (state.orbitDeg * Math.PI) / 180;
    const camPx = pivot.px + Math.sin(camRad) * orbitR;
    const camPy = arcCenterY + Math.cos(camRad) * orbitR;

    // 视锥边界线
    const viewDir = Math.atan2(pivot.py - camPy, pivot.px - camPx);
    const halfFov = Math.atan(cam.halfTanH);
    const coneLen = Math.max(W, H) * 0.92;
    ctx.fillStyle = "rgba(229, 75, 26, 0.08)";
    ctx.beginPath();
    ctx.moveTo(camPx, camPy);
    ctx.lineTo(camPx + Math.cos(viewDir - halfFov) * coneLen, camPy + Math.sin(viewDir - halfFov) * coneLen);
    ctx.lineTo(camPx + Math.cos(viewDir + halfFov) * coneLen, camPy + Math.sin(viewDir + halfFov) * coneLen);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(229, 75, 26, 0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(camPx, camPy);
    ctx.lineTo(camPx + Math.cos(viewDir - halfFov) * coneLen, camPy + Math.sin(viewDir - halfFov) * coneLen);
    ctx.moveTo(camPx, camPy);
    ctx.lineTo(camPx + Math.cos(viewDir + halfFov) * coneLen, camPy + Math.sin(viewDir + halfFov) * coneLen);
    ctx.stroke();
    ctx.restore();

    // 3. 俯视三点连线（呼应 312 原海报左下角三角节点图）
    const pA = worldToFloor(state.actors.A.x, state.actors.A.z);
    const pB = worldToFloor(state.actors.B.x, state.actors.B.z);
    const pC = worldToFloor(state.actors.C.x, state.actors.C.z);
    ctx.save();
    ctx.strokeStyle = isPass ? PAL.vermilion : "rgba(17, 16, 14, 0.48)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(pA.px, pA.py);
    ctx.lineTo(pB.px, pB.py);
    ctx.lineTo(pC.px, pC.py);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 4. 三枚可拖拽演员站位点
    const pts = { A: pA, B: pB, C: pC };
    for (const id of ["B", "C", "A"]) {
      const a = state.actors[id];
      const pt = pts[id];
      const isSel = state.selected === id;
      const r = a.posture === "rise" ? 14 : a.posture === "stand" ? 12 : 10.5;

      // 选中外环
      if (isSel) {
        ctx.strokeStyle = PAL.vermilion;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, r + 4.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 登台外方框记号
      if (a.posture === "rise") {
        ctx.strokeStyle = PAL.ink;
        ctx.lineWidth = 1.25;
        ctx.strokeRect(pt.px - r - 2, pt.py - r - 2, (r + 2) * 2, (r + 2) * 2);
      }

      ctx.fillStyle = id === "A" ? PAL.vermilion : PAL.ink;
      ctx.beginPath();
      ctx.arc(pt.px, pt.py, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = PAL.paper;
      ctx.font = '700 11px "Archivo", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(id, pt.px, pt.py + 0.5);

      ctx.fillStyle = PAL.ink;
      ctx.font = '600 10px "Noto Sans SC", sans-serif';
      const labelAbove = pt.py - r - 9 >= tl.py + 5;
      ctx.fillText(POSTURES[a.posture].short, pt.px, labelAbove ? pt.py - r - 7 : pt.py + r + 10);
    }

    // 5. 机位摄影机图标
    ctx.save();
    ctx.translate(camPx, camPy);
    ctx.rotate(viewDir + Math.PI / 2);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(-9, -6, 18, 12);
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(-9, -13);
    ctx.lineTo(9, -13);
    ctx.lineTo(5, -6);
    ctx.closePath();
    ctx.fillStyle = PAL.vermilion;
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = PAL.inkSoft;
    ctx.font = '500 10px "IBM Plex Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText("CAM", camPx, Math.min(H - 5, camPy + 15));
    ctx.textAlign = "left";
  }

  // ---------- 交互绑定 ----------
  let activeDrag = null; // { kind: 'actor' | 'orbit', id?, startX, startOrbit }

  // 1) 俯视走位图直接拖 A/B/C 或拖机位
  function hitFloorplan(clientX, clientY) {
    const r = fpCanvas.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;

    // 先命中演员
    for (const id of ["A", "B", "C"]) {
      const pt = worldToFloor(state.actors[id].x, state.actors[id].z);
      if (Math.hypot(px - pt.px, py - pt.py) <= 24) {
        return { kind: "actor", id };
      }
    }
    // 命中底部机位弧轨区
    if (py > fpH - 56) {
      return { kind: "orbit-fp" };
    }
    return { kind: "place-selected", px, py };
  }

  fpCanvas.addEventListener("pointerdown", (e) => {
    const hit = hitFloorplan(e.clientX, e.clientY);
    fpCanvas.setPointerCapture(e.pointerId);
    if (hit.kind === "actor") {
      state.selected = hit.id;
      activeDrag = { kind: "fp-actor", id: hit.id };
      syncUI();
    } else if (hit.kind === "orbit-fp") {
      activeDrag = { kind: "orbit-fp" };
      updateOrbitFromFp(e.clientX, e.clientY);
    } else if (hit.kind === "place-selected") {
      const w = floorToWorld(hit.px, hit.py);
      state.actors[state.selected].x = clamp(w.x, STAGE_BOUNDS.minX, STAGE_BOUNDS.maxX);
      state.actors[state.selected].z = clamp(w.z, STAGE_BOUNDS.minZ, STAGE_BOUNDS.maxZ);
      activeDrag = { kind: "fp-actor", id: state.selected };
      syncUI();
    }
  });

  function updateOrbitFromFp(clientX, clientY) {
    const r = fpCanvas.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;
    const pivot = worldToFloor(0, 0);
    const rad = Math.atan2(px - pivot.px, Math.max(12, py - pivot.py));
    state.orbitDeg = clamp((rad * 180) / Math.PI, -55, 55);
    if (Math.abs(state.orbitDeg) < 2.2) state.orbitDeg = 0;
    syncUI();
  }

  fpCanvas.addEventListener("pointermove", (e) => {
    if (!activeDrag) return;
    if (activeDrag.kind === "fp-actor") {
      const r = fpCanvas.getBoundingClientRect();
      const w = floorToWorld(e.clientX - r.left, e.clientY - r.top);
      state.actors[activeDrag.id].x = clamp(w.x, STAGE_BOUNDS.minX, STAGE_BOUNDS.maxX);
      state.actors[activeDrag.id].z = clamp(w.z, STAGE_BOUNDS.minZ, STAGE_BOUNDS.maxZ);
      syncUI();
    } else if (activeDrag.kind === "orbit-fp") {
      updateOrbitFromFp(e.clientX, e.clientY);
    }
  });

  const endFp = () => {
    activeDrag = null;
  };
  fpCanvas.addEventListener("pointerup", endFp);
  fpCanvas.addEventListener("pointercancel", endFp);

  // 2) 宽银幕取景框内也可直接拖拽角色横向移位，或横向扫动背景旋转机位
  let vfDrag = null;
  vfCanvas.addEventListener("pointerdown", (e) => {
    const r = vfCanvas.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    let picked = null;
    for (const p of evalRes.actors) {
      const cx = p.head.u * vfW;
      const cy = (p.head.v + p.foot.v) * 0.5 * vfH;
      if (Math.abs(px - cx) < 30 && Math.abs(py - cy) < Math.max(40, (p.foot.v - p.head.v) * vfH * 0.6)) {
        picked = p.id;
        break;
      }
    }
    vfCanvas.setPointerCapture(e.pointerId);
    if (picked) {
      state.selected = picked;
      vfDrag = {
        kind: "actor",
        id: picked,
        startX: e.clientX,
        startY: e.clientY,
        origX: state.actors[picked].x,
        origZ: state.actors[picked].z,
      };
      syncUI();
    } else {
      vfDrag = { kind: "orbit", startX: e.clientX, origOrbit: state.orbitDeg };
    }
  });

  vfCanvas.addEventListener("pointermove", (e) => {
    if (!vfDrag) return;
    if (vfDrag.kind === "actor") {
      const dx = (e.clientX - vfDrag.startX) / Math.max(120, vfW);
      const dy = (e.clientY - vfDrag.startY) / Math.max(120, vfH);
      const a = state.actors[vfDrag.id];
      const rad = (state.orbitDeg * Math.PI) / 180;
      const moveRight = dx * 4.4;
      const moveForward = -dy * 3.2;
      a.x = clamp(vfDrag.origX + moveRight * Math.cos(rad) + moveForward * Math.sin(rad), STAGE_BOUNDS.minX, STAGE_BOUNDS.maxX);
      a.z = clamp(vfDrag.origZ - moveRight * Math.sin(rad) + moveForward * Math.cos(rad), STAGE_BOUNDS.minZ, STAGE_BOUNDS.maxZ);
      syncUI();
    } else if (vfDrag.kind === "orbit") {
      const dx = e.clientX - vfDrag.startX;
      state.orbitDeg = clamp(vfDrag.origOrbit + (dx / Math.max(160, vfW)) * 110, -55, 55);
      if (Math.abs(state.orbitDeg) < 1.8) state.orbitDeg = 0;
      syncUI();
    }
  });
  vfCanvas.addEventListener("pointerup", () => { vfDrag = null; });
  vfCanvas.addEventListener("pointercancel", () => { vfDrag = null; });

  // 3) 底沿机位环轨滑柄（data-perf-drag，鼠标 + 触屏 + 键盘全支持）
  if (orbitTrack) {
    let trackDragging = false;
    const setFromClientX = (clientX) => {
      const r = orbitTrack.getBoundingClientRect();
      const ratio = clamp((clientX - r.left) / Math.max(1, r.width), 0, 1);
      let deg = -55 + ratio * 110;
      if (Math.abs(deg) < 2.2) deg = 0;
      state.orbitDeg = deg;
      syncUI();
      ctl.draw();
    };
    orbitTrack.addEventListener("pointerdown", (e) => {
      trackDragging = true;
      orbitTrack.setPointerCapture(e.pointerId);
      setFromClientX(e.clientX);
    });
    orbitTrack.addEventListener("pointermove", (e) => {
      if (!trackDragging) return;
      setFromClientX(e.clientX);
    });
    orbitTrack.addEventListener("pointerup", () => { trackDragging = false; });
    orbitTrack.addEventListener("pointercancel", () => { trackDragging = false; });
    // 兼顾 tools/perf.mjs 直接派发原生 touch 事件（无 PointerEvent 合成时同样响应）
    orbitTrack.addEventListener("touchstart", (e) => {
      if (e.touches[0]) setFromClientX(e.touches[0].clientX);
    }, { passive: true });
    orbitTrack.addEventListener("touchmove", (e) => {
      if (e.touches[0]) setFromClientX(e.touches[0].clientX);
    }, { passive: true });
    orbitTrack.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        state.orbitDeg = clamp(state.orbitDeg - 5, -55, 55);
        syncUI();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        state.orbitDeg = clamp(state.orbitDeg + 5, -55, 55);
        syncUI();
      } else if (e.key === "0") {
        e.preventDefault();
        state.orbitDeg = 0;
        syncUI();
      }
    });
  }

  // 4) 脚本切换、焦段切换、演员选择、姿态切换、方向微调钮、原海报叠加、重置
  for (const b of scriptBtns) {
    b.addEventListener("click", () => {
      const next = b.dataset.script;
      if (!SCRIPTS[next]) return;
      state.script = next;
      syncUI();
    });
  }

  for (const b of lensBtns) {
    b.addEventListener("click", () => {
      state.focalMm = Number(b.dataset.lens);
      syncUI();
    });
  }

  for (const b of actorBtns) {
    b.addEventListener("click", () => {
      state.selected = b.dataset.selectActor;
      syncUI();
    });
  }

  for (const b of postureBtns) {
    b.addEventListener("click", () => {
      state.actors[state.selected].posture = b.dataset.posture;
      syncUI();
    });
  }

  for (const b of nudgeBtns) {
    b.addEventListener("click", () => {
      const a = state.actors[state.selected];
      const step = 0.32;
      if (b.dataset.nudge === "left") a.x = clamp(a.x - step, STAGE_BOUNDS.minX, STAGE_BOUNDS.maxX);
      if (b.dataset.nudge === "right") a.x = clamp(a.x + step, STAGE_BOUNDS.minX, STAGE_BOUNDS.maxX);
      if (b.dataset.nudge === "back") a.z = clamp(a.z + step, STAGE_BOUNDS.minZ, STAGE_BOUNDS.maxZ);
      if (b.dataset.nudge === "front") a.z = clamp(a.z - step, STAGE_BOUNDS.minZ, STAGE_BOUNDS.maxZ);
      syncUI();
    });
  }

  posterGuideBtn?.addEventListener("click", () => {
    state.showPosterGuide = !state.showPosterGuide;
    syncUI();
  });

  resetBtn?.addEventListener("click", () => {
    const fresh = createInitialState(state.script);
    state.orbitDeg = fresh.orbitDeg;
    state.focalMm = fresh.focalMm;
    state.selected = fresh.selected;
    state.showPosterGuide = false;
    state.actors = fresh.actors;
    syncUI();
  });

  // 俯视图键盘操控（方向键移位、1/2/3 切换坐/站/登台）
  fpCanvas.addEventListener("keydown", (e) => {
    const a = state.actors[state.selected];
    const step = 0.25;
    if (e.key === "ArrowLeft") { e.preventDefault(); a.x = clamp(a.x - step, STAGE_BOUNDS.minX, STAGE_BOUNDS.maxX); syncUI(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); a.x = clamp(a.x + step, STAGE_BOUNDS.minX, STAGE_BOUNDS.maxX); syncUI(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); a.z = clamp(a.z + step, STAGE_BOUNDS.minZ, STAGE_BOUNDS.maxZ); syncUI(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); a.z = clamp(a.z - step, STAGE_BOUNDS.minZ, STAGE_BOUNDS.maxZ); syncUI(); }
    else if (e.key === "1") { a.posture = "sit"; syncUI(); }
    else if (e.key === "2") { a.posture = "stand"; syncUI(); }
    else if (e.key === "3") { a.posture = "rise"; syncUI(); }
    else if (e.key === "a" || e.key === "A") { state.selected = "A"; syncUI(); }
    else if (e.key === "b" || e.key === "B") { state.selected = "B"; syncUI(); }
    else if (e.key === "c" || e.key === "C") { state.selected = "C"; syncUI(); }
  });

  // 尺寸监听
  const ro = new ResizeObserver(() => {
    resizeCanvases();
    ctl.draw();
  });
  ro.observe(vfCanvas);
  ro.observe(fpCanvas);

  // 渲染循环（屏幕外/隐藏标签页自动停帧，reducedMotion 时静止画完整帧）
  const heroEl = document.querySelector(".hero") || vfCanvas;
  const ctl = loop(heroEl, (t, dt, { still }) => {
    if (still) {
      introProgress = 1;
      arrowPhase = 0;
      drawViewfinder(1);
      drawFloorplan();
      dirty = false;
      return;
    }
    const animatingIntro = introProgress < 1;
    if (animatingIntro) {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.8);
      dirty = true;
    }
    // 成立或有效三角时做轻柔汇聚箭头脉冲；纯静置零三角时按需重画以极度省电
    if (evalRes.triH >= 0.09) {
      arrowPhase += dt;
      dirty = true;
    }
    if (!dirty) return;
    const ease = 1 - Math.pow(1 - introProgress, 3);
    drawViewfinder(0.35 + 0.65 * ease);
    drawFloorplan();
    dirty = false;
  });

  resizeCanvases();
  syncUI();
  ctl.draw();
}

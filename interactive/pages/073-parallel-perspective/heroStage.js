// 073 平行透视构图 · 开场「蓝图门楼移轴取景台」2D Canvas 渲染与双物理手势控制
// 手势 1：拖画框左右缘（或画布非橙点区横向拖动）= 转头（改 yawDeg，不设 0° 刻度与磁吸）
// 手势 2：拖信号橙单消失点 = 移轴（镜头平移，改 shiftNorm，yawDeg 严丝不动）
// 纯矢量透视匾额（零离屏 drawImage 纹理采样）+ 缓存渐变 + 批量描边 + transform 零重排合成，软硬件渲染均稳跑 59.9fps

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  INITIAL_STATE,
  YAW_MIN,
  YAW_MAX,
  WORLD,
  clamp,
  clampShiftForYaw,
  projectScene,
} from "./model.js";

// 辅助：按世界坐标矩形在门楼正立面 (Z = plaqueZ) 绘出精确 3D 透视四边形
function quadPath(ctx, proj, x0, x1, y0, y1, z) {
  const tl = proj.project(x0, y1, z);
  const tr = proj.project(x1, y1, z);
  const br = proj.project(x1, y0, z);
  const bl = proj.project(x0, y0, z);
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();
  return { tl, tr, br, bl };
}

// 纯矢量透视题字匾额：零离屏纹理采样，每个汉字按真实 3D 投影宽度、高度与透视斜率独立变换绘制，
// 既在任意 DPI 下刀刻般锐利，又在 SwiftShader CPU 6× 软渲染下保持 <0.3ms 极速。
function drawVectorPlaque(ctx, proj) {
  const { plaqueZ, plaqueHalfW, plaqueBotY, plaqueTopY } = WORLD;
  const hw = plaqueHalfW;
  const yb = plaqueBotY;
  const yt = plaqueTopY;
  const hWorld = yt - yb;

  // 1. 深钴蓝石匾底板
  const outer = quadPath(ctx, proj, -hw, hw, yb, yt, plaqueZ);
  ctx.fillStyle = "#0F3D75";
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = proj.status.isParallel ? "#FFFFFF" : "#FFB066";
  ctx.stroke();

  // 2. 内圈锐白细框
  quadPath(ctx, proj, -hw * 0.92, hw * 0.92, yb + hWorld * 0.08, yt - hWorld * 0.08, plaqueZ);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "rgba(203, 231, 254, 0.78)";
  ctx.stroke();

  // 3. 上下两条醒目信号橙平行校验横条（斜度与长度比一眼可辨）
  quadPath(ctx, proj, -hw * 0.86, hw * 0.86, yt - hWorld * 0.18, yt - hWorld * 0.125, plaqueZ);
  ctx.fillStyle = "#FC750A";
  ctx.fill();
  quadPath(ctx, proj, -hw * 0.86, hw * 0.86, yb + hWorld * 0.125, yb + hWorld * 0.18, plaqueZ);
  ctx.fill();

  // 4. 四个汉字「大 道 通 衢」按真实透视深度逐字缩放 + 精确透视垂直错切
  const chars = ["大", "道", "通", "衢"];
  const yCharTop = yb + hWorld * 0.78;
  const yCharBot = yb + hWorld * 0.30;
  const yCharMid = 0.5 * (yCharTop + yCharBot);
  const spanHalf = hw * 0.76;
  const stepW = (2 * spanHalf) / chars.length;

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < chars.length; i++) {
    const xL = -spanHalf + i * stepW;
    const xR = xL + stepW;
    const xM = 0.5 * (xL + xR);

    const pL = proj.project(xL, yCharMid, plaqueZ);
    const pR = proj.project(xR, yCharMid, plaqueZ);
    const pTop = proj.project(xM, yCharTop, plaqueZ);
    const pBot = proj.project(xM, yCharBot, plaqueZ);

    const cellW = Math.max(4, pR.x - pL.x);
    const cellH = Math.max(4, pBot.y - pTop.y);
    const skewY = (pR.y - pL.y) / cellW; // 严格贴合透视消失线斜率
    const cx = 0.5 * (pL.x + pR.x);
    const cy = 0.5 * (pTop.y + pBot.y);

    // 统一按标准 48px 字模做矩阵缩放与错切，彻底复用浏览器字形缓存（零重复栅格化！）
    const basePx = 48;
    const scaleY = (cellH * 0.96) / basePx;
    const scaleX = Math.min(scaleY * 1.05, (cellW * 0.88) / basePx);

    ctx.save();
    ctx.transform(scaleX, skewY * scaleX, 0, scaleY, cx, cy);
    ctx.font = '900 48px "Noto Sans SC", sans-serif';
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
  }

  // 5. 底部英文副标（单次透视斜切，同样用固定 16px 字模复用缓存）
  const pSubL = proj.project(-hw * 0.72, yb + hWorld * 0.235, plaqueZ);
  const pSubR = proj.project(hw * 0.72, yb + hWorld * 0.235, plaqueZ);
  const subW = Math.max(10, pSubR.x - pSubL.x);
  if (subW > 64) {
    const subSkew = (pSubR.y - pSubL.y) / subW;
    const subScale = clamp(subW / 210, 0.35, 1.35);
    ctx.save();
    ctx.transform(subScale, subSkew * subScale, 0, subScale, 0.5 * (pSubL.x + pSubR.x), 0.5 * (pSubL.y + pSubR.y));
    ctx.fillStyle = "#CBE7FE";
    ctx.font = '700 14px "Outfit", sans-serif';
    ctx.fillText("PARALLEL AVENUE · NO. 073", 0, 0);
    ctx.restore();
  }

  return outer;
}

// 缓存按当前 (yawDeg, W, H, dpr, isParallel) 预绘的 1:1 精确矢量匾额精灵：
// 因为移轴（shiftNorm）仅改变匾额的屏幕平移偏移 (dx, dy)、完全不改变其透视形状与字形斜率，
// 移轴拖动时直接 1:1 原像素贴图（零缩放、零错切文字栅格化），软硬件渲染均可满帧运行！
function createPlaqueCache() {
  const c = document.createElement("canvas");
  const g = c.getContext("2d");
  return { canvas: c, ctx: g, key: "", padX: 0, padY: 0, cssW: 0, cssH: 0 };
}

function drawCachedVectorPlaque(ctx, proj, dpr, cache) {
  const { tl, tr, br, bl } = proj.plaque;
  const minX = Math.min(tl.x, tr.x, br.x, bl.x);
  const maxX = Math.max(tl.x, tr.x, br.x, bl.x);
  const minY = Math.min(tl.y, tr.y, br.y, bl.y);
  const maxY = Math.max(tl.y, tr.y, br.y, bl.y);
  const pad = 4;
  const cssW = Math.max(8, Math.ceil(maxX - minX + pad * 2));
  const cssH = Math.max(8, Math.ceil(maxY - minY + pad * 2));
  const key = `${proj.yawDeg.toFixed(2)}|${proj.W}|${proj.H}|${dpr}|${proj.status.isParallel ? 1 : 0}`;

  if (cache.key !== key) {
    cache.key = key;
    cache.cssW = cssW;
    cache.cssH = cssH;
    cache.canvas.width = Math.max(8, Math.round(cssW * dpr));
    cache.canvas.height = Math.max(8, Math.round(cssH * dpr));
    const g = cache.ctx;
    g.save();
    g.setTransform(dpr, 0, 0, dpr, -(minX - pad) * dpr, -(minY - pad) * dpr);
    drawVectorPlaque(g, proj);
    g.restore();
  }

  ctx.drawImage(
    cache.canvas,
    0,
    0,
    cache.canvas.width,
    cache.canvas.height,
    Math.round(minX - pad),
    Math.round(minY - pad),
    cache.cssW,
    cache.cssH
  );
}

export function initHeroStage(els) {
  const {
    stageEl,
    canvas,
    vpHandle,
    edgeLeftBtn,
    edgeRightBtn,
    resetBtn,
    readoutRatio,
    readoutRatioSub,
    readoutVp2,
    readoutVp2Sub,
    readoutWall,
    readoutWallSub,
    diagBadge,
    diagTitle,
    diagBody,
    statusChip,
    keyPoints,
  } = els;

  const ctx = canvas.getContext("2d", { alpha: false });
  const plaqueCache = createPlaqueCache();
  const thirdTag = document.getElementById("third-tag");
  const state = { ...INITIAL_STATE };
  let W = 900;
  let H = 420;
  let dpr = pixelRatio(2);
  let intro = reducedMotion.matches ? 1 : 0;
  let dirty = true;
  let activeDrag = null; // null | "vp" | "yaw"
  let highlightKey = null;
  let highlightTimer = 0;
  let lastProj = null;
  let cachedGrads = null;
  let lastUiSyncMs = 0;

  const domCache = {
    tx: "",
    ratio: "",
    ratioSub: "",
    ratioOk: "",
    vp2: "",
    vp2Sub: "",
    wall: "",
    wallSub: "",
    wallOk: "",
    badge: "",
    code: "",
    title: "",
    body: "",
    chip: "",
  };

  function markDirty() {
    dirty = true;
    if (reducedMotion.matches) ctl.draw();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      plaqueCache.key = "";
      dirty = true;
      ctl.draw();
    });
  }

  function rebuildGradients() {
    const cy = 0.5 * H;
    const sky = ctx.createLinearGradient(0, 0, 0, cy);
    sky.addColorStop(0, "#A7D9FB");
    sky.addColorStop(1, "#D8EEFE");
    const ground = ctx.createLinearGradient(0, cy, 0, H);
    ground.addColorStop(0, "#75BAF6");
    ground.addColorStop(1, "#3E89CF");
    const road = ctx.createLinearGradient(0, cy, 0, H);
    road.addColorStop(0, "#1A5AA4");
    road.addColorStop(1, "#2B74C2");
    cachedGrads = { sky, ground, road };
  }

  function resize() {
    const r = stageEl.getBoundingClientRect();
    W = Math.max(240, Math.round(r.width));
    H = Math.max(200, Math.round(r.height));
    dpr = pixelRatio(W < 520 ? 1.5 : 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    state.shiftNorm = clampShiftForYaw(state.shiftNorm, state.yawDeg, W, H);
    rebuildGradients();
    dirty = true;
  }

  function setText(el, key, val) {
    if (domCache[key] !== val) {
      domCache[key] = val;
      el.textContent = val;
    }
  }

  function syncUI(proj, forceText) {
    // 纯 transform 合成层定位手柄，零布局重排
    const vx = Math.round(clamp(proj.vp1.x, 22, proj.W - 22));
    const vy = Math.round(clamp(proj.vp1.y, 22, proj.H - 22));
    const tx = `translate3d(${vx}px, ${vy}px, 0)`;
    if (domCache.tx !== tx) {
      domCache.tx = tx;
      vpHandle.style.transform = tx;
    }

    // 高频拖拽时将下方 DOM 文本刷新节流至 ~8Hz，松手/停止立刻强刷，避免软件渲染整页文字重排拖帧
    const now = performance.now();
    if (!forceText && activeDrag && now - lastUiSyncMs < 130) return;
    lastUiSyncMs = now;

    const { sideHeightRatio, topTiltDeg, vp2DistMultW, vp2IsInfinity, rightWallAreaPct, gateCenterU } =
      proj.metrics;

    const tiltAbs = Math.abs(topTiltDeg);
    setText(readoutRatio, "ratio", `${sideHeightRatio.toFixed(2)} : 1`);
    setText(
      readoutRatioSub,
      "ratioSub",
      proj.status.isParallel
        ? `上沿倾角 ${tiltAbs.toFixed(1)}° · 四角方正`
        : `上沿倾角 ${tiltAbs.toFixed(1)}° · ${sideHeightRatio >= 1 ? "左高右低" : "右高左低"}`
    );
    const pOk = proj.status.isParallel ? "1" : "0";
    if (domCache.ratioOk !== pOk) {
      domCache.ratioOk = pOk;
      readoutRatio.dataset.ok = pOk;
      readoutVp2.dataset.ok = pOk;
    }

    if (vp2IsInfinity) {
      setText(readoutVp2, "vp2", "∞");
      setText(readoutVp2Sub, "vp2Sub", "单点唯一 · 第二灭点退散");
    } else if (vp2DistMultW >= 99) {
      setText(readoutVp2, "vp2", ">99× 画宽");
      setText(readoutVp2Sub, "vp2Sub", `微偏 ${Math.abs(proj.yawDeg).toFixed(1)}° · 趋近平行`);
    } else {
      setText(readoutVp2, "vp2", `${vp2DistMultW.toFixed(1)}× 画宽`);
      const sideLabel = proj.vp2.side === "right" ? "右侧画外" : "左侧画外";
      setText(
        readoutVp2Sub,
        "vp2Sub",
        `${sideLabel} · 偏转 ${proj.yawDeg > 0 ? "+" : ""}${proj.yawDeg.toFixed(1)}°`
      );
    }

    setText(readoutWall, "wall", `${rightWallAreaPct.toFixed(1)}%`);
    setText(readoutWallSub, "wallSub", `门楼在左 ${Math.round(gateCenterU * 100)}%（目标约 33%）`);
    const wOk = proj.status.isGateLeftThird && proj.status.isRightWallOpen ? "1" : "0";
    if (domCache.wallOk !== wOk) {
      domCache.wallOk = wOk;
      readoutWall.dataset.ok = wOk;
    }

    const d = proj.diagnosis;
    setText(diagBadge, "badge", d.badge);
    if (domCache.code !== d.code) {
      domCache.code = d.code;
      diagBadge.dataset.state = d.code;
      if (statusChip) statusChip.dataset.state = d.code;
      if (keyPoints && keyPoints.length) {
        const lit = {
          focus: proj.status.isParallel,
          vp: proj.status.isParallel && proj.status.isGateLeftThird,
          depth: true,
          guide: proj.status.missionDone || proj.status.isParallel,
        };
        for (const item of keyPoints) {
          item.dataset.lit = lit[item.dataset.keypoint] ? "1" : "0";
        }
      }
    }
    setText(diagTitle, "title", d.headline);
    setText(diagBody, "body", d.body);

    if (statusChip) {
      const chipText = proj.status.missionDone
        ? "已达成 · 平行移轴展墙"
        : proj.status.isParallel
          ? "题字方正 · 待移轴左 1/3"
          : "题字偏斜 · 待转正并移轴";
      setText(statusChip, "chip", chipText);
    }
  }

  function renderFrame(_t, dt, { still }) {
    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.55);
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;

    const ease = 1 - Math.pow(1 - intro, 3);
    const proj = projectScene(state, W, H);
    lastProj = proj;
    syncUI(proj, !activeDrag);

    if (!cachedGrads) rebuildGradients();

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 晴空天幕与基底蓝
    ctx.fillStyle = cachedGrads.sky;
    ctx.fillRect(0, 0, W, proj.cy + 1);
    ctx.fillStyle = cachedGrads.ground;
    ctx.fillRect(0, proj.cy, W, H - proj.cy);

    // 2. 纵深钴蓝大道与人行道
    const { road } = proj;
    ctx.beginPath();
    ctx.moveTo(road.nearL.x, road.nearL.y);
    ctx.lineTo(road.farL.x, road.farL.y);
    ctx.lineTo(road.farR.x, road.farR.y);
    ctx.lineTo(road.nearR.x, road.nearR.y);
    ctx.closePath();
    ctx.fillStyle = "#8AC6F8";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(road.curbNearL.x, road.curbNearL.y);
    ctx.lineTo(road.curbFarL.x, road.curbFarL.y);
    ctx.lineTo(road.curbFarR.x, road.curbFarR.y);
    ctx.lineTo(road.curbNearR.x, road.curbNearR.y);
    ctx.closePath();
    ctx.fillStyle = cachedGrads.road;
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(road.curbNearL.x, road.curbNearL.y);
    ctx.lineTo(road.curbFarL.x, road.curbFarL.y);
    ctx.moveTo(road.curbNearR.x, road.curbNearR.y);
    ctx.lineTo(road.curbFarR.x, road.curbFarR.y);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.beginPath();
    for (const d of road.dashes) {
      ctx.moveTo(d.tl.x, d.tl.y);
      ctx.lineTo(d.tr.x, d.tr.y);
      ctx.lineTo(d.br.x, d.br.y);
      ctx.lineTo(d.bl.x, d.bl.y);
      ctx.closePath();
    }
    ctx.fill();

    // 3. 左右两侧楼群立面
    const leftPalette = ["#53A1EC", "#5FA8EE", "#4B99E6", "#66AEF1", "#57A3EC", "#6BB3F4"];
    const rightPalette = ["#4592DE", "#519CE5", "#3E8AD7", "#59A3E9", "#4A96E1", "#60A9ED"];

    const drawSideWall = (bays, side) => {
      const pal = side === "left" ? leftPalette : rightPalette;
      const xWall = side === "left" ? -WORLD.roadHalfW : WORLD.roadHalfW;
      for (let i = bays.length - 1; i >= 0; i--) {
        const b = bays[i];
        ctx.beginPath();
        ctx.moveTo(b.ntl.x, b.ntl.y);
        ctx.lineTo(b.ntr.x, b.ntr.y);
        ctx.lineTo(b.nbr.x, b.nbr.y);
        ctx.lineTo(b.nbl.x, b.nbl.y);
        ctx.closePath();
        ctx.fillStyle = pal[i % pal.length];
        ctx.fill();
      }
      ctx.beginPath();
      for (let i = 0; i < bays.length; i++) {
        const b = bays[i];
        ctx.moveTo(b.ntl.x, b.ntl.y);
        ctx.lineTo(b.ntr.x, b.ntr.y);
        ctx.lineTo(b.nbr.x, b.nbr.y);
        ctx.lineTo(b.nbl.x, b.nbl.y);
        ctx.closePath();
      }
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.42 + 0.45 * ease})`;
      ctx.lineWidth = 1.1;
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i < bays.length; i++) {
        const b = bays[i];
        for (const yFloor of [0.25, 1.35, 2.35]) {
          if (yFloor >= b.roofY - 0.25) continue;
          const p0 = proj.project(xWall, yFloor, b.z0);
          const p1 = proj.project(xWall, yFloor, b.z1);
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
        }
        const zMid = 0.5 * (b.z0 + b.z1);
        const pmT = proj.project(xWall, b.roofY, zMid);
        const pmB = proj.project(xWall, WORLD.yGround, zMid);
        ctx.moveTo(pmT.x, pmT.y);
        ctx.lineTo(pmB.x, pmB.y);
      }
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.36 * ease})`;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    };

    drawSideWall(proj.leftBays, "left");
    drawSideWall(proj.rightBays, "right");

    // 4. 右墙展开后的蓝图排字展墙区
    if (proj.metrics.rightWallAreaPct >= 20) {
      const rz = proj.rightCopyZone;
      const done = proj.status.missionDone;
      ctx.beginPath();
      ctx.moveTo(rz.tl.x, rz.tl.y);
      ctx.lineTo(rz.tr.x, rz.tr.y);
      ctx.lineTo(rz.br.x, rz.br.y);
      ctx.lineTo(rz.bl.x, rz.bl.y);
      ctx.closePath();
      ctx.fillStyle = done ? "rgba(242, 248, 254, 0.22)" : "rgba(242, 248, 254, 0.11)";
      ctx.fill();
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = done ? 1.5 : 1.0;
      ctx.strokeStyle = done ? "rgba(255, 255, 255, 0.92)" : "rgba(255, 255, 255, 0.55)";
      ctx.stroke();
      ctx.setLineDash([]);

      const lineYs = [2.05, 1.48, 0.92, 0.42];
      const lineLens = [0.78, 0.62, 0.86, 0.54];
      for (let idx = 0; idx < lineYs.length; idx++) {
        const zA = 2.38;
        const zB = zA + (5.15 - zA) * lineLens[idx];
        const a = proj.project(WORLD.roadHalfW, lineYs[idx], zA);
        const b = proj.project(WORLD.roadHalfW, lineYs[idx], zB);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineWidth = idx === 0 ? 4 : 2.1;
        ctx.strokeStyle = done
          ? idx === 0
            ? "rgba(255, 255, 255, 0.92)"
            : "rgba(242, 248, 254, 0.72)"
          : "rgba(242, 248, 254, 0.42)";
        ctx.stroke();
      }

      const rwSpan = Math.abs(rz.tl.x - rz.tr.x);
      if (rwSpan > 78) {
        const lx = Math.min(W - 38, Math.max(rz.tr.x + 10, 0.5 * (rz.tl.x + rz.tr.x)));
        const ly = Math.max(24, Math.min(rz.tl.y, rz.tr.y) - 8);
        ctx.font = '700 11px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#06111F";
        ctx.fillText(done ? "右墙展区就位" : "右墙可排字区", lx, ly);
      }
    }

    // 5. 尽头正面门楼 + 透视门洞 + 纯矢量透视题字匾额
    const gf = proj.gateFrame;
    ctx.beginPath();
    ctx.moveTo(gf.tl.x, gf.tl.y);
    ctx.lineTo(gf.tr.x, gf.tr.y);
    ctx.lineTo(gf.br.x, gf.br.y);
    ctx.lineTo(gf.archBR.x, gf.archBR.y);
    ctx.lineTo(gf.archTR.x, gf.archTR.y);
    ctx.lineTo(gf.archTL.x, gf.archTL.y);
    ctx.lineTo(gf.archBL.x, gf.archBL.y);
    ctx.lineTo(gf.bl.x, gf.bl.y);
    ctx.closePath();
    ctx.fillStyle = "#236BB9";
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    const archMidY = proj.cy;
    ctx.beginPath();
    ctx.moveTo(gf.archTL.x, gf.archTL.y);
    ctx.lineTo(gf.archTR.x, gf.archTR.y);
    ctx.lineTo(gf.archTR.x, archMidY);
    ctx.lineTo(gf.archTL.x, archMidY);
    ctx.closePath();
    ctx.fillStyle = "#CBE7FE";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(gf.archTL.x, archMidY);
    ctx.lineTo(gf.archTR.x, archMidY);
    ctx.lineTo(gf.archBR.x, gf.archBR.y);
    ctx.lineTo(gf.archBL.x, gf.archBL.y);
    ctx.closePath();
    ctx.fillStyle = "#2364AE";
    ctx.fill();

    ctx.fillStyle = "rgba(15, 61, 117, 0.34)";
    ctx.beginPath();
    ctx.moveTo(gf.archTL.x, gf.archTL.y);
    ctx.lineTo(gf.archBackTL.x, gf.archBackTL.y);
    ctx.lineTo(gf.archBackBL.x, gf.archBackBL.y);
    ctx.lineTo(gf.archBL.x, gf.archBL.y);
    ctx.closePath();
    ctx.moveTo(gf.archTR.x, gf.archTR.y);
    ctx.lineTo(gf.archBackTR.x, gf.archBackTR.y);
    ctx.lineTo(gf.archBackBR.x, gf.archBackBR.y);
    ctx.lineTo(gf.archBR.x, gf.archBR.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(gf.archBL.x, gf.archBL.y);
    ctx.lineTo(gf.archTL.x, gf.archTL.y);
    ctx.lineTo(gf.archTR.x, gf.archTR.y);
    ctx.lineTo(gf.archBR.x, gf.archBR.y);
    ctx.stroke();

    drawCachedVectorPlaque(ctx, proj, dpr, plaqueCache);

    // 6. 左侧 1/3 目标参考竖线（文字标签由静态 DOM 承担，省去每帧 canvas fillText）
    const xThird = W / 3;
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = proj.status.isGateLeftThird
      ? "rgba(15, 61, 117, 0.65)"
      : "rgba(6, 17, 31, 0.32)";
    ctx.beginPath();
    ctx.moveTo(xThird, 24);
    ctx.lineTo(xThird, H - 18);
    ctx.stroke();
    ctx.setLineDash([]);
    if (thirdTag) thirdTag.dataset.ok = proj.status.isGateLeftThird ? "1" : "0";

    // 7. 偏斜时从牌匾上下沿延出虚线指向画外 VP2
    const bw = W < 460 ? 22 : 28;
    if (!proj.vp2.isInfinity && Math.abs(proj.yawDeg) > 0.4) {
      const { tl, tr, bl, br } = proj.plaque;
      const vx2 = proj.vp2.x;
      const vy2 = proj.vp2.y;
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.35;
      ctx.strokeStyle = "rgba(163, 61, 0, 0.78)";
      ctx.beginPath();
      for (const fromPt of [
        proj.vp2.side === "right" ? tl : tr,
        proj.vp2.side === "right" ? bl : br,
      ]) {
        const dx = vx2 - fromPt.x;
        const dy = vy2 - fromPt.y;
        const len = Math.hypot(dx, dy) || 1;
        const step = Math.min(len, W * 1.4);
        ctx.moveTo(fromPt.x, fromPt.y);
        ctx.lineTo(fromPt.x + (dx / len) * step, fromPt.y + (dy / len) * step);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      const multText =
        proj.metrics.vp2DistMultW > 99
          ? "VP2 >99×"
          : `VP2 ${proj.metrics.vp2DistMultW.toFixed(1)}×画宽`;
      const isRight = proj.vp2.side === "right";
      const labelText = isRight ? `${multText} →` : `← ${multText}`;
      const tw = 98;
      const th = 22;
      const bx = isRight ? W - tw - bw - 8 : bw + 8;
      // 计算上沿延长虚线在标签水平区间的最高位置，将 VP2 标牌稳放于虚线上方、远离视平线标注与牌匾
      const fromTop = isRight ? tl : tr;
      const tA = clamp((bx - fromTop.x) / (vx2 - fromTop.x || 1), 0, 1);
      const tB = clamp((bx + tw - fromTop.x) / (vx2 - fromTop.x || 1), 0, 1);
      const upperLineY = Math.min(
        fromTop.y + (vy2 - fromTop.y) * tA,
        fromTop.y + (vy2 - fromTop.y) * tB
      );
      const plaqueMinX = Math.min(tl.x, tr.x);
      const plaqueMaxX = Math.max(tl.x, tr.x);
      const overlapsPlaqueX = bx < plaqueMaxX + 6 && bx + tw > plaqueMinX - 6;
      const refTopY = overlapsPlaqueX ? Math.min(upperLineY, tl.y, tr.y) : upperLineY;
      const minTop = W < 520 ? 28 : 14;
      const by = clamp(Math.round(refTopY - th - 10), minTop, Math.round(proj.cy - th - 26));
      ctx.fillStyle = "#0F3D75";
      ctx.fillRect(bx, by, tw, th);
      ctx.fillStyle = "#FFB066";
      ctx.font = '700 11px "Outfit", "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labelText, bx + tw / 2, by + th / 2 + 0.5);
    }

    // 8. 视平线与汇聚线
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = highlightKey === "vp" ? 2.4 : 1.4;
    ctx.strokeStyle =
      highlightKey === "vp" ? "#FC750A" : `rgba(255, 255, 255, ${0.88 * ease})`;
    ctx.beginPath();
    ctx.moveTo(0, proj.cy);
    ctx.lineTo(W, proj.cy);
    ctx.stroke();
    ctx.setLineDash([]);

    if (highlightKey === "focus" || highlightKey === "guide" || proj.status.missionDone) {
      ctx.strokeStyle =
        highlightKey === "focus" || highlightKey === "guide"
          ? "rgba(252, 117, 10, 0.85)"
          : "rgba(252, 117, 10, 0.32)";
      ctx.lineWidth = highlightKey ? 1.8 : 1.1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      for (const pt of [
        proj.leftBays[0].ntl,
        proj.leftBays[0].nbl,
        proj.rightBays[0].ntl,
        proj.rightBays[0].nbl,
      ]) {
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(proj.vp1.x, proj.vp1.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 9. 前景信号橙引导三角
    const { arrow } = road;
    ctx.beginPath();
    ctx.moveTo(arrow.tip.x, arrow.tip.y);
    ctx.lineTo(arrow.right.x, arrow.right.y);
    ctx.lineTo(arrow.left.x, arrow.left.y);
    ctx.closePath();
    ctx.fillStyle = "#FC750A";
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // 10. 信号橙单消失点
    ctx.beginPath();
    ctx.arc(proj.vp1.x, proj.vp1.y, activeDrag === "vp" ? 17 : 14, 0, Math.PI * 2);
    ctx.strokeStyle =
      activeDrag === "vp" ? "rgba(252, 117, 10, 0.95)" : "rgba(252, 117, 10, 0.56)";
    ctx.lineWidth = activeDrag === "vp" ? 2.4 : 1.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(proj.vp1.x, proj.vp1.y, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = "#FC750A";
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();

    // 11. 标尺引线（视平线标注恒置视平线下方，彻底避开上方牌匾延长虚线与 VP2 标牌）
    if (ease >= 0.25 && W >= 460) {
      const hx = W - bw - 54;
      const hy = proj.cy;
      const labelY = hy + 26;
      ctx.strokeStyle = "#06111F";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx, labelY - 12);
      ctx.stroke();
      ctx.fillStyle = "#06111F";
      ctx.beginPath();
      ctx.arc(hx, hy, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = '700 12px "Noto Sans SC", sans-serif';
      ctx.fillText("视平线", hx, labelY);
      ctx.font = '500 10px "Outfit", sans-serif';
      ctx.fillText("HORIZON", hx, labelY + 13);
    }

    ctx.restore();
  }

  // ---------- 指针与触摸手势 ----------
  let vpStartX = 0;
  let vpStartShift = 0;

  vpHandle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    activeDrag = "vp";
    vpStartX = e.clientX;
    vpStartShift = state.shiftNorm;
    vpHandle.setPointerCapture(e.pointerId);
    vpHandle.dataset.dragging = "1";
    markDirty();
  });

  vpHandle.addEventListener("pointermove", (e) => {
    if (activeDrag !== "vp") return;
    const dx = e.clientX - vpStartX;
    state.shiftNorm = clampShiftForYaw(vpStartShift + dx / Math.max(120, W), state.yawDeg, W, H);
    markDirty();
  });

  const endVpDrag = () => {
    if (activeDrag !== "vp") return;
    activeDrag = null;
    vpHandle.dataset.dragging = "0";
    dirty = true;
    ctl.draw(); // 松手立即全量同步文字
  };
  vpHandle.addEventListener("pointerup", endVpDrag);
  vpHandle.addEventListener("pointercancel", endVpDrag);

  vpHandle.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.012 : 0.035;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.shiftNorm = clampShiftForYaw(state.shiftNorm - step, state.yawDeg, W, H);
      markDirty();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      state.shiftNorm = clampShiftForYaw(state.shiftNorm + step, state.yawDeg, W, H);
      markDirty();
    }
  });

  let yawStartX = 0;
  let yawStartY = 0;
  let yawStartDeg = 0;
  let yawIntentLocked = false;
  let yawPointerId = null;

  function beginYawDrag(e, forceImmediate) {
    if (e.target === vpHandle || vpHandle.contains(e.target)) return;
    yawStartX = e.clientX;
    yawStartY = e.clientY;
    yawStartDeg = state.yawDeg;
    yawIntentLocked = forceImmediate;
    yawPointerId = e.pointerId;
    if (forceImmediate) {
      e.preventDefault();
      activeDrag = "yaw";
      e.currentTarget.setPointerCapture(e.pointerId);
      stageEl.dataset.turning = "1";
      markDirty();
    }
  }

  function moveYawDrag(e) {
    if (yawPointerId !== e.pointerId) return;
    const dx = e.clientX - yawStartX;
    const dy = e.clientY - yawStartY;
    if (!yawIntentLocked) {
      if (Math.hypot(dx, dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.15) {
        yawPointerId = null;
        return;
      }
      yawIntentLocked = true;
      activeDrag = "yaw";
      stageEl.dataset.turning = "1";
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    }
    e.preventDefault();
    const degPerPx = 42 / Math.max(260, W);
    state.yawDeg = clamp(yawStartDeg + dx * degPerPx, YAW_MIN, YAW_MAX);
    state.shiftNorm = clampShiftForYaw(state.shiftNorm, state.yawDeg, W, H);
    markDirty();
  }

  function endYawDrag(e) {
    if (yawPointerId !== e.pointerId) return;
    yawPointerId = null;
    yawIntentLocked = false;
    if (activeDrag === "yaw") {
      activeDrag = null;
      stageEl.dataset.turning = "0";
      dirty = true;
      ctl.draw();
    }
  }

  for (const edgeBtn of [edgeLeftBtn, edgeRightBtn]) {
    edgeBtn.addEventListener("pointerdown", (e) => beginYawDrag(e, true));
    edgeBtn.addEventListener("pointermove", moveYawDrag);
    edgeBtn.addEventListener("pointerup", endYawDrag);
    edgeBtn.addEventListener("pointercancel", endYawDrag);
    edgeBtn.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 0.3 : 1.5;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        state.yawDeg = clamp(state.yawDeg - step, YAW_MIN, YAW_MAX);
        state.shiftNorm = clampShiftForYaw(state.shiftNorm, state.yawDeg, W, H);
        markDirty();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        state.yawDeg = clamp(state.yawDeg + step, YAW_MIN, YAW_MAX);
        state.shiftNorm = clampShiftForYaw(state.shiftNorm, state.yawDeg, W, H);
        markDirty();
      }
    });
  }

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const xRel = e.clientX - rect.left;
    beginYawDrag(e, xRel <= 44 || xRel >= rect.width - 44);
  });
  canvas.addEventListener("pointermove", moveYawDrag);
  canvas.addEventListener("pointerup", endYawDrag);
  canvas.addEventListener("pointercancel", endYawDrag);

  resetBtn.addEventListener("click", () => {
    state.yawDeg = INITIAL_STATE.yawDeg;
    state.shiftNorm = clampShiftForYaw(INITIAL_STATE.shiftNorm, INITIAL_STATE.yawDeg, W, H);
    markDirty();
  });

  if (keyPoints) {
    for (const kp of keyPoints) {
      kp.addEventListener("click", () => {
        highlightKey = kp.dataset.keypoint;
        clearTimeout(highlightTimer);
        markDirty();
        highlightTimer = setTimeout(() => {
          highlightKey = null;
          markDirty();
        }, 1800);
      });
    }
  }

  resize();
  const ctl = loop(stageEl, renderFrame);
  ctl.draw();

  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(stageEl);

  return {
    getState: () => ({ ...state }),
    getProjection: () => lastProj,
    setState(patch) {
      if (typeof patch.yawDeg === "number") state.yawDeg = clamp(patch.yawDeg, YAW_MIN, YAW_MAX);
      if (typeof patch.shiftNorm === "number") state.shiftNorm = patch.shiftNorm;
      state.shiftNorm = clampShiftForYaw(state.shiftNorm, state.yawDeg, W, H);
      markDirty();
    },
  };
}

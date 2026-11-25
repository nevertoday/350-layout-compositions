// 072 三点透视 · 五个正文交互实验台 + 首屏三点三角形雷达
import {
  clamp,
  DEG,
  focalFactors,
  projectPoint,
  sceneBoxes,
  THRESHOLDS,
  vanishingPoints,
} from "./model.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const MONO = "DM Mono, Noto Sans SC, monospace";
const SANS = "Noto Sans SC, sans-serif";

const el = (tag, attrs = {}) => {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
};

// ============================================================
// 0. 首屏右侧 · 三点三角形实时小雷达（呼应 072 海报右侧原理简图）
// ============================================================
export function createMiniRadar(svg) {
  const W = 220, H = 136;
  const cx = W / 2, cy = H / 2;
  const fw = 54, fh = 42;

  const vpFrame = svg.querySelector("#radar-frame");
  const triPoly = svg.querySelector("#radar-tri");
  const hlLine = svg.querySelector("#radar-hl");
  const altLine = svg.querySelector("#radar-alt");
  const dotL = svg.querySelector("#radar-vl");
  const dotR = svg.querySelector("#radar-vr");
  const dotV = svg.querySelector("#radar-vv");
  const lblV = svg.querySelector("#radar-vv-lbl");
  // 修复：#radar-cap 在 <figure> 内、<svg> 之外
  const cap = document.getElementById("radar-cap");

  if (vpFrame) {
    vpFrame.setAttribute("x", String(cx - fw / 2));
    vpFrame.setAttribute("y", String(cy - fh / 2));
    vpFrame.setAttribute("width", String(fw));
    vpFrame.setAttribute("height", String(fh));
  }

  // 非线性压缩：画内严格等比，画外对数压近，保证长焦消失点仍能在雷达里读出方位
  const mapCoord = (norm, span) => {
    const d = norm - 0.5;
    const sign = Math.sign(d);
    const mag = Math.abs(d);
    const mapped = mag <= 0.5 ? mag : 0.5 + Math.log1p((mag - 0.5) * 1.45) * 0.62;
    return sign * mapped * span;
  };

  function update(vps) {
    const lx = clamp(cx + mapCoord(vps.left.infinite ? -8 : vps.left.u, fw), 10, W - 10);
    const rx = clamp(cx + mapCoord(vps.right.infinite ? 9 : vps.right.u, fw), 10, W - 10);
    const hly = clamp(cy + mapCoord(vps.hlV, fh), 16, H - 16);

    hlLine.setAttribute("x1", "8");
    hlLine.setAttribute("x2", String(W - 8));
    hlLine.setAttribute("y1", hly.toFixed(1));
    hlLine.setAttribute("y2", hly.toFixed(1));

    dotL.setAttribute("cx", lx.toFixed(1));
    dotL.setAttribute("cy", hly.toFixed(1));
    dotR.setAttribute("cx", rx.toFixed(1));
    dotR.setAttribute("cy", hly.toFixed(1));

    if (vps.isLevel) {
      triPoly.setAttribute("points", "");
      altLine.setAttribute("x1", String(cx));
      altLine.setAttribute("y1", "16");
      altLine.setAttribute("x2", String(cx));
      altLine.setAttribute("y2", String(H - 12));
      dotV.setAttribute("opacity", "0");
      lblV.textContent = "VP → ∞";
      lblV.setAttribute("x", String(cx + 8));
      lblV.setAttribute("y", "16");
      if (cap) cap.textContent = "平视两点 · 第三点退至无穷远";
      return;
    }

    const vx = cx;
    const vy = clamp(cy + mapCoord(vps.vertical.v, fh), 14, H - 14);
    dotV.setAttribute("opacity", "1");
    dotV.setAttribute("cx", vx.toFixed(1));
    dotV.setAttribute("cy", vy.toFixed(1));
    triPoly.setAttribute("points", `${lx.toFixed(1)},${hly.toFixed(1)} ${rx.toFixed(1)},${hly.toFixed(1)} ${vx.toFixed(1)},${vy.toFixed(1)}`);
    altLine.setAttribute("x1", vx.toFixed(1));
    altLine.setAttribute("y1", vy.toFixed(1));
    altLine.setAttribute("x2", vx.toFixed(1));
    altLine.setAttribute("y2", hly.toFixed(1));

    lblV.textContent = vps.vertical.label;
    lblV.setAttribute("x", String(vx + 8));
    lblV.setAttribute("y", String(vy < cy ? Math.max(13, vy + 3) : Math.min(H - 6, vy + 3)));

    if (cap) {
      cap.textContent = vps.vertical.dir === "up"
        ? "正立锐角三角 · 垂心 = 画心"
        : "倒立锐角三角 · 俯视 VP↓ 在底";
    }
  }

  return { update };
}

// ============================================================
// 1. 第 02 节 · 仰视 / 平视 / 俯视光学侧剖图（直接上下拖相机滑轨 + 三档视角）
// ============================================================
export function initTiltLab() {
  const svg = document.getElementById("tilt-svg");
  const degOut = document.getElementById("tilt-deg");
  const stateOut = document.getElementById("tilt-state");
  const descOut = document.getElementById("tilt-desc");
  const btns = [...document.querySelectorAll("[data-tilt-preset]")];
  const nudgeBtns = [...document.querySelectorAll("[data-tilt-nudge]")];
  if (!svg) return;

  const camGroup = svg.querySelector("#tilt-cam");
  const rayTop = svg.querySelector("#tilt-ray-top");
  const rayMid = svg.querySelector("#tilt-ray-mid");
  const rayBot = svg.querySelector("#tilt-ray-bot");
  const sensorLine = svg.querySelector("#tilt-sensor");
  const railHit = svg.querySelector("#tilt-rail-hit");
  const picHL = svg.querySelector("#pic-hl");
  const picLeft = svg.querySelector("#pic-left");
  const picRight = svg.querySelector("#pic-right");
  const picEdge = svg.querySelector("#pic-edge");
  const picVpDot = svg.querySelector("#pic-vp-dot");
  const picVpBg = svg.querySelector("#pic-vp-bg");
  const picVpTxt = svg.querySelector("#pic-vp-txt");
  const picRays = svg.querySelector("#pic-rays");

  let curDeg = 36;
  const MIN_DEG = -48;
  const MAX_DEG = 48;
  const RAIL_TOP = 92;
  const RAIL_BOT = 236;
  const RAIL_MID = (RAIL_TOP + RAIL_BOT) / 2;

  function draw(deg) {
    curDeg = clamp(Math.round(deg), MIN_DEG, MAX_DEG);
    svg.setAttribute("data-deg", String(curDeg));
    const rad = curDeg * DEG;
    const isLevel = Math.abs(curDeg) < THRESHOLDS.levelEps;

    // 左侧光学剖面图：塔墙 x = 246, y ∈ [58, 266]；相机沿 x = 86 升降滑轨移动
    const cy = RAIL_MID + (curDeg / 48) * ((RAIL_BOT - RAIL_TOP) / 2);
    const cx = 86;
    const wallX = 246;
    const wallTop = 58, wallBot = 266;

    camGroup.setAttribute("transform", `translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) rotate(${(-curDeg).toFixed(1)})`);

    // 感光面（镜头后方 18px，垂直于光轴）
    const nx = Math.cos(rad), ny = -Math.sin(rad);
    const sx = -ny, sy = nx;
    const scx = cx - nx * 18, scy = cy - ny * 18;
    sensorLine.setAttribute("x1", (scx - sx * 22).toFixed(1));
    sensorLine.setAttribute("y1", (scy - sy * 22).toFixed(1));
    sensorLine.setAttribute("x2", (scx + sx * 22).toFixed(1));
    sensorLine.setAttribute("y2", (scy + sy * 22).toFixed(1));

    rayTop.setAttribute("d", `M ${wallX} ${wallTop} L ${cx.toFixed(1)} ${cy.toFixed(1)}`);
    rayMid.setAttribute("d", `M ${wallX} ${(wallTop + wallBot) / 2} L ${cx.toFixed(1)} ${cy.toFixed(1)}`);
    rayBot.setAttribute("d", `M ${wallX} ${wallBot} L ${cx.toFixed(1)} ${cy.toFixed(1)}`);

    // 右侧成像画框：顶部标题带 y=14..42，绘图区 y ∈ [48, 286]，绝不撞字
    const rx0 = 344, rw = 272, ry0 = 48, rh = 238;
    const rcx = rx0 + rw / 2;
    const rcy = ry0 + rh / 2;

    const hlY = clamp(rcy + Math.tan(rad) * (rh * 0.44) * 0.85, ry0 + 18, ry0 + rh - 18);
    picHL.setAttribute("y1", hlY.toFixed(1));
    picHL.setAttribute("y2", hlY.toFixed(1));

    const taper = Math.sin(rad) * 0.56;
    const baseHalf = 62;
    const topHalf = baseHalf * (1 - taper);
    const botHalf = baseHalf * (1 + taper);
    const bTop = ry0 + (curDeg >= 0 ? 54 : 34);
    const bBot = ry0 + rh - (curDeg >= 0 ? 32 : 54);

    const midTopY = bTop - (curDeg >= 0 ? 11 : -10);
    const midBotY = bBot + (curDeg >= 0 ? -11 : 11);

    const lPts = `${(rcx - topHalf).toFixed(1)},${bTop} ${rcx},${midTopY} ${rcx},${midBotY} ${(rcx - botHalf).toFixed(1)},${bBot}`;
    const rPts = `${rcx},${midTopY} ${(rcx + topHalf * 0.86).toFixed(1)},${bTop + 3} ${(rcx + botHalf * 0.86).toFixed(1)},${bBot - 3} ${rcx},${midBotY}`;
    picLeft.setAttribute("points", lPts);
    picRight.setAttribute("points", rPts);
    picEdge.setAttribute("x1", String(rcx));
    picEdge.setAttribute("y1", String(midTopY));
    picEdge.setAttribute("x2", String(rcx));
    picEdge.setAttribute("y2", String(midBotY));

    const setVpBadge = (txt, x, y) => {
      picVpTxt.textContent = txt;
      picVpTxt.setAttribute("x", x.toFixed(1));
      picVpTxt.setAttribute("y", y.toFixed(1));
      if (picVpBg) {
        const w = Math.max(96, txt.length * 10 + 14);
        picVpBg.setAttribute("x", (x - w / 2).toFixed(1));
        picVpBg.setAttribute("y", (y - 12).toFixed(1));
        picVpBg.setAttribute("width", String(w));
        picVpBg.setAttribute("height", "18");
      }
    };

    if (isLevel) {
      picVpDot.setAttribute("opacity", "0");
      setVpBadge("VP → ∞（竖线平行）", rcx, ry0 + 16);
      picRays.setAttribute(
        "d",
        `M ${(rcx - topHalf).toFixed(1)} ${ry0 + 24} V ${ry0 + rh - 8} M ${(rcx + topHalf * 0.86).toFixed(1)} ${ry0 + 24} V ${ry0 + rh - 8}`,
      );
    } else {
      const slopeL = (bBot - bTop) / ((rcx - botHalf) - (rcx - topHalf));
      const vpYRaw = bTop + slopeL * (rcx - (rcx - topHalf));
      const vpY = clamp(vpYRaw, ry0 + 18, ry0 + rh - 18);
      const inBox = vpYRaw >= ry0 + 14 && vpYRaw <= ry0 + rh - 14;
      picVpDot.setAttribute("opacity", inBox ? "1" : "0.5");
      picVpDot.setAttribute("cx", String(rcx));
      picVpDot.setAttribute("cy", vpY.toFixed(1));

      const label = curDeg > 0
        ? (inBox ? "VP↑ 天顶消失点" : "VP↑ 在画框上方")
        : (inBox ? "VP↓ 天底消失点" : "VP↓ 在画框下方");
      const badgeY = curDeg > 0 ? Math.max(ry0 + 16, vpY - 8) : Math.min(ry0 + rh - 6, vpY + 15);
      setVpBadge(label, rcx, badgeY);

      // 仰视从底角连向 VP↑；俯视从顶角穿过底角连向 VP↓
      if (curDeg > 0) {
        picRays.setAttribute(
          "d",
          `M ${(rcx - botHalf).toFixed(1)} ${bBot} L ${rcx} ${vpY.toFixed(1)} M ${(rcx + botHalf * 0.86).toFixed(1)} ${bBot - 3} L ${rcx} ${vpY.toFixed(1)}`,
        );
      } else {
        picRays.setAttribute(
          "d",
          `M ${(rcx - topHalf).toFixed(1)} ${bTop} L ${rcx} ${vpY.toFixed(1)} M ${(rcx + topHalf * 0.86).toFixed(1)} ${bTop + 3} L ${rcx} ${vpY.toFixed(1)}`,
        );
      }
    }

    degOut.textContent = `${curDeg > 0 ? "+" : ""}${curDeg}°`;
    if (railHit) railHit.setAttribute("aria-valuenow", String(curDeg));

    if (isLevel) {
      stateOut.textContent = "感光面平行于墙面 · 退回两点透视";
      descOut.textContent = "此时画幅（感光面）与建筑垂直面严格平行，楼顶和楼底到画幅的投影缩放比沿竖向一致，所以垂直线永不相交。";
    } else if (curDeg > 0) {
      stateOut.textContent = curDeg <= THRESHOLDS.awkwardMax ? "微仰歪楼区 · 竖线轻斜" : "仰视三点 · 崇高与压迫";
      descOut.textContent = curDeg <= THRESHOLDS.awkwardMax
        ? `镜头只抬起 +${curDeg}°（落在 2°–${THRESHOLDS.awkwardMax}° 微仰区），感光面已不再平行墙面，但收束幅度太弱，像建筑往后仰倒。`
        : "感光面大幅后仰，建筑顶部比底部离感光面远得多，两侧竖线直指天顶消失点 VP↑——把体量和威严推向极点。";
    } else {
      stateOut.textContent = Math.abs(curDeg) <= THRESHOLDS.awkwardMax ? "微俯失稳区 · 上宽下窄" : "俯视三点 · 失重与深渊";
      descOut.textContent = Math.abs(curDeg) <= THRESHOLDS.awkwardMax
        ? "略微低头让墙体顶部变宽、底部变窄，楼身开始显得不稳定。"
        : "感光面朝下倾斜，建筑底部远小于屋顶，垂直线向下汇聚至天底消失点 VP↓——观众立刻生出临渊失重感。";
    }

    for (const b of btns) {
      b.setAttribute("aria-pressed", String(Math.abs(Number(b.dataset.tiltPreset) - curDeg) <= 2));
    }
  }

  // 直接拖动左侧光学滑轨上的相机升降
  function degFromPointer(e) {
    const r = svg.getBoundingClientRect();
    const svgY = ((e.clientY - r.top) / r.height) * 310;
    const ratio = clamp((svgY - RAIL_TOP) / (RAIL_BOT - RAIL_TOP), 0, 1);
    return MIN_DEG + ratio * (MAX_DEG - MIN_DEG);
  }

  if (railHit) {
    let dragging = false;
    railHit.addEventListener("pointerdown", (e) => {
      dragging = true;
      try { railHit.setPointerCapture(e.pointerId); } catch {}
      draw(degFromPointer(e));
    });
    railHit.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      draw(degFromPointer(e));
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(curDeg) <= 3) draw(0);
    };
    railHit.addEventListener("pointerup", end);
    railHit.addEventListener("pointercancel", end);
    railHit.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") { e.preventDefault(); draw(curDeg - 6); }
      else if (e.key === "ArrowDown") { e.preventDefault(); draw(curDeg + 6); }
    });
  }

  for (const b of btns) {
    b.addEventListener("click", () => draw(Number(b.dataset.tiltPreset)));
  }
  for (const b of nudgeBtns) {
    b.addEventListener("click", () => draw(curDeg + Number(b.dataset.tiltNudge)));
  }
  draw(curDeg);
}

// ============================================================
// 2. 第 03 节 · 三点三角形垂心定理 & 60° 视觉锥畸变实验台
// ============================================================
export function initTriangleLab() {
  const spreadRange = document.getElementById("tri-spread");
  const svg = document.getElementById("tri-svg");
  const readFocal = document.getElementById("tri-focal-out");
  const readCone = document.getElementById("tri-cone-out");
  const readVerdict = document.getElementById("tri-verdict");
  const presets = [...document.querySelectorAll("[data-tri-preset]")];
  const pitchChips = [...document.querySelectorAll("[data-tri-pitch-chip]")];
  if (!spreadRange || !svg) return;

  const W = 640, H = 360;
  const cx = W / 2, cy = H / 2;

  const coneCircle = svg.querySelector("#tri-cone");
  const frameRect = svg.querySelector("#tri-frame");
  const poly = svg.querySelector("#tri-poly");
  const alts = svg.querySelector("#tri-alts");
  const bldgGroup = svg.querySelector("#tri-bldg");
  const vpLayer = svg.querySelector("#tri-vp-layer");

  let curPitch = 36;

  function draw() {
    const focalMm = Number(spreadRange.value);
    const pitchDeg = curPitch;
    const theta = pitchDeg * DEG;
    const phi = 44 * DEG;

    const fw = 128, fh = 170;
    frameRect.setAttribute("x", String(cx - fw / 2));
    frameRect.setAttribute("y", String(cy - fh / 2));
    frameRect.setAttribute("width", String(fw));
    frameRect.setAttribute("height", String(fh));

    // 与开场、练习严格共用 model.js 的真实 35 mm 针孔函数（短边 = 24 mm → fPx = (fw / 2) * fx）
    const { fx, hFov } = focalFactors(focalMm, fw / fh);
    const fPx = (fw / 2) * fx;
    const coneR = fPx * Math.tan(30 * DEG);
    coneCircle.setAttribute("r", Math.min(340, coneR).toFixed(1));

    // 精确垂心几何：主点 PP = (cx, cy) 必为 △ VP← VP→ VP↑ 的垂心
    const hlY = cy + Math.tan(theta) * fPx;
    const lx = cx - (Math.cos(phi) / Math.sin(phi) / Math.cos(theta)) * fPx;
    const rx = cx + (Math.sin(phi) / Math.cos(phi) / Math.cos(theta)) * fPx;
    const vx = cx;
    const vy = cy - (1 / Math.tan(theta)) * fPx;

    const foot = (px, py, ax, ay, bx, by) => {
      const dx = bx - ax, dy = by - ay;
      const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
      return [ax + dx * t, ay + dy * t];
    };
    const fL = foot(lx, hlY, rx, hlY, vx, vy);
    const fR = foot(rx, hlY, lx, hlY, vx, vy);

    poly.setAttribute("points", `${lx.toFixed(1)},${hlY.toFixed(1)} ${rx.toFixed(1)},${hlY.toFixed(1)} ${vx.toFixed(1)},${vy.toFixed(1)}`);
    alts.setAttribute(
      "d",
      `M ${vx.toFixed(1)} ${vy.toFixed(1)} L ${vx.toFixed(1)} ${hlY.toFixed(1)} ` +
      `M ${lx.toFixed(1)} ${hlY.toFixed(1)} L ${fL[0].toFixed(1)} ${fL[1].toFixed(1)} ` +
      `M ${rx.toFixed(1)} ${hlY.toFixed(1)} L ${fR[0].toFixed(1)} ${fR[1].toFixed(1)}`,
    );

    // 消失点标记：在画板内直画圆点；出画板外则在射线出界处贴边标注方向与距离，不再错位卡边
    vpLayer.innerHTML = "";
    const drawBoardVp = (x, y, tag, hint) => {
      const pad = 16;
      const inside = x >= pad && x <= W - pad && y >= pad && y <= H - pad;
      if (inside) {
        vpLayer.append(el("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: "4.5", fill: "#c3e54b" }));
        const tx = hint === "r" ? x - 10 : x + 10;
        const ty = hint === "v" ? Math.max(16, y + 4) : Math.min(H - 8, y - 8);
        const anchor = hint === "r" ? "end" : "start";
        const t = el("text", { x: tx.toFixed(1), y: ty.toFixed(1), fill: "#c3e54b", "text-anchor": anchor, "font-family": MONO, "font-size": "11", "font-weight": "600" });
        t.textContent = tag;
        vpLayer.append(t);
      } else {
        // 求从 (cx, cy) 指向 (x, y) 射线与画板边界的交点
        const dx = x - cx, dy = y - cy;
        const tx = dx !== 0 ? ((dx > 0 ? W - 44 : 44) - cx) / dx : 1e9;
        const ty = dy !== 0 ? ((dy > 0 ? H - 16 : 16) - cy) / dy : 1e9;
        const k = Math.min(Math.abs(tx), Math.abs(ty));
        const bx = clamp(cx + dx * k, 46, W - 46);
        const by = clamp(cy + dy * k, 16, H - 16);
        const text = `${tag} 图外`;
        vpLayer.append(
          el("rect", { x: (bx - 36).toFixed(1), y: (by - 10).toFixed(1), width: "72", height: "20", fill: "#101110", stroke: "#c3e54b", "stroke-opacity": "0.65" }),
        );
        const t = el("text", { x: bx.toFixed(1), y: (by + 4).toFixed(1), fill: "#c3e54b", "text-anchor": "middle", "font-family": MONO, "font-size": "10", "font-weight": "600" });
        t.textContent = text;
        vpLayer.append(t);
      }
    };
    drawBoardVp(lx, hlY, "VP←", "l");
    drawBoardVp(rx, hlY, "VP→", "r");
    drawBoardVp(vx, vy, "VP↑", "v");

    // 3:4 画框内按真实三点连线切出楼体轮廓
    const botY = cy + fh * 0.34;
    const topY = cy - fh * 0.34;
    const lerpPt = (ax, ay, bx, by, t) => [ax + (bx - ax) * t, ay + (by - ay) * t];
    const spanRatio = clamp(42 / Math.max(40, Math.abs(cx - lx)), 0.14, 0.56);
    const [blx, bly] = lerpPt(cx, botY, lx, hlY, spanRatio);
    const [brx, bry] = lerpPt(cx, botY, rx, hlY, spanRatio * 0.92);
    const vFrac = clamp((botY - topY) / Math.max(20, botY - vy), 0.15, 0.84);
    const [tlx, tly] = lerpPt(blx, bly, vx, vy, vFrac);
    const [trx, tryy] = lerpPt(brx, bry, vx, vy, vFrac);

    bldgGroup.innerHTML = "";
    bldgGroup.append(
      el("polygon", { points: `${blx.toFixed(1)},${bly.toFixed(1)} ${cx},${botY} ${cx},${topY} ${tlx.toFixed(1)},${tly.toFixed(1)}`, fill: "#3e423e", stroke: "#f4f5f0", "stroke-width": "1.1" }),
      el("polygon", { points: `${cx},${botY} ${brx.toFixed(1)},${bry.toFixed(1)} ${trx.toFixed(1)},${tryy.toFixed(1)} ${cx},${topY}`, fill: "#1d1f1d", stroke: "#f4f5f0", "stroke-width": "1.1" }),
    );

    const spreadMult = ((rx - lx) / fw).toFixed(1);
    const halfDiag = Math.hypot(fw / 2, fh / 2);
    // 严格与画板上的 60° 虚线圆对齐：虚线圆彻底包住白框四角才算「视觉锥内」（3:4 竖幅对应 ≥ 35 mm）
    const inCone = coneR >= halfDiag;
    const allInFrame = lx > cx - fw / 2 && rx < cx + fw / 2 && vy > cy - fh / 2 && hlY < cy + fh / 2;

    readFocal.textContent = `${focalMm} mm（短边 ${Math.round(hFov)}°）· 仰角 +${pitchDeg}°`;
    readCone.textContent = `VP← 到 VP→ 间距 ${spreadMult}× 画框宽`;

    if (allInFrame) {
      readVerdict.textContent = `三枚消失点全部挤进 3:4 纸面（${focalMm} mm，短边视角约 ${Math.round(hFov)}°）：白框大幅冲出 60° 视觉锥，楼角呈尖锐楔形。072 号原海报为了让读者一眼看见全部三个消失点，正是这种超出常规实拍镜头的教学夸大。`;
    } else if (!inCone && focalMm <= THRESHOLDS.ultraWideMax) {
      readVerdict.textContent = `实拍超广角区（${focalMm} mm，左右点间距 ${spreadMult}×）：白框四角仍大幅冲出 60° 视觉锥，左右消失点已退到纸外（可见真实 14 mm 也很难让三点同框），楼角拉尖、视觉冲击极强。`;
    } else if (!inCone) {
      readVerdict.textContent = `白框四角仍略超出 60° 视觉锥，左右消失点已退到画框外（间距 ${spreadMult}×）：冲击力强且保住建筑结构，是漫画与海报常用的广角甜点区。`;
    } else {
      readVerdict.textContent = `整个 3:4 白框已完整落进 60° 视觉锥圆内（≥35 mm，左右消失点间距 ${spreadMult}×）：三点收束自然真实，没有尖嘴拉伸，适合建筑表现图与写实镜头。`;
    }

    for (const p of presets) {
      p.setAttribute("aria-pressed", String(Number(p.dataset.triFocal) === focalMm && Number(p.dataset.triPitch) === curPitch));
    }
    for (const c of pitchChips) {
      c.setAttribute("aria-pressed", String(Number(c.dataset.triPitchChip) === curPitch));
    }
  }

  spreadRange.addEventListener("input", draw);
  for (const p of presets) {
    p.addEventListener("click", () => {
      spreadRange.value = p.dataset.triFocal;
      curPitch = Number(p.dataset.triPitch);
      draw();
    });
  }
  for (const c of pitchChips) {
    c.addEventListener("click", () => {
      curPitch = Number(c.dataset.triPitchChip);
      draw();
    });
  }
  draw();
}

// ============================================================
// 3. 第 05 节 · 五步绘制三点透视施工图纸（还原海报绘制步骤 ①–⑤）
// ============================================================
const STEP_META = [
  {
    n: 1,
    title: "① 确定视平线（HL）位置",
    up: "仰视时把视平线压到画面下方约 15% 处，腾出上方大片天空给楼体拔高。",
    down: "俯视时把视平线推到画面上方约 15% 处，把下方大片深渊空间留给建筑坠落。",
  },
  {
    n: 2,
    title: "② 确定左右消失点（VP← / VP→）",
    up: "在视平线左右两端定下 VP← 与 VP→。实战画图建议拉到纸外，避免墙角过尖。",
    down: "同样落在上方视平线的左右两端，负责控制屋顶与每一层窗沿的水平收束。",
  },
  {
    n: 3,
    title: "③ 确定垂直消失点（VP↑ / VP↓）",
    up: "在画面顶部中轴定下第三消失点 VP↑，它决定了建筑向天空收尖的剧烈程度。",
    down: "在画面底部中轴定下天底消失点 VP↓，所有立柱和垂线都会朝它下坠。",
  },
  {
    n: 4,
    title: "④ 从三点拉出结构引导线与顶点",
    up: "先定前景最靠近你的那条中棱，再用尺子从三个消失点分别连线切出左右两面墙。",
    down: "先定屋顶最靠近你的尖角与前沿，再从 VP←、VP→ 切出屋顶面，从 VP↓ 切出垂直墙体。",
  },
  {
    n: 5,
    title: "⑤ 补全幕墙网格与明暗体积",
    up: "沿三向射线加密玻璃幕墙窗格，并拉开左亮右暗的明暗对比，三维体量立刻站起来。",
    down: "屋顶受光最亮，两侧垂直玻璃幕墙一灰一暗且向下渐隐，瞬间撑出高空纵深。",
  },
];

export function initStepLab() {
  const svg = document.getElementById("step-svg");
  const btns = [...document.querySelectorAll("[data-step-btn]")];
  const prevBtn = document.getElementById("step-prev");
  const nextBtn = document.getElementById("step-next");
  const dirBtns = [...document.querySelectorAll("[data-step-dir]")];
  const titleEl = document.getElementById("step-title");
  const bodyEl = document.getElementById("step-body");
  if (!svg || !btns.length) return;

  let curStep = 5;
  let dir = "up";

  function draw() {
    svg.setAttribute("data-step", String(curStep));
    svg.setAttribute("data-dir", dir);
    const W = 600, H = 360;
    const isUp = dir === "up";

    const hlY = isUp ? 306 : 54;
    const vpLx = 54, vpRx = 546;
    const vpVx = 300, vpVy = isUp ? 36 : 324;

    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const vpL = [vpLx, hlY], vpR = [vpRx, hlY], vpV = [vpVx, vpVy];

    const fA = isUp ? [300, 264] : [300, 126];
    const fB = isUp ? [300, 92] : [300, 286];

    const lA = lerp(fA, vpL, 0.44);
    const rA = lerp(fA, vpR, 0.40);
    const intersect = (p1, p2, p3, p4) => {
      const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
      const px = ((p1[0] * p2[1] - p1[1] * p2[0]) * (p3[0] - p4[0]) - (p1[0] - p2[0]) * (p3[0] * p4[1] - p3[1] * p4[0])) / d;
      const py = ((p1[0] * p2[1] - p1[1] * p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] * p4[1] - p3[1] * p4[0])) / d;
      return [px, py];
    };
    const lB = intersect(lA, vpV, fB, vpL);
    const rB = intersect(rA, vpV, fB, vpR);
    const backCorner = isUp ? null : intersect(lA, vpR, rA, vpL);

    const g = [];
    if (curStep >= 1) {
      g.push(`<line x1="16" y1="${hlY}" x2="${W - 16}" y2="${hlY}" stroke="#c3e54b" stroke-width="1.2" stroke-dasharray="5 5" opacity="${curStep === 1 ? 1 : 0.48}"/>`);
      const hlLblY = isUp ? hlY - 12 : hlY + 20;
      g.push(`<rect x="18" y="${hlLblY - 11}" width="64" height="16" fill="#0d0e0d" fill-opacity="0.88"/>`);
      g.push(`<text x="22" y="${hlLblY}" fill="#c3e54b" font-family="${MONO}" font-size="11">HL 视平线</text>`);
    }
    if (curStep >= 2) {
      for (const [x, label, align, dx] of [[vpLx, "VP←", "start", 12], [vpRx, "VP→", "end", -12]]) {
        g.push(`<circle cx="${x}" cy="${hlY}" r="5" fill="#c3e54b"/>`);
        g.push(`<circle cx="${x}" cy="${hlY}" r="11" fill="none" stroke="#c3e54b" stroke-opacity="0.45"/>`);
        g.push(`<text x="${x + dx}" y="${isUp ? hlY + 22 : hlY - 14}" fill="#c3e54b" text-anchor="${align}" font-family="${MONO}" font-size="11">${label}</text>`);
      }
    }
    if (curStep >= 3) {
      g.push(`<line x1="${vpVx}" y1="${hlY}" x2="${vpVx}" y2="${vpVy}" stroke="#c3e54b" stroke-width="1" stroke-dasharray="3 5" opacity="0.32"/>`);
      g.push(`<circle cx="${vpVx}" cy="${vpVy}" r="5.5" fill="#c3e54b"/>`);
      g.push(`<circle cx="${vpVx}" cy="${vpVy}" r="12" fill="none" stroke="#c3e54b" stroke-opacity="0.5"/>`);
      g.push(`<text x="${vpVx + 16}" y="${vpVy + 4}" fill="#c3e54b" font-family="${MONO}, ${SANS}" font-size="11">${isUp ? "VP↑ 上方消失点" : "VP↓ 下方消失点"}</text>`);
    }
    if (curStep >= 4) {
      const rays = [
        [fA, vpL], [fB, vpL], [fA, vpR], [fB, vpR],
        [lA, vpV], [rA, vpV], [fA, vpV],
      ];
      if (backCorner) rays.push([lA, vpR], [rA, vpL]);
      for (const [p, q] of rays) {
        g.push(`<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="#c3e54b" stroke-width="1" stroke-dasharray="4 4" opacity="0.52"/>`);
      }
    }
    if (curStep >= 5) {
      g.push(`<polygon points="${fA[0]},${fA[1]} ${lA[0].toFixed(1)},${lA[1].toFixed(1)} ${lB[0].toFixed(1)},${lB[1].toFixed(1)} ${fB[0]},${fB[1]}" fill="#3b3f3b"/>`);
      g.push(`<polygon points="${fA[0]},${fA[1]} ${rA[0].toFixed(1)},${rA[1].toFixed(1)} ${rB[0].toFixed(1)},${rB[1].toFixed(1)} ${fB[0]},${fB[1]}" fill="#191b1a"/>`);
      if (backCorner) {
        g.push(`<polygon points="${fA[0]},${fA[1]} ${lA[0].toFixed(1)},${lA[1].toFixed(1)} ${backCorner[0].toFixed(1)},${backCorner[1].toFixed(1)} ${rA[0].toFixed(1)},${rA[1].toFixed(1)}" fill="#525752"/>`);
      }
      for (let i = 1; i <= 7; i++) {
        const t = i / 8;
        const m = lerp(fA, fB, t);
        const ml = intersect(m, vpL, lA, lB);
        const mr = intersect(m, vpR, rA, rB);
        g.push(`<line x1="${m[0].toFixed(1)}" y1="${m[1].toFixed(1)}" x2="${ml[0].toFixed(1)}" y2="${ml[1].toFixed(1)}" stroke="#cfd4cb" stroke-width="0.7" opacity="0.45"/>`);
        g.push(`<line x1="${m[0].toFixed(1)}" y1="${m[1].toFixed(1)}" x2="${mr[0].toFixed(1)}" y2="${mr[1].toFixed(1)}" stroke="#cfd4cb" stroke-width="0.7" opacity="0.32"/>`);
      }
      for (let j = 1; j <= 3; j++) {
        const t = j / 4;
        const la = lerp(fA, lA, t), lb = intersect(la, vpV, fB, lB);
        const ra = lerp(fA, rA, t), rb = intersect(ra, vpV, fB, rB);
        g.push(`<line x1="${la[0].toFixed(1)}" y1="${la[1].toFixed(1)}" x2="${lb[0].toFixed(1)}" y2="${lb[1].toFixed(1)}" stroke="#cfd4cb" stroke-width="0.7" opacity="0.42"/>`);
        g.push(`<line x1="${ra[0].toFixed(1)}" y1="${ra[1].toFixed(1)}" x2="${rb[0].toFixed(1)}" y2="${rb[1].toFixed(1)}" stroke="#cfd4cb" stroke-width="0.7" opacity="0.28"/>`);
      }
    }
    if (curStep >= 4) {
      const strokeW = curStep === 4 ? 1.8 : 1.5;
      g.push(`<polyline points="${lB[0].toFixed(1)},${lB[1].toFixed(1)} ${lA[0].toFixed(1)},${lA[1].toFixed(1)} ${fA[0]},${fA[1]} ${rA[0].toFixed(1)},${rA[1].toFixed(1)} ${rB[0].toFixed(1)},${rB[1].toFixed(1)} ${fB[0]},${fB[1]} ${lB[0].toFixed(1)},${lB[1].toFixed(1)}" fill="none" stroke="#f4f5f0" stroke-width="${strokeW}"/>`);
      g.push(`<line x1="${fA[0]}" y1="${fA[1]}" x2="${fB[0]}" y2="${fB[1]}" stroke="#f4f5f0" stroke-width="${strokeW + 0.3}"/>`);
      if (backCorner) {
        g.push(`<polyline points="${lA[0].toFixed(1)},${lA[1].toFixed(1)} ${backCorner[0].toFixed(1)},${backCorner[1].toFixed(1)} ${rA[0].toFixed(1)},${rA[1].toFixed(1)}" fill="none" stroke="#f4f5f0" stroke-width="${strokeW}"/>`);
      }
    }

    svg.innerHTML = g.join("");

    const meta = STEP_META[curStep - 1];
    titleEl.textContent = meta.title;
    bodyEl.textContent = isUp ? meta.up : meta.down;
    for (const b of btns) {
      b.setAttribute("aria-pressed", String(Number(b.dataset.stepBtn) === curStep));
    }
    for (const d of dirBtns) {
      d.setAttribute("aria-pressed", String(d.dataset.stepDir === dir));
    }
    if (prevBtn) prevBtn.disabled = curStep <= 1;
    if (nextBtn) nextBtn.disabled = curStep >= 5;
  }

  for (const b of btns) b.addEventListener("click", () => { curStep = Number(b.dataset.stepBtn); draw(); });
  for (const d of dirBtns) d.addEventListener("click", () => { dir = d.dataset.stepDir; draw(); });
  if (prevBtn) prevBtn.addEventListener("click", () => { if (curStep > 1) { curStep--; draw(); } });
  if (nextBtn) nextBtn.addEventListener("click", () => { if (curStep < 5) { curStep++; draw(); } });
  draw();
}

// ============================================================
// 4. 第 06 节 · 1962 PC-Nikkor 移轴矫正实验（消除不需要的第三消失点）
// ============================================================
export function initShiftLab() {
  const range = document.getElementById("shift-range");
  const svg = document.getElementById("shift-svg");
  const modeOut = document.getElementById("shift-mode");
  const descOut = document.getElementById("shift-desc");
  // 修复：#shift-lens-offset 在 .lab-bar 中、不在 #shift-svg 内
  const lensShift = document.getElementById("shift-lens-offset");
  if (!range || !svg) return;

  const facade = svg.querySelector("#shift-facade");
  const grid = svg.querySelector("#shift-grid");
  const guides = svg.querySelector("#shift-guides");

  function draw(val) {
    const k = val / 100;
    const tiltLeft = (1 - k) * 34;
    const xLBot = 178, xRBot = 422;
    const xLTop = xLBot + tiltLeft;
    const xRTop = xRBot - tiltLeft;
    const yTop = 38, yBot = 258;

    facade.setAttribute("points", `${xLTop.toFixed(1)},${yTop} ${xRTop.toFixed(1)},${yTop} ${xRBot},${yBot} ${xLBot},${yBot}`);

    const lines = [];
    for (let r = 1; r <= 6; r++) {
      const t = r / 7;
      const y = yTop + (yBot - yTop) * t;
      const xl = xLTop + (xLBot - xLTop) * t;
      const xr = xRTop + (xRBot - xRTop) * t;
      lines.push(`M ${xl.toFixed(1)} ${y.toFixed(1)} H ${xr.toFixed(1)}`);
    }
    for (let c = 1; c <= 5; c++) {
      const t = c / 6;
      const xt = xLTop + (xRTop - xLTop) * t;
      const xb = xLBot + (xRBot - xLBot) * t;
      lines.push(`M ${xt.toFixed(1)} ${yTop} L ${xb.toFixed(1)} ${yBot}`);
    }
    grid.setAttribute("d", lines.join(" "));
    guides.setAttribute("d", `M ${xLBot} 18 V 274 M ${xRBot} 18 V 274`);

    const shiftMm = (k * 11).toFixed(1);
    const pitchLeft = ((1 - k) * THRESHOLDS.awkwardMax).toFixed(0);
    if (lensShift) lensShift.textContent = `仰角 +${pitchLeft}° · 镜组上移 +${shiftMm} mm`;

    if (k < 0.25) {
      modeOut.textContent = `未矫正 · 轻微仰拍歪楼（+${pitchLeft}°）`;
      descOut.textContent = `最容易翻车的半吊子三点透视（落在 2°–${THRESHOLDS.awkwardMax}° 微仰区）：为了把楼顶收进画框，普通镜头被迫上仰，大楼像要向后倾倒，商业建筑摄影与地产交付照大忌。`;
    } else if (k < 0.85) {
      modeOut.textContent = "半程移轴 · 竖线正在扶正";
      descOut.textContent = "机身放平、镜组向上平移：大楼顶层依然留在画框内，两侧垂直边缘逐渐贴回青柠铅垂参考线。";
    } else {
      modeOut.textContent = "移轴完成 · 竖线严格平行（消除 VP↑）";
      descOut.textContent = "像 1962 年 PC-Nikkor 35mm 那样保持感光面与建筑立面平行、靠镜组平移 11 mm 取景：第三消失点被送回无穷远，大楼挺拔笔直。";
    }
  }

  range.addEventListener("input", () => draw(Number(range.value)));
  draw(Number(range.value));
}

// ============================================================
// 5. 第 07 节 · 练一练：四个均已仰视的方案（只改仰角），严格共用 model.js 35mm 针孔投影
// ============================================================
const QUIZ_FOCAL = 14;
const QUIZ_DIST = 9.5;
const QUIZ_CORRECT = "B";

const QUIZ_CHOICES = {
  A: {
    pitch: 44,
    ok: false,
    title: "方案 A（+44°）· 冲天锐气很猛，但上半截收得偏尖",
    explain: (m) => `同样 14 mm 广角抬到 +44°，塔顶宽度已缩到塔底的 ${m.wPct}%（顶/底宽比 ${m.wRatio}），VP↑ 压到离塔尖仅 ${m.vpMult}× 楼高，顶层幕墙格栅层高被压到只剩底层的 ${m.flPct}%。做 072 号海报那种极端抽象冲击很带劲，但拿来做地标音乐厅主视觉会显得上半截过尖、立面细节过密。`,
  },
  B: {
    pitch: 32,
    ok: true,
    title: "方案 B（+32°）· 正确：冲天气势与幕墙体量两全",
    explain: (m) => `固定 14 mm 广角把仰角定在 +32°：顶底宽度比约 ${m.wRatio}（塔顶保住近一半底宽，${m.wPct}%），VP↑ 悬在塔尖上方 ${m.vpMult}× 楼高处——垂直收束已经非常干脆利落，同时上半截玻璃幕墙纵横分格（顶层仍留有底层 ${m.flPct}% 层高）依然清晰可辨，最适合地标音乐厅揭幕海报。`,
  },
  C: {
    pitch: 56,
    ok: false,
    title: "方案 C（+56°）· 仰角过猛，塔身上半截捏成细针",
    explain: (m) => `抬到 +56° 极端仰角后，VP↑ 直接压进画框内、距塔尖只剩 ${m.vpMult}× 楼高，塔顶宽度猛缩到底宽的 ${m.wPct}%（顶/底宽比 ${m.wRatio}），顶部几层幕墙格栅挤成一团（层高只剩底层的 ${m.flPct}%），建筑体量感几乎被锐角吃掉。`,
  },
  D: {
    pitch: 24,
    ok: false,
    title: "方案 D（+24°）· 已经仰视但收束偏缓，冲击力少了一口气",
    explain: (m) => `+24° 虽然早已跳出 2°–18° 微仰歪楼区，塔身也很端正稳实，但顶底宽度比仍有 ${m.wRatio}（${m.wPct}%）、VP↑ 远在塔尖上方 ${m.vpMult}× 楼高处——和 +32° 一比，向上拉拽的纪念碑冲天张力明显保守了一截。`,
  },
};

function renderQuizCardSvg(svg, cfg) {
  const W = 210, H = 260;
  const aspect = W / H;
  // 同一栋建筑、同一 14 mm 建筑广角（与开场/第 03 节共用 model.js focalFactors）、同一距离 9.5、同一偏航 -6°，只改仰角 pitch
  const theta = cfg.pitch * DEG;
  const phi = (45 - 6) * DEG;
  const { fx, fy } = focalFactors(QUIZ_FOCAL, aspect);
  const cosT = Math.cos(theta), sinT = Math.sin(theta);
  const cosP = Math.cos(phi), sinP = Math.sin(phi);
  const F = [-sinP * cosT, sinT, -cosP * cosT];
  const R = [cosP, 0, -sinP];
  const U = [sinP * sinT, cosT, cosP * sinT];
  const T = [-1.6, 6.4, -1.6];
  const C = [T[0] - F[0] * QUIZ_DIST, T[1] - F[1] * QUIZ_DIST, T[2] - F[2] * QUIZ_DIST];

  const cam = { C, T, F, R, U, fx, fy, aspect, theta, phi };
  const vps = vanishingPoints(cam);
  const b = sceneBoxes("monolith")[0];

  const rawProj = (p) => {
    const q = projectPoint(cam, p);
    return q ? [q.u * W, q.v * H] : null;
  };
  const lerp3 = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];

  const fBot = [b.x1, b.y0, b.z1], fTop = [b.x1, b.y1, b.z1];
  const lBot = [b.x0, b.y0, b.z1], lTop = [b.x0, b.y1, b.z1];
  const rBot = [b.x1, b.y0, b.z0], rTop = [b.x1, b.y1, b.z0];

  const rawCorners = [fBot, fTop, lBot, lTop, rBot, rTop].map(rawProj);
  if (rawCorners.some((p) => !p)) return;

  // 实时从同一组投影顶点算出顶/底宽度比、VP↑ 距塔尖倍数与顶/底层高比（绝不写死常量）
  const [rFB, rFT, rLB, rLT, rRB, rRT] = rawCorners;
  const botW = Math.max(1, rRB[0] - rLB[0]);
  const topW = Math.max(0.1, rRT[0] - rLT[0]);
  const rawTowerH = Math.max(1, Math.max(rFB[1], rLB[1], rRB[1]) - Math.min(rFT[1], rLT[1], rRT[1]));
  const rawVpY = vps.vertical.v * H;
  const f0 = rawProj(lerp3(fBot, fTop, 0));
  const f1 = rawProj(lerp3(fBot, fTop, 0.1));
  const f9 = rawProj(lerp3(fBot, fTop, 0.9));
  const f10 = rawProj(lerp3(fBot, fTop, 1.0));
  const flRatio = f0 && f1 && f9 && f10 ? Math.abs(f10[1] - f9[1]) / Math.max(0.1, Math.abs(f1[1] - f0[1])) : 0.2;

  cfg.metrics = {
    wRatio: (topW / botW).toFixed(2),
    wPct: Math.round((topW / botW) * 100),
    vpMult: ((rFT[1] - rawVpY) / rawTowerH).toFixed(2),
    flPct: Math.round(flRatio * 100),
  };
  cfg.tag = `+${cfg.pitch}° · 宽比 ${cfg.metrics.wRatio}`;

  // 等比缩放并居中取景：让四张图的建筑高度完全一致（160px），确保唯一视觉变量只有仰角收束
  const xs = rawCorners.map((p) => p[0]);
  const ys = rawCorners.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const curH = Math.max(1, maxY - minY);
  const curW = Math.max(1, maxX - minX);
  const scale = Math.min(158 / curH, 134 / curW);
  const ox = (minX + maxX) * 0.5;
  const oy = (minY + maxY) * 0.5;
  const mapPt = ([x, y]) => [W * 0.5 + (x - ox) * scale, H * 0.50 + (y - oy) * scale];
  const proj = (p) => {
    const q = rawProj(p);
    return q ? mapPt(q) : null;
  };

  const pFB = proj(fBot), pFT = proj(fTop);
  const pLB = proj(lBot), pLT = proj(lTop);
  const pRB = proj(rBot), pRT = proj(rTop);

  const parts = [`<rect width="${W}" height="${H}" fill="#121312"/>`];

  // 透视辅助线层（选前隐藏，点击任意一张后四图同步亮起）
  const hlY = mapPt([W * 0.5, vps.hlV * H])[1];
  if (hlY >= 8 && hlY <= H - 8) {
    parts.push(`<line class="q-ray" x1="0" y1="${hlY.toFixed(1)}" x2="${W}" y2="${hlY.toFixed(1)}"/>`);
  }
  const [vx, vy] = mapPt([vps.vertical.u * W, vps.vertical.v * H]);
  const ext = (p) => {
    const dx = vx - p[0], dy = vy - p[1];
    const len = Math.hypot(dx, dy);
    const t = Math.min(1, 340 / Math.max(1, len));
    return [p[0] + dx * t, p[1] + dy * t];
  };
  const eL = ext(pLB), eR = ext(pRB), eF = ext(pFB);
  parts.push(`<path class="q-ray" d="M ${pLB[0].toFixed(1)} ${pLB[1].toFixed(1)} L ${eL[0].toFixed(1)} ${eL[1].toFixed(1)} M ${pRB[0].toFixed(1)} ${pRB[1].toFixed(1)} L ${eR[0].toFixed(1)} ${eR[1].toFixed(1)} M ${pFB[0].toFixed(1)} ${pFB[1].toFixed(1)} L ${eF[0].toFixed(1)} ${eF[1].toFixed(1)}"/>`);
  if (vy >= 8 && vy <= H - 8) {
    parts.push(`<circle class="q-dot" cx="${vx.toFixed(1)}" cy="${vy.toFixed(1)}" r="3.8"/>`);
  }

  // 左亮面 + 右暗面
  parts.push(`<polygon points="${pLB[0].toFixed(1)},${pLB[1].toFixed(1)} ${pFB[0].toFixed(1)},${pFB[1].toFixed(1)} ${pFT[0].toFixed(1)},${pFT[1].toFixed(1)} ${pLT[0].toFixed(1)},${pLT[1].toFixed(1)}" fill="#3d413e" stroke="#f4f5f0" stroke-width="1.15"/>`);
  parts.push(`<polygon points="${pFB[0].toFixed(1)},${pFB[1].toFixed(1)} ${pRB[0].toFixed(1)},${pRB[1].toFixed(1)} ${pRT[0].toFixed(1)},${pRT[1].toFixed(1)} ${pFT[0].toFixed(1)},${pFT[1].toFixed(1)}" fill="#1a1c1b" stroke="#f4f5f0" stroke-width="1.15"/>`);

  // 真实透视玻璃幕墙窗格（12 层 × 4 跨，方便读者辨认上半截窗格有没有被压成一团）
  const mull = [];
  for (let i = 1; i <= 11; i++) {
    const t = i / 12;
    const mF = proj(lerp3(fBot, fTop, t));
    const mL = proj(lerp3(lBot, lTop, t));
    const mR = proj(lerp3(rBot, rTop, t));
    if (mF && mL) mull.push(`M ${mL[0].toFixed(1)} ${mL[1].toFixed(1)} L ${mF[0].toFixed(1)} ${mF[1].toFixed(1)}`);
    if (mF && mR) mull.push(`M ${mF[0].toFixed(1)} ${mF[1].toFixed(1)} L ${mR[0].toFixed(1)} ${mR[1].toFixed(1)}`);
  }
  for (let j = 1; j <= 3; j++) {
    const t = j / 4;
    const lb = proj(lerp3(fBot, lBot, t)), lt = proj(lerp3(fTop, lTop, t));
    const rb = proj(lerp3(fBot, rBot, t)), rt = proj(lerp3(fTop, rTop, t));
    if (lb && lt) mull.push(`M ${lb[0].toFixed(1)} ${lb[1].toFixed(1)} L ${lt[0].toFixed(1)} ${lt[1].toFixed(1)}`);
    if (rb && rt) mull.push(`M ${rb[0].toFixed(1)} ${rb[1].toFixed(1)} L ${rt[0].toFixed(1)} ${rt[1].toFixed(1)}`);
  }
  parts.push(`<path d="${mull.join(" ")}" stroke="#cfd4cb" stroke-opacity="0.34" stroke-width="0.7" fill="none"/>`);
  parts.push(`<line x1="${pFT[0].toFixed(1)}" y1="${pFT[1].toFixed(1)}" x2="${pFB[0].toFixed(1)}" y2="${pFB[1].toFixed(1)}" stroke="#f4f5f0" stroke-width="1.45"/>`);

  // 选后揭晓的顶部 VP↑ 距离胶囊与底部仰角/宽比胶囊
  parts.push(`<g class="q-tag-g"><rect x="40" y="8" width="130" height="18" fill="#101110" stroke="#c3e54b" stroke-opacity="0.5"/><text class="q-tag" x="105" y="21" text-anchor="middle">VP↑ 距顶 ${cfg.metrics.vpMult}×楼高</text></g>`);
  parts.push(`<g class="q-tag-g"><rect x="33" y="233" width="144" height="20" fill="#101110" stroke="#c3e54b" stroke-opacity="0.65"/><text class="q-tag" x="105" y="247" text-anchor="middle">${cfg.tag}</text></g>`);

  svg.innerHTML = parts.join("");
}

export function initPractice() {
  const wrap = document.getElementById("quiz-grid");
  const btns = [...document.querySelectorAll(".quiz-card")];
  const vTitle = document.getElementById("quiz-title");
  const vBody = document.getElementById("quiz-body");
  const vBox = document.getElementById("quiz-verdict");
  if (!wrap || !btns.length) return;

  for (const b of btns) {
    const cfg = QUIZ_CHOICES[b.dataset.choice];
    const svg = b.querySelector("svg");
    if (cfg && svg) renderQuizCardSvg(svg, cfg);
  }

  function pick(choice) {
    wrap.classList.add("revealed");
    const v = QUIZ_CHOICES[choice];
    for (const b of btns) {
      const id = b.dataset.choice;
      b.setAttribute("aria-pressed", String(id === choice));
      b.classList.toggle("is-picked", id === choice);
      b.classList.toggle("is-correct", id === QUIZ_CORRECT);
      b.classList.toggle("is-wrong", id === choice && id !== QUIZ_CORRECT);
      const tag = b.querySelector(".quiz-reveal-tag");
      if (tag) tag.textContent = `+${QUIZ_CHOICES[id].pitch}°`;
    }
    vBox.dataset.state = v.ok ? "ok" : "miss";
    vTitle.textContent = v.title;
    vBody.textContent = v.explain(v.metrics);
  }

  for (const b of btns) {
    b.addEventListener("click", () => pick(b.dataset.choice));
  }
}

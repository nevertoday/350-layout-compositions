// 072 三点透视 · 实时 WebGL 3D 摩天楼渲染 + 零重叠 2D 透视射线 HUD
import * as THREE from "three";
import { pixelRatio } from "../../lib/stage.js";
import { computeCamera, projectPoint, sceneBoxes, vanishingPoints } from "./model.js";

const LIME = "#c3e54b";
const LIME_SOFT = "rgba(195, 229, 75, 0.58)";
const LIME_FAINT = "rgba(195, 229, 75, 0.24)";
const MONO_FONT = '"DM Mono", ui-monospace, monospace';
const SANS_FONT = '"Noto Sans SC", sans-serif';

// 画出一组 ⌜ ⌝ ⌞ ⌟ 极简建筑取景角标
function drawBrackets(ctx, x, y, r, color) {
  const s = 6;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - r, y - r + s); ctx.lineTo(x - r, y - r); ctx.lineTo(x - r + s, y - r);
  ctx.moveTo(x + r - s, y - r); ctx.lineTo(x + r, y - r); ctx.lineTo(x + r, y - r + s);
  ctx.moveTo(x - r, y + r - s); ctx.lineTo(x - r, y + r); ctx.lineTo(x - r + s, y + r);
  ctx.moveTo(x + r - s, y + r); ctx.lineTo(x + r, y + r); ctx.lineTo(x + r, y + r - s);
  ctx.stroke();
}

// 绘制带暗底描边的胶囊标签，确保压在网格和射线之上也绝对清晰可读
function drawPill(ctx, text, cx, cy, align = "center", borderColor = LIME_SOFT, textColor = LIME) {
  ctx.save();
  ctx.font = `600 11px ${MONO_FONT}, ${SANS_FONT}`;
  const tw = ctx.measureText(text).width + 14;
  const th = 22;
  const x = align === "left" ? cx : align === "right" ? cx - tw : cx - tw / 2;
  const y = cy - th / 2;
  ctx.fillStyle = "rgba(16, 17, 16, 0.88)";
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, tw, th);
  ctx.strokeRect(x, y, tw, th);
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + tw / 2, cy + 0.5);
  ctx.restore();
}

// 共用的 2D HUD 透视线叠加层（WebGL 版和 2D 降级版完全共用）
export function drawHudOverlay(ctx, w, h, cam, vps, state, reveal = 1) {
  ctx.clearRect(0, 0, w, h);

  const toPx = (pt) => ({ x: pt.u * w, y: pt.v * h });
  const boxes = sceneBoxes(state.scene);
  const main = boxes[0];

  // 1. 视平线 HL（横穿画框的极细青柠虚线；标签自动避让左右消失点，绝不重叠）
  const hlY = vps.hlV * h;
  if (state.showRays && hlY > -40 && hlY < h + 40) {
    ctx.save();
    ctx.strokeStyle = "rgba(195, 229, 75, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(0, hlY);
    ctx.lineTo(w, hlY);
    ctx.stroke();
    ctx.setLineDash([]);

    if (hlY > 44 && hlY < h - 22) {
      // 将 HL 视平线标签放到虚线下方，并自动避开画内或贴边框外的左右消失点标牌，绝不重叠
      const leftPx = vps.left.infinite ? -999 : vps.left.u * w;
      const rightPx = vps.right.infinite ? 9999 : vps.right.u * w;
      const leftIn = leftPx >= 18 && leftPx <= w - 18 && hlY >= 44 && hlY <= h - 20;
      const rightIn = rightPx >= 18 && rightPx <= w - 18 && hlY >= 44 && hlY <= h - 20;
      const leftFree = leftIn && leftPx > 150;
      const rightFree = rightIn && rightPx < w - 150;

      ctx.font = `500 10px ${MONO_FONT}, ${SANS_FONT}`;
      const hlTxt = "HL 视平线";
      const tw = ctx.measureText(hlTxt).width + 10;
      const belowY = hlY + 13;
      const aboveY = hlY - 13;
      const labelY = belowY <= h - 18 ? belowY : aboveY;
      let tx = 14;
      if (!leftFree && rightFree) {
        tx = w - tw - 14;
      }
      ctx.fillStyle = "rgba(16, 17, 16, 0.86)";
      ctx.fillRect(tx - 4, labelY - 8, tw, 16);
      ctx.fillStyle = "rgba(195, 229, 75, 0.9)";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(hlTxt, tx + 1, labelY);
    }
    ctx.restore();
  }

  // 2. 从主塔关键顶点向三枚消失点延伸的激光青柠虚线射线
  if (state.showRays) {
    ctx.save();
    ctx.lineWidth = 1.05;
    ctx.setLineDash([5, 5]);

    const corners = {
      fBot: projectPoint(cam, [main.x1, main.y0, main.z1]),
      fTop: projectPoint(cam, [main.x1, main.y1, main.z1]),
      lBot: projectPoint(cam, [main.x0, main.y0, main.z1]),
      lTop: projectPoint(cam, [main.x0, main.y1, main.z1]),
      rBot: projectPoint(cam, [main.x1, main.y0, main.z0]),
      rTop: projectPoint(cam, [main.x1, main.y1, main.z0]),
      lMid: projectPoint(cam, [(main.x0 + main.x1) * 0.5, main.y1, main.z1]),
      rMid: projectPoint(cam, [main.x1, main.y1, (main.z0 + main.z1) * 0.5]),
    };

    const drawRay = (a, b, alpha = 0.58) => {
      if (!a || !b) return;
      const ax = a.u * w, ay = a.v * h;
      const bx = b.u * w, by = b.v * h;
      const dx = bx - ax, dy = by - ay;
      const len = Math.hypot(dx, dy);
      if (len < 1 || !isFinite(len)) return;
      const maxLen = Math.max(w, h) * 3.5;
      const t = Math.min(1, maxLen / len) * reveal;
      ctx.strokeStyle = `rgba(195, 229, 75, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + dx * t, ay + dy * t);
      ctx.stroke();
    };

    const vAnchors = state.pitch >= 0
      ? [corners.fTop, corners.lTop, corners.rTop, corners.lMid, corners.rMid]
      : [corners.fBot, corners.lBot, corners.rBot];

    if (vps.isLevel) {
      ctx.strokeStyle = "rgba(195, 229, 75, 0.5)";
      for (const a of [corners.fTop, corners.lTop, corners.rTop]) {
        if (!a) continue;
        const ax = a.u * w;
        ctx.beginPath();
        ctx.moveTo(ax, 38);
        ctx.lineTo(ax, h - 14);
        ctx.stroke();
      }
    } else {
      for (const a of vAnchors) drawRay(a, vps.vertical, 0.62);
    }

    if (!vps.left.infinite) {
      drawRay(corners.lBot, vps.left, 0.52);
      drawRay(corners.lTop, vps.left, 0.42);
    }
    if (!vps.right.infinite) {
      drawRay(corners.rBot, vps.right, 0.52);
      drawRay(corners.rTop, vps.right, 0.42);
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 3. 绘制三枚消失点标记（在画内用发光圆点 + ⌜⌝ 角标；在画外用贴边指向胶囊，绝不撞顶栏）
  const drawVpMarker = (vp, zhName, alignHint) => {
    ctx.save();
    if (vp.infinite) {
      if (alignHint === "vertical") {
        drawPill(ctx, "VP → ∞ · 垂直线平行（两点透视）", w * 0.5, 48, "center");
      }
      ctx.restore();
      return;
    }

    const px = toPx(vp);
    const padX = 18;
    const padTop = 44;
    const padBot = 20;
    const inside = px.x >= padX && px.x <= w - padX && px.y >= padTop && px.y <= h - padBot;

    if (inside) {
      ctx.fillStyle = "rgba(195, 229, 75, 0.22)";
      ctx.beginPath();
      ctx.arc(px.x, px.y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = LIME;
      ctx.beginPath();
      ctx.arc(px.x, px.y, 4.2, 0, Math.PI * 2);
      ctx.fill();

      drawBrackets(ctx, px.x, px.y, 12, LIME_SOFT);

      ctx.font = `600 11px ${MONO_FONT}, ${SANS_FONT}`;
      ctx.textBaseline = "middle";
      if (alignHint === "vertical") {
        const label = `${zhName} ${vp.label}`;
        const above = px.y > 74;
        drawPill(ctx, label, px.x, above ? px.y - 25 : px.y + 25, "center", "rgba(195,229,75,0.35)");
      } else if (alignHint === "left") {
        const placeRight = px.x < 120;
        const tx = placeRight ? px.x + 18 : px.x - 18;
        ctx.textAlign = placeRight ? "left" : "right";
        ctx.fillStyle = LIME;
        ctx.fillText(vp.label, tx, px.y - 6);
        ctx.font = `400 10px ${SANS_FONT}`;
        ctx.fillStyle = "rgba(244, 245, 240, 0.85)";
        ctx.fillText(zhName, tx, px.y + 9);
      } else {
        const placeLeft = px.x > w - 120;
        const tx = placeLeft ? px.x - 18 : px.x + 18;
        ctx.textAlign = placeLeft ? "right" : "left";
        ctx.fillStyle = LIME;
        ctx.fillText(vp.label, tx, px.y - 6);
        ctx.font = `400 10px ${SANS_FONT}`;
        ctx.fillStyle = "rgba(244, 245, 240, 0.85)";
        ctx.fillText(zhName, tx, px.y + 9);
      }
    } else if (state.showRays) {
      // 消失点落在画框之外：显示到框外的真实距离倍数（超出画框边缘多少倍宽/高）
      const cx = w * 0.5, cy = h * 0.5;
      const dx = px.x - cx, dy = px.y - cy;
      const topClamp = h < 320 ? 38 : 54;
      const tx = dx !== 0 ? ((dx > 0 ? w - 14 : 14) - cx) / dx : 1e9;
      const ty = dy !== 0 ? ((dy > 0 ? h - 22 : topClamp - 6) - cy) / dy : 1e9;
      const t = Math.min(Math.abs(tx), Math.abs(ty));
      const ex = cx + dx * t;
      const ey = cy + dy * t;

      const beyond = alignHint === "vertical"
        ? Math.max(0.1, Math.abs(vp.v - 0.5) - 0.5)
        : Math.max(0.1, Math.abs(vp.u - 0.5) - 0.5);
      const label = `${vp.label} 框外 ${beyond.toFixed(1)}×`;

      ctx.font = `600 11px ${MONO_FONT}, ${SANS_FONT}`;
      const tw = ctx.measureText(label).width + 14;
      const bx = Math.max(10 + tw / 2, Math.min(w - 10 - tw / 2, ex));
      const by = Math.max(topClamp, Math.min(h - 22, ey));
      drawPill(ctx, label, bx, by, "center");
    }
    ctx.restore();
  };

  drawVpMarker(vps.vertical, vps.vertical.dir === "down" ? "下方消失点" : "上方消失点", "vertical");
  drawVpMarker(vps.left, "左侧消失点", "left");
  drawVpMarker(vps.right, "右侧消失点", "right");

  // 4. 舞台四角建筑取景折角
  ctx.save();
  ctx.strokeStyle = LIME_FAINT;
  ctx.lineWidth = 1;
  const c = 14;
  ctx.beginPath();
  ctx.moveTo(8, 8 + c); ctx.lineTo(8, 8); ctx.lineTo(8 + c, 8);
  ctx.moveTo(w - 8 - c, 8); ctx.lineTo(w - 8, 8); ctx.lineTo(w - 8, 8 + c);
  ctx.moveTo(8, h - 8 - c); ctx.lineTo(8, h - 8); ctx.lineTo(8 + c, h - 8);
  ctx.moveTo(w - 8 - c, h - 8); ctx.lineTo(w - 8, h - 8); ctx.lineTo(w - 8, h - 8 - c);
  ctx.stroke();
  ctx.restore();
}

// 为一组建筑构建极少 Draw Call 的玻璃幕墙网格 + 锐白外框棱线 + 广场地网
function buildArchitectureGroup(sceneId) {
  const group = new THREE.Group();
  const boxes = sceneBoxes(sceneId);

  const solidMatPrimary = new THREE.MeshLambertMaterial({
    color: 0x353936,
  });
  const solidMatSecondary = new THREE.MeshLambertMaterial({
    color: 0x222523,
  });
  // 底面 (-Y) 用与背景同色的深曜石黑，在大仰角从下方仰望塔身时遮蔽背棱且无生硬底盖（呼应 072 原海报底部倒 V 切口）
  const bottomOccludeMat = new THREE.MeshBasicMaterial({
    color: 0x101110,
  });
  const primaryMats = [solidMatPrimary, solidMatPrimary, solidMatPrimary, bottomOccludeMat, solidMatPrimary, solidMatPrimary];
  const secondaryMats = [solidMatSecondary, solidMatSecondary, solidMatSecondary, bottomOccludeMat, solidMatSecondary, solidMatSecondary];

  const mullionPositions = [];
  const edgePositions = [];
  const windowPositions = [];

  for (const b of boxes) {
    const bw = b.x1 - b.x0;
    const bh = b.y1 - b.y0;
    const bd = b.z1 - b.z0;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, bd),
      b.primary ? primaryMats : secondaryMats,
    );
    mesh.position.set((b.x0 + b.x1) * 0.5, (b.y0 + b.y1) * 0.5, (b.z0 + b.z1) * 0.5);
    group.add(mesh);

    const eps = 0.015;
    const pushSeg = (arr, x1, y1, z1, x2, y2, z2) => arr.push(x1, y1, z1, x2, y2, z2);

    const xs = [b.x0, b.x1], ys = [b.y0, b.y1], zs = [b.z0, b.z1];
    for (const x of xs) for (const z of zs) pushSeg(edgePositions, x, ys[0], z, x, ys[1], z);
    for (const y of ys) for (const z of zs) pushSeg(edgePositions, xs[0], y, z, xs[1], y, z);
    for (const x of xs) for (const y of ys) pushSeg(edgePositions, x, y, zs[0], x, y, zs[1]);

    const floors = b.floors;
    const cols = b.cols;
    for (let i = 1; i < floors; i++) {
      const y = b.y0 + (bh * i) / floors;
      pushSeg(mullionPositions, b.x0, y, b.z1 + eps, b.x1, y, b.z1 + eps);
      pushSeg(mullionPositions, b.x0, y, b.z0 - eps, b.x1, y, b.z0 - eps);
      pushSeg(mullionPositions, b.x1 + eps, y, b.z0, b.x1 + eps, y, b.z1);
      pushSeg(mullionPositions, b.x0 - eps, y, b.z0, b.x0 - eps, y, b.z1);
    }
    for (let j = 1; j < cols; j++) {
      const x = b.x0 + (bw * j) / cols;
      const z = b.z0 + (bd * j) / cols;
      pushSeg(mullionPositions, x, b.y0, b.z1 + eps, x, b.y1, b.z1 + eps);
      pushSeg(mullionPositions, x, b.y0, b.z0 - eps, x, b.y1, b.z0 - eps);
      pushSeg(mullionPositions, b.x1 + eps, b.y0, z, b.x1 + eps, b.y1, z);
      pushSeg(mullionPositions, b.x0 - eps, b.y0, z, b.x0 - eps, b.y1, z);
    }

    if (b.primary) {
      const litFloors = [3, 6, 9, 12, 15];
      for (const lf of litFloors) {
        const y = b.y0 + (bh * (lf + 0.5)) / floors;
        pushSeg(windowPositions, b.x0 + bw * 0.12, y, b.z1 + eps * 1.4, b.x1 - bw * 0.12, y, b.z1 + eps * 1.4);
        pushSeg(windowPositions, b.x1 + eps * 1.4, y, b.z0 + bd * 0.2, b.x1 + eps * 1.4, y, b.z1 - bd * 0.2);
      }
    }
  }

  const makeLines = (pos, color, opacity) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
    );
  };

  group.add(makeLines(edgePositions, 0xf2f4ee, 0.92));
  group.add(makeLines(mullionPositions, 0x9aa097, 0.44));
  if (windowPositions.length) group.add(makeLines(windowPositions, 0xc3e54b, 0.36));

  const gridPos = [];
  const step = 1.6;
  const span = 12;
  for (let i = -span; i <= span; i++) {
    const d = i * step;
    gridPos.push(-span * step, 0, d, span * step, 0, d);
    gridPos.push(d, 0, -span * step, d, 0, span * step);
  }
  const gridLines = makeLines(gridPos, 0x3b4039, 0.42);
  group.add(gridLines);
  group.userData.gridLines = gridLines;

  return group;
}

export function createScene3D(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.domElement.className = "stage-gl";
  renderer.domElement.setAttribute("aria-hidden", "true");

  const hud = document.createElement("canvas");
  hud.className = "stage-hud";
  hud.setAttribute("aria-hidden", "true");
  const hudCtx = hud.getContext("2d");

  host.append(renderer.domElement, hud);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101110);
  scene.fog = new THREE.Fog(0x101110, 22, 68);

  const amb = new THREE.AmbientLight(0xdce2d8, 0.65);
  const keyLeft = new THREE.DirectionalLight(0xf6f8f2, 1.85);
  keyLeft.position.set(-14, 18, 16);
  const rimRight = new THREE.DirectionalLight(0x8ba078, 0.45);
  rimRight.position.set(16, 6, -10);
  scene.add(amb, keyLeft, rimRight);

  const camera = new THREE.PerspectiveCamera(90, 1.3, 0.1, 140);

  const groups = {
    monolith: buildArchitectureGroup("monolith"),
    cluster: buildArchitectureGroup("cluster"),
    atrium: buildArchitectureGroup("atrium"),
  };
  let activeScene = "monolith";
  scene.add(groups.monolith);

  let width = 0;
  let height = 0;

  function resize() {
    const r = host.getBoundingClientRect();
    const w = Math.max(240, Math.round(r.width));
    const h = Math.max(220, Math.round(r.height));
    if (w === width && h === height) return false;
    width = w;
    height = h;
    // 移动端 WebGL 限制像素比至 1.25（HUD 仍用 1.5），在慢手机与软件渲染下依然满帧
    const glDpr = pixelRatio(w <= 560 ? 1.25 : 2);
    const hudDpr = pixelRatio(w <= 560 ? 1.5 : 2);
    renderer.setPixelRatio(glDpr);
    renderer.setSize(w, h, false);
    hud.width = Math.round(w * hudDpr);
    hud.height = Math.round(h * hudDpr);
    hudCtx.setTransform(hudDpr, 0, 0, hudDpr, 0, 0);
    return true;
  }

  function render(state, reveal = 1) {
    if (!width || !height) resize();
    if (state.scene !== activeScene) {
      scene.remove(groups[activeScene]);
      activeScene = state.scene;
      scene.add(groups[activeScene]);
    }

    const aspect = width / height;
    const cam = computeCamera(state, aspect);
    const vps = vanishingPoints(cam);

    camera.fov = cam.vFov;
    camera.aspect = aspect;
    camera.far = Math.max(180, cam.dist * 6);
    camera.updateProjectionMatrix();

    // 随相机距离动态调节雾效与地面网格：长焦退远不发灰，大仰角从下方仰望塔身时不穿帮看到地网底面
    scene.fog.near = Math.max(18, cam.dist * 1.45);
    scene.fog.far = Math.max(64, cam.dist * 4.2);
    const gridLines = groups[activeScene].userData.gridLines;
    if (gridLines) {
      const gAlpha = Math.max(0, Math.min(1, (cam.C[1] - 0.25) / 0.9)) * 0.42;
      gridLines.visible = gAlpha > 0.01;
      gridLines.material.opacity = gAlpha;
    }

    const m = new THREE.Matrix4().set(
      cam.R[0], cam.U[0], -cam.F[0], cam.C[0],
      cam.R[1], cam.U[1], -cam.F[1], cam.C[1],
      cam.R[2], cam.U[2], -cam.F[2], cam.C[2],
      0, 0, 0, 1,
    );
    camera.matrixAutoUpdate = false;
    camera.matrix.copy(m);
    camera.matrixWorld.copy(m);
    camera.matrixWorldInverse.copy(m).invert();

    renderer.render(scene, camera);
    drawHudOverlay(hudCtx, width, height, cam, vps, state, reveal);
    return { cam, vps };
  }

  return { render, resize, isWebGL: true };
}

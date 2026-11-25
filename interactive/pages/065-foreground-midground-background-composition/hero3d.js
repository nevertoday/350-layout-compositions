// Three.js 真 3D 多平面玻璃景片盒（WebGL 主舞台）。
// 仅在参数变更时更新离屏画布纹理；拖拽视角时只变换 3 块纹理平面 + 细玻璃边框 + 地面刻度线，总计约 9 次 draw call。

import * as THREE from "three";
import { pixelRatio } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";
import { createLayerCanvases, updateLayerCanvases } from "./artwork.js";

const PLANE_W = 6.75;
const PLANE_H = 2.7;

export function mountHero3D(canvas, getState, getEval) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(pixelRatio(1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.creamTop);

  const camera = new THREE.PerspectiveCamera(34, 2, 0.1, 40);

  const rig = new THREE.Group();
  scene.add(rig);

  // 三片共享离屏画布与 CanvasTexture
  const canvases = createLayerCanvases();
  const makeTex = (c) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  };
  const texBg = makeTex(canvases.bg);
  const texMid = makeTex(canvases.mid);
  const texFg = makeTex(canvases.fg);

  const geo = new THREE.PlaneGeometry(PLANE_W, PLANE_H);

  // 玻璃景片底板（侧斜拆层时透出极淡玻璃面质感，正视 0° 时完全隐形）
  const glassBackMat = (hex) =>
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(hex),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

  const makePlane = (tex, edgeHex, order) => {
    const group = new THREE.Group();
    const back = new THREE.Mesh(geo, glassBackMat(edgeHex));
    back.renderOrder = order * 3;
    group.add(back);

    const artMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const art = new THREE.Mesh(geo, artMat);
    art.renderOrder = order * 3 + 1;
    group.add(art);

    // 极细玻璃片边框（呼应原海报底左 3 片玻璃框示意）
    const hw = PLANE_W / 2;
    const hh = PLANE_H / 2;
    const framePts = [
      new THREE.Vector3(-hw, -hh, 0.002),
      new THREE.Vector3(hw, -hh, 0.002),
      new THREE.Vector3(hw, hh, 0.002),
      new THREE.Vector3(-hw, hh, 0.002),
    ];
    const frameGeo = new THREE.BufferGeometry().setFromPoints(framePts);
    const frameMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(edgeHex),
      transparent: true,
      opacity: 0,
    });
    const frame = new THREE.LineLoop(frameGeo, frameMat);
    frame.renderOrder = order * 3 + 2;
    group.add(frame);

    rig.add(group);
    return { group, back, art, frame, frameMat, backMat: back.material };
  };

  const bgPlane = makePlane(texBg, PALETTE.bgBand, 1);
  const midPlane = makePlane(texMid, PALETTE.midBand, 2);
  const fgPlane = makePlane(texFg, PALETTE.fgBand, 3);

  // 底部 Z 轴纵深导轨与 3 个景片落点刻度（侧斜拆层时浮现）
  const railGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-PLANE_W * 0.48, -PLANE_H * 0.54, -2.0),
    new THREE.Vector3(-PLANE_W * 0.48, -PLANE_H * 0.54, 2.0),
    new THREE.Vector3(PLANE_W * 0.48, -PLANE_H * 0.54, -2.0),
    new THREE.Vector3(PLANE_W * 0.48, -PLANE_H * 0.54, 2.0),
  ]);
  const railMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(PALETTE.pineInk),
    transparent: true,
    opacity: 0,
  });
  const rails = new THREE.LineSegments(railGeo, railMat);
  rig.add(rails);

  // 1 -> 2 -> 3 视线穿层金线（推演视线时沿三片玻璃逐级穿过）
  const sightPts = [
    new THREE.Vector3(-1.35, -0.58, 0.8),
    new THREE.Vector3(1.15, -0.20, 0),
    new THREE.Vector3(1.58, 0.62, -0.8),
  ];
  const sightGeo = new THREE.BufferGeometry().setFromPoints(sightPts);
  const sightMat = new THREE.LineBasicMaterial({
    color: new THREE.Color("#C98A2B"),
    transparent: true,
    opacity: 0,
  });
  const sightLine = new THREE.Line(sightGeo, sightMat);
  sightLine.renderOrder = 30;
  rig.add(sightLine);

  const pulseDotGeo = new THREE.SphereGeometry(0.085, 14, 14);
  const pulseDotMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color("#D48A24"),
    transparent: true,
    opacity: 0,
  });
  const pulseDot = new THREE.Mesh(pulseDotGeo, pulseDotMat);
  pulseDot.renderOrder = 31;
  rig.add(pulseDot);

  let lastTexSig = "";
  let lastW = 0;
  let lastH = 0;
  let curYaw = 22; // 开场 0.9s 缓动起点（从 22° 玻璃拆层缓落至 12°，每帧都好看）

  function syncTextures(state, evalRes) {
    const sig = `${state.scene}|${state.fgScale.toFixed(3)}|${state.fgLayout}|${state.atmoFade.toFixed(3)}|${state.focusMode}`;
    if (sig === lastTexSig) return;
    lastTexSig = sig;
    updateLayerCanvases(canvases, state, evalRes);
    texBg.needsUpdate = true;
    texMid.needsUpdate = true;
    texFg.needsUpdate = true;
  }

  function resizeIfNeeded() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(200, Math.round(r.width));
    const h = Math.max(150, Math.round(r.height));
    if (w !== lastW || h !== lastH) {
      lastW = w;
      lastH = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    return { w, h };
  }

  function render(t, dt, { still }) {
    const state = getState();
    const evalRes = getEval();
    syncTextures(state, evalRes);
    const { w, h } = resizeIfNeeded();

    const targetYaw = state.camYaw;
    if (still) {
      curYaw = targetYaw;
    } else {
      const k = dt > 0 ? 1 - Math.exp(-dt * 9.5) : 0.24;
      curYaw += (targetYaw - curYaw) * k;
    }

    const yawRad = (curYaw * Math.PI) / 180;
    const oblique = Math.min(1, Math.abs(curYaw) / 14);

    // 按真实视场角 (FOV 34°) 与当前画布宽高比精确算出不裁边且最饱满的机位距离
    const aspect = w / h;
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
    const padW = PLANE_W * (0.54 + oblique * 0.10);
    const padH = PLANE_H * (0.58 + oblique * 0.08);
    const distV = padH / tanHalf;
    const distH = padW / (tanHalf * Math.max(0.65, aspect));
    const baseDist = Math.max(distV, distH);
    const extraPull = oblique * (0.28 + state.depthSpan * 0.56);
    const dist = baseDist + extraPull;

    camera.position.set(
      Math.sin(yawRad) * dist,
      oblique * 0.30,
      Math.cos(yawRad) * dist
    );
    camera.lookAt(0, -0.02, 0);

    // 三片玻璃沿 Z 轴实时落位，并补偿透视缩放大体保持正视画面尺寸一致
    const { fgZ, midZ, bgZ } = evalRes.planes;
    bgPlane.group.position.set(0, 0, bgZ);
    midPlane.group.position.set(0, 0, midZ);
    fgPlane.group.position.set(0, 0, fgZ);

    // 远景片在纵深拉开时做极轻的自然透视缩放，避免过远小到消失，过散(>1.26)时真实露边脱节
    const bgScale = 1 + Math.abs(bgZ) * 0.14;
    const fgScale3d = Math.max(0.84, 1 - fgZ * 0.13);
    bgPlane.group.scale.set(bgScale, bgScale, 1);
    midPlane.group.scale.set(1, 1, 1);
    fgPlane.group.scale.set(fgScale3d, fgScale3d, 1);

    // 侧斜时平滑浮现玻璃边框、微透玻璃膜与地面 Z 轨
    fgPlane.frameMat.opacity = oblique * 0.85;
    midPlane.frameMat.opacity = oblique * 0.82;
    bgPlane.frameMat.opacity = oblique * 0.75;
    fgPlane.backMat.opacity = oblique * 0.05;
    midPlane.backMat.opacity = oblique * 0.06;
    bgPlane.backMat.opacity = oblique * 0.07;
    railMat.opacity = oblique * 0.40;

    // 视线穿层光束 1 -> 2 -> 3
    if (state.sightPulse > 0) {
      const p0 = new THREE.Vector3(state.fgLayout === "center" ? 0 : -1.55, -0.62, fgZ + 0.02);
      const p1 = new THREE.Vector3(0.95, -0.18, midZ + 0.02);
      const p2 = new THREE.Vector3(1.52, 0.58, bgZ + 0.02);
      const posAttr = sightGeo.attributes.position;
      posAttr.setXYZ(0, p0.x, p0.y, p0.z);
      posAttr.setXYZ(1, p1.x, p1.y, p1.z);
      posAttr.setXYZ(2, p2.x, p2.y, p2.z);
      posAttr.needsUpdate = true;

      const phase = still ? 0.52 : (t * 0.42) % 1;
      const cur = new THREE.Vector3();
      if (phase < 0.5) cur.lerpVectors(p0, p1, phase * 2);
      else cur.lerpVectors(p1, p2, (phase - 0.5) * 2);
      pulseDot.position.copy(cur);
      sightMat.opacity = 0.88;
      pulseDotMat.opacity = 0.96;
    } else {
      sightMat.opacity = 0;
      pulseDotMat.opacity = 0;
    }

    renderer.render(scene, camera);
  }

  return { render };
}

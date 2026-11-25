// 318 三远综合构图 · 立体山水舞台引擎
// WebGL 可用时用 Three.js 呈现真正的 XYZ 三轴棱面立体山水（支持正视成画 ↔ 三维剖轴平滑过渡）；
// WebGL 不可用时无缝退回 2D Canvas，完全共用 model.js 算出的同一套几何数据。

import * as THREE from "three";
import { loop, webgl, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SCENES, computeGeometry, clamp } from "./model.js";

// 生成原海报淡金网点日轮纹理（仅在初始化时绘制一次，零逐帧开销）
function makeHalftoneSunTexture(fillHex, dotHex) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  const cx = 128;
  const cy = 128;
  const r = 118;
  ctx.clearRect(0, 0, 256, 256);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = fillHex;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = dotHex;
  const step = 10;
  for (let y = 4; y < 256; y += step) {
    const shift = ((y / step) % 2) * (step * 0.5);
    for (let x = 4; x < 256; x += step) {
      const dx = x + shift - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        ctx.beginPath();
        ctx.arc(x + shift, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
  return c;
}

// 构造山峰棱面几何（扁平建筑纸雕感，极低顶点数确保慢手机 60 fps）
function makeMountainMesh(material) {
  const geo = new THREE.ConeGeometry(1, 1, 4, 1);
  geo.rotateY(Math.PI * 0.25);
  geo.translate(0, 0.5, 0);
  return new THREE.Mesh(geo, material);
}

// 构造圆角云片网格
function makeCloudMesh(material) {
  const shape = new THREE.Shape();
  const w = 1;
  const h = 0.24;
  const r = h * 0.5;
  shape.moveTo(-w * 0.5 + r, -h * 0.5);
  shape.lineTo(w * 0.5 - r, -h * 0.5);
  shape.absarc(w * 0.5 - r, 0, r, -Math.PI * 0.5, Math.PI * 0.5, false);
  shape.lineTo(-w * 0.5 + r, h * 0.5);
  shape.absarc(-w * 0.5 + r, 0, r, Math.PI * 0.5, Math.PI * 1.5, false);
  const geo = new THREE.ShapeGeometry(shape, 10);
  return new THREE.Mesh(geo, material);
}

export function createHeroStage(canvas, getState, onFrameInfo) {
  const useGL = webgl();
  let width = 720;
  let height = 460;

  // 开场与平滑过渡状态
  let reveal = reducedMotion.matches ? 1 : 0.28;
  let viewLerp = 0; // 0 = 正视成画，1 = 三维剖轴
  let smooth = null;
  let lastSceneKey = "";

  function lerpNum(a, b, k) {
    return a + (b - a) * k;
  }

  function stepSmooth(state, dt, still) {
    const target = computeGeometry(state);
    const viewTarget = state.view3d ? 1 : 0;
    if (still || !smooth) {
      reveal = 1;
      viewLerp = viewTarget;
      smooth = {
        peakX: target.peakX,
        peakY: target.peakY,
        peakBaseY: target.peakBaseY,
        peakHalfW: target.peakHalfW,
        valleyX: target.valleyX,
        valleyY: target.valleyY,
        depthReach: target.depthReach,
        baseSpan: target.baseSpan,
        waterY: target.waterY,
        baseBottomY: target.baseBottomY,
        waterTiltRad: target.waterTiltRad,
        orbX: target.orb.x,
        orbY: target.orb.y,
        orbR: target.orb.r,
        rectX: target.rect.x,
        rectY: target.rect.y,
        rectW: target.rect.w,
        rectH: target.rect.h,
        sqX: target.sq.x,
        sqY: target.sq.y,
        sqS: target.sq.s,
        mistNorm: target.mistNorm,
        seamHardness: target.seamHardness,
        fogObscure: target.fogObscure,
        deepLayers: target.deepLayers,
        highW: target.weights.high,
        deepW: target.weights.deep,
        levelW: target.weights.level,
      };
      return target;
    }
    const k = 1 - Math.exp(-Math.max(dt, 0.016) * 11);
    reveal = Math.min(1, reveal + dt * 1.15);
    viewLerp = lerpNum(viewLerp, viewTarget, 1 - Math.exp(-Math.max(dt, 0.016) * 7.5));
    smooth.peakX = lerpNum(smooth.peakX, target.peakX, k);
    smooth.peakY = lerpNum(smooth.peakY, target.peakY, k);
    smooth.peakBaseY = lerpNum(smooth.peakBaseY, target.peakBaseY, k);
    smooth.peakHalfW = lerpNum(smooth.peakHalfW, target.peakHalfW, k);
    smooth.valleyX = lerpNum(smooth.valleyX, target.valleyX, k);
    smooth.valleyY = lerpNum(smooth.valleyY, target.valleyY, k);
    smooth.depthReach = lerpNum(smooth.depthReach, target.depthReach, k);
    smooth.baseSpan = lerpNum(smooth.baseSpan, target.baseSpan, k);
    smooth.waterY = lerpNum(smooth.waterY, target.waterY, k);
    smooth.baseBottomY = lerpNum(smooth.baseBottomY, target.baseBottomY, k);
    smooth.waterTiltRad = lerpNum(smooth.waterTiltRad, target.waterTiltRad, k);
    smooth.orbX = lerpNum(smooth.orbX, target.orb.x, k);
    smooth.orbY = lerpNum(smooth.orbY, target.orb.y, k);
    smooth.orbR = lerpNum(smooth.orbR, target.orb.r, k);
    smooth.rectX = lerpNum(smooth.rectX, target.rect.x, k);
    smooth.rectY = lerpNum(smooth.rectY, target.rect.y, k);
    smooth.rectW = lerpNum(smooth.rectW, target.rect.w, k);
    smooth.rectH = lerpNum(smooth.rectH, target.rect.h, k);
    smooth.sqX = lerpNum(smooth.sqX, target.sq.x, k);
    smooth.sqY = lerpNum(smooth.sqY, target.sq.y, k);
    smooth.sqS = lerpNum(smooth.sqS, target.sq.s, k);
    smooth.mistNorm = lerpNum(smooth.mistNorm, target.mistNorm, k);
    smooth.seamHardness = lerpNum(smooth.seamHardness, target.seamHardness, k);
    smooth.fogObscure = lerpNum(smooth.fogObscure, target.fogObscure, k);
    smooth.deepLayers = target.deepLayers;
    smooth.highW = lerpNum(smooth.highW, target.weights.high, k);
    smooth.deepW = lerpNum(smooth.deepW, target.weights.deep, k);
    smooth.levelW = lerpNum(smooth.levelW, target.weights.level, k);
    return target;
  }

  // 把归一化画幅 (u: 0..1, v: 0..1) 映射到 3D 世界坐标
  const WORLD_W = 10.4;
  const WORLD_H = 6.7;
  const uToX = (u) => (u - 0.5) * WORLD_W;
  const vToY = (v) => (0.5 - v) * WORLD_H;

  // ==================== WebGL / Three.js 路径 ====================
  let glEngine = null;
  if (useGL) {
    try {
      const isMobile = window.innerWidth < 600;
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile,
        alpha: false,
        powerPreference: "high-performance",
      });
      const glCtx = renderer.getContext();
      const dbg = glCtx && glCtx.getExtension("WEBGL_debug_renderer_info");
      const glName = dbg ? String(glCtx.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "") : "";
      const isSw = /swiftshader|llvmpipe|software/i.test(glName);
      const getDpr = () => (isSw ? 1 : pixelRatio(window.innerWidth < 600 ? 1.5 : 2));
      renderer.setPixelRatio(getDpr());
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(SCENES.poster.palette.sky);

      const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 60);
      camera.position.set(0, 0.15, 11.4);

      const ambLight = new THREE.AmbientLight(0xffffff, 0.88);
      scene.add(ambLight);
      const dirLight = new THREE.DirectionalLight(0xfff5e4, 0.65);
      dirLight.position.set(5, 9, 8);
      scene.add(dirLight);
      const rimLight = new THREE.DirectionalLight(0xd9ccf5, 0.35);
      rimLight.position.set(-7, 4, 3);
      scene.add(rimLight);

      const root = new THREE.Group();
      scene.add(root);

      // 材质集合（随题材切换动态更新颜色，零重建对象）
      const mats = {
        sun: new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }),
        highMain: new THREE.MeshLambertMaterial({ color: 0x64519e, flatShading: true }),
        coneFront: new THREE.MeshLambertMaterial({ color: 0xdfcbe2, flatShading: true }),
        deepOuterL: new THREE.MeshLambertMaterial({ color: 0x2c1966, flatShading: true }),
        deepOuterR: new THREE.MeshLambertMaterial({ color: 0x452f8d, flatShading: true }),
        deepInner: new THREE.MeshLambertMaterial({ color: 0x7763a7, flatShading: true }),
        deepFar: new THREE.MeshLambertMaterial({ color: 0x9d8ac4, flatShading: true }),
        deepOrb: new THREE.MeshBasicMaterial({ color: 0xef6841 }),
        mist: new THREE.MeshBasicMaterial({ color: 0xe8dcf0, transparent: true, opacity: 0.4, depthWrite: false }),
        fogVeil: new THREE.MeshBasicMaterial({ color: 0xf8efe0, transparent: true, opacity: 0, depthWrite: false }),
        cloud: new THREE.MeshBasicMaterial({ color: 0xb5a1c7, transparent: true, opacity: 0.72, depthWrite: false }),
        waterTop: new THREE.MeshLambertMaterial({ color: 0x8674ae, flatShading: true }),
        waterMid: new THREE.MeshLambertMaterial({ color: 0x4a3784, flatShading: true }),
        waterBase: new THREE.MeshLambertMaterial({ color: 0x312068, flatShading: true }),
        ripple: new THREE.MeshBasicMaterial({ color: 0xf4ecf8, transparent: true, opacity: 0.8 }),
        propOrb: new THREE.MeshLambertMaterial({ color: 0xef6841 }),
        propSq: new THREE.MeshLambertMaterial({ color: 0xf6c34e }),
        propRect: new THREE.MeshLambertMaterial({ color: 0xee6a42 }),
        bird: new THREE.MeshBasicMaterial({ color: 0x2c1954, side: THREE.DoubleSide }),
        axisHigh: new THREE.MeshBasicMaterial({ color: 0x2c1954, transparent: true, opacity: 0 }),
        axisDeep: new THREE.MeshBasicMaterial({ color: 0x7763a7, transparent: true, opacity: 0 }),
        axisLevel: new THREE.MeshBasicMaterial({ color: 0xed6843, transparent: true, opacity: 0 }),
      };

      // 1. 淡金网点大日轮
      const sunMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), mats.sun);
      root.add(sunMesh);

      // 2. 高远主峰群（主峰 + 中央浅薰衣草折面锥体）
      const highGroup = new THREE.Group();
      const mainPeak = makeMountainMesh(mats.highMain);
      const midCone = makeMountainMesh(mats.coneFront);
      highGroup.add(mainPeak, midCone);
      root.add(highGroup);

      // 3. 深远重峦群（沿 -Z 向内层层推进的 5 组对称与错落山峰 + 谷心朱橙落日）
      const deepGroup = new THREE.Group();
      const deepLeft1 = makeMountainMesh(mats.deepOuterL);
      const deepRight1 = makeMountainMesh(mats.deepOuterR);
      const deepCenter = makeMountainMesh(mats.deepInner);
      const deepLeft2 = makeMountainMesh(mats.deepInner);
      const deepRight2 = makeMountainMesh(mats.deepOuterR);
      const deepFarL = makeMountainMesh(mats.deepFar);
      const deepFarR = makeMountainMesh(mats.deepFar);
      const deepOrb = new THREE.Mesh(new THREE.CircleGeometry(0.17, 24), mats.deepOrb);
      deepGroup.add(deepLeft1, deepRight1, deepCenter, deepLeft2, deepRight2, deepFarL, deepFarR, deepOrb);
      root.add(deepGroup);

      // 4. 烟岚通脉纱带（两层柔和水平半透云岚 + 浓雾吞山面纱）
      const mistBand1 = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 0.72), mats.mist);
      const mistBand2 = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 0.56), mats.mist);
      const fogVeil = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 4.2), mats.fogVeil);
      root.add(mistBand1, mistBand2, fogVeil);

      // 5. 平远阔水基台（3 层阶梯式水平展台 + 7 条白色水波细条）
      const levelGroup = new THREE.Group();
      const waterBack = new THREE.Mesh(new THREE.BoxGeometry(1, 0.42, 0.65), mats.waterTop);
      const waterMid = new THREE.Mesh(new THREE.BoxGeometry(1, 0.44, 0.85), mats.waterMid);
      const waterFront = new THREE.Mesh(new THREE.BoxGeometry(1, 0.52, 1.05), mats.waterBase);
      levelGroup.add(waterBack, waterMid, waterFront);

      const ripples = [];
      for (let i = 0; i < 8; i++) {
        const rip = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.032), mats.ripple);
        levelGroup.add(rip);
        ripples.push(rip);
      }

      // 前景三件定标几何体（朱橙球、暖金方、朱橙横块）
      const propOrb = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), mats.propOrb);
      const propSq = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.65), mats.propSq);
      const propRect = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.7), mats.propRect);
      levelGroup.add(propOrb, propSq, propRect);
      root.add(levelGroup);

      // 6. 漂浮云岚片与飞鸟
      const clouds = [makeCloudMesh(mats.cloud), makeCloudMesh(mats.cloud), makeCloudMesh(mats.cloud)];
      clouds.forEach((cl) => root.add(cl));

      const birdGeo = new THREE.BufferGeometry();
      birdGeo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute([-0.14, 0, 0, -0.05, 0.06, 0, 0, 0.01, 0, 0, 0.01, 0, 0.05, 0.06, 0, 0.14, 0, 0], 3)
      );
      const birds = [0, 1, 2].map(() => {
        const m = new THREE.Line(birdGeo, mats.bird);
        root.add(m);
        return m;
      });

      // 7. 三维剖轴模式才浮现的 XYZ 立体空间轴棒（Y↑高远 / Z→深远 / X↔平远）
      const axisGroup = new THREE.Group();
      const yRod = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 5.2, 8), mats.axisHigh);
      const yTip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 8), mats.axisHigh);
      yTip.position.y = 2.7;
      const zRod = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 4.8, 8), mats.axisDeep);
      zRod.rotation.x = Math.PI * 0.5;
      zRod.position.z = -1.6;
      const zTip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 8), mats.axisDeep);
      zTip.rotation.x = -Math.PI * 0.5;
      zTip.position.z = -4.1;
      const xRod = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 7.6, 8), mats.axisLevel);
      xRod.rotation.z = Math.PI * 0.5;
      xRod.position.y = -2.25;
      const xTipL = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 8), mats.axisLevel);
      xTipL.rotation.z = Math.PI * 0.5;
      xTipL.position.set(-3.9, -2.25, 0);
      const xTipR = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 8), mats.axisLevel);
      xTipR.rotation.z = -Math.PI * 0.5;
      xTipR.position.set(3.9, -2.25, 0);
      axisGroup.add(yRod, yTip, zRod, zTip, xRod, xTipL, xTipR);
      root.add(axisGroup);

      const sunTextures = {};
      function applyPalette(sceneKey) {
        if (sceneKey === lastSceneKey) return;
        lastSceneKey = sceneKey;
        const p = SCENES[sceneKey].palette;
        scene.background.set(p.sky);
        if (!sunTextures[sceneKey]) {
          const tex = new THREE.CanvasTexture(makeHalftoneSunTexture(p.sunFill, p.sunDot));
          tex.colorSpace = THREE.SRGBColorSpace;
          sunTextures[sceneKey] = tex;
        }
        mats.sun.map = sunTextures[sceneKey];
        mats.sun.needsUpdate = true;
        mats.highMain.color.set(p.highMain);
        mats.coneFront.color.set(p.coneFront);
        mats.deepOuterL.color.set(p.deepOuterL);
        mats.deepOuterR.color.set(p.deepOuterR);
        mats.deepInner.color.set(p.deepInner);
        mats.deepFar.color.set(p.deepFar);
        mats.deepOrb.color.set(p.deepOrb);
        mats.mist.color.set(p.mistBand);
        mats.fogVeil.color.set(p.sky);
        mats.cloud.color.set(p.cloud);
        mats.waterTop.color.set(p.waterTop);
        mats.waterMid.color.set(p.waterMid);
        mats.waterBase.color.set(p.waterBase);
        mats.ripple.color.set(p.ripple);
        mats.propOrb.color.set(p.propOrb);
        mats.propSq.color.set(p.propSq);
        mats.propRect.color.set(p.propRect);
        mats.bird.color.set(p.bird);
        mats.axisHigh.color.set(p.guide);
        mats.axisDeep.color.set(p.guideDeep);
        mats.axisLevel.color.set(p.guideLevel);
      }

      glEngine = {
        resize(w, h) {
          width = w;
          height = h;
          renderer.setPixelRatio(getDpr());
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          // 保持完整三角金字塔在窄屏与宽屏都不被裁切
          const baseZ = w / h < 1.35 ? 12.6 : 11.2;
          camera.userData.baseZ = baseZ;
          camera.updateProjectionMatrix();
        },
        render(state, t, dt, still) {
          applyPalette(state.scene);
          const target = stepSmooth(state, dt, still);
          const s = smooth;
          const easeRev = 1 - Math.pow(1 - reveal, 3);

          // 3D 剖轴旋转：正视成画 (0,0) ↔ 三维剖轴（清晰展露 Y↑ 高远 / Z→ 深远 / X↔ 平远）
          const yaw = viewLerp * 0.64;
          const pitch = viewLerp * 0.28;
          const baseZ = camera.userData.baseZ || 11.2;
          const dist = baseZ + viewLerp * 2.2;
          camera.position.set(Math.sin(yaw) * dist, Math.sin(pitch) * dist * 0.68 + 0.12, Math.cos(yaw) * dist);
          camera.lookAt(0, -0.1, -viewLerp * 0.9);

          // 三维剖轴 XYZ 指示棒显隐
          const axOp = Math.max(0, (viewLerp - 0.15) / 0.85) * 0.88;
          mats.axisHigh.opacity = axOp;
          mats.axisDeep.opacity = axOp;
          mats.axisLevel.opacity = axOp;
          axisGroup.visible = axOp > 0.02;

          // 1. 淡金网点大日轮（随高远峰位轻微联动）
          const px = uToX(s.peakX);
          const py = vToY(s.peakY);
          const baseH = vToY(s.peakBaseY);
          const sunScale = (0.76 + (s.highW / 100) * 0.45) * easeRev;
          sunMesh.position.set(px * 0.65, py - 0.55, -2.5 - s.depthReach * 0.8);
          sunMesh.scale.set(sunScale, sunScale, 1);

          // 2. 高远主峰（向上拔起）
          const peakHeight = Math.max(0.9, (py - baseH) * easeRev + 0.85);
          const peakW = s.peakHalfW * WORLD_W * 1.15;
          mainPeak.position.set(px, baseH - 0.85, -1.65 - s.depthReach * 0.55);
          mainPeak.scale.set(peakW, peakHeight, Math.max(0.7, peakW * 0.58));

          // 中层浅薰衣草过渡锥体（连结高远与深远）
          const coneH = peakHeight * 0.72;
          midCone.position.set(lerpNum(px, uToX(s.valleyX), 0.35), baseH - 1.15, -1.15 - s.depthReach * 0.38);
          midCone.scale.set(peakW * 1.55, coneH, 0.72);

          // 3. 深远重峦（沿 Z 轴向内推深）
          const vx = uToX(s.valleyX);
          const vy = vToY(s.valleyY);
          const zStep = 0.72 + s.depthReach * 1.15;
          const deepScaleY = (0.75 + (s.deepW / 100) * 1.6) * easeRev;

          deepLeft1.position.set(vx - 1.55, vy - 0.85, 0.15);
          deepLeft1.scale.set(1.55, 1.95 * deepScaleY, 0.9);
          deepRight1.position.set(vx + 1.5, vy - 0.85, -0.05);
          deepRight1.scale.set(1.5, 1.82 * deepScaleY, 0.9);

          deepCenter.position.set(vx, vy - 0.42, -zStep * 0.62);
          deepCenter.scale.set(1.38, 1.72 * deepScaleY, 0.85);

          deepLeft2.visible = s.deepLayers >= 3;
          deepRight2.visible = s.deepLayers >= 3;
          deepLeft2.position.set(vx - 0.98, vy - 0.48, -zStep * 0.95);
          deepLeft2.scale.set(1.18, 1.38 * deepScaleY, 0.75);
          deepRight2.position.set(vx + 0.96, vy - 0.5, -zStep * 1.1);
          deepRight2.scale.set(1.16, 1.32 * deepScaleY, 0.75);

          deepFarL.visible = s.deepLayers >= 4;
          deepFarR.visible = s.deepLayers >= 5;
          deepFarL.position.set(vx - 0.52, vy - 0.25, -zStep * 1.55);
          deepFarL.scale.set(0.88, 1.02 * deepScaleY, 0.65);
          deepFarR.position.set(vx + 0.56, vy - 0.26, -zStep * 1.82);
          deepFarR.scale.set(0.85, 0.94 * deepScaleY, 0.65);

          // 远心朱橙小落日（深远尽头归宿）
          deepOrb.position.set(vx, vy + 0.12, -zStep * 1.35);
          const orbPulse = 0.92 + Math.sin(t * 1.6) * 0.05;
          deepOrb.scale.setScalar((0.75 + (s.deepW / 100) * 0.6) * orbPulse * easeRev);

          // 4. 烟岚通脉与浓雾吞山
          mats.mist.opacity = clamp(s.mistNorm * 0.78, 0, 0.78);
          mistBand1.position.set(lerpNum(px, vx, 0.5), baseH - 0.18, -0.55 - s.depthReach * 0.2);
          mistBand1.scale.set(0.85 + s.mistNorm * 0.35, 0.55 + s.mistNorm * 0.95, 1);

          mistBand2.position.set(vx, vy - 0.22, 0.55);
          mistBand2.scale.set(0.82 + s.mistNorm * 0.4, 0.42 + s.mistNorm * 0.8, 1);

          mats.fogVeil.opacity = s.fogObscure * 0.86;
          fogVeil.visible = s.fogObscure > 0.01;
          fogVeil.position.set(vx * 0.4, vy + 0.35, 0.82);

          // 5. 平远阔水基台（水平展幅 + 倾角）
          const spanW = s.baseSpan * WORLD_W * easeRev;
          const wy = vToY(s.waterY);
          levelGroup.position.set(0, wy, 0.6);
          levelGroup.rotation.z = -s.waterTiltRad;

          waterBack.position.set(0, 0.24, -0.52);
          waterBack.scale.set(spanW * 0.8, 1, 1);
          waterMid.position.set(0, -0.14, 0.08);
          waterMid.scale.set(spanW * 0.92, 1, 1);
          waterFront.position.set(0, -0.54, 0.72);
          waterFront.scale.set(spanW, 1, 1);

          // 白色细水平波纹
          const ripSpec = [
            [-0.28, 0.28, 0.24, -0.15],
            [0.24, 0.22, 0.18, -0.15],
            [-0.14, -0.08, 0.26, 0.55],
            [0.18, -0.16, 0.22, 0.55],
            [-0.31, -0.45, 0.2, 1.28],
            [-0.04, -0.52, 0.28, 1.28],
            [0.26, -0.56, 0.22, 1.28],
            [0.08, -0.68, 0.16, 1.28],
          ];
          ripples.forEach((rip, i) => {
            const [rx, ry, rw, rz] = ripSpec[i];
            rip.position.set(rx * spanW, ry, rz);
            rip.scale.set(rw * spanW * 0.48, 1, 1);
          });

          // 前景三件定标体（相对 levelGroup 坐标）
          const orbR3 = s.orbR * WORLD_H;
          propOrb.position.set(uToX(s.orbX), vToY(s.orbY) - wy, 1.25);
          propOrb.scale.setScalar(orbR3 * easeRev);

          propSq.position.set(uToX(s.sqX), vToY(s.sqY) - wy, 0.62);
          propSq.scale.set(s.sqS * WORLD_W * easeRev, s.sqS * WORLD_W * easeRev, 1);

          propRect.position.set(uToX(s.rectX), vToY(s.rectY) - wy, 1.15);
          propRect.scale.set(s.rectW * WORLD_W * easeRev, s.rectH * WORLD_H * easeRev, 1);

          // 6. 缓漂云片与飞鸟
          const drift = still ? 0 : Math.sin(t * 0.55) * 0.18;
          clouds[0].position.set(px - 1.7 + drift, py - 0.65, -1.9);
          clouds[0].scale.set(1.15, 0.9, 1);
          clouds[1].position.set(px + 1.55 - drift * 0.8, py - 0.42, -2.0);
          clouds[1].scale.set(1.05, 0.85, 1);
          clouds[2].position.set(px + 1.35 + drift * 0.6, baseH + 0.42, -1.1);
          clouds[2].scale.set(1.45, 1.0, 1);

          const birdSpec = [
            [px + 2.25, py - 0.18, 1.0],
            [px + 2.65, py - 0.52, 0.82],
            [px + 2.15, py - 0.72, 0.72],
          ];
          birds.forEach((b, i) => {
            const [bx, by, bs] = birdSpec[i];
            const flap = still ? 0 : Math.sin(t * 2.4 + i * 1.4) * 0.04;
            b.position.set(bx + drift * 0.5, by + flap, -1.5);
            b.scale.setScalar(bs);
          });

          renderer.render(scene, camera);
          if (onFrameInfo) onFrameInfo({ target, viewLerp, isWebGL: true });
        },
      };
    } catch {
      glEngine = null;
    }
  }

  // ==================== 2D Canvas 降级路径（共用 model.js 单真源） ====================
  let ctx2d = null;
  let sunCanvas2d = null;
  let lastSunKey2d = "";

  function render2D(state, t, dt, still) {
    if (!ctx2d) ctx2d = canvas.getContext("2d");
    const target = stepSmooth(state, dt, still);
    const s = smooth;
    const p = SCENES[state.scene].palette;
    const dpr = pixelRatio(window.innerWidth < 600 ? 1.5 : 2);
    const cw = Math.max(1, Math.round(width * dpr));
    const ch = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    if (lastSunKey2d !== state.scene) {
      lastSunKey2d = state.scene;
      sunCanvas2d = makeHalftoneSunTexture(p.sunFill, p.sunDot);
    }

    const ctx = ctx2d;
    ctx.save();
    ctx.scale(dpr, dpr);
    const W = width;
    const H = height;
    const easeRev = 1 - Math.pow(1 - reveal, 3);

    // 暖宣米纸底
    ctx.fillStyle = p.sky;
    ctx.fillRect(0, 0, W, H);

    // 三维剖轴斜视投影偏移（2D 降级版同样忠实演示 XYZ 三轴错层！）
    const isoX = viewLerp * W * 0.085;
    const isoY = viewLerp * H * 0.055;
    const shiftZ = (zDepth) => ({ dx: isoX * zDepth, dy: -isoY * zDepth });

    // 1. 淡金网点日轮
    const sunShift = shiftZ(1.1);
    const sunR = Math.min(W, H) * (0.15 + (s.highW / 100) * 0.09) * easeRev;
    const sunX = s.peakX * W * 0.8 + W * 0.1 + sunShift.dx;
    const sunY = (s.peakY + 0.1) * H + sunShift.dy;
    ctx.drawImage(sunCanvas2d, sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);

    // 2. 高远主峰 + 浅薰衣草中锥
    const highShift = shiftZ(0.85);
    const peakTopX = s.peakX * W + highShift.dx;
    const peakTopY = s.peakY * H + highShift.dy;
    const peakBaseY = s.peakBaseY * H + highShift.dy;
    const peakHalf = s.peakHalfW * W;

    ctx.fillStyle = p.highMain;
    ctx.beginPath();
    ctx.moveTo(peakTopX, peakTopY);
    ctx.lineTo(peakTopX + peakHalf, peakBaseY + H * 0.1);
    ctx.lineTo(peakTopX - peakHalf, peakBaseY + H * 0.1);
    ctx.closePath();
    ctx.fill();

    // 主峰暗面（右半受阴影，立体折面感）
    ctx.fillStyle = p.highShadow;
    ctx.beginPath();
    ctx.moveTo(peakTopX, peakTopY);
    ctx.lineTo(peakTopX + peakHalf, peakBaseY + H * 0.1);
    ctx.lineTo(peakTopX, peakBaseY + H * 0.1);
    ctx.closePath();
    ctx.fill();

    // 浅薰衣草过渡锥面
    const vx = s.valleyX * W;
    const vy = s.valleyY * H;
    const coneShift = shiftZ(0.55);
    ctx.fillStyle = p.coneFront;
    ctx.beginPath();
    ctx.moveTo(lerpNum(peakTopX, vx, 0.25) + coneShift.dx * 0.3, lerpNum(peakTopY, peakBaseY, 0.35));
    ctx.lineTo(vx + peakHalf * 1.42, vy + H * 0.08);
    ctx.lineTo(vx - peakHalf * 1.42, vy + H * 0.08);
    ctx.closePath();
    ctx.fill();

    // 3. 深远层叠重峦（由远到近绘出 2–5 层）
    const deepH = H * (0.14 + (s.deepW / 100) * 0.22) * easeRev;
    const drawPeak = (cx, by, hw, hh, color, zL) => {
      const sh = shiftZ(zL);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx + sh.dx, by - hh + sh.dy);
      ctx.lineTo(cx + hw + sh.dx, by + sh.dy);
      ctx.lineTo(cx - hw + sh.dx, by + sh.dy);
      ctx.closePath();
      ctx.fill();
    };
    if (s.deepLayers >= 4) {
      drawPeak(vx - W * 0.05, vy + H * 0.04, W * 0.09, deepH * 0.65, p.deepFar, 0.9);
      if (s.deepLayers >= 5) drawPeak(vx + W * 0.06, vy + H * 0.04, W * 0.09, deepH * 0.58, p.deepFar, 1.0);
    }
    if (s.deepLayers >= 3) {
      drawPeak(vx - W * 0.1, vy + H * 0.08, W * 0.12, deepH * 0.82, p.deepInner, 0.55);
      drawPeak(vx + W * 0.1, vy + H * 0.08, W * 0.12, deepH * 0.78, p.deepOuterR, 0.6);
    }
    drawPeak(vx, vy + H * 0.06, W * 0.13, deepH * 0.96, p.deepInner, 0.45);
    drawPeak(vx - W * 0.16, vy + H * 0.12, W * 0.14, deepH * 1.12, p.deepOuterL, 0.15);
    drawPeak(vx + W * 0.15, vy + H * 0.12, W * 0.14, deepH * 1.05, p.deepOuterR, 0.2);

    // 远心朱橙小落日
    const orbSh = shiftZ(0.75);
    ctx.fillStyle = p.deepOrb;
    ctx.beginPath();
    ctx.arc(vx + orbSh.dx, vy + orbSh.dy, Math.min(W, H) * (0.017 + (s.deepW / 100) * 0.012), 0, Math.PI * 2);
    ctx.fill();

    // 4. 烟岚通脉纱带
    if (s.mistNorm > 0.02) {
      const grad1 = ctx.createLinearGradient(0, peakBaseY - 26, 0, peakBaseY + 26);
      grad1.addColorStop(0, "rgba(248,239,224,0)");
      grad1.addColorStop(0.5, p.mistBand);
      grad1.addColorStop(1, "rgba(248,239,224,0)");
      ctx.save();
      ctx.globalAlpha = clamp(s.mistNorm * 0.85, 0, 0.85);
      ctx.fillStyle = grad1;
      ctx.fillRect(W * 0.08, peakBaseY - 24, W * 0.84, 48);
      ctx.fillRect(W * 0.12, vy - 12, W * 0.76, 36);
      ctx.restore();
    }
    if (s.fogObscure > 0.01) {
      ctx.save();
      ctx.globalAlpha = s.fogObscure * 0.88;
      ctx.fillStyle = p.sky;
      ctx.fillRect(0, peakBaseY - H * 0.08, W, H * 0.5);
      ctx.restore();
    }

    // 5. 平远阔水基台与前景几何定标
    const wy = s.waterY * H;
    const spanPx = s.baseSpan * W * easeRev;
    ctx.save();
    ctx.translate(W * 0.5, wy);
    ctx.rotate(s.waterTiltRad);
    ctx.fillStyle = p.waterTop;
    ctx.fillRect(-spanPx * 0.4, -H * 0.055, spanPx * 0.8, H * 0.06);
    ctx.fillStyle = p.waterMid;
    ctx.fillRect(-spanPx * 0.46, 0, spanPx * 0.92, H * 0.065);
    ctx.fillStyle = p.waterBase;
    ctx.beginPath();
    ctx.moveTo(-spanPx * 0.46, H * 0.062);
    ctx.lineTo(spanPx * 0.46, H * 0.062);
    ctx.lineTo(spanPx * 0.5, H * 0.145);
    ctx.lineTo(-spanPx * 0.5, H * 0.145);
    ctx.closePath();
    ctx.fill();

    // 细白水平波纹
    ctx.strokeStyle = p.ripple;
    ctx.lineWidth = 1.6;
    [
      [-0.3, -0.025, 0.2],
      [0.14, -0.02, 0.16],
      [-0.18, 0.032, 0.24],
      [0.12, 0.036, 0.2],
      [-0.32, 0.095, 0.22],
      [-0.02, 0.11, 0.26],
      [0.24, 0.102, 0.18],
    ].forEach(([rx, ry, rw]) => {
      ctx.beginPath();
      ctx.moveTo(rx * spanPx, ry * H);
      ctx.lineTo((rx + rw) * spanPx, ry * H);
      ctx.stroke();
    });

    // 前景三件定标体（圆保持真圆，绝不压扁）
    const rPx = s.orbR * Math.min(W, H) * easeRev;
    ctx.fillStyle = p.propOrb;
    ctx.beginPath();
    ctx.arc((s.orbX - 0.5) * W, (s.orbY - s.waterY) * H, rPx, 0, Math.PI * 2);
    ctx.fill();

    const sqPx = s.sqS * Math.min(W, H) * easeRev;
    ctx.fillStyle = p.propSq;
    ctx.fillRect((s.sqX - 0.5) * W - sqPx * 0.5, (s.sqY - s.waterY) * H - sqPx * 0.5, sqPx, sqPx);

    const rwPx = s.rectW * W * easeRev;
    const rhPx = s.rectH * H * easeRev;
    ctx.fillStyle = p.propRect;
    ctx.fillRect((s.rectX - 0.5) * W - rwPx * 0.5, (s.rectY - s.waterY) * H - rhPx * 0.5, rwPx, rhPx);
    ctx.restore();

    // 6. 淡丁香云片与飞鸟
    const drift = still ? 0 : Math.sin(t * 0.55) * 8;
    ctx.fillStyle = p.cloud;
    ctx.globalAlpha = 0.72;
    const drawCloud = (cx, cy, cw, ch) => {
      ctx.beginPath();
      ctx.roundRect(cx - cw * 0.5, cy - ch * 0.5, cw, ch, ch * 0.5);
      ctx.fill();
    };
    drawCloud(peakTopX - W * 0.16 + drift, peakTopY + H * 0.12, W * 0.11, 14);
    drawCloud(peakTopX + W * 0.15 - drift * 0.8, peakTopY + H * 0.08, W * 0.1, 13);
    drawCloud(peakTopX + W * 0.13 + drift * 0.6, peakBaseY - H * 0.05, W * 0.14, 15);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = p.bird;
    ctx.lineWidth = 1.6;
    [
      [peakTopX + W * 0.21, peakTopY + H * 0.07, 10],
      [peakTopX + W * 0.25, peakTopY + H * 0.12, 8],
    ].forEach(([bx, by, bs]) => {
      ctx.beginPath();
      ctx.moveTo(bx - bs, by);
      ctx.quadraticCurveTo(bx - bs * 0.5, by - bs * 0.5, bx, by);
      ctx.quadraticCurveTo(bx + bs * 0.5, by - bs * 0.5, bx + bs, by);
      ctx.stroke();
    });

    // 7. 2D 降级下的 XYZ 三维剖轴指示线
    if (viewLerp > 0.15) {
      ctx.save();
      ctx.globalAlpha = clamp((viewLerp - 0.15) / 0.85, 0, 1) * 0.85;
      ctx.lineWidth = 2;
      ctx.strokeStyle = p.guide;
      ctx.beginPath();
      ctx.moveTo(W * 0.5, H * 0.84);
      ctx.lineTo(W * 0.5, H * 0.1);
      ctx.stroke();
      ctx.strokeStyle = p.guideDeep;
      ctx.beginPath();
      ctx.moveTo(W * 0.5, H * 0.6);
      ctx.lineTo(W * 0.5 + isoX * 1.4, H * 0.6 - isoY * 1.4);
      ctx.stroke();
      ctx.strokeStyle = p.guideLevel;
      ctx.beginPath();
      ctx.moveTo(W * 0.14, H * 0.84);
      ctx.lineTo(W * 0.86, H * 0.84);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
    if (onFrameInfo) onFrameInfo({ target, viewLerp, isWebGL: false });
  }

  function syncSize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width));
    const h = Math.max(180, Math.round(rect.height));
    if (w !== width || h !== height) {
      width = w;
      height = h;
      if (glEngine) glEngine.resize(w, h);
    }
  }

  // 初始化尺寸
  syncSize();
  if (glEngine) glEngine.resize(width, height);
  const ro = new ResizeObserver(() => {
    syncSize();
    ctl.draw();
  });
  ro.observe(canvas);

  const ctl = loop(canvas, (t, dt, { still }) => {
    const state = getState();
    if (glEngine) glEngine.render(state, t, dt, still);
    else render2D(state, t, dt, still);
  });

  // 立即画出第一帧，避免空白闪屏
  ctl.draw();

  return {
    draw: ctl.draw,
    isWebGL: !!glEngine,
    destroy: () => ro.disconnect(),
  };
}

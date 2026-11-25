// Three.js 3D 午夜水桥片场（复刻 310 原海报的午夜紫靛 × 冰川亮青建筑空间与立牌母题）
// 全员极简无五官背影/侧影，坐标与投影与 model.js 完全一致；关闭 WebGL 时自动由 scene-flat.js 接管。

import * as THREE from "three";
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  SENSOR_H,
  CAM_Y,
  ASPECT,
  Z_MIN,
  Z_MAX,
  LANE_MIN,
  LANE_MAX,
  PERSON_H,
  cameraShiftZ,
  laneToWorldX,
  clamp,
} from "./model.js";

// 生成原海报同款高窄大写建筑立体字纹理（自动测宽防裁切，字体就绪后可原地重绘）
function paintLabelCanvas(c, lines, color, opacity = 0.9) {
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const maxW = c.width * 0.92;
  const baseSize = lines.length > 1 ? 196 : 200;
  let size = baseSize;
  ctx.font = `400 ${size}px "Bebas Neue", "Arial Narrow", sans-serif`;
  for (const line of lines) {
    const mw = ctx.measureText(line).width;
    if (mw > maxW) size = Math.min(size, Math.floor(size * (maxW / mw)));
  }
  ctx.font = `400 ${size}px "Bebas Neue", "Arial Narrow", sans-serif`;
  if (lines.length === 1) {
    ctx.fillText(lines[0], c.width / 2, c.height / 2 + 6);
  } else {
    ctx.fillText(lines[0], c.width / 2, c.height * 0.3);
    ctx.fillText(lines[1], c.width / 2, c.height * 0.72);
  }
}

function makeLabelTexture(lines, color, opacity = 0.9) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = lines.length > 1 ? 512 : 256;
  paintLabelCanvas(c, lines, color, opacity);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      paintLabelCanvas(c, lines, color, opacity);
      tex.needsUpdate = true;
    });
  }
  return tex;
}

// 天空渐变背景贴图（复刻 310 原海报由深紫顶沿过渡到暮紫与暖月天际的夜空）
function makeSkyTexture() {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, "#241653");
  g.addColorStop(0.28, "#4B3B78");
  g.addColorStop(0.56, "#8873A8");
  g.addColorStop(0.76, "#B4A3C8");
  g.addColorStop(1.0, "#4A436D");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 极简无五官人物剪影网格（风衣/披风/圆帽轮廓，高恰好 1.76m，脚底 y = 0）
function makeSilhouetteMesh(actorMeta) {
  const group = new THREE.Group();
  const s = new THREE.Shape();

  // 从双脚向上勾勒极简长风衣剪影（对称或微侧，绝无五官）
  s.moveTo(-0.13, 0.0);
  s.lineTo(-0.07, 0.0);
  s.lineTo(-0.03, 0.42);
  s.lineTo(0.03, 0.42);
  s.lineTo(0.07, 0.0);
  s.lineTo(0.13, 0.0);
  // 右侧衣摆与肩
  s.lineTo(0.16, 0.44);
  s.lineTo(0.23, 0.56);
  s.lineTo(0.25, 1.30);
  s.quadraticCurveTo(0.25, 1.44, 0.11, 1.46);
  // 颈与头（简洁椭圆无五官）
  s.lineTo(0.075, 1.50);
  s.quadraticCurveTo(0.115, 1.62, 0.085, 1.72);
  s.quadraticCurveTo(0.0, 1.77, -0.085, 1.72);
  s.quadraticCurveTo(-0.115, 1.62, -0.075, 1.50);
  s.lineTo(-0.11, 1.46);
  s.quadraticCurveTo(-0.25, 1.44, -0.25, 1.30);
  s.lineTo(-0.23, 0.56);
  s.lineTo(-0.16, 0.44);
  s.closePath();

  const bodyGeo = new THREE.ShapeGeometry(s, 12);
  const bodyMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(actorMeta.ink),
    side: THREE.DoubleSide,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // 轻微轮廓边缘提亮线（确保在深海蓝墙前依然剪影清晰不糊成一团）
  const edgeGeo = new THREE.EdgesGeometry(bodyGeo, 25);
  const rimMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(actorMeta.color),
    transparent: true,
    opacity: 0.48,
  });
  const rim = new THREE.LineSegments(edgeGeo, rimMat);
  rim.position.z = 0.005;
  group.add(rim);

  // 角色特征小道具剪影（执信者拿细长公文盒，远岸影戴平檐帽，无任何面部五官）
  if (actorMeta.prop === "briefcase") {
    const caseGeo = new THREE.PlaneGeometry(0.26, 0.19);
    const caseMat = new THREE.MeshBasicMaterial({ color: "#091830", side: THREE.DoubleSide });
    const box = new THREE.Mesh(caseGeo, caseMat);
    box.position.set(0.32, 0.62, 0.01);
    const boxEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(caseGeo),
      new THREE.LineBasicMaterial({ color: "#8AD6CB", transparent: true, opacity: 0.72 })
    );
    box.add(boxEdge);
    group.add(box);
  } else if (actorMeta.prop === "hat") {
    const brim = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.032),
      bodyMat
    );
    brim.position.set(0, 1.71, 0.008);
    group.add(brim);
  }

  // 脚底定位光环（选中或拖动时高亮，清楚标示深度落脚点）
  const ringGeo = new THREE.RingGeometry(0.24, 0.34, 24);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(actorMeta.color),
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.018;
  group.add(ring);

  // 遮挡警戒外框（只有被挡死时亮起珊瑚橙）
  const warnGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.68, PERSON_H + 0.14));
  const warnMat = new THREE.LineBasicMaterial({ color: "#F08A6C", transparent: true, opacity: 0 });
  const warnBox = new THREE.LineSegments(warnGeo, warnMat);
  warnBox.position.set(0, PERSON_H * 0.5 + 0.04, 0.02);
  group.add(warnBox);

  // 头顶简洁 A / B / C 标识牌（清晰辨认角色，小巧克制）
  const tagCanvas = document.createElement("canvas");
  tagCanvas.width = 128;
  tagCanvas.height = 64;
  const tctx = tagCanvas.getContext("2d");
  tctx.fillStyle = "rgba(18, 12, 47, 0.86)";
  tctx.fillRect(10, 8, 108, 48);
  tctx.strokeStyle = actorMeta.color;
  tctx.lineWidth = 4;
  tctx.strokeRect(10, 8, 108, 48);
  tctx.fillStyle = "#F5ECE0";
  tctx.font = '700 32px "DM Mono", monospace';
  tctx.textAlign = "center";
  tctx.textBaseline = "middle";
  tctx.fillText(actorMeta.id, 64, 33);
  const tagTex = new THREE.CanvasTexture(tagCanvas);
  tagTex.colorSpace = THREE.SRGBColorSpace;
  const tagMat = new THREE.SpriteMaterial({ map: tagTex, transparent: true, depthTest: false });
  const tag = new THREE.Sprite(tagMat);
  tag.position.set(0, PERSON_H + 0.28, 0.02);
  tag.scale.set(0.46, 0.23, 1);
  group.add(tag);

  return { group, bodyMat, rimMat, ringMat, warnMat, tag };
}

export function mountScene3D(host, store) {
  const canvas = document.createElement("canvas");
  canvas.className = "stage-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "default",
  });
  renderer.setPixelRatio(pixelRatio(1.5));
  renderer.setClearColor(0x1a0e40, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#1A0E40");
  scene.fog = new THREE.FogExp2("#241850", 0.0085);

  const camera = new THREE.PerspectiveCamera(
    (2 * Math.atan((SENSOR_H / 2) / 35) * 180) / Math.PI,
    ASPECT,
    0.2,
    180
  );
  camera.position.set(0, CAM_Y, 0);
  camera.lookAt(0, CAM_Y, -20);

  // 1. 远方暮紫天空幕布 + 暖米圆月 + 远山剪影（直接复刻 310 原海报深空）
  const skyPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 62),
    new THREE.MeshBasicMaterial({ map: makeSkyTexture(), fog: false })
  );
  skyPlane.position.set(0, 15, -62);
  scene.add(skyPlane);

  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(3.5, 40),
    new THREE.MeshBasicMaterial({ color: "#EDDACD", fog: false })
  );
  moon.position.set(-7.2, 11.4, -58);
  scene.add(moon);

  // 远山两重剪影
  const makeHill = (pts, color, zPos) => {
    const sh = new THREE.Shape();
    sh.moveTo(pts[0][0], -2);
    for (const [x, y] of pts) sh.lineTo(x, y);
    sh.lineTo(pts[pts.length - 1][0], -2);
    sh.closePath();
    const m = new THREE.Mesh(
      new THREE.ShapeGeometry(sh),
      new THREE.MeshBasicMaterial({ color, fog: false })
    );
    m.position.z = zPos;
    return m;
  };
  scene.add(makeHill([[-56, 3.6], [-32, 6.2], [-10, 4.1], [12, 6.8], [38, 4.9], [58, 3.8]], "#8773A8", -54));
  scene.add(makeHill([[-56, 1.8], [-24, 4.1], [-4, 2.5], [16, 4.2], [44, 2.9], [58, 2.0]], "#6A568E", -48));

  // 2. 浅水湖面（从近到远反出月光与青光）
  const waterGeo = new THREE.PlaneGeometry(120, 72);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(
    waterGeo,
    new THREE.MeshBasicMaterial({ color: "#2D295E" })
  );
  water.position.set(0, -0.38, -28);
  scene.add(water);

  // 水面月光反光光带（细横波）
  const rippleGroup = new THREE.Group();
  const rippleMat = new THREE.MeshBasicMaterial({ color: "#B8A8CF", transparent: true, opacity: 0.34 });
  for (let i = 0; i < 16; i++) {
    const rz = -6 - i * 2.5;
    const rw = 2.6 + (i % 3) * 1.4;
    const rMesh = new THREE.Mesh(new THREE.PlaneGeometry(rw, 0.08), rippleMat);
    rMesh.rotation.x = -Math.PI / 2;
    rMesh.position.set(-1.6 + Math.sin(i * 1.7) * 1.6, -0.35, rz);
    rippleGroup.add(rMesh);
  }
  scene.add(rippleGroup);

  // 3. 标志性建筑纵深结构：前景冰川青桥面 + 中景深海蓝跨水平台与左侧墙体 + 后景远岸栈道
  // 注意：ShapeGeometry 经 rotateX(-Math.PI/2) 后，2D 的 +y 映射到 3D 的 -z（摄影机正前方）！
  const bridgeShape = new THREE.Shape();
  bridgeShape.moveTo(-2.3, 1.0);
  bridgeShape.lineTo(2.3, 1.0);
  bridgeShape.lineTo(9.8, 27.5);
  bridgeShape.lineTo(-9.8, 27.5);
  bridgeShape.closePath();
  const bridgeGeo = new THREE.ShapeGeometry(bridgeShape);
  bridgeGeo.rotateX(-Math.PI / 2);
  const bridge = new THREE.Mesh(
    bridgeGeo,
    new THREE.MeshBasicMaterial({ color: "#123C56" })
  );
  bridge.position.y = -0.025;
  scene.add(bridge);

  // 三个纵深景层色带地板条（前景明青 / 中景深海青 / 后景暮紫，直观呼应海报三景片！）
  const makeZoneStrip = (zStart, zEnd, wStart, wEnd, color, opacity = 0.86) => {
    const sh = new THREE.Shape();
    sh.moveTo(-wStart, zStart);
    sh.lineTo(wStart, zStart);
    sh.lineTo(wEnd, zEnd);
    sh.lineTo(-wEnd, zEnd);
    sh.closePath();
    const g = new THREE.ShapeGeometry(sh);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(
      g,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
    );
    m.position.y = -0.005;
    return m;
  };
  scene.add(makeZoneStrip(1.2, 5.6, 2.2, 3.2, "#1E7B8F", 0.88));
  scene.add(makeZoneStrip(6.6, 14.8, 3.4, 5.9, "#164A69", 0.84));
  scene.add(makeZoneStrip(16.2, 26.8, 6.2, 9.6, "#5C4786", 0.86));

  // 中景左侧深海蓝矮墙（左移避免遮挡远景 BACKGROUND，复刻原海报「MIDDLE GROUND」所在立墙）
  const midWall = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 2.35, 0.32),
    new THREE.MeshBasicMaterial({ color: "#143052" })
  );
  midWall.position.set(-6.15, 1.15, -12.6);
  scene.add(midWall);

  // 右侧高挑青绿暗门框立柱（复刻原海报右缘青靛画框边框）
  const rightPillar = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 16, 1.4),
    new THREE.MeshBasicMaterial({ color: "#103D48" })
  );
  rightPillar.position.set(5.9, 5.0, -7.8);
  scene.add(rightPillar);

  const leftPillar = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 16, 1.2),
    new THREE.MeshBasicMaterial({ color: "#211550" })
  );
  leftPillar.position.set(-6.2, 5.0, -7.8);
  scene.add(leftPillar);

  // 4. 原海报三块标志性立体建筑字：FOREGROUND / MIDDLE GROUND / BACKGROUND（全部完整清晰不互遮）
  const fgWordTex = makeLabelTexture(["FOREGROUND"], "#9EE4D9", 0.94);
  const fgWord = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 0.9),
    new THREE.MeshBasicMaterial({ map: fgWordTex, transparent: true, depthWrite: false, fog: false })
  );
  fgWord.rotation.x = -Math.PI / 2;
  fgWord.position.set(0.0, 0.025, -4.55);
  scene.add(fgWord);

  const mgWordTex = makeLabelTexture(["MIDDLE", "GROUND"], "#3B92AE", 0.94);
  const mgWord = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 1.85),
    new THREE.MeshBasicMaterial({ map: mgWordTex, transparent: true, depthWrite: false, fog: false })
  );
  mgWord.position.set(-5.7, 1.2, -12.35);
  scene.add(mgWord);

  const bgWordTex = makeLabelTexture(["BACKGROUND"], "#5B4784", 0.92);
  const bgWord = new THREE.Mesh(
    new THREE.PlaneGeometry(15.2, 3.8),
    new THREE.MeshBasicMaterial({ map: bgWordTex, transparent: true, depthWrite: false, fog: false })
  );
  bgWord.position.set(-0.2, 3.9, -28.5);
  scene.add(bgWord);

  // 5. 透视辅助导引线组（可开关，展示地平线、三层边界横线与纵深收敛线）
  const guideGroup = new THREE.Group();
  const guideMat = new THREE.LineBasicMaterial({ color: "#8AD6CB", transparent: true, opacity: 0.42 });
  const boundaryMat = new THREE.LineBasicMaterial({ color: "#ECDDCB", transparent: true, opacity: 0.36 });

  const makeLine = (pts, mat) => {
    const geo = new THREE.BufferGeometry().setFromPoints(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    return new THREE.Line(geo, mat);
  };
  // 左右透视收敛线
  guideGroup.add(makeLine([[-1.8, 0.02, -1.8], [-9.2, 0.02, -26.5]], guideMat));
  guideGroup.add(makeLine([[1.8, 0.02, -1.8], [9.2, 0.02, -26.5]], guideMat));
  guideGroup.add(makeLine([[0, 0.02, -1.8], [0, 0.02, -26.5]], new THREE.LineBasicMaterial({ color: "#8AD6CB", transparent: true, opacity: 0.2 })));
  // 三层深度分界线（5.6m / 14.8m / 16.2m）
  guideGroup.add(makeLine([[-3.2, 0.03, -5.6], [3.2, 0.03, -5.6]], boundaryMat));
  guideGroup.add(makeLine([[-5.8, 0.03, -14.8], [5.8, 0.03, -14.8]], boundaryMat));
  guideGroup.add(makeLine([[-6.3, 0.03, -16.2], [6.3, 0.03, -16.2]], boundaryMat));
  scene.add(guideGroup);

  // 6. 三个角色剪影实体（与 model.js 同步）
  const snap0 = store.eval();
  const actorMeshes = {};
  const animState = {
    camZ: -cameraShiftZ(store.state.focal),
    fov: (2 * Math.atan((SENSOR_H / 2) / store.state.focal) * 180) / Math.PI,
    intro: 0,
    pos: {},
  };
  for (const a of snap0.projected) {
    actorMeshes[a.id] = makeSilhouetteMesh(a);
    scene.add(actorMeshes[a.id].group);
    animState.pos[a.id] = { x: a.wx, z: a.z };
  }

  // 尺寸同步
  let w = 640, h = 400;
  const resize = () => {
    const r = host.getBoundingClientRect();
    w = Math.max(240, Math.round(r.width));
    h = Math.max(150, Math.round(r.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // 画布内直接拖拽人物（左右调整横向视线走廊，上下微调深度）
  let draggingId = null;
  let dragStart = null;
  const pickActor = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    const u = (clientX - r.left) / r.width;
    const v = (clientY - r.top) / r.height;
    const snap = store.eval();
    // 从近到远命中检测（留慷慨热区）
    for (const a of snap.byDepth) {
      const padU = Math.max(0.055, a.wFrac * 0.72);
      const padTop = a.vHead - 0.06;
      const padBot = a.vFoot + 0.04;
      if (u >= a.u - padU && u <= a.u + padU && v >= padTop && v <= padBot) {
        return a;
      }
    }
    return null;
  };

  canvas.addEventListener("pointerdown", (e) => {
    const hit = pickActor(e.clientX, e.clientY);
    if (!hit) return;
    draggingId = hit.id;
    store.selectActor(hit.id);
    dragStart = {
      x: e.clientX,
      y: e.clientY,
      z: hit.z,
      lane: hit.lane,
    };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!draggingId || !dragStart) {
      const hover = pickActor(e.clientX, e.clientY);
      canvas.style.cursor = hover ? "grab" : "default";
      return;
    }
    const r = canvas.getBoundingClientRect();
    const dx = (e.clientX - dragStart.x) / Math.max(200, r.width);
    const dy = (e.clientY - dragStart.y) / Math.max(140, r.height);
    const nextLane = clamp(dragStart.lane + dx * 2.1, LANE_MIN, LANE_MAX);
    // 往下拖变近（前景），往上拖推远（后景）
    const nextZ = clamp(dragStart.z - dy * 20.0, Z_MIN, Z_MAX);
    store.setActorPos(draggingId, nextZ, nextLane);
  });

  const endDrag = () => {
    draggingId = null;
    dragStart = null;
    canvas.style.cursor = "default";
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // 渲染循环（集成 lib/stage.js 的自动离屏暂停与 reducedMotion 支持）
  const { draw } = loop(host, (t, dt, { still }) => {
    const snap = store.eval();
    const targetCamZ = cameraShiftZ(snap.focal); // 机位后退为正 Z（世界里向 +Z 退）
    const targetFov = (2 * Math.atan((SENSOR_H / 2) / snap.focal) * 180) / Math.PI;
    const k = still ? 1 : 1 - Math.exp(-12 * (dt || 0.016));

    // 开场前 0.8s 极轻微缓慢落稳（0s 时就已 95% 到位，保证任何时刻截图都饱满好看）
    animState.intro = still ? 1 : Math.min(1, animState.intro + (dt || 0.016) * 1.4);
    const introOffset = (1 - animState.intro) * (1 - animState.intro) * 0.45;

    animState.camZ += (targetCamZ - animState.camZ) * k;
    animState.fov += (targetFov - animState.fov) * k;

    camera.position.set(0, CAM_Y, animState.camZ + introOffset);
    if (Math.abs(camera.fov - animState.fov) > 0.01) {
      camera.fov = animState.fov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(0, CAM_Y, -24);

    // 景层引导线显隐
    guideGroup.visible = store.state.showGuides;

    // 随景层完成度轻微提亮海报建筑字
    fgWord.material.opacity = snap.layerMap.fg !== "空缺" ? 0.92 : 0.42;
    mgWord.material.opacity = snap.layerMap.mg !== "空缺" ? 0.92 : 0.46;
    bgWord.material.opacity = snap.layerMap.bg !== "空缺" ? 0.94 : 0.48;

    // 柔和波动水面月光
    rippleMat.opacity = still ? 0.34 : 0.28 + 0.09 * Math.sin(t * 1.6);

    // 更新三个人物剪影位置与遮挡态
    const blockedIds = new Set();
    if (snap.status === "blocked" && snap.blockerPair) {
      blockedIds.add(snap.blockerPair.front.id);
      blockedIds.add(snap.blockerPair.back.id);
    }

    for (const a of snap.projected) {
      const cur = animState.pos[a.id];
      cur.z += (a.z - cur.z) * k;
      const wx = laneToWorldX(a.lane, cur.z);
      cur.x += (wx - cur.x) * k;

      const m = actorMeshes[a.id];
      m.group.position.set(cur.x, 0, -cur.z);

      // 根据纵深大气透视略微调节剪影色阶（越近越墨黑锐利，越远微微融进暮紫雾）
      const depthT = clamp((cur.z - Z_MIN) / (Z_MAX - Z_MIN), 0, 1);
      m.bodyMat.color.setRGB(
        0.02 + depthT * 0.14,
        0.03 + depthT * 0.09,
        0.09 + depthT * 0.22
      );

      const isSel = store.state.selected === a.id;
      const isBlocked = blockedIds.has(a.id);
      m.rimMat.opacity = isBlocked ? 0.95 : isSel ? 0.88 : 0.42;
      m.rimMat.color.set(isBlocked ? "#F08A6C" : a.color);
      m.ringMat.opacity = isSel ? 0.92 : 0.36;
      m.ringMat.color.set(isBlocked ? "#F08A6C" : a.color);
      m.warnMat.opacity = isBlocked ? 0.9 : 0;
      const tagScale = clamp(cur.z * 0.055, 0.28, 1.35);
      m.tag.scale.set(tagScale * 1.15, tagScale * 0.58, 1);
      m.tag.position.y = PERSON_H + 0.18 + cur.z * 0.02;
    }

    renderer.render(scene, camera);
  });

  store.subscribe(() => draw());
  draw();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => draw());
  }

  return {
    draw,
    destroy() {
      ro.disconnect();
      renderer.dispose();
    },
  };
}

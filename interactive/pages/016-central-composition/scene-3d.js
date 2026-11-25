// 016 居中构图 · Three.js 轻量三维舞台
// 设计原则：零重型后处理（无 bloom、无阴影贴图），使用烘焙柔和接触影 + 极简建筑画廊盒，
// 既拥有真实的正面透视坍缩与空间体量感，又能在慢手机与 SwiftShader 软件渲染下稳跑高帧率。

import * as THREE from "three";
import { pixelRatio } from "../../lib/stage.js";
import { CLUTTER_ITEMS, PALETTE } from "./palette_bridge.js";

function makeShadowTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  g.addColorStop(0, "rgba(13, 13, 13, 0.24)");
  g.addColorStop(0.5, "rgba(13, 13, 13, 0.09)");
  g.addColorStop(1, "rgba(13, 13, 13, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeRoomBackdropTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 124, 18, 128, 128, 165);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.68, "#fcfaf7");
  g.addColorStop(1, "#eeebe5");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildSphereSubject(vermilionMat, inkMat) {
  const group = new THREE.Group();
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.02, 36, 28), vermilionMat);
  group.add(sphere);

  // 极细赤道刻度环，在偏移时 subtly 显出三维朝向，居中时与背景平面融为一体
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.016, 8, 48), inkMat);
  ring.rotation.x = Math.PI * 0.5;
  ring.material = new THREE.MeshBasicMaterial({ color: PALETTE.inkHex, transparent: true, opacity: 0.22 });
  group.add(ring);

  return { group, accent: ring };
}

function buildArchSubject(vermilionMat, inkMat) {
  const group = new THREE.Group();
  const colGeo = new THREE.BoxGeometry(0.32, 1.56, 0.44);
  const leftCol = new THREE.Mesh(colGeo, inkMat);
  leftCol.position.set(-0.62, -0.14, 0);
  const rightCol = new THREE.Mesh(colGeo, inkMat);
  rightCol.position.set(0.62, -0.14, 0);

  // 半圆拱顶
  const archShape = new THREE.Shape();
  archShape.absarc(0, 0, 0.78, 0, Math.PI, false);
  archShape.lineTo(-0.46, 0);
  archShape.absarc(0, 0, 0.46, Math.PI, 0, true);
  archShape.closePath();
  const archGeo = new THREE.ExtrudeGeometry(archShape, {
    depth: 0.44,
    bevelEnabled: false,
    curveSegments: 24,
  });
  archGeo.translate(0, 0, -0.22);
  const archTop = new THREE.Mesh(archGeo, inkMat);
  archTop.position.set(0, 0.62, 0);

  // 拱门底基
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.14, 0.6), inkMat);
  base.position.set(0, -0.96, 0);

  // 拱门正中悬停的朱红圆核（呼应 016 海报焦点）
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), vermilionMat);
  core.position.set(0, 0.12, 0.04);

  group.add(leftCol, rightCol, archTop, base, core);
  return { group, accent: core };
}

function buildBoatSubject(vermilionMat, inkMat) {
  // 极简现代几何折纸舟，明确朝右（+X）
  const group = new THREE.Group();

  // 船身梯形体
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-1.05, 0.02);
  hullShape.lineTo(1.22, 0.02);
  hullShape.lineTo(0.82, -0.44);
  hullShape.lineTo(-0.78, -0.44);
  hullShape.closePath();
  const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 0.34, bevelEnabled: false });
  hullGeo.translate(0, 0, -0.17);
  const hull = new THREE.Mesh(hullGeo, inkMat);
  hull.position.set(0, -0.22, 0);

  // 主帆（朝右前倾的朱红三角）
  const sailShape = new THREE.Shape();
  sailShape.moveTo(-0.18, -0.14);
  sailShape.lineTo(0.95, -0.14);
  sailShape.lineTo(-0.08, 1.05);
  sailShape.closePath();
  const sailGeo = new THREE.ExtrudeGeometry(sailShape, { depth: 0.12, bevelEnabled: false });
  sailGeo.translate(0, 0, -0.06);
  const sail = new THREE.Mesh(sailGeo, vermilionMat);

  // 副帆（左侧黑色小三角）
  const jibShape = new THREE.Shape();
  jibShape.moveTo(-0.88, -0.14);
  jibShape.lineTo(-0.28, -0.14);
  jibShape.lineTo(-0.28, 0.72);
  jibShape.closePath();
  const jibGeo = new THREE.ExtrudeGeometry(jibShape, { depth: 0.1, bevelEnabled: false });
  jibGeo.translate(0, 0, -0.05);
  const jib = new THREE.Mesh(jibGeo, inkMat);

  group.add(hull, sail, jib);
  return { group, accent: sail };
}

export function createScene3D(host) {
  const mobile = matchMedia("(max-width: 760px)").matches;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(pixelRatio(mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.paperHex);

  const camera = new THREE.PerspectiveCamera(34, 4 / 3, 0.5, 40);
  camera.position.set(0, 0, 10.2);
  camera.lookAt(0, 0, 0);

  // 柔和画廊照明：正顶柔光 + 正面补光，保持海报级清亮色彩不发灰
  const hemi = new THREE.HemisphereLight(0xffffff, 0xe8e2da, 1.25);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfffaf6, 1.15);
  key.position.set(2.4, 3.6, 7.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe1d4, 0.45);
  rim.position.set(-4.0, -2.0, 3.0);
  scene.add(rim);

  // 背景浅纸板平面（微弱径向亮心，突出中心画廊感）
  const backdropMat = new THREE.MeshBasicMaterial({ map: makeRoomBackdropTexture() });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), backdropMat);
  backdrop.position.set(0, 0, -2.4);
  scene.add(backdrop);

  // 极浅的建筑凹框透视棱线（移动主体时 camera 微倾，能真切感觉到三维空间的中轴与正面性）
  const boxEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(7.2, 5.2, 2.2));
  const boxLines = new THREE.LineSegments(
    boxEdges,
    new THREE.LineBasicMaterial({ color: PALETTE.hairlineHex, transparent: true, opacity: 0.8 })
  );
  boxLines.position.set(0, 0, -1.3);
  scene.add(boxLines);

  // 共用材质
  const vermilionMat = new THREE.MeshStandardMaterial({
    color: PALETTE.vermilionHex,
    roughness: 0.42,
    metalness: 0.02,
    emissive: 0x3b0b00,
    emissiveIntensity: 0.32,
  });
  const inkMat = new THREE.MeshStandardMaterial({
    color: PALETTE.inkHex,
    roughness: 0.55,
    metalness: 0.05,
  });
  const clutterMat = new THREE.MeshStandardMaterial({
    color: 0x1b1a1f,
    roughness: 0.6,
    metalness: 0.04,
  });
  const clutterAccentMat = new THREE.MeshStandardMaterial({
    color: 0xd94b24,
    roughness: 0.5,
    metalness: 0.02,
  });

  // 三个可切换主体
  const subjects = {
    sphere: buildSphereSubject(vermilionMat, inkMat),
    arch: buildArchSubject(vermilionMat, inkMat),
    boat: buildBoatSubject(vermilionMat, inkMat),
  };
  const stageRoot = new THREE.Group();
  for (const s of Object.values(subjects)) {
    s.group.visible = false;
    stageRoot.add(s.group);
  }
  subjects.sphere.group.visible = true;
  scene.add(stageRoot);

  // 柔和接触投影（贴在背景板上，跟随主体移动）
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 2.7),
    new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false })
  );
  shadow.position.set(0, 0, -1.9);
  scene.add(shadow);

  // 边缘干扰物组
  const clutterGroup = new THREE.Group();
  const clutterMeshes = CLUTTER_ITEMS.map((item) => {
    let mesh;
    if (item.kind === "block") {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.28), clutterMat);
    } else if (item.kind === "circle") {
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 24), clutterAccentMat);
      mesh.rotation.x = Math.PI * 0.5;
    } else {
      mesh = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.075, 10, 28), clutterMat);
    }
    mesh.userData = item;
    clutterGroup.add(mesh);
    return mesh;
  });
  clutterGroup.visible = false;
  scene.add(clutterGroup);

  let width = 600;
  let height = 450;
  let visibleW = 7.6;
  let visibleH = 5.7;

  function updateFrustum() {
    const aspect = width / Math.max(1, height);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    const vFov = (camera.fov * Math.PI) / 180;
    visibleH = 2 * Math.tan(vFov / 2) * camera.position.z;
    visibleW = visibleH * aspect;
    // 背景板铺满视口
    backdrop.scale.set((visibleW * 1.45) / 16, (visibleH * 1.45) / 12, 1);
    boxLines.scale.set((visibleW * 0.86) / 7.2, (visibleH * 0.86) / 5.2, 1);
  }

  function uvToWorld(u, v) {
    return {
      x: (u - 0.5) * visibleW,
      y: (0.5 - v) * visibleH,
    };
  }

  function resize(w, h) {
    width = Math.max(1, w);
    height = Math.max(1, h);
    renderer.setSize(width, height, false);
    updateFrustum();
  }

  function render(frame, t) {
    const { u, v, subject, clutter, still } = frame;
    const p = uvToWorld(u, v);

    // 居中时相机归零正视；偏离中心时产生极其克制的透视偏转，增强「歪了 / 正了」的体感
    const du = u - 0.5;
    const dv = v - 0.5;
    camera.position.x = du * 0.65;
    camera.position.y = -dv * 0.42;
    camera.lookAt(du * 0.14, -dv * 0.1, 0);

    // 切换可见主体
    for (const [k, obj] of Object.entries(subjects)) {
      obj.group.visible = k === subject;
    }

    // 按当前画框短边自动缩放主体，保证不同纵横比下都饱满得体
    const unitScale = Math.min(visibleW, visibleH) * 0.21;
    stageRoot.position.set(p.x, p.y, 0);
    stageRoot.scale.setScalar(unitScale);

    // 极轻的呼吸/姿态：偏离中心时带一点倾角，落回中心时彻底回正
    const idle = still ? 0 : Math.sin(t * 1.35);
    if (subject === "sphere") {
      subjects.sphere.group.rotation.y = du * 0.65 + (still ? 0 : t * 0.18);
      subjects.sphere.group.rotation.x = dv * 0.45 + idle * 0.04;
      subjects.sphere.accent.rotation.x = Math.PI * 0.5 + dv * 0.5;
    } else if (subject === "arch") {
      subjects.arch.group.rotation.y = du * 0.55;
      subjects.arch.group.rotation.x = dv * 0.25;
      subjects.arch.accent.position.y = 0.12 + idle * 0.04;
    } else if (subject === "boat") {
      subjects.boat.group.rotation.y = du * 0.35 - 0.08;
      subjects.boat.group.rotation.z = idle * 0.025 - du * 0.08;
    }

    // 接触影随主体落在背景板上（偏离越多投影越斜）
    shadow.position.set(p.x + du * 0.55 + 0.12, p.y - dv * 0.45 - 0.18, -1.9);
    shadow.scale.setScalar(unitScale * 1.08);

    // 干扰物
    clutterGroup.visible = !!clutter;
    if (clutter) {
      for (const m of clutterMeshes) {
        const it = m.userData;
        const cp = uvToWorld(it.u, it.v);
        m.position.set(cp.x, cp.y, -0.35);
        m.scale.setScalar(unitScale * 0.92);
        if (!still) m.rotation.z = Math.sin(t * 0.9 + it.u * 6) * 0.08;
      }
    }

    renderer.render(scene, camera);
  }

  updateFrustum();
  return { resize, render };
}

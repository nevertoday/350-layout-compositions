// 016 居中构图 · Three.js 轻量三维画廊展墙舞台
// 展品固定于展墙中心「+」，以 1 世界单位 = 10 mm 严格对齐 model.js 中每件展品的真实外接框；
// 收敛高光、保留极轻哑光版画立体层次，使朱红圆体贴近海报 016 的平涂圆盘气质；零重型后处理，保证慢手机流畅。

import * as THREE from "three";
import { pixelRatio } from "../../lib/stage.js";
import { CLUTTER_ITEMS, PALETTE } from "./palette_bridge.js";

const CAM_Z = 26;

function makeShadowTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 14, 64, 64, 62);
  g.addColorStop(0, "rgba(13, 13, 13, 0.11)");
  g.addColorStop(0.58, "rgba(13, 13, 13, 0.035)");
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
  const g = ctx.createRadialGradient(128, 124, 24, 128, 128, 182);
  g.addColorStop(0, "#fefcfb");
  g.addColorStop(0.75, "#fcfaf7");
  g.addColorStop(1, "#f2eee8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 1 世界单位 = 10 mm
// sphere bounds: { left: 33, right: 33, top: 33, bottom: 33 } mm -> 投影轮廓半径严格等于 3.30 世界单位
// 压扁 z 轴成微浮雕哑光圆盘并大幅收敛高光，既有纸上浮雕微感，又忠实呈现海报的平涂朱红圆盘气质
function buildSphereSubject(vermilionDiscMat) {
  const group = new THREE.Group();
  const apparentR = 3.3;
  // 微浮雕厚度（z 缩放 0.16），扣除微小透视切线放大让屏幕投影严格吻合 33 mm 外接框
  const geomR = apparentR * Math.sqrt(1 - ((apparentR * 0.16) / CAM_Z) ** 2);
  const disc = new THREE.Mesh(new THREE.SphereGeometry(geomR, 48, 28), vermilionDiscMat);
  disc.scale.set(1, 1, 0.16);
  group.add(disc);
  return { group };
}

// arch bounds: { left: 26, right: 26, top: 36, bottom: 36 } mm -> x ∈ [-2.6, 2.6], y ∈ [-3.6, 3.6]
function buildArchSubject(vermilionMat, inkMat) {
  const group = new THREE.Group();
  const depth = 0.44;
  const k = (CAM_Z - depth * 0.5) / CAM_Z;

  const base = new THREE.Mesh(new THREE.BoxGeometry(5.2 * k, 0.48 * k, depth * 1.1), inkMat);
  base.position.set(0, -3.36 * k, 0);

  const colGeo = new THREE.BoxGeometry(0.86 * k, 4.42 * k, depth);
  const leftCol = new THREE.Mesh(colGeo, inkMat);
  leftCol.position.set(-1.87 * k, -0.91 * k, 0);
  const rightCol = new THREE.Mesh(colGeo, inkMat);
  rightCol.position.set(1.87 * k, -0.91 * k, 0);

  const archShape = new THREE.Shape();
  archShape.absarc(0, 0, 2.3 * k, 0, Math.PI, false);
  archShape.lineTo(-1.44 * k, 0);
  archShape.absarc(0, 0, 1.44 * k, Math.PI, 0, true);
  archShape.closePath();
  const archGeo = new THREE.ExtrudeGeometry(archShape, {
    depth,
    bevelEnabled: false,
    curveSegments: 28,
  });
  archGeo.translate(0, 0, -depth * 0.5);
  const archTop = new THREE.Mesh(archGeo, inkMat);
  archTop.position.set(0, 1.3 * k, 0);

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.92 * k, 28, 20), vermilionMat);
  core.scale.set(1, 1, 0.28);
  core.position.set(0, 0.22 * k, 0.04);

  group.add(base, leftCol, rightCol, archTop, core);
  return { group, accent: core };
}

// boat bounds: { left: 32, right: 39, top: 33, bottom: 23 } mm -> x ∈ [-3.2, 3.9], y ∈ [-2.3, 3.3]
function buildBoatSubject(vermilionMat, inkMat) {
  const group = new THREE.Group();
  const depth = 0.36;
  const k = (CAM_Z - depth * 0.5) / CAM_Z;

  const hullShape = new THREE.Shape();
  hullShape.moveTo(-3.2 * k, -0.75 * k);
  hullShape.lineTo(3.9 * k, -0.75 * k);
  hullShape.lineTo(2.6 * k, -2.3 * k);
  hullShape.lineTo(-2.3 * k, -2.3 * k);
  hullShape.closePath();
  const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth, bevelEnabled: false });
  hullGeo.translate(0, 0, -depth * 0.5);
  const hull = new THREE.Mesh(hullGeo, inkMat);

  const sailShape = new THREE.Shape();
  sailShape.moveTo(-0.45 * k, -0.45 * k);
  sailShape.lineTo(3.05 * k, -0.45 * k);
  sailShape.lineTo(-0.2 * k, 3.3 * k);
  sailShape.closePath();
  const sailGeo = new THREE.ExtrudeGeometry(sailShape, { depth: 0.18, bevelEnabled: false });
  sailGeo.translate(0, 0, -0.09);
  const sail = new THREE.Mesh(sailGeo, vermilionMat);

  const jibShape = new THREE.Shape();
  jibShape.moveTo(-2.65 * k, -0.45 * k);
  jibShape.lineTo(-0.82 * k, -0.45 * k);
  jibShape.lineTo(-0.82 * k, 2.25 * k);
  jibShape.closePath();
  const jibGeo = new THREE.ExtrudeGeometry(jibShape, { depth: 0.14, bevelEnabled: false });
  jibGeo.translate(0, 0, -0.07);
  const jib = new THREE.Mesh(jibGeo, inkMat);

  group.add(hull, sail, jib);
  return { group };
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

  const camera = new THREE.PerspectiveCamera(22, 1, 1, 80);
  camera.position.set(0, 0, CAM_Z);
  camera.lookAt(0, 0, 0);

  // 柔和均匀的画廊漫射光，消除塑料球高光，保持极克制的纸面哑光立体感
  const hemi = new THREE.HemisphereLight(0xffffff, 0xf2ebe2, 1.05);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfffcf9, 0.34);
  key.position.set(-2.4, 3.6, 18);
  scene.add(key);

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(54, 30),
    new THREE.MeshBasicMaterial({ map: makeRoomBackdropTexture() })
  );
  backdrop.position.set(0, 0, -4.5);
  scene.add(backdrop);

  // 展墙背景极细建筑格线（低存在感，让海报黑色虚线中轴当主角）
  const wallGeo = new THREE.BufferGeometry();
  const wallVerts = [];
  for (let i = -8; i <= 8; i++) {
    wallVerts.push(i * 2.4, -12, -4.0, i * 2.4, 12, -4.0);
  }
  for (let j = -6; j <= 6; j++) {
    wallVerts.push(-19, j * 2.4, -4.0, 19, j * 2.4, -4.0);
  }
  wallGeo.setAttribute("position", new THREE.Float32BufferAttribute(wallVerts, 3));
  const wallGrid = new THREE.LineSegments(
    wallGeo,
    new THREE.LineBasicMaterial({ color: PALETTE.hairlineHex, transparent: true, opacity: 0.42 })
  );
  scene.add(wallGrid);

  // 哑光版画平涂朱红：高 roughness + 温和自发光，几乎零高光、颜色忠实贴近海报 #fe4e1c
  const vermilionDiscMat = new THREE.MeshStandardMaterial({
    color: PALETTE.vermilionHex,
    roughness: 0.96,
    metalness: 0.0,
    emissive: PALETTE.vermilionHex,
    emissiveIntensity: 0.66,
  });
  const vermilionMat = new THREE.MeshStandardMaterial({
    color: PALETTE.vermilionHex,
    roughness: 0.9,
    metalness: 0.0,
    emissive: PALETTE.vermilionHex,
    emissiveIntensity: 0.56,
  });
  const inkMat = new THREE.MeshStandardMaterial({
    color: PALETTE.inkHex,
    roughness: 0.84,
    metalness: 0.02,
  });
  const clutterMat = new THREE.MeshStandardMaterial({
    color: 0x1b1a1f,
    roughness: 0.84,
    metalness: 0.02,
  });
  const clutterAccentMat = new THREE.MeshStandardMaterial({
    color: 0xc43308,
    roughness: 0.88,
    metalness: 0.0,
    emissive: 0xc43308,
    emissiveIntensity: 0.35,
  });

  const subjects = {
    sphere: buildSphereSubject(vermilionDiscMat),
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

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(8.2, 8.2),
    new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false })
  );
  shadow.position.set(0.24, -0.32, -3.4);
  scene.add(shadow);

  // 三件可逐件点掉清场的边缘干扰物
  const clutterGroup = new THREE.Group();
  const clutterMeshes = CLUTTER_ITEMS.map((item) => {
    let mesh;
    if (item.kind === "block") {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 0.32), clutterMat);
    } else if (item.kind === "circle") {
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 0.24, 28), clutterAccentMat);
      mesh.rotation.x = Math.PI * 0.5;
    } else {
      mesh = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.2, 12, 28), clutterMat);
    }
    mesh.visible = false;
    clutterGroup.add(mesh);
    return mesh;
  });
  scene.add(clutterGroup);

  let width = 500;
  let height = 480;
  let visibleW = 12;
  let visibleH = 12;

  function updateFrustum() {
    const aspect = width / Math.max(1, height);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    const vFov = (camera.fov * Math.PI) / 180;
    visibleH = 2 * Math.tan(vFov / 2) * CAM_Z;
    visibleW = visibleH * aspect;
    backdrop.scale.set((visibleW * 1.4) / 54, (visibleH * 1.4) / 30, 1);
  }

  function pxToWorld(px, py) {
    return {
      x: (px / Math.max(1, width) - 0.5) * visibleW,
      y: (0.5 - py / Math.max(1, height)) * visibleH,
    };
  }

  function resize(w, h) {
    width = Math.max(1, w);
    height = Math.max(1, h);
    renderer.setSize(width, height, false);
    updateFrustum();
  }

  function render(frame, t) {
    const { subject, clutterMask, still, geom } = frame;

    // 随卡纸中点微幅呼吸移光，保持近乎平涂质感
    const matOffsetX = (geom.mx - geom.cx) / Math.max(1, geom.W);
    const matOffsetY = (geom.my - geom.cy) / Math.max(1, geom.H);
    key.position.set(-2.4 + matOffsetX * 3.2, 3.6 - matOffsetY * 2.8, 18);

    for (const [k, obj] of Object.entries(subjects)) {
      obj.group.visible = k === subject;
    }

    // 1 世界单位 = 10 mm，严格按当前像素比例尺换算
    const pxPerWorld = height / Math.max(0.01, visibleH);
    const unitScale = (10 * geom.pxPerMm) / Math.max(1, pxPerWorld);
    stageRoot.position.set(0, 0, 0);
    stageRoot.scale.setScalar(unitScale);

    const idle = still ? 0 : Math.sin(t * 1.35);
    if (subject === "arch" && subjects.arch.accent) {
      subjects.arch.accent.position.y = 0.22 + idle * 0.04;
    }

    shadow.position.set(0.24 * unitScale, -0.32 * unitScale, -3.4);
    shadow.scale.setScalar(unitScale);

    // 渲染仍在画框内的角落干扰物
    const mask = Array.isArray(clutterMask) ? clutterMask : [false, false, false];
    for (let i = 0; i < clutterMeshes.length; i++) {
      const mesh = clutterMeshes[i];
      const on = Boolean(mask[i]);
      mesh.visible = on;
      if (on) {
        const it = geom.clutter[i];
        const cp = pxToWorld(it.x, it.y);
        mesh.position.set(cp.x, cp.y, -0.3);
        const cScale = (it.r / 0.9) / Math.max(1, pxPerWorld);
        mesh.scale.setScalar(cScale);
        mesh.rotation.z = still ? 0 : Math.sin(t * 0.9 + i * 2.0) * 0.06;
      }
    }

    renderer.render(scene, camera);
  }

  updateFrustum();
  return { resize, render };
}

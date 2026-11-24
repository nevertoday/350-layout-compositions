// 开场 3D 场景：「移步借景」机位取景器。
// 相机在三层实景（前景门窗/竹枝、中景花格窗、背景庭院梅花盆景）之间真实平移与进退，
// 靠视差把错开的门窗与盆景套成框中框。不使用昂贵后处理，确保慢手机与软件渲染高帧率。
import * as THREE from "three";
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { BONSAI_SIZE, onBonsai } from "./bonsai.js";
import { ASPECT, PALETTE, SCENES, clamp } from "./model.js";

const easeOut = (t) => {
  const k = clamp(t, 0, 1);
  return 1 - (1 - k) * (1 - k) * (1 - k);
};
const lerp = (a, b, t) => a + (b - a) * t;

// 构建一块带矩形或拱形洞口的立体墙体（外圈逆时针 CCW，洞口顺时针 CW，绝不越界）
function wallWithOpening({ w, h, depth, openW, openH, openY, arch = false }) {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  shape.moveTo(-hw, -hh);
  shape.lineTo(hw, -hh);
  shape.lineTo(hw, hh);
  shape.lineTo(-hw, hh);
  shape.closePath();

  const hole = new THREE.Path();
  const ohw = openW / 2;
  const y0 = Math.max(-hh + 0.08, openY - openH / 2);
  const y1 = Math.min(hh - 0.08, openY + openH / 2);
  if (arch) {
    const r = ohw;
    const straightTop = Math.max(y0 + 0.05, y1 - r);
    // 顺时针绕行洞口：左下 -> 左直边上行 -> 顺时针半圆拱顶 -> 右直边下行 -> 闭合
    hole.moveTo(-ohw, y0);
    hole.lineTo(-ohw, straightTop);
    hole.absarc(0, straightTop, r, Math.PI, 0, true);
    hole.lineTo(ohw, y0);
    hole.closePath();
  } else {
    hole.moveTo(-ohw, y0);
    hole.lineTo(-ohw, y1);
    hole.lineTo(ohw, y1);
    hole.lineTo(ohw, y0);
    hole.closePath();
  }
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 28,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

// 构建一条贴合拱门洞口的立体收边门套（纯环形条带，无多余外板与重叠）
function archTrimGeo({ openW, openH, openY, trim = 0.085, depth = 0.40 }) {
  const rIn = openW / 2;
  const rOut = rIn + trim;
  const y0 = openY - openH / 2;
  const y1 = openY + openH / 2;
  const straightTop = Math.max(y0 + 0.05, y1 - rIn);

  const s = new THREE.Shape();
  // 外弧顺时针绕到右底，再沿内弧逆时针绕回左底
  s.moveTo(-rOut, y0);
  s.lineTo(-rOut, straightTop);
  s.absarc(0, straightTop, rOut, Math.PI, 0, true);
  s.lineTo(rOut, y0);
  s.lineTo(rIn, y0);
  s.lineTo(rIn, straightTop);
  s.absarc(0, straightTop, rIn, 0, Math.PI, false);
  s.lineTo(-rIn, y0);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: false,
    curveSegments: 28,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

// 构造中式花格窗棂（放在中景窗洞内侧上部）
function buildLattice(w, h, mat) {
  const g = new THREE.Group();
  const t = 0.048;
  const d = 0.08;
  const bar = (bw, bh, x, y) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, d), mat);
    m.position.set(x, y, 0);
    g.add(m);
  };
  // 四周边框
  bar(w + t * 2, t * 1.4, 0, h / 2 + t * 0.4);
  bar(w + t * 2, t * 1.4, 0, -h / 2 - t * 0.4);
  bar(t * 1.4, h + t * 2, -w / 2 - t * 0.4, 0);
  bar(t * 1.4, h + t * 2, w / 2 + t * 0.4, 0);

  // 顶部镂空花格（占窗高上部的 24%）
  const topY = h / 2;
  const lh = h * 0.24;
  const botY = topY - lh;
  const midY = topY - lh * 0.5;
  bar(w, t * 0.72, 0, botY);
  bar(t * 0.65, lh, -w * 0.34, topY - lh / 2);
  bar(t * 0.65, lh, w * 0.34, topY - lh / 2);
  bar(t * 0.65, lh * 0.62, -w * 0.16, topY - lh * 0.31);
  bar(t * 0.65, lh * 0.62, w * 0.16, topY - lh * 0.31);
  bar(w * 0.32, t * 0.62, 0, topY - lh * 0.62);
  bar(w * 0.18, t * 0.6, -w * 0.41, midY);
  bar(w * 0.18, t * 0.6, w * 0.41, midY);
  bar(t * 0.6, lh * 0.5, -w * 0.24, botY + lh * 0.25);
  bar(t * 0.6, lh * 0.5, w * 0.24, botY + lh * 0.25);
  return g;
}

// 构造左侧立体假山石与垂落竹枝（用于园林拱门与竹枝半框）
function buildBambooCluster(matStem, matLeaf, matRock, large = false) {
  const g = new THREE.Group();
  const s = large ? 1.35 : 1.0;

  // 湖石剪影
  const rockGeo = new THREE.DodecahedronGeometry(0.46 * s, 0);
  rockGeo.scale(0.85, 1.35, 0.7);
  const rock = new THREE.Mesh(rockGeo, matRock);
  rock.position.set(-1.38, -1.55, 0.22);
  rock.rotation.set(0.2, 0.4, -0.15);
  g.add(rock);

  // 竹竿与枝条
  const addStem = (x0, y0, x1, y1, z, rad) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.7, rad, len, 6), matStem);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, z);
    m.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
    g.add(m);
  };
  const leafGeo = new THREE.PlaneGeometry(0.32 * s, 0.068 * s);
  const addLeaf = (x, y, z, rz) => {
    const m = new THREE.Mesh(leafGeo, matLeaf);
    m.position.set(x, y, z);
    m.rotation.z = rz;
    g.add(m);
  };

  if (large) {
    // 大型垂竹半框：从左上方自然垂入画面，右侧不封死
    addStem(-1.95, 1.85, -0.35, 1.05, 0.16, 0.036);
    addStem(-1.85, 1.42, -0.62, 0.45, 0.12, 0.03);
    addStem(-1.55, 1.68, 0.25, 1.35, 0.08, 0.024);
    addStem(-1.68, -1.1, -1.22, 0.72, 0.06, 0.028);
    const leaves = [
      [-0.82, 1.32, 0.18, -0.35],
      [-0.45, 1.16, 0.2, -0.52],
      [-0.12, 1.38, 0.14, -0.18],
      [0.24, 1.34, 0.12, -0.28],
      [-1.02, 0.88, 0.18, -0.62],
      [-0.72, 0.56, 0.15, -0.78],
      [-1.18, 0.32, 0.14, -0.45],
      [-1.34, -0.12, 0.12, -0.32],
      [-0.95, 1.56, 0.12, -0.15],
      [-0.55, 1.48, 0.14, -0.22],
    ];
    for (const [lx, ly, lz, rz] of leaves) addLeaf(lx, ly, lz, rz);
  } else {
    // 园林拱门左侧的清雅竹影
    addStem(-1.42, -1.25, -1.06, 1.48, 0.2, 0.024);
    addStem(-1.32, -0.85, -0.88, 0.85, 0.16, 0.018);
    const leaves = [
      [-1.18, 1.25, 0.22, -0.38],
      [-0.96, 1.05, 0.22, -0.52],
      [-1.14, 0.72, 0.2, -0.35],
      [-0.92, 0.52, 0.18, -0.6],
      [-1.16, 0.18, 0.18, -0.42],
      [-1.02, -0.16, 0.16, -0.55],
    ];
    for (const [lx, ly, lz, rz] of leaves) addLeaf(lx, ly, lz, rz);
  }
  return g;
}

export function createHero3D(stage, { onFrame, onUserDrag } = {}) {
  let state = { scene: "garden", cam: { x: 0, y: 0.02 }, dist: 0.45, softFocus: false, darkRim: false };
  let introT = reducedMotion.matches ? 99 : 0;
  let dirty = true;
  let dragging = null;
  const hover = { x: 0, y: 0 };
  const smoothHover = { x: 0, y: 0 };

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  const isTouch = matchMedia("(pointer: coarse)").matches;
  renderer.setPixelRatio(pixelRatio(isTouch ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f5e7df");
  const camera = new THREE.PerspectiveCamera(42, ASPECT, 0.1, 30);

  // 柔和建筑采光：庭院温暖日光 + 室内暖灰环境光
  const hemi = new THREE.HemisphereLight("#fff7f1", "#7a534f", 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff1e3", 1.35);
  sun.position.set(2.8, 3.6, 2.2);
  scene.add(sun);
  const bounce = new THREE.DirectionalLight("#e6b6ae", 0.45);
  bounce.position.set(-2.5, -0.8, 1.8);
  scene.add(bounce);

  // ---------- 1. 背景庭院（z = -3.3） ----------
  const courtyardGroup = new THREE.Group();
  courtyardGroup.position.set(0, 0, -3.3);
  scene.add(courtyardGroup);

  const skyWall = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 10),
    new THREE.MeshBasicMaterial({ color: "#f6e8df" }),
  );
  skyWall.position.set(0, 0.4, -0.15);
  courtyardGroup.add(skyWall);

  // 原海报真实盆景纹理平面
  const bonsaiTex = new THREE.Texture();
  bonsaiTex.colorSpace = THREE.SRGBColorSpace;
  const bonsaiMat = new THREE.MeshBasicMaterial({ map: bonsaiTex });
  const bH = 2.75;
  const bW = bH * (BONSAI_SIZE.w / BONSAI_SIZE.h);
  const bonsaiPlane = new THREE.Mesh(new THREE.PlaneGeometry(bW, bH), bonsaiMat);
  bonsaiPlane.position.set(0, 0.10, 0);
  bonsaiPlane.visible = false;
  courtyardGroup.add(bonsaiPlane);

  // 保底占位盆景（图片未解码前先显示，绝不空屏）
  const fallbackGroup = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.2, 0.18, 12),
    new THREE.MeshLambertMaterial({ color: "#3d2320" }),
  );
  pot.position.set(0, -0.88, 0.02);
  fallbackGroup.add(pot);
  const bloomMat = new THREE.MeshLambertMaterial({ color: "#d7748a" });
  for (const [bx, by, br] of [
    [-0.36, -0.15, 0.26],
    [0.02, -0.05, 0.3],
    [0.36, -0.22, 0.24],
    [-0.12, -0.32, 0.22],
  ]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(br, 10, 8), bloomMat);
    b.position.set(bx, by, 0.04);
    fallbackGroup.add(b);
  }
  courtyardGroup.add(fallbackGroup);

  onBonsai((c) => {
    bonsaiTex.image = c;
    bonsaiTex.needsUpdate = true;
    bonsaiPlane.visible = true;
    fallbackGroup.visible = false;
    dirty = true;
  });

  // 走廊地面与阳光光斑
  const floorMat = new THREE.MeshLambertMaterial({ color: "#c9a59d" });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 5.4), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -1.92, -1.3);
  scene.add(floor);

  const sunPatch = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 1.3),
    new THREE.MeshBasicMaterial({ color: "#fbeee6", transparent: true, opacity: 0.42 }),
  );
  sunPatch.rotation.x = -Math.PI / 2;
  sunPatch.position.set(0.24, -1.908, -0.85);
  scene.add(sunPatch);

  // ---------- 2. 中景层：花格方窗（z = -1.58） ----------
  const midWallMat = new THREE.MeshLambertMaterial({ color: "#b67e78" });
  const woodMat = new THREE.MeshLambertMaterial({ color: "#3a211d" });

  const midSolidGroup = new THREE.Group();
  midSolidGroup.position.set(0, 0, -1.58);
  const midWallMesh = new THREE.Mesh(
    wallWithOpening({ w: 8.6, h: 7.4, depth: 0.22, openW: 1.66, openH: 2.02, openY: 0.08, arch: false }),
    midWallMat,
  );
  midSolidGroup.add(midWallMesh);
  const lattice = buildLattice(1.66, 2.02, woodMat);
  lattice.position.set(0, 0.08, 0.125);
  midSolidGroup.add(lattice);
  scene.add(midSolidGroup);

  // 竹枝半框用的敞开式廊檐中景（不封死墙体）
  const midOpenGroup = new THREE.Group();
  midOpenGroup.position.set(0, 0, -1.58);
  const openLattice = buildLattice(1.92, 2.18, woodMat);
  openLattice.position.set(0, 0.06, 0);
  midOpenGroup.add(openLattice);
  const eave = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.34, 0.3), new THREE.MeshLambertMaterial({ color: "#683e3b" }));
  eave.position.set(0, 1.35, 0.04);
  midOpenGroup.add(eave);
  midOpenGroup.visible = false;
  scene.add(midOpenGroup);

  // ---------- 3. 前景层（z = 0.0）三种现成的框 ----------
  const fgRoot = new THREE.Group();
  scene.add(fgRoot);

  // 3A. 园林拱门
  const archWallMat = new THREE.MeshLambertMaterial({ color: "#c9928c" });
  const archRimMat = new THREE.MeshLambertMaterial({ color: "#e5cbc4" });
  const bambooStemMat = new THREE.MeshLambertMaterial({ color: "#351e1b" });
  const bambooLeafMat = new THREE.MeshLambertMaterial({ color: "#3a221f", side: THREE.DoubleSide });
  const rockMat = new THREE.MeshLambertMaterial({ color: "#4e3533" });

  const fgGarden = new THREE.Group();
  const archWall = new THREE.Mesh(
    wallWithOpening({ w: 9.2, h: 8.6, depth: 0.36, openW: 2.38, openH: 3.16, openY: -0.34, arch: true }),
    archWallMat,
  );
  fgGarden.add(archWall);
  // 拱门内缘亮色石膏收边（纯拱形门套，绝不遮挡洞口）
  const archRim = new THREE.Mesh(
    archTrimGeo({ openW: 2.36, openH: 3.16, openY: -0.34, trim: 0.085, depth: 0.39 }),
    archRimMat,
  );
  fgGarden.add(archRim);
  fgGarden.add(buildBambooCluster(bambooStemMat, bambooLeafMat, rockMat, false));
  fgRoot.add(fgGarden);

  // 3B. 暗门廊
  const doorWallMat = new THREE.MeshLambertMaterial({ color: "#221312" });
  const doorPanelMat = new THREE.MeshLambertMaterial({ color: "#3c211e" });
  const doorEdgeMat = new THREE.MeshLambertMaterial({ color: "#6e463f" });
  const fgDoorway = new THREE.Group();
  const doorWall = new THREE.Mesh(
    wallWithOpening({ w: 8.8, h: 7.8, depth: 0.42, openW: 1.96, openH: 3.18, openY: -0.32, arch: false }),
    doorWallMat,
  );
  fgDoorway.add(doorWall);
  // 半掩木门扇，从右侧微微斜探入视野，制造「推门窥院」的纵深
  const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.62, 3.14, 0.07), doorPanelMat);
  doorLeaf.position.set(0.84, -0.32, -0.22);
  doorLeaf.rotation.y = -0.62;
  fgDoorway.add(doorLeaf);
  // 门框边缘高光线
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.08, 0.44), doorEdgeMat);
  lintel.position.set(0, 1.27, 0);
  fgDoorway.add(lintel);
  fgDoorway.visible = false;
  fgRoot.add(fgDoorway);

  // 3C. 竹枝半框
  const pillarMat = new THREE.MeshLambertMaterial({ color: "#764844" });
  const fgBranch = new THREE.Group();
  fgBranch.add(buildBambooCluster(bambooStemMat, bambooLeafMat, rockMat, true));
  // 右侧廊柱（只占右边缘，留下底边和右下透空）
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 6.2, 16), pillarMat);
  pillar.position.set(1.48, 0.0, 0.08);
  fgBranch.add(pillar);
  fgBranch.visible = false;
  fgRoot.add(fgBranch);

  // 状态与外观应用
  function applySceneAppearance() {
    fgGarden.visible = state.scene === "garden";
    fgDoorway.visible = state.scene === "doorway";
    fgBranch.visible = state.scene === "branch";

    const partial = SCENES[state.scene]?.partial;
    midSolidGroup.visible = !partial;
    midOpenGroup.visible = !!partial;

    const dark = state.darkRim || state.scene === "doorway";
    // 暗框压光：降低前景材质亮度，让庭院亮主体立刻跳出来
    archWallMat.color.set(dark ? "#432423" : "#c9928c");
    archRimMat.color.set(dark ? "#633b39" : "#e5cbc4");
    midWallMat.color.set(dark ? "#54302e" : "#b67e78");
    pillarMat.color.set(dark ? "#2d1917" : "#764844");
    floorMat.color.set(dark ? "#694a46" : "#c9a59d");
    sunPatch.material.opacity = dark ? 0.24 : 0.44;
    bambooLeafMat.color.set(dark ? "#201211" : "#3a221f");

    // 浅景深前景微虚：用轻量半透明散景轮廓效果提示聚焦在深处花树（CSS 层也会同步叠柔化光晕）
    stage.classList.toggle("soft-focus", !!state.softFocus);
  }

  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  function placeCamera(tIntro) {
    // 开场前 1.7 秒：机位从右侧偏位 (+0.48) 顺滑移步到当前目标机位，展示真实视差
    const introK = tIntro >= 1.7 ? 1 : easeOut(tIntro / 1.7);
    const offsetX = lerp(0.48, 0, introK);
    const offsetY = lerp(0.08, 0, introK);

    const cx = (state.cam.x + offsetX) * 1.25 + smoothHover.x;
    const cy = -(state.cam.y + offsetY) * 0.72 + smoothHover.y;
    // dist ∈ [0, 1] -> 机位 Z 从 3.45（走近，外框宽阔退边）到 5.35（退远，完整拱门与两侧墙面竹影尽收）
    const cz = lerp(3.45, 5.35, state.dist);

    camera.position.set(cx, cy - 0.14, cz);
    // 视线略微朝庭院中心收束（像摄影师横移脚步同时保持镜头大致朝向花树）
    camera.lookAt(cx * 0.14, cy * 0.12 - 0.14, -3.3);
  }

  const { draw } = loop(stage, (t, dt, { still }) => {
    if (still) {
      introT = 99;
      smoothHover.x = 0;
      smoothHover.y = 0;
    } else {
      if (introT < 1.8) {
        introT += dt;
        dirty = true;
      }
      const sm = 1 - Math.exp(-dt * 7);
      const nx = smoothHover.x + (hover.x - smoothHover.x) * sm;
      const ny = smoothHover.y + (hover.y - smoothHover.y) * sm;
      if (Math.abs(nx - smoothHover.x) > 1e-4 || Math.abs(ny - smoothHover.y) > 1e-4) dirty = true;
      smoothHover.x = nx;
      smoothHover.y = ny;
    }

    if (!dirty) return;
    placeCamera(introT);
    renderer.render(scene, camera);
    dirty = false;
    onFrame?.();
  });

  // 鼠标轻微悬停视差
  stage.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || dragging) return;
    const r = stage.getBoundingClientRect();
    hover.x = ((e.clientX - r.left) / r.width - 0.5) * 0.14;
    hover.y = -((e.clientY - r.top) / r.height - 0.5) * 0.09;
  });
  stage.addEventListener("pointerleave", () => {
    hover.x = 0;
    hover.y = 0;
  });

  // 在舞台空白处左右拖动也能平移机位（只截横向，不阻塞页面竖向滚动）
  renderer.domElement.addEventListener("pointerdown", (e) => {
    dragging = { x: e.clientX, camX: state.cam.x };
    renderer.domElement.setPointerCapture(e.pointerId);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = (e.clientX - dragging.x) / Math.max(stage.clientWidth, 200);
    onUserDrag?.(dragging.camX + dx * 2.1, state.cam.y);
  });
  const endDrag = () => (dragging = null);
  renderer.domElement.addEventListener("pointerup", endDrag);
  renderer.domElement.addEventListener("pointercancel", endDrag);

  applySceneAppearance();
  if (reducedMotion.matches) draw();

  return {
    kind: "3d",
    set(next) {
      state = next;
      applySceneAppearance();
      dirty = true;
      if (reducedMotion.matches) draw();
    },
    draw,
  };
}

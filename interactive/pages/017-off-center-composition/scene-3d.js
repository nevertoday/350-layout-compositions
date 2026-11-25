// 开场「偏心引力台」Three.js 轻量三维浮雕舞台
// 忠实取材于海报 017：深靛紫底板、午夜紫暗弧配重、5×5 白点阵、45° 珊瑚斜线群、虚线偏置十字轴、珊瑚红立体主体。
// 任意视口宽高比下，严格按相机视锥映射画框 (u, v) ∈ [0,1]²，确保 DOM 把手与三维主体中心亚像素对齐；
// 不使用昂贵的 bloom 与 shadowMap，慢手机与软件渲染均可满帧。

import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  RingGeometry,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from "three";
import { pixelRatio } from "../../lib/stage.js";
import { CROSSHAIR } from "./model.js";
import { PALETTE } from "./palette.js";

const FOV = 34;
const CAM_Z = 7.4;
const BG_Z = -0.26;
const SUB_Z = 0.24;
const TAN_HALF = Math.tan((FOV * Math.PI) / 360);

function makeSoftShadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  g.addColorStop(0, "rgba(12, 2, 34, 0.72)");
  g.addColorStop(0.55, "rgba(16, 3, 44, 0.34)");
  g.addColorStop(1, "rgba(16, 3, 44, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

function makeDashedLine(x1, y1, x2, y2, dash, gap, z) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / Math.max(1e-5, len);
  const uy = dy / Math.max(1e-5, len);
  const pts = [];
  for (let d = 0; d < len; d += dash + gap) {
    const d2 = Math.min(len, d + dash);
    pts.push(x1 + ux * d, y1 + uy * d, z, x1 + ux * d2, y1 + uy * d2, z);
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pts, 3));
  return geo;
}

export function createScene3D(host) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  const capDpr = () => pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
  renderer.setPixelRatio(capDpr());
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  host.append(renderer.domElement);

  const scene = new Scene();
  scene.background = new Color(PALETTE.bg);

  const camera = new PerspectiveCamera(FOV, 1.35, 0.1, 40);
  camera.position.set(0, 0, CAM_Z);

  scene.add(new AmbientLight("#ae98df", 1.18));
  const keyLight = new DirectionalLight("#fff4f2", 1.9);
  keyLight.position.set(-2.6, 3.6, 5.2);
  scene.add(keyLight);
  const rimLight = new DirectionalLight("#ff7c8c", 0.72);
  rimLight.position.set(4.0, -2.0, 2.2);
  scene.add(rimLight);

  // 背景浮雕盘（随视觉力矩产生克制的 3D 微倾，不干扰主体与指针的精确落点）
  const board = new Group();
  scene.add(board);

  // 主底板（足够覆盖任意倾角）
  const backPlane = new Mesh(
    new PlaneGeometry(24, 24),
    new MeshLambertMaterial({ color: PALETTE.bg })
  );
  backPlane.position.z = -0.55;
  board.add(backPlane);

  // 自适应背景图层容器（每次 resize 重建，严丝合缝贴合当前画幅）
  const decor = new Group();
  board.add(decor);

  // 午夜紫暗弧配重与远端小印
  const cwArcGroup = new Group();
  const cwStampGroup = new Group();
  const stampOuter = new Mesh(
    new RingGeometry(0.15, 0.2, 28),
    new MeshBasicMaterial({ color: PALETTE.coralHot, side: DoubleSide })
  );
  const stampInner = new Mesh(
    new SphereGeometry(0.08, 18, 14),
    new MeshLambertMaterial({ color: PALETTE.ink })
  );
  cwStampGroup.add(stampOuter, stampInner);
  cwStampGroup.visible = false;
  board.add(cwArcGroup, cwStampGroup);

  // 拉力连线（放在主体同层之下，精确从画面中心指向主体）
  const pullGeo = new BufferGeometry();
  pullGeo.setAttribute("position", new Float32BufferAttribute([0, 0, -0.1, 1, 1, -0.1], 3));
  const pullLine = new LineSegments(
    pullGeo,
    new LineBasicMaterial({ color: PALETTE.coralHot, transparent: true, opacity: 0.72 })
  );
  scene.add(pullLine);

  // 解析软影贴片
  const shadowMesh = new Mesh(
    new PlaneGeometry(1.75, 1.75),
    new MeshBasicMaterial({ map: makeSoftShadowTexture(), transparent: true, depthWrite: false })
  );
  shadowMesh.position.z = -0.16;
  scene.add(shadowMesh);

  // 三种可切换主体：珊瑚红球体 / 左向锐锥 / 竖立柱块
  const subjectGroup = new Group();
  const coralMat = new MeshLambertMaterial({ color: PALETTE.coral });
  const coralAccentMat = new MeshLambertMaterial({ color: PALETTE.coralHot });
  const ivoryMat = new MeshLambertMaterial({ color: PALETTE.ink });

  const orbMesh = new Mesh(new SphereGeometry(0.56, 36, 26), coralMat);

  const pointerGroup = new Group();
  const cone = new Mesh(new ConeGeometry(0.42, 1.12, 32), coralMat);
  cone.rotation.z = Math.PI / 2;
  const tailRing = new Mesh(new RingGeometry(0.29, 0.39, 28), new MeshBasicMaterial({ color: PALETTE.ink, side: DoubleSide }));
  tailRing.rotation.y = Math.PI / 2;
  tailRing.position.x = 0.57;
  pointerGroup.add(cone, tailRing);
  pointerGroup.visible = false;

  const monoGroup = new Group();
  const slab = new Mesh(new BoxGeometry(0.7, 1.18, 0.34), coralMat);
  const cap = new Mesh(new BoxGeometry(0.72, 0.075, 0.36), ivoryMat);
  cap.position.y = 0.38;
  const sideBar = new Mesh(new BoxGeometry(0.075, 1.18, 0.36), coralAccentMat);
  sideBar.position.x = -0.31;
  monoGroup.add(slab, cap, sideBar);
  monoGroup.visible = false;

  subjectGroup.add(orbMesh, pointerGroup, monoGroup);
  subjectGroup.position.z = SUB_Z;
  scene.add(subjectGroup);

  // 视锥实时尺寸（在 Z 平面上的可见宽高）
  let aspect = 1.35;
  const spanAt = (z) => {
    const h = 2 * TAN_HALF * (CAM_Z - z);
    return { w: h * aspect, h };
  };
  const uvAt = (u, v, z) => {
    const { w, h } = spanAt(z);
    return [(u - 0.5) * w, (0.5 - v) * h];
  };

  const dotGeo = new SphereGeometry(0.025, 10, 8);
  const dotMat = new MeshBasicMaterial({ color: PALETTE.ink, transparent: true, opacity: 0.78 });
  const axisMat = new LineBasicMaterial({ color: PALETTE.ink, transparent: true, opacity: 0.48 });
  const tickMat = new LineBasicMaterial({ color: PALETTE.inkMute, transparent: true, opacity: 0.36 });
  const hatchMat = new LineBasicMaterial({ color: PALETTE.coralHot, transparent: true, opacity: 0.55 });
  const arcMat = new MeshLambertMaterial({ color: PALETTE.arc, side: DoubleSide });
  const arcRimMat = new MeshBasicMaterial({ color: PALETTE.arcEdge, transparent: true, opacity: 0.55, side: DoubleSide });

  function disposeChildren(group) {
    while (group.children.length) {
      const child = group.children.pop();
      if (child.geometry && child.geometry !== dotGeo) child.geometry.dispose();
    }
  }

  function rebuildDecor() {
    disposeChildren(decor);
    disposeChildren(cwArcGroup);

    const { w, h } = spanAt(BG_Z);
    const minSide = Math.min(w, h);

    // 偏置白色虚线十字轴 + 珊瑚交点环
    const [cx, cy] = uvAt(CROSSHAIR.u, CROSSHAIR.v, BG_Z);
    decor.add(
      new LineSegments(makeDashedLine(cx, -h * 0.46, cx, h * 0.46, 0.12, 0.095, BG_Z), axisMat),
      new LineSegments(makeDashedLine(-w * 0.46, cy, w * 0.46, cy, 0.12, 0.095, BG_Z), axisMat)
    );

    // 真实几何中心淡小十字（对照偏置轴）
    const tk = 0.12;
    const tickGeo = new BufferGeometry();
    tickGeo.setAttribute("position", new Float32BufferAttribute([-tk, 0, BG_Z, tk, 0, BG_Z, 0, -tk, BG_Z, 0, tk, BG_Z], 3));
    decor.add(new LineSegments(tickGeo, tickMat));

    const pivot = new Mesh(new RingGeometry(0.045, 0.095, 24), new MeshBasicMaterial({ color: PALETTE.coralHot, side: DoubleSide }));
    pivot.position.set(cx, cy, BG_Z + 0.01);
    decor.add(pivot);

    // 5×5 白点阵：稳稳排在右上 HUD 下方（v 从 0.15 起），绝不和右上坐标条打架
    const step = Math.min(0.135, minSide * 0.032);
    const xStart = w * 0.455 - 4 * step;
    const yStart = h * 0.34;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const dot = new Mesh(dotGeo, dotMat);
        dot.position.set(xStart + c * step, yStart - r * step, BG_Z);
        decor.add(dot);
      }
    }

    // 右下角 45° 珊瑚斜线群
    const hSize = minSide * 0.24;
    const hx0 = w * 0.465 - hSize;
    const hy0 = -h * 0.465;
    const hatchPts = [];
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      hatchPts.push(hx0 + t * hSize, hy0, BG_Z, hx0 + hSize, hy0 + (1 - t) * hSize, BG_Z);
    }
    const hatchGeo = new BufferGeometry();
    hatchGeo.setAttribute("position", new Float32BufferAttribute(hatchPts, 3));
    decor.add(new LineSegments(hatchGeo, hatchMat));

    // 左下午夜紫四分之一大弧（半径按画幅自适应）
    const rOut = minSide * 0.49;
    const rIn = minSide * 0.26;
    const arcMesh = new Mesh(new RingGeometry(rIn, rOut, 40, 1, 0, Math.PI / 2), arcMat);
    arcMesh.position.set(-w * 0.5, -h * 0.5, BG_Z - 0.03);
    const arcRim = new Mesh(new RingGeometry(rOut - 0.025, rOut, 40, 1, 0, Math.PI / 2), arcRimMat);
    arcRim.position.set(-w * 0.5, -h * 0.5, BG_Z - 0.02);
    cwArcGroup.add(arcMesh, arcRim);

    // 主体大小按画幅短边微调，手机和桌面视觉比例一致
    const subScale = Math.max(0.76, Math.min(1.06, minSide / 4.2));
    subjectGroup.scale.setScalar(subScale);
  }

  function resize(w, h) {
    const rw = Math.max(1, w);
    const rh = Math.max(1, h);
    aspect = rw / rh;
    renderer.setPixelRatio(capDpr());
    renderer.setSize(rw, rh, false);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    rebuildDecor();
  }

  function render(frameState, t) {
    const { u, v, subject, counterweight, info, still } = frameState;
    const [sx, sy] = uvAt(u, v, SUB_Z);

    orbMesh.visible = subject === "orb";
    pointerGroup.visible = subject === "pointer";
    monoGroup.visible = subject === "monolith";

    // 主体严丝合缝落在 (u, v) 透视射线上，带极克制呼吸感
    const breath = still ? 0 : Math.sin(t * 1.45) * 0.024;
    subjectGroup.position.set(sx, sy + breath, SUB_Z);

    if (subject === "pointer") {
      pointerGroup.rotation.y = still ? 0.14 : 0.14 + Math.sin(t * 1.1) * 0.08;
    } else if (subject === "monolith") {
      monoGroup.rotation.y = still ? -0.18 : -0.18 + Math.sin(t * 0.9) * 0.06;
    }

    // 软影与拉力线精准对接主圆中心
    const [shx, shy] = uvAt(u, v, -0.16);
    shadowMesh.position.set(shx + 0.14, shy - 0.16, -0.16);
    const sScale = subjectGroup.scale.x;
    shadowMesh.scale.set(sScale, subject === "monolith" ? sScale * 1.24 : sScale, 1);

    const [lx, ly] = uvAt(u, v, -0.1);
    const pAttr = pullGeo.attributes.position;
    pAttr.setXYZ(0, 0, 0, -0.1);
    pAttr.setXYZ(1, lx, ly, -0.1);
    pAttr.needsUpdate = true;
    pullLine.visible = info.ecc > 0.04;

    // 配重显隐与对角镜像
    cwArcGroup.visible = counterweight === "arc";
    cwStampGroup.visible = counterweight === "dot";
    if (info.cwPos) {
      if (counterweight === "arc") {
        const flipX = info.cwPos.u > 0.5 ? -1 : 1;
        const flipY = info.cwPos.v < 0.5 ? -1 : 1;
        cwArcGroup.scale.set(flipX, flipY, 1);
      } else if (counterweight === "dot") {
        const [cwx, cwy] = uvAt(info.cwPos.u, info.cwPos.v, BG_Z + 0.05);
        cwStampGroup.position.set(cwx, cwy, BG_Z + 0.05);
      }
    }

    // 背景浮雕盘随净视觉力矩微倾（居中零倾角，过偏明显倾斜）
    const targetRotY = info.tiltX * 0.095;
    const targetRotX = -info.tiltY * 0.08;
    board.rotation.y = still ? targetRotY : board.rotation.y + (targetRotY - board.rotation.y) * 0.18;
    board.rotation.x = still ? targetRotX : board.rotation.x + (targetRotX - board.rotation.x) * 0.18;

    renderer.render(scene, camera);
  }

  return { resize, render };
}

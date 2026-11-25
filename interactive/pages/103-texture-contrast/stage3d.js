// 首屏「触感标本配对台」双引擎渲染器：Three.js PBR 3D 浮雕光影桌台 + 无 WebGL 时 2D 画布同源降级
// 两者共用 model.js 状态与 textures.js 材质，零阴影贴图开销（解析柔和接触阴影），在慢手机与软件渲染下同样顺滑。

import * as THREE from "three";
import { loop, pixelRatio, webgl } from "../../lib/stage.js";
import { MATERIALS, SLOTS, evaluate, hitTestSlot, lightGeometry } from "./model.js";
import { getTextureSet } from "./textures.js";

// 制作柔和接触阴影贴图（圆形、方形、三角形）
function makeShadowTexture(shape) {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d");
  ctx.save();
  ctx.filter = "blur(11px)";
  ctx.fillStyle = "rgba(44, 28, 14, 0.72)";
  if (shape === "disc" || shape === "sphere") {
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s * 0.34, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === "tile" || shape === "sheet") {
    ctx.fillRect(s * 0.17, s * 0.17, s * 0.66, s * 0.66);
  } else if (shape === "prism") {
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.14);
    ctx.lineTo(s * 0.15, s * 0.80);
    ctx.lineTo(s * 0.85, s * 0.80);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  return c;
}

// 给棉纸衬底右下角绘制原海报同款 10×6 触感点阵（透明底覆盖层）
function makeDotMatrixCanvas() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 160;
  const ctx = c.getContext("2d");
  const cols = 10;
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = 16 + (col / (cols - 1)) * (256 - 32);
      const y = 16 + (r / (rows - 1)) * (160 - 32);
      ctx.fillStyle = "rgba(46, 38, 30, 0.58)";
      ctx.beginPath();
      ctx.arc(x, y, 4.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return c;
}

// 统一将桌台 (u,v) 映射到世界坐标 [-1, 1] × [-1, 1]（正方形逻辑坐标，等比缩放绝不变形）
const uToX = (u) => (u - 0.5) * 2;
const vToY = (v) => (0.5 - v) * 2;

function createRoundedSquareShape(half, bevel) {
  const s = new THREE.Shape();
  const r = bevel;
  s.moveTo(-half + r, -half);
  s.lineTo(half - r, -half);
  s.quadraticCurveTo(half, -half, half, -half + r);
  s.lineTo(half, half - r);
  s.quadraticCurveTo(half, half, half - r, half);
  s.lineTo(-half + r, half);
  s.quadraticCurveTo(-half, half, -half, half - r);
  s.lineTo(-half, -half + r);
  s.quadraticCurveTo(-half, -half, -half + r, -half);
  return s;
}

function createTriangleShape(radius) {
  const s = new THREE.Shape();
  // 与 model.js 的 hitTestSlot 完全一致：顶角向上
  s.moveTo(0, radius * 1.12);
  s.lineTo(-radius * 1.05, -radius * 0.68);
  s.lineTo(radius * 1.05, -radius * 0.68);
  s.closePath();
  return s;
}

// 把 ExtrudeGeometry 的 UV 规整到 0..1 区间，避免程序纹理拉伸
function normalizePlanarUVs(geo, scale) {
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) * scale + 0.5, pos.getY(i) * scale + 0.5);
  }
  uv.needsUpdate = true;
}

// 构造极轻量的演播室反光环境（不联网、不加载 HDRI），让金属拉丝和漆面球有真实棚拍高光
function createStudioEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xefe4d4);

  const panels = [
    { pos: [-5, 5, 5], rot: [0, 0.7, 0], size: [6, 6], color: 0xfff8ee },
    { pos: [5.5, 3, 4], rot: [0, -0.8, 0], size: [5, 5], color: 0xe6d6c0 },
    { pos: [0, 6, 3], rot: [1.1, 0, 0], size: [8, 4], color: 0xffffff },
    { pos: [0, -5, 3], rot: [-1.1, 0, 0], size: [8, 5], color: 0x4b3828 },
    { pos: [0, 0, -6], rot: [0, 0, 0], size: [12, 10], color: 0x3b2c1e },
  ];
  for (const p of panels) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(p.size[0], p.size[1]),
      new THREE.MeshBasicMaterial({ color: p.color, side: THREE.DoubleSide })
    );
    m.position.set(...p.pos);
    m.rotation.set(...p.rot);
    envScene.add(m);
  }
  const rt = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  return rt.texture;
}

export function mountHeroStage(container, state, { onSelect, onChange }) {
  const texSets = getTextureSet();
  const dotCanvas = makeDotMatrixCanvas();
  const useGL = webgl();

  if (useGL) {
    return mountWebGL(container, state, texSets, dotCanvas, { onSelect, onChange });
  }
  return mount2DFallback(container, state, texSets, dotCanvas, { onSelect, onChange });
}

function mountWebGL(container, state, texSets, dotCanvas, { onSelect }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(pixelRatio(1.5));
  renderer.setClearColor(0xf2e5d4, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const canvas = renderer.domElement;
  canvas.className = "hero-gl-canvas";
  canvas.setAttribute("aria-hidden", "true");
  container.prepend(canvas);

  const scene = new THREE.Scene();
  scene.background = null;
  const envTex = createStudioEnv(renderer);
  scene.environment = envTex;

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);

  // 缓存五种 Three.js PBR 材质，切换材质瞬间零重建开销
  const threeMats = {};
  for (const id of Object.keys(MATERIALS)) {
    const def = MATERIALS[id];
    const t = texSets[id];
    const albedoTex = new THREE.CanvasTexture(t.albedo);
    albedoTex.wrapS = albedoTex.wrapT = THREE.RepeatWrapping;
    albedoTex.colorSpace = THREE.SRGBColorSpace;
    albedoTex.repeat.set(id === "smooth" ? 1 : 1.35, id === "smooth" ? 1 : 1.35);

    const normalTex = new THREE.CanvasTexture(t.normal);
    normalTex.wrapS = normalTex.wrapT = THREE.RepeatWrapping;
    normalTex.repeat.set(id === "smooth" ? 1 : 1.35, id === "smooth" ? 1 : 1.35);

    const mat = new THREE.MeshStandardMaterial({
      map: albedoTex,
      normalMap: id === "smooth" ? null : normalTex,
      normalScale: new THREE.Vector2(
        id === "rough" ? 2.1 : id === "grainy" ? 2.2 : id === "metal" ? 0.95 : 0.65,
        id === "rough" ? 2.1 : id === "grainy" ? 2.2 : id === "metal" ? 0.95 : 0.65
      ),
      roughness: def.roughness,
      metalness: def.metalness,
      envMapIntensity: id === "metal" ? 1.55 : id === "smooth" ? 1.35 : 0.25,
    });
    threeMats[id] = mat;
  }

  // 主掠射测光灯 + 柔和漫反射天光 + 极克制暖反光补灯
  const keyLight = new THREE.DirectionalLight(0xfff7ea, 2.55);
  scene.add(keyLight);

  const hemiLight = new THREE.HemisphereLight(0xfff6e8, 0x7d654e, 0.78);
  scene.add(hemiLight);

  const rimLight = new THREE.DirectionalLight(0xead4ba, 0.45);
  rimLight.position.set(1.5, -2.0, 1.2);
  scene.add(rimLight);

  // 标本世界组（居中缩放适配宽屏与竖屏，保证 1:1 几何绝不被拉扁）
  const cluster = new THREE.Group();
  scene.add(cluster);

  const slotMeshes = {};
  const shadowMeshes = {};
  const ringMeshes = {};
  const bounceTimers = {};

  for (const s of SLOTS) {
    const cx = uToX(s.u);
    const cy = vToY(s.v);

    // 接触阴影片（实时按侧光方向偏移与拉伸，零 shadowMap 开销）
    const shTex = new THREE.CanvasTexture(makeShadowTexture(s.shape));
    const shMat = new THREE.MeshBasicMaterial({
      map: shTex,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });
    const shSize = s.shape === "disc" || s.shape === "sphere" ? s.r * 2 * 1.48 : s.r * 2 * 1.56;
    const shMesh = new THREE.Mesh(new THREE.PlaneGeometry(shSize, shSize), shMat);
    shMesh.position.set(cx, cy, s.z - 0.04);
    cluster.add(shMesh);
    shadowMeshes[s.id] = shMesh;

    // 3D 实体几何
    let geo;
    if (s.shape === "disc") {
      geo = new THREE.CylinderGeometry(s.r * 2, s.r * 2, 0.048, 56);
      geo.rotateX(Math.PI / 2);
      normalizePlanarUVs(geo, 1.15);
    } else if (s.shape === "sphere") {
      geo = new THREE.SphereGeometry(s.r * 2, 42, 32);
    } else if (s.shape === "tile" || s.shape === "sheet") {
      const half = s.r * 2;
      const depth = s.shape === "tile" ? 0.052 : 0.022;
      const shape = createRoundedSquareShape(half, 0.008);
      geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: 0.008,
        bevelSize: 0.008,
        bevelSegments: 2,
      });
      geo.translate(0, 0, -depth * 0.5);
      normalizePlanarUVs(geo, 1.45);
    } else if (s.shape === "prism") {
      const shape = createTriangleShape(s.r * 2);
      geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.048,
        bevelEnabled: true,
        bevelThickness: 0.011,
        bevelSize: 0.011,
        bevelSegments: 2,
      });
      geo.translate(0, 0, -0.024);
      normalizePlanarUVs(geo, 1.35);
    }

    const mesh = new THREE.Mesh(geo, threeMats[state.slots[s.id]]);
    mesh.position.set(cx, cy, s.z);
    mesh.userData.slotId = s.id;
    cluster.add(mesh);
    slotMeshes[s.id] = mesh;

    // 选中时的纤细赤陶选框/轮廓环
    let ringGeo;
    if (s.shape === "disc" || s.shape === "sphere") {
      ringGeo = new THREE.RingGeometry(s.r * 2 + 0.016, s.r * 2 + 0.028, 56);
    } else if (s.shape === "tile" || s.shape === "sheet") {
      const h = s.r * 2 + 0.022;
      const pts = [
        new THREE.Vector3(-h, -h, 0),
        new THREE.Vector3(h, -h, 0),
        new THREE.Vector3(h, h, 0),
        new THREE.Vector3(-h, h, 0),
        new THREE.Vector3(-h, -h, 0),
      ];
      ringGeo = new THREE.BufferGeometry().setFromPoints(pts);
    } else {
      const r = s.r * 2 + 0.026;
      const pts = [
        new THREE.Vector3(0, r * 1.12, 0),
        new THREE.Vector3(-r * 1.05, -r * 0.68, 0),
        new THREE.Vector3(r * 1.05, -r * 0.68, 0),
        new THREE.Vector3(0, r * 1.12, 0),
      ];
      ringGeo = new THREE.BufferGeometry().setFromPoints(pts);
    }

    const ringObj =
      s.shape === "disc" || s.shape === "sphere"
        ? new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xb64e22, transparent: true, opacity: 0.92 }))
        : new THREE.Line(ringGeo, new THREE.LineBasicMaterial({ color: 0xb64e22, transparent: true, opacity: 0.95 }));
    ringObj.position.set(cx, cy, s.z + (s.shape === "sphere" ? s.r * 2 + 0.01 : 0.046));
    ringObj.visible = s.id === state.selected;
    cluster.add(ringObj);
    ringMeshes[s.id] = ringObj;
  }

  // 原海报纸页右下角 10×6 触感点阵（作为独立浮层叠加在纸页与前景三角之间）
  const dotTex = new THREE.CanvasTexture(dotCanvas);
  dotTex.colorSpace = THREE.SRGBColorSpace;
  const dotMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.26),
    new THREE.MeshBasicMaterial({ map: dotTex, transparent: true, depthWrite: false })
  );
  dotMesh.position.set(uToX(0.61), vToY(0.73), 0.28);
  cluster.add(dotMesh);

  let width = 1;
  let height = 1;
  let squareSize = 1;
  let squareLeft = 0;
  let squareTop = 0;
  let currentLight = state.lightParam;
  let needsRender = true;
  let intro = 0;

  function resize() {
    const rect = container.getBoundingClientRect();
    width = Math.max(10, Math.round(rect.width));
    height = Math.max(10, Math.round(rect.height));
    renderer.setSize(width, height, false);
    const aspect = width / height;
    // 在水平或竖直容器中保证正方形逻辑区 [-1,1] 永远完整居中且不拉扁
    const pad = width < 480 ? 1.04 : 1.12;
    if (aspect >= 1) {
      camera.left = -aspect * pad;
      camera.right = aspect * pad;
      camera.top = pad;
      camera.bottom = -pad;
      squareSize = height / pad;
    } else {
      camera.left = -pad;
      camera.right = pad;
      camera.top = pad / aspect;
      camera.bottom = -pad / aspect;
      squareSize = width / pad;
    }
    squareLeft = (width - squareSize) / 2;
    squareTop = (height - squareSize) / 2;
    camera.updateProjectionMatrix();
    needsRender = true;
  }

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // 把逻辑坐标 (u,v) 转成容器内像素坐标，给外部 SVG 折线引注对齐用
  function projectUV(u, v) {
    return {
      x: squareLeft + u * squareSize,
      y: squareTop + v * squareSize,
    };
  }

  function pointerToUV(clientX, clientY) {
    const rect = container.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    return {
      u: (px - squareLeft) / squareSize,
      v: (py - squareTop) / squareSize,
    };
  }

  canvas.addEventListener("pointerdown", (e) => {
    const { u, v } = pointerToUV(e.clientX, e.clientY);
    const hit = hitTestSlot(u, v);
    if (hit) {
      onSelect(hit);
    }
  });

  function syncMaterials(changedSlot) {
    for (const s of SLOTS) {
      const matId = state.slots[s.id];
      slotMeshes[s.id].material = threeMats[matId];
      ringMeshes[s.id].visible = s.id === state.selected;
    }
    if (changedSlot) bounceTimers[changedSlot] = 1.0;
    needsRender = true;
  }

  function renderFrame(t, dt, { still }) {
    if (still) {
      intro = 1;
      currentLight = state.lightParam;
    } else {
      intro = Math.min(1, intro + (dt || 0.016) * 2.1);
      const diff = state.lightParam - currentLight;
      if (Math.abs(diff) > 0.0005) {
        currentLight += diff * Math.min(1, (dt || 0.016) * 14);
        needsRender = true;
      } else {
        currentLight = state.lightParam;
      }
    }

    let animatingBounce = false;
    for (const s of SLOTS) {
      const b = bounceTimers[s.id] || 0;
      if (b > 0.001 && !still) {
        bounceTimers[s.id] = Math.max(0, b - (dt || 0.016) * 4.2);
        const lift = Math.sin(bounceTimers[s.id] * Math.PI) * 0.045;
        slotMeshes[s.id].position.z = s.z + lift;
        const sc = 1 + Math.sin(bounceTimers[s.id] * Math.PI) * 0.032;
        slotMeshes[s.id].scale.setScalar(sc);
        animatingBounce = true;
        needsRender = true;
      } else {
        slotMeshes[s.id].position.z = s.z;
        slotMeshes[s.id].scale.setScalar(1);
      }
    }

    if (intro < 1) needsRender = true;
    if (!needsRender && !still) return;

    const lg = lightGeometry(currentLight);
    keyLight.position.set(lg.dir.x * 4.5, lg.dir.y * 4.5, lg.dir.z * 4.5);
    // 顶平光偏柔和，掠射侧光更有雕塑明暗感
    keyLight.intensity = 2.0 + (1 - lg.dir.z) * 1.45;
    hemiLight.intensity = 0.92 - (1 - lg.dir.z) * 0.34;

    // 让解析接触阴影沿光线反方向偏移并随低角度拉长（顶光时仍保留干净的实体边缘衬影）
    const spread = 0.036 + (1 - lg.dir.z) * 0.145;
    for (const s of SLOTS) {
      const sh = shadowMeshes[s.id];
      const cx = uToX(s.u);
      const cy = vToY(s.v);
      const heightFactor = s.shape === "sphere" ? 1.45 : s.shape === "prism" ? 1.15 : 0.95;
      sh.position.x = cx - lg.dir.x * spread * heightFactor;
      sh.position.y = cy - lg.dir.y * spread * heightFactor - 0.015;
      sh.material.opacity = 0.26 + (1 - lg.dir.z) * 0.32;
    }

    // 温和入场缩放
    const ease = 1 - Math.pow(1 - intro, 3);
    cluster.scale.setScalar(0.95 + 0.05 * ease);

    renderer.render(scene, camera);
    if (!animatingBounce && intro >= 1 && Math.abs(state.lightParam - currentLight) <= 0.0005) {
      needsRender = false;
    }
  }

  const ctrl = loop(container, renderFrame);
  // 首帧立即画好，确保 check 截屏和 reduced-motion 绝不空白
  renderFrame(0, 0, { still: false });

  return {
    engine: "webgl",
    projectUV,
    sync(changedSlot) {
      syncMaterials(changedSlot);
      ctrl.draw();
    },
    forceDraw() {
      needsRender = true;
      ctrl.draw();
    },
  };
}

// ---------- 无 WebGL 时的 2D 画布同源降级（共用完全相同的材质纹理与模型状态） ----------
function mount2DFallback(container, state, texSets, dotCanvas, { onSelect }) {
  const canvas = document.createElement("canvas");
  canvas.className = "hero-gl-canvas";
  canvas.setAttribute("aria-hidden", "true");
  container.prepend(canvas);
  const ctx = canvas.getContext("2d");

  let width = 1;
  let height = 1;
  let squareSize = 1;
  let squareLeft = 0;
  let squareTop = 0;

  function resize() {
    const rect = container.getBoundingClientRect();
    width = Math.max(10, Math.round(rect.width));
    height = Math.max(10, Math.round(rect.height));
    const dpr = pixelRatio(2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = width < 480 ? 1.04 : 1.12;
    squareSize = Math.min(width, height) / pad;
    squareLeft = (width - squareSize) / 2;
    squareTop = (height - squareSize) / 2;
    draw();
  }

  function projectUV(u, v) {
    return { x: squareLeft + u * squareSize, y: squareTop + v * squareSize };
  }

  canvas.addEventListener("pointerdown", (e) => {
    const rect = container.getBoundingClientRect();
    const u = (e.clientX - rect.left - squareLeft) / squareSize;
    const v = (e.clientY - rect.top - squareTop) / squareSize;
    const hit = hitTestSlot(u, v);
    if (hit) onSelect(hit);
  });

  function traceSlot(s) {
    const x = squareLeft + s.u * squareSize;
    const y = squareTop + s.v * squareSize;
    const r = s.r * squareSize;
    ctx.beginPath();
    if (s.shape === "disc" || s.shape === "sphere") {
      ctx.arc(x, y, r, 0, Math.PI * 2);
    } else if (s.shape === "tile" || s.shape === "sheet") {
      ctx.rect(x - r, y - r, r * 2, r * 2);
    } else if (s.shape === "prism") {
      ctx.moveTo(x, y - r * 1.12);
      ctx.lineTo(x - r * 1.05, y + r * 0.68);
      ctx.lineTo(x + r * 1.05, y + r * 0.68);
      ctx.closePath();
    }
    return { x, y, r };
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#F2E5D4";
    ctx.fillRect(0, 0, width, height);

    const lg = lightGeometry(state.lightParam);
    const shDist = (0.015 + (1 - lg.dir.z) * 0.055) * squareSize;
    const sx = -lg.dir.x * shDist;
    const sy = lg.dir.y * shDist;

    for (const s of SLOTS) {
      const matId = state.slots[s.id];
      const t = texSets[matId];
      const x = squareLeft + s.u * squareSize;
      const y = squareTop + s.v * squareSize;
      const r = s.r * squareSize;

      // 投影
      ctx.save();
      ctx.shadowColor = `rgba(42, 26, 12, ${(0.18 + (1 - lg.dir.z) * 0.28).toFixed(2)})`;
      ctx.shadowBlur = 12 + (1 - lg.dir.z) * 18;
      ctx.shadowOffsetX = sx;
      ctx.shadowOffsetY = sy;
      traceSlot(s);
      ctx.fillStyle = MATERIALS[matId].hex;
      ctx.fill();
      ctx.restore();

      // 实体材质平铺 + 光照响应
      ctx.save();
      traceSlot(s);
      ctx.clip();
      ctx.drawImage(t.albedo, x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);

      // 方向光照与高光叠层
      if (matId === "smooth" || s.shape === "sphere") {
        const hx = x + lg.dir.x * r * 0.45;
        const hy = y - lg.dir.y * r * 0.45;
        const g = ctx.createRadialGradient(hx, hy, r * 0.05, x, y, r * 1.35);
        const hi = matId === "smooth" ? 0.56 : 0.24;
        g.addColorStop(0, `rgba(255,248,236,${hi})`);
        g.addColorStop(0.45, "rgba(255,248,236,0)");
        g.addColorStop(1, `rgba(22,12,4,${(0.28 + (1 - lg.dir.z) * 0.25).toFixed(2)})`);
        ctx.fillStyle = g;
        ctx.fillRect(x - r * 1.3, y - r * 1.3, r * 2.6, r * 2.6);
      } else if (matId === "metal") {
        const gx1 = x - lg.dir.x * r * 1.4;
        const gy1 = y + lg.dir.y * r * 1.4;
        const gx2 = x + lg.dir.x * r * 1.4;
        const gy2 = y - lg.dir.y * r * 1.4;
        const g = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
        g.addColorStop(0, "rgba(24,26,30,0.34)");
        g.addColorStop(0.44, "rgba(255,255,255,0.06)");
        g.addColorStop(0.56, "rgba(255,255,255,0.44)");
        g.addColorStop(1, "rgba(35,38,42,0.22)");
        ctx.fillStyle = g;
        ctx.fillRect(x - r * 1.3, y - r * 1.3, r * 2.6, r * 2.6);
      } else {
        const g = ctx.createLinearGradient(x + lg.dir.x * r, y - lg.dir.y * r, x - lg.dir.x * r, y + lg.dir.y * r);
        const k = 0.06 + (1 - lg.dir.z) * 0.22;
        g.addColorStop(0, `rgba(255,248,236,${k.toFixed(2)})`);
        g.addColorStop(1, `rgba(38,24,10,${(k * 1.1).toFixed(2)})`);
        ctx.fillStyle = g;
        ctx.fillRect(x - r * 1.3, y - r * 1.3, r * 2.6, r * 2.6);
      }
      ctx.restore();

      // 选中框
      if (s.id === state.selected) {
        ctx.save();
        traceSlot(s);
        ctx.strokeStyle = "#B64E22";
        ctx.lineWidth = 2.2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.restore();
      }

      // 纸页之后叠触感点阵
      if (s.id === "tile") {
        const dp = projectUV(0.505, 0.665);
        ctx.drawImage(dotCanvas, dp.x, dp.y, squareSize * 0.21, squareSize * 0.13);
      }
    }
  }

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  return {
    engine: "2d",
    projectUV,
    sync() {
      draw();
    },
    forceDraw() {
      draw();
    },
  };
}

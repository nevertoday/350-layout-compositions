// 开场 3D 舞台：用原海报的深紫夜幕、暖杏方体、珊瑚粉球体、暖米锥体与薰衣草柱体搭出一组实时可变数量的几何静物。
// 不使用昂贵的后期泛光（bloom），保持极少 draw call，确保慢手机与软件渲染也能高帧率运行。
import * as THREE from "three";
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE } from "./model.js";

const NS = "http://www.w3.org/2000/svg";
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));

function makeGeometry(shape) {
  switch (shape) {
    case "cube":
      return new THREE.BoxGeometry(0.92, 0.92, 0.92);
    case "cone":
      return new THREE.ConeGeometry(0.62, 1.12, 32);
    case "cylinder":
      return new THREE.CylinderGeometry(0.46, 0.46, 0.96, 28);
    case "octa":
      return new THREE.OctahedronGeometry(0.62, 0);
    case "capsule":
      return new THREE.CapsuleGeometry(0.36, 0.42, 10, 20);
    case "torus":
      return new THREE.TorusGeometry(0.44, 0.19, 16, 36);
    case "sphere":
    default:
      return new THREE.SphereGeometry(0.58, 32, 24);
  }
}

export function createScene3D(stage, { onFrame } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(pixelRatio(matchMedia("(pointer: coarse)").matches ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.bg);

  const camera = new THREE.PerspectiveCamera(34, 4 / 3, 0.1, 40);
  camera.position.set(0, 1.35, 6.2);
  camera.lookAt(0, 0.08, 0);

  // 简洁高效的三点打光：暖主光 + 粉侧光 + 薰衣草底补光
  const hemi = new THREE.HemisphereLight(0xfff1e4, 0x261a55, 0.92);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff3e0, 1.65);
  key.position.set(3.2, 5.2, 4.5);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xf06c92, 0.85);
  rim.position.set(-4.2, 2.2, -2.5);
  scene.add(rim);

  // 椭圆暗紫展台（呼应原海报底部的椭圆深紫投影盘）
  const plinthGroup = new THREE.Group();
  plinthGroup.position.set(0, -0.78, 0);
  scene.add(plinthGroup);

  const plinthGeo = new THREE.CylinderGeometry(2.65, 2.75, 0.14, 48);
  plinthGeo.scale(1.12, 1, 0.56);
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0x23184b, roughness: 0.72, metalness: 0.08 });
  const plinth = new THREE.Mesh(plinthGeo, plinthMat);
  plinthGroup.add(plinth);

  const rimRingGeo = new THREE.RingGeometry(2.58, 2.66, 64);
  rimRingGeo.rotateX(-Math.PI / 2);
  rimRingGeo.scale(1.12, 1, 0.56);
  const rimRing = new THREE.Mesh(
    rimRingGeo,
    new THREE.MeshBasicMaterial({ color: PALETTE.pink, transparent: true, opacity: 0.24 })
  );
  rimRing.position.y = 0.075;
  plinthGroup.add(rimRing);

  // 背景里的装饰微光星点（呼应海报的四角星与点阵，极轻量 Instanced / Points）
  const starPos = new Float32Array([
    -2.6, 1.45, -2.4, -2.1, 1.85, -2.8, 2.35, 1.65, -2.2, 2.8, 1.15, -2.6,
    -1.2, 1.9, -3.0, 1.15, 1.75, -2.9, -2.8, 0.4, -2.5, 2.9, 0.2, -2.7,
    0.0, 2.05, -3.1, -0.6, 1.4, -2.6, 0.8, 1.35, -2.5, 1.9, 1.95, -3.0,
  ]);
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xf4dfc2, size: 0.065, transparent: true, opacity: 0.5 })
  );
  scene.add(stars);

  // 共享几何池，按形状复用
  const geoCache = new Map();
  const getGeo = (shape) => {
    if (!geoCache.has(shape)) geoCache.set(shape, makeGeometry(shape));
    return geoCache.get(shape);
  };

  // 最多 9 个槽位对象，常驻场景通过 visible 切换，避免增删对象造成 GC 抖动
  const shadowGeo = new THREE.CircleGeometry(0.54, 24);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x090418, transparent: true, opacity: 0.46 });

  const pool = Array.from({ length: 9 }, () => {
    const mat = new THREE.MeshStandardMaterial({ color: PALETTE.pink, roughness: 0.36, metalness: 0.06 });
    const mesh = new THREE.Mesh(getGeo("sphere"), mat);
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = -0.7;
    mesh.visible = false;
    shadow.visible = false;
    scene.add(mesh);
    scene.add(shadow);
    return {
      mesh,
      shadow,
      mat,
      shape: "sphere",
      curX: 0,
      curY: 0,
      curZ: 0,
      curS: 0.001,
      initialized: false,
    };
  });

  // 叠加在 3D 画布上的矢量注释层（节奏虚线弧、偶数配对括号、视线扫描路径）
  const overlay = document.createElementNS(NS, "svg");
  overlay.classList.add("stage-overlay");
  overlay.setAttribute("aria-hidden", "true");
  stage.insertBefore(overlay, renderer.domElement.nextSibling);

  let layoutData = null;
  let showPath = true;
  let width = 640;
  let height = 480;
  let introT = reducedMotion.matches ? 10 : 0;
  let camYaw = 0;
  let targetYaw = 0;
  const projVec = new THREE.Vector3();

  // 把 0..1 的逻辑位置映射到 3D 展台空间
  const SPAN_X = 4.6;
  const toWorldX = (u) => (u - 0.5) * SPAN_X;
  const toWorldY = (v, s) => (0.56 - v) * 3.1 + s * 0.46 - 0.68;

  function projectWorld(x, y, z) {
    projVec.set(x, y, z).project(camera);
    return {
      x: (projVec.x * 0.5 + 0.5) * width,
      y: (-projVec.y * 0.5 + 0.5) * height,
    };
  }

  function resize() {
    width = stage.clientWidth || 360;
    height = stage.clientHeight || 360;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // 窄竖屏适当退后机位，确保 3..9 个元素完整落在画框内
    const narrow = Math.max(0, 1.28 - camera.aspect);
    camera.position.z = 5.95 + narrow * 2.95;
    camera.position.y = 1.28 + narrow * 0.25;
    camera.updateProjectionMatrix();
    overlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }
  new ResizeObserver(() => {
    resize();
    runner.draw();
  }).observe(stage);
  resize();

  function drawOverlay(t, still) {
    if (!layoutData) return;
    const L = layoutData;
    const pts = L.items.map((it, i) => {
      const p = pool[i];
      const top = projectWorld(p.curX, p.curY + p.curS * 0.66, p.curZ);
      const center = projectWorld(p.curX, p.curY, p.curZ);
      const base = projectWorld(p.curX, -0.7, p.curZ);
      return { ...it, top, center, base };
    });

    const parts = [];
    const introK = still ? 1 : easeOut(Math.min(1, introT / 0.85));

    // 每个元素向下的细虚线落点（呼应原海报底部的粉虚线基准钉）
    for (const p of pts) {
      parts.push(
        `<line x1="${p.center.x.toFixed(1)}" y1="${p.base.y.toFixed(1)}" x2="${p.center.x.toFixed(1)}" y2="${(p.base.y + 18).toFixed(1)}" stroke="${p.isDom ? PALETTE.pink : "rgba(240,108,146,0.45)"}" stroke-width="${p.isDom ? 1.8 : 1.2}" stroke-dasharray="3 3" opacity="${(0.85 * introK).toFixed(2)}"/>`
      );
    }

    if (L.isCrowd) {
      // 8–9 个：群组轮廓括号
      const left = pts[0].center.x - 24;
      const right = pts[pts.length - 1].center.x + 24;
      const topY = Math.min(...pts.map((p) => p.top.y)) - 22;
      parts.push(
        `<path d="M${left.toFixed(1)},${(topY + 14).toFixed(1)} L${left.toFixed(1)},${topY.toFixed(1)} L${right.toFixed(1)},${topY.toFixed(1)} L${right.toFixed(1)},${(topY + 14).toFixed(1)}" fill="none" stroke="${PALETTE.lavender}" stroke-width="1.6" stroke-dasharray="5 4" opacity="${introK.toFixed(2)}"/>`
      );
      parts.push(
        `<text x="${((left + right) / 2).toFixed(1)}" y="${(topY - 8).toFixed(1)}" text-anchor="middle" fill="${PALETTE.muted}" font-size="11.5" font-family="Space Grotesk, Noto Sans SC, sans-serif">超过 7 个：读成一整片群组轮廓</text>`
      );
    } else if (L.inEvenSeam && pts.length >= 2) {
      // 偶数平分：中心竖直死缝 + 左右配对括号（呼应海报的偶数平淡图解）
      const midX = (pts[pts.length / 2 - 1].center.x + pts[pts.length / 2].center.x) / 2;
      const topY = Math.min(...pts.map((p) => p.top.y)) - 26;
      const botY = Math.max(...pts.map((p) => p.base.y)) + 16;
      parts.push(
        `<line x1="${midX.toFixed(1)}" y1="${topY.toFixed(1)}" x2="${midX.toFixed(1)}" y2="${botY.toFixed(1)}" stroke="${PALETTE.lavender}" stroke-width="1.8" stroke-dasharray="5 5" opacity="${(0.9 * introK).toFixed(2)}"/>`
      );
      // 水平平直虚线（海报中偶数对比的平线）
      parts.push(
        `<line x1="${(pts[0].center.x - 16).toFixed(1)}" y1="${(topY + 8).toFixed(1)}" x2="${(pts[pts.length - 1].center.x + 16).toFixed(1)}" y2="${(topY + 8).toFixed(1)}" stroke="rgba(147,110,196,0.55)" stroke-width="1.3" stroke-dasharray="4 4"/>`
      );
      // 左右半区配对括号
      const half = pts.length / 2;
      const drawBracket = (a, b, label) => {
        const x1 = a.center.x - 14;
        const x2 = b.center.x + 14;
        const by = Math.max(a.base.y, b.base.y) + 26;
        parts.push(
          `<path d="M${x1.toFixed(1)},${(by - 7).toFixed(1)} L${x1.toFixed(1)},${by.toFixed(1)} L${x2.toFixed(1)},${by.toFixed(1)} L${x2.toFixed(1)},${(by - 7).toFixed(1)}" fill="none" stroke="${PALETTE.lavender}" stroke-width="1.5" opacity="${introK.toFixed(2)}"/>`,
          `<text x="${((x1 + x2) / 2).toFixed(1)}" y="${(by + 15).toFixed(1)}" text-anchor="middle" fill="${PALETTE.muted}" font-size="11" font-family="JetBrains Mono, Noto Sans SC, sans-serif">${label}</text>`
        );
      };
      drawBracket(pts[0], pts[half - 1], half === 1 ? "左 1" : `左 ${half} 对`);
      drawBracket(pts[half], pts[pts.length - 1], half === 1 ? "右 1" : `右 ${half} 对`);

      // 视线乒乓轨迹
      if (showPath) {
        const lP = pts[half - 1].center;
        const rP = pts[half].center;
        const py = topY + 2;
        parts.push(
          `<path d="M${lP.x.toFixed(1)},${py.toFixed(1)} Q${midX.toFixed(1)},${(py - 18).toFixed(1)} ${rP.x.toFixed(1)},${py.toFixed(1)}" fill="none" stroke="${PALETTE.pinkSoft}" stroke-width="1.8" opacity="0.85"/>`
        );
        const phase = still ? 0.5 : (Math.sin(t * 2.6) + 1) * 0.5;
        const dotX = lerp(lP.x, rP.x, phase);
        const dotY = py - Math.sin(phase * Math.PI) * 9;
        parts.push(`<circle cx="${dotX.toFixed(1)}" cy="${dotY.toFixed(1)}" r="4.5" fill="${PALETTE.pink}" stroke="#fff" stroke-width="1.5"/>`);
      }
    } else if (L.isUniform && pts.length >= 2) {
      // 等大平排：一条僵硬的直线
      const y = Math.min(...pts.map((p) => p.top.y)) - 18;
      parts.push(
        `<line x1="${pts[0].center.x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${pts[pts.length - 1].center.x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${PALETTE.muted}" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.7"/>`
      );
      if (showPath) {
        const phase = still ? 0.5 : (t * 0.35) % 1;
        const dotX = lerp(pts[0].center.x, pts[pts.length - 1].center.x, phase);
        parts.push(`<circle cx="${dotX.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${PALETTE.cream}"/>`);
      }
    } else if (L.hasDominant && pts.length >= 3) {
      // 奇数自然焦点（或强行偏心焦点）：经典的粉红节奏弧（直接呼应原海报主视觉！）
      const dom = pts[L.domIndex];
      const left = pts[0];
      const right = pts[pts.length - 1];
      const apexY = dom.top.y - 28;
      const startX = left.center.x;
      const startY = left.top.y - 8;
      const endX = right.center.x;
      const endY = right.top.y - 8;

      // 从最左经过主导峰顶再到最右的双段平滑弧线
      const arcD = `M${startX.toFixed(1)},${startY.toFixed(1)} Q${((startX + dom.center.x) / 2).toFixed(1)},${(apexY - 4).toFixed(1)} ${dom.center.x.toFixed(1)},${apexY.toFixed(1)} Q${((dom.center.x + endX) / 2).toFixed(1)},${(apexY - 4).toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`;
      parts.push(
        `<path d="${arcD}" fill="none" stroke="${PALETTE.pink}" stroke-width="1.8" stroke-dasharray="5 5" opacity="${(0.92 * introK).toFixed(2)}"/>`
      );
      // 主导元素垂直标杆 + 节点圆点
      parts.push(
        `<line x1="${dom.center.x.toFixed(1)}" y1="${apexY.toFixed(1)}" x2="${dom.center.x.toFixed(1)}" y2="${(dom.top.y - 4).toFixed(1)}" stroke="${PALETTE.pink}" stroke-width="1.6" stroke-dasharray="3 3" opacity="${introK.toFixed(2)}"/>`,
        `<circle cx="${dom.center.x.toFixed(1)}" cy="${apexY.toFixed(1)}" r="4.5" fill="${PALETTE.pink}"/>`,
        `<text x="${dom.center.x.toFixed(1)}" y="${(apexY - 11).toFixed(1)}" text-anchor="middle" fill="${PALETTE.pinkSoft}" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">主导焦点</text>`
      );

      // 视线路径动画：从主导点滑向两侧支持点再回到主导点
      if (showPath && L.scanOrder.length >= 2) {
        const orderPts = L.scanOrder.map((idx) => pts[idx]);
        const segs = orderPts.length - 1;
        const pos = still ? 0.0 : ((t * 0.42) % 1) * segs;
        const segIdx = Math.min(segs - 1, Math.floor(pos));
        const localT = pos - segIdx;
        const a = orderPts[segIdx];
        const b = orderPts[segIdx + 1];
        const cx = (a.center.x + b.center.x) / 2;
        const cy = Math.min(a.top.y, b.top.y) - 24;
        // 贝塞尔采样当前视线光点
        const u = 1 - localT;
        const dx = u * u * a.center.x + 2 * u * localT * cx + localT * localT * b.center.x;
        const dy = u * u * (a.top.y - 6) + 2 * u * localT * cy + localT * localT * (b.top.y - 6);
        parts.push(
          `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="5" fill="${PALETTE.cream}" stroke="${PALETTE.pink}" stroke-width="2" opacity="0.95"/>`
        );
      }
    } else if (pts.length === 1) {
      const dom = pts[0];
      parts.push(
        `<circle cx="${dom.center.x.toFixed(1)}" cy="${dom.center.y.toFixed(1)}" r="44" fill="none" stroke="${PALETTE.pink}" stroke-width="1.4" stroke-dasharray="4 4" opacity="0.7"/>`
      );
    }

    overlay.innerHTML = parts.join("");
  }

  function frame(t, dt, { still }) {
    if (!layoutData) return;
    if (still) introT = 10;
    else introT += dt;

    const k = still || dt === 0 ? 1 : 1 - Math.exp(-dt * 12);
    // 轻微视角随焦点偏转，增强 3D 立体纵深，不晕眩
    targetYaw = (layoutData.focusU - 0.5) * 0.28;
    camYaw += (targetYaw - camYaw) * k;
    const dist = camera.position.z;
    camera.position.x = Math.sin(camYaw) * dist * 0.35;
    camera.lookAt(0, 0.06, 0);

    const n = layoutData.items.length;
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      if (i >= n) {
        p.mesh.visible = false;
        p.shadow.visible = false;
        p.initialized = false;
        continue;
      }
      const it = layoutData.items[i];
      p.mesh.visible = true;
      p.shadow.visible = true;

      if (p.shape !== it.shape) {
        p.mesh.geometry = getGeo(it.shape);
        p.shape = it.shape;
      }
      p.mat.color.set(it.color);
      p.mat.emissive.set(it.isDom ? PALETTE.pink : "#000000");
      p.mat.emissiveIntensity = it.isDom ? 0.14 : 0;

      // 开场动画从 75% 体量柔和浮起，保证第 0.9 秒和任意时刻都好看饱满
      const introProgress = still ? 1 : easeOut(Math.min(1, (introT - i * 0.06) / 0.65));
      const introScale = 0.72 + 0.28 * introProgress;
      const breath = still ? 0 : Math.sin(t * 1.6 + i * 1.1) * (it.isDom ? 0.025 : 0.012);

      const tx = toWorldX(it.u);
      const ty = toWorldY(it.v, it.scale) + breath;
      const tz = it.depth;
      const ts = it.scale * introScale;

      if (!p.initialized || still) {
        p.curX = tx;
        p.curY = ty;
        p.curZ = tz;
        p.curS = ts;
        p.initialized = true;
      } else {
        p.curX = lerp(p.curX, tx, k);
        p.curY = lerp(p.curY, ty, k);
        p.curZ = lerp(p.curZ, tz, k);
        p.curS = lerp(p.curS, ts, k);
      }

      p.mesh.position.set(p.curX, p.curY, p.curZ);
      p.mesh.scale.setScalar(p.curS);
      if (it.shape === "cube" || it.shape === "octa" || it.shape === "torus") {
        p.mesh.rotation.y = still ? 0.35 + i * 0.2 : 0.35 + i * 0.2 + Math.sin(t * 0.6 + i) * 0.16;
        p.mesh.rotation.x = it.shape === "torus" ? 0.35 : 0.12;
      } else {
        p.mesh.rotation.set(0, 0, 0);
      }

      p.shadow.position.set(p.curX, -0.7, p.curZ);
      p.shadow.scale.set(p.curS * 0.95, p.curS * 0.6, 1);
    }

    renderer.render(scene, camera);
    drawOverlay(t, still);
    if (onFrame) onFrame();
  }

  const runner = loop(stage, frame);

  return {
    kind: "3d",
    set(nextLayout, opts = {}) {
      layoutData = nextLayout;
      if (typeof opts.showPath === "boolean") showPath = opts.showPath;
      runner.draw();
    },
    projectFocus(u, v) {
      const p = projectWorld(toWorldX(u), toWorldY(v, 0.95), 0.24);
      return p;
    },
    hitTest(clientX, clientY) {
      if (!layoutData) return -1;
      const r = stage.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      let best = -1;
      let minD = 46;
      for (let i = 0; i < layoutData.items.length; i++) {
        const p = pool[i];
        const pt = projectWorld(p.curX, p.curY, p.curZ);
        const d = Math.hypot(pt.x - x, pt.y - y);
        if (d < minD) {
          minD = d;
          best = i;
        }
      }
      return best;
    },
    stageWidth: () => width,
  };
}

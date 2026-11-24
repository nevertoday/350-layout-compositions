// 低多边形风景：太阳、两座山、远丘、水面波纹、三只鸟。
// 所有能拖的东西都按画框坐标 (u, v) 摆：每帧从相机发一条射线，把它放到射线上固定的深度。
import {
  BufferGeometry,
  Color,
  CircleGeometry,
  ConeGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { pixelRatio } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";

const FOV = 40;
const EYE = 1;
const TAN = Math.tan((FOV / 2) * (Math.PI / 180));

// 有点歪的圆锥：同一位置的顶点抖动相同，接缝不会裂开
function mountainGeometry(seed) {
  const g = new ConeGeometry(1, 1, 7, 3, true);
  g.translate(0, 0.5, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y < 0.01 || y > 0.99) continue;
    const x = p.getX(i), z = p.getZ(i);
    const h = Math.sin(x * 12.9898 + z * 78.233 + y * 37.719 + seed) * 43758.5453;
    const j = (h - Math.floor(h) - 0.5) * 0.22;
    p.setXYZ(i, x * (1 + j), y + j * 0.25, z * (1 + j));
  }
  g.computeVertexNormals();
  return g;
}

// 海鸥的剪影：一只翅膀分两节（上臂、手），中间折一下，再配一小块身子。
// 只有一节的平板翅膀扇到某个角度会和视线平行、缩成一道横线；两节折着扇，任何时刻都是 V、M 或 ⌒。
const tri = (...xy) => {
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(xy.flatMap(([x, y]) => [x, y, 0]), 3));
  return g;
};
const ARM = 0.3;
const armGeo = (d) => tri([0, 0.035], [0, -0.06], [d * ARM, 0.015], [d * ARM, 0.015], [0, -0.06], [d * ARM, -0.02]);
const handGeo = (d) => tri([0, 0.015], [0, -0.02], [d * 0.34, -0.035]);
const bodyGeo = tri([0, 0.035], [0.03, -0.01], [0, -0.065], [0, -0.065], [-0.03, -0.01], [0, 0.035]);

function bird(mat) {
  const b = new Group();
  b.add(new Mesh(bodyGeo, mat));
  const wings = [-1, 1].map((d) => {
    const shoulder = new Group();
    const elbow = new Group();
    elbow.position.x = d * ARM;
    elbow.add(new Mesh(handGeo(d), mat));
    shoulder.add(new Mesh(armGeo(d), mat), elbow);
    b.add(shoulder);
    return { d, shoulder, elbow };
  });
  return { b, wings };
}

export function createScene3D(host) {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(pixelRatio());
  renderer.setClearColor(PALETTE.sky);
  host.append(renderer.domElement);

  const scene = new Scene();
  scene.background = new Color(PALETTE.sky);
  const camera = new PerspectiveCamera(FOV, 1.5, 0.1, 3000);
  camera.position.set(0, EYE, 0);

  scene.add(new HemisphereLight("#fff8ec", "#d8c8ad", 1.6));
  const key = new DirectionalLight("#ffffff", 1.5);
  key.position.set(-4, 6, 3);
  scene.add(key);

  const sea = new Mesh(new PlaneGeometry(6000, 6000), new MeshBasicMaterial({ color: PALETTE.sea }));
  sea.rotation.x = -Math.PI / 2;
  scene.add(sea);

  const sun = new Mesh(new CircleGeometry(1, 64), new MeshBasicMaterial({ color: PALETTE.red }));
  scene.add(sun);

  const far = new Mesh(mountainGeometry(3), new MeshLambertMaterial({ color: PALETTE.haze, flatShading: true }));
  const sand = new Mesh(mountainGeometry(7), new MeshLambertMaterial({ color: PALETTE.sand, flatShading: true }));
  const ink = new Mesh(mountainGeometry(1), new MeshLambertMaterial({ color: PALETTE.ink, flatShading: true }));
  scene.add(far, sand, ink);

  // 水面上的红色细线，像海报底部那几道
  const ripplePts = [];
  for (let i = 0; i < 30; i++) {
    const z = -3 - Math.pow(i / 29, 1.5) * 50;
    const x = Math.sin(i * 7.31) * (2 + -z * 0.42);
    const len = 0.4 + ((i * 5) % 7) * 0.22 + -z * 0.05;
    ripplePts.push(x - len, 0.01, z, x + len, 0.01, z);
  }
  const rippleGeo = new BufferGeometry();
  rippleGeo.setAttribute("position", new Float32BufferAttribute(ripplePts, 3));
  const ripples = new LineSegments(rippleGeo, new LineBasicMaterial({ color: PALETTE.red, transparent: true, opacity: 0.7 }));
  scene.add(ripples);
  const horizonGeo = new BufferGeometry();
  horizonGeo.setAttribute("position", new Float32BufferAttribute([-6000, 0.05, -2900, 6000, 0.05, -2900], 3));
  scene.add(new LineSegments(horizonGeo, new LineBasicMaterial({ color: PALETTE.ink, transparent: true, opacity: 0.45 })));

  const birds = new Group();
  const birdMat = new MeshBasicMaterial({ color: PALETTE.ink, side: DoubleSide });
  const flock = [[0, 0], [1.05, -0.42], [0.38, -0.95]].map(([x, y], i) => {
    const { b, wings } = bird(birdMat);
    b.position.set(x - 0.5, y + 0.45, 0);
    birds.add(b);
    return { wings, phase: i * 1.7 };
  });
  scene.add(birds);

  const ray = new Vector3();
  const along = (u, v) => {
    ray.set(u * 2 - 1, 1 - v * 2, 0.5).unproject(camera).sub(camera.position).normalize();
    return ray;
  };
  const atDistance = (u, v, d, out) => out.copy(camera.position).addScaledVector(along(u, v), d);
  const onPlaneZ = (u, v, z, out) => {
    const dir = along(u, v);
    return out.copy(camera.position).addScaledVector(dir, (z - camera.position.z) / dir.z);
  };
  const tmp = new Vector3();

  // width 是山脚半宽占画框宽度的比例，竖屏横屏都一样好看
  function placeMountain(mesh, u, v, z, width) {
    onPlaneZ(u, v, z, tmp);
    const r = width * -z * TAN * 2 * camera.aspect;
    mesh.position.set(tmp.x, 0, z);
    mesh.scale.set(r, Math.max(tmp.y, 0.6), r * 0.5);
  }

  return {
    el: renderer.domElement,
    resize(w, h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    render(s, t) {
      // 把地平线放到画框的 s.horizon 处：相机俯仰角 = atan(地平线的 NDC 高度 × tan(半视角))
      camera.rotation.set(-Math.atan((1 - 2 * s.horizon) * TAN), 0, 0);
      camera.updateMatrixWorld();

      const sunD = 120;
      atDistance(s.sun.u, s.sun.v, sunD, sun.position);
      sun.quaternion.copy(camera.quaternion);
      sun.scale.setScalar(sunD * TAN * 2 * 0.085);

      placeMountain(far, 0.92, s.horizon - 0.09, -220, 0.26);
      placeMountain(sand, 0.6, s.horizon - 0.2, -110, 0.24);
      placeMountain(ink, s.peak.u, s.peak.v, -60, 0.24);

      const birdD = 18;
      atDistance(s.birds.u, s.birds.v, birdD, birds.position);
      birds.quaternion.copy(camera.quaternion);
      birds.scale.setScalar(birdD * TAN * 2 * 0.06);
      // 上臂在 0°–34° 之间扇；臂越平，手往下垂得越多（最多 40°）：任何时刻至少有一节折着 18° 以上
      for (const { wings, phase } of flock) {
        const k = Math.sin(t * 7 + phase);
        const arm = 0.3 + 0.3 * k;
        const hand = -0.35 + 0.35 * k;
        for (const w of wings) {
          w.shoulder.rotation.z = w.d * arm;
          w.elbow.rotation.z = w.d * hand;
        }
      }
      birds.position.addScaledVector(camera.up, Math.sin(t * 1.3) * 0.08);

      ripples.position.x = Math.sin(t * 0.35) * 0.5;
      renderer.render(scene, camera);
    },
  };
}

// 开场的三维头：低多边形、平面着色，海报配色（黑头、奶白眼睛、浅黄耳廓、橄榄绿肩膀）。
// 用正交相机，画框里的比例坐标直接对应世界坐标，测量线和 SVG 版完全对得上。
// 头的局部坐标：半径约 1，眼睛在 y = 0，脸朝 +z。
import {
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  OrthographicCamera,
  Scene,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  WebGLRenderer,
} from "three";
import { pixelRatio } from "../../lib/stage.js";
import { C } from "./head2d.js";

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// 同一位置的顶点抖动相同，接缝不会裂开
const jitter = (x, y, z, seed) => {
  const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
  return h - Math.floor(h) - 0.5;
};

function cranium() {
  const g = new IcosahedronGeometry(1, 3);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const j = jitter(x, y, z, 1) * 0.035;
    x *= 0.86;
    y *= 1.06;
    if (z < 0) z *= 1.08 - 0.25 * smooth(-0.2, -0.9, y); // 后脑勺鼓、后颈收
    // 下颌：越往下越窄，前面往前伸成下巴
    const jaw = smooth(-0.15, -1.0, y);
    x *= 1 - 0.32 * jaw;
    if (z > 0) z += 0.16 * jaw * z;
    // 脸面压平一点，额头稍往前
    if (z > 0.62) z = 0.62 + (z - 0.62) * 0.55;
    if (z > 0.4 && y > 0.12 && y < 0.42) z += 0.05 * (1 - Math.abs(x) * 1.6);
    p.setXYZ(i, x * (1 + j), y + j * 0.4, z * (1 + j));
  }
  g.computeVertexNormals();
  return g;
}

function hair() {
  const g = new IcosahedronGeometry(1, 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    // 发际线：前额高、两鬓低、后面一直盖到后颈
    const line = 0.36 - 0.55 * smooth(0.2, -0.9, z) - 0.2 * Math.abs(x) * smooth(0.6, 0, z);
    const inside = y < line;
    x *= 0.92;
    y = y * 1.1 + 0.04;
    z *= 1.04;
    if (z < 0) z *= 1.08 - 0.2 * smooth(-0.2, -0.9, y);
    // 头顶前面那一撮往上、往前翘
    const quiff = smooth(0.35, 0.95, y) * smooth(-0.1, 0.7, z);
    y += quiff * 0.2;
    z += quiff * 0.22;
    const k = inside ? 0.78 : 1 + jitter(x, y, z, 5) * 0.06;
    p.setXYZ(i, x * k, y * k, z * k);
  }
  g.computeVertexNormals();
  return g;
}

function nose() {
  // 三棱锥：鼻梁、鼻尖、两侧鼻翼、鼻底
  const top = [0, 0.18, 0.66], tip = [0, -0.16, 1.02], l = [-0.14, -0.24, 0.74], r = [0.14, -0.24, 0.74], b = [0, -0.26, 0.66];
  const tris = [top, l, tip, top, tip, r, l, b, tip, tip, b, r];
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(tris.flat(), 3));
  g.computeVertexNormals();
  return g;
}

export function createHead3D(host) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(pixelRatio(innerWidth < 700 ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  host.prepend(renderer.domElement);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, -20, 20);
  camera.position.set(0, 0, 10);

  scene.add(new HemisphereLight("#fff6e0", "#59603c", 2.2));
  const key = new DirectionalLight("#fff3d6", 2.4);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const rim = new DirectionalLight("#dfe3a8", 1.6);
  rim.position.set(4, 1, -2);
  scene.add(rim);

  const skin = new MeshLambertMaterial({ color: new Color("#23221f"), flatShading: true });
  const hairMat = new MeshLambertMaterial({ color: new Color("#141413"), flatShading: true });
  const cloth = new MeshLambertMaterial({ color: new Color(C.olive), flatShading: true });
  const cream = new MeshBasicMaterial({ color: new Color(C.cream) });
  const earLine = new MeshBasicMaterial({ color: new Color(C.ear) });
  const pupilMat = new MeshBasicMaterial({ color: new Color(C.ink) });

  // 人：身体 → 脖子 → 头，头只管转，身体跟一点
  const person = new Group();
  const body = new Group();
  // 肩膀到胸口：一条侧面轮廓绕竖轴转一圈，再压扁成前后薄
  const torso = new Mesh(new LatheGeometry([[0, 0.02], [0.55, 0], [1.25, -0.16], [1.85, -0.5], [2.2, -1.0], [2.4, -1.8], [2.75, -3.2], [3.3, -7]].map(([x, y]) => new Vector2(x, y)), 10), cloth);
  torso.scale.set(1, 1, 0.55);
  torso.position.y = -1.36;
  const collar = new Mesh(new CylinderGeometry(0.56, 0.62, 0.2, 9), cloth);
  collar.position.set(0, -1.42, -0.05);
  body.add(torso, collar);
  const neck = new Mesh(new CylinderGeometry(0.4, 0.48, 1.1, 8), skin);
  neck.position.set(0, -0.95, -0.12);
  const head = new Group();
  head.add(new Mesh(cranium(), skin), new Mesh(hair(), hairMat), new Mesh(nose(), skin));

  const eyes = [-1, 1].map((e) => {
    const socket = new Group();
    socket.position.set(e * 0.33, 0.02, 0.76);
    socket.rotation.y = e * 0.42;
    const white = new Mesh(new SphereGeometry(1, 10, 6), cream);
    white.scale.set(0.16, 0.085, 0.07);
    const ball = new Group();
    ball.position.z = -0.1;
    const pupil = new Mesh(new SphereGeometry(1, 8, 5), pupilMat);
    pupil.scale.set(0.058, 0.058, 0.05);
    pupil.position.z = 0.15;
    ball.add(pupil);
    socket.add(white, ball);
    head.add(socket);
    return { e, ball, socket };
  });
  for (const e of [-1, 1]) {
    const ear = new Mesh(new SphereGeometry(1, 7, 5), skin);
    ear.scale.set(0.09, 0.22, 0.15);
    ear.position.set(e * 0.84, 0.02, -0.06);
    const arc = new Mesh(new TorusGeometry(0.13, 0.022, 4, 14, Math.PI * 1.15), earLine);
    arc.position.set(e * 0.93, 0.02, -0.04);
    arc.rotation.set(0, (e * Math.PI) / 2, Math.PI / 2 + 0.07);
    head.add(ear, arc);
  }
  person.add(body, neck, head);
  scene.add(person);

  let aspect = 1.5;
  return {
    kind: "3d",
    el: renderer.domElement,
    resize(w, h) {
      renderer.setSize(w, h, false);
      aspect = w / h;
      // 世界坐标：画框高 1、宽 aspect，左上角是 (0, 0)，y 朝上为负
      Object.assign(camera, { left: 0, right: aspect, top: 0, bottom: -1 });
      camera.updateProjectionMatrix();
    },
    // u, v：头中心；R：头半径（画框高度的比例）；yaw、pitch：头的转向；eye：眼珠多转的角度
    render({ u, v, R, yaw, pitch, eye = 0, eyeV = 0 }) {
      person.position.set(u * aspect, -v, 0);
      person.scale.setScalar(R);
      head.rotation.set(-pitch, yaw, 0, "YXZ");
      neck.rotation.set(-pitch * 0.3, yaw * 0.5, 0, "YXZ");
      body.rotation.y = yaw * 0.22;
      // 转得太侧时，远的那只眼睛该被鼻梁和脸挡住（和 SVG 版同一条规则）
      for (const { e, ball, socket } of eyes) {
        ball.rotation.set(-eyeV, eye, 0);
        socket.visible = Math.cos(yaw + e * 0.56) > 0.12;
      }
      renderer.render(scene, camera);
    },
  };
}

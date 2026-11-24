// Three.js 一点透视 3D 场景：建筑长廊（corridor）与旷野公路（road）。
// 核心光学原理：相机沿 -Z 平视并用 setViewOffset 移动光学中心（建筑移轴原理），
// 保证所有平行于 -Z 的真实 3D 线条精确汇聚到屏幕上的消失点 (vp.u, vp.v)，同时所有竖直线保持笔直。
// 低 draw call、无昂贵后处理，在慢手机与软件渲染下同样流畅。

import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Fog,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from "three";
import { pixelRatio } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";

const FOV = 52;
const DEPTH = 115;

function makeLines(pts, color, opacity = 1) {
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pts, 3));
  return new LineSegments(
    g,
    new LineBasicMaterial({ color, transparent: opacity < 1, opacity })
  );
}

// 极简人物背影剪影（绝不画五官）：头+颈肩+风衣下摆，在任何远近下都干净利落
function makeSilhouette(color) {
  const g = new Group();
  const mat = new MeshBasicMaterial({ color, side: DoubleSide, fog: false });
  const head = new Mesh(new CircleGeometry(0.18, 20), mat);
  head.position.set(0, 1.54, 0);
  const body = new Mesh(new PlaneGeometry(0.5, 1.12), mat);
  body.position.set(0, 0.78, 0);
  // 让肩部略收、下摆略宽
  const p = body.geometry.attributes.position;
  p.setX(0, -0.2); p.setX(1, 0.2);
  p.setX(2, -0.28); p.setX(3, 0.28);
  const legL = new Mesh(new PlaneGeometry(0.13, 0.44), mat);
  legL.position.set(-0.1, 0.22, 0);
  const legR = new Mesh(new PlaneGeometry(0.13, 0.44), mat);
  legR.position.set(0.1, 0.22, 0);
  g.add(head, body, legL, legR);
  return g;
}

// ---------- 场景 A：建筑长廊（立柱、顶梁、地面双色引导带、侧栏杆、远端门框与人影） ----------
function buildCorridor() {
  const root = new Group();
  const W = 7.4; // 走廊半宽 * 2
  const H = 5.4; // 走廊高度

  // 地板与天花底面
  const floor = new Mesh(
    new PlaneGeometry(W, DEPTH),
    new MeshBasicMaterial({ color: "#0b1a10" })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -DEPTH / 2);
  root.add(floor);

  // 海报同款地面双色引导带（左米白宽带 + 右朱橙宽带，真实 3D 透视自然由宽变窄）
  const bandCream = new Mesh(
    new PlaneGeometry(1.38, DEPTH),
    new MeshBasicMaterial({ color: PALETTE.cream })
  );
  bandCream.rotation.x = -Math.PI / 2;
  bandCream.position.set(-1.18, 0.015, -DEPTH / 2);
  root.add(bandCream);

  const bandOrange = new Mesh(
    new PlaneGeometry(1.12, DEPTH),
    new MeshBasicMaterial({ color: PALETTE.orange })
  );
  bandOrange.rotation.x = -Math.PI / 2;
  bandOrange.position.set(0.62, 0.018, -DEPTH / 2);
  root.add(bandOrange);

  // 走廊细线条（地面边线、栏杆双横线、天花纵线、横缝）合并成极少 draw calls
  const creamPts = [];
  const dimPts = [];
  const orangePts = [];

  // 纵向主透视线（全平行于 Z 轴，必然精确汇入消失点）
  const z0 = -1, z1 = -DEPTH;
  creamPts.push(-W / 2, 0.03, z0, -W / 2, 0.03, z1);
  creamPts.push(W / 2, 0.03, z0, W / 2, 0.03, z1);
  creamPts.push(-W / 2, H, z0, -W / 2, H, z1);
  creamPts.push(W / 2, H, z0, W / 2, H, z1);
  // 栏杆扶手（左右各两道）
  for (const s of [-1, 1]) {
    const rx = s * (W / 2 - 0.34);
    orangePts.push(rx, 1.08, z0, rx, 1.08, z1);
    dimPts.push(rx, 0.56, z0, rx, 0.56, z1);
    // 顶部细导轨
    dimPts.push(s * 1.45, H - 0.05, z0, s * 1.45, H - 0.05, z1);
  }
  // 地面右侧细白引导线（呼应海报橙带右边的细白线）
  creamPts.push(1.75, 0.025, z0, 1.75, 0.025, z1);

  // 节奏立柱 + 顶梁 + 地面横缝（间隔 5.5 米，共 18 跨）
  const colGeo = new BoxGeometry(0.32, H, 0.32);
  const beamGeo = new BoxGeometry(W + 0.32, 0.28, 0.32);
  const colMat = new MeshBasicMaterial({ color: PALETTE.pine });
  const beamMat = new MeshBasicMaterial({ color: "#15301f" });

  for (let i = 1; i <= 18; i++) {
    const z = -i * 5.8;
    const cL = new Mesh(colGeo, colMat);
    cL.position.set(-W / 2, H / 2, z);
    const cR = new Mesh(colGeo, colMat);
    cR.position.set(W / 2, H / 2, z);
    const bm = new Mesh(beamGeo, beamMat);
    bm.position.set(0, H + 0.12, z);
    root.add(cL, cR, bm);

    // 立柱内侧高光边线 + 栏杆竖撑
    dimPts.push(-W / 2 + 0.17, 0, z, -W / 2 + 0.17, H, z);
    dimPts.push(W / 2 - 0.17, 0, z, W / 2 - 0.17, H, z);
    dimPts.push(-W / 2, 0.02, z, W / 2, 0.02, z);
    for (const s of [-1, 1]) {
      const rx = s * (W / 2 - 0.34);
      dimPts.push(rx, 0, z, rx, 1.08, z);
    }
  }

  root.add(
    makeLines(creamPts, PALETTE.cream, 0.72),
    makeLines(orangePts, PALETTE.orangeHi, 0.9),
    makeLines(dimPts, PALETTE.cream, 0.22)
  );

  // 远端发光焦点圆盘 + 门框 + 剪影主体（不受雾效变暗，保持原海报朱橙亮焦点）
  const focalGroup = new Group();
  const disc = new Mesh(
    new CircleGeometry(4.6, 48),
    new MeshBasicMaterial({ color: PALETTE.orange, fog: false })
  );
  disc.position.set(0, 2.2, -96);
  const pinhole = new Mesh(
    new CircleGeometry(0.42, 24),
    new MeshBasicMaterial({ color: PALETTE.pinhole, fog: false })
  );
  pinhole.position.set(0, 2.2, -95.4);
  const figure = makeSilhouette(PALETTE.pinhole);
  figure.scale.setScalar(2.1);
  figure.position.set(0, 0, -68);
  focalGroup.add(disc, pinhole, figure);
  root.add(focalGroup);

  return { root, focalGroup };
}

// ---------- 场景 B：旷野公路与铁轨（双色路面带、路桩、地平线、架空电线、远端落日焦点） ----------
function buildRoad() {
  const root = new Group();

  // 广袤地面
  const ground = new Mesh(
    new PlaneGeometry(260, DEPTH + 20),
    new MeshBasicMaterial({ color: "#0a1910" })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -DEPTH / 2);
  root.add(ground);

  // 海报同款主路面：深底之上，米白主道 + 朱橙快车道 + 细引导边线
  const leftLane = new Mesh(
    new PlaneGeometry(1.75, DEPTH),
    new MeshBasicMaterial({ color: PALETTE.cream })
  );
  leftLane.rotation.x = -Math.PI / 2;
  leftLane.position.set(-1.32, 0.015, -DEPTH / 2);
  root.add(leftLane);

  const rightLane = new Mesh(
    new PlaneGeometry(1.32, DEPTH),
    new MeshBasicMaterial({ color: PALETTE.orange })
  );
  rightLane.rotation.x = -Math.PI / 2;
  rightLane.position.set(0.86, 0.018, -DEPTH / 2);
  root.add(rightLane);

  const creamPts = [];
  const orangePts = [];
  const dimPts = [];
  const z0 = -1, z1 = -DEPTH;

  // 路肩与铁轨平行线
  creamPts.push(-2.85, 0.03, z0, -2.85, 0.03, z1);
  creamPts.push(2.45, 0.03, z0, 2.45, 0.03, z1);
  creamPts.push(3.25, 0.03, z0, 3.25, 0.03, z1);
  // 路中虚线（用分段线段）
  for (let z = -2; z > -DEPTH; z -= 4.4) {
    orangePts.push(-0.08, 0.035, z, -0.08, 0.035, z - 2.1);
  }
  // 两侧架空电线（高空向消失点汇聚）
  for (const s of [-1, 1]) {
    const px = s * 4.9;
    dimPts.push(px, 4.4, z0, px, 4.4, z1);
    orangePts.push(px, 3.85, z0, px, 3.85, z1);
  }
  // 地平线
  dimPts.push(-130, 0.06, -DEPTH + 1, 130, 0.06, -DEPTH + 1);

  // 路侧电杆 / 里程标桩（由近及远收小）
  const postGeo = new BoxGeometry(0.14, 4.55, 0.14);
  const armGeo = new BoxGeometry(0.9, 0.1, 0.1);
  const postMat = new MeshBasicMaterial({ color: PALETTE.pineLight });
  const markerGeo = new BoxGeometry(0.16, 0.72, 0.16);
  const markerMat = new MeshBasicMaterial({ color: PALETTE.cream });

  for (let i = 1; i <= 15; i++) {
    const z = -i * 7.1;
    for (const s of [-1, 1]) {
      const post = new Mesh(postGeo, postMat);
      post.position.set(s * 4.9, 2.275, z);
      const arm = new Mesh(armGeo, postMat);
      arm.position.set(s * 4.65, 4.15, z);
      root.add(post, arm);

      const mk = new Mesh(markerGeo, markerMat);
      mk.position.set(s * 3.1, 0.36, z + 3.2);
      root.add(mk);
    }
    // 枕木感横线
    dimPts.push(-2.85, 0.02, z, 2.45, 0.02, z);
  }

  root.add(
    makeLines(creamPts, PALETTE.cream, 0.78),
    makeLines(orangePts, PALETTE.orangeHi, 0.85),
    makeLines(dimPts, PALETTE.cream, 0.28)
  );

  // 远端海报风朱橙太阳焦点 + 十字准星刻度 + 剪影旅人（不受雾效变暗）
  const focalGroup = new Group();
  const sun = new Mesh(
    new CircleGeometry(5.2, 48),
    new MeshBasicMaterial({ color: PALETTE.orange, fog: false })
  );
  sun.position.set(0, 2.3, -98);
  const pinhole = new Mesh(
    new CircleGeometry(0.46, 24),
    new MeshBasicMaterial({ color: PALETTE.pinhole, fog: false })
  );
  pinhole.position.set(0, 2.3, -97.4);
  const traveler = makeSilhouette(PALETTE.pinhole);
  traveler.scale.setScalar(2.05);
  traveler.position.set(-0.15, 0, -64);
  focalGroup.add(sun, pinhole, traveler);
  root.add(focalGroup);

  return { root, focalGroup };
}

// ---------- 沿透视线向消失点滑动的视线光点（视觉路径演示） ----------
function buildFlowBeads() {
  const group = new Group();
  const geo = new BoxGeometry(0.11, 0.06, 1.5);
  const matCream = new MeshBasicMaterial({ color: PALETTE.creamBright });
  const matOrange = new MeshBasicMaterial({ color: PALETTE.orangeHi });
  // 4 条轨道上的流动光节
  const tracks = [
    { x: -1.18, y: 0.05, mat: matOrange },
    { x: 0.62, y: 0.05, mat: matCream },
    { x: -3.2, y: 1.08, mat: matOrange },
    { x: 3.2, y: 1.08, mat: matOrange },
  ];
  const beads = [];
  for (let ti = 0; ti < tracks.length; ti++) {
    const tr = tracks[ti];
    for (let j = 0; j < 3; j++) {
      const m = new Mesh(geo, tr.mat);
      group.add(m);
      beads.push({ mesh: m, track: tr, phase: (j / 3 + ti * 0.14) % 1 });
    }
  }
  return { group, beads };
}

export function createScene3D(host) {
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  const isSmall = window.innerWidth < 640;
  renderer.setPixelRatio(pixelRatio(isSmall ? 1.5 : 2));
  renderer.setClearColor(PALETTE.bg);
  host.append(renderer.domElement);

  const scene = new Scene();
  scene.background = new Color(PALETTE.bg);
  scene.fog = new Fog(PALETTE.bg, 52, 138);

  const camera = new PerspectiveCamera(FOV, 1.5, 0.2, 200);
  camera.position.set(0, 2.2, 0);

  const corridor = buildCorridor();
  const road = buildRoad();
  road.root.visible = false;
  const flow = buildFlowBeads();

  scene.add(corridor.root, road.root, flow.group);

  let W = 600;
  let H = 400;

  return {
    el: renderer.domElement,
    resize(w, h) {
      W = Math.max(1, w);
      H = Math.max(1, h);
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
    },
    render(s, t) {
      const isCorridor = s.scene === "corridor";
      corridor.root.visible = isCorridor;
      road.root.visible = !isCorridor;

      // 1. 根据消失点位置做真实的 3D 机位微移（左右站位 + 高低机位）
      //    同时保持相机光轴严格沿 -Z，再用 setViewOffset 让真实 3D 消失点精确落在屏幕 (u, v)！
      const camX = (0.5 - s.vp.u) * (isCorridor ? 2.1 : 3.2);
      const camY = 0.72 + (1 - s.vp.v) * 2.75;
      camera.position.set(camX, camY, 0);
      camera.rotation.set(0, 0, 0);

      // 移轴投影：把 -Z 消失点精确钉到画框坐标 (s.vp.u, s.vp.v)
      const ox = (0.5 - s.vp.u) * W;
      const oy = (0.5 - s.vp.v) * H;
      camera.setViewOffset(W, H, ox, oy, W, H);
      camera.updateProjectionMatrix();

      // 2. 远端主体位置：对齐时落在消失点线上；错位时故意偏到另一侧，展示线与主体打架
      const active = isCorridor ? corridor : road;
      const offsetShift = s.focal === "offset" ? (s.vp.u > 0.5 ? -18.5 : 18.5) : 0;
      active.focalGroup.position.x = offsetShift;
      // 远端圆盘和人物跟相机高度微调，使圆心恰好对准消失点高度
      const discY = Math.max(1.8, camY);
      active.focalGroup.children[0].position.y = discY;
      active.focalGroup.children[1].position.y = discY;

      // 3. 视线沿线流动的光节
      flow.group.visible = s.flow;
      if (s.flow) {
        const speed = 0.22;
        for (const b of flow.beads) {
          const p = (b.phase + t * speed) % 1;
          const z = -2.2 - Math.pow(p, 1.35) * 86;
          // 走廊和公路调整两侧轨距
          const sideMul = isCorridor ? 1 : 0.92;
          b.mesh.position.set(b.track.x * sideMul, b.track.y, z);
          const sc = 1 - p * 0.65;
          b.mesh.scale.set(sc, sc, 0.7 + (1 - p) * 1.4);
        }
      }

      renderer.render(scene, camera);
    },
  };
}

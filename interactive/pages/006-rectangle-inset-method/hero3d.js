// 开场的三维版：每一圈是一块斜角拼成的框，往里一层退后一截。
// 每圈按退后的距离放大，正面看过去和 SVG 版一模一样；侧过来，才看得出它们是一层层折进去的。
import * as THREE from "three";
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { ASPECT, PALETTE, RINGS, corners, quads, shade } from "./model.js";
import { PEONY_SIZE, onPeony } from "./peony.js";

const C0 = 5; // 正面机位到外框的距离；几何按它放大，正面投影才和 2D 完全重合
const STEP = 0.2; // 每一圈往里退多深（外框高 = 2）
const FW = 2 * ASPECT;
const FH = 2;
const MARGIN = 1.13;
const REST = { yaw: 0.17, pitch: 0.09 };
const FOV_WIDE = 78;

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const lerp = (a, b, t) => a + (b - a) * t;

export function createHero3D(stage, { onFrame, onView } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(pixelRatio(matchMedia("(pointer: coarse)").matches ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.blush);
  const camera = new THREE.PerspectiveCamera(30, ASPECT, 0.03, 60);

  const geo = new THREE.BufferGeometry();
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  scene.add(mesh);

  const tex = new THREE.Texture();
  tex.colorSpace = THREE.SRGBColorSpace;
  const flower = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex }));
  flower.visible = false;
  scene.add(flower);

  let f = null; // 当前的 frames() 结果
  let introT = reducedMotion.matches ? 99 : 0;
  const view = { yaw: reducedMotion.matches ? REST.yaw : 0.42, pitch: REST.pitch, userYaw: 0, hoverYaw: 0, hoverPitch: 0, front: false };
  let fly = null; // { t, fov }
  let dirty = true; // 要重画
  let shapeDirty = true; // 几何也要重算（层数、宽度、开场折入）；只转机位时不用
  const D = []; // 每一层平面的深度（正数，往里）
  onPeony((c) => {
    tex.image = c;
    tex.needsUpdate = true;
    flower.visible = true;
    dirty = true;
  });

  const scaleAt = (d) => (C0 + d) / C0;
  const world = (u, v, d) => {
    const s = scaleAt(d);
    return [(u - 0.5) * FW * s, (0.5 - v) * FH * s, -d];
  };

  function depths(t) {
    const n = f.rects.length - 1;
    D.length = 0;
    let acc = 0;
    D.push(0);
    for (let k = 0; k < n; k++) {
      acc += STEP * ease((t - k * 0.22) / 0.7); // 开场时一层接一层往里折
      D.push(acc);
    }
  }

  function rebuild() {
    const pos = [];
    const col = [];
    const c = new THREE.Color();
    const quad = (a, b, cc, d, hex) => {
      c.set(hex);
      for (const p of [a, b, cc, a, cc, d]) {
        pos.push(...p);
        col.push(c.r, c.g, c.b);
      }
    };
    const n = f.rects.length - 1;
    // 每圈正面的四块梯形
    for (const q of quads(f.rects)) {
      const d = D[q.ring];
      const [a, b, cc, dd] = q.pts.map(([u, v]) => world(u, v, d));
      quad(a, b, cc, dd, q.color);
    }
    // 每个开口里面的四面内壁：从这一圈的平面退到下一圈的平面
    const WALL = [-0.3, 0.06, 0.12, -0.16]; // 上壁朝下最暗，下壁朝上最亮
    for (let i = 0; i < n; i++) {
      const r = corners(f.rects[i + 1]);
      const base = RINGS[i % RINGS.length];
      for (let s = 0; s < 4; s++) {
        const p = r[s];
        const q = r[(s + 1) % 4];
        quad(world(p[0], p[1], D[i]), world(q[0], q[1], D[i]), world(q[0], q[1], D[i + 1]), world(p[0], p[1], D[i + 1]), shade(base, WALL[s]));
      }
    }
    // 外框的厚度：侧过来时看得到的外侧板
    const o = corners(f.rects[0]);
    const back = D[n] + 0.12;
    for (let s = 0; s < 4; s++) {
      const p = o[s];
      const q = o[(s + 1) % 4];
      quad(world(p[0], p[1], 0), world(q[0], q[1], 0), [...world(q[0], q[1], 0).slice(0, 2), -back], [...world(p[0], p[1], 0).slice(0, 2), -back], shade(PALETTE.rose, s === 0 ? 0.12 : -0.04));
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geo.computeBoundingSphere();

    // 牡丹：贴在最深那一层，按窗口比例裁（cover）
    const w = f.rects[n];
    const d = D[n] + 0.002;
    const s = scaleAt(d);
    flower.position.set((w.x + w.w / 2 - 0.5) * FW * s, (0.5 - w.y - w.h / 2) * FH * s, -d);
    flower.scale.set(w.w * FW * s, w.h * FH * s, 1);
    const winA = (w.w * FW) / (w.h * FH);
    const imgA = PEONY_SIZE.w / PEONY_SIZE.h;
    if (winA > imgA) tex.repeat.set(1, imgA / winA), tex.offset.set(0, (1 - imgA / winA) / 2);
    else tex.repeat.set(winA / imgA, 1), tex.offset.set((1 - winA / imgA) / 2, 0);
  }

  let half = FH / 2;
  let baseFov = 30;
  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    half = Math.max((FH / 2) * MARGIN, ((FW / 2) * MARGIN) / camera.aspect);
    baseFov = (2 * Math.atan(half / C0) * 180) / Math.PI;
    dirty = true;
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  const target = new THREE.Vector3();
  const look = new THREE.Vector3();
  function placeCamera() {
    const n = f.rects.length - 1;
    const mid = D[n] / 2;
    const yaw = view.front ? 0 : view.yaw + view.userYaw + view.hoverYaw;
    const pitch = view.front ? 0 : view.pitch + view.hoverPitch;
    const R = C0 + mid;
    target.set(0, 0, -mid);
    camera.position.set(R * Math.sin(yaw) * Math.cos(pitch), R * Math.sin(pitch), -mid + R * Math.cos(yaw) * Math.cos(pitch));
    look.copy(target);
    let fov = baseFov;
    if (fly) {
      // 推进去：机位往牡丹推、同时把镜头拉广（滑动变焦），窗口大小差不多不变，层与层的纵深被拉开
      const w = f.rects[n];
      const s = scaleAt(D[n]);
      const [wx, wy, wz] = world(w.x + w.w / 2, w.y + w.h / 2, D[n]);
      const k = fly.t < 2.6 ? ease(fly.t / 2.6) : fly.t < 3.6 ? 1 : 1 - ease((fly.t - 3.6) / 1.8);
      fov = lerp(baseFov, FOV_WIDE, k);
      const need = Math.max((w.h * FH * s) / 2, (w.w * FW * s) / 2 / camera.aspect) * 1.06;
      camera.position.lerp(new THREE.Vector3(wx, wy, wz + need / Math.tan((FOV_WIDE * Math.PI) / 360)), k);
      look.lerp(new THREE.Vector3(wx, wy, wz), k);
      fly.fov = fov;
    }
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(look);
  }

  const { draw } = loop(stage, (t, dt) => {
    if (!f) return;
    if (introT < 3) {
      introT += dt;
      view.yaw = lerp(0.42, REST.yaw, ease((introT - 0.2) / 1.3));
      dirty = true;
      if (introT < 1.8) shapeDirty = true;
    }
    if (fly) {
      fly.t += dt;
      if (fly.t > 5.4) fly = null;
      dirty = true;
    }
    const sm = 1 - Math.exp(-dt * 6);
    const hy = view.hoverYaw + (hover.yaw - view.hoverYaw) * sm;
    const hp = view.hoverPitch + (hover.pitch - view.hoverPitch) * sm;
    if (Math.abs(hy - view.hoverYaw) > 1e-4 || Math.abs(hp - view.hoverPitch) > 1e-4) dirty = true;
    view.hoverYaw = hy;
    view.hoverPitch = hp;
    if (!dirty) return;
    if (shapeDirty) {
      depths(reducedMotion.matches ? 99 : introT);
      rebuild();
      shapeDirty = false;
    }
    placeCamera();
    renderer.render(scene, camera);
    dirty = false;
    onFrame?.();
  });

  const hover = { yaw: 0, pitch: 0 };
  stage.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || dragging) return;
    const r = stage.getBoundingClientRect();
    hover.yaw = ((e.clientX - r.left) / r.width - 0.5) * 0.22;
    hover.pitch = -((e.clientY - r.top) / r.height - 0.5) * 0.14;
  });
  stage.addEventListener("pointerleave", () => {
    hover.yaw = 0;
    hover.pitch = 0;
  });

  // 在空白处横向拖：转视角（只取横向，页面照样能竖着滚）
  let dragging = null;
  stage.addEventListener("pointerdown", (e) => {
    if (e.target !== renderer.domElement) return;
    if (view.front) {
      view.front = false;
      view.userYaw = -view.yaw;
      onView?.(false);
    }
    dragging = { x: e.clientX, yaw: view.userYaw };
    renderer.domElement.setPointerCapture(e.pointerId);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    view.userYaw = Math.max(-0.95, Math.min(0.55, dragging.yaw + ((e.clientX - dragging.x) / stage.clientWidth) * 1.6));
    dirty = true;
    if (reducedMotion.matches) draw();
  });
  const end = () => (dragging = null);
  renderer.domElement.addEventListener("pointerup", end);
  renderer.domElement.addEventListener("pointercancel", end);

  const v3 = new THREE.Vector3();
  return {
    kind: "3d",
    set(next) {
      f = next;
      depths(reducedMotion.matches ? 99 : introT);
      dirty = shapeDirty = true;
      if (reducedMotion.matches) draw();
    },
    // 画框里 (u,v) 在最深那一层的点，投到舞台上的像素位置
    project(u, v, layer) {
      const d = D[layer ?? D.length - 1] ?? 0;
      const [x, y, z] = world(u, v, d);
      v3.set(x, y, z).project(camera);
      return { x: ((v3.x + 1) / 2) * stage.clientWidth, y: ((1 - v3.y) / 2) * stage.clientHeight };
    },
    // 外框在舞台上的像素宽高（正面时）
    framePx() {
      const h = (stage.clientHeight * (FH / 2)) / half;
      return { w: h * ASPECT, h };
    },
    view(name) {
      view.front = name === "front";
      view.userYaw = 0;
      dirty = true;
      if (reducedMotion.matches) draw();
    },
    fly() {
      if (reducedMotion.matches) return false;
      fly = { t: 0, fov: baseFov };
      return true;
    },
    flying: () => (fly ? { fov: fly.fov } : null),
    draw,
  };
}

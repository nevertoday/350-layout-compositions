import * as THREE from "three";
import { loop, pixelRatio, reducedMotion, webgl } from "../../lib/stage.js";
import { PHI, clamp, ease, goldenCuts, svg } from "./util.js";

const MAX = 10;
const CUTS = goldenCuts(MAX);
const stage = document.getElementById("hero-stage");
const depthInput = document.getElementById("depth");
const depthOut = document.getElementById("depth-out");
const restOut = document.getElementById("rest-out");
const spinBtn = document.getElementById("spin");
const replayBtn = document.getElementById("replay");

function describe(n) {
  const r = CUTS[n - 1].rest;
  const long = Math.max(r.w, r.h), short = Math.min(r.w, r.h);
  depthOut.textContent = n;
  restOut.textContent = `剩下的金色矩形 ${long.toFixed(3)} × ${short.toFixed(3)}，长宽比 ${(long / short).toFixed(3)}`;
}

export function initHero() {
  describe(+depthInput.value);
  if (webgl()) model();
  else plan();
}

// 没有 WebGL：平面图，同一个滑块控制
function plan() {
  stage.classList.add("flat");
  spinBtn.hidden = replayBtn.hidden = document.getElementById("drag-hint").hidden = true;
  stage.removeAttribute("tabindex");
  stage.setAttribute("aria-label", "黄金矩形被一层层切出正方形的平面图");
  const pad = 0.06;
  const root = svg("svg", { viewBox: `${-pad} ${-pad} ${PHI + 2 * pad} ${1 + 2 * pad}`, class: "plan" }, stage);
  const tiles = CUTS.map((c, i) => svg("rect", { x: c.x, y: c.y, width: c.s, height: c.s, class: `tile t${i % 3}` }, root));
  const rest = svg("rect", { class: "rest" }, root);
  svg("rect", { x: 0, y: 0, width: PHI, height: 1, class: "outline" }, root);
  const draw = () => {
    const n = +depthInput.value;
    tiles.forEach((t, i) => t.classList.toggle("off", i >= n));
    const r = CUTS[n - 1].rest;
    Object.entries({ x: r.x, y: r.y, width: r.w, height: r.h }).forEach(([k, v]) => rest.setAttribute(k, v));
    describe(n);
  };
  depthInput.addEventListener("input", draw);
  draw();
}

function model() {
  const S = 3;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(pixelRatio());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.prepend(renderer.domElement);

  const bg = new THREE.Color("#0a211b");
  const scene = new THREE.Scene();
  scene.background = bg;
  scene.fog = new THREE.Fog(bg, 11, 26);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);

  scene.add(new THREE.HemisphereLight("#d9eadf", "#04110c", 1.15));
  const sun = new THREE.DirectionalLight("#fff4e0", 2.2);
  sun.position.set(-5, 9, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  sun.shadow.radius = 4;
  scene.add(sun);

  // 地面只接影子，颜色就是页面的底色，模型像直接放在页面上
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ color: "#000000", opacity: 0.45 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new THREE.GridHelper(30, 60, "#d2ae5f", "#d2ae5f");
  grid.material.transparent = true;
  grid.material.opacity = 0.07;
  grid.position.y = 0.002;
  scene.add(grid);

  // 整个黄金矩形的外框和尺寸线
  const W = PHI * S, H = S, gold = new THREE.LineBasicMaterial({ color: "#d2ae5f" });
  const P = (x, z) => new THREE.Vector3(x, 0.004, z);
  const lines = (pts) => scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), gold));
  const x0 = -W / 2, x1 = W / 2, z0 = -H / 2, z1 = H / 2, off = 0.42, tick = 0.1;
  lines([
    P(x0, z0), P(x1, z0), P(x1, z0), P(x1, z1), P(x1, z1), P(x0, z1), P(x0, z1), P(x0, z0),
    P(x0, z1 + off), P(x1, z1 + off), P(x0, z1 + off - tick), P(x0, z1 + off + tick), P(x1, z1 + off - tick), P(x1, z1 + off + tick),
    P(x1 + off, z0), P(x1 + off, z1), P(x1 + off - tick, z0), P(x1 + off + tick, z0), P(x1 + off - tick, z1), P(x1 + off + tick, z1),
  ]);
  const labels = [label("1.618", 0, z1 + off + 0.32), label("1", x1 + off + 0.3, 0)];
  scene.add(...labels);

  // 正方形石板：高度和边长成正比，所以每块都是上一块缩小 0.618 倍
  const box = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const edges = new THREE.EdgesGeometry(box);
  const edgeMat = new THREE.LineBasicMaterial({ color: "#e6c77f" });
  // 越小的石板颜色越浅，一眼看出切的先后
  const dark = new THREE.Color("#183f33"), light = new THREE.Color("#7db394");
  const slabs = CUTS.map((c, i) => {
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(box, new THREE.MeshStandardMaterial({ color: dark.clone().lerp(light, i / (MAX - 1)), roughness: 0.6, metalness: 0.05 }));
    mesh.castShadow = mesh.receiveShadow = true;
    g.add(mesh, new THREE.LineSegments(edges, edgeMat));
    const side = c.s * S - 0.025;
    g.position.set((c.x + c.s / 2 - PHI / 2) * S, 0, (c.y + c.s / 2 - 0.5) * S);
    g.scale.set(side, 1e-4, side);
    g.visible = false;
    g.userData = { h: c.s * S * 0.15, p: 0, want: 0, wait: 0 };
    scene.add(g);
    return g;
  });

  // 剩下的矩形：一块发光的金色薄片
  const rest = new THREE.Group();
  const restFill = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: "#e6c77f", transparent: true, opacity: 0.55 }));
  restFill.rotation.x = -Math.PI / 2;
  const sq = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].map(([x, z]) => new THREE.Vector3(x, 0, z));
  rest.add(restFill, new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(sq), new THREE.LineBasicMaterial({ color: "#f0d48c" })));
  rest.position.y = 0.006;
  scene.add(rest);
  const restNow = { x: 0, z: 0, w: W, d: H };
  const restWant = { ...restNow };

  let yaw = -0.55, pitch = 0.78, auto = !reducedMotion.matches, dragging = null, radius = 10;
  const target = new THREE.Vector3(0, 0.1, 0);
  const place = () => {
    camera.position.set(
      target.x + radius * Math.cos(pitch) * Math.sin(yaw),
      target.y + radius * Math.sin(pitch),
      target.z + radius * Math.cos(pitch) * Math.cos(yaw),
    );
    camera.lookAt(target);
  };

  function setDepth(n, stagger = 0.16) {
    let k = 0;
    const rising = slabs.filter((g, i) => i < n && g.userData.want !== 1);
    const sinking = slabs.filter((g, i) => i >= n && g.userData.want !== 0).reverse();
    for (const g of rising) Object.assign(g.userData, { want: 1, wait: k++ * stagger });
    k = 0;
    for (const g of sinking) Object.assign(g.userData, { want: 0, wait: k++ * 0.06 });
    const r = CUTS[n - 1].rest;
    Object.assign(restWant, { x: (r.x + r.w / 2 - PHI / 2) * S, z: (r.y + r.h / 2 - 0.5) * S, w: r.w * S, d: r.h * S });
    if (reducedMotion.matches) {
      for (const g of slabs) g.userData.p = g.userData.want;
      Object.assign(restNow, restWant);
    }
    describe(n);
  }

  const view = loop(stage, (t, dt) => {
    if (auto && !dragging) yaw += dt * 0.08;
    for (const g of slabs) {
      const u = g.userData;
      if (u.wait > 0) u.wait -= dt;
      else u.p = clamp(u.p + Math.sign(u.want - u.p) * dt * 1.25, 0, 1);
      g.visible = u.p > 0.002;
      g.scale.y = Math.max(1e-4, ease(u.p) * u.h);
    }
    const k = reducedMotion.matches ? 1 : 1 - Math.exp(-dt * 5);
    for (const key in restNow) restNow[key] += (restWant[key] - restNow[key]) * k;
    rest.position.x = restNow.x;
    rest.position.z = restNow.z;
    rest.scale.set(restNow.w, 1, restNow.d);
    place();
    renderer.render(scene, camera);
  });

  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const v = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    radius = Math.max(2.6 / v, 3.5 / (v * camera.aspect));
    view.draw();
  };
  new ResizeObserver(resize).observe(stage);

  depthInput.addEventListener("input", () => { setDepth(+depthInput.value); view.draw(); });
  spinBtn.hidden = replayBtn.hidden = reducedMotion.matches;
  reducedMotion.addEventListener("change", () => {
    spinBtn.hidden = replayBtn.hidden = reducedMotion.matches;
    setDepth(+depthInput.value);
    view.draw();
  });
  spinBtn.addEventListener("click", () => {
    auto = !auto;
    spinBtn.setAttribute("aria-pressed", String(auto));
    spinBtn.textContent = auto ? "暂停旋转" : "继续旋转";
  });
  replayBtn.addEventListener("click", () => {
    for (const g of slabs) Object.assign(g.userData, { p: 0, want: 0, wait: 0 });
    setDepth(+depthInput.value, 0.24);
  });

  const canvas = renderer.domElement;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = { x: e.clientX, y: e.clientY, yaw, pitch };
    canvas.setPointerCapture(e.pointerId);
    stage.classList.add("grabbing");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    yaw = dragging.yaw - (e.clientX - dragging.x) * 0.008;
    pitch = clamp(dragging.pitch + (e.clientY - dragging.y) * 0.006, 0.22, 1.45);
    view.draw();
  });
  const release = () => { dragging = null; stage.classList.remove("grabbing"); };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  stage.addEventListener("keydown", (e) => {
    const turn = { ArrowLeft: [0.12, 0], ArrowRight: [-0.12, 0], ArrowUp: [0, 0.08], ArrowDown: [0, -0.08] }[e.key];
    if (!turn) return;
    e.preventDefault();
    yaw += turn[0];
    pitch = clamp(pitch + turn[1], 0.22, 1.45);
    view.draw();
  });

  setDepth(+depthInput.value, 0.14);
  resize();
  document.fonts.ready.then(() => { labels.forEach((l) => l.userData.paint()); view.draw(); });
}

// 地面上的数字标注：画在 2D 画布上当贴图，平躺在桌面上
function label(text, x, z) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 96;
  const g = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  const paint = () => {
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = "#e6c77f";
    g.font = '300 64px "Fraunces", "Noto Serif SC", serif';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 128, 50);
    tex.needsUpdate = true;
  };
  paint();
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.3), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.01, z);
  m.userData.paint = paint;
  return m;
}

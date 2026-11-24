// 首屏：发光的黄金螺旋，从外往里画出来；可以拖着转，可以一直往眼里钻。
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, Group, LineBasicMaterial, LineSegments, Mesh,
  MeshBasicMaterial, PerspectiveCamera, Points, Scene, ShaderMaterial, Sprite, SpriteMaterial, Vector2, WebGLRenderer,
} from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { A, B, PHI, QUARTER, TH0, X0, Y0, logR, square } from "./spiral.js";

const KOUT = 6; // 往外多画几层，放大时边缘永远有东西
const KIN = 16; // 往里画到比像素还小
const CONE = 0.22; // 越往外越往后退一点，侧过来看像一枚螺壳
const GOLD = new Color("#f2c26b");

export function hero({ stage, play, depth, depthOut, reset }) {
  const small = Math.min(innerWidth, innerHeight) < 560;
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  const maxPr = small ? 1.5 : 2; // 手机上泛光是大头（每帧好几遍全屏模糊），像素比压到 1.5，发光的线照样细
  renderer.setPixelRatio(pixelRatio(maxPr));
  renderer.setClearColor("#060509");
  stage.append(renderer.domElement);

  const scene = new Scene();
  scene.background = new Color("#060509"); // 不用 setClearColor：清屏色进了泛光的中间缓冲不做色彩转换，出来会被提亮成灰紫
  const camera = new PerspectiveCamera(34, 1, 0.05, 200);
  const tilt = new Group(); // 拖动转的是它，支点在眼上
  const zoom = new Group(); // 往眼里钻：每 1 个单位 = 放大 φ 倍、转 90°
  const frame = new Group(); // 竖屏时把横的黄金矩形转成竖的
  frame.add(tilt);
  tilt.add(zoom);
  scene.add(frame);

  // ---- 螺旋管：管子粗细跟半径成正比，所以整条管子也自相似 ----
  const Q = small ? 48 : 72, RS = 8;
  const tTop = TH0 + KOUT * QUARTER, span = (KOUT + KIN) * QUARTER, N = (KOUT + KIN) * Q;
  const pos = new Float32Array((N + 1) * RS * 3), col = new Float32Array((N + 1) * RS * 3);
  for (let i = 0; i <= N; i++) {
    const t = tTop - (span * i) / N, r = logR(t);
    const c = [r * Math.cos(t), r * Math.sin(t), -CONE * r];
    // 切线（往里走的方向）、面内法线
    const tx = B * Math.cos(t) - Math.sin(t), ty = B * Math.sin(t) + Math.cos(t), tl = Math.hypot(tx, ty);
    const nx = -ty / tl, ny = tx / tl, rad = 0.011 * r;
    for (let j = 0; j < RS; j++) {
      const a = (j / RS) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), o = (i * RS + j) * 3;
      pos[o] = c[0] + rad * ca * nx; pos[o + 1] = c[1] + rad * ca * ny; pos[o + 2] = c[2] + rad * sa;
      const lit = 0.4 + 0.5 * Math.max(0, sa) + 0.15 * Math.max(0, ca); // 假光：朝镜头的一面亮
      col[o] = GOLD.r * lit; col[o + 1] = GOLD.g * lit; col[o + 2] = GOLD.b * lit;
    }
  }
  const idx = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < RS; j++) {
    const a = i * RS + j, b = i * RS + ((j + 1) % RS), c = a + RS, d = b + RS;
    idx.push(a, c, b, b, c, d);
  }
  const tubeGeo = new BufferGeometry();
  tubeGeo.setAttribute("position", new BufferAttribute(pos, 3));
  tubeGeo.setAttribute("color", new BufferAttribute(col, 3));
  tubeGeo.setIndex(idx);
  zoom.add(new Mesh(tubeGeo, new MeshBasicMaterial({ vertexColors: true })));
  const visibleFrom = (KOUT - 1.2) * Q * RS * 6; // 外面几层在屏幕外，起笔从刚进画面的地方算

  // ---- 黄金矩形的方块：每层一个平面，跟管子一样往后退 ----
  const lines = [];
  for (let k = -KOUT; k <= KIN; k++) {
    const sq = square(k), z = -CONE * Math.hypot(X0, Y0) * PHI ** -k;
    for (let e = 0; e < 4; e++) lines.push(...sq[e], z, ...sq[(e + 1) % 4], z);
  }
  const rectGeo = new BufferGeometry();
  rectGeo.setAttribute("position", new BufferAttribute(new Float32Array(lines), 3));
  const rectMat = new LineBasicMaterial({ color: "#c79a52", transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
  zoom.add(new LineSegments(rectGeo, rectMat));

  // ---- 沿螺旋往里流的光点：每 90° 一份同样的点，所以放大一圈后无缝接上 ----
  const per = small ? 70 : 130, levels = KOUT + KIN, count = per * levels;
  const th = new Float32Array(count), jit = new Float32Array(count * 3), seed = new Float32Array(count);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const base = Array.from({ length: per }, () => [rnd() * QUARTER, rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1, rnd()]);
  for (let L = 0; L < levels; L++) for (let j = 0; j < per; j++) {
    const i = L * per + j, [o, x, y, z, w] = base[j];
    th[i] = tTop - L * QUARTER - o;
    jit.set([x, y, z * 0.6], i * 3);
    seed[i] = w;
  }
  const dotGeo = new BufferGeometry();
  dotGeo.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
  dotGeo.setAttribute("aTheta", new BufferAttribute(th, 1));
  dotGeo.setAttribute("aJit", new BufferAttribute(jit, 3));
  dotGeo.setAttribute("aSeed", new BufferAttribute(seed, 1));
  const dotMat = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: 500 }, uShow: { value: 0 }, uColor: { value: new Color("#ffd98f") } },
    vertexShader: `
      uniform float uTime, uPx;
      attribute float aTheta, aSeed; attribute vec3 aJit;
      varying float vA;
      void main() {
        float top = ${tTop.toFixed(6)}, span = ${span.toFixed(6)};
        float k = mod(top - aTheta + uTime * 0.32, span);
        float t = top - k, r = ${A.toFixed(6)} * exp(${B.toFixed(6)} * t);
        vec3 p = vec3(r * cos(t), r * sin(t), -${CONE.toFixed(3)} * r) + aJit * r * 0.07;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float sc = length(modelMatrix[0].xyz);
        gl_PointSize = clamp(0.03 * r * (0.35 + aSeed) * sc * uPx / -mv.z, 0.0, 40.0);
        vA = (0.55 + 0.45 * sin(uTime * 2.3 + aSeed * 40.0)) * smoothstep(0.0, 0.06, k / span) * smoothstep(1.0, 0.9, k / span);
      }`,
    fragmentShader: `
      uniform float uShow; uniform vec3 uColor; varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.0, d); a *= a;
        gl_FragColor = vec4(uColor * a * vA * uShow, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const dots = new Points(dotGeo, dotMat);
  dots.frustumCulled = false;
  zoom.add(dots);

  // ---- 远处的星尘 ----
  const stars = new Float32Array((small ? 350 : 700) * 3);
  for (let i = 0; i < stars.length; i += 3) {
    const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, R = 14 + rnd() * 30, q = Math.sqrt(1 - u * u);
    stars.set([R * q * Math.cos(a), R * q * Math.sin(a), -Math.abs(R * u) - 4], i);
  }
  const starGeo = new BufferGeometry();
  starGeo.setAttribute("position", new BufferAttribute(stars, 3));
  const starMat = new ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `uniform float uTime; varying float vA;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        float h = fract(sin(dot(position.xy, vec2(12.9898, 78.233))) * 43758.5453);
        gl_PointSize = 1.0 + 2.2 * h; vA = 0.25 + 0.35 * h * (0.6 + 0.4 * sin(uTime * (0.6 + h) + h * 30.0)); }`,
    fragmentShader: `varying float vA; void main() { float d = length(gl_PointCoord - 0.5) * 2.0; gl_FragColor = vec4(vec3(1.0, 0.9, 0.75) * vA * smoothstep(1.0, 0.0, d), 1.0); }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  scene.add(new Points(starGeo, starMat));

  // ---- 眼上的光 ----
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 128;
  const g = glowCanvas.getContext("2d"), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,240,205,1)");
  grd.addColorStop(0.18, "rgba(255,206,120,.55)");
  grd.addColorStop(0.5, "rgba(214,150,60,.12)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const glow = new Sprite(new SpriteMaterial({ map: new CanvasTexture(glowCanvas), blending: AdditiveBlending, depthWrite: false, transparent: true }));
  tilt.add(glow);

  // ---- 后期：泛光 ----
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(256, 256), small ? 0.6 : 0.85, 0.32, 0.22);
  bloom.compositeMaterial.uniforms.bloomFactors.value = [1, 0.7, 0.3, 0.08, 0]; // 只要近处的光晕，远处别把夜空糊成灰
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---- 镜头：把 R0 放在画面里，宽屏时偏右给标题让位 ----
  let portrait = false;
  const resize = () => {
    const { width: w, height: h } = stage.getBoundingClientRect();
    if (!w || !h) return;
    const pr = pixelRatio(maxPr);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    if (small) bloom.setSize(w * pr / 2, h * pr / 2); // 泛光本来就是糊的，手机上再降一半分辨率看不出来
    camera.aspect = w / h;
    portrait = w / h < 1.05;
    frame.rotation.z = portrait ? -QUARTER : 0;
    // R0 的中心（转完以后）
    const cx = X0 + PHI / 2, cy = Y0 + 0.5;
    const [mx, my] = portrait ? [cy, -cx] : [cx, cy];
    const rw = portrait ? 1 : PHI, rh = portrait ? PHI : 1;
    // 往里钻的时候画面每圈放大 φ 倍。竖屏窄，R0 先只占 56% 高，放大到头也才 91%：整条主螺旋一直在画面里
    const fill = portrait ? 0.56 : 0.7;
    const vh = Math.max(rh / fill, rw / (camera.aspect > 1.3 ? 0.56 : fill) / camera.aspect);
    const dist = vh / 2 / Math.tan((camera.fov * Math.PI) / 360);
    const shiftX = camera.aspect > 1.3 ? -vh * camera.aspect * (camera.aspect > 1.9 ? 0.27 : 0.19) : portrait ? -vh * camera.aspect * 0.07 : 0; // 宽屏把螺旋推到右边，左边留给标题；横过来的手机更扁，推得更远，别压住导语；竖屏外圈往左出画，整体往右挪一点
    const shiftY = 0;
    camera.position.set(mx + shiftX, my + shiftY, dist);
    camera.lookAt(mx + shiftX, my + shiftY, 0);
    camera.updateProjectionMatrix();
    dotMat.uniforms.uPx.value = (camera.projectionMatrix.elements[5] * h * pr) / 2;
    glow.scale.setScalar(vh * 0.16);
  };

  // ---- 状态 ----
  let z = 0, auto = !reducedMotion.matches, drawT = reducedMotion.matches ? 99 : 0;
  let rx = 0, ry = 0, dragging = null;
  const fmt = (n) => (n < 100 ? n.toFixed(2) : n < 1e4 ? Math.round(n).toLocaleString("en") : n.toExponential(1).replace("e+", "×10^"));
  const setDepth = (v) => {
    z = Math.max(0, Math.min(+depth.max, v));
    depth.value = z.toFixed(2);
    depthOut.textContent = `×${fmt(PHI ** z)}`;
    depth.setAttribute("aria-valuetext", `放大 ${fmt(PHI ** z)} 倍，转了 ${Math.round(z * 90)} 度`);
  };
  const setAuto = (on) => {
    auto = on && !reducedMotion.matches;
    play.setAttribute("aria-pressed", String(auto));
    play.querySelector("span").textContent = auto ? "暂停深入" : "沿螺旋深入";
  };
  setDepth(0);
  setAuto(auto);

  const view = loop(stage, (t, dt) => {
    drawT += dt;
    if (auto) {
      let nz = z + dt * 0.22;
      if (nz >= +depth.max) nz -= Math.floor(nz); // 到头了就悄悄跳回同样的画面
      setDepth(nz);
    }
    const p = Math.min(1, drawT / 3.2), ease = 1 - (1 - p) ** 3;
    tubeGeo.setDrawRange(0, Math.floor(visibleFrom + (idx.length - visibleFrom) * ease));
    rectMat.opacity = 0.3 * Math.min(1, drawT / 1.6);
    dotMat.uniforms.uShow.value = Math.max(0, Math.min(1, (drawT - 1.2) / 2));
    dotMat.uniforms.uTime.value = t;
    starMat.uniforms.uTime.value = t;
    const f = z - Math.floor(z);
    zoom.scale.setScalar(PHI ** f);
    zoom.rotation.z = f * QUARTER;
    const sway = reducedMotion.matches || dragging ? 0 : 1;
    tilt.rotation.set(rx + sway * Math.sin(t * 0.21) * 0.08, ry + sway * Math.sin(t * 0.17 + 1) * 0.1, 0);
    glow.material.opacity = 0.75 + 0.25 * Math.sin(t * 1.4);
    composer.render();
  });
  new ResizeObserver(() => { resize(); view.draw(); }).observe(stage);

  // ---- 操作 ----
  const canvas = renderer.domElement;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = { x: e.clientX, y: e.clientY, rx, ry };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const sign = portrait ? -1 : 1;
    ry = clamp(dragging.ry + ((e.clientX - dragging.x) / stage.clientWidth) * 2.2, 1.1);
    rx = clamp(dragging.rx + ((e.clientY - dragging.y) / stage.clientHeight) * 2.2 * sign, 1.1);
    view.draw();
  });
  const end = () => { dragging = null; };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  stage.addEventListener("keydown", (e) => {
    const step = 0.12;
    const keys = { ArrowLeft: () => (ry = clamp(ry - step, 1.1)), ArrowRight: () => (ry = clamp(ry + step, 1.1)), ArrowUp: () => (rx = clamp(rx - step, 1.1)), ArrowDown: () => (rx = clamp(rx + step, 1.1)), "+": () => setDepth(z + 0.25), "=": () => setDepth(z + 0.25), "-": () => setDepth(z - 0.25), " ": () => setAuto(!auto) };
    if (!keys[e.key]) return;
    e.preventDefault();
    keys[e.key]();
    view.draw();
  });
  play.addEventListener("click", () => setAuto(!auto));
  depth.addEventListener("input", () => { setAuto(false); setDepth(+depth.value); view.draw(); });
  reset.addEventListener("click", () => { rx = ry = 0; setDepth(0); view.draw(); });
  reducedMotion.addEventListener("change", () => { setAuto(false); drawT = 99; view.draw(); });
}

const clamp = (v, m) => Math.max(-m, Math.min(m, v));

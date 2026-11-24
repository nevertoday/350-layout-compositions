import * as THREE from "three";
import { loop, pixelRatio, reducedMotion, webgl } from "../../lib/stage.js";

const stage = document.getElementById("stage");
const button = document.getElementById("spin");

if (!webgl()) {
  stage.classList.add("fallback");
  button.hidden = true;
} else {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(pixelRatio());
  stage.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#e9e1d2");
  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 6);
  const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1, 0.32, 160, 24), new THREE.MeshStandardMaterial({ color: "#c2410c", roughness: 0.4 }));
  scene.add(mesh, new THREE.AmbientLight("#ffffff", 0.6));
  const sun = new THREE.DirectionalLight("#ffffff", 2.4);
  sun.position.set(3, 4, 5);
  scene.add(sun);

  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  let spinning = true;
  const view = loop(stage, (t, dt) => {
    if (spinning) mesh.rotation.set(t * 0.4, t * 0.6, 0);
    renderer.render(scene, camera);
  });
  new ResizeObserver(() => { resize(); view.draw(); }).observe(stage);
  button.hidden = reducedMotion.matches;
  button.addEventListener("click", () => {
    spinning = !spinning;
    button.setAttribute("aria-pressed", String(spinning));
    button.textContent = spinning ? "暂停旋转" : "继续旋转";
  });
}

// Three.js 轻量化全幅对半明暗 3D 舞台：
//   - split（海报母题）：与上方「明暗｜对比」同轴竖切，拖动调性重心可实时滑移左右纸墨面积，
//     拖动黑场/白场实时改变暖纸与炭墨的明度反差、球体反色光影与 9 级透视阶梯；
//   - chiaroscuro（明暗雕塑）：单灯侧光雕刻立体石膏球，调性重心同步旋转侧光灯位与影调底色；
//   - editorial（版面样本）：动态展示明度反差与亮暗面积如何改写排版层级与可读性。
// 性能预算：< 10 draw calls、无阴影贴图、无 bloom、手机 DPR 限 1.5，软件渲染下稳健 ≥ 45 fps。

import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { pixelRatio } from "../../lib/stage.js";
import { PALETTE, clamp, lerp, levelRgb, rgbCss } from "./palette.js";
import { GRADATIONS, tonalMetrics } from "./model.js";

const toColor = ([r, g, b]) => new Color().setRGB(r / 255, g / 255, b / 255, SRGBColorSpace);

function makeSphereShader() {
  return new ShaderMaterial({
    uniforms: {
      uDark: { value: toColor(PALETTE.ink) },
      uLight: { value: toColor(PALETTE.paper) },
      uLightDir: { value: new Vector3(0.75, 0.32, 0.58).normalize() },
      uSteps: { value: 2.0 },
      uSplitMode: { value: 1.0 },
      uContrast: { value: 1.0 },
      uSplitX: { value: 0.0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorld;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uDark;
      uniform vec3 uLight;
      uniform vec3 uLightDir;
      uniform float uSteps;
      uniform float uSplitMode;
      uniform float uContrast;
      uniform float uSplitX;
      varying vec3 vNormal;
      varying vec3 vWorld;
      void main() {
        vec3 n = normalize(vNormal);
        float ndl = dot(n, normalize(uLightDir)) * 0.5 + 0.5;
        float tone = ndl;
        if (uSplitMode > 0.5) {
          float side = step(uSplitX, vWorld.x);
          if (uSteps > 1.5 && uSteps < 2.5) {
            tone = side;
          } else if (uSteps > 3.5) {
            float base = mix(0.06 + ndl * 0.32, 0.58 + ndl * 0.42, side);
            tone = floor(base * 4.999) / 4.0;
          } else {
            tone = mix(0.03 + ndl * 0.26, 0.68 + ndl * 0.32, side);
          }
        } else {
          float sculpted = clamp((ndl - 0.5) * (0.45 + uContrast * 1.2) + 0.5, 0.0, 1.0);
          if (uSteps > 1.5 && uSteps < 2.5) {
            tone = step(0.48, sculpted);
          } else if (uSteps > 3.5) {
            tone = floor(sculpted * 4.999) / 4.0;
          } else {
            tone = sculpted;
          }
        }
        vec3 col = mix(uDark, uLight, clamp(tone, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

// 版面样本动态纹理（按状态变化重画一次，使用 DM Mono + Noto Sans SC）
function makeEditorialCanvas() {
  const c = document.createElement("canvas");
  c.width = 720;
  c.height = 450;
  const ctx = c.getContext("2d");
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.generateMipmaps = false;

  let lastKey = "";
  function update(m, gradKey, dotOn) {
    const key = `${m.lo.toFixed(3)}|${m.hi.toFixed(3)}|${m.key.toFixed(3)}|${gradKey}|${dotOn}`;
    if (key === lastKey) return;
    lastKey = key;

    const W = c.width;
    const H = c.height;
    const bgDark = m.key < 0.44;
    const bgTone = bgDark ? m.lo : m.hi;
    const fgTone = bgDark ? m.hi : m.lo;
    const midTone = lerp(bgTone, fgTone, 0.56);
    const subTone = lerp(bgTone, fgTone, 0.16);
    const splitPx = Math.round(W * clamp(lerp(0.42, 0.68, m.key), 0.38, 0.72));

    ctx.fillStyle = rgbCss(bgDark ? m.darkRgb : m.lightRgb);
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = rgbCss(levelRgb(subTone));
    ctx.fillRect(splitPx, 0, W - splitPx, H);

    const steps = gradKey === "notan" ? 2 : 5;
    const stripW = W - splitPx - 56;
    if (stripW > 40) {
      for (let i = 0; i < steps; i++) {
        const t = steps === 2 ? (i === 0 ? bgTone : fgTone) : lerp(m.lo, m.hi, i / (steps - 1));
        ctx.fillStyle = rgbCss(levelRgb(t));
        const bw = stripW / steps;
        ctx.fillRect(splitPx + 28 + i * bw, H * 0.62, bw - 3, H * 0.24);
      }
    }

    const cx = splitPx + (W - splitPx) * 0.5;
    ctx.beginPath();
    ctx.arc(cx, H * 0.34, 58, 0, Math.PI * 2);
    ctx.fillStyle = rgbCss(bgDark ? m.lightRgb : m.darkRgb);
    ctx.fill();
    if (dotOn) {
      ctx.beginPath();
      ctx.arc(cx + 18, H * 0.34 - 13, 13, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.redHex;
      ctx.fill();
    }

    ctx.fillStyle = rgbCss(levelRgb(midTone));
    ctx.font = '500 14px "DM Mono", monospace';
    ctx.fillText(`ISSUE 100 · ${m.ratio.toFixed(1)} : 1`, 36, 68);

    ctx.fillStyle = rgbCss(bgDark ? m.lightRgb : m.darkRgb);
    ctx.font = '900 56px "Noto Sans SC", sans-serif';
    ctx.fillText("明暗有度", 34, 154);
    ctx.fillText("画面有力", 34, 220);

    ctx.fillStyle = rgbCss(levelRgb(midTone));
    ctx.font = '400 18px "Noto Sans SC", sans-serif';
    ctx.fillText("拉开黑场与白场的落差，标题、正文", 36, 276);
    ctx.fillText("与配图自然排出清晰的阅读先后。", 36, 306);

    ctx.fillStyle = rgbCss(bgDark ? m.lightRgb : m.darkRgb);
    ctx.fillRect(36, 344, 162, 46);
    ctx.fillStyle = rgbCss(bgDark ? m.darkRgb : m.lightRgb);
    ctx.font = '700 17px "Noto Sans SC", sans-serif';
    ctx.fillText("检视明暗骨架", 62, 373);

    ctx.strokeStyle = rgbCss(levelRgb(midTone));
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(36, 416);
    ctx.lineTo(splitPx - 28, 416);
    ctx.stroke();

    tex.needsUpdate = true;
  }

  return { tex, update };
}

export function createScene3D(host) {
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  const maxDpr = window.innerWidth < 768 ? 1.5 : 2;
  renderer.setPixelRatio(pixelRatio(maxDpr));
  host.append(renderer.domElement);

  const scene = new Scene();
  scene.background = toColor(PALETTE.ink);
  const camera = new OrthographicCamera(-1.5, 1.5, 1, -1, 0.1, 30);
  camera.position.set(0, 0, 8);

  // ---------- 1. 通栏对半底面（够宽以覆盖 2560px 超宽屏） ----------
  const leftBgMat = new MeshBasicMaterial({ color: toColor(PALETTE.paper) });
  const rightBgMat = new MeshBasicMaterial({ color: toColor(PALETTE.ink) });
  const leftBg = new Mesh(new PlaneGeometry(24, 6), leftBgMat);
  const rightBg = new Mesh(new PlaneGeometry(24, 6), rightBgMat);
  leftBg.position.set(-12, 0, -4);
  rightBg.position.set(12, 0, -4);
  scene.add(leftBg, rightBg);

  // ---------- 2. 左侧斜向暗影楔（原海报左下大斜影，与右侧阶梯呈镜像透视角） ----------
  const shadowGeo = new BufferGeometry();
  shadowGeo.setAttribute("position", new Float32BufferAttribute([0, 0, 0, -1.04, -0.75, 0, 0, -0.75, 0], 3));
  const shadowMat = new MeshBasicMaterial({ color: toColor(PALETTE.ink), side: DoubleSide });
  const shadowWedge = new Mesh(shadowGeo, shadowMat);
  shadowWedge.position.set(0, -0.27, -2.2);
  scene.add(shadowWedge);

  // ---------- 3. 右下透视阶梯（9 条由细变粗的纸白横阶，1 次 InstancedMesh） ----------
  const STEP_N = 9;
  const stepMat = new MeshBasicMaterial({ color: 0xffffff });
  const stepsMesh = new InstancedMesh(new BoxGeometry(1, 1, 0.08), stepMat, STEP_N);
  const tmpM = new Matrix4();
  const tmpC = new Color();
  scene.add(stepsMesh);

  // ---------- 4. 雕塑底座（明暗雕塑模式下的建筑地台） ----------
  const plinthMat = new MeshBasicMaterial({ color: toColor(PALETTE.ink) });
  const plinth = new Mesh(new PlaneGeometry(24, 2.2), plinthMat);
  plinth.position.set(0, -1.34, -2.4);
  scene.add(plinth);

  const castShadowMat = new MeshBasicMaterial({ color: toColor(PALETTE.ink), transparent: true, opacity: 0.72 });
  const castShadow = new Mesh(new PlaneGeometry(1.5, 0.24), castShadowMat);
  castShadow.position.set(-0.35, -0.45, -1.6);
  scene.add(castShadow);

  // ---------- 5. 中央立体球 + 朱红焦点球（与下方阶梯合计约占舞台高度 83%，完整落在舞台内且不碰角标） ----------
  const sphereMat = makeSphereShader();
  const sphere = new Mesh(new SphereGeometry(0.56, 36, 24), sphereMat);
  sphere.position.set(0, 0.3, 0);
  scene.add(sphere);

  const dotMat = new MeshBasicMaterial({ color: toColor(PALETTE.red) });
  const dotMesh = new Mesh(new SphereGeometry(0.102, 24, 16), dotMat);
  dotMesh.position.set(0.23, 0.45, 0.72);
  scene.add(dotMesh);

  // ---------- 6. 版面样本展示板 ----------
  const editorial = makeEditorialCanvas();
  const edMat = new MeshBasicMaterial({ map: editorial.tex });
  const edPlane = new Mesh(new PlaneGeometry(2.6, 1.625), edMat);
  edPlane.position.set(0, 0.0, 1.2);
  scene.add(edPlane);

  let aspect = 1.6;
  const halfH = 1.0;

  function layoutStairs(splitX, m, gradKey, openK) {
    // 9 级透视阶梯按几何级数拉开厚度与槽距，底边稳落在 y = -0.802（在 360×740 下也高于右下角标且完整不裁切）
    const startY = -0.265;
    const totalSpan = 0.54;
    const r = 1.185;
    let yCursor = startY;
    for (let i = 0; i < STEP_N; i++) {
      const f = i / (STEP_N - 1);
      const powR = Math.pow(r, i);
      const h = 0.0148 * powR;
      const g = 0.0154 * powR;
      const y = yCursor - h * 0.5;
      const t = clamp((startY - y) / totalSpan, 0, 1);
      const w = lerp(0.11, 0.84, t) * openK;
      const x = splitX + w * 0.5;
      tmpM.makeScale(Math.max(0.001, w), h, 1);
      tmpM.setPosition(x, y, -1.5);
      stepsMesh.setMatrixAt(i, tmpM);
      yCursor -= h + g;

      if (gradKey === "notan") {
        tmpC.setRGB(m.lightRgb[0] / 255, m.lightRgb[1] / 255, m.lightRgb[2] / 255, SRGBColorSpace);
      } else {
        const stepTone =
          gradKey === "five"
            ? lerp(m.lo + m.span * 0.35, m.hi, Math.floor(f * 4.999) / 4)
            : lerp(m.lo + m.span * 0.26, m.hi, f);
        const [rC, gC, bC] = levelRgb(stepTone);
        tmpC.setRGB(rC / 255, gC / 255, bC / 255, SRGBColorSpace);
      }
      stepsMesh.setColorAt(i, tmpC);
    }
    stepsMesh.instanceMatrix.needsUpdate = true;
    if (stepsMesh.instanceColor) stepsMesh.instanceColor.needsUpdate = true;
  }

  return {
    el: renderer.domElement,
    resize(w, h) {
      const rw = Math.max(1, Math.round(w));
      const rh = Math.max(1, Math.round(h));
      aspect = rw / rh;
      camera.left = -halfH * aspect;
      camera.right = halfH * aspect;
      camera.top = halfH;
      camera.bottom = -halfH;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh, false);
    },
    render(state, openK = 1) {
      const m = tonalMetrics(state);
      const steps = GRADATIONS[state.gradation].steps;
      const darkCol = toColor(m.darkRgb);
      const lightCol = toColor(m.lightRgb);
      const midCol = toColor(m.midRgb);

      const isSplit = state.scene === "split";
      const isSculpt = state.scene === "chiaroscuro";
      const isEd = state.scene === "editorial";

      leftBg.visible = isSplit || isSculpt;
      rightBg.visible = isSplit;
      shadowWedge.visible = isSplit;
      stepsMesh.visible = isSplit;
      plinth.visible = isSculpt;
      castShadow.visible = isSculpt;
      sphere.visible = isSplit || isSculpt;
      dotMesh.visible = isSplit && state.dot;
      edPlane.visible = isEd;

      if (isSplit) {
        // key = 0.50 时精确落在中轴 splitX = 0，与上方「明暗｜对比」同线竖切
        const maxShift = Math.min(halfH * aspect * 0.52, 1.35);
        const splitX = lerp(-maxShift, maxShift, (m.key - 0.12) / 0.76);
        leftBg.position.x = splitX - 12;
        rightBg.position.x = splitX + 12;
        leftBgMat.color.copy(lightCol);
        rightBgMat.color.copy(darkCol);

        // 左侧斜影与右侧阶梯右沿呈镜像倾角，稳定落到底沿
        const wedgeW = Math.min(halfH * aspect * 0.98 + Math.max(0, splitX), 1.08);
        const sp = shadowGeo.attributes.position;
        sp.setXYZ(0, 0, 0, 0);
        sp.setXYZ(1, -wedgeW, -0.75, 0);
        sp.setXYZ(2, 0, -0.75, 0);
        sp.needsUpdate = true;
        shadowWedge.position.set(splitX, -0.27, -2.2);
        shadowMat.color.copy(darkCol);

        layoutStairs(splitX, m, state.gradation, openK);

        const sRadius = lerp(0.88, 1.0, openK);
        sphere.scale.setScalar(sRadius);
        sphere.position.set(splitX, 0.3, 0);
        sphereMat.uniforms.uDark.value.copy(darkCol);
        sphereMat.uniforms.uLight.value.copy(lightCol);
        sphereMat.uniforms.uSteps.value = steps;
        sphereMat.uniforms.uSplitMode.value = 1.0;
        sphereMat.uniforms.uSplitX.value = splitX;
        sphereMat.uniforms.uContrast.value = m.span;
        sphereMat.uniforms.uLightDir.value.set(0.82, 0.35, 0.45).normalize();

        dotMesh.position.set(splitX + 0.23 * sRadius, 0.3 + 0.15 * sRadius, 0.72);
        dotMesh.scale.setScalar(lerp(0.65, 1, openK));
        const redMix = lerp(0.35, 1, clamp(m.span * 1.2, 0, 1));
        dotMat.color.setRGB(
          lerp(m.lightRgb[0], PALETTE.red[0], redMix) / 255,
          lerp(m.lightRgb[1], PALETTE.red[1], redMix) / 255,
          lerp(m.lightRgb[2], PALETTE.red[2], redMix) / 255,
          SRGBColorSpace,
        );
      } else if (isSculpt) {
        // 调性重心同时控制影棚底色明暗与侧光灯位方位
        const bgTone = lerp(m.lo * 1.05, m.hi * 0.96, clamp((m.key - 0.12) / 0.76, 0, 1));
        const floorTone = clamp(bgTone - 0.14 * m.span, 0, 1);
        leftBg.position.x = 0;
        leftBgMat.color.copy(toColor(levelRgb(bgTone)));
        plinthMat.color.copy(toColor(levelRgb(floorTone)));
        plinth.position.set(0, -1.34, -2.4);

        const lampAngle = lerp(-0.92, 0.88, clamp((m.key - 0.12) / 0.76, 0, 1));
        castShadowMat.color.copy(darkCol);
        castShadowMat.opacity = clamp(0.14 + m.span * 0.74, 0.1, 0.86);
        castShadow.position.set(-lampAngle * 0.42, -0.45, -1.6);
        castShadow.scale.set(0.95 + m.span * 0.45, 0.9, 1);

        sphere.scale.setScalar(1.04 * lerp(0.9, 1, openK));
        sphere.position.set(0, 0.14, 0);
        sphereMat.uniforms.uDark.value.copy(darkCol);
        sphereMat.uniforms.uLight.value.copy(lightCol);
        sphereMat.uniforms.uSteps.value = steps;
        sphereMat.uniforms.uSplitMode.value = 0.0;
        sphereMat.uniforms.uContrast.value = m.span;
        sphereMat.uniforms.uLightDir.value
          .set(lerp(0.95, 0.18, clamp((m.key - 0.12) / 0.76, 0, 1)), 0.38, lerp(0.16, 0.92, clamp((m.key - 0.12) / 0.76, 0, 1)))
          .normalize();
      } else if (isEd) {
        scene.background = midCol;
        editorial.update(m, state.gradation, state.dot);
        const fitW = Math.min(1.92 * aspect, 2.75);
        const fitH = fitW * (450 / 720);
        const maxH = 1.66;
        const sc = fitH > maxH ? maxH / fitH : 1;
        edPlane.scale.set((fitW * sc) / 2.6, (fitH * sc) / 1.625, 1);
      }

      if (!isEd) scene.background = isSplit ? darkCol : leftBgMat.color;
      renderer.render(scene, camera);
    },
  };
}

// Three.js 轻量化明暗对比 3D 舞台：
//   - split（海报母题）：完全呼应 100.webp 的对半空间、跨轴双色立体球、斜角投影、9 级透视阶梯与朱红焦点球；
//   - chiaroscuro（明暗雕塑）：单灯侧光雕刻石膏球与建筑基座，横拖改变光比，纵拖改变调性；
//   - editorial（版面样本）：实体三维展示牌上的动态排版，直观看清反差如何决定标题/正文可读性。
// 设计目标：< 12 draw calls、无阴影贴图、无 bloom、手机 DPR 限 1.5，软件渲染下同样 ≥ 45 fps。

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
import { PALETTE, clamp, lerp, rgbCss, toneRgb } from "./palette.js";
import { GRADATIONS, tonalMetrics } from "./model.js";

// Three.js r187 内部工作在线性色空间，显式按 sRGB 读入才能精确还原海报的暖纸与炭墨
const toColor = ([r, g, b]) => new Color().setRGB(r / 255, g / 255, b / 255, SRGBColorSpace);

// 自定义极简明暗着色器：支持二值 Notan / 五阶层次 / 连续过渡，以及海报母题对半反色模式
function makeSphereShader() {
  return new ShaderMaterial({
    uniforms: {
      uDark: { value: toColor(PALETTE.ink) },
      uLight: { value: toColor(PALETTE.paper) },
      uLightDir: { value: new Vector3(0.75, 0.32, 0.58).normalize() },
      uSteps: { value: 2.0 }, // 2 = 二值, 5 = 五阶, 0 = 连续
      uSplitMode: { value: 1.0 }, // 1 = 海报对半反色, 0 = 纯立体侧光
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
          float sculpted = clamp((ndl - 0.5) * (0.45 + uContrast * 1.15) + 0.5, 0.0, 1.0);
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

// 版面样本动态纹理（按状态变化重画一次，极低开销）
function makeEditorialCanvas() {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 480;
  const ctx = c.getContext("2d");
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.generateMipmaps = false;

  let lastKey = "";
  function update(m, gradKey, dotOn) {
    const key = `${m.lo.toFixed(3)}|${m.hi.toFixed(3)}|${m.harsh.toFixed(3)}|${gradKey}|${dotOn}`;
    if (key === lastKey) return;
    lastKey = key;

    const W = c.width;
    const H = c.height;
    const bgDark = m.vBias > 0.56;
    const bgTone = bgDark ? m.lo : m.hi;
    const fgTone = bgDark ? m.hi : m.lo;
    const midTone = lerp(bgTone, fgTone, 0.56);
    const subTone = lerp(bgTone, fgTone, 0.22);

    ctx.fillStyle = rgbCss(bgDark ? m.darkRgb : m.lightRgb);
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = rgbCss(toneRgb(subTone));
    ctx.fillRect(W * 0.58, 0, W * 0.42, H);

    const steps = gradKey === "notan" ? 2 : 5;
    for (let i = 0; i < steps; i++) {
      const t = steps === 2 ? (i === 0 ? bgTone : fgTone) : lerp(m.lo, m.hi, i / (steps - 1));
      ctx.fillStyle = rgbCss(toneRgb(t));
      const bw = (W * 0.34) / steps;
      ctx.fillRect(W * 0.62 + i * bw, H * 0.56, bw - 3, H * 0.3);
    }

    ctx.beginPath();
    ctx.arc(W * 0.78, H * 0.31, 66, 0, Math.PI * 2);
    ctx.fillStyle = rgbCss(bgDark ? m.lightRgb : m.darkRgb);
    ctx.fill();
    if (dotOn) {
      ctx.beginPath();
      ctx.arc(W * 0.78 + 20, H * 0.31 - 14, 15, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.redHex;
      ctx.fill();
    }

    ctx.fillStyle = rgbCss(toneRgb(midTone));
    ctx.font = '600 15px "Inter", sans-serif';
    ctx.fillText("ISSUE 100 · TONAL HIERARCHY", 40, 74);

    ctx.fillStyle = rgbCss(bgDark ? m.lightRgb : m.darkRgb);
    ctx.font = '900 62px "Noto Sans SC", sans-serif';
    ctx.fillText("明暗有度", 38, 166);
    ctx.fillText("画面有力", 38, 238);

    ctx.fillStyle = rgbCss(toneRgb(midTone));
    ctx.font = '400 20px "Noto Sans SC", sans-serif';
    ctx.fillText("当明度差拉开，标题、正文与", 40, 294);
    ctx.fillText("配图自然排出阅读先后顺序。", 40, 326);

    ctx.fillStyle = rgbCss(bgDark ? m.lightRgb : m.darkRgb);
    ctx.fillRect(40, 368, 168, 48);
    ctx.fillStyle = rgbCss(bgDark ? m.darkRgb : m.lightRgb);
    ctx.font = '700 18px "Noto Sans SC", sans-serif';
    ctx.fillText("立即查看层级", 64, 399);

    ctx.strokeStyle = rgbCss(toneRgb(midTone));
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, 442);
    ctx.lineTo(W - 40, 442);
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

  // ---------- 1. 对半底面（左纸右墨） ----------
  const leftBgMat = new MeshBasicMaterial({ color: toColor(PALETTE.paper) });
  const rightBgMat = new MeshBasicMaterial({ color: toColor(PALETTE.ink) });
  const leftBg = new Mesh(new PlaneGeometry(6, 4), leftBgMat);
  const rightBg = new Mesh(new PlaneGeometry(6, 4), rightBgMat);
  leftBg.position.set(-3, 0, -4);
  rightBg.position.set(3, 0, -4);
  scene.add(leftBg, rightBg);

  // ---------- 2. 左侧斜向暗影楔（原海报左下大斜影，显式双面三角形避免背面剔除） ----------
  const shadowGeo = new BufferGeometry();
  shadowGeo.setAttribute("position", new Float32BufferAttribute([0, 0, 0, -2.5, -1.65, 0, 0, -1.65, 0], 3));
  const shadowMat = new MeshBasicMaterial({ color: toColor(PALETTE.ink), side: DoubleSide });
  const shadowWedge = new Mesh(shadowGeo, shadowMat);
  shadowWedge.position.set(0, -0.34, -2.2);
  scene.add(shadowWedge);

  // ---------- 3. 右下透视阶梯（9 条由细变粗的纸白横阶，1 次 InstancedMesh 绘制） ----------
  const STEP_N = 9;
  const stepMat = new MeshBasicMaterial({ color: 0xffffff });
  const stepsMesh = new InstancedMesh(new BoxGeometry(1, 1, 0.08), stepMat, STEP_N);
  const tmpM = new Matrix4();
  const tmpC = new Color();
  scene.add(stepsMesh);

  // ---------- 4. 雕塑底座（明暗雕塑模式下的建筑地台） ----------
  const plinthMat = new MeshBasicMaterial({ color: toColor(PALETTE.ink) });
  const plinth = new Mesh(new PlaneGeometry(6, 2), plinthMat);
  plinth.position.set(0, -1.2, -2.4);
  scene.add(plinth);

  const castShadowMat = new MeshBasicMaterial({ color: toColor(PALETTE.ink), transparent: true, opacity: 0.72 });
  const castShadow = new Mesh(new PlaneGeometry(1.4, 0.24), castShadowMat);
  castShadow.position.set(-0.35, -0.56, -1.6);
  scene.add(castShadow);

  // ---------- 5. 中央立体球 + 朱红焦点球 ----------
  const sphereMat = makeSphereShader();
  const sphere = new Mesh(new SphereGeometry(0.52, 36, 24), sphereMat);
  sphere.position.set(0, 0.16, 0);
  scene.add(sphere);

  const dotMat = new MeshBasicMaterial({ color: toColor(PALETTE.red) });
  const dotMesh = new Mesh(new SphereGeometry(0.098, 24, 16), dotMat);
  dotMesh.position.set(0.22, 0.28, 0.65);
  scene.add(dotMesh);

  // ---------- 6. 版面样本展示板 ----------
  const editorial = makeEditorialCanvas();
  const edMat = new MeshBasicMaterial({ map: editorial.tex });
  const edPlane = new Mesh(new PlaneGeometry(2.3, 1.725), edMat);
  edPlane.position.set(0, 0.04, 1.2);
  scene.add(edPlane);

  let aspect = 1.35;

  function layoutStairs(splitX, m, gradKey, openK) {
    const startY = -0.35;
    const totalH = 0.68;
    for (let i = 0; i < STEP_N; i++) {
      const f = i / (STEP_N - 1);
      const ease = f * f;
      const w = lerp(0.11, 0.76, Math.pow(f, 1.28)) * openK;
      const h = lerp(0.015, 0.064, Math.pow(f, 1.35));
      const y = startY - ease * totalH - h * 0.5;
      const x = splitX + w * 0.5;
      tmpM.makeScale(Math.max(0.001, w), h, 1);
      tmpM.setPosition(x, y, -1.5);
      stepsMesh.setMatrixAt(i, tmpM);

      if (gradKey === "notan") {
        tmpC.setRGB(m.lightRgb[0] / 255, m.lightRgb[1] / 255, m.lightRgb[2] / 255, SRGBColorSpace);
      } else {
        const stepTone =
          gradKey === "five"
            ? lerp(m.lo + (m.hi - m.lo) * 0.35, m.hi, Math.floor(f * 4.999) / 4)
            : lerp(m.lo + (m.hi - m.lo) * 0.28, m.hi, f);
        const [r, g, b] = toneRgb(stepTone);
        tmpC.setRGB(r / 255, g / 255, b / 255, SRGBColorSpace);
      }
      stepsMesh.setColorAt(i, tmpC);
    }
    stepsMesh.instanceMatrix.needsUpdate = true;
    if (stepsMesh.instanceColor) stepsMesh.instanceColor.needsUpdate = true;
  }

  return {
    el: renderer.domElement,
    resize(w, h) {
      aspect = Math.max(0.6, w / Math.max(h, 1));
      const halfH = 1.05;
      camera.left = -halfH * aspect;
      camera.right = halfH * aspect;
      camera.top = halfH;
      camera.bottom = -halfH;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    },
    render(state, openK = 1) {
      const m = tonalMetrics(state.u, state.v);
      const steps = GRADATIONS[state.gradation].steps;
      const darkCol = toColor(m.darkRgb);
      const lightCol = toColor(m.lightRgb);
      const midCol = toColor(toneRgb(m.mid));

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
        const splitX = lerp(0.18, -0.18, state.v);
        leftBg.position.x = splitX - 3;
        rightBg.position.x = splitX + 3;
        leftBgMat.color.copy(lightCol);
        rightBgMat.color.copy(darkCol);

        // 左下斜影楔：顶点精确贴在球底中轴，斜边扫向左下画框角
        const wedgeSpan = Math.max(1.2, 1.05 * aspect + splitX);
        const sp = shadowGeo.attributes.position;
        sp.setXYZ(0, 0, 0, 0);
        sp.setXYZ(1, -wedgeSpan, -0.78, 0);
        sp.setXYZ(2, 0, -0.78, 0);
        sp.needsUpdate = true;
        shadowWedge.position.set(splitX, -0.35, -2.2);
        shadowMat.color.copy(darkCol);

        layoutStairs(splitX, m, state.gradation, openK);

        const sRadius = lerp(0.86, 1.0, openK);
        sphere.scale.setScalar(sRadius);
        sphere.position.set(splitX, 0.16, 0);
        sphereMat.uniforms.uDark.value.copy(darkCol);
        sphereMat.uniforms.uLight.value.copy(lightCol);
        sphereMat.uniforms.uSteps.value = steps;
        sphereMat.uniforms.uSplitMode.value = 1.0;
        sphereMat.uniforms.uSplitX.value = splitX;
        sphereMat.uniforms.uContrast.value = state.u;
        sphereMat.uniforms.uLightDir.value.set(0.82, 0.35, 0.45).normalize();

        dotMesh.position.set(splitX + 0.22 * sRadius, 0.16 + 0.17 * sRadius, 0.72);
        dotMesh.scale.setScalar(lerp(0.6, 1, openK));
        const redMix = lerp(0.35, 1, clamp(state.u * 1.15, 0, 1));
        dotMat.color.setRGB(
          lerp(m.lightRgb[0], PALETTE.red[0], redMix) / 255,
          lerp(m.lightRgb[1], PALETTE.red[1], redMix) / 255,
          lerp(m.lightRgb[2], PALETTE.red[2], redMix) / 255,
          SRGBColorSpace,
        );
      } else if (isSculpt) {
        const bgTone = lerp(m.hi * 0.96, m.lo * 1.05, clamp(state.v, 0, 1));
        const floorTone = clamp(bgTone - 0.12 * state.u, 0, 1);
        leftBg.position.x = 0;
        leftBgMat.color.copy(toColor(toneRgb(bgTone)));
        plinthMat.color.copy(toColor(toneRgb(floorTone)));
        plinth.position.set(0, -1.16, -2.4);

        castShadowMat.color.copy(darkCol);
        castShadowMat.opacity = clamp(0.12 + state.u * 0.72, 0.1, 0.85);
        castShadow.position.set(-0.34, -0.44, -1.6);
        castShadow.scale.set(0.95 + state.u * 0.45, 0.9, 1);

        sphere.scale.setScalar(1.06 * lerp(0.9, 1, openK));
        sphere.position.set(0.06, 0.12, 0);
        sphereMat.uniforms.uDark.value.copy(darkCol);
        sphereMat.uniforms.uLight.value.copy(lightCol);
        sphereMat.uniforms.uSteps.value = steps;
        sphereMat.uniforms.uSplitMode.value = 0.0;
        sphereMat.uniforms.uContrast.value = state.u;
        sphereMat.uniforms.uLightDir.value.set(lerp(0.25, 0.88, state.u), lerp(0.55, 0.34, state.u), lerp(0.8, 0.32, state.u)).normalize();
      } else if (isEd) {
        scene.background = midCol;
        editorial.update({ ...m, vBias: state.v }, state.gradation, state.dot);
        const fitW = Math.min(2.05 * aspect, 2.55);
        const fitH = fitW * 0.75;
        const maxH = 1.68;
        const sc = fitH > maxH ? maxH / fitH : 1;
        edPlane.scale.set((fitW * sc) / 2.3, (fitH * sc) / 1.725, 1);
      }

      if (!isEd) scene.background = isSplit ? darkCol : leftBgMat.color;
      renderer.render(scene, camera);
    },
  };
}

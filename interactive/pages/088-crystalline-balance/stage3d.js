// 088 晶体式平衡 — Three.js 实时 3D 晶体引擎 + 2D 同真源多面体降级引擎
// 两者共用 model.js 同一套 buildCrystalMesh() 顶点、法线、明度与投影几何；
// 交互层（入射光源光环、缺位晶臂锁点、缝隙/重心标尺、偏振光脉）统一绘在轻量 2D 覆盖层上，
// 保证 WebGL 开启与禁用两种模式下画面、交互热区、帧率与诊断读数 100% 一致。

import * as THREE from "three";
import { loop, pixelRatio, webgl, reducedMotion } from "../../lib/stage.js";
import { buildCrystalMesh, rotatePoint } from "./model.js";

const BASE_FOV = 34;
const CAM_Z = 7.4;

function srgbToLinear(c) {
  const v = Math.max(0, Math.min(1, c / 255));
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function project3D(pt, yaw, pitch, cx, cy, scale) {
  const r = rotatePoint(pt, yaw, pitch);
  const perspective = CAM_Z / (CAM_Z - r[2]);
  return {
    x: cx + r[0] * scale * perspective,
    y: cy - r[1] * scale * perspective,
    z: r[2],
    p: perspective,
  };
}

export function createCrystalStage(hostEl, { getState, onMutate, onEval }) {
  const useGL = webgl();
  hostEl.dataset.engine = useGL ? "webgl" : "canvas2d";

  // 底层 3D WebGL 画布（仅在支持 WebGL 时创建）或纯 2D 晶体画布
  const baseCanvas = document.createElement("canvas");
  baseCanvas.className = "crystal-base-canvas";
  baseCanvas.setAttribute("aria-hidden", "true");
  hostEl.append(baseCanvas);

  // 顶层轻量 2D 光学与测角 HUD 画布（承载虚线测角环、光源拨柄、缺臂热区、偏振光脉与实时标注）
  const hudCanvas = document.createElement("canvas");
  hudCanvas.className = "crystal-hud-canvas";
  hudCanvas.setAttribute("data-perf-drag", "");
  hudCanvas.setAttribute("role", "application");
  hudCanvas.setAttribute("tabindex", "0");
  hudCanvas.setAttribute("aria-label", "3D 晶体式平衡互动台：横拖转动平行光源，点击红框锁点补全缺位晶臂，按空格发射偏振折射光脉");
  hostEl.append(hudCanvas);

  const hudCtx = hudCanvas.getContext("2d");

  // Three.js 初始化（轻量化、零 bloom 负担，慢手机 SwiftShader 下同样极速）
  let renderer = null;
  let scene = null;
  let camera = null;
  let rootGroup = null;
  let triGeo = null;
  let triMesh = null;
  let edgeGeo = null;
  let edgeLines = null;
  let ctx2d = null;

  if (useGL) {
    renderer = new THREE.WebGLRenderer({ canvas: baseCanvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(pixelRatio(1.5));
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 30);
    camera.position.set(0, 0, CAM_Z);

    rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 预分配大缓冲，避免每次状态变化重建 Geometry 引起 GC
    const MAX_VERTS = 1800;
    triGeo = new THREE.BufferGeometry();
    triGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX_VERTS * 3), 3));
    triGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(MAX_VERTS * 3), 3));
    const triMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.94,
    });
    triMesh = new THREE.Mesh(triGeo, triMat);
    rootGroup.add(triMesh);

    const MAX_EDGES = 1200;
    edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX_EDGES * 3), 3));
    edgeGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(MAX_EDGES * 3), 3));
    const edgeMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
    });
    edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    rootGroup.add(edgeLines);
  } else {
    ctx2d = baseCanvas.getContext("2d");
  }

  let width = 560;
  let height = 560;
  let dpr = pixelRatio(1.5);
  let lastMesh = null;
  let lastEval = null;
  let projectedSockets = [];
  let lightHandlePos = { x: 0, y: 0, r: 18 };
  let dirty = true;
  let introProgress = 0; // 开场 0.9s 优雅结晶微动（绝不改用户参数，只做温和呼吸）
  let hoverSocket = -1;
  let pulsePhase = -1; // >=0 表示偏振折射光脉激活

  function resize() {
    const rect = hostEl.getBoundingClientRect();
    width = Math.max(240, Math.round(rect.width));
    height = Math.max(240, Math.round(rect.height));
    dpr = pixelRatio(1.5);

    if (useGL && renderer) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    } else {
      baseCanvas.width = Math.round(width * dpr);
      baseCanvas.height = Math.round(height * dpr);
    }
    hudCanvas.width = Math.round(width * dpr);
    hudCanvas.height = Math.round(height * dpr);
    dirty = true;
  }

  const ro = new ResizeObserver(resize);
  ro.observe(hostEl);
  resize();

  // 更新 Three.js 缓冲（严格读 buildCrystalMesh 单真源）
  function syncWebGLGeometry(mesh, state) {
    const posArr = triGeo.attributes.position.array;
    const colArr = triGeo.attributes.color.array;
    const hl = state.highlightKey;
    let vi = 0;

    for (const f of mesh.faces) {
      // 高亮特定结构层时略微提亮该层、微降无关层饱和度
      let boost = 1.0;
      if (hl === "structure" && f.part === "core") boost = 1.15;
      else if (hl === "growth" && f.part === "bud") boost = 1.22;
      else if (hl === "symmetry" && (f.part === "primary" || f.part === "diag")) boost = 1.12;
      else if (hl && hl !== "balance" && hl !== "refraction") boost = 0.84;

      const r = srgbToLinear(Math.min(255, f.shadeColor[0] * boost));
      const g = srgbToLinear(Math.min(255, f.shadeColor[1] * boost));
      const b = srgbToLinear(Math.min(255, f.shadeColor[2] * boost));

      for (let k = 0; k < 3; k++) {
        const p = f.verts[k];
        posArr[vi] = p[0];
        posArr[vi + 1] = p[1];
        posArr[vi + 2] = p[2];
        colArr[vi] = r;
        colArr[vi + 1] = g;
        colArr[vi + 2] = b;
        vi += 3;
      }
    }
    triGeo.setDrawRange(0, vi / 3);
    triGeo.attributes.position.needsUpdate = true;
    triGeo.attributes.color.needsUpdate = true;

    // 棱脊高光线
    const ePos = edgeGeo.attributes.position.array;
    const eCol = edgeGeo.attributes.color.array;
    let ei = 0;
    for (const [a, b, part] of mesh.edges) {
      const isSoft = part === "coreSoft";
      const er = isSoft ? 0.78 : 0.96;
      const eg = isSoft ? 0.87 : 0.98;
      const eb = 1.0;
      ePos[ei] = a[0]; ePos[ei + 1] = a[1]; ePos[ei + 2] = a[2] + 0.004;
      eCol[ei] = er; eCol[ei + 1] = eg; eCol[ei + 2] = eb;
      ei += 3;
      ePos[ei] = b[0]; ePos[ei + 1] = b[1]; ePos[ei + 2] = b[2] + 0.004;
      eCol[ei] = er; eCol[ei + 1] = eg; eCol[ei + 2] = eb;
      ei += 3;
    }
    edgeGeo.setDrawRange(0, ei / 3);
    edgeGeo.attributes.position.needsUpdate = true;
    edgeGeo.attributes.color.needsUpdate = true;
  }

  // 关 WebGL 时同真源 2D 多面体绘制器（带真实 Z 深度排序与切面高光线）
  function drawFallback2D(mesh, state, yaw, pitch, cx, cy, scale) {
    ctx2d.save();
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx2d.clearRect(0, 0, width, height);

    const hl = state.highlightKey;
    const sorted = mesh.faces.map((f) => {
      const pts = f.verts.map((v) => project3D(v, yaw, pitch, cx, cy, scale));
      const avgZ = (pts[0].z + pts[1].z + pts[2].z) / 3;
      return { f, pts, avgZ };
    }).sort((a, b) => a.avgZ - b.avgZ);

    for (const { f, pts } of sorted) {
      let boost = 1.0;
      if (hl === "structure" && f.part === "core") boost = 1.15;
      else if (hl === "growth" && f.part === "bud") boost = 1.22;
      else if (hl && hl !== "balance" && hl !== "refraction") boost = 0.86;
      const r = Math.min(255, Math.round(f.shadeColor[0] * boost));
      const g = Math.min(255, Math.round(f.shadeColor[1] * boost));
      const b = Math.min(255, Math.round(f.shadeColor[2] * boost));
      ctx2d.beginPath();
      ctx2d.moveTo(pts[0].x, pts[0].y);
      ctx2d.lineTo(pts[1].x, pts[1].y);
      ctx2d.lineTo(pts[2].x, pts[2].y);
      ctx2d.closePath();
      ctx2d.fillStyle = `rgba(${r},${g},${b},0.94)`;
      ctx2d.fill();
      ctx2d.strokeStyle = "rgba(244,248,255,0.42)";
      ctx2d.lineWidth = 0.7;
      ctx2d.stroke();
    }

    // 清晰冰白棱脊线
    ctx2d.lineWidth = 1.05;
    for (const [a, b, part] of mesh.edges) {
      const pa = project3D(a, yaw, pitch, cx, cy, scale);
      const pb = project3D(b, yaw, pitch, cx, cy, scale);
      ctx2d.beginPath();
      ctx2d.moveTo(pa.x, pa.y);
      ctx2d.lineTo(pb.x, pb.y);
      ctx2d.strokeStyle = part === "coreSoft" ? "rgba(218,232,255,0.55)" : "rgba(248,251,255,0.84)";
      ctx2d.stroke();
    }
    ctx2d.restore();
  }

  // 绘制 088 原海报风格淡蓝辅助测角虚线环、光源拨柄、缺臂锁点、实测缝隙与偏振光脉
  function drawHud(mesh, ev, state, yaw, pitch, cx, cy, scale, t) {
    const ctx = hudCtx;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const minDim = Math.min(width, height);
    const ringOuter = minDim * 0.43;
    const ringInner = minDim * 0.285;
    const hl = state.highlightKey;

    // 1) 原海报同款精细淡蓝灰六角晶格与同心虚线圆环（背景构图骨架）
    if (state.showGuides) {
      ctx.save();
      ctx.strokeStyle = hl === "symmetry" ? "rgba(41,99,180,0.46)" : "rgba(113,142,205,0.28)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, ringOuter, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, ringInner, 0, Math.PI * 2);
      ctx.stroke();

      // 轴线骨架（按当前晶系绘制对称轴）
      const axisCount = state.symmetry === "d6" ? 6 : state.symmetry === "d4" ? 4 : 4;
      const baseDeg = state.symmetry === "d6" ? 90 : 0;
      ctx.strokeStyle = ev.dims.symmetry.ok ? "rgba(41,99,180,0.24)" : "rgba(184,41,61,0.22)";
      ctx.setLineDash([3, 6]);
      for (let i = 0; i < axisCount; i++) {
        const a = ((baseDeg + (i * 180) / axisCount) * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(a) * (ringOuter + 10), cy + Math.sin(a) * (ringOuter + 10));
        ctx.lineTo(cx + Math.cos(a) * (ringOuter + 10), cy - Math.sin(a) * (ringOuter + 10));
        ctx.stroke();
      }

      // 六角外切微晶虚线框（呼应原海报底图六角晶格）
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = "rgba(113,142,205,0.22)";
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = Math.PI / 6 + (i * Math.PI) / 3;
        const hx = cx + Math.cos(a) * (ringOuter * 0.92);
        const hy = cy - Math.sin(a) * (ringOuter * 0.92);
        if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 2) 平行入射光源轨道与可拖光点（横拖画布即旋转此光源）
    const lRad = (state.lightAngle * Math.PI) / 180;
    const lx = cx + Math.cos(lRad) * ringOuter;
    const ly = cy - Math.sin(lRad) * ringOuter;
    lightHandlePos = { x: lx, y: ly, r: 22 };

    // 平行折射光束入射引导线
    ctx.save();
    const grad = ctx.createLinearGradient(lx, ly, cx, cy);
    grad.addColorStop(0, "rgba(41,99,180,0.52)");
    grad.addColorStop(1, "rgba(139,139,222,0.04)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = hl === "refraction" ? 2.4 : 1.4;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // 菱形光源晶标（贴合晶体多面几何气质）
    ctx.translate(lx, ly);
    ctx.rotate(-lRad + Math.PI / 4);
    ctx.fillStyle = "#1D4F9A";
    ctx.strokeStyle = "#F7F9FC";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(8, 0); ctx.lineTo(0, 8); ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 光源角度小签
    ctx.save();
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    const lightTxt = `入射光 ${Math.round(state.lightAngle)}°`;
    const ltw = ctx.measureText(lightTxt).width + 12;
    const lbx = Math.max(8, Math.min(width - ltw - 8, lx + (lx > cx ? -ltw - 12 : 12)));
    const lby = Math.max(10, Math.min(height - 26, ly - 10));
    ctx.fillStyle = "rgba(247,249,252,0.92)";
    ctx.strokeStyle = "rgba(41,99,180,0.45)";
    ctx.lineWidth = 1;
    ctx.fillRect(lbx, lby, ltw, 20);
    ctx.strokeRect(lbx, lby, ltw, 20);
    ctx.fillStyle = "#152049";
    ctx.fillText(lightTxt, lbx + 6, lby + 14);
    ctx.restore();

    // 3) 缺位晶臂锁点（点击直接补全）与已落位斜晶微点（点击也可拆开试错）
    projectedSockets = [];
    for (const s of mesh.sockets) {
      const p = project3D(s.pos3, yaw, pitch, cx, cy, scale);
      const item = { ...s, x: p.x, y: p.y };
      projectedSockets.push(item);

      if (s.missing) {
        const isHov = hoverSocket === s.index;
        const pulse = reducedMotion.matches ? 1 : 0.9 + 0.1 * Math.sin(t * 4.5);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(-s.angleRad);
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = isHov ? "#B8293D" : "rgba(184,41,61,0.85)";
        ctx.fillStyle = isHov ? "rgba(184,41,61,0.16)" : "rgba(184,41,61,0.08)";
        ctx.lineWidth = isHov ? 2 : 1.5;
        const rh = 16 * pulse, rw = 26 * pulse;
        ctx.beginPath();
        ctx.moveTo(-rw, 0); ctx.lineTo(0, -rh); ctx.lineTo(rw, 0); ctx.lineTo(0, rh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 标注「+ 补晶臂」
        ctx.save();
        ctx.font = '600 11px "Noto Sans SC", sans-serif';
        const tag = "+ 补晶臂";
        const tw = ctx.measureText(tag).width + 12;
        const tx = Math.max(6, Math.min(width - tw - 6, p.x - tw / 2));
        const ty = Math.max(6, Math.min(height - 24, p.y - 10));
        ctx.fillStyle = "#B8293D";
        ctx.fillRect(tx, ty, tw, 20);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(tag, tx + 6, ty + 14);
        ctx.restore();
      } else if (!s.isPrimary && (hoverSocket === s.index || hl === "symmetry")) {
        ctx.save();
        ctx.fillStyle = "rgba(41,99,180,0.85)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 4) 脱节/挤爆实测红蓝双箭头标尺（有结构问题或高亮 structure 时显示）
    if (!ev.dims.structure.ok || hl === "structure") {
      const innerP = project3D([mesh.coreRadius * 0.90, 0, 0], yaw, pitch, cx, cy, scale);
      const outerP = project3D([mesh.coreRadius * 0.90 + state.gap * 1.05, 0, 0], yaw, pitch, cx, cy, scale);
      ctx.save();
      ctx.strokeStyle = ev.dims.structure.ok ? "#0F6E57" : "#B8293D";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(innerP.x, innerP.y - 16);
      ctx.lineTo(outerP.x, outerP.y - 16);
      ctx.stroke();

      ctx.font = '500 11px "IBM Plex Mono", "Noto Sans SC", sans-serif';
      const gapLabel = ev.dims.structure.tag;
      const gw = ctx.measureText(gapLabel).width + 12;
      const gx = Math.max(6, Math.min(width - gw - 6, (innerP.x + outerP.x) / 2 - gw / 2));
      const gy = Math.max(8, innerP.y - 40);
      ctx.fillStyle = ev.dims.structure.ok ? "#0F6E57" : "#B8293D";
      ctx.fillRect(gx, gy, gw, 20);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(gapLabel, gx + 6, gy + 14);
      ctx.restore();
    }

    // 5) 重心偏离红矢（当对称失稳 ΔG > 6% 时实时标出重心拉偏方向）
    if (ev.metrics.comOffsetPct > 6) {
      const comP = project3D([ev.metrics.comX * 2.2, ev.metrics.comY * 2.2, 0.25], yaw, pitch, cx, cy, scale);
      ctx.save();
      ctx.strokeStyle = "#B8293D";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(comP.x, comP.y);
      ctx.stroke();
      ctx.fillStyle = "#B8293D";
      ctx.beginPath();
      ctx.arc(comP.x, comP.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '500 11px "IBM Plex Mono", "Noto Sans SC", sans-serif';
      const cTag = `重心偏 ${ev.metrics.comOffsetPct}%`;
      const cw = ctx.measureText(cTag).width + 10;
      const clx = Math.max(6, Math.min(width - cw - 6, comP.x + 8));
      const cly = Math.max(6, Math.min(height - 22, comP.y + 6));
      ctx.fillStyle = "rgba(184,41,61,0.92)";
      ctx.fillRect(clx, cly, cw, 19);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(cTag, clx + 5, cly + 13);
      ctx.restore();
    }

    // 6) 偏振折射光脉（按 Space 发射：从入射光源进入晶核，沿所有就位晶臂切面折射向外喷薄）
    if (pulsePhase >= 0 && pulsePhase <= 1.0) {
      ctx.save();
      const inT = Math.min(1, pulsePhase / 0.35);
      const bx = lx + (cx - lx) * inT;
      const by = ly + (cy - ly) * inT;

      // 入射段光脉
      ctx.strokeStyle = "rgba(123,179,255,0.92)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lx + (cx - lx) * Math.max(0, inT - 0.3), ly + (cy - ly) * Math.max(0, inT - 0.3));
      ctx.lineTo(bx, by);
      ctx.stroke();

      // 折射展开段（0.32 -> 1.0）
      if (pulsePhase > 0.32) {
        const outT = (pulsePhase - 0.32) / 0.68;
        const alpha = Math.sin(outT * Math.PI);
        // 切面死平或脱节时，光脉衰减变红/散失，直观体现“折射断流”
        const isGoodRefract = ev.dims.refraction.ok && ev.dims.structure.ok;
        for (const s of projectedSockets) {
          if (s.missing) continue;
          const distScale = isGoodRefract ? 1.28 : 0.62;
          const ex = cx + (s.x - cx) * distScale * outT;
          const ey = cy + (s.y - cy) * distScale * outT;
          const rayGrad = ctx.createLinearGradient(cx, cy, ex, ey);
          if (isGoodRefract) {
            rayGrad.addColorStop(0, `rgba(255,255,255,${0.9 * alpha})`);
            rayGrad.addColorStop(0.5, `rgba(123,179,255,${0.85 * alpha})`);
            rayGrad.addColorStop(1, `rgba(155,148,242,${0.25 * alpha})`);
          } else {
            rayGrad.addColorStop(0, `rgba(184,41,61,${0.75 * alpha})`);
            rayGrad.addColorStop(1, `rgba(184,41,61,0.05)`);
          }
          ctx.strokeStyle = rayGrad;
          ctx.lineWidth = isGoodRefract ? 3.2 : 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(ex, ey);
          ctx.stroke();

          ctx.fillStyle = isGoodRefract ? `rgba(240,247,255,${alpha})` : `rgba(184,41,61,${alpha})`;
          ctx.beginPath();
          ctx.arc(ex, ey, isGoodRefract ? 4.2 : 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 7) 舞台左下角引擎与单真源速览小标（极克制，避免遮挡晶体）
    ctx.save();
    ctx.font = '500 10.5px "IBM Plex Mono", monospace';
    const modeStr = `${useGL ? "3D WEBGL" : "2D OPTICS"} · 光差 ${ev.metrics.contrastPct}% · ΔG ${ev.metrics.comOffsetPct}%`;
    const mw = ctx.measureText(modeStr).width + 12;
    ctx.fillStyle = "rgba(234,238,242,0.88)";
    ctx.fillRect(8, height - 26, mw, 19);
    ctx.fillStyle = "#1A223A";
    ctx.fillText(modeStr, 14, height - 13);
    ctx.restore();

    ctx.restore();
  }

  function renderFrame(t, dt, { still }) {
    const state = getState();
    const animActive = !still && !reducedMotion.matches;

    if (still) {
      introProgress = 1;
    } else if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.15);
      dirty = true;
    }

    if (pulsePhase >= 0) {
      pulsePhase += animActive ? Math.max(dt, 0.016) * 0.92 : 1.0;
      if (pulsePhase > 1.0) pulsePhase = -1;
      dirty = true;
    }

    // 温和晶体呼吸微倾（仅影响视觉观察姿态，绝不篡改用户单真源参数）
    const breathYaw = animActive ? Math.sin(t * 0.65) * 0.035 : 0;
    const breathPitch = animActive ? Math.cos(t * 0.48) * 0.025 : 0;
    const yaw = state.viewYaw + breathYaw;
    const pitch = state.viewPitch + breathPitch;

    if (!dirty && !animActive) return;

    const mesh = buildCrystalMesh(state);
    lastMesh = mesh;
    if (dirty || !lastEval) {
      lastEval = onEval(mesh);
      dirty = false;
    }

    const cx = width / 2;
    const cy = height / 2;
    // 与 Three.js 34° FOV 在 Z=5.4 处严格对齐的投影缩放比
    const fovRad = (BASE_FOV * Math.PI) / 180;
    const visH = 2 * Math.tan(fovRad / 2) * CAM_Z;
    const scale = (height / visH) * (width < height ? width / height : 1) * 0.96;

    if (useGL && renderer) {
      syncWebGLGeometry(mesh, state);
      rootGroup.rotation.order = "YXZ";
      rootGroup.rotation.y = yaw;
      rootGroup.rotation.x = pitch;
      const sc = width < height ? (width / height) * 0.96 : 0.96;
      rootGroup.scale.setScalar(sc);
      renderer.render(scene, camera);
    } else if (ctx2d) {
      drawFallback2D(mesh, state, yaw, pitch, cx, cy, scale);
    }

    drawHud(mesh, lastEval, state, yaw, pitch, cx, cy, scale, t);
  }

  const ctrl = loop(hostEl, renderFrame);

  // --- 交互事件：横拖转动光源（或旋看晶簇）、点击红框锁点补全/拆开晶臂、触摸友好不锁竖滑 ---
  let drag = null;

  function canvasPoint(e) {
    const rect = hudCanvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function findSocketHit(px, py) {
    let best = -1;
    let bestD = 30;
    for (const s of projectedSockets) {
      const d = Math.hypot(s.x - px, s.y - py);
      if (d < bestD) {
        bestD = d;
        best = s.index;
      }
    }
    return best;
  }

  hudCanvas.addEventListener("pointerdown", (e) => {
    const p = canvasPoint(e);
    const state = getState();
    drag = {
      id: e.pointerId,
      startX: p.x,
      startY: p.y,
      lastX: p.x,
      lastY: p.y,
      moved: false,
      lockedHorizontal: false,
      startLight: state.lightAngle,
      startYaw: state.viewYaw,
      startPitch: state.viewPitch,
      isTouch: e.pointerType === "touch",
    };
    try { hudCanvas.setPointerCapture(e.pointerId); } catch {}
  });

  hudCanvas.addEventListener("pointermove", (e) => {
    const p = canvasPoint(e);
    if (!drag) {
      const hit = findSocketHit(p.x, p.y);
      if (hit !== hoverSocket) {
        hoverSocket = hit;
        hudCanvas.style.cursor = hit >= 0 ? "pointer" : "ew-resize";
        dirty = true;
        ctrl.draw();
      }
      return;
    }

    const dx = p.x - drag.startX;
    const dy = p.y - drag.startY;

    // 触屏下若纵向滑动明显大于横向，放手让浏览器滚动页面
    if (drag.isTouch && !drag.lockedHorizontal) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.25) {
        try { hudCanvas.releasePointerCapture(drag.id); } catch {}
        drag = null;
        return;
      }
      if (Math.abs(dx) > 6) drag.lockedHorizontal = true;
    }

    if (Math.hypot(dx, dy) > 5) drag.moved = true;
    if (!drag.moved) return;

    const state = getState();
    if (state.dragMode === "orbit") {
      const nextYaw = Math.max(-0.95, Math.min(0.95, drag.startYaw + dx * 0.008));
      const nextPitch = Math.max(-0.65, Math.min(0.65, drag.startPitch + dy * 0.006));
      onMutate({ viewYaw: nextYaw, viewPitch: nextPitch });
    } else {
      // 横向拖动像转动单色平行光源一样连续改变入射光角（带 34° 经典黄金侧光轻吸附）
      let nextAngle = (drag.startLight - dx * 0.65) % 360;
      if (nextAngle < 0) nextAngle += 360;
      if (Math.abs(nextAngle - 34) < 3.5) nextAngle = 34;
      onMutate({ lightAngle: Math.round(nextAngle) });
    }
    drag.lastX = p.x;
    drag.lastY = p.y;
  });

  function endDrag(e) {
    if (!drag) return;
    const p = canvasPoint(e);
    const wasClick = !drag.moved;
    drag = null;
    if (wasClick) {
      const hit = findSocketHit(p.x, p.y);
      if (hit >= 0) {
        const state = getState();
        const cur = new Set(state.missingArms || []);
        if (cur.has(hit)) {
          cur.delete(hit);
          // 补齐所有缺臂时若原为 broken，顺势把轴线偏扭归正、回到原海报完整晶系
          const nextArr = [...cur];
          const patch = { missingArms: nextArr };
          if (nextArr.length === 0 && state.symmetry === "broken") {
            patch.symmetry = "poster";
            patch.armSkew = 0;
          }
          onMutate(patch);
        } else {
          // 点击已就位的非主晶臂允许用户手动拆开试错！
          cur.add(hit);
          onMutate({ missingArms: [...cur] });
        }
      }
    }
  }

  hudCanvas.addEventListener("pointerup", endDrag);
  hudCanvas.addEventListener("pointercancel", () => { drag = null; });

  // 键盘操作：左右键转光源，上下键调咬合缝，Space 发射偏振光脉
  hudCanvas.addEventListener("keydown", (e) => {
    const state = getState();
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onMutate({ lightAngle: (state.lightAngle + 8) % 360 });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onMutate({ lightAngle: (state.lightAngle + 352) % 360 });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onMutate({ gap: Math.max(-0.14, +(state.gap - 0.04).toFixed(2)) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onMutate({ gap: Math.min(0.36, +(state.gap + 0.04).toFixed(2)) });
    } else if (e.key === " ") {
      e.preventDefault();
      triggerPulse();
    }
  });

  function triggerPulse() {
    pulsePhase = 0;
    dirty = true;
    ctrl.draw();
  }

  function invalidate() {
    dirty = true;
    ctrl.draw();
  }

  return {
    invalidate,
    triggerPulse,
    getLastMesh: () => lastMesh,
    isWebGL: useGL,
  };
}

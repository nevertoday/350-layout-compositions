// 086 深空间构图 · 实时 3D 走廊引擎（Three.js WebGL + 共用 model.js 的 2D 透视降级引擎）
// 1:1 承袭 086 原海报暖米宣纸、深松青嵌套门框、前景暗叶、日光石阶、朱红引导线、无五官红人剪影与远山赤日。

import * as THREE from "three";
import { loop, pixelRatio, reducedMotion, webgl } from "../../lib/stage.js";
import { SCENES, clamp, computeLayout, lerp, makeCameraBasis, projectPoint } from "./model.js";

// 生成带门洞的 2D Shape（矩形 / 月洞圆 / 拱门），给 Three.js ShapeGeometry 零贴图低耗绘制
function makePortalShape(outerW, outerH, openW, openH, archShape) {
  const s = new THREE.Shape();
  const hw = outerW / 2;
  s.moveTo(-hw, 0);
  s.lineTo(hw, 0);
  s.lineTo(hw, outerH);
  s.lineTo(-hw, outerH);
  s.closePath();

  const hole = new THREE.Path();
  if (archShape === "moon") {
    const r = Math.min(openW * 0.48, openH * 0.44);
    const cy = openH * 0.48;
    hole.absarc(0, cy, r, 0, Math.PI * 2, true);
  } else if (archShape === "arch") {
    const rw = openW / 2;
    const archStart = Math.max(0.4, openH - rw * 0.85);
    hole.moveTo(-rw, 0.01);
    hole.lineTo(-rw, archStart);
    hole.absellipse(0, archStart, rw, openH - archStart, Math.PI, 0, true, 0);
    hole.lineTo(rw, 0.01);
    hole.closePath();
  } else {
    const rw = openW / 2;
    hole.moveTo(-rw, 0.01);
    hole.lineTo(-rw, openH);
    hole.lineTo(rw, openH);
    hole.lineTo(rw, 0.01);
    hole.closePath();
  }
  s.holes.push(hole);
  return s;
}

// 无五官简约行者剪影（严格遵守画人不画五官的规矩，圆润头肩背影，不尖顶）
function makeFigureGroup(h, color, opacity = 1) {
  const grp = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    fog: false,
    transparent: opacity < 1,
    opacity,
  });
  const u = h / 10;
  // 圆润剪影头部
  const head = new THREE.Mesh(new THREE.CircleGeometry(0.76 * u, 24), mat);
  head.position.set(0, 9.1 * u, 0);
  grp.add(head);

  // 身躯与迈步双腿剪影
  const body = new THREE.Shape();
  body.moveTo(-0.46 * u, 0);
  body.lineTo(-0.18 * u, 0);
  body.lineTo(-0.02 * u, 3.6 * u);
  body.lineTo(0.16 * u, 0);
  body.lineTo(0.46 * u, 0);
  body.lineTo(0.32 * u, 4.4 * u);
  body.lineTo(0.84 * u, 5.1 * u);
  body.lineTo(0.92 * u, 7.45 * u);
  body.quadraticCurveTo(0.82 * u, 8.2 * u, 0, 8.25 * u);
  body.quadraticCurveTo(-0.82 * u, 8.2 * u, -0.92 * u, 7.45 * u);
  body.lineTo(-0.84 * u, 5.1 * u);
  body.lineTo(-0.32 * u, 4.4 * u);
  body.closePath();
  grp.add(new THREE.Mesh(new THREE.ShapeGeometry(body), mat));
  return grp;
}

// 前景叶影剪影（原海报右侧竹/榕叶与左侧低丛）
function makeLeafClusterShape(side, sceneId) {
  const s = new THREE.Shape();
  if (sceneId === "cinema") {
    // 影院模式：暗前景柱廊斜切侧墙与吊灯边缘剪影
    if (side === "right") {
      s.moveTo(0, -1.6);
      s.lineTo(2.4, -1.6);
      s.lineTo(2.4, 3.8);
      s.lineTo(0.15, 3.8);
      s.lineTo(0.15, 2.75);
      s.lineTo(0, 2.55);
      s.closePath();
    } else {
      s.moveTo(-2.2, -1.6);
      s.lineTo(0, -1.6);
      s.lineTo(-0.18, 2.6);
      s.lineTo(-2.2, 2.9);
      s.closePath();
    }
    return s;
  }
  // 原海报 & 园林：利落东方枝叶剪影
  if (side === "right") {
    s.moveTo(2.5, -1.4);
    s.lineTo(2.5, 3.6);
    s.lineTo(0.7, 3.6);
    // 顶部斜探枝叶 1
    s.quadraticCurveTo(0.25, 3.0, -0.05, 2.85);
    s.quadraticCurveTo(0.42, 2.68, 0.82, 2.48);
    // 中上细叶 2
    s.quadraticCurveTo(0.12, 2.28, -0.32, 2.02);
    s.quadraticCurveTo(0.22, 1.85, 0.65, 1.72);
    // 中腰主叶 3（呼应原海报最长的横探叶）
    s.quadraticCurveTo(-0.08, 1.56, -0.52, 1.32);
    s.quadraticCurveTo(0.06, 1.12, 0.58, 1.05);
    // 中下斜叶 4
    s.quadraticCurveTo(0.05, 0.72, -0.25, 0.42);
    s.quadraticCurveTo(0.28, 0.42, 0.72, 0.35);
    // 低叶 5
    s.quadraticCurveTo(0.35, -0.1, 0.08, -0.45);
    s.quadraticCurveTo(0.55, -0.55, 0.85, -1.4);
    s.closePath();
  } else {
    s.moveTo(-2.4, -1.5);
    s.lineTo(-2.4, 2.0);
    s.lineTo(-0.6, 1.85);
    s.quadraticCurveTo(-0.15, 1.38, 0.18, 1.18);
    s.quadraticCurveTo(-0.22, 0.95, -0.52, 0.72);
    s.quadraticCurveTo(0.05, 0.45, 0.38, 0.16);
    s.quadraticCurveTo(-0.12, 0.02, -0.48, -0.2);
    s.quadraticCurveTo(0.02, -0.55, 0.22, -0.95);
    s.lineTo(-0.4, -1.5);
    s.closePath();
  }
  return s;
}

// 远山剪影 Shape
function makeMountainShape(layerIdx) {
  const s = new THREE.Shape();
  const w = 18;
  const profiles = [
    [[-w, 0], [-9, 4.1], [-5.2, 2.6], [-2.1, 5.2], [1.4, 3.1], [4.8, 5.6], [9.4, 2.9], [w, 0]],
    [[-w, 0], [-10, 5.5], [-4.4, 4.0], [-0.4, 6.7], [3.6, 4.6], [7.8, 7.1], [12, 4.2], [w, 0]],
    [[-w, 0], [-11, 6.9], [-6.0, 5.4], [-1.8, 8.2], [2.5, 6.2], [6.6, 8.6], [11.5, 6.0], [w, 0]],
  ];
  const pts = profiles[layerIdx % profiles.length];
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}

// =========================================================================
// 主走廊控制器：自动选择 Three.js WebGL 或 2D 透视引擎，保持零报错、高帧率
// =========================================================================
export function createCorridorStage(hostEl, overlayCanvas, getState, onAction) {
  const useGL = webgl();
  let width = 800;
  let height = 600;
  let introProgress = reducedMotion.matches ? 1 : 0;
  let cutawayBlend = getState().cutaway ? 1 : 0;
  let pulsePhase = -1; // -1 = 未播放，0..1 = 视线脉冲正在前进
  let dirty = true;
  let builtSceneKey = "";

  // Three.js 对象（仅 useGL === true 时初始化）
  let renderer = null;
  let scene = null;
  let camera = null;
  let rootGroup = null;
  let portalSlots = [];
  let floorMesh = null;
  let tileLines = null;
  let stairsGroup = null;
  let figureMesh = null;
  let figureReflect = null;
  let sunMesh = null;
  let mountainMeshes = [];
  let fgRightMesh = null;
  let fgLeftMesh = null;
  let guideLineObj = null;
  let guidePulseDot = null;
  let cutawayGrid = null;

  // 2D 降级画布（仅 !useGL 时创建）
  let fallbackCanvas = null;
  let fallbackCtx = null;

  const overlayCtx = overlayCanvas.getContext("2d");

  if (useGL) {
    const isNarrow = window.innerWidth <= 640;
    renderer = new THREE.WebGLRenderer({
      antialias: !isNarrow,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(isNarrow ? 1 : pixelRatio(2));
    renderer.domElement.className = "corridor-gl";
    renderer.domElement.setAttribute("aria-hidden", "true");
    hostEl.insertBefore(renderer.domElement, overlayCanvas);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.1, 140);
    rootGroup = new THREE.Group();
    scene.add(rootGroup);
  } else {
    fallbackCanvas = document.createElement("canvas");
    fallbackCanvas.className = "corridor-gl";
    fallbackCanvas.setAttribute("aria-hidden", "true");
    hostEl.insertBefore(fallbackCanvas, overlayCanvas);
    fallbackCtx = fallbackCanvas.getContext("2d");
  }

  function clearThreeGroup() {
    if (!rootGroup) return;
    while (rootGroup.children.length) {
      const ch = rootGroup.children[0];
      rootGroup.remove(ch);
      ch.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }
    portalSlots = [];
    mountainMeshes = [];
  }

  // 按场景主题重建轻量几何（仅场景切换或门框重数变化时调用）
  function rebuildThreeScene(state) {
    if (!useGL) return;
    const theme = SCENES[state.scene];
    const key = `${state.scene}:${state.portalCount}`;
    if (key === builtSceneKey) return;
    builtSceneKey = key;

    clearThreeGroup();
    scene.background = new THREE.Color(theme.bgHex);
    scene.fog = new THREE.Fog(theme.fogHex, 24, 72);

    // 1. 远山三层
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.ShapeGeometry(makeMountainShape(i));
      const mat = new THREE.MeshBasicMaterial({
        color: theme.mountainPalette[i],
        side: THREE.DoubleSide,
        fog: true,
      });
      const m = new THREE.Mesh(geo, mat);
      rootGroup.add(m);
      mountainMeshes.push(m);
    }

    // 2. 远处赤日
    sunMesh = new THREE.Mesh(
      new THREE.CircleGeometry(1, 36),
      new THREE.MeshBasicMaterial({ color: theme.sunHex, fog: false })
    );
    rootGroup.add(sunMesh);

    // 3. 日光石板步道（单位 1×1 平面，实时按 floorLen 缩放）
    floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: theme.floorLight, side: THREE.DoubleSide })
    );
    floorMesh.rotation.x = -Math.PI / 2;
    rootGroup.add(floorMesh);

    // 石板透视网格线（地板横缝与中轴纵缝）
    const tilePos = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      tilePos.push(-0.5, 0.006, -t, 0.5, 0.006, -t);
    }
    for (const u of [-0.36, -0.14, 0.14, 0.36]) {
      tilePos.push(u, 0.006, 0, u, 0.006, -1);
    }
    const tileGeo = new THREE.BufferGeometry();
    tileGeo.setAttribute("position", new THREE.Float32BufferAttribute(tilePos, 3));
    tileLines = new THREE.LineSegments(
      tileGeo,
      new THREE.LineBasicMaterial({ color: theme.floorTile, transparent: true, opacity: 0.75 })
    );
    rootGroup.add(tileLines);

    // 4. 前景石阶（原海报右下角深松青三级石阶，固定贴近第一道门前沿）
    stairsGroup = new THREE.Group();
    const stepColors = [theme.stairDark, theme.stairMid, theme.stairDark];
    for (let i = 0; i < 3; i++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(5.2, 0.16, 0.56),
        new THREE.MeshBasicMaterial({ color: stepColors[i] })
      );
      step.position.set(0.58, -0.38 + i * 0.15, -1.75 - i * 0.56);
      stairsGroup.add(step);
      const topStrip = new THREE.Mesh(
        new THREE.PlaneGeometry(5.2, 0.52),
        new THREE.MeshBasicMaterial({ color: theme.floorLight, side: THREE.DoubleSide })
      );
      topStrip.rotation.x = -Math.PI / 2;
      topStrip.position.set(0.58, -0.295 + i * 0.15, -1.75 - i * 0.56);
      stairsGroup.add(topStrip);
    }
    rootGroup.add(stairsGroup);

    // 5. 嵌套门框群组（1..5重，含正立面 + 内框厚壁，展现真 3D 厚度）
    const layout = computeLayout(state, 0, width / Math.max(1, height));
    for (let i = 0; i < layout.portals.length; i++) {
      const p = layout.portals[i];
      const grp = new THREE.Group();
      const color = theme.portalPalette[Math.min(i, theme.portalPalette.length - 1)];
      const bevel = theme.portalBevel[Math.min(i, theme.portalBevel.length - 1)];

      const frontFace = new THREE.Mesh(
        new THREE.ShapeGeometry(makePortalShape(p.outerW, p.outerH, p.openW, p.openH, theme.archShape)),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
      );
      grp.add(frontFace);

      // 门框内侧厚壁与顶檐（体现立体厚度，在侧剖 X-Ray 里格外清楚）
      const sideMat = new THREE.MeshBasicMaterial({ color: bevel, side: THREE.DoubleSide });
      const darkSideMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
      if (theme.archShape === "rect") {
        // 左右内门柱厚壁 + 顶梁下檐
        const leftJamb = new THREE.Mesh(new THREE.PlaneGeometry(p.thickness, p.openH), sideMat);
        leftJamb.rotation.y = Math.PI / 2;
        leftJamb.position.set(-p.openW / 2 + 0.005, p.openH / 2, -p.thickness / 2);
        grp.add(leftJamb);

        const rightJamb = new THREE.Mesh(new THREE.PlaneGeometry(p.thickness, p.openH), darkSideMat);
        rightJamb.rotation.y = -Math.PI / 2;
        rightJamb.position.set(p.openW / 2 - 0.005, p.openH / 2, -p.thickness / 2);
        grp.add(rightJamb);

        const soffit = new THREE.Mesh(new THREE.PlaneGeometry(p.openW, p.thickness), sideMat);
        soffit.rotation.x = Math.PI / 2;
        soffit.position.set(0, p.openH - 0.005, -p.thickness / 2);
        grp.add(soffit);
      }

      // 外侧壁（切到 3D 侧剖时看到清晰建筑薄墙厚度）
      const outerRightWall = new THREE.Mesh(new THREE.PlaneGeometry(p.thickness, p.outerH), darkSideMat);
      outerRightWall.rotation.y = Math.PI / 2;
      outerRightWall.position.set(p.outerW / 2, p.outerH / 2, -p.thickness / 2);
      grp.add(outerRightWall);

      const outerTopCap = new THREE.Mesh(new THREE.PlaneGeometry(p.outerW, p.thickness), sideMat);
      outerTopCap.rotation.x = -Math.PI / 2;
      outerTopCap.position.set(0, p.outerH, -p.thickness / 2);
      grp.add(outerTopCap);

      // 补一片背立面，让 3D 侧剖时墙体双面厚实
      const backFace = new THREE.Mesh(
        new THREE.ShapeGeometry(makePortalShape(p.outerW, p.outerH, p.openW, p.openH, theme.archShape)),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
      );
      backFace.position.z = -p.thickness;
      grp.add(backFace);

      rootGroup.add(grp);
      portalSlots.push({ grp, baseIndex: i });
    }

    // 6. 无五官红人剪影与湿石板倒影
    figureMesh = makeFigureGroup(1.56, theme.figureHex, 1);
    rootGroup.add(figureMesh);

    figureReflect = makeFigureGroup(1.56, theme.figureHex, 0.22);
    figureReflect.scale.y = -0.52;
    rootGroup.add(figureReflect);

    // 7. 朱红虚线引导轨与行进光点
    const guideGeo = new THREE.BufferGeometry();
    guideGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(6 * 3), 3));
    guideLineObj = new THREE.Line(
      guideGeo,
      new THREE.LineDashedMaterial({
        color: theme.guideHex,
        dashSize: 0.55,
        gapSize: 0.34,
        fog: false,
      })
    );
    rootGroup.add(guideLineObj);

    guidePulseDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.14, 18),
      new THREE.MeshBasicMaterial({ color: theme.guideHex, side: THREE.DoubleSide, fog: false })
    );
    guidePulseDot.rotation.x = -Math.PI / 2;
    guidePulseDot.visible = false;
    rootGroup.add(guidePulseDot);

    // 8. 前景暗色枝叶 / 柱廊遮挡层
    fgRightMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(makeLeafClusterShape("right", state.scene)),
      new THREE.MeshBasicMaterial({ color: theme.foliageHex, side: THREE.DoubleSide, fog: false })
    );
    rootGroup.add(fgRightMesh);

    fgLeftMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(makeLeafClusterShape("left", state.scene)),
      new THREE.MeshBasicMaterial({ color: theme.foliageAccent, side: THREE.DoubleSide, fog: false })
    );
    rootGroup.add(fgLeftMesh);

    // 9. 仅在 3D 侧剖 X-Ray 下显现的建筑 Z 轴地面刻度网
    const gridPos = [];
    for (let m = 0; m <= 36; m += 4) {
      gridPos.push(-5.5, -0.02, -m, 5.5, -0.02, -m);
    }
    for (const gx of [-5.5, -2.5, 0, 2.5, 5.5]) {
      gridPos.push(gx, -0.02, 0, gx, -0.02, -36);
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute("position", new THREE.Float32BufferAttribute(gridPos, 3));
    cutawayGrid = new THREE.LineSegments(
      gridGeo,
      new THREE.LineBasicMaterial({ color: "#1B4949", transparent: true, opacity: 0.28 })
    );
    rootGroup.add(cutawayGrid);
  }

  // 把 model.js 的单真源空间坐标写入 Three.js 节点
  function syncThreeTransforms(state, layout) {
    const theme = SCENES[state.scene];
    const introEase = 1 - Math.pow(1 - clamp(introProgress, 0, 1), 3);

    // 相机
    camera.fov = layout.camera.fov;
    camera.aspect = layout.camera.aspect;
    camera.updateProjectionMatrix();
    camera.position.set(...layout.camera.pos);
    camera.lookAt(...layout.camera.target);

    // 门框位置（带轻微开场呼吸落位，且任意时刻都完整好看）
    for (let i = 0; i < portalSlots.length; i++) {
      const p = layout.portals[i];
      const slot = portalSlots[i];
      if (!p) continue;
      const zAnim = lerp(layout.zFirst - i * 0.4, p.z, introEase);
      slot.grp.position.set(0, 0, zAnim);
      // 当左侧圆徽被点击聚焦「层叠」时略作清晰高亮
      const emphasize = state.highlightCue === "layering";
      slot.grp.scale.setScalar(emphasize ? 1.015 : 1);
    }

    // 地板与砖纹
    const floorLen = Math.max(4, Math.abs(layout.floorEndZ - layout.floorStartZ));
    floorMesh.scale.set(5.4, floorLen, 1);
    floorMesh.position.set(0, 0, (layout.floorStartZ + layout.floorEndZ) * 0.5);

    tileLines.scale.set(5.2, 1, floorLen);
    tileLines.position.set(0, 0, layout.floorStartZ);

    // 远山与赤日（贴近走廊尽头可见高度，不会被门梁裁掉）
    for (let i = 0; i < mountainMeshes.length; i++) {
      mountainMeshes[i].scale.set(0.68, 0.42, 1);
      mountainMeshes[i].position.set(0, -0.1, layout.mountainBaseZ - i * 3.6);
    }
    sunMesh.position.set(...layout.sunPos);
    sunMesh.scale.setScalar(layout.sunRadius);

    // 红人剪影与倒影
    figureMesh.position.set(layout.figure.x, 0.02, layout.figure.z);
    figureReflect.position.set(layout.figure.x, 0.01, layout.figure.z);
    // 3D 侧剖时稍微面向镜头便于辨认
    figureMesh.rotation.y = layout.cutawayBlend * 0.55;
    figureReflect.rotation.y = layout.cutawayBlend * 0.55;

    // 朱红引导线
    guideLineObj.visible = state.guideLine;
    if (state.guideLine) {
      const arr = guideLineObj.geometry.attributes.position.array;
      for (let i = 0; i < layout.guidePoints.length; i++) {
        arr[i * 3] = layout.guidePoints[i][0];
        arr[i * 3 + 1] = layout.guidePoints[i][1];
        arr[i * 3 + 2] = layout.guidePoints[i][2];
      }
      guideLineObj.geometry.attributes.position.needsUpdate = true;
      guideLineObj.computeLineDistances();
    }

    // 视线穿透光点（Space 键或按钮播放）
    if (pulsePhase >= 0 && pulsePhase <= 1) {
      guidePulseDot.visible = true;
      const pts = layout.guidePoints;
      const segs = pts.length - 1;
      const raw = pulsePhase * segs;
      const idx = Math.min(segs - 1, Math.floor(raw));
      const f = raw - idx;
      const px = lerp(pts[idx][0], pts[idx + 1][0], f);
      const pz = lerp(pts[idx][2], pts[idx + 1][2], f);
      guidePulseDot.position.set(px, 0.06, pz);
      const pulseScale = 1 + 0.35 * Math.sin(pulsePhase * Math.PI * 8);
      guidePulseDot.scale.setScalar(pulseScale);
    } else {
      guidePulseDot.visible = false;
    }

    // 前景枝叶（随 fgOverlap 从画框外平滑探入；3D 侧剖时也精准停在 z = fg.z 的近平面！）
    const showFg = state.fgOverlap > 0.005;
    fgRightMesh.visible = showFg;
    fgLeftMesh.visible = showFg;
    if (showFg) {
      const edgeX = layout.fg.halfViewX + 0.35;
      fgRightMesh.scale.setScalar(0.75);
      fgLeftMesh.scale.setScalar(0.75);
      fgRightMesh.position.set(edgeX - layout.fg.rightIntrudeM, 0.42, layout.fg.z);
      fgLeftMesh.position.set(-edgeX + layout.fg.leftIntrudeM, 0.18, layout.fg.z - 0.12);
    }

    cutawayGrid.visible = layout.cutawayBlend > 0.04;
    cutawayGrid.material.opacity = layout.cutawayBlend * 0.32;
    scene.background.set(theme.bgHex);
    scene.fog.color.set(theme.fogHex);
  }

  // =========================================================================
  // 2D 透视降级绘制（关 WebGL 时完全用 model.js 的同一套 3D 投影矩阵）
  // =========================================================================
  function renderFallback2D(state, layout) {
    if (!fallbackCtx) return;
    const ctx = fallbackCtx;
    const theme = SCENES[state.scene];
    const dpr = pixelRatio(2);
    const W = width;
    const H = height;
    if (fallbackCanvas.width !== Math.round(W * dpr) || fallbackCanvas.height !== Math.round(H * dpr)) {
      fallbackCanvas.width = Math.round(W * dpr);
      fallbackCanvas.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const basis = makeCameraBasis(layout.camera);
    const P = (pt) => projectPoint(pt, basis, W, H);

    // 背景暖米天空渐变
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, theme.skyTop);
    bgGrad.addColorStop(0.65, theme.skyHorizon);
    bgGrad.addColorStop(1, theme.bgHex);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 远山
    for (let i = 2; i >= 0; i--) {
      const z = layout.mountainBaseZ - i * 3.6;
      const ridges = [
        [-11, 0], [-6.5, 1.85 + i * 0.45], [-2.5, 1.25 + i * 0.38], [0.9, 2.35 + i * 0.48], [4.4, 1.55 + i * 0.4], [8.5, 2.25 + i * 0.4], [12, 0],
      ];
      ctx.beginPath();
      let started = false;
      for (const [rx, ry] of ridges) {
        const p = P([rx, ry, z]);
        if (!p) continue;
        if (!started) { ctx.moveTo(p.x, p.y); started = true; }
        else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = theme.mountainPalette[i];
      ctx.fill();
    }

    // 远处赤日
    const sunC = P(layout.sunPos);
    const sunEdge = P([layout.sunPos[0] + layout.sunRadius, layout.sunPos[1], layout.sunPos[2]]);
    if (sunC && sunEdge) {
      ctx.beginPath();
      ctx.arc(sunC.x, sunC.y, Math.max(4, Math.abs(sunEdge.x - sunC.x)), 0, Math.PI * 2);
      ctx.fillStyle = theme.sunHex;
      ctx.fill();
    }

    // 日光地板
    const fl = [
      P([-2.7, 0, layout.floorStartZ]),
      P([2.7, 0, layout.floorStartZ]),
      P([2.7, 0, layout.floorEndZ]),
      P([-2.7, 0, layout.floorEndZ]),
    ];
    if (fl.every(Boolean)) {
      ctx.beginPath();
      ctx.moveTo(fl[0].x, fl[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(fl[i].x, fl[i].y);
      ctx.closePath();
      ctx.fillStyle = theme.floorLight;
      ctx.fill();

      // 地砖透视缝
      ctx.strokeStyle = theme.floorTile;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const z = lerp(layout.floorStartZ, layout.floorEndZ, i / 10);
        const a = P([-2.6, 0, z]);
        const b = P([2.6, 0, z]);
        if (a && b) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
    }

    // 朱红阶梯引导线
    if (state.guideLine) {
      ctx.save();
      ctx.strokeStyle = theme.guideHex;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      let st = false;
      for (const gp of layout.guidePoints) {
        const p = P(gp);
        if (!p) continue;
        if (!st) { ctx.moveTo(p.x, p.y); st = true; }
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 画家算法：由远及近绘制门框与红人
    const items = layout.portals.map((p) => ({ kind: "portal", z: p.z, p }));
    items.push({ kind: "figure", z: layout.figure.z });
    items.sort((a, b) => a.z - b.z); // 更负（更远）先画

    for (const item of items) {
      if (item.kind === "figure") {
        const head = P([layout.figure.x, layout.figure.h, layout.figure.z]);
        const feet = P([layout.figure.x, 0, layout.figure.z]);
        if (head && feet) {
          const fh = Math.max(4, feet.y - head.y);
          const fw = fh * 0.26;
          ctx.fillStyle = theme.figureHex;
          // 简约无五官剪影
          ctx.beginPath();
          ctx.arc(head.x, head.y + fh * 0.1, fw * 0.42, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(head.x - fw * 0.5, head.y + fh * 0.2, fw, fh * 0.42);
          ctx.fillRect(head.x - fw * 0.42, head.y + fh * 0.6, fw * 0.34, fh * 0.4);
          ctx.fillRect(head.x + fw * 0.08, head.y + fh * 0.6, fw * 0.34, fh * 0.4);
        }
      } else {
        const p = item.p;
        const oBL = P([-p.outerW / 2, 0, p.z]);
        const oBR = P([p.outerW / 2, 0, p.z]);
        const oTR = P([p.outerW / 2, p.outerH, p.z]);
        const oTL = P([-p.outerW / 2, p.outerH, p.z]);
        const iBL = P([-p.openW / 2, 0, p.z]);
        const iBR = P([p.openW / 2, 0, p.z]);
        const iTR = P([p.openW / 2, p.openH, p.z]);
        const iTL = P([-p.openW / 2, p.openH, p.z]);
        if ([oBL, oBR, oTR, oTL, iBL, iBR, iTR, iTL].every(Boolean)) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(oBL.x, oBL.y);
          ctx.lineTo(oBR.x, oBR.y);
          ctx.lineTo(oTR.x, oTR.y);
          ctx.lineTo(oTL.x, oTL.y);
          ctx.closePath();
          if (theme.archShape === "moon") {
            const cx = (iBL.x + iBR.x) * 0.5;
            const cy = (iBL.y + iTL.y) * 0.52;
            const rx = Math.abs(iBR.x - iBL.x) * 0.46;
            const ry = Math.abs(iBL.y - iTL.y) * 0.44;
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2, true);
          } else {
            ctx.moveTo(iBL.x, iBL.y);
            ctx.lineTo(iTL.x, iTL.y);
            ctx.lineTo(iTR.x, iTR.y);
            ctx.lineTo(iBR.x, iBR.y);
            ctx.closePath();
          }
          ctx.fillStyle = theme.portalPalette[Math.min(p.index, theme.portalPalette.length - 1)];
          ctx.fill("evenodd");
          ctx.restore();
        }
      }
    }

    // 前景暗色枝叶（2D 降级版）
    if (state.fgOverlap > 0.005) {
      const k = state.fgOverlap;
      ctx.fillStyle = theme.foliageHex;
      const rw = W * k * 1.05;
      ctx.beginPath();
      ctx.moveTo(W, H * 0.06);
      ctx.lineTo(W - rw * 0.72, H * 0.16);
      ctx.quadraticCurveTo(W - rw * 1.05, H * 0.34, W - rw * 0.52, H * 0.46);
      ctx.quadraticCurveTo(W - rw * 1.12, H * 0.58, W - rw * 0.48, H * 0.72);
      ctx.lineTo(W, H * 0.92);
      ctx.closePath();
      ctx.fill();

      const lw = W * k * 0.65;
      ctx.fillStyle = theme.foliageAccent;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.48);
      ctx.quadraticCurveTo(lw * 1.05, H * 0.60, lw * 0.45, H * 0.76);
      ctx.quadraticCurveTo(lw * 0.9, H * 0.86, 0, H);
      ctx.closePath();
      ctx.fill();
    }
  }

  // =========================================================================
  // 顶层透明 2D 标注层（Z 轴标尺、缺陷警示框、视线穿透脉冲光环）
  // =========================================================================
  function renderOverlay(state, layout, audit) {
    const ctx = overlayCtx;
    const dpr = pixelRatio(2);
    const W = width;
    const H = height;
    if (overlayCanvas.width !== Math.round(W * dpr) || overlayCanvas.height !== Math.round(H * dpr)) {
      overlayCanvas.width = Math.round(W * dpr);
      overlayCanvas.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const basis = makeCameraBasis(layout.camera);
    const P = (pt) => projectPoint(pt, basis, W, H);

    // 1. 标尺标注开启时绘制清晰的建筑 Z 轴距离锚点与消失线示意
    if (state.showRuler) {
      ctx.save();
      ctx.font = '500 11px "DM Mono", monospace';
      // 标注每道门框的真实 Z 米数（避开左上 HUD 区域，不撞字）
      for (let i = 0; i < layout.portals.length; i++) {
        const p = layout.portals[i];
        const topPt = P([layout.cutawayBlend > 0.2 ? -p.outerW * 0.48 : -p.openW * 0.46, p.openH + 0.35, p.z]);
        if (!topPt || topPt.x < 18 || topPt.x > W - 56 || topPt.y < 24 || topPt.y > H - 24) continue;
        if (topPt.y < 46 && topPt.x < 195) continue;
        const zLabel = `Z${Math.abs(p.z).toFixed(0)}m`;
        const isHot = state.highlightCue === "layering";
        ctx.fillStyle = isHot ? "#D24322" : "rgba(17, 36, 36, 0.78)";
        const tw = ctx.measureText(zLabel).width + 10;
        ctx.fillRect(topPt.x - 4, topPt.y - 11, tw, 16);
        ctx.fillStyle = "#FAF4E8";
        ctx.fillText(zLabel, topPt.x + 1, topPt.y + 1);
      }

      // 标注红人实际尺度比例
      const figTop = P([layout.figure.x, layout.figure.h + 0.25, layout.figure.z]);
      if (figTop && figTop.x > 24 && figTop.x < W - 70 && figTop.y > 26 && figTop.y < H - 30) {
        const badScale = !audit.cues.scale.ok;
        const txt = badScale ? `× ${audit.cues.scale.tag}` : `1:${audit.scaleRatio}`;
        ctx.fillStyle = badScale ? "#B82A12" : "rgba(27, 73, 73, 0.85)";
        const tw = ctx.measureText(txt).width + 12;
        ctx.fillRect(figTop.x - tw * 0.5, figTop.y - 16, tw, 18);
        ctx.fillStyle = "#FAF4E8";
        ctx.fillText(txt, figTop.x - tw * 0.5 + 6, figTop.y - 3);
      }

      // 侧剖 X-Ray 模式下绘出 0m 机位示意与视锥边线
      if (layout.cutawayBlend > 0.25) {
        const camPt = P([0, 1.56, layout.camZ]);
        const endL = P([-1.8, 0.1, layout.floorEndZ]);
        const endR = P([1.8, 0.1, layout.floorEndZ]);
        if (camPt && endL && endR) {
          ctx.strokeStyle = "rgba(210, 67, 34, 0.65)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(camPt.x, camPt.y); ctx.lineTo(endL.x, endL.y);
          ctx.moveTo(camPt.x, camPt.y); ctx.lineTo(endR.x, endR.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#D24322";
          ctx.beginPath();
          ctx.arc(camPt.x, camPt.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#111817";
          ctx.fillText("0m 机位", camPt.x + 8, camPt.y + 4);
        }
      }
      ctx.restore();
    }

    // 2. 缺失或过头错态的画布内温和提示（不遮挡主体）
    if (!audit.cues.overlap.ok && layout.cutawayBlend < 0.25) {
      ctx.save();
      ctx.strokeStyle = "#C33316";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      const boxW = Math.min(118, W * 0.22);
      const boxX = W - boxW - 14;
      const boxY = H * 0.22;
      const boxH = H * 0.5;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(184, 42, 18, 0.9)";
      const msg = audit.cues.overlap.dir === "over" ? "× 遮挡过重" : "点此加前景叶";
      ctx.font = '600 11px "Noto Serif SC", serif';
      const mw = ctx.measureText(msg).width + 12;
      ctx.fillRect(boxX + (boxW - mw) * 0.5, boxY + boxH * 0.5 - 10, mw, 20);
      ctx.fillStyle = "#FAF4E8";
      ctx.fillText(msg, boxX + (boxW - mw) * 0.5 + 6, boxY + boxH * 0.5 + 4);
      ctx.restore();
    }

    // 3. 视线深入脉冲轨迹（Space 演播）
    if (pulsePhase >= 0 && pulsePhase <= 1) {
      const stopT = audit.pulseStopT;
      const curT = Math.min(pulsePhase, stopT);
      const pts = layout.guidePoints.map((pt) => P(pt)).filter(Boolean);
      if (pts.length >= 2) {
        const segs = pts.length - 1;
        const raw = curT * segs;
        const idx = Math.min(segs - 1, Math.floor(raw));
        const f = raw - idx;
        const cx = lerp(pts[idx].x, pts[idx + 1].x, f);
        const cy = lerp(pts[idx].y, pts[idx + 1].y, f);

        ctx.save();
        ctx.strokeStyle = stopT < 0.99 && pulsePhase >= stopT ? "#B82A12" : "#DE532B";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i <= idx; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.lineTo(cx, cy);
        ctx.stroke();

        // 脉冲光晕
        ctx.beginPath();
        ctx.arc(cx, cy, 8 + 4 * Math.sin(pulsePhase * 16), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(222, 83, 43, 0.28)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#DE532B";
        ctx.fill();

        if (stopT < 0.99 && pulsePhase >= stopT - 0.02) {
          ctx.fillStyle = "#B82A12";
          ctx.font = '600 12px "Noto Serif SC", serif';
          const warn = "视线在此受阻";
          const ww = ctx.measureText(warn).width + 14;
          ctx.fillRect(cx - ww / 2, cy - 30, ww, 21);
          ctx.fillStyle = "#FAF4E8";
          ctx.fillText(warn, cx - ww / 2 + 7, cy - 15);
        }
        ctx.restore();
      }
    }
  }

  function resize() {
    const rect = hostEl.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    if (w === width && h === height) return;
    width = w;
    height = h;
    if (renderer) {
      const isNarrow = window.innerWidth <= 640;
      renderer.setPixelRatio(isNarrow ? 1 : pixelRatio(2));
      renderer.setSize(width, height, false);
    }
    dirty = true;
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(hostEl);
  resize();

  // ---- 指针交互：横拖连续推拉 Z 轴（不锁手机竖滚），点击场景构件直接调参 ----
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartSpread = 0;
  let dragMoved = false;

  // 支持鼠标/触控统一 Pointer Events，加上专门给 perf.mjs TouchEvent 兼容的 touch 监听
  function beginDrag(clientX, clientY) {
    dragStartX = clientX;
    dragStartY = clientY;
    dragStartSpread = getState().depthSpread;
    dragMoved = false;
  }

  function moveDrag(clientX, clientY) {
    const dx = clientX - dragStartX;
    const dy = clientY - dragStartY;
    if (!dragMoved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return false;
    if (!dragMoved && Math.abs(dy) > Math.abs(dx) * 1.4) return false; // 竖滚交给浏览器
    dragMoved = true;
    const nextSpread = clamp(dragStartSpread + dx / Math.max(180, width * 0.58), 0, 1);
    onAction({ type: "set", patch: { depthSpread: +nextSpread.toFixed(3) }, fromDrag: true });
    return true;
  }

  overlayCanvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    dragPointerId = e.pointerId;
    overlayCanvas.setPointerCapture(e.pointerId);
    beginDrag(e.clientX, e.clientY);
  });

  overlayCanvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    if (dragPointerId !== e.pointerId) return;
    moveDrag(e.clientX, e.clientY);
  });

  overlayCanvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    if (dragPointerId !== e.pointerId) return;
    dragPointerId = null;
    if (!dragMoved) {
      // 点击舞台内构件交互
      const rect = overlayCanvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / Math.max(1, rect.width);
      const ny = (e.clientY - rect.top) / Math.max(1, rect.height);
      const st = getState();
      if (nx > 0.78) {
        // 点右侧前景区：循环前景遮挡（0% -> 21% -> 50% 试错 -> 0%）
        const nextFg = st.fgOverlap < 0.08 ? 0.21 : st.fgOverlap < 0.34 ? 0.50 : 0.0;
        onAction({ type: "set", patch: { fgOverlap: nextFg } });
      } else if (ny > 0.62) {
        // 点地面石阶：开关朱红引导线并播放视线穿透
        const nextGuide = !st.guideLine;
        onAction({ type: "set", patch: { guideLine: nextGuide } });
        if (nextGuide) triggerPulse();
      } else if (nx > 0.42 && nx < 0.64 && ny > 0.34 && ny <= 0.62) {
        // 点中央光口红人区：切换红人深浅
        const nextFig = st.figureDepth < 0.45 ? 0.76 : 0.16;
        onAction({ type: "set", patch: { figureDepth: nextFig } });
      } else {
        // 点门框区域：递增门框重数 1->3->4
        const nextPortals = st.portalCount < 3 ? 4 : st.portalCount === 4 ? 3 : 4;
        onAction({ type: "set", patch: { portalCount: nextPortals } });
      }
    }
  });

  overlayCanvas.addEventListener("pointercancel", () => {
    dragPointerId = null;
  });

  // 额外监听原生 TouchEvent，确保 CDP Input.dispatchTouchEvent 在任何触屏测试下 100% 顺畅触发重绘
  let touchActive = false;
  overlayCanvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    touchActive = true;
    beginDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  overlayCanvas.addEventListener("touchmove", (e) => {
    if (!touchActive || !e.touches.length) return;
    moveDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  overlayCanvas.addEventListener("touchend", () => {
    touchActive = false;
  }, { passive: true });

  function triggerPulse() {
    pulsePhase = 0;
    dirty = true;
    if (reducedMotion.matches) ctrl.draw();
  }

  function markDirty() {
    dirty = true;
    if (reducedMotion.matches) ctrl.draw();
  }

  const ctrl = loop(hostEl, (t, dt, { still }) => {
    const state = getState();
    const targetCut = state.cutaway ? 1 : 0;

    if (still) {
      introProgress = 1;
      cutawayBlend = targetCut;
      if (pulsePhase >= 0) pulsePhase = -1;
      dirty = true;
    } else {
      if (introProgress < 1) {
        introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.15);
        dirty = true;
      }
      if (Math.abs(cutawayBlend - targetCut) > 0.004) {
        cutawayBlend += (targetCut - cutawayBlend) * Math.min(1, Math.max(dt, 0.016) * 7.5);
        if (Math.abs(cutawayBlend - targetCut) <= 0.004) cutawayBlend = targetCut;
        dirty = true;
      }
      if (pulsePhase >= 0) {
        pulsePhase += Math.max(dt, 0.016) * 0.62;
        if (pulsePhase > 1.28) pulsePhase = -1;
        dirty = true;
      }
    }

    if (!dirty) return;
    dirty = false;

    const aspect = width / Math.max(1, height);
    const layout = computeLayout(state, cutawayBlend, aspect);
    const audit = onAction({ type: "getAudit" });

    if (useGL) {
      rebuildThreeScene(state);
      syncThreeTransforms(state, layout);
      renderer.render(scene, camera);
    } else {
      renderFallback2D(state, layout);
    }
    renderOverlay(state, layout, audit);
  });

  return {
    markDirty,
    triggerPulse,
    isWebGL: useGL,
  };
}

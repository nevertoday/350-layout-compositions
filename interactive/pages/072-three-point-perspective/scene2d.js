// 072 三点透视 · 2D Canvas 针孔投影降级渲染器（关掉 WebGL 时无缝接管，与 3D 同源同体验）
import { pixelRatio } from "../../lib/stage.js";
import { clamp, computeCamera, projectPoint, sceneBoxes, vanishingPoints } from "./model.js";
import { drawHudOverlay } from "./scene3d.js";

const NEAR = 0.15;

function camDepth(cam, p) {
  return (p[0] - cam.C[0]) * cam.F[0] + (p[1] - cam.C[1]) * cam.F[1] + (p[2] - cam.C[2]) * cam.F[2];
}

function faceCenterDepth(cam, pts) {
  let sum = 0;
  for (const p of pts) sum += camDepth(cam, p);
  return sum / pts.length;
}

function isFrontFacing(cam, p0, normal) {
  const vx = p0[0] - cam.C[0];
  const vy = p0[1] - cam.C[1];
  const vz = p0[2] - cam.C[2];
  return vx * normal[0] + vy * normal[1] + vz * normal[2] < 0;
}

function lerp3(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// 3D 近平面线段裁剪：防止一端出镜头的地面网格线或幕墙线被整条丢掉
function clipAndProjectSegment(cam, pA, pB, width, height) {
  const za = camDepth(cam, pA);
  const zb = camDepth(cam, pB);
  if (za <= NEAR && zb <= NEAR) return null;
  let a = pA;
  let b = pB;
  if (za <= NEAR) a = lerp3(pA, pB, (NEAR - za) / (zb - za));
  else if (zb <= NEAR) b = lerp3(pB, pA, (NEAR - zb) / (za - zb));
  const qa = projectPoint(cam, a);
  const qb = projectPoint(cam, b);
  if (!qa || !qb) return null;
  return [
    { x: qa.u * width, y: qa.v * height },
    { x: qb.u * width, y: qb.v * height },
  ];
}

// 3D 近平面多边形裁剪（Sutherland–Hodgman）：确保极端广角近距取景时建筑立面不会整面消失
function clipPolyNear(cam, pts) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const curr = pts[i];
    const prev = pts[(i + pts.length - 1) % pts.length];
    const zc = camDepth(cam, curr);
    const zp = camDepth(cam, prev);
    const cIn = zc >= NEAR;
    const pIn = zp >= NEAR;
    if (cIn) {
      if (!pIn) out.push(lerp3(prev, curr, (NEAR - zp) / (zc - zp)));
      out.push(curr);
    } else if (pIn) {
      out.push(lerp3(prev, curr, (NEAR - zp) / (zc - zp)));
    }
  }
  return out;
}

export function createScene2D(host) {
  const base = document.createElement("canvas");
  base.className = "stage-gl";
  base.setAttribute("aria-hidden", "true");
  const ctx = base.getContext("2d");

  const hud = document.createElement("canvas");
  hud.className = "stage-hud";
  hud.setAttribute("aria-hidden", "true");
  const hudCtx = hud.getContext("2d");

  host.append(base, hud);

  let width = 0;
  let height = 0;

  function resize() {
    const r = host.getBoundingClientRect();
    const w = Math.max(240, Math.round(r.width));
    const h = Math.max(220, Math.round(r.height));
    if (w === width && h === height) return false;
    width = w;
    height = h;
    const dpr = pixelRatio(w <= 560 ? 1.5 : 2);
    for (const [el, c] of [[base, ctx], [hud, hudCtx]]) {
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    return true;
  }

  function render(state, reveal = 1) {
    if (!width || !height) resize();
    const aspect = width / height;
    const cam = computeCamera(state, aspect);
    const vps = vanishingPoints(cam);

    // 曜石黑渐变底
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#0e0f0e");
    bg.addColorStop(1, "#181a18");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // 地面参考网（仅相机在地面以上时绘制，所有线段按近平面裁剪，不再整条丢掉）
    const gridAlpha = clamp((cam.C[1] - 0.25) / 0.9, 0, 1) * 0.36;
    if (gridAlpha > 0.01) {
      ctx.strokeStyle = `rgba(92, 102, 88, ${gridAlpha.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const span = 12;
      const step = 1.6;
      const maxExtent = span * step;
      for (let i = -span; i <= span; i++) {
        const d = i * step;
        const s1 = clipAndProjectSegment(cam, [-maxExtent, 0, d], [maxExtent, 0, d], width, height);
        if (s1) { ctx.moveTo(s1[0].x, s1[0].y); ctx.lineTo(s1[1].x, s1[1].y); }
        const s2 = clipAndProjectSegment(cam, [d, 0, -maxExtent], [d, 0, maxExtent], width, height);
        if (s2) { ctx.moveTo(s2[0].x, s2[0].y); ctx.lineTo(s2[1].x, s2[1].y); }
      }
      ctx.stroke();
    }

    // 收集所有可见面并按深度由远及近排序
    const faces = [];
    for (const b of sceneBoxes(state.scene)) {
      const defs = [
        {
          n: [0, 0, 1],
          pts: [[b.x0, b.y0, b.z1], [b.x1, b.y0, b.z1], [b.x1, b.y1, b.z1], [b.x0, b.y1, b.z1]],
          fill: b.primary ? "#3d413e" : "#272a28",
          grid: true,
          b,
          kind: "z1",
        },
        {
          n: [1, 0, 0],
          pts: [[b.x1, b.y0, b.z1], [b.x1, b.y0, b.z0], [b.x1, b.y1, b.z0], [b.x1, b.y1, b.z1]],
          fill: b.primary ? "#191b1a" : "#141615",
          grid: true,
          b,
          kind: "x1",
        },
        {
          n: [0, 0, -1],
          pts: [[b.x1, b.y0, b.z0], [b.x0, b.y0, b.z0], [b.x0, b.y1, b.z0], [b.x1, b.y1, b.z0]],
          fill: "#181a18",
          grid: true,
          b,
          kind: "z0",
        },
        {
          n: [-1, 0, 0],
          pts: [[b.x0, b.y0, b.z0], [b.x0, b.y0, b.z1], [b.x0, b.y1, b.z1], [b.x0, b.y1, b.z0]],
          fill: "#313532",
          grid: true,
          b,
          kind: "x0",
        },
        {
          n: [0, 1, 0],
          pts: [[b.x0, b.y1, b.z1], [b.x1, b.y1, b.z1], [b.x1, b.y1, b.z0], [b.x0, b.y1, b.z0]],
          fill: b.primary ? "#2f3330" : "#222523",
          grid: false,
          b,
          kind: "top",
        },
      ];

      for (const f of defs) {
        if (!isFrontFacing(cam, f.pts[0], f.n)) continue;
        const clipped = clipPolyNear(cam, f.pts);
        if (clipped.length < 3) continue;
        const sp = clipped.map((p) => {
          const q = projectPoint(cam, p);
          return q ? { x: q.u * width, y: q.v * height } : null;
        });
        if (sp.some((q) => !q)) continue;
        faces.push({ ...f, sp, depth: faceCenterDepth(cam, clipped) });
      }
    }

    faces.sort((a, b) => b.depth - a.depth);

    for (const f of faces) {
      // 每个面先存成独立 Path2D，填底色 → 批量画幕墙网格 → 最后对同一 Path2D 描锐白结构轮廓
      const facePath = new Path2D();
      facePath.moveTo(f.sp[0].x, f.sp[0].y);
      for (let i = 1; i < f.sp.length; i++) facePath.lineTo(f.sp[i].x, f.sp[i].y);
      facePath.closePath();

      ctx.fillStyle = f.fill;
      ctx.fill(facePath);

      if (f.grid) {
        const { b } = f;
        const [p0, p1, p2, p3] = f.pts;
        ctx.strokeStyle = "rgba(182, 188, 178, 0.34)";
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        for (let i = 1; i < b.floors; i++) {
          const t = i / b.floors;
          const seg = clipAndProjectSegment(cam, lerp3(p0, p3, t), lerp3(p1, p2, t), width, height);
          if (seg) { ctx.moveTo(seg[0].x, seg[0].y); ctx.lineTo(seg[1].x, seg[1].y); }
        }
        for (let j = 1; j < b.cols; j++) {
          const t = j / b.cols;
          const seg = clipAndProjectSegment(cam, lerp3(p0, p1, t), lerp3(p3, p2, t), width, height);
          if (seg) { ctx.moveTo(seg[0].x, seg[0].y); ctx.lineTo(seg[1].x, seg[1].y); }
        }
        ctx.stroke();

        // 主塔呼应 WebGL 版的微弱青柠层间窗带
        if (b.primary && (f.kind === "z1" || f.kind === "x1")) {
          const litFloors = [3, 6, 9, 12, 15];
          ctx.strokeStyle = "rgba(195, 229, 75, 0.3)";
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          for (const lf of litFloors) {
            const t = (lf + 0.5) / b.floors;
            const a = lerp3(p0, p3, t);
            const c = lerp3(p1, p2, t);
            const seg = clipAndProjectSegment(cam, lerp3(a, c, 0.14), lerp3(a, c, 0.86), width, height);
            if (seg) { ctx.moveTo(seg[0].x, seg[0].y); ctx.lineTo(seg[1].x, seg[1].y); }
          }
          ctx.stroke();
        }
      }

      // 锐白结构外轮廓与共享前棱
      ctx.strokeStyle = "rgba(244, 245, 240, 0.92)";
      ctx.lineWidth = 1.3;
      ctx.stroke(facePath);
    }

    drawHudOverlay(hudCtx, width, height, cam, vps, state, reveal);
    return { cam, vps };
  }

  return { render, resize, isWebGL: false };
}

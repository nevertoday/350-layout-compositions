// 076 轴测构图 — 开场精密装配体爆炸轴测解剖台（纯 2D 矢量真三维正轴测引擎）
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  INITIAL_STATE,
  PRESETS,
  SCENES,
  evaluateState,
  projectPoint
} from "./model.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

function drawPolygon(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

// 在 3D 平面上绘制投影圆（圆孔自动变成精确轴测椭圆）
function projectCircle(hole, basis, cx, cy, scale, persp, segs = 24) {
  const [hx, hy, hz] = hole.center;
  const r = hole.r;
  const pts = [];
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const ca = Math.cos(a) * r, sa = Math.sin(a) * r;
    let p3;
    if (hole.plane === "Z+") p3 = [hx + ca, hy + sa, hz];
    else if (hole.plane === "X+") p3 = [hx, hy + ca, hz + sa];
    else p3 = [hx + ca, hy, hz + sa];
    pts.push(projectPoint(p3, basis, cx, cy, scale, persp));
  }
  return pts;
}

// 绘制单层组件（带可见实线外粗内细、可选隐藏虚线与零件高亮）
function drawPart(ctx, item, basis, cx, cy, scale, persp, opts) {
  const { showHidden, isSelected, isMisaligned, reveal = 1 } = opts;
  const allFaces = [];

  for (const solid of item.solids) {
    const proj = solid.verts.map((v) => projectPoint(v, basis, cx, cy, scale, persp));
    for (const f of solid.faces) {
      const dotV = f.n[0] * basis.V[0] + f.n[1] * basis.V[1] + f.n[2] * basis.V[2];
      const pts = f.idx.map((i) => proj[i]);
      let depth = 0;
      for (const p of pts) depth += p.depth;
      depth /= pts.length;
      allFaces.push({ f, pts, dotV, depth, palette: solid.palette, solid });
    }
  }

  // 1. 先画背面隐藏虚线（若开启导轨与隐线）
  if (showHidden) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 0.9;
    for (const face of allFaces) {
      if (face.dotV > 0.02 || face.f.smooth) continue;
      ctx.strokeStyle = isMisaligned ? "rgba(255,123,114,0.34)" : face.palette.hidden;
      drawPolygon(ctx, face.pts);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. 按平均深度从后往前画可见面（同时把挂在对应面上的圆孔随该面一起绘制，永不穿帮！）
  const visible = allFaces.filter((x) => x.dotV > -0.02).sort((a, b) => a.depth - b.depth);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  const paintHole = (hole) => {
    const n = hole.plane === "Z+" ? [0, 0, 1] : (hole.plane === "X+" ? [1, 0, 0] : [0, 1, 0]);
    const dotV = n[0] * basis.V[0] + n[1] * basis.V[1] + n[2] * basis.V[2];
    if (dotV <= 0.06) return;
    const pts = projectCircle(hole, basis, cx, cy, scale, persp, 24);
    ctx.save();
    ctx.globalAlpha = reveal;
    drawPolygon(ctx, pts);
    ctx.fillStyle = "#041428";
    ctx.fill();
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = isSelected ? "#E6C15A" : "#C5DDF2";
    ctx.stroke();
    ctx.restore();
  };

  for (const face of visible) {
    for (const p of face.pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    // 根据真实法线光照着色，还原原海报蓝图金属/工业蓝质感
    let fill = face.palette.left;
    if (face.f.shade === "top") fill = face.palette.top;
    else if (face.f.shade === "bottom") fill = face.palette.bottom;
    else if (face.f.shade === "side") {
      const light = face.f.n[0] * 0.55 + face.f.n[1] * -0.45 + 0.5;
      fill = light > 0.62 ? face.palette.top : (light > 0.25 ? face.palette.left : face.palette.right);
    } else {
      const rightness = face.f.n[1] * basis.R[1] + face.f.n[0] * basis.R[0];
      fill = rightness >= 0 ? face.palette.right : face.palette.left;
    }

    ctx.save();
    ctx.globalAlpha = 0.96 * reveal;
    drawPolygon(ctx, face.pts);
    ctx.fillStyle = fill;
    ctx.fill();

    if (!face.f.smooth) {
      ctx.lineWidth = isSelected ? 1.85 : (isMisaligned ? 1.65 : 1.15);
      ctx.strokeStyle = isMisaligned ? "#FF7B72" : (isSelected ? "#E6C15A" : face.palette.stroke);
      ctx.lineJoin = "round";
      ctx.stroke();
    } else {
      ctx.lineWidth = 0.45;
      ctx.strokeStyle = isMisaligned ? "rgba(255,123,114,0.45)" : "rgba(230,242,255,0.22)";
      ctx.stroke();
    }
    ctx.restore();

    // 若该面附带圆孔（如底座底板内孔或侧壁圆孔），紧跟该面绘制以保严格遮挡顺序
    if (face.solid.holes && face.solid.holes.length) {
      for (const h of face.solid.holes) {
        const match =
          (h.plane === "Z+" && face.f.shade === "top") ||
          (h.plane === "X+" && face.f.n[0] > 0.5) ||
          (h.plane === "Y+" && face.f.n[1] > 0.5);
        if (match) paintHole(h);
      }
    }
  }

  // 3. 顶层附带圆孔（如顶板与光学镜筒顶面）
  for (const hole of item.holes || []) paintHole(hole);

  return {
    partId: item.partId,
    bounds: { minX, maxX, minY, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
  };
}

// 更新右侧工程参数栏里的活体三轴量角器 SVG（076 原海报「轴测三轴 / AXES」1:1 动态版）
function updateTriadSvg(svg, ev) {
  if (!svg) return;
  const { basis, cls } = ev;
  const ox = 86, oy = 74, R = 48;

  const endX = [ox + basis.ax.x * R, oy - basis.ax.y * R];
  const endY = [ox + basis.ay.x * R, oy - basis.ay.y * R];
  const endZ = [ox + basis.az.x * R, oy - basis.az.y * R];

  const setLine = (id, x2, y2) => {
    const el = svg.querySelector(`#${id}`);
    if (el) { el.setAttribute("x2", x2.toFixed(1)); el.setAttribute("y2", y2.toFixed(1)); }
  };
  const setTxt = (id, x, y, text) => {
    const el = svg.querySelector(`#${id}`);
    if (el) {
      el.setAttribute("x", x.toFixed(1));
      el.setAttribute("y", y.toFixed(1));
      if (text != null) el.textContent = text;
    }
  };

  setLine("tri-x", endX[0], endX[1]);
  setLine("tri-y", endY[0], endY[1]);
  setLine("tri-z", endZ[0], endZ[1]);

  // 轴端字母偏移
  const pad = 12;
  const norm = (dx, dy) => {
    const l = Math.max(1, Math.hypot(dx, dy));
    return [dx / l, dy / l];
  };
  const [ux, uy] = norm(endX[0] - ox, endX[1] - oy);
  const [vx, vy] = norm(endY[0] - ox, endY[1] - oy);
  const [wx, wy] = norm(endZ[0] - ox, endZ[1] - oy);

  setTxt("lbl-x", endX[0] + ux * pad, endX[1] + uy * pad + 3, `X ${basis.p.toFixed(2)}`);
  setTxt("lbl-y", endY[0] + vx * pad, endY[1] + vy * pad + 3, `Y ${basis.q.toFixed(2)}`);
  setTxt("lbl-z", endZ[0] + wx * pad, endZ[1] + wy * pad - 2, `Z ${basis.r.toFixed(2)}`);

  // 三角夹角数字标注
  const mid = (a, b, dist = 25) => {
    const mx = a[0] + b[0], my = a[1] + b[1];
    const l = Math.max(0.1, Math.hypot(mx, my));
    return [ox + (mx / l) * dist, oy + (my / l) * dist + 3];
  };
  const mXZ = mid([ux, uy], [wx, wy], 27);
  const mYZ = mid([vx, vy], [wx, wy], 27);
  const mXY = mid([ux, uy], [vx, vy], 27);

  setTxt("ang-xz", mXZ[0], mXZ[1], `${Math.round(basis.angles.zx)}°`);
  setTxt("ang-yz", mYZ[0], mYZ[1], `${Math.round(basis.angles.yz)}°`);
  setTxt("ang-xy", mXY[0], mXY[1], `${Math.round(basis.angles.xy)}°`);

  const ring = svg.querySelector("#tri-ring");
  if (ring) ring.setAttribute("stroke", cls.valid ? "#4EBEE0" : "#FF7B72");
}

export function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const state = { ...INITIAL_STATE };
  const target = { ...INITIAL_STATE };
  let animatingToTarget = false;
  let introDone = false;
  let hitRegions = []; // 用于点击零件与偏轴红标

  // UI 引用
  const ui = {
    badge: document.getElementById("hero-badge"),
    diagBadge: document.getElementById("diag-badge"),
    diagTitle: document.getElementById("diag-title"),
    diagWhy: document.getElementById("diag-why"),
    diagNext: document.getElementById("diag-next"),
    mFamily: document.getElementById("m-family"),
    mRatio: document.getElementById("m-ratio"),
    mPersp: document.getElementById("m-persp"),
    mSumSq: document.getElementById("m-sumsq"),
    triadSvg: document.getElementById("triad-svg"),
    triadCaption: document.getElementById("triad-caption"),
    pillarsWrap: document.getElementById("hero-pillars"),
    stepsWrap: document.getElementById("hero-steps"),
    sExplode: document.getElementById("ctrl-explode"),
    vExplode: document.getElementById("val-explode"),
    sPitch: document.getElementById("ctrl-pitch"),
    vPitch: document.getElementById("val-pitch"),
    sPersp: document.getElementById("ctrl-persp"),
    vPersp: document.getElementById("val-persp"),
    btnGuides: document.getElementById("btn-guides"),
    btnAlign: document.getElementById("btn-align"),
    btnReset: document.getElementById("btn-reset"),
    sceneBtns: [...document.querySelectorAll("[data-scene]")],
    presetBtns: [...document.querySelectorAll("[data-preset]")],
    partNote: document.getElementById("part-inspector")
  };

  let lastDomKey = "";

  function syncUI(ev) {
    // 仅在数据变化时更新 DOM，保证拖拽 60fps 零卡顿
    const key = [
      state.scene,
      Math.round(state.yaw),
      Math.round(state.pitch),
      Math.round(state.explode),
      Math.round(state.persp),
      Math.round(state.misalign * 100),
      state.guides ? 1 : 0,
      state.selectedPart || ""
    ].join("|");
    if (key === lastDomKey) return;
    lastDomKey = key;

    if (ui.badge) {
      ui.badge.textContent = ev.badge;
      ui.badge.dataset.tone = ev.tone;
    }
    if (ui.diagBadge) {
      ui.diagBadge.textContent = ev.badge;
      ui.diagBadge.dataset.tone = ev.tone;
    }
    if (ui.diagTitle) ui.diagTitle.textContent = ev.headline;
    if (ui.diagWhy) ui.diagWhy.textContent = ev.why;
    if (ui.diagNext) ui.diagNext.textContent = ev.nextStep;

    if (ui.mFamily) ui.mFamily.textContent = ev.cls.label;
    if (ui.mRatio) ui.mRatio.textContent = ev.ratioText;
    if (ui.mPersp) ui.mPersp.textContent = `${ev.frontBackRatio.toFixed(2)}×`;
    if (ui.mSumSq) ui.mSumSq.textContent = ev.basis.sumSq.toFixed(2);

    updateTriadSvg(ui.triadSvg, ev);
    if (ui.triadCaption) {
      ui.triadCaption.textContent = `方位 ${Math.round(state.yaw)}° · 俯角 ${Math.round(state.pitch)}° · p²+q²+r² = ${ev.basis.sumSq.toFixed(2)}`;
    }

    if (ui.sExplode) ui.sExplode.value = String(Math.round(state.explode));
    if (ui.vExplode) ui.vExplode.textContent = `${Math.round(state.explode)}%`;
    if (ui.sPitch) ui.sPitch.value = String(Math.round(state.pitch));
    if (ui.vPitch) ui.vPitch.textContent = `${Math.round(state.pitch)}°`;
    if (ui.sPersp) ui.sPersp.value = String(Math.round(state.persp));
    if (ui.vPersp) ui.vPersp.textContent = `${Math.round(state.persp)}%`;

    if (ui.btnGuides) {
      ui.btnGuides.setAttribute("aria-pressed", String(state.guides));
      ui.btnGuides.textContent = state.guides ? "导轨与隐线：开" : "导轨与隐线：关";
      ui.btnGuides.classList.toggle("is-on", state.guides);
    }
    if (ui.btnAlign) {
      const off = Math.abs(state.misalign) > 0.04;
      ui.btnAlign.textContent = off ? "归位偏轴件" : "推偏试错";
      ui.btnAlign.classList.toggle("is-warn", off);
    }

    for (const b of ui.sceneBtns) {
      const active = b.dataset.scene === state.scene;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }
    for (const b of ui.presetBtns) {
      const pid = b.dataset.preset;
      const active = ev.checks.parallelOk && ev.cls.kind === pid;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }

    if (ui.pillarsWrap) {
      for (const p of ev.pillars) {
        const el = ui.pillarsWrap.querySelector(`[data-pillar="${p.id}"]`);
        if (!el) continue;
        const tag = el.querySelector(".pillar-tag");
        if (tag) {
          tag.textContent = p.tag;
          tag.dataset.ok = p.ok ? "1" : "0";
        }
      }
    }

    if (ui.stepsWrap) {
      for (const st of ev.steps) {
        const el = ui.stepsWrap.querySelector(`[data-step="${st.num}"]`);
        if (el) el.classList.toggle("is-ok", st.ok);
      }
    }

    if (ui.partNote) {
      const sp = ev.assembly.sceneMeta.parts.find((p) => p.id === state.selectedPart);
      if (sp) {
        ui.partNote.hidden = false;
        ui.partNote.textContent = `已选中「${sp.name} ${sp.en}」— ${sp.role}`;
      } else {
        ui.partNote.hidden = true;
      }
    }
  }

  let W = 0, H = 0, dpr = 1;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return false;
    dpr = pixelRatio(2);
    const nw = Math.round(rect.width * dpr);
    const nh = Math.round(rect.height * dpr);
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
    }
    W = rect.width;
    H = rect.height;
    return true;
  }

  function renderFrame(t, dt, { still }) {
    if (!resize()) return;

    // 开场优雅显影（不改变 0/4 错态数值，每一刻都清晰美观）
    const intro = still ? 1 : Math.min(1, t / 0.72);
    if (intro >= 1) introDone = true;

    // 预设按钮平滑过渡插值
    if (animatingToTarget) {
      if (still) {
        Object.assign(state, target);
        animatingToTarget = false;
      } else {
        const ease = 1 - Math.exp(-Math.max(dt, 0.016) * 10.5);
        let diff = 0;
        for (const k of ["yaw", "pitch", "explode", "persp", "misalign"]) {
          const d = target[k] - state[k];
          state[k] += d * ease;
          diff = Math.max(diff, Math.abs(d));
        }
        if (diff < 0.05) {
          state.yaw = target.yaw;
          state.pitch = target.pitch;
          state.explode = target.explode;
          state.persp = target.persp;
          state.misalign = target.misalign;
          animatingToTarget = false;
        }
      }
    }

    const ev = evaluateState(state);
    const { basis, assembly } = ev;
    syncUI(ev);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // 1. 午夜普鲁士蓝图纸底 + 细工程格
    const bgGrad = ctx.createRadialGradient(W * 0.44, H * 0.48, 20, W * 0.44, H * 0.48, Math.max(W, H) * 0.78);
    bgGrad.addColorStop(0, "#052245");
    bgGrad.addColorStop(0.55, "#021833");
    bgGrad.addColorStop(1, "#010F22");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 蓝图工程暗格
    const step = W < 440 ? 22 : 28;
    ctx.strokeStyle = "rgba(78, 190, 224, 0.075)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = step; x < W; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
    for (let y = step; y < H; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
    ctx.stroke();

    // 画布比例与居左微偏（右侧留出 076 原海报同款金色标注列空间）
    const compact = W < 470;
    const cx = compact ? W * 0.42 : W * 0.43;
    const cy = H * 0.62 + (state.explode / 100) * (H * 0.045);
    const baseUnit = Math.min(W * (compact ? 0.165 : 0.145), H * 0.142);
    const scale = baseUnit * (1 - (state.explode / 100) * 0.16);

    // 2. 底座底部平行工程尺规延长线（致敬 076 原海报最底部交叉标尺）
    const zFloor = assembly.anchors.base;
    const drawBaseMeasure = (a, b) => {
      const p1 = projectPoint(a, basis, cx, cy, scale, state.persp);
      const p2 = projectPoint(b, basis, cx, cy, scale, state.persp);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    };
    ctx.save();
    ctx.strokeStyle = "rgba(138, 186, 224, 0.34)";
    ctx.lineWidth = 1;
    drawBaseMeasure([-1.45, 1.05, zFloor], [1.45, 1.05, zFloor]);
    drawBaseMeasure([1.05, -1.45, zFloor], [1.05, 1.45, zFloor]);
    drawBaseMeasure([1.05, 1.05, zFloor], [1.38, 1.05, zFloor]);
    drawBaseMeasure([1.05, 1.05, zFloor], [1.05, 1.38, zFloor]);
    ctx.restore();

    // 3. 四角垂直虚线装配导轨（076 原海报最核心的爆炸视觉导轨！）
    if (state.guides) {
      const zBot = assembly.anchors.base;
      const zTop = assembly.anchors.plate + 0.24;
      const corners = [
        [-1.02, -1.02], [1.02, -1.02], [1.02, 1.02], [-1.02, 1.02]
      ];
      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = "rgba(148, 212, 238, 0.42)";
      ctx.lineWidth = 1;
      for (const [gx, gy] of corners) {
        const p0 = projectPoint([gx, gy, zBot], basis, cx, cy, scale, state.persp);
        const p1 = projectPoint([gx, gy, zTop], basis, cx, cy, scale, state.persp);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
      // 中央金色同轴装配主轴线（穿透顶板圆孔 -> 圆柱销 -> 底座中心）
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = Math.abs(state.misalign) > 0.04 ? "rgba(255, 123, 114, 0.72)" : "rgba(230, 193, 90, 0.62)";
      ctx.lineWidth = 1.25;
      const c0 = projectPoint([0, 0, zBot - 0.1], basis, cx, cy, scale, state.persp);
      const c1 = projectPoint([0, 0, zTop + 0.35], basis, cx, cy, scale, state.persp);
      ctx.beginPath();
      ctx.moveTo(c0.x, c0.y);
      ctx.lineTo(c1.x, c1.y);
      ctx.stroke();
      ctx.restore();
    }

    // 4. 按 Z 轴由下至上绘制四件装配体（俯角 > 0 时下层被上层遮挡）
    hitRegions = [];
    const partBoxes = {};
    for (const item of assembly.items) {
      const info = drawPart(ctx, item, basis, cx, cy, scale, state.persp, {
        showHidden: state.guides,
        isSelected: state.selectedPart === item.partId,
        isMisaligned: !!item.misaligned,
        reveal: intro
      });
      partBoxes[item.partId] = info.bounds;
      hitRegions.push({
        type: item.misaligned ? "misaligned" : "part",
        partId: item.partId,
        rect: info.bounds
      });
    }

    // 5. 若连接件脱轴，画出醒目的工程红偏离标线与可点红标
    if (Math.abs(state.misalign) > 0.04) {
      const zC = assembly.anchors.connector + 0.55;
      const pAxis = projectPoint([0, 0, zC], basis, cx, cy, scale, state.persp);
      const pOff = projectPoint([state.misalign, 0, zC], basis, cx, cy, scale, state.persp);
      ctx.save();
      ctx.strokeStyle = "#FF7B72";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(pAxis.x, pAxis.y);
      ctx.lineTo(pOff.x, pOff.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 偏轴可点标牌
      const label = `脱轴 +${state.misalign.toFixed(2)} · 点归位`;
      ctx.font = `600 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(label).width + 18;
      const th = 24;
      const bx = clamp(pOff.x - tw * 0.5, 10, W - tw - 10);
      const by = clamp(pOff.y - 36, 34, H - 56);
      ctx.fillStyle = "#9C1E22";
      ctx.strokeStyle = "#FFB4AE";
      ctx.lineWidth = 1.2;
      ctx.fillRect(bx, by, tw, th);
      ctx.strokeRect(bx, by, tw, th);
      ctx.fillStyle = "#FFF5F5";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, bx + tw / 2, by + th / 2 + 0.5);
      hitRegions.unshift({
        type: "misaligned",
        partId: "connector",
        rect: { minX: bx - 4, maxX: bx + tw + 4, minY: by - 4, maxY: by + th + 4 }
      });
      ctx.restore();
    }

    // 6. 原海报标志性右侧四条水平引出线 + 琥珀金实心圆点（顶板 / 主体 / 连接件 / 底座）
    const anchorX = compact ? W - 92 : Math.min(W - 148, cx + scale * 2.28);
    const labelMeta = assembly.sceneMeta.parts;
    // 防重叠微调四条标签 Y 坐标
    const rawYs = labelMeta.map((pm) => {
      const b = partBoxes[pm.id];
      return { pm, y: b ? b.cy : H * 0.5, rx: b ? b.maxX : cx + 40 };
    });
    const minGap = compact ? 30 : 42;
    for (let i = 1; i < rawYs.length; i++) {
      if (rawYs[i].y - rawYs[i - 1].y < minGap) {
        rawYs[i].y = rawYs[i - 1].y + minGap;
      }
    }
    // 防止挤出底沿
    const maxAllowedY = H - (compact ? 42 : 48);
    if (rawYs[rawYs.length - 1].y > maxAllowedY) {
      const shift = rawYs[rawYs.length - 1].y - maxAllowedY;
      for (const r of rawYs) r.y = Math.max(38, r.y - shift);
    }

    ctx.save();
    for (const row of rawYs) {
      const isSel = state.selectedPart === row.pm.id;
      const startX = Math.min(anchorX - 16, Math.max(row.rx + 4, cx + 12));
      ctx.strokeStyle = isSel ? "#E6C15A" : "rgba(218, 232, 246, 0.58)";
      ctx.lineWidth = isSel ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(startX, row.y);
      ctx.lineTo(anchorX, row.y);
      ctx.stroke();

      // 琥珀金圆点
      ctx.beginPath();
      ctx.arc(anchorX, row.y, isSel ? 4.5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? "#FFE07D" : "#E6C15A";
      ctx.fill();

      // 零件中文名 + 英文小标
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isSel ? "#FFE07D" : "#F4F7FA";
      ctx.font = `700 ${compact ? 12 : 13.5}px "Noto Sans SC", sans-serif`;
      ctx.fillText(row.pm.name, anchorX + 10, row.y - (compact ? 0 : 4));
      if (!compact) {
        ctx.fillStyle = "#92B4D4";
        ctx.font = `500 10px "IBM Plex Mono", monospace`;
        ctx.fillText(row.pm.en, anchorX + 10, row.y + 11);
      }

      hitRegions.push({
        type: "part",
        partId: row.pm.id,
        rect: { minX: anchorX - 8, maxX: W - 6, minY: row.y - 16, maxY: row.y + 18 }
      });
    }
    ctx.restore();

    // 7. 顶部工程 HUD 状态条（手机窄屏自动精简，绝不互相撞字）
    ctx.save();
    ctx.font = `500 ${compact ? 10.5 : 11.5}px "IBM Plex Mono", "Noto Sans SC", monospace`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = "#9EC4E4";
    ctx.fillText(
      compact
        ? `YAW ${Math.round(state.yaw)}° · PITCH ${Math.round(state.pitch)}°`
        : `YAW ${Math.round(state.yaw)}° · PITCH ${Math.round(state.pitch)}° · EXPLODE ${Math.round(state.explode)}%`,
      12, 11
    );
    ctx.textAlign = "right";
    ctx.fillStyle = ev.checks.parallelOk ? "#5CE0B8" : "#FF8E87";
    ctx.fillText(
      compact
        ? (ev.checks.parallelOk ? `平行 1.00×` : `畸变 ${ev.frontBackRatio.toFixed(2)}×`)
        : (ev.checks.parallelOk
          ? `平行等量 1.00× · ${ev.cls.en}`
          : `透视畸变 ${ev.frontBackRatio.toFixed(2)}× · 平行失效`),
      W - 12, 11
    );

    // 底部极轻量操作提示
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgba(178, 206, 232, 0.78)";
    ctx.font = `400 ${compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
    ctx.fillText(
      compact
        ? "左右横拖旋视角 · 点红标归位 · 点零件剖析"
        : "在画布左右横拖旋转轴测视角 · 点红标归位偏轴连接件 · 点击零件查看构造职责 · 方向键微调",
      W * 0.5, H - 10
    );
    ctx.restore();
  }

  const runner = loop(canvas, renderFrame);

  function goToPreset(p) {
    target.yaw = p.yaw;
    target.pitch = p.pitch;
    target.explode = p.explode;
    target.persp = p.persp;
    target.misalign = p.misalign;
    state.guides = p.guides;
    target.guides = p.guides;
    animatingToTarget = true;
    runner.draw();
  }

  // ---- 画布指针与触摸交互（触屏仅锁定横向拖拽，竖向滑屏放行给页面滚动！） ----
  let drag = null;

  canvas.addEventListener("pointerdown", (e) => {
    animatingToTarget = false;
    const rect = canvas.getBoundingClientRect();
    drag = {
      id: e.pointerId,
      pointerType: e.pointerType,
      x0: e.clientX,
      y0: e.clientY,
      lx: e.clientX,
      ly: e.clientY,
      localX: e.clientX - rect.left,
      localY: e.clientY - rect.top,
      yaw0: state.yaw,
      pitch0: state.pitch,
      moved: false,
      mode: e.pointerType === "touch" ? "pending" : "orbit"
    };
    if (e.pointerType !== "touch") {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;

    if (drag.mode === "pending") {
      if (Math.abs(dx) >= 6 && Math.abs(dx) >= Math.abs(dy) * 0.85) {
        drag.mode = "orbit";
        try { canvas.setPointerCapture(e.pointerId); } catch {}
      } else if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.25) {
        drag = null; // 放行竖向滚动
        return;
      } else {
        return;
      }
    }

    state.yaw = ((drag.yaw0 + dx * 0.42) % 360 + 360) % 360;
    if (drag.pointerType !== "touch") {
      state.pitch = clamp(drag.pitch0 + dy * 0.24, 5, 76);
    }
    runner.draw();
  });

  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const wasClick = !drag.moved;
    const lx = drag.localX, ly = drag.localY;
    drag = null;
    if (wasClick) {
      for (const hit of hitRegions) {
        const r = hit.rect;
        if (lx >= r.minX && lx <= r.maxX && ly >= r.minY && ly <= r.maxY) {
          if (hit.type === "misaligned") {
            target.yaw = state.yaw;
            target.pitch = state.pitch;
            target.explode = state.explode;
            target.persp = state.persp;
            target.misalign = 0;
            animatingToTarget = true;
            runner.draw();
            return;
          }
          state.selectedPart = state.selectedPart === hit.partId ? null : hit.partId;
          runner.draw();
          return;
        }
      }
      state.selectedPart = null;
      runner.draw();
    }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => { drag = null; });

  // 键盘操作画布
  canvas.addEventListener("keydown", (e) => {
    let handled = true;
    animatingToTarget = false;
    if (e.key === "ArrowLeft") state.yaw = (state.yaw - 4 + 360) % 360;
    else if (e.key === "ArrowRight") state.yaw = (state.yaw + 4) % 360;
    else if (e.key === "ArrowUp") {
      if (e.shiftKey) state.pitch = clamp(state.pitch + 3, 5, 76);
      else state.explode = clamp(state.explode + 6, 0, 100);
    } else if (e.key === "ArrowDown") {
      if (e.shiftKey) state.pitch = clamp(state.pitch - 3, 5, 76);
      else state.explode = clamp(state.explode - 6, 0, 100);
    } else if (e.key === " ") {
      state.guides = !state.guides;
    } else {
      handled = false;
    }
    if (handled) {
      e.preventDefault();
      runner.draw();
    }
  });

  // ---- 绑定控轨与按钮 ----
  if (ui.sExplode) {
    ui.sExplode.addEventListener("input", () => {
      animatingToTarget = false;
      state.explode = Number(ui.sExplode.value);
      runner.draw();
    });
  }
  if (ui.sPitch) {
    ui.sPitch.addEventListener("input", () => {
      animatingToTarget = false;
      state.pitch = Number(ui.sPitch.value);
      runner.draw();
    });
  }
  if (ui.sPersp) {
    ui.sPersp.addEventListener("input", () => {
      animatingToTarget = false;
      state.persp = Number(ui.sPersp.value);
      runner.draw();
    });
  }
  if (ui.btnGuides) {
    ui.btnGuides.addEventListener("click", () => {
      state.guides = !state.guides;
      runner.draw();
    });
  }
  if (ui.btnAlign) {
    ui.btnAlign.addEventListener("click", () => {
      target.yaw = state.yaw;
      target.pitch = state.pitch;
      target.explode = state.explode;
      target.persp = state.persp;
      target.misalign = Math.abs(state.misalign) > 0.04 ? 0 : 0.72;
      animatingToTarget = true;
      runner.draw();
    });
  }
  if (ui.btnReset) {
    ui.btnReset.addEventListener("click", () => {
      state.selectedPart = null;
      goToPreset(PRESETS.broken);
    });
  }
  for (const b of ui.sceneBtns) {
    b.addEventListener("click", () => {
      if (!SCENES[b.dataset.scene]) return;
      state.scene = b.dataset.scene;
      state.selectedPart = null;
      runner.draw();
    });
  }
  for (const b of ui.presetBtns) {
    b.addEventListener("click", () => {
      const p = PRESETS[b.dataset.preset];
      if (p) goToPreset(p);
    });
  }

  // 点击底沿 01–05 步骤，分别直达该步对应的示范状态
  if (ui.stepsWrap) {
    ui.stepsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-step]");
      if (!btn) return;
      const step = btn.dataset.step;
      if (step === "01") goToPreset({ yaw: 45, pitch: 35.26, explode: 0, persp: 0, misalign: 0.72, guides: false });
      else if (step === "02") goToPreset({ yaw: 45, pitch: 35.26, explode: 20, persp: 0, misalign: 0.72, guides: false });
      else if (step === "03") goToPreset({ yaw: 45, pitch: 35.26, explode: 56, persp: 0, misalign: 0.72, guides: false });
      else if (step === "04") goToPreset({ yaw: 45, pitch: 35.26, explode: 56, persp: 0, misalign: 0, guides: false });
      else if (step === "05") goToPreset(PRESETS.isometric);
    });
  }

  // 初次渲染
  window.addEventListener("resize", () => runner.draw());
  runner.draw();

  // 供自动化探针检查内部状态（只读）
  window.__AXO_HERO__ = () => ({ state: { ...state }, eval: evaluateState(state) });
}

// 076 轴测构图 — 正文 01–07 节互动实验 + 原海报可缩放可拖灯箱
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  makeBasis,
  makeBox,
  makeCylinder,
  PART_PALETTES,
  projectPoint,
  classifyAxonometry
} from "./model.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 16 || rect.height < 16) return null;
  const dpr = pixelRatio(2);
  const nw = Math.round(rect.width * dpr);
  const nh = Math.round(rect.height * dpr);
  if (canvas.width !== nw || canvas.height !== nh) {
    canvas.width = nw;
    canvas.height = nh;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, W: rect.width, H: rect.height };
}

function drawPoly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

function drawSimpleSolid(ctx, solid, basis, cx, cy, scale, opts = {}) {
  const { persp = 0, showHidden = false, fillFaces = true, strokeW = 1.25, strokeColor, hiddenColor } = opts;
  const proj = solid.verts.map((v) => projectPoint(v, basis, cx, cy, scale, persp));
  const faces = solid.faces.map((f) => {
    const dotV = f.n[0] * basis.V[0] + f.n[1] * basis.V[1] + f.n[2] * basis.V[2];
    const pts = f.idx.map((i) => proj[i]);
    const depth = pts.reduce((s, p) => s + p.depth, 0) / pts.length;
    return { f, pts, dotV, depth };
  });

  if (showHidden) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = hiddenColor || solid.palette.hidden;
    for (const fc of faces) {
      if (fc.dotV > 0.02 || fc.f.smooth) continue;
      drawPoly(ctx, fc.pts);
      ctx.stroke();
    }
    ctx.restore();
  }

  const vis = faces.filter((x) => x.dotV > -0.02).sort((a, b) => a.depth - b.depth);
  for (const fc of vis) {
    drawPoly(ctx, fc.pts);
    if (fillFaces) {
      let fill = solid.palette.left;
      if (fc.f.shade === "top") fill = solid.palette.top;
      else if (fc.f.shade === "bottom") fill = solid.palette.bottom;
      else if (fc.f.shade === "side") {
        const l = fc.f.n[0] * 0.5 + fc.f.n[1] * -0.4 + 0.5;
        fill = l > 0.6 ? solid.palette.top : (l > 0.25 ? solid.palette.left : solid.palette.right);
      } else {
        const rr = fc.f.n[1] * basis.R[1] + fc.f.n[0] * basis.R[0];
        fill = rr >= 0 ? solid.palette.right : solid.palette.left;
      }
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (!fc.f.smooth) {
      ctx.lineWidth = strokeW;
      ctx.strokeStyle = strokeColor || solid.palette.stroke;
      ctx.lineJoin = "round";
      ctx.stroke();
    }
  }
}

// =========================================================================
// 01 节：一族三派 — 极坐标视向罗盘 × 实时单位立方体与 p²+q²+r²=2 检验
// =========================================================================
function initSection01() {
  const canvas = document.getElementById("lab-triad");
  if (!canvas) return;
  const readout = document.getElementById("s01-readout");
  const btns = [...document.querySelectorAll("[data-s01-preset]")];

  const st = { yaw: 45, pitch: 35.26 };
  const presets = {
    iso: { yaw: 45, pitch: 35.26 },
    dim: { yaw: 20.7, pitch: 19.47 },
    tri: { yaw: 26, pitch: 38 }
  };

  let compass = { cx: 0, cy: 0, r: 1 };

  const render = () => {
    const info = setupCanvas(canvas);
    if (!info) return;
    const { ctx, W, H } = info;
    const compact = W < 540;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);

    // 淡工程网格底
    ctx.strokeStyle = "rgba(7, 26, 48, 0.055)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 24; x < W; x += 24) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
    for (let y = 24; y < H; y += 24) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
    ctx.stroke();

    const basis = makeBasis(st.yaw, st.pitch);
    const cls = classifyAxonometry(basis, st.pitch, st.yaw);

    // 左侧：极坐标视向罗盘（半径映射俯角 8°..68°，极角映射方位 10°..80°）
    const cR = compact ? Math.min(W * 0.21, H * 0.32) : Math.min(W * 0.17, H * 0.37);
    const cCx = compact ? W * 0.27 : W * 0.24;
    const cCy = H * 0.53;
    compass = { cx: cCx, cy: cCy, r: cR };

    // 刻度同心圆
    ctx.save();
    for (const frac of [0.35, 0.68, 1]) {
      ctx.beginPath();
      ctx.arc(cCx, cCy, cR * frac, 0, Math.PI * 2);
      ctx.strokeStyle = frac === 1 ? "#074582" : "rgba(7, 69, 130, 0.22)";
      ctx.lineWidth = frac === 1 ? 1.5 : 1;
      ctx.stroke();
    }
    // 十字方位线
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = "rgba(7, 69, 130, 0.25)";
    ctx.beginPath();
    ctx.moveTo(cCx - cR, cCy); ctx.lineTo(cCx + cR, cCy);
    ctx.moveTo(cCx, cCy - cR); ctx.lineTo(cCx, cCy + cR);
    ctx.stroke();
    ctx.setLineDash([]);

    // 极坐标映射函数：yaw 0..90 -> 角度 -160°..-20°(或完整圆)；pitch 8..68 -> 半径 1..0.12
    const toCompass = (yaw, pitch) => {
      const a = ((yaw - 45) / 45) * (Math.PI * 0.72) - Math.PI * 0.5;
      const rr = clamp((72 - pitch) / 64, 0.12, 0.96) * cR;
      return { x: cCx + Math.cos(a) * rr, y: cCy + Math.sin(a) * rr };
    };

    // 标出三个经典落点（窄屏左右错开，绝不撞字）
    const marks = [
      { key: "iso", label: "等轴", yaw: 45, pitch: 35.26, col: "#064B8C", dx: 0, dy: -12, align: "center" },
      { key: "dim", label: "二轴", yaw: 20.7, pitch: 19.47, col: "#0A5A75", dx: -7, dy: 0, align: "right" },
      { key: "tri", label: "三轴", yaw: 26, pitch: 38, col: "#7A5800", dx: 7, dy: 2, align: "left" }
    ];
    for (const m of marks) {
      const pt = toCompass(m.yaw, m.pitch);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = m.col;
      ctx.fill();
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = m.col;
      ctx.textAlign = m.align;
      ctx.textBaseline = "middle";
      ctx.fillText(m.label, pt.x + m.dx, pt.y + m.dy);
    }

    // 当前观测手柄
    const cur = toCompass(st.yaw, st.pitch);
    ctx.beginPath();
    ctx.arc(cur.x, cur.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = cls.valid ? "rgba(8, 84, 152, 0.18)" : "rgba(180, 35, 24, 0.18)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = cls.valid ? "#064B8C" : "#B42318";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cur.x, cur.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = cls.valid ? "#064B8C" : "#B42318";
    ctx.fill();

    ctx.font = `600 11.5px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#071A30";
    ctx.textAlign = "center";
    ctx.fillText("点拖视向罗盘", cCx, cCy + cR + 18);
    ctx.restore();

    // 右侧：实时投影单位立方体 + 三轴矢量
    const cubeCx = compact ? W * 0.74 : W * 0.64;
    const cubeCy = H * 0.54;
    const cubeScale = compact ? Math.min(W * 0.102, H * 0.19) : Math.min(W * 0.11, H * 0.24);
    const cube = makeBox(-0.65, 0.65, -0.65, 0.65, -0.65, 0.65, {
      top: "#55B8DF", left: "#0D5CA8", right: "#06366B", bottom: "#031E3E",
      stroke: "#071A30", hidden: "rgba(7, 26, 48, 0.28)"
    });
    drawSimpleSolid(ctx, cube, basis, cubeCx, cubeCy, cubeScale, { showHidden: true, strokeW: 1.5 });

    // 从原点画出三轴坐标矢量
    const o = projectPoint([-0.65, -0.65, -0.65], basis, cubeCx, cubeCy, cubeScale);
    const ex = projectPoint([1.15, -0.65, -0.65], basis, cubeCx, cubeCy, cubeScale);
    const ey = projectPoint([-0.65, 1.15, -0.65], basis, cubeCx, cubeCy, cubeScale);
    const ez = projectPoint([-0.65, -0.65, 1.18], basis, cubeCx, cubeCy, cubeScale);
    const drawAxis = (to, name, val, col) => {
      ctx.save();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(to.x, to.y); ctx.stroke();
      ctx.fillStyle = col;
      ctx.font = `600 ${compact ? 10.5 : 11.5}px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillText(`${name}:${val.toFixed(2)}`, clamp(to.x, 28, W - 28), Math.max(16, to.y - 7));
      ctx.restore();
    };
    drawAxis(ex, "p", basis.p, "#064B8C");
    drawAxis(ey, "q", basis.q, "#0A5A75");
    drawAxis(ez, "r", basis.r, "#7A5800");

    // 最右侧（宽屏）画三面面积权重条
    if (!compact) {
      const bx = W * 0.80, bw = W * 0.165;
      const bars = [
        { name: "顶面占比", v: basis.faceShare.top, col: "#0A5A75" },
        { name: "左主面", v: basis.faceShare.left, col: "#064B8C" },
        { name: "右侧面", v: basis.faceShare.right, col: "#1C3552" }
      ];
      ctx.save();
      ctx.font = `600 11.5px "Noto Sans SC", sans-serif`;
      bars.forEach((b, i) => {
        const y = H * 0.25 + i * 52;
        ctx.fillStyle = "#071A30";
        ctx.textAlign = "left";
        ctx.fillText(`${b.name} ${Math.round(b.v * 100)}%`, bx, y);
        ctx.fillStyle = "#E4ECF4";
        ctx.fillRect(bx, y + 8, bw, 12);
        ctx.fillStyle = b.col;
        ctx.fillRect(bx, y + 8, bw * clamp(b.v * 1.4, 0.04, 1), 12);
      });
      ctx.font = `600 11.5px "IBM Plex Mono", monospace`;
      ctx.fillStyle = "#0E6245";
      ctx.fillText(`p²+q²+r² = ${basis.sumSq.toFixed(3)}`, bx, H * 0.82);
      ctx.restore();
    }

    if (readout) {
      const fs = basis.faceShare;
      readout.textContent = `当前判定：${cls.label}（${cls.en}）· 方位 ${Math.round(st.yaw)}° / 俯角 ${Math.round(st.pitch)}° · 缩短系数 p=${basis.p.toFixed(2)}, q=${basis.q.toFixed(2)}, r=${basis.r.toFixed(2)}（平方和恒为 ${basis.sumSq.toFixed(2)}）· 顶/左/右可视面占比 ${Math.round(fs.top * 100)}% / ${Math.round(fs.left * 100)}% / ${Math.round(fs.right * 100)}% — ${cls.reason}。`;
    }
  };

  const runner = loop(canvas, () => render());

  const pickCompass = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const dx = clientX - rect.left - compass.cx;
    const dy = clientY - rect.top - compass.cy;
    const dist = Math.hypot(dx, dy);
    if (dist > compass.r * 1.25) return false;
    const frac = clamp(dist / compass.r, 0.12, 0.96);
    st.pitch = clamp(72 - frac * 64, 8, 66);
    let ang = Math.atan2(dy, dx) + Math.PI * 0.5;
    if (ang > Math.PI) ang -= Math.PI * 2;
    if (ang < -Math.PI) ang += Math.PI * 2;
    st.yaw = clamp(45 + (ang / (Math.PI * 0.72)) * 45, 6, 84);
    runner.draw();
    return true;
  };

  let dragging = false;
  canvas.addEventListener("pointerdown", (e) => {
    if (pickCompass(e.clientX, e.clientY)) {
      dragging = true;
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) pickCompass(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  for (const b of btns) {
    b.addEventListener("click", () => {
      const p = presets[b.dataset.s01Preset];
      if (!p) return;
      st.yaw = p.yaw;
      st.pitch = p.pitch;
      btns.forEach((x) => x.classList.toggle("is-active", x === b));
      runner.draw();
    });
  }
  window.addEventListener("resize", () => runner.draw());
  runner.draw();
}

// =========================================================================
// 02 节：海报「说多了一点」— ISO 比例配方直比圆孔椭圆变形与主面面积
// =========================================================================
function initSection02() {
  const canvas = document.getElementById("lab-ratio");
  if (!canvas) return;
  const readout = document.getElementById("s02-readout");
  const btns = [...document.querySelectorAll("[data-s02-mode]")];

  const MODES = {
    iso: {
      yaw: 45, pitch: 35.26, title: "等轴测 1 : 1 : 1（原海报所写特例）",
      note: "三轴同为 120°、等长缩放 0.816。顶面与两侧完全平权；缺点是正方体前后对角顶点容易投影重合，内部孔位容易与后棱撞线。"
    },
    dim: {
      yaw: 20.7, pitch: 19.47, title: "ISO 5456-3 二轴测 1 : 0.5 : 1（主面放大）",
      note: "左前主面（X-Z）几乎贴近正视图展开，侧面进深缩半为 0.5。适合机械面板、控制箱等「正面信息最重、侧面只需交代厚度」的产品。"
    },
    tri: {
      yaw: 26, pitch: 38, title: "三轴测 0.94 : 0.71 : 0.79（错开重影）",
      note: "三轴角度和缩短率全不相同，彻底消除正方体对角棱重合，同时给顶面圆孔和前主面都保留了舒展的视觉窗口。"
    }
  };
  let mode = "iso";

  const render = () => {
    const info = setupCanvas(canvas);
    if (!info) return;
    const { ctx, W, H } = info;
    const m = MODES[mode];
    const basis = makeBasis(m.yaw, m.pitch);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);

    // 画一块带正面圆孔和顶面圆孔的精密法兰块，让读者一眼看清三面缩放差异
    const cx = W * 0.42;
    const cy = H * 0.54;
    const sc = Math.min(W * 0.145, H * 0.27);
    const block = makeBox(-0.95, 0.95, -0.75, 0.75, -0.55, 0.55, {
      top: "#D2DCE6", left: "#1A6CC2", right: "#083F7A", bottom: "#031D3B",
      stroke: "#071A30", hidden: "rgba(7, 26, 48, 0.25)"
    });
    drawSimpleSolid(ctx, block, basis, cx, cy, sc, { showHidden: true, strokeW: 1.5 });

    // 在顶面和左前主面各画一个真圆孔（3D 点投影）
    const drawHole = (plane, center, rad, strokeCol) => {
      const pts = [];
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        const p3 = plane === "Z"
          ? [center[0] + Math.cos(a) * rad, center[1] + Math.sin(a) * rad, center[2]]
          : [center[0], center[1] + Math.cos(a) * rad, center[2] + Math.sin(a) * rad];
        pts.push(projectPoint(p3, basis, cx, cy, sc));
      }
      drawPoly(ctx, pts);
      ctx.fillStyle = "#08203B";
      ctx.fill();
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // 实算投影椭圆长短轴近似比
      const c2 = projectPoint(center, basis, cx, cy, sc);
      let maxD = 0, minD = Infinity;
      for (const p of pts) {
        const d = Math.hypot(p.x - c2.x, p.y - c2.y);
        if (d > maxD) maxD = d;
        if (d < minD) minD = d;
      }
      return maxD / Math.max(0.5, minD);
    };

    const topRatio = drawHole("Z", [0, 0, 0.554], 0.36, "#0A5A75");
    const frontRatio = drawHole("X", [0.954, 0, 0], 0.28, "#E6C15A");

    // 右侧输出实测标尺卡
    const rx = W * 0.67;
    ctx.save();
    ctx.fillStyle = "#071A30";
    ctx.font = `700 ${W < 460 ? 12 : 13.5}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(m.title.split("（")[0], rx, H * 0.23);

    ctx.font = `500 ${W < 460 ? 11 : 12}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = "#064B8C";
    ctx.fillText(`X 轴缩短  p = ${basis.p.toFixed(2)}`, rx, H * 0.39);
    ctx.fillStyle = "#0A5A75";
    ctx.fillText(`Y 轴缩短  q = ${basis.q.toFixed(2)}`, rx, H * 0.50);
    ctx.fillStyle = "#7A5800";
    ctx.fillText(`Z 轴缩短  r = ${basis.r.toFixed(2)}`, rx, H * 0.61);

    ctx.fillStyle = "#3A5068";
    ctx.font = `500 11px "Noto Sans SC", sans-serif`;
    ctx.fillText(`顶面圆孔椭圆长短比 ${topRatio.toFixed(2)}:1`, rx, H * 0.74);
    ctx.fillText(`主面圆孔椭圆长短比 ${frontRatio.toFixed(2)}:1`, rx, H * 0.85);
    ctx.restore();

    if (readout) {
      readout.textContent = `${m.title} — ${m.note} 实测当前三轴夹角 ${Math.round(basis.angles.xy)}° / ${Math.round(basis.angles.yz)}° / ${Math.round(basis.angles.zx)}°。`;
    }
  };

  const runner = loop(canvas, () => render());
  for (const b of btns) {
    b.addEventListener("click", () => {
      mode = b.dataset.s02Mode;
      btns.forEach((x) => {
        x.classList.toggle("is-active", x === b);
        x.setAttribute("aria-pressed", String(x === b));
      });
      runner.draw();
    });
  }
  window.addEventListener("resize", () => runner.draw());
  runner.draw();
}

// =========================================================================
// 03 节：五步画法与隐线层 — 复刻原海报底沿 01–05 午夜蓝图叠层步进台
// =========================================================================
function initSection03() {
  const canvas = document.getElementById("lab-steps");
  if (!canvas) return;
  const readout = document.getElementById("s03-readout");
  const stepBtns = [...document.querySelectorAll("[data-s03-step]")];
  const togHidden = document.getElementById("s03-hidden");
  const togWeight = document.getElementById("s03-weight");

  const st = { step: 5, showHidden: true, lineHierarchy: true };

  const STEP_NOTES = {
    1: "01. 确定轴向（SET AXES）：先在图纸上定下 X、Y、Z 三条基准轴的方向与夹角，全图所有平行边必须严格锁死在这三组方向上。",
    2: "02. 构建基体（BUILD VOLUME）：沿三轴量出外接包络盒，把复杂形体先收进可核验比例的基础立方框里。",
    3: "03. 添加细节（ADD DETAILS）：在基体内部切出 U 形凹槽、定位圆柱孔和倒角台阶，圆形在轴测面里严格画成椭圆。",
    4: "04. 完善结构（REFINE STRUCTURE）：区分可见实线与背面隐藏虚线，让观众一眼穿透外壳看到空腔与接口厚度。",
    5: "05. 强化表达（ENHANCE CLARITY）：用外轮廓粗线、内部细棱与明暗面差拉出体块层次，彻底消除平面六边形错觉。"
  };

  const render = () => {
    const info = setupCanvas(canvas);
    if (!info) return;
    const { ctx, W, H } = info;

    ctx.fillStyle = "#031A35";
    ctx.fillRect(0, 0, W, H);

    // 蓝图细格
    ctx.strokeStyle = "rgba(78, 190, 224, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 26; x < W; x += 26) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
    for (let y = 26; y < H; y += 26) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
    ctx.stroke();

    const basis = makeBasis(45, 35.26);
    const cx = W * 0.5;
    const cy = H * 0.54;
    const sc = Math.min(W * 0.145, H * 0.28);

    // Step 1: 三轴基准线（始终作底，Step 1 最亮）
    const o = projectPoint([0, 0, -0.8], basis, cx, cy, sc);
    const ends = [
      { p: [1.55, 0, -0.8], lbl: "X" },
      { p: [0, 1.55, -0.8], lbl: "Y" },
      { p: [0, 0, 1.35], lbl: "Z" }
    ];
    ctx.save();
    ctx.strokeStyle = st.step === 1 ? "#4EBEE0" : "rgba(78, 190, 224, 0.38)";
    ctx.lineWidth = st.step === 1 ? 2.2 : 1.1;
    for (const e of ends) {
      const pt = projectPoint(e.p, basis, cx, cy, sc);
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();
      ctx.fillStyle = "#4EBEE0";
      ctx.font = `600 12px "IBM Plex Mono", monospace`;
      ctx.fillText(e.lbl, pt.x + 6, pt.y + 4);
    }
    ctx.restore();

    // Step 2: 外接包络线框
    if (st.step >= 2) {
      const hull = makeBox(-0.85, 0.85, -0.85, 0.85, -0.75, 0.75, PART_PALETTES.base);
      drawSimpleSolid(ctx, hull, basis, cx, cy, sc, {
        fillFaces: false,
        showHidden: st.step === 2 || st.showHidden,
        strokeW: st.step === 2 ? 1.8 : 0.85,
        strokeColor: st.step === 2 ? "#E6F4FF" : "rgba(78, 190, 224, 0.25)",
        hiddenColor: "rgba(130, 198, 232, 0.32)"
      });
    }

    // Step 3+: 阶梯缺口与圆柱特征细节
    if (st.step >= 3) {
      const pal = st.step >= 5
        ? PART_PALETTES.body
        : { top: "rgba(8,84,152,0.16)", left: "rgba(8,84,152,0.12)", right: "rgba(8,84,152,0.08)", bottom: "#031A35", stroke: "#B8DEF5", hidden: "rgba(140,210,242,0.4)" };
      const solids = [
        makeBox(-0.85, 0.85, -0.85, 0.85, -0.75, -0.08, pal),
        makeBox(-0.85, -0.06, -0.85, 0.85, -0.08, 0.75, pal),
        makeCylinder(0.36, 0.16, 0.30, -0.08, 0.62, 16, st.step >= 5 ? PART_PALETTES.connector : pal)
      ];
      const useHidden = st.step >= 4 && st.showHidden;
      const strokeW = st.step >= 5 && st.lineHierarchy ? 1.8 : 1.05;
      for (const s of solids) {
        drawSimpleSolid(ctx, s, basis, cx, cy, sc, {
          fillFaces: st.step >= 5,
          showHidden: useHidden,
          strokeW,
          strokeColor: st.step >= 5 && st.lineHierarchy ? "#E6F4FF" : "#9CC8E6",
          hiddenColor: "rgba(230, 193, 90, 0.52)"
        });
      }
      // 侧圆孔
      const holePts = [];
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        holePts.push(projectPoint([0.854, Math.cos(a) * 0.22, -0.42 + Math.sin(a) * 0.22], basis, cx, cy, sc));
      }
      drawPoly(ctx, holePts);
      if (st.step >= 5) { ctx.fillStyle = "#021124"; ctx.fill(); }
      ctx.strokeStyle = "#E6C15A";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // 右上角线型图例
    ctx.save();
    ctx.font = `500 11px "IBM Plex Mono", monospace`;
    ctx.textAlign = "right";
    ctx.fillStyle = "#A4CBE8";
    ctx.fillText(`STEP 0${st.step} / 05`, W - 16, 22);
    ctx.fillStyle = st.showHidden ? "#E6C15A" : "#7E9CB8";
    ctx.fillText(st.showHidden ? "隐藏虚线：开" : "隐藏虚线：关", W - 16, 40);
    ctx.fillStyle = st.lineHierarchy ? "#5CE0B8" : "#7E9CB8";
    ctx.fillText(st.lineHierarchy ? "线宽分级：外粗 1.8px / 隐 0.9px" : "等宽细线：1.0px", W - 16, 58);
    ctx.restore();

    if (readout) {
      let extra = "";
      if (st.step >= 4 && !st.showHidden) extra = "（当前关掉了隐藏虚线，内部交接与背面厚度被挡住。）";
      else if (st.step === 5 && !st.lineHierarchy) extra = "（当前为等宽单线，轮廓与内部棱线主次变弱。）";
      readout.textContent = STEP_NOTES[st.step] + extra;
    }
  };

  const runner = loop(canvas, () => render());
  for (const b of stepBtns) {
    b.addEventListener("click", () => {
      st.step = Number(b.dataset.s03Step);
      stepBtns.forEach((x) => {
        x.classList.toggle("is-active", x === b);
        x.setAttribute("aria-pressed", String(x === b));
      });
      runner.draw();
    });
  }
  if (togHidden) {
    togHidden.addEventListener("click", () => {
      st.showHidden = !st.showHidden;
      togHidden.classList.toggle("is-active", st.showHidden);
      togHidden.setAttribute("aria-pressed", String(st.showHidden));
      togHidden.textContent = st.showHidden ? "隐藏虚线：开" : "隐藏虚线：关";
      runner.draw();
    });
  }
  if (togWeight) {
    togWeight.addEventListener("click", () => {
      st.lineHierarchy = !st.lineHierarchy;
      togWeight.classList.toggle("is-active", st.lineHierarchy);
      togWeight.setAttribute("aria-pressed", String(st.lineHierarchy));
      togWeight.textContent = st.lineHierarchy ? "粗细线宽：分级" : "粗细线宽：等宽";
      runner.draw();
    });
  }
  window.addEventListener("resize", () => runner.draw());
  runner.draw();
}

// =========================================================================
// 04 节：平行投影的家族边界 — 双视口拉帘对比（正轴测 vs 透视 / 斜投影）
// =========================================================================
function initSection04() {
  const canvas = document.getElementById("lab-compare");
  if (!canvas) return;
  const slider = document.getElementById("s04-split");
  const readout = document.getElementById("s04-readout");
  const modeBtns = [...document.querySelectorAll("[data-s04-rival]")];

  const st = { split: 50, rival: "persp2" };

  // 构造三排等高阶梯方柱，便于用尺子直观比较前柱与后柱的屏幕高度
  const pillars = [
    makeBox(-1.35, -0.65, -0.35, 0.35, -0.6, 0.85, { top: "#5CC3E6", left: "#0D5CA8", right: "#06366B", bottom: "#031E3E", stroke: "#071A30", hidden: "transparent" }),
    makeBox(-0.35, 0.35, -0.35, 0.35, -0.6, 0.85, { top: "#5CC3E6", left: "#0D5CA8", right: "#06366B", bottom: "#031E3E", stroke: "#071A30", hidden: "transparent" }),
    makeBox(0.65, 1.35, -0.35, 0.35, -0.6, 0.85, { top: "#5CC3E6", left: "#0D5CA8", right: "#06366B", bottom: "#031E3E", stroke: "#071A30", hidden: "transparent" })
  ];

  // 斜投影（45° 橱柜 0.5×）投影函数，正面严格平行于画面
  function projectOblique(pt, cx, cy, sc) {
    const [x, y, z] = pt;
    const k = 0.52;
    const ang = 40 * (Math.PI / 180);
    return {
      x: cx + (x + y * k * Math.cos(ang)) * sc,
      y: cy - (z + y * k * Math.sin(ang)) * sc,
      depth: -y
    };
  }

  function drawSceneMode(ctx, mode, W, H) {
    const cx = W * 0.5;
    const cy = H * 0.56;
    const sc = Math.min(W * 0.145, H * 0.25);

    if (mode === "oblique") {
      // 45° 斜投影：正面保持绝对矩形，顶/侧沿斜线后退
      for (const s of pillars) {
        const proj = s.verts.map((v) => projectOblique(v, cx, cy, sc));
        // 画顶、右、前三个可见面
        const fList = [
          { idx: [4, 5, 6, 7], fill: "#5CC3E6" },
          { idx: [1, 2, 6, 5], fill: "#06366B" },
          { idx: [0, 1, 5, 4], fill: "#0D5CA8" }
        ];
        for (const f of fList) {
          drawPoly(ctx, f.idx.map((i) => proj[i]));
          ctx.fillStyle = f.fill;
          ctx.fill();
          ctx.strokeStyle = "#071A30";
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }
      return { nearH: Math.round(1.45 * sc), farH: Math.round(1.45 * sc), note: "斜投影（074）：同样没有透视近大远小，但正面完全锁死平行于画纸，适合保留正面真实圆与尺寸。" };
    }

    const yaw = mode === "persp1" ? 8 : (mode === "axo" ? 32 : 42);
    const pitch = mode === "persp1" ? 16 : (mode === "axo" ? 28 : 26);
    const persp = mode === "axo" ? 0 : (mode === "persp1" ? 56 : 52);
    const basis = makeBasis(yaw, pitch);

    // 按深度排三根柱子
    const ordered = [...pillars].sort((a, b) => {
      const da = projectPoint(a.verts[0], basis, cx, cy, sc, persp).depth;
      const db = projectPoint(b.verts[0], basis, cx, cy, sc, persp).depth;
      return da - db;
    });
    for (const s of ordered) {
      drawSimpleSolid(ctx, s, basis, cx, cy, sc, { persp, strokeW: 1.4 });
    }
    const pNear0 = projectPoint([1.35, 0.35, -0.6], basis, cx, cy, sc, persp);
    const pNear1 = projectPoint([1.35, 0.35, 0.85], basis, cx, cy, sc, persp);
    const pFar0 = projectPoint([-1.35, -0.35, -0.6], basis, cx, cy, sc, persp);
    const pFar1 = projectPoint([-1.35, -0.35, 0.85], basis, cx, cy, sc, persp);
    const nearH = Math.round(Math.hypot(pNear1.x - pNear0.x, pNear1.y - pNear0.y));
    const farH = Math.round(Math.hypot(pFar1.x - pFar0.x, pFar1.y - pFar0.y));

    const notes = {
      persp2: `两点透视（071）：三根物理等高立柱中，近柱高 ${nearH}px、远柱缩至 ${farH}px，纵深冲击力强但不能直接拿尺量。`,
      persp1: `一点透视（070）：纵深向中心消失点急剧汇聚，近柱 ${nearH}px / 远柱 ${farH}px，适合走廊沉浸感，不适合零件装配。`,
      axo: `正轴测（076）：近柱与远柱同高（均为 ${nearH}px），全部平行线永不汇聚。`
    };
    return { nearH, farH, note: notes[mode] };
  }

  const render = () => {
    const info = setupCanvas(canvas);
    if (!info) return;
    const { ctx, W, H } = info;
    const splitX = (st.split / 100) * W;

    // 左侧：正轴测
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, splitX, H); ctx.clip();
    ctx.fillStyle = "#F4F8FC";
    ctx.fillRect(0, 0, W, H);
    const leftRes = drawSceneMode(ctx, "axo", W, H);
    ctx.restore();

    // 右侧：对比投影
    ctx.save();
    ctx.beginPath(); ctx.rect(splitX, 0, W - splitX, H); ctx.clip();
    ctx.fillStyle = "#EBF0F6";
    ctx.fillRect(0, 0, W, H);
    const rightRes = drawSceneMode(ctx, st.rival, W, H);
    ctx.restore();

    // 分隔拉帘线与手柄
    ctx.save();
    ctx.strokeStyle = "#064B8C";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(splitX, 0); ctx.lineTo(splitX, H); ctx.stroke();
    ctx.fillStyle = "#064B8C";
    ctx.fillRect(splitX - 14, H * 0.5 - 14, 28, 28);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 13px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("↔", splitX, H * 0.5);

    // 左右角标
    const rivalName = st.rival === "persp2" ? "两点透视 (071)" : (st.rival === "persp1" ? "一点透视 (070)" : "斜投影 (074)");
    ctx.font = `700 11.5px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = "#064B8C";
    ctx.fillText(`正轴测 · 近远等高 ${leftRes.nearH}px`, 12, 10);
    ctx.textAlign = "right";
    ctx.fillStyle = "#7A5800";
    ctx.fillText(`${rivalName} · ${rightRes.nearH}px / ${rightRes.farH}px`, W - 12, 10);
    ctx.restore();

    if (readout) {
      readout.textContent = `左镜正轴测：三排立柱恒为 ${leftRes.nearH}px 等高。右镜${rightRes.note}`;
    }
  };

  const runner = loop(canvas, () => render());
  if (slider) {
    slider.addEventListener("input", () => {
      st.split = Number(slider.value);
      runner.draw();
    });
  }
  let dragging = false;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    const rect = canvas.getBoundingClientRect();
    st.split = clamp(((e.clientX - rect.left) / rect.width) * 100, 12, 88);
    if (slider) slider.value = String(Math.round(st.split));
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    runner.draw();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    st.split = clamp(((e.clientX - rect.left) / rect.width) * 100, 12, 88);
    if (slider) slider.value = String(Math.round(st.split));
    runner.draw();
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  for (const b of modeBtns) {
    b.addEventListener("click", () => {
      st.rival = b.dataset.s04Rival;
      modeBtns.forEach((x) => {
        x.classList.toggle("is-active", x === b);
        x.setAttribute("aria-pressed", String(x === b));
      });
      runner.draw();
    });
  }
  window.addEventListener("resize", () => runner.draw());
  runner.draw();
}

// =========================================================================
// 05 节：从机械讲台到现代建筑 — 5 个经核实历史节点图版胶片
// =========================================================================
function initSection05() {
  const canvas = document.getElementById("lab-history");
  if (!canvas) return;
  const titleEl = document.getElementById("s05-title");
  const bodyEl = document.getElementById("s05-body");
  const btns = [...document.querySelectorAll("[data-s05-era]")];

  const ERAS = {
    taccola: {
      title: "1430s–1500s · 塔科拉与达·芬奇的爆炸分解稿",
      body: "意大利文艺复兴工程师 Mariano Taccola 在《论机械》（De ingeneis，始于 1419 年）里率先把机械部件拆开并按装配顺序排布；半个世纪后 Leonardo da Vinci 在手稿中把爆炸分解画法推向高峰，让齿轮、销轴与壳体的内部咬合在一页纸上同时可见。",
      draw: (ctx, W, H) => {
        const basis = makeBasis(38, 28);
        const cx = W * 0.5, cy = H * 0.56, sc = Math.min(W * 0.12, H * 0.24);
        const pal = { top: "#E8DFC8", left: "#C9BA97", right: "#9F8E6B", bottom: "#5E513A", stroke: "#2E2518", hidden: "rgba(46,37,24,0.3)" };
        const parts = [
          makeBox(-0.8, 0.8, -0.5, 0.5, -0.95, -0.55, pal),
          makeCylinder(0, 0, 0.34, -0.15, 0.32, 16, pal),
          makeBox(-0.65, 0.65, -0.45, 0.45, 0.68, 0.92, pal)
        ];
        // 轴线
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "#7A5800";
        const a0 = projectPoint([0, 0, -1.1], basis, cx, cy, sc);
        const a1 = projectPoint([0, 0, 1.15], basis, cx, cy, sc);
        ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(a1.x, a1.y); ctx.stroke();
        ctx.restore();
        for (const p of parts) drawSimpleSolid(ctx, p, basis, cx, cy, sc, { strokeW: 1.3 });
      }
    },
    farish: {
      title: "1820 / 1822 · William Farish 正式确立等距法",
      body: "剑桥大学教授 William Farish 为课堂上反复拆装的模块化机器设计了统一绘图规范，1820 年宣读、1822 年刊于《剑桥哲学学会会刊》卷一的《On Isometrical Perspective》首次给出了系统的三轴 120° 等距几何法，直接催生了现代机械制图。",
      draw: (ctx, W, H) => {
        const basis = makeBasis(45, 35.26);
        const cx = W * 0.5, cy = H * 0.56, sc = Math.min(W * 0.135, H * 0.26);
        const pal = { top: "#5BC0E4", left: "#0D5CA8", right: "#06366B", bottom: "#021833", stroke: "#071A30", hidden: "rgba(7,26,48,0.28)" };
        drawSimpleSolid(ctx, makeBox(-0.75, 0.75, -0.75, 0.75, -0.75, 0.75, pal), basis, cx, cy, sc, { showHidden: true, strokeW: 1.4 });
        // 标出 120°
        ctx.fillStyle = "#064B8C";
        ctx.font = `600 12px "IBM Plex Mono", monospace`;
        ctx.textAlign = "left";
        ctx.fillText("120° / 120° / 120°", 16, 26);
      }
    },
    pohlke: {
      title: "1853–1864 · 波尔克–施瓦茨轴测基本定理",
      body: "柏林建筑学院教师 Karl Wilhelm Pohlke 于 1853 年提出、1860 年在《画法几何》（Darstellende Geometrie）中发表轴测基本定理，并由学生 Hermann Amandus Schwarz 于 1864 年给出首个严格证明：平面上任三条不共线的共点线段，都能视为正方体三条等长棱的平行投影。",
      draw: (ctx, W, H) => {
        const basis = makeBasis(24, 41);
        const cx = W * 0.5, cy = H * 0.55, sc = Math.min(W * 0.13, H * 0.26);
        const pal = { top: "#A6D9EC", left: "#1A6CC2", right: "#083F7A", bottom: "#031D3B", stroke: "#071A30", hidden: "rgba(7,26,48,0.3)" };
        drawSimpleSolid(ctx, makeBox(-0.65, 0.65, -0.65, 0.65, -0.65, 0.65, pal), basis, cx, cy, sc, { showHidden: true, strokeW: 1.4 });
        ctx.fillStyle = "#0A5A75";
        ctx.font = `600 12px "IBM Plex Mono", monospace`;
        ctx.textAlign = "left";
        ctx.fillText(`p=${basis.p.toFixed(2)}  q=${basis.q.toFixed(2)}  r=${basis.r.toFixed(2)}`, 16, 26);
      }
    },
    choisy: {
      title: "1873 / 1899 · Auguste Choisy 的建筑轴测解剖",
      body: "法国结构工程师兼建筑史家 Auguste Choisy 在《罗马建筑艺术》（1873）与《建筑史》（1899）中大规模采用仰视轴测剖面图：一张图同时交代平面布局、承重剖面与穹顶体量，让建筑不再被拆碎成彼此割裂的平立剖。",
      draw: (ctx, W, H) => {
        // 仰视剖面轴测示意（pitch < 0 从下往上看拱肋结构）
        const basis = makeBasis(42, -26);
        const cx = W * 0.5, cy = H * 0.46, sc = Math.min(W * 0.125, H * 0.24);
        const pal = { top: "#CBD5E1", left: "#7B8EA3", right: "#495B70", bottom: "#1E3A5F", stroke: "#071A30", hidden: "rgba(7,26,48,0.22)" };
        const pieces = [
          makeBox(-0.9, -0.55, -0.9, -0.55, -0.8, 0.65, pal),
          makeBox(0.55, 0.9, -0.9, -0.55, -0.8, 0.65, pal),
          makeBox(-0.9, -0.55, 0.55, 0.9, -0.8, 0.65, pal),
          makeBox(0.55, 0.9, 0.55, 0.9, -0.8, 0.65, pal),
          makeBox(-0.95, 0.95, -0.95, 0.95, 0.65, 0.95, { ...pal, bottom: "#0D5CA8" })
        ];
        for (const s of pieces) drawSimpleSolid(ctx, s, basis, cx, cy, sc, { strokeW: 1.25 });
        ctx.fillStyle = "#064B8C";
        ctx.font = `600 11.5px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.fillText("仰视轴测：柱网、顶棚与平面一次读清", 16, 26);
      }
    },
    destijl: {
      title: "1923 & 1996 · 风格派反构筑与 ISO 5456-3 标准",
      body: "1923 年荷兰风格派 Theo van Doesburg 与建筑师 Cornelis van Eesteren 创作《Contra-Construction Project》（现藏纽约 MoMA），借轴测把建筑抽离成悬浮彩面；1996 年国际标准化组织发布 ISO 5456-3，把等轴测、二轴测与斜轴测写成全球通用的工程制图规范。",
      draw: (ctx, W, H) => {
        const basis = makeBasis(36, 32);
        const cx = W * 0.5, cy = H * 0.55, sc = Math.min(W * 0.13, H * 0.25);
        const planes = [
          makeBox(-1.0, 0.7, -0.05, 0.08, -0.55, 0.75, { top: "#0D5CA8", left: "#0D5CA8", right: "#063D77", bottom: "#04264C", stroke: "#071A30", hidden: "transparent" }),
          makeBox(-0.35, 0.95, -0.85, 0.75, 0.22, 0.34, { top: "#E6C15A", left: "#C9A136", right: "#A37E1E", bottom: "#7A5800", stroke: "#071A30", hidden: "transparent" }),
          makeBox(-0.1, 0.04, -0.95, 0.85, -0.75, 0.45, { top: "#E2E8F0", left: "#CBD5E1", right: "#94A3B8", bottom: "#64748B", stroke: "#071A30", hidden: "transparent" })
        ];
        for (const s of planes) drawSimpleSolid(ctx, s, basis, cx, cy, sc, { strokeW: 1.4 });
        ctx.fillStyle = "#7A5800";
        ctx.font = `600 11.5px "IBM Plex Mono", monospace`;
        ctx.textAlign = "left";
        ctx.fillText("DE STIJL 1923 · ISO 5456-3:1996", 16, 26);
      }
    }
  };

  let cur = "farish";
  const render = () => {
    const info = setupCanvas(canvas);
    if (!info) return;
    const { ctx, W, H } = info;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(7, 26, 48, 0.05)";
    ctx.beginPath();
    for (let x = 24; x < W; x += 24) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
    for (let y = 24; y < H; y += 24) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
    ctx.stroke();

    const era = ERAS[cur];
    era.draw(ctx, W, H);
    if (titleEl) titleEl.textContent = era.title;
    if (bodyEl) bodyEl.textContent = era.body;
  };

  const runner = loop(canvas, () => render());
  for (const b of btns) {
    b.addEventListener("click", () => {
      cur = b.dataset.s05Era;
      btns.forEach((x) => {
        x.classList.toggle("is-active", x === b);
        x.setAttribute("aria-pressed", String(x === b));
      });
      runner.draw();
    });
  }
  window.addEventListener("resize", () => runner.draw());
  runner.draw();
}

// =========================================================================
// 06 节：何时用，什么时候别用 — 空间歧义（Necker 翻转与遮挡盲区）诊断
// =========================================================================
function initSection06() {
  const canvas = document.getElementById("lab-limits");
  if (!canvas) return;
  const readout = document.getElementById("s06-readout");
  const btns = [...document.querySelectorAll("[data-s06-trap]")];

  let trap = "necker";

  const render = () => {
    const info = setupCanvas(canvas);
    if (!info) return;
    const { ctx, W, H } = info;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);

    const cx = W * 0.5, cy = H * 0.54, sc = Math.min(W * 0.14, H * 0.25);

    if (trap === "necker") {
      // 等轴测纯等宽线框立方体：前后对角完全重合，产生经典 Necker 翻转歧义
      const basis = makeBasis(45, 35.26);
      const box = makeBox(-0.75, 0.75, -0.75, 0.75, -0.75, 0.75, PART_PALETTES.base);
      const proj = box.verts.map((v) => projectPoint(v, basis, cx, cy, sc));
      ctx.strokeStyle = "#071A30";
      ctx.lineWidth = 1.8;
      for (const [a, b] of box.edges) {
        ctx.beginPath(); ctx.moveTo(proj[a].x, proj[a].y); ctx.lineTo(proj[b].x, proj[b].y); ctx.stroke();
      }
      // 标出重合中心点
      const cPt = proj[0];
      ctx.beginPath(); ctx.arc(cPt.x, cPt.y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = "#B42318"; ctx.lineWidth = 1.8; ctx.setLineDash([3, 3]); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#B42318";
      ctx.font = `600 12px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("前后角点完全重叠 · 凹面与凸面来回翻转", cx, 24);
      if (readout) readout.textContent = "空间翻转歧义（Necker 错觉）：等轴测 45°/35.26° 下，若不做明暗区分或隐线虚实，正方体最前与最后的角点精确落到同一个像素，人眼无法分清哪面朝前。";
    } else if (trap === "depth") {
      // 无近大远小导致的前后距离混淆：两块等大积木悬在空中无法分辨谁近谁远
      const basis = makeBasis(45, 35.26);
      const palA = { top: "#5BC0E4", left: "#0D5CA8", right: "#06366B", bottom: "#031D3B", stroke: "#071A30", hidden: "transparent" };
      const palB = { top: "#E6C15A", left: "#C49A2E", right: "#916D14", bottom: "#5C4308", stroke: "#071A30", hidden: "transparent" };
      // 沿视线向量 V 移动，投影落点相近且大小完全一致
      drawSimpleSolid(ctx, makeBox(-1.15, -0.55, -0.3, 0.3, -0.3, 0.3, palA), basis, cx, cy, sc, { strokeW: 1.4 });
      drawSimpleSolid(ctx, makeBox(0.55, 1.15, -0.3, 0.3, -0.3, 0.3, palB), basis, cx, cy, sc, { strokeW: 1.4 });
      ctx.fillStyle = "#7A5800";
      ctx.font = `600 12px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("缺少地面投影与近大远小：两块悬空体无法判断前后距", cx, 24);
      if (readout) readout.textContent = "景深距离模糊：因为平行投影不会近大远小，如果画面中存在大量悬空或深纵深物体又没有地面参考网，读者无法凭体积直觉判断远近距离。";
    } else {
      // 换用透视 + 地面网解围，一眼分出宏大纵深
      const basis = makeBasis(36, 18);
      const palA = { top: "#5BC0E4", left: "#0D5CA8", right: "#06366B", bottom: "#031D3B", stroke: "#071A30", hidden: "transparent" };
      const palB = { top: "#E6C15A", left: "#C49A2E", right: "#916D14", bottom: "#5C4308", stroke: "#071A30", hidden: "transparent" };
      drawSimpleSolid(ctx, makeBox(-1.45, -0.85, -0.5, 0.1, -0.5, 0.7, palA), basis, cx, cy, sc, { persp: 52, strokeW: 1.4 });
      drawSimpleSolid(ctx, makeBox(0.55, 1.15, 0.1, 0.7, -0.5, 0.7, palB), basis, cx, cy, sc, { persp: 52, strokeW: 1.4 });
      ctx.fillStyle = "#0E6245";
      ctx.font = `600 12px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("改用线性透视：近大远小立刻交代前后纵深与临场感", cx, 24);
      if (readout) readout.textContent = "何时别用轴测：当你追求电影镜头般的临场压迫感、广角宏大纵深或近景人物情感时，应该放下轴测，转向线性透视（069–072）。";
    }
  };

  const runner = loop(canvas, () => render());
  for (const b of btns) {
    b.addEventListener("click", () => {
      trap = b.dataset.s06Trap;
      btns.forEach((x) => {
        x.classList.toggle("is-active", x === b);
        x.setAttribute("aria-pressed", String(x === b));
      });
      runner.draw();
    });
  }
  window.addEventListener("resize", () => runner.draw());
  runner.draw();
}

// =========================================================================
// 07 节：动手判一判 — 四张仅差单一变量的微型蓝图工程诊题
// =========================================================================
function initSection07() {
  const cards = [...document.querySelectorAll("[data-quiz-opt]")];
  const fb = document.getElementById("quiz-feedback");
  if (!cards.length) return;

  const EXPLAINS = {
    A: {
      ok: false,
      title: "方案 A 不够清楚 — 层间爆炸归零，零件互相压死",
      body: "虽然轴向统一、透视也为零，但四个零件全部压在底座位置，内部销轴与蓝色主体的咬合槽被互相遮挡，工程师看不出装配顺序。"
    },
    B: {
      ok: true,
      title: "答对了！方案 B 最合适 — 轴向一致、适度爆炸、导轨与隐线清晰",
      body: "四个组件严格共享同一套正轴测三轴方向，沿 Z 轴留出清晰又紧凑的装配间隙，再用垂直虚线导轨串起圆孔与销轴的插接路径，外粗内细与隐线让结构一目了然。"
    },
    C: {
      ok: false,
      title: "方案 C 不够清楚 — 拆解过度且少了装配导轨",
      body: "零件被炸得过于分散，同时删掉了垂直虚线导轨，视觉上变成几块互不相干的孤立几何体，读者难以一眼对应谁插进哪个孔里。"
    },
    D: {
      ok: false,
      title: "方案 D 不够清楚 — 同一张图里各组件轴向各自偏斜",
      body: "顶板、主体与连接件各自用了不同的旋转角，违背了「保持轴向一致，避免倾斜」的基本纪律，不仅尺度无法互比，还显得凌乱失真。"
    }
  };

  // 为每张选项卡片实时绘制对应的微型蓝图
  function drawOptionCanvas(opt, canvas) {
    const info = setupCanvas(canvas);
    if (!info) return;
    const { ctx, W, H } = info;
    ctx.fillStyle = "#031A35";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(78, 190, 224, 0.08)";
    ctx.beginPath();
    for (let x = 20; x < W; x += 20) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
    for (let y = 20; y < H; y += 20) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
    ctx.stroke();

    const cx = W * 0.5;
    const cy = H * 0.56;
    const sc = Math.min(W * 0.145, H * 0.165);
    const basisMain = makeBasis(45, 35.26);

    const cfg = {
      A: { zs: [-0.4, -0.05, 0.25, 0.55], guides: false, yaws: [45, 45, 45, 45], dx: [0, 0, 0, 0] },
      B: { zs: [-1.15, -0.25, 0.65, 1.48], guides: true, yaws: [45, 45, 45, 45], dx: [0, 0, 0, 0] },
      C: { zs: [-1.65, -0.55, 0.75, 1.85], guides: false, yaws: [45, 45, 45, 45], dx: [-0.85, 0.9, -0.7, 0.75] },
      D: { zs: [-1.15, -0.25, 0.65, 1.48], guides: false, yaws: [45, 14, 74, 22], dx: [0, 0, 0, 0] }
    }[opt];

    if (cfg.guides) {
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "rgba(230, 193, 90, 0.65)";
      ctx.lineWidth = 1.1;
      const g0 = projectPoint([0, 0, -1.2], basisMain, cx, cy, sc);
      const g1 = projectPoint([0, 0, 1.7], basisMain, cx, cy, sc);
      ctx.beginPath(); ctx.moveTo(g0.x, g0.y); ctx.lineTo(g1.x, g1.y); ctx.stroke();
      ctx.restore();
    }

    const parts = [
      makeBox(-0.78 + cfg.dx[0], 0.78 + cfg.dx[0], -0.78, 0.78, cfg.zs[0], cfg.zs[0] + 0.52, PART_PALETTES.base),
      makeCylinder(cfg.dx[1], 0, 0.30, cfg.zs[1], cfg.zs[1] + 0.58, 12, PART_PALETTES.connector),
      makeBox(-0.76 + cfg.dx[2], 0.76 + cfg.dx[2], -0.76, 0.76, cfg.zs[2], cfg.zs[2] + 0.44, PART_PALETTES.body),
      makeBox(-0.76 + cfg.dx[3], 0.76 + cfg.dx[3], -0.76, 0.76, cfg.zs[3], cfg.zs[3] + 0.16, PART_PALETTES.plate)
    ];
    parts.forEach((p, idx) => {
      const b = makeBasis(cfg.yaws[idx], 35.26);
      drawSimpleSolid(ctx, p, b, cx, cy, sc, { showHidden: opt === "B", strokeW: 1.15 });
    });
  }

  const redrawAll = () => {
    for (const card of cards) {
      const c = card.querySelector("canvas");
      if (c) drawOptionCanvas(card.dataset.quizOpt, c);
    }
  };

  for (const card of cards) {
    card.addEventListener("click", () => {
      const opt = card.dataset.quizOpt;
      const res = EXPLAINS[opt];
      cards.forEach((x) => {
        const isMe = x === card;
        x.classList.toggle("is-picked", isMe);
        x.classList.toggle("is-correct", isMe && res.ok);
        x.classList.toggle("is-wrong", isMe && !res.ok);
        x.setAttribute("aria-pressed", String(isMe));
      });
      if (fb) {
        fb.hidden = false;
        fb.dataset.tone = res.ok ? "ok" : "err";
        fb.innerHTML = `<strong>${res.title}</strong><p>${res.body}</p>`;
      }
    });
  }

  window.addEventListener("resize", redrawAll);
  requestAnimationFrame(redrawAll);
}

// =========================================================================
// 08 节：原海报灯箱（复用 #poster.src，不重复内联；可放大、拖动、Esc 关）
// =========================================================================
function initLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const dialog = document.getElementById("poster-lightbox");
  const img = document.getElementById("lb-img");
  const closeBtn = document.getElementById("lb-close");
  const zoomIn = document.getElementById("lb-zin");
  const zoomOut = document.getElementById("lb-zout");
  const zoomReset = document.getElementById("lb-zreset");
  const viewport = document.getElementById("lb-viewport");
  if (!poster || !dialog || !img) return;

  let z = 1, tx = 0, ty = 0;
  const apply = () => {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
  };
  const open = () => {
    if (!img.getAttribute("src")) img.src = poster.src;
    z = 1; tx = 0; ty = 0; apply();
    dialog.showModal();
  };
  const close = () => {
    if (dialog.open) dialog.close();
  };

  poster.addEventListener("click", open);
  if (openBtn) openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  if (zoomIn) zoomIn.addEventListener("click", () => { z = clamp(z + 0.35, 0.8, 3.2); apply(); });
  if (zoomOut) zoomOut.addEventListener("click", () => { z = clamp(z - 0.35, 0.8, 3.2); apply(); });
  if (zoomReset) zoomReset.addEventListener("click", () => { z = 1; tx = 0; ty = 0; apply(); });

  let pan = null;
  viewport.addEventListener("pointerdown", (e) => {
    pan = { id: e.pointerId, x0: e.clientX, y0: e.clientY, tx0: tx, ty0: ty };
    try { viewport.setPointerCapture(e.pointerId); } catch {}
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!pan || e.pointerId !== pan.id) return;
    tx = pan.tx0 + (e.clientX - pan.x0);
    ty = pan.ty0 + (e.clientY - pan.y0);
    apply();
  });
  viewport.addEventListener("pointerup", () => { pan = null; });
  viewport.addEventListener("pointercancel", () => { pan = null; });
  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    z = clamp(z + (e.deltaY < 0 ? 0.18 : -0.18), 0.8, 3.2);
    apply();
  }, { passive: false });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      close();
    }
  });
}

export function initLabs() {
  initSection01();
  initSection02();
  initSection03();
  initSection04();
  initSection05();
  initSection06();
  initSection07();
  initLightbox();
}

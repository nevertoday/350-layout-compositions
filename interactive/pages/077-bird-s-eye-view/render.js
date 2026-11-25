// 077 鸟瞰构图 · 纯 2D 矢量三维建筑画布与各节图解渲染器
import {
  PALETTE,
  PLAZA_NODES,
  SUB_PLAZAS,
  TREES,
  PEDESTRIANS,
  projectPoint,
  getFlowPaths,
  evaluateView,
} from "./model.js";

const DEG = Math.PI / 180;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function drawPoly(ctx, pts) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

function drawProjectedCircle(ctx, cam, cx, cz, radius, y = 0.01, segs = 32) {
  const pts = [];
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    pts.push(projectPoint(cam, { x: cx + Math.cos(a) * radius, y, z: cz + Math.sin(a) * radius }));
  }
  drawPoly(ctx, pts);
  return pts;
}

// 绘制带柔和笔触质感的建筑总图底板与主路网（批量合批绘制以保软渲染满帧）
function drawGroundAndRoads(ctx, cam, orderMix, activeLens) {
  const gridAlpha = activeLens === "order" || activeLens === "relation" ? 0.24 : 0.08;
  ctx.save();
  ctx.strokeStyle = `rgba(103, 106, 62, ${gridAlpha})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -5; i <= 5; i++) {
    const a = projectPoint(cam, { x: i, y: 0, z: -5.4 });
    const b = projectPoint(cam, { x: i, y: 0, z: 5.4 });
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    const c = projectPoint(cam, { x: -5.2, y: 0, z: i });
    const d = projectPoint(cam, { x: 5.2, y: 0, z: i });
    ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y);
  }
  ctx.stroke();

  // 主干道暖白铺装（单次合批 fill）
  const roadAlpha = 0.35 + 0.62 * orderMix;
  ctx.fillStyle = `rgba(250, 246, 238, ${roadAlpha})`;
  const roadRects = [
    [0.62, -5.3, 1.38, 10.8],
    [-5.1, -1.85, 10.3, 0.82],
    [-5.1, 0.28, 7.2, 0.84],
    [-1.4, -1.6, 2.9, 3.6],
  ];
  ctx.beginPath();
  for (const [x, z, w, d] of roadRects) {
    const p0 = projectPoint(cam, { x, y: 0, z });
    const p1 = projectPoint(cam, { x: x + w, y: 0, z });
    const p2 = projectPoint(cam, { x: x + w, y: 0, z: z + d });
    const p3 = projectPoint(cam, { x, y: 0, z: z + d });
    ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.closePath();
  }
  ctx.fill();

  // 斑马线（单次合批 fill）
  if (orderMix > 0.35) {
    ctx.fillStyle = `rgba(255, 253, 248, ${0.85 * orderMix})`;
    ctx.beginPath();
    const addCrosswalk = (x0, z0, count, horiz) => {
      for (let i = 0; i < count; i++) {
        const sx = horiz ? x0 + i * 0.22 : x0;
        const sz = horiz ? z0 : z0 + i * 0.22;
        const sw = horiz ? 0.12 : 0.44;
        const sd = horiz ? 0.44 : 0.12;
        const p0 = projectPoint(cam, { x: sx, y: 0.005, z: sz });
        const p1 = projectPoint(cam, { x: sx + sw, y: 0.005, z: sz });
        const p2 = projectPoint(cam, { x: sx + sw, y: 0.005, z: sz + sd });
        const p3 = projectPoint(cam, { x: sx, y: 0.005, z: sz + sd });
        ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.closePath();
      }
    };
    addCrosswalk(0.84, -2.55, 5, false);
    addCrosswalk(0.84, 0.05, 4, false);
    addCrosswalk(-1.35, -0.35, 4, true);
    addCrosswalk(0.84, 2.25, 4, false);
    ctx.fill();
  }
  ctx.restore();
}

// 绘制四向陶土橙色虚线流线与箭头（带流光虚线微动）
function drawFlowPaths(ctx, cam, plaza, evalData, time, activeLens, still) {
  const routes = getFlowPaths(plaza);
  const pulse = activeLens === "path";
  const dashOffset = still ? 0 : -(time * 24) % 20;

  ctx.save();
  routes.forEach((route, idx) => {
    const status = evalData.pathStatus[idx];
    const pts2 = route.pts.map((p) => projectPoint(cam, p));
    if (pts2.length < 2) return;

    // 路径本体（柔和二次曲线平滑衔接）
    ctx.beginPath();
    ctx.moveTo(pts2[0].x, pts2[0].y);
    for (let i = 1; i < pts2.length - 1; i++) {
      const mx = (pts2[i].x + pts2[i + 1].x) * 0.5;
      const my = (pts2[i].y + pts2[i + 1].y) * 0.5;
      ctx.quadraticCurveTo(pts2[i].x, pts2[i].y, mx, my);
    }
    const last = pts2[pts2.length - 1];
    ctx.lineTo(last.x, last.y);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (status.ok) {
      ctx.strokeStyle = pulse ? "#E56510" : PALETTE.orangeBright;
      ctx.lineWidth = pulse ? 3.2 : 2.2;
      ctx.setLineDash([7, 6]);
      ctx.lineDashOffset = dashOffset;
    } else {
      ctx.strokeStyle = status.blockedPhysically ? "rgba(166, 52, 30, 0.72)" : "rgba(220, 111, 27, 0.45)";
      ctx.lineWidth = pulse ? 2.6 : 1.7;
      ctx.setLineDash([4, 7]);
      ctx.lineDashOffset = 0;
    }
    ctx.stroke();

    // 末端三角形箭头（1:1 呼应原海报四边橙色尖头）
    const prev = pts2[pts2.length - 2];
    const ang = Math.atan2(last.y - prev.y, last.x - prev.x);
    const sz = pulse ? 10 : 8;
    ctx.setLineDash([]);
    ctx.fillStyle = status.ok ? PALETTE.orangeBright : "rgba(166, 52, 30, 0.65)";
    ctx.beginPath();
    ctx.moveTo(last.x + Math.cos(ang) * (sz * 0.4), last.y + Math.sin(ang) * (sz * 0.4));
    ctx.lineTo(last.x - Math.cos(ang - 0.58) * sz, last.y - Math.sin(ang - 0.58) * sz);
    ctx.lineTo(last.x - Math.cos(ang + 0.58) * sz, last.y - Math.sin(ang + 0.58) * sz);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

// 主三维鸟瞰建筑沙盘渲染函数（主开场与小测验完全共用！）
export function drawAerialScene(ctx, state, evalData, opts = {}) {
  const { width, height, time = 0, still = false, interactive = true } = opts;
  const { cam, sun, orderMix, plaza, buildings } = evalData.scene;
  const activeLens = interactive ? state.activeLens : null;

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // 暖米宣纸底（与 077 原海报纸面完全融为一体；极低俯角时以极轻地平虚线提示平视视野）
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, width, height);

  if (state.pitch < 24) {
    const hy = Math.round(height * 0.22);
    ctx.strokeStyle = "rgba(122, 117, 103, 0.24)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(16, hy); ctx.lineTo(width - 16, hy); ctx.stroke();
    ctx.setLineDash([]);
  }

  // 1. 地面网格与街道
  drawGroundAndRoads(ctx, cam, orderMix, activeLens);

  // 2. 建筑与行道树几何投射阴影（合批两次 fill 绘完，零逐个重绘开销）
  ctx.save();
  const shadowHighlight = activeLens === "relation";
  ctx.fillStyle = shadowHighlight ? "rgba(72, 76, 41, 0.36)" : PALETTE.shadow;
  ctx.beginPath();
  for (const b of buildings) {
    const pts = b.shadow2;
    if (!pts.length) continue;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
  }
  ctx.fill();

  // 树影（合并进单个路径）
  ctx.fillStyle = "rgba(82, 78, 60, 0.22)";
  ctx.beginPath();
  for (const tr of TREES) {
    const sp = projectPoint(cam, { x: tr.x + sun.dx * tr.h * 0.85, y: 0.005, z: tr.z + sun.dz * tr.h * 0.85 });
    const rr = Math.max(3, (tr.r * 0.9 * cam.scale) / Math.max(4, sp.depth));
    ctx.moveTo(sp.x + rr, sp.y);
    ctx.ellipse(sp.x, sp.y, rr, rr * Math.max(0.32, Math.sin(cam.pitch)), 0, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();

  // 3. 橙色主广场与次级呼应节点（画在建筑前，低俯角时会被前景建筑真实遮挡！）
  const plazaAnchorsScreen = [];
  if (interactive) {
    // 若用户点击沙盘，可直选三个可选落点：中央枢纽 / 北院偏心 / 角落位
    for (const key of ["center", "north", "corner"]) {
      const node = PLAZA_NODES[key];
      const sp = projectPoint(cam, { x: node.x, y: 0.02, z: node.z });
      plazaAnchorsScreen.push({ key, x: sp.x, y: sp.y, r: Math.max(18, node.r * 26) });
      if (key !== state.plazaMode && (activeLens === "order" || state.plazaMode === "corner" || state.plazaMode === "none")) {
        // 轻量虚线圆环提示可点落位
        ctx.save();
        drawProjectedCircle(ctx, cam, node.x, node.z, node.r * 0.82, 0.015, 24);
        ctx.strokeStyle = key === "corner" ? "rgba(122, 117, 103, 0.35)" : "rgba(220, 111, 27, 0.55)";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // 主橙色广场（外环浅铺装 + 实心陶土橙圆）
  if (plaza.r > 0) {
    ctx.save();
    drawProjectedCircle(ctx, cam, plaza.x, plaza.z, plaza.apron, 0.01, 32);
    ctx.fillStyle = "#F7F2E6";
    ctx.fill();
    ctx.strokeStyle = "#DED6C5";
    ctx.lineWidth = 1;
    ctx.stroke();

    drawProjectedCircle(ctx, cam, plaza.x, plaza.z, plaza.r, 0.02, 32);
    ctx.fillStyle = PALETTE.orange;
    ctx.fill();
    ctx.strokeStyle = PALETTE.parapet;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // 若开启「俯瞰」或「全局」检视层，给主广场外加轻盈呼吸测绘圈
    if (activeLens === "overview" || activeLens === "order") {
      const rr = plaza.apron + (still ? 0.16 : 0.12 + 0.08 * Math.sin(time * 3));
      drawProjectedCircle(ctx, cam, plaza.x, plaza.z, rr, 0.025, 32);
      ctx.strokeStyle = "rgba(220, 111, 27, 0.65)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 东北小橙庭院与南侧小橙口袋广场（1:1 呼应原海报次级橙点关系）
  for (const sp of SUB_PLAZAS) {
    ctx.save();
    drawProjectedCircle(ctx, cam, sp.x, sp.z, sp.r, 0.02, 22);
    ctx.fillStyle = "#E07524";
    ctx.fill();
    if (sp.ring) {
      drawProjectedCircle(ctx, cam, sp.x, sp.z, sp.r * 0.42, 0.025, 16);
      ctx.strokeStyle = PALETTE.parapet;
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. 地面微缩行人（纯顶视圆点 + 细影，合批两次绘制，绝不画五官）
  ctx.save();
  const pedHeads = [];
  ctx.strokeStyle = "rgba(45, 44, 34, 0.32)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const p of PEDESTRIANS) {
    const u = still ? p.phase : (p.phase + time * p.speed) % 1;
    const pingpong = u < 0.5 ? u * 2 : (1 - u) * 2;
    const wx = p.x0 + (p.x1 - p.x0) * pingpong;
    const wz = p.z0 + (p.z1 - p.z0) * pingpong;
    const foot = projectPoint(cam, { x: wx, y: 0.02, z: wz });
    const head = projectPoint(cam, { x: wx, y: 0.18, z: wz });
    const sh = projectPoint(cam, { x: wx + sun.dx * 0.18, y: 0.01, z: wz + sun.dz * 0.18 });
    ctx.moveTo(foot.x, foot.y); ctx.lineTo(sh.x, sh.y);
    pedHeads.push(head);
  }
  ctx.stroke();
  ctx.fillStyle = "#26281F";
  ctx.beginPath();
  for (const head of pedHeads) {
    ctx.moveTo(head.x + 2.2, head.y);
    ctx.arc(head.x, head.y, 2.2, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();

  // 5. 四向橙色虚线流线（先画地面层；稍后在「路径」检视下于建筑上方再叠透视线）
  drawFlowPaths(ctx, cam, plaza, evalData, time, activeLens, still);

  // 6. 建筑与行道树严格按真实相机深度分桶交错合批（零前后穿帮，且总调用保持 ~110 次稳守软渲染满帧）
  const buckets = Array.from({ length: buildings.length + 1 }, () => []);
  for (const tr of TREES) {
    const crown = projectPoint(cam, { x: tr.x, y: tr.h, z: tr.z });
    const base = state.pitch < 68 ? projectPoint(cam, { x: tr.x, y: 0, z: tr.z }) : null;
    const d = base ? Math.min(crown.depth, base.depth) : crown.depth;
    // buildings 已按 centerDepth 由大（远）到小（近）排好序，找到第一栋比这棵树更近的建筑前插入
    let slot = buildings.length;
    for (let i = 0; i < buildings.length; i++) {
      if (buildings[i].minDepth < d) { slot = i; break; }
    }
    buckets[slot].push({ tr, crown, base });
  }

  const drawTreeBatch = (list) => {
    if (!list.length) return;
    if (state.pitch < 68) {
      ctx.strokeStyle = "#5B5442";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (const it of list) {
        ctx.moveTo(it.base.x, it.base.y);
        ctx.lineTo(it.crown.x, it.crown.y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.treeTop;
    ctx.beginPath();
    for (const it of list) {
      const rPx = Math.max(4, (it.tr.r * cam.scale) / Math.max(4, it.crown.depth));
      ctx.moveTo(it.crown.x + rPx, it.crown.y);
      ctx.arc(it.crown.x, it.crown.y, rPx, 0, Math.PI * 2);
    }
    ctx.fill();
  };

  ctx.lineJoin = "miter";
  for (let bi = 0; bi < buildings.length; bi++) {
    drawTreeBatch(buckets[bi]);
    const b = buildings[bi];
    // 6a. 可见立面
    for (const f of b.faces) {
      drawPoly(ctx, f.pts2);
      ctx.fillStyle = f.shade;
      ctx.fill();
    }

    // 6b. 橄榄绿屋顶 + 1:1 复刻原海报的利落白边女儿墙
    drawPoly(ctx, b.top2);
    ctx.fillStyle = b.roof;
    ctx.fill();
    ctx.strokeStyle = PALETTE.parapet;
    ctx.lineWidth = 1.65;
    ctx.stroke();

    const cx = (b.top2[0].x + b.top2[2].x) * 0.5;
    const cy = (b.top2[0].y + b.top2[2].y) * 0.5;

    if (b.skylight) {
      const inset = b.top2.map((p) => ({ x: cx + (p.x - cx) * 0.42, y: cy + (p.y - cy) * 0.38 }));
      drawPoly(ctx, inset);
      ctx.fillStyle = "#D4CEBE";
      ctx.fill();
    }

    if (activeLens === "relation" && (b.id === "e-tall" || b.id === "nw-west" || b.id === "sw-main" || b.id === "se-main")) {
      const floors = Math.round(b.h * 2.5);
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillStyle = "#FAF6EE";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${floors}F`, cx, cy);
    }
  }
  drawTreeBatch(buckets[buildings.length]);

  // 7. 「关系」检视层叠加：主广场与两大次级橙点的空间三角联系虚线
  if (activeLens === "relation" && plaza.r > 0) {
    const p0 = projectPoint(cam, { x: plaza.x, y: 0.08, z: plaza.z });
    ctx.save();
    ctx.strokeStyle = PALETTE.orangeDeep;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    for (const sp of SUB_PLAZAS) {
      const p1 = projectPoint(cam, { x: sp.x, y: 0.08, z: sp.z });
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    }
    ctx.restore();
  }

  // 8. 纸面四角轻建筑套准线（+ 十字角标）
  if (interactive) {
    ctx.save();
    ctx.strokeStyle = "rgba(103, 106, 62, 0.32)";
    ctx.lineWidth = 1;
    const m = 12;
    const arm = 7;
    for (const [tx, ty] of [[m, m], [width - m, m], [m, height - m], [width - m, height - m]]) {
      ctx.beginPath();
      ctx.moveTo(tx - arm, ty); ctx.lineTo(tx + arm, ty);
      ctx.moveTo(tx, ty - arm); ctx.lineTo(tx, ty + arm);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
  return { plazaAnchorsScreen };
}

// ---------- 01 节：建筑竖向剖面视线联动仪 ----------
export function drawElevationCrossSection(ctx, width, height, angleDeg) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#FAF6EE";
  ctx.fillRect(0, 0, width, height);

  const groundY = height * 0.78;
  const cx = width * 0.64; // 中央广场在剖面里的位置
  const rad = Math.min(width * 0.44, height * 0.62);

  // 地面基准线
  ctx.strokeStyle = "#7A7567";
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(20, groundY); ctx.lineTo(width - 20, groundY); ctx.stroke();

  // 剖面里的三栋建筑 + 中央橙色广场
  const blocks = [
    { x: cx - rad * 0.56, w: rad * 0.24, h: rad * 0.28, label: "前景楼" },
    { x: cx + rad * 0.18, w: rad * 0.22, h: rad * 0.42, label: "主塔楼" },
    { x: cx + rad * 0.46, w: rad * 0.18, h: rad * 0.22, label: "后排院" },
  ];
  // 橙色广场地坪
  ctx.fillStyle = PALETTE.orange;
  ctx.fillRect(cx - rad * 0.16, groundY - 5, rad * 0.26, 5);

  for (const b of blocks) {
    ctx.fillStyle = "#E5DEC9";
    ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
    ctx.fillStyle = "#6F7148";
    ctx.fillRect(b.x - 1, groundY - b.h, b.w + 2, 7);
    ctx.strokeStyle = "#6E6A5E";
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x, groundY - b.h, b.w, b.h);
  }

  // 四分之一仰/俯角弧尺 (-22° 到 90°)
  ctx.strokeStyle = "rgba(103, 106, 62, 0.35)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx, groundY, rad, Math.PI + 22 * DEG, Math.PI * 1.5, false);
  ctx.stroke();
  ctx.setLineDash([]);

  // 30°–75° 鸟瞰黄金扇区轻着色
  ctx.fillStyle = "rgba(220, 111, 27, 0.12)";
  ctx.beginPath();
  ctx.moveTo(cx, groundY);
  ctx.arc(cx, groundY, rad, Math.PI + 30 * DEG, Math.PI + 75 * DEG, false);
  ctx.closePath();
  ctx.fill();

  // 当前机位点与视线锥
  const aRad = Math.PI + angleDeg * DEG;
  const eyeX = cx + Math.cos(aRad) * rad;
  const eyeY = Math.min(groundY + 26, groundY + Math.sin(aRad) * rad);

  // 视线主射线与视锥
  const isBird = angleDeg >= 30 && angleDeg <= 75;
  ctx.strokeStyle = isBird ? PALETTE.orangeDeep : "#494A3E";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(eyeX, eyeY);
  ctx.lineTo(cx, groundY - 3);
  ctx.stroke();

  // 辅助视线（瞄向前景楼顶与主塔楼顶）
  ctx.strokeStyle = isBird ? "rgba(220, 111, 27, 0.32)" : "rgba(73, 74, 62, 0.25)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(eyeX, eyeY); ctx.lineTo(blocks[0].x, groundY - blocks[0].h);
  ctx.moveTo(eyeX, eyeY); ctx.lineTo(blocks[1].x + blocks[1].w, groundY - blocks[1].h);
  ctx.stroke();
  ctx.setLineDash([]);

  // 机位圆点
  ctx.fillStyle = isBird ? PALETTE.orange : PALETTE.ink;
  ctx.beginPath(); ctx.arc(eyeX, eyeY, 6.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#FAF6EE";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 刻度标注（严格错位排布，绝不与当前角度标签重叠）
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.fillStyle = "#484C29";
  ctx.textAlign = "left";
  ctx.fillText("90° 顶视", cx + 10, groundY - rad + 12);

  // 将「30°–75° 鸟瞰区间」稳妥放在扇区右上空白处，避开 48° 主视线与外弧角度标
  ctx.fillStyle = PALETTE.orangeDeep;
  ctx.textAlign = "center";
  ctx.fillText("30°–75°", cx - rad * 0.22, groundY - rad * 0.68);
  ctx.fillText("鸟瞰区间", cx - rad * 0.22, groundY - rad * 0.58);

  ctx.textAlign = "left";
  ctx.fillStyle = "#494A3E";
  ctx.fillText("0° 平视", Math.max(12, cx - rad - 36), groundY - 8);
  ctx.fillText("-20° 虫视", Math.max(12, cx - rad * 0.94), Math.min(height - 10, groundY + 32));

  // 当前角度签：沿射线外延 22px，始终落在弧线外侧干净空白处
  const outR = rad + 22;
  const lblX = Math.max(22, Math.min(width - 62, cx + Math.cos(aRad) * outR));
  const lblY = Math.max(18, Math.min(height - 14, groundY + Math.sin(aRad) * outR));
  ctx.fillStyle = isBird ? PALETTE.orangeDeep : PALETTE.ink;
  ctx.font = '700 12px "JetBrains Mono", monospace';
  ctx.textAlign = "center";
  ctx.fillText(`${angleDeg > 0 ? "+" : ""}${angleDeg}°`, lblX, lblY);

  ctx.restore();
}

// ---------- 02 节：四层硫酸纸叠加图 ----------
export function drawTracingLayers(ctx, width, height, layers) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#242A1C";
  ctx.fillRect(0, 0, width, height);

  // 细坐标底纹
  ctx.strokeStyle = "rgba(194, 206, 150, 0.1)";
  ctx.lineWidth = 1;
  const step = Math.max(24, Math.round(width / 16));
  for (let x = step; x < width; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = step; y < height; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  const u = (rx) => rx * width;
  const v = (ry) => ry * height;
  const blocks = [
    { x: 0.10, y: 0.12, w: 0.24, h: 0.30, tier: 2 },
    { x: 0.12, y: 0.56, w: 0.22, h: 0.30, tier: 2 },
    { x: 0.64, y: 0.10, w: 0.26, h: 0.26, tier: 2 },
    { x: 0.62, y: 0.44, w: 0.28, h: 0.20, tier: 1 },
    { x: 0.66, y: 0.70, w: 0.24, h: 0.20, tier: 2 },
    { x: 0.38, y: 0.74, w: 0.18, h: 0.16, tier: 3 },
  ];

  // 第 4 层：影距关系（先画投影与比例虚线）
  if (layers.relation) {
    ctx.fillStyle = "rgba(10, 14, 8, 0.55)";
    for (const b of blocks) {
      const off = b.tier === 1 ? 18 : b.tier === 2 ? 11 : 6;
      ctx.fillRect(u(b.x) + off, v(b.y) + off, u(b.w), v(b.h));
    }
    ctx.strokeStyle = "rgba(194, 206, 150, 0.45)";
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(u(0.49), v(0.48)); ctx.lineTo(u(0.77), v(0.23));
    ctx.moveTo(u(0.49), v(0.48)); ctx.lineTo(u(0.47), v(0.82));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 第 1 层：体块底图（俯瞰轮廓）
  if (layers.overview) {
    for (const b of blocks) {
      ctx.fillStyle = layers.order && b.tier === 1 ? "#8F945B" : "#5F6540";
      ctx.fillRect(u(b.x), v(b.y), u(b.w), v(b.h));
      ctx.strokeStyle = "#E8E2D2";
      ctx.lineWidth = layers.order && b.tier === 1 ? 2.2 : 1.1;
      ctx.strokeRect(u(b.x), v(b.y), u(b.w), v(b.h));
    }
  }

  // 第 2 层：路径流线（严格沿街道走廊绕行，不压屋顶）
  if (layers.path) {
    ctx.strokeStyle = "#F49B55";
    ctx.lineWidth = 2.6;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(u(0.05), v(0.49)); ctx.lineTo(u(0.36), v(0.49));
    ctx.quadraticCurveTo(u(0.54), v(0.49), u(0.56), v(0.34));
    ctx.lineTo(u(0.56), v(0.06));
    ctx.moveTo(u(0.56), v(0.40)); ctx.lineTo(u(0.95), v(0.40));
    ctx.moveTo(u(0.48), v(0.60));
    ctx.quadraticCurveTo(u(0.59), v(0.64), u(0.60), v(0.94));
    ctx.stroke();
    ctx.setLineDash([]);
    // 四个箭尖
    ctx.fillStyle = "#F49B55";
    const arrow = (x, y, ang) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - Math.cos(ang - 0.55) * 9, y - Math.sin(ang - 0.55) * 9);
      ctx.lineTo(x - Math.cos(ang + 0.55) * 9, y - Math.sin(ang + 0.55) * 9);
      ctx.closePath();
      ctx.fill();
    };
    arrow(u(0.56), v(0.05), -Math.PI / 2);
    arrow(u(0.96), v(0.40), 0);
    arrow(u(0.04), v(0.49), Math.PI);
    arrow(u(0.60), v(0.95), Math.PI / 2);
  }

  // 第 3 层：全局主次锚点（主橙广场 + 次橙节点）
  if (layers.order) {
    const rMain = Math.min(width, height) * 0.11;
    ctx.fillStyle = "rgba(244, 237, 223, 0.15)";
    ctx.beginPath(); ctx.arc(u(0.48), v(0.48), rMain * 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#E57519";
    ctx.beginPath(); ctx.arc(u(0.48), v(0.48), rMain, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#FAF6EE";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = "#E57519";
    ctx.beginPath(); ctx.arc(u(0.77), v(0.23), rMain * 0.36, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(u(0.47), v(0.82), rMain * 0.38, 0, Math.PI * 2); ctx.fill();
  }

  if (!layers.overview && !layers.path && !layers.order && !layers.relation) {
    ctx.fillStyle = "#C2CE96";
    ctx.font = '500 13px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("四层硫酸纸均已关闭——点下方按钮逐层叠开观察空间秩序", width * 0.5, height * 0.5);
  }
  ctx.restore();
}

// ---------- 03 节：24 小时建筑日影时刻盘（5 座 1F–8F 楼体） ----------
export function drawHeliodonYard(ctx, width, height, hour) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#F4EDDF";
  ctx.fillRect(0, 0, width, height);

  // 由时刻 (7.5h..16.5h) 换算太阳高度角与方位角
  const dayT = (hour - 6) / 12; // 0.5 = 12:00 正午
  const sunElev = 14 + 72 * Math.sin(Math.max(0.05, Math.min(0.95, dayT)) * Math.PI);
  const sunAz = (dayT - 0.5) * 145; // 东(-72°) -> 南(0°) -> 西(+72°)
  const factor = Math.min(3.8, 1 / Math.tan(sunElev * DEG));
  const sdx = -Math.sin(sunAz * DEG) * factor;
  const sdy = -Math.cos(sunAz * DEG) * factor * 0.72;

  // 街区底图与十字通道
  ctx.fillStyle = "#FAF6EE";
  ctx.fillRect(width * 0.44, 16, width * 0.12, height - 32);
  ctx.fillRect(16, height * 0.46, width - 32, height * 0.14);

  // 5 栋同屋顶面积、不同层高（1F / 2F / 4F / 6F / 8F）的建筑
  const towers = [
    { x: 0.18, y: 0.24, w: 0.15, h: 0.15, floors: 8, label: "8F 主楼" },
    { x: 0.64, y: 0.22, w: 0.15, h: 0.15, floors: 2, label: "2F 矮院" },
    { x: 0.20, y: 0.67, w: 0.15, h: 0.15, floors: 4, label: "4F 展厅" },
    { x: 0.66, y: 0.66, w: 0.15, h: 0.15, floors: 6, label: "6F 塔馆" },
    { x: 0.455, y: 0.48, w: 0.09, h: 0.09, floors: 1, label: "1F 亭", isPlaza: true },
  ];
  const unitH = Math.min(width, height) * 0.022;

  // 先画投影（8F 与 1F 在正午几乎无影，斜阳下长影立辨高低！）
  ctx.fillStyle = "rgba(72, 70, 52, 0.30)";
  for (const t of towers) {
    const bx = t.x * width, by = t.y * height, bw = t.w * width, bh = t.h * height;
    const ox = sdx * t.floors * unitH;
    const oy = sdy * t.floors * unitH;
    const corners = [
      { x: bx, z: by }, { x: bx + bw, z: by }, { x: bx + bw, z: by + bh }, { x: bx, z: by + bh },
      { x: bx + ox, z: by + oy }, { x: bx + bw + ox, z: by + oy },
      { x: bx + bw + ox, z: by + bh + oy }, { x: bx + ox, z: by + bh + oy },
    ];
    // 简易凸包
    const arr = corners.sort((a, b) => a.x - b.x || a.z - b.z);
    const cross = (o, a, b) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    const lo = [], up = [];
    for (const p of arr) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = arr.length - 1; i >= 0; i--) { const p = arr[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop();
    const hull = lo.concat(up);
    ctx.beginPath();
    ctx.moveTo(hull[0].x, hull[0].z);
    for (let i = 1; i < hull.length; i++) ctx.lineTo(hull[i].x, hull[i].z);
    ctx.closePath();
    ctx.fill();
  }

  // 再画屋顶（面积完全一致，全靠阴影分辨谁是 8F 谁是 2F！）
  for (const t of towers) {
    const bx = t.x * width, by = t.y * height, bw = t.w * width, bh = t.h * height;
    if (t.isPlaza) {
      ctx.fillStyle = PALETTE.orange;
      ctx.beginPath();
      ctx.arc(bx + bw * 0.5, by + bh * 0.5, Math.min(bw, bh) * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.parapet;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.fillStyle = "#76774E";
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = PALETTE.parapet;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = "#FAF6EE";
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t.label, bx + bw * 0.5, by + bh * 0.5);
    }
  }

  // 顶部太阳方位小弧 + 读数（让读者直观看见太阳东升西落）
  const arcX0 = 22, arcX1 = width * 0.44;
  const sunPx = arcX0 + (arcX1 - arcX0) * clamp((hour - 7.5) / 9, 0, 1);
  const sunPy = 28 - Math.sin(clamp((hour - 7.5) / 9, 0, 1) * Math.PI) * 14;
  ctx.strokeStyle = "rgba(103, 106, 62, 0.4)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(arcX0, 28);
  ctx.quadraticCurveTo((arcX0 + arcX1) * 0.5, 0, arcX1, 28);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = PALETTE.orange;
  ctx.beginPath(); ctx.arc(sunPx, sunPy, 4.5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#484C29";
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.textAlign = "right";
  ctx.fillText(`SUN ${Math.round(sunElev)}° · 影长 ${factor.toFixed(2)}×`, width - 14, 22);
  ctx.restore();
  return { sunElev: Math.round(sunElev), factor };
}

// ---------- 06 节：单变量实战测验缩略图（直接调用主引擎） ----------
export function drawQuizOption(canvas, preset) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(220, Math.round(rect.width || 280));
  const h = Math.max(150, Math.round(rect.height || 186));
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const fullState = {
    pitch: 52,
    azimuth: -16,
    sunElev: 36,
    sunAz: -38,
    order: "organized",
    plazaMode: "center",
    activeLens: null,
    ...preset,
  };
  const evalData = evaluateView(fullState, w, h, fullState.order === "organized" ? 1 : 0);
  drawAerialScene(ctx, fullState, evalData, { width: w, height: h, time: 0, still: true, interactive: false });
  return evalData;
}

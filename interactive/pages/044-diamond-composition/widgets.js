// 044 菱形构图 · 01–07 小节互动组件与原海报放大灯箱
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp } from "./model.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}, text = "") => {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text) el.textContent = text;
  return el;
};

/* =========================================================
   01 · 马赫 0°→45° 旋角力场对比仪
   ========================================================= */
export function mountMachDial() {
  const svg = document.getElementById("w01-svg");
  const range = document.getElementById("w01-angle");
  const valEl = document.getElementById("w01-angle-val");
  const badge = document.getElementById("w01-mode-badge");
  const readout = document.getElementById("w01-readout");
  const forceBtn = document.getElementById("w01-force-btn");
  if (!svg || !range) return;

  let angle = 0;
  let showForces = true;

  function draw() {
    svg.replaceChildren();
    // 左侧固定 0° 参照方框
    const lx = 104, ly = 132, s = 54;
    svg.append(svgEl("rect", {
      x: lx - s, y: ly - s, width: s * 2, height: s * 2,
      fill: "rgba(72, 52, 148, 0.08)", stroke: "#483494", "stroke-width": 1.6, "stroke-dasharray": "4 3",
    }));
    svg.append(svgEl("text", {
      x: lx, y: 234, "text-anchor": "middle", fill: "#3C3264", "font-size": 12, "font-weight": 700,
    }, "0° 参照方框（水平重力稳态）"));

    if (showForces) {
      // 静态水平/垂直压力线
      svg.append(svgEl("line", { x1: lx - s, y1: ly + s + 10, x2: lx + s, y2: ly + s + 10, stroke: "#483494", "stroke-width": 2.2 }));
      svg.append(svgEl("line", { x1: lx, y1: ly - s + 8, x2: lx, y2: ly + s - 8, stroke: "#8279A0", "stroke-width": 1.2, "stroke-dasharray": "3 3" }));
      svg.append(svgEl("line", { x1: lx - s + 8, y1: ly, x2: lx + s - 8, y2: ly, stroke: "#8279A0", "stroke-width": 1.2, "stroke-dasharray": "3 3" }));
    }
    svg.append(svgEl("circle", { cx: lx, cy: ly, r: 5, fill: "#483494" }));

    // 中间箭头
    svg.append(svgEl("text", { x: 196, y: 136, "text-anchor": "middle", fill: "#A8174E", "font-size": 15, "font-weight": 700 }, "→"));

    // 右侧可旋主体
    const rx = 304, ry = 132;
    // 刻度外环
    svg.append(svgEl("circle", { cx: rx, cy: ry, r: 84, fill: "none", stroke: "rgba(72, 52, 148, 0.2)", "stroke-width": 1.2 }));
    // 竖直/水平基准虚线
    svg.append(svgEl("line", { x1: rx, y1: ry - 92, x2: rx, y2: ry + 92, stroke: "rgba(72,52,148,0.22)", "stroke-dasharray": "3 4" }));
    svg.append(svgEl("line", { x1: rx - 92, y1: ry, x2: rx + 92, y2: ry, stroke: "rgba(72,52,148,0.22)", "stroke-dasharray": "3 4" }));

    const rad = (angle * Math.PI) / 180;
    const corners = [
      [-s, -s], [s, -s], [s, s], [-s, s],
    ].map(([x, y]) => [
      rx + x * Math.cos(rad) - y * Math.sin(rad),
      ry + x * Math.sin(rad) + y * Math.cos(rad),
    ]);

    const isDiamond = angle >= 39;
    const isCrooked = angle > 7 && angle < 39;
    const strokeCol = isDiamond ? "#A8174E" : isCrooked ? "#B51946" : "#483494";

    svg.append(svgEl("polygon", {
      points: corners.map((p) => p.join(",")).join(" "),
      fill: isDiamond ? "rgba(242, 67, 128, 0.14)" : isCrooked ? "rgba(181, 25, 70, 0.09)" : "rgba(72, 52, 148, 0.10)",
      stroke: strokeCol,
      "stroke-width": 2.2,
    }));

    if (showForces) {
      // 对角汇聚矢（越接近 45° 越清晰有力）
      const pull = clamp(angle / 45, 0, 1);
      for (const [cx, cy] of corners) {
        const vx = rx - cx, vy = ry - cy;
        const len = Math.hypot(vx, vy) || 1;
        const ux = vx / len, uy = vy / len;
        const aLen = 14 + pull * 26;
        const sx = cx + ux * 8, sy = cy + uy * 8;
        const ex = sx + ux * aLen, ey = sy + uy * aLen;
        svg.append(svgEl("line", {
          x1: sx, y1: sy, x2: ex, y2: ey,
          stroke: isDiamond ? "#D62467" : isCrooked ? "#B51946" : "#8279A0",
          "stroke-width": isDiamond ? 2.2 : 1.5,
          opacity: (0.45 + pull * 0.55).toFixed(2),
        }));
        // 小箭头
        const w = 5;
        const px = -uy, py = ux;
        svg.append(svgEl("polyline", {
          points: `${ex - ux * w + px * w * 0.7},${ey - uy * w + py * w * 0.7} ${ex},${ey} ${ex - ux * w - px * w * 0.7},${ey - uy * w - py * w * 0.7}`,
          fill: "none",
          stroke: isDiamond ? "#D62467" : isCrooked ? "#B51946" : "#8279A0",
          "stroke-width": 1.8,
        }));
      }
      // 歪框提示失衡弧
      if (isCrooked) {
        svg.append(svgEl("path", {
          d: `M ${rx + 56} ${ry - 56} A 80 80 0 0 1 ${rx + 78} ${ry - 14}`,
          fill: "none", stroke: "#B51946", "stroke-width": 1.8, "stroke-dasharray": "4 3",
        }));
      }
    }

    // 四顶圆锚
    for (const [cx, cy] of corners) {
      svg.append(svgEl("circle", { cx, cy, r: isDiamond ? 4.8 : 3.6, fill: isDiamond ? "#180850" : strokeCol }));
    }
    svg.append(svgEl("circle", { cx: rx, cy: ry, r: isDiamond ? 7.5 : 5, fill: isDiamond ? "#F24380" : "#483494" }));

    svg.append(svgEl("text", {
      x: rx, y: 234, "text-anchor": "middle", fill: "#180850", "font-size": 12, "font-weight": 700,
    }, `当前旋转 ${angle}°（几何边长完全不变）`));

    valEl.textContent = `${angle}°`;
    if (angle <= 7) {
      badge.textContent = `${angle}° 静态方框`;
      readout.textContent = `当前 ${angle}°：四边与重力横竖轴贴合，视线停留在平直底边与左右墙面，呈现安静平稳的容器感（属 045 方形构图）。`;
    } else if (angle < 39) {
      badge.textContent = `${angle}° 歪斜过渡`;
      readout.textContent = `当前 ${angle}°：既失去了横平竖直的落地支撑，上下顶点又还没对齐竖轴。大脑会本能觉得「图挂歪了」，产生焦躁的倾倒错觉。`;
    } else {
      badge.textContent = `${angle}° 立菱聚心`;
      readout.textContent = `当前 ${angle}°：完全相同的正方形转足 45° 后被大脑重编码为「菱形」——四条 45° 斜边对称夹击，视线顺着对角轴直汇中心焦点。`;
    }
  }

  range.addEventListener("input", () => {
    angle = Number(range.value);
    draw();
  });

  document.querySelectorAll("[data-w01-snap]").forEach((btn) => {
    btn.addEventListener("click", () => {
      angle = Number(btn.dataset.w01Snap);
      range.value = String(angle);
      draw();
    });
  });

  forceBtn.addEventListener("click", () => {
    showForces = !showForces;
    forceBtn.classList.toggle("is-on", showForces);
    forceBtn.setAttribute("aria-pressed", String(showForces));
    forceBtn.textContent = `力场矢：${showForces ? "显" : "隐"}`;
    draw();
  });

  draw();
}

/* =========================================================
   02 · 显菱 / 隐菱剥离切片台（2D Canvas 直拖分割帘）
   ========================================================= */
export function mountImpliedDiamond() {
  const canvas = document.getElementById("w02-canvas");
  const wipeInput = document.getElementById("w02-wipe");
  const wipeVal = document.getElementById("w02-wipe-val");
  const diagBtn = document.getElementById("w02-diag-btn");
  const pocketBtn = document.getElementById("w02-pocket-btn");
  const readout = document.getElementById("w02-readout");
  if (!canvas || !wipeInput) return;

  const ctx = canvas.getContext("2d");
  let scene = "reflection";
  let wipe = 50;
  let showDiag = true;
  let showPockets = false;
  let w = 520, h = 325, dpr = pixelRatio(2);

  const SCENE_DESC = {
    reflection: "山峰尖顶向上、水面倒影尖底向下，即使右侧彻底撤掉紫色虚线边框，自然对称轮廓本身仍构成严密菱形。",
    portrait: "独舞剪影高举合拢的双臂形成顶角、舒展裙摆撑开左右两翼、收拢脚尖指向底角——零线条也能读出强烈菱形骨相。",
    editorial: "精装书封不必画实线菱框：把主标居中加宽、副标与年份上下逐级收窄，文字轮廓自己就排成一座悬浮菱形。",
  };

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = pixelRatio(2);
    w = Math.round(r.width);
    h = Math.round(r.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    draw();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function drawSceneArt(c, explicitMask) {
    const cx = w * 0.5, cy = h * 0.5;
    const rx = Math.min(w * 0.34, h * 0.44);
    const ry = h * 0.42;

    c.fillStyle = "#EDE7F4";
    c.fillRect(0, 0, w, h);

    if (showPockets) {
      // 高亮四角三角留白区域
      c.save();
      c.fillStyle = "rgba(72, 52, 148, 0.14)";
      c.beginPath();
      c.rect(cx - rx * 1.25, cy - ry * 1.08, rx * 2.5, ry * 2.16);
      c.moveTo(cx, cy - ry);
      c.lineTo(cx - rx, cy);
      c.lineTo(cx, cy + ry);
      c.lineTo(cx + rx, cy);
      c.closePath();
      c.fill("evenodd");
      c.restore();
    }

    c.save();
    if (explicitMask) {
      c.beginPath();
      c.moveTo(cx, cy - ry);
      c.lineTo(cx + rx, cy);
      c.lineTo(cx, cy + ry);
      c.lineTo(cx - rx, cy);
      c.closePath();
      c.clip();
    }

    if (scene === "reflection") {
      // 开放式天水背景
      const grad = c.createLinearGradient(0, cy - ry, 0, cy + ry);
      grad.addColorStop(0, "#D9D0EC");
      grad.addColorStop(0.5, "#F4DDE9");
      grad.addColorStop(0.51, "#C9BFE3");
      grad.addColorStop(1, "#7F74B5");
      c.fillStyle = grad;
      c.fillRect(0, 0, w, h);

      // 上半山峰
      c.fillStyle = "#2E2960";
      c.beginPath();
      c.moveTo(cx - rx * 0.96, cy);
      c.lineTo(cx, cy - ry * 0.92);
      c.lineTo(cx + rx * 0.96, cy);
      c.closePath();
      c.fill();
      c.fillStyle = "#EFE0EC";
      c.beginPath();
      c.moveTo(cx, cy - ry * 0.92);
      c.lineTo(cx + rx * 0.42, cy - ry * 0.25);
      c.lineTo(cx + rx * 0.10, cy);
      c.closePath();
      c.fill();

      // 下半水面倒影
      c.fillStyle = "rgba(46, 41, 96, 0.62)";
      c.beginPath();
      c.moveTo(cx - rx * 0.96, cy + 2);
      c.lineTo(cx, cy + ry * 0.92);
      c.lineTo(cx + rx * 0.96, cy + 2);
      c.closePath();
      c.fill();

      // 水平微涟漪
      c.strokeStyle = "rgba(255, 255, 255, 0.45)";
      c.lineWidth = 1;
      for (let i = 1; i <= 5; i++) {
        const y = cy + i * (ry * 0.15);
        const span = rx * (1 - i * 0.16);
        c.beginPath();
        c.moveTo(cx - span, y);
        c.lineTo(cx + span, y);
        c.stroke();
      }
    } else if (scene === "portrait") {
      const grad = c.createRadialGradient(cx, cy, 10, cx, cy, rx * 1.4);
      grad.addColorStop(0, "#F6E2EE");
      grad.addColorStop(0.65, "#CFC4E8");
      grad.addColorStop(1, "#9B8EC8");
      c.fillStyle = grad;
      c.fillRect(0, 0, w, h);

      // 纯剪影无五官舞者形成天然菱形
      c.fillStyle = "#180850";
      c.beginPath();
      c.arc(cx, cy - ry * 0.34, ry * 0.10, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.moveTo(cx, cy - ry * 0.86);
      c.quadraticCurveTo(cx + rx * 0.26, cy - ry * 0.48, cx + rx * 0.14, cy - ry * 0.18);
      c.lineTo(cx + rx * 0.68, cy + ry * 0.08);
      c.lineTo(cx, cy + ry * 0.86);
      c.lineTo(cx - rx * 0.68, cy + ry * 0.08);
      c.lineTo(cx - rx * 0.14, cy - ry * 0.18);
      c.quadraticCurveTo(cx - rx * 0.26, cy - ry * 0.48, cx, cy - ry * 0.86);
      c.closePath();
      c.fill();
    } else {
      // 书封纯文字隐菱排印
      c.fillStyle = "#F5F1FA";
      c.fillRect(0, 0, w, h);
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "#A8174E";
      c.font = `700 11px "Syne", sans-serif`;
      c.fillText("NO. 044", cx, cy - ry * 0.62);
      c.fillStyle = "#483494";
      c.font = `600 13px "Noto Sans SC", sans-serif`;
      c.fillText("视觉几何学纲要", cx, cy - ry * 0.32);
      c.fillStyle = "#180850";
      c.font = `900 ${Math.round(clamp(w * 0.055, 20, 28))}px "Noto Sans SC", sans-serif`;
      c.fillText("斜 边 与 焦 点 的 秩 序", cx, cy);
      c.fillStyle = "#443B68";
      c.font = `500 12.5px "Noto Sans SC", sans-serif`;
      c.fillText("从马赫旋方到现代版式聚焦", cx, cy + ry * 0.32);
      c.fillStyle = "#A8174E";
      c.font = `700 11px "Chivo", sans-serif`;
      c.fillText("2026 EDITION", cx, cy + ry * 0.62);
    }
    c.restore();

    if (explicitMask) {
      c.save();
      c.strokeStyle = "#483494";
      c.lineWidth = 2;
      c.setLineDash([6, 5]);
      c.beginPath();
      c.moveTo(cx, cy - ry);
      c.lineTo(cx + rx, cy);
      c.lineTo(cx, cy + ry);
      c.lineTo(cx - rx, cy);
      c.closePath();
      c.stroke();
      c.setLineDash([]);
      for (const [px, py] of [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]]) {
        c.fillStyle = "#180850";
        c.beginPath();
        c.arc(px, py, 4.5, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    if (showDiag) {
      c.save();
      c.strokeStyle = "rgba(214, 36, 103, 0.72)";
      c.lineWidth = 1.3;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.moveTo(cx, cy - ry);
      c.lineTo(cx, cy + ry);
      c.moveTo(cx - rx, cy);
      c.lineTo(cx + rx, cy);
      c.stroke();
      c.fillStyle = "#F24380";
      c.beginPath();
      c.arc(cx, cy, 4.5, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }

  function draw() {
    if (!w || !h) return;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const splitX = (wipe / 100) * w;

    // 左半：显性虚线菱框
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, h);
    ctx.clip();
    drawSceneArt(ctx, true);
    ctx.restore();

    // 右半：撤掉外框，纯隐形菱形
    ctx.save();
    ctx.beginPath();
    ctx.rect(splitX, 0, w - splitX, h);
    ctx.clip();
    drawSceneArt(ctx, false);
    ctx.restore();

    // 分割帘竖线与圆把手
    ctx.strokeStyle = "#180850";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, h);
    ctx.stroke();

    ctx.fillStyle = "#D62467";
    ctx.beginPath();
    ctx.arc(splitX, h * 0.5, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 11px "Chivo", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("↔", splitX, h * 0.5 + 0.5);

    // 左右角标
    ctx.font = `700 11px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    if (splitX > 78) {
      ctx.fillStyle = "rgba(24, 8, 80, 0.84)";
      ctx.fillRect(10, 10, 66, 22);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText("显性框裁", 43, 15);
    }
    if (w - splitX > 78) {
      ctx.fillStyle = "rgba(214, 36, 103, 0.90)";
      ctx.fillRect(w - 76, 10, 66, 22);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText("隐形骨架", w - 43, 15);
    }

    ctx.restore();

    wipeVal.textContent = `${wipe}%`;
    readout.textContent = `${SCENE_DESC[scene]}${showPockets ? "（紫色阴影标出的四角三角净区占画幅约 50%，正是让中心跳出来的缓冲带。）" : ""}`;
  }

  let dragging = false;
  const setFromClientX = (clientX) => {
    const r = canvas.getBoundingClientRect();
    wipe = Math.round(clamp(((clientX - r.left) / r.width) * 100, 0, 100));
    wipeInput.value = String(wipe);
    draw();
  };
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    canvas.setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) setFromClientX(e.clientX);
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  wipeInput.addEventListener("input", () => {
    wipe = Number(wipeInput.value);
    draw();
  });

  document.querySelectorAll("[data-w02-scene]").forEach((btn) => {
    btn.addEventListener("click", () => {
      scene = btn.dataset.w02Scene;
      document.querySelectorAll("[data-w02-scene]").forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      draw();
    });
  });

  diagBtn.addEventListener("click", () => {
    showDiag = !showDiag;
    diagBtn.classList.toggle("is-on", showDiag);
    diagBtn.setAttribute("aria-pressed", String(showDiag));
    diagBtn.textContent = `对角骨架：${showDiag ? "显" : "隐"}`;
    draw();
  });

  pocketBtn.addEventListener("click", () => {
    showPockets = !showPockets;
    pocketBtn.classList.toggle("is-on", showPockets);
    pocketBtn.setAttribute("aria-pressed", String(showPockets));
    pocketBtn.textContent = `高亮四角净区：${showPockets ? "开" : "关"}`;
    draw();
  });

  resize();
}

/* =========================================================
   03 · 深暮紫博物馆剖析仪（马赫 / 蒙德里安 / 阿恩海姆）
   ========================================================= */
export function mountHistoryExplorer() {
  const svg = document.getElementById("w03-svg");
  const kicker = document.getElementById("w03-kicker");
  const toggleBtn = document.getElementById("w03-toggle");
  const caption = document.getElementById("w03-caption");
  const tabs = [...document.querySelectorAll(".tl-item")];
  if (!svg || !tabs.length) return;

  let era = "mach";
  let altView = false;

  const META = {
    mach: {
      kicker: "1886 · ERNST MACH",
      btnA: "切换为叠合对比",
      btnB: "切回并排参照",
      capA: "马赫在 1886 年《感觉的分析》里指出：四条等长边在 0° 时读作「静方」，转过 45° 后人眼参照重力轴立刻重判为「动菱」。",
      capB: "把两个几何全等的图形叠在同一中心：面积与内角完全一致，但 45° 菱形的对角轴跨度比正方高出约 1.41 倍（√2），视觉纵深感瞬间拉长。",
    },
    mondrian: {
      kicker: "1924–1944 · PIET MONDRIAN LOZENGE",
      btnA: "对比：海报向心斜线",
      btnB: "切回：蒙德里安横竖线",
      capA: "蒙德里安斜置菱形画布的精髓：外框转到 45°，但画内黑线与黄线严守 0°/90° 水平垂直——斜框截断横竖网格，让空间像无限延伸出画外。",
      capB: "对比海报常用的菱形构图：画内引导线顺着 45° 斜边向内收敛，把空间锁死在画心；蒙德里安是「借斜框向外扩张」，海报构图是「借斜边向内聚心」。",
    },
    arnheim: {
      kicker: "1954 / 1974 · RUDOLF ARNHEIM",
      btnA: "测试偏心元素拉力",
      btnB: "切回完整结构骨架",
      capA: "阿恩海姆在《艺术与视知觉》第一章画出方形的隐藏结构骨架：中心、中轴与两条对角线形成看不见的磁力场，交汇点是视觉引力最强的落脚处。",
      capB: "当圆点离开对角交点哪怕一小段，观者都会感到它被看不见的骨架往中心拽回——这正是菱形构图里「主体一偏就显得难受」的知觉根源。",
    },
  };

  function draw() {
    svg.replaceChildren();
    const m = META[era];
    kicker.textContent = m.kicker;
    toggleBtn.textContent = altView ? m.btnB : m.btnA;
    caption.textContent = altView ? m.capB : m.capA;

    if (era === "mach") {
      if (!altView) {
        // 并排 0° 方与 45° 菱
        svg.append(svgEl("rect", { x: 82, y: 92, width: 104, height: 104, fill: "rgba(156, 142, 255, 0.14)", stroke: "#C8BFE6", "stroke-width": 2 }));
        svg.append(svgEl("text", { x: 134, y: 232, "text-anchor": "middle", fill: "#C8BFE6", "font-size": 12 }, "0° 正方 · 边长 L"));

        svg.append(svgEl("polygon", { points: "326,70 400,144 326,218 252,144", fill: "rgba(255, 117, 166, 0.18)", stroke: "#FF75A6", "stroke-width": 2.2 }));
        svg.append(svgEl("line", { x1: 326, y1: 70, x2: 326, y2: 218, stroke: "rgba(255,117,166,0.55)", "stroke-dasharray": "4 4" }));
        svg.append(svgEl("line", { x1: 252, y1: 144, x2: 400, y2: 144, stroke: "rgba(255,117,166,0.55)", "stroke-dasharray": "4 4" }));
        svg.append(svgEl("text", { x: 326, y: 246, "text-anchor": "middle", fill: "#FF75A6", "font-size": 12, "font-weight": 700 }, "45° 立菱 · 同边长 L"));
      } else {
        // 中心叠合，标示 √2 对角跨度
        const cx = 230, cy = 150, s = 62, d = Math.round(s * Math.SQRT2);
        svg.append(svgEl("rect", { x: cx - s, y: cy - s, width: s * 2, height: s * 2, fill: "rgba(156,142,255,0.14)", stroke: "#C8BFE6", "stroke-width": 1.8, "stroke-dasharray": "5 4" }));
        svg.append(svgEl("polygon", { points: `${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`, fill: "rgba(255,117,166,0.16)", stroke: "#FF75A6", "stroke-width": 2.2 }));
        svg.append(svgEl("line", { x1: cx + d + 18, y1: cy - d, x2: cx + d + 18, y2: cy + d, stroke: "#5AE4B4", "stroke-width": 1.6 }));
        svg.append(svgEl("text", { x: cx + d + 26, y: cy + 4, fill: "#5AE4B4", "font-size": 12, "font-weight": 700 }, "跨度 1.41×"));
      }
    } else if (era === "mondrian") {
      const cx = 230, cy = 150, r = 112;
      const defs = svgEl("defs");
      const cp = svgEl("clipPath", { id: "mondrian-clip" });
      cp.append(svgEl("polygon", { points: `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}` }));
      defs.append(cp);
      svg.append(defs);

      const g = svgEl("g", { "clip-path": "url(#mondrian-clip)" });
      g.append(svgEl("rect", { x: cx - r, y: cy - r, width: r * 2, height: r * 2, fill: "#F6F3EB" }));
      if (!altView) {
        // 致敬蒙德里安 Lozenge：外框 45° 斜菱，画内严格水平垂直线条与原色块
        g.append(svgEl("rect", { x: cx - 82, y: cy - 84, width: 64, height: 50, fill: "#D92B3A" }));
        g.append(svgEl("rect", { x: cx + 22, y: cy + 28, width: 58, height: 56, fill: "#F2C419" }));
        g.append(svgEl("rect", { x: cx - 70, y: cy + 40, width: 46, height: 42, fill: "#1D4FA8" }));
        g.append(svgEl("line", { x1: cx - 120, y1: cy - 34, x2: cx + 120, y2: cy - 34, stroke: "#141418", "stroke-width": 6 }));
        g.append(svgEl("line", { x1: cx - 120, y1: cy + 36, x2: cx + 120, y2: cy + 36, stroke: "#141418", "stroke-width": 5 }));
        g.append(svgEl("line", { x1: cx - 22, y1: cy - 120, x2: cx - 22, y2: cy + 120, stroke: "#141418", "stroke-width": 6 }));
        g.append(svgEl("line", { x1: cx + 44, y1: cy - 120, x2: cx + 44, y2: cy + 120, stroke: "#141418", "stroke-width": 4.5 }));
      } else {
        // 对比海报式向心菱形：斜向渐变与对角线往心聚
        g.append(svgEl("polygon", { points: `${cx},${cy - 80} ${cx + 76},${cy} ${cx},${cy + 80} ${cx - 76},${cy}`, fill: "#382975" }));
        g.append(svgEl("line", { x1: cx - 90, y1: cy - 90, x2: cx + 90, y2: cy + 90, stroke: "#FF75A6", "stroke-width": 2, "stroke-dasharray": "5 4" }));
        g.append(svgEl("line", { x1: cx + 90, y1: cy - 90, x2: cx - 90, y2: cy + 90, stroke: "#FF75A6", "stroke-width": 2, "stroke-dasharray": "5 4" }));
        g.append(svgEl("circle", { cx, cy, r: 22, fill: "#F24380" }));
      }
      svg.append(g);
      svg.append(svgEl("polygon", {
        points: `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`,
        fill: "none", stroke: "#C8BFE6", "stroke-width": 2.2,
      }));
      svg.append(svgEl("text", { x: cx, y: 284, "text-anchor": "middle", fill: "#C8BFE6", "font-size": 12 },
        altView ? "海报菱形：斜框 + 斜向内收（向心锁焦）" : "蒙德里安斜菱：45° 斜框 + 90° 横竖线（向外无限延展）"
      ));
    } else {
      // 阿恩海姆结构骨架
      const cx = 230, cy = 148, r = 104;
      svg.append(svgEl("polygon", {
        points: `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`,
        fill: "rgba(156, 142, 255, 0.08)", stroke: "#C8BFE6", "stroke-width": 2,
      }));
      // 隐藏结构骨架 4 轴
      const axes = [
        [cx, cy - r, cx, cy + r],
        [cx - r, cy, cx + r, cy],
        [cx - r * 0.5, cy - r * 0.5, cx + r * 0.5, cy + r * 0.5],
        [cx + r * 0.5, cy - r * 0.5, cx - r * 0.5, cy + r * 0.5],
      ];
      for (const [x1, y1, x2, y2] of axes) {
        svg.append(svgEl("line", { x1, y1, x2, y2, stroke: "rgba(255, 117, 166, 0.55)", "stroke-width": 1.4, "stroke-dasharray": "4 4" }));
      }
      svg.append(svgEl("circle", { cx, cy, r: 16, fill: "none", stroke: "#5AE4B4", "stroke-width": 1.6, "stroke-dasharray": "3 3" }));

      if (!altView) {
        svg.append(svgEl("circle", { cx, cy, r: 9, fill: "#5AE4B4" }));
        svg.append(svgEl("text", { x: cx, y: 278, "text-anchor": "middle", fill: "#5AE4B4", "font-size": 12, "font-weight": 700 }, "落在四轴交汇点：各方拉力抵消，获得绝对平衡"));
      } else {
        const px = cx + 38, py = cy - 28;
        svg.append(svgEl("line", { x1: px, y1: py, x2: cx + 8, y2: cy - 6, stroke: "#FF75A6", "stroke-width": 2.4 }));
        svg.append(svgEl("circle", { cx: px, cy: py, r: 9, fill: "#FF75A6" }));
        svg.append(svgEl("text", { x: cx, y: 278, "text-anchor": "middle", fill: "#FF75A6", "font-size": 12, "font-weight": 700 }, "偏离交点后：结构骨架持续施加向心拉扯，显得不安"));
      }
    }
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      era = btn.dataset.era;
      altView = false;
      tabs.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      draw();
    });
  });

  toggleBtn.addEventListener("click", () => {
    altView = !altView;
    draw();
  });

  draw();
}

/* =========================================================
   04 · 同族几何拓扑实时形变台
   ========================================================= */
export function mountFamilyMorph() {
  const svg = document.getElementById("w04-svg");
  const titleEl = document.getElementById("w04-title");
  const descEl = document.getElementById("w04-desc");
  const linkRow = document.getElementById("w04-link-row");
  const tabs = [...document.querySelectorAll("#w04-tabs .m-tab")];
  if (!svg || !tabs.length) return;

  const SHAPES = {
    diamond: {
      pts: [[210, 34], [322, 135], [210, 236], [98, 135]],
      focus: [210, 135],
      title: "044 菱形构图 · 闭合四斜边向腹心收拢",
      desc: "正倒双三角共底相接：四条等长斜边把四周视线一路推向正中交点，既有斜向速度感，又因双轴对称显得庄重稳固。",
      link: null,
    },
    square: {
      pts: [[126, 51], [294, 51], [294, 219], [126, 219]],
      focus: [210, 135],
      title: "045 方形构图 · 退回 0° 水平垂直稳态",
      desc: "同一套四顶点逆时针转回 45°，四条斜边立刻躺平成水平与垂直墙面——动感消失，换来极致的秩序、克制与容器感。",
      link: { id: "045", name: "045 方形构图" },
    },
    triangle: {
      pts: [[210, 38], [326, 224], [210, 224], [94, 224]],
      focus: [210, 118],
      title: "041 三角构图 · 拉平底边，力量单向指顶",
      desc: "把菱形的下半尖角压成宽阔平底，视觉重心立刻下沉稳坐，两条斜腰则把目光单向推向唯一顶角。",
      link: { id: "041", name: "041 三角构图" },
    },
    inverted: {
      pts: [[94, 46], [326, 46], [210, 234], [210, 46]],
      focus: [210, 186],
      title: "043 倒三角构图 · 掀开顶盖，制造下坠张力",
      desc: "把菱形的上尖摊成宽顶，上重下轻的漏斗瞬间带来强烈悬空与俯冲感——少了菱形上方的收口稳态。",
      link: { id: "043", name: "043 倒三角构图" },
    },
    centripetal: {
      pts: [[112, 54], [308, 54], [308, 216], [112, 216]],
      focus: [210, 135],
      open: true,
      title: "053 向心式构图 · 拆掉外框，纯靠多束射线下压",
      desc: "撤去闭合四边，直接从四面八方拉出开放引导线直指中心；与菱形相比少了外框围合与四角静区，冲击更直接。",
      link: { id: "053", name: "053 向心式构图" },
    },
  };

  let current = SHAPES.diamond.pts.map((p) => [...p]);
  let targetKey = "diamond";
  let animRaf = 0;

  function renderFrame(pts, key) {
    const spec = SHAPES[key];
    svg.replaceChildren();
    // 淡参考框
    svg.append(svgEl("rect", { x: 46, y: 18, width: 328, height: 234, fill: "none", stroke: "rgba(72,52,148,0.16)", "stroke-dasharray": "4 4" }));

    if (!spec.open) {
      svg.append(svgEl("polygon", {
        points: pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" "),
        fill: "rgba(72, 52, 148, 0.13)",
        stroke: "#483494",
        "stroke-width": 2.4,
      }));
    }

    // 视线向量箭头：由四顶点指向焦点
    const [fx, fy] = spec.focus;
    for (const [px, py] of pts) {
      const vx = fx - px, vy = fy - py;
      const len = Math.hypot(vx, vy) || 1;
      const ux = vx / len, uy = vy / len;
      const sx = px + ux * 10, sy = py + uy * 10;
      const ex = fx - ux * 16, ey = fy - uy * 16;
      svg.append(svgEl("line", {
        x1: sx, y1: sy, x2: ex, y2: ey,
        stroke: "#D62467", "stroke-width": spec.open ? 2.4 : 1.7,
        "stroke-dasharray": spec.open ? "" : "4 3",
      }));
      const w = 5.5, nx = -uy, ny = ux;
      svg.append(svgEl("polyline", {
        points: `${ex - ux * w + nx * w * 0.7},${ey - uy * w + ny * w * 0.7} ${ex},${ey} ${ex - ux * w - nx * w * 0.7},${ey - uy * w - ny * w * 0.7}`,
        fill: "none", stroke: "#D62467", "stroke-width": 1.8,
      }));
      svg.append(svgEl("circle", { cx: px, cy: py, r: 5, fill: "#180850" }));
    }

    // 焦点核心圆
    svg.append(svgEl("circle", { cx: fx, cy: fy, r: 10, fill: "#F24380" }));
    svg.append(svgEl("circle", { cx: fx, cy: fy, r: 17, fill: "none", stroke: "rgba(242,67,128,0.45)", "stroke-width": 1.4 }));
  }

  function updateCopy(key) {
    const spec = SHAPES[key];
    titleEl.textContent = spec.title;
    descEl.textContent = spec.desc;
    linkRow.replaceChildren();
    if (spec.link) {
      linkRow.append(document.createTextNode("深入拆解见专页："));
      const a = document.createElement("a");
      a.href = `https://layout.xiaoxiaodong.ai/${spec.link.id}/play/`;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = `${spec.link.name} 互动版 →`;
      linkRow.append(a);
    } else {
      linkRow.textContent = "本页聚焦 044 菱形构图的旋角、等边与净角规律。";
    }
  }

  function transitionTo(key) {
    targetKey = key;
    updateCopy(key);
    const goal = SHAPES[key].pts;
    if (reducedMotion.matches) {
      current = goal.map((p) => [...p]);
      renderFrame(current, key);
      return;
    }
    cancelAnimationFrame(animRaf);
    const start = current.map((p) => [...p]);
    const t0 = performance.now();
    const dur = 360;
    const step = (now) => {
      const k = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      current = start.map((p, i) => [
        p[0] + (goal[i][0] - p[0]) * e,
        p[1] + (goal[i][1] - p[1]) * e,
      ]);
      renderFrame(current, key);
      if (k < 1) animRaf = requestAnimationFrame(step);
    };
    animRaf = requestAnimationFrame(step);
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      transitionTo(btn.dataset.shape);
    });
  });

  renderFrame(current, "diamond");
}

/* =========================================================
   05 · 4 场景实战压力测试卡
   ========================================================= */
export function mountStressTest() {
  const svg = document.getElementById("w05-svg");
  const pill = document.getElementById("w05-pill");
  const titleEl = document.getElementById("w05-title");
  const descEl = document.getElementById("w05-desc");
  const altEl = document.getElementById("w05-alt");
  const tabs = [...document.querySelectorAll("#w05-tabs .s-tab")];
  if (!svg || !tabs.length) return;

  const CASES = {
    perfume: {
      ok: true,
      pill: "契合度高 · 推荐立菱",
      title: "单瓶香水立于对角交汇处，四角留白反而衬出贵重感",
      desc: "主体本身呈竖向对称，四周无需塞入副信息。45° 菱形切面把瓶身托成画幅唯一主角，斜边引导目光直接落在瓶肩高光与品牌字标上。",
      alt: "进阶做法：上下顶角距画幅留 8%–12% 留白（经验值），只把极简品牌名放在底角外侧。",
    },
    table: {
      ok: false,
      pill: "强烈不建议 · 斜边切碎文字",
      title: "多栏参数表塞进菱形，上下行被斜边硬切成参差碎片",
      desc: "菱形越接近顶角与底角水平宽度越窄，原本需要左右对齐的表格列与长句子被迫断行或被切掉表头，读起来极其费力。",
      alt: "更合适的做法：换回 046 矩形构图或清晰横排表格，别拿几何造型牺牲可读性。",
    },
    group: {
      ok: false,
      pill: "强烈不建议 · 两侧人物切头切肩",
      title: "四人横排合影套菱形，只有中间两人完整，两侧惨遭斜边削肩",
      desc: "菱形天然把有效高度集中在中央竖轴，越往左右两翼越尖窄。横向展开的多主角群像一旦硬裁成菱形，边缘人物立刻被切掉头部或被迫缩成蚂蚁。",
      alt: "更合适的做法：横幅群像用宽矩形或浅景深三分法，留出完整水平站位。",
    },
    ecommerce: {
      ok: false,
      pill: "高危失效 · 四角角标把视线往外扯散",
      title: "四角贴满「限时 / 满减 / 包邮 / 99+」，彻底废掉向内汇聚",
      desc: "菱形构图靠四角静音区衬托中心。电商主图如果同时要求四角挂满红黄高饱和促销贴纸，观者眼睛先被拉向四个角落，中央菱形瞬间沦为多余装饰。",
      alt: "更合适的做法：要么清理掉四角杂标，要么改用分区明确的模块化网格。",
    },
  };

  function draw(key) {
    const c = CASES[key];
    pill.textContent = c.pill;
    pill.className = `verdict-pill ${c.ok ? "is-ok" : "is-bad"}`;
    titleEl.textContent = c.title;
    descEl.textContent = c.desc;
    altEl.textContent = c.alt;

    svg.replaceChildren();
    const cx = 230, cy = 110, rx = 112, ry = 88;
    // 画幅底
    svg.append(svgEl("rect", { x: 48, y: 12, width: 364, height: 196, fill: "#F6F3FA", stroke: "#8279A0", "stroke-width": 1.2 }));

    const defs = svgEl("defs");
    const cp = svgEl("clipPath", { id: "w05-clip" });
    cp.append(svgEl("polygon", { points: `${cx},${cy - ry} ${cx + rx},${cy} ${cx},${cy + ry} ${cx - rx},${cy}` }));
    defs.append(cp);
    svg.append(defs);

    // 菱形内背景
    svg.append(svgEl("polygon", {
      points: `${cx},${cy - ry} ${cx + rx},${cy} ${cx},${cy + ry} ${cx - rx},${cy}`,
      fill: c.ok ? "#DBD0EE" : "#E8DFEE",
      stroke: c.ok ? "#0E6E54" : "#B51946",
      "stroke-width": 2,
      "stroke-dasharray": "5 4",
    }));

    if (key === "perfume") {
      // 精致对称香水瓶剪影
      svg.append(svgEl("rect", { x: cx - 12, y: cy - 48, width: 24, height: 16, rx: 2, fill: "#180850" }));
      svg.append(svgEl("rect", { x: cx - 26, y: cy - 28, width: 52, height: 68, rx: 6, fill: "#483494" }));
      svg.append(svgEl("rect", { x: cx - 18, y: cy - 8, width: 36, height: 22, fill: "#F6F3FA" }));
      svg.append(svgEl("circle", { cx, cy: cy + 3, r: 4, fill: "#F24380" }));
      // 向内净箭
      for (const [x1, y1, x2, y2] of [
        [cx, cy - 82, cx, cy - 58], [cx + 104, cy, cx + 62, cy],
        [cx, cy + 82, cx, cy + 54], [cx - 104, cy, cx - 62, cy],
      ]) {
        svg.append(svgEl("line", { x1, y1, x2, y2, stroke: "#0E6E54", "stroke-width": 2 }));
      }
    } else if (key === "table") {
      // 表格被斜边切碎
      for (let row = 0; row < 6; row++) {
        const y = cy - 66 + row * 24;
        svg.append(svgEl("rect", { x: cx - 118, y, width: 236, height: 14, fill: "rgba(181, 25, 70, 0.14)" }));
        svg.append(svgEl("rect", { x: cx - 118, y, width: 236, height: 14, fill: "#483494", opacity: "0.75", "clip-path": "url(#w05-clip)" }));
      }
      svg.append(svgEl("text", { x: cx - 94, y: cy - 55, fill: "#B51946", "font-size": 11, "font-weight": 700 }, "× 表头被切"));
      svg.append(svgEl("text", { x: cx + 52, y: cy + 68, fill: "#B51946", "font-size": 11, "font-weight": 700 }, "× 末列残缺"));
    } else if (key === "group") {
      // 四尊无五官剪影横排站立，两侧被斜边切头
      const xs = [cx - 88, cx - 30, cx + 30, cx + 88];
      for (const x of xs) {
        // 被裁掉的残影（红灰提示）
        svg.append(svgEl("circle", { cx: x, cy: cy - 30, r: 12, fill: "rgba(181, 25, 70, 0.28)" }));
        svg.append(svgEl("rect", { x: x - 18, y: cy - 14, width: 36, height: 64, rx: 10, fill: "rgba(181, 25, 70, 0.22)" }));
        // 菱内可见部分
        const g = svgEl("g", { "clip-path": "url(#w05-clip)" });
        g.append(svgEl("circle", { cx: x, cy: cy - 30, r: 12, fill: "#180850" }));
        g.append(svgEl("rect", { x: x - 18, y: cy - 14, width: 36, height: 64, rx: 10, fill: "#2F2668" }));
        svg.append(g);
      }
      svg.append(svgEl("text", { x: cx - 126, y: cy - 46, fill: "#B51946", "font-size": 11, "font-weight": 700 }, "× 切头"));
      svg.append(svgEl("text", { x: cx + 92, y: cy - 46, fill: "#B51946", "font-size": 11, "font-weight": 700 }, "× 削肩"));
    } else {
      // 满角促销首图
      svg.append(svgEl("rect", { x: cx - 22, y: cy - 28, width: 44, height: 56, rx: 6, fill: "#483494" }));
      const tags = [
        [62, 24, "限时 5 折"], [312, 24, "满 300-60"],
        [62, 166, "顺丰包邮"], [312, 166, "热销 999+"],
      ];
      for (const [tx, ty, label] of tags) {
        svg.append(svgEl("rect", { x: tx, y: ty, width: 84, height: 28, rx: 4, fill: "#B51946" }));
        svg.append(svgEl("text", { x: tx + 42, y: ty + 18, "text-anchor": "middle", fill: "#FFFFFF", "font-size": 11, "font-weight": 700 }, label));
        svg.append(svgEl("line", { x1: cx, y1: cy, x2: tx + 42, y2: ty + 14, stroke: "#B51946", "stroke-width": 1.3, "stroke-dasharray": "4 3" }));
      }
    }
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      draw(btn.dataset.case);
    });
  });

  draw("perfume");
}

/* =========================================================
   06 · 单变量视觉诊断小练习（2 题，严格中性选项 A/B/C/D）
   ========================================================= */
export function mountQuiz() {
  const grid = document.getElementById("quiz-grid");
  const promptEl = document.getElementById("quiz-prompt");
  const fb = document.getElementById("quiz-feedback");
  const fbVerdict = document.getElementById("qf-verdict");
  const fbBody = document.getElementById("qf-body");
  const nextBtn = document.getElementById("qf-next");
  const qTabs = [...document.querySelectorAll("#quiz-tabs .q-tab")];
  if (!grid || !fb) return;

  const QUESTIONS = [
    {
      prompt: "下面四版雪山海报都采用 45° 等边立菱外框，每次只改动一个结构变量。哪一版真正完成了「向内汇聚且焦点稳固」？",
      answer: "C",
      options: [
        { id: "A", sub: "方案 A", kind: "clutter" },
        { id: "B", sub: "方案 B", kind: "offcenter" },
        { id: "C", sub: "方案 C", kind: "good-q1" },
        { id: "D", sub: "方案 D", kind: "clipped" },
      ],
      explain: {
        right: "选对了！方案 C 四边等长且完整留在安全画幅内，雪峰核心正落两条对角线交点，外侧四角保持净留白，视线毫无分流地向心收拢。",
        wrong: {
          A: "方案 A 外框和焦点都没错，但外侧四个三角角落塞满高饱和装饰标牌，把原本向内汇聚的视线往四角扯散了。正确答案是方案 C。",
          B: "方案 B 四角干净，但主峰偏离对角交点并顶到了右上斜边，四条斜线的汇力扑了个空。正确答案是方案 C。",
          D: "方案 D 把菱形放大到上下左右四枚顶角全部顶出画框被硬切，闭合菱形退化成四条孤立斜杠。正确答案是方案 C。",
        },
      },
    },
    {
      prompt: "下面四版珠宝封面都保持视觉核心正居中、四角全净，只改变外框旋转角或纵横轴比。哪一版属于标准的菱形构图？",
      answer: "C",
      options: [
        { id: "A", sub: "方案 A", kind: "flat-square" },
        { id: "B", sub: "方案 B", kind: "flat-aspect" },
        { id: "C", sub: "方案 C", kind: "good-q2" },
        { id: "D", sub: "方案 D", kind: "crooked-20" },
      ],
      explain: {
        right: "选对了！方案 C 旋足 45° 且纵横轴比约 1.18:1，四边等长、上下挺拔，既有斜向动势又保有端庄对称。",
        wrong: {
          A: "方案 A 停在 0° 横平竖直位置，本质上是静态平稳的 045 方形构图，缺少四条斜边的向心引导。正确答案是方案 C。",
          B: "方案 B 虽然转到了 45°，但纵横轴比压扁至约 0.52:1，上下空间把中央宝石硬生生夹扁，斜向收敛势能大减。正确答案是方案 C。",
          D: "方案 D 停在 20° 半歪角，既没有 0° 方框的安稳，也没对齐 45° 竖轴，观者只会觉得画框挂歪了。正确答案是方案 C。",
        },
      },
    },
  ];

  let qIndex = 0;
  let picked = [null, null];

  function buildThumbSvg(opt, reveal, isRight) {
    const svg = svgEl("svg", { viewBox: "0 0 200 220", "aria-hidden": "true" });
    svg.append(svgEl("rect", { x: 0, y: 0, width: 200, height: 220, fill: "#EDE7F4" }));
    const cx = 100, cy = 110;

    let pts;
    if (opt.kind === "clipped") {
      pts = [[100, -14], [218, 110], [100, 234], [-18, 110]];
    } else if (opt.kind === "flat-square") {
      pts = [[46, 56], [154, 56], [154, 164], [46, 164]];
    } else if (opt.kind === "flat-aspect") {
      pts = [[100, 74], [176, 110], [100, 146], [24, 110]];
    } else if (opt.kind === "crooked-20") {
      const a = (-25 * Math.PI) / 180;
      const base = [[0, -72], [68, 0], [0, 72], [-68, 0]];
      pts = base.map(([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
    } else {
      // 标准 45° 均衡立菱
      pts = [[100, 32], [166, 110], [100, 188], [34, 110]];
    }

    const defs = svgEl("defs");
    const cid = `qz-${qIndex}-${opt.id}`;
    const cp = svgEl("clipPath", { id: cid });
    cp.append(svgEl("polygon", { points: pts.map((p) => p.join(",")).join(" ") }));
    defs.append(cp);
    svg.append(defs);

    // 菱内图案
    const g = svgEl("g", { "clip-path": `url(#${cid})` });
    g.append(svgEl("rect", { x: 0, y: 0, width: 200, height: 220, fill: qIndex === 0 ? "#8B81C9" : "#26155E" }));

    if (qIndex === 0) {
      const ox = opt.kind === "offcenter" ? 28 : 0;
      const oy = opt.kind === "offcenter" ? -20 : 0;
      g.append(svgEl("polygon", { points: `${cx + ox - 48},${cy + oy + 46} ${cx + ox},${cy + oy - 34} ${cx + ox + 48},${cy + oy + 46}`, fill: "#282B5C" }));
      g.append(svgEl("polygon", { points: `${cx + ox},${cy + oy - 34} ${cx + ox + 22},${cy + oy + 6} ${cx + ox + 6},${cy + oy + 46}`, fill: "#EFE0EE" }));
      g.append(svgEl("ellipse", { cx, cy: cy + 56, rx: 66, ry: 26, fill: "#464374" }));
      g.append(svgEl("circle", { cx: cx + ox, cy: cy + oy, r: 7, fill: "#F24380" }));
    } else {
      // 宝石主体始终居中
      g.append(svgEl("polygon", { points: `${cx},${cy - 28} ${cx + 22},${cy} ${cx},${cy + 28} ${cx - 22},${cy}`, fill: "#D4B5F8" }));
      g.append(svgEl("polygon", { points: `${cx},${cy - 15} ${cx + 12},${cy} ${cx},${cy + 15} ${cx - 12},${cy}`, fill: "#F24380" }));
    }
    svg.append(g);

    // 外框线
    svg.append(svgEl("polygon", {
      points: pts.map((p) => p.join(",")).join(" "),
      fill: "none",
      stroke: reveal ? (isRight ? "#0E6E54" : "#B51946") : "#483494",
      "stroke-width": reveal ? 2.4 : 1.7,
      "stroke-dasharray": "5 4",
    }));

    // 四顶圆点
    for (const [px, py] of pts) {
      if (px > 0 && px < 200 && py > 0 && py < 220) {
        svg.append(svgEl("circle", { cx: px, cy: py, r: 3.6, fill: "#180850" }));
      }
    }

    // Q1 方案 A 的四角抢戏干扰标
    if (opt.kind === "clutter") {
      for (const [bx, by] of [[12, 12], [150, 12], [12, 184], [150, 184]]) {
        svg.append(svgEl("rect", { x: bx, y: by, width: 38, height: 22, rx: 4, fill: "#D62467" }));
        svg.append(svgEl("rect", { x: bx + 6, y: by + 8, width: 26, height: 6, rx: 2, fill: "#FFFFFF" }));
      }
    }

    // 揭示诊断叠加线
    if (reveal) {
      svg.append(svgEl("line", { x1: cx, y1: 18, x2: cx, y2: 202, stroke: isRight ? "rgba(14,110,84,0.45)" : "rgba(181,25,70,0.35)", "stroke-dasharray": "3 3" }));
      svg.append(svgEl("line", { x1: 18, y1: cy, x2: 182, y2: cy, stroke: isRight ? "rgba(14,110,84,0.45)" : "rgba(181,25,70,0.35)", "stroke-dasharray": "3 3" }));
    }

    return svg;
  }

  function render() {
    const q = QUESTIONS[qIndex];
    const choice = picked[qIndex];
    promptEl.textContent = q.prompt;
    grid.replaceChildren();

    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-card";
      btn.dataset.opt = opt.id;
      const isRight = opt.id === q.answer;
      if (choice) {
        if (isRight) btn.classList.add("is-right");
        else if (choice === opt.id) btn.classList.add("is-wrong");
      }

      btn.append(buildThumbSvg(opt, Boolean(choice), isRight));
      const lbl = document.createElement("div");
      lbl.className = "quiz-lbl";
      const s1 = document.createElement("span");
      s1.textContent = opt.sub;
      const s2 = document.createElement("span");
      s2.textContent = choice ? (isRight ? "✓ 正解" : choice === opt.id ? "× 错项" : "") : "点击判别";
      lbl.append(s1, s2);
      btn.append(lbl);

      btn.addEventListener("click", () => {
        picked[qIndex] = opt.id;
        render();
      });
      grid.append(btn);
    });

    if (choice) {
      const ok = choice === q.answer;
      fb.hidden = false;
      fb.classList.toggle("is-right", ok);
      fbVerdict.textContent = ok ? `判断正确 · 选定方案 ${choice}` : `再看一眼 · 你选了方案 ${choice}（正解为方案 ${q.answer}）`;
      fbBody.textContent = ok ? q.explain.right : q.explain.wrong[choice];
      nextBtn.textContent = qIndex === 0 ? "做下一题（题 2 / 2）" : "回到题 1 / 2";
    } else {
      fb.hidden = true;
    }
  }

  qTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      qIndex = Number(btn.dataset.q);
      qTabs.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      render();
    });
  });

  nextBtn.addEventListener("click", () => {
    qIndex = qIndex === 0 ? 1 : 0;
    qTabs.forEach((b, i) => {
      const on = i === qIndex;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    render();
  });

  render();
}

/* =========================================================
   07 · 原海报放大拖拽灯箱（共用 #poster.src，不重复内联）
   ========================================================= */
export function mountLightbox() {
  const openBtn = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const dialog = document.getElementById("poster-lightbox");
  const stage = document.getElementById("lightbox-stage");
  const lbImg = document.getElementById("lightbox-img");
  const zoomIn = document.getElementById("lb-zoom-in");
  const zoomOut = document.getElementById("lb-zoom-out");
  const resetBtn = document.getElementById("lb-reset");
  const closeBtn = document.getElementById("lb-close");
  if (!openBtn || !dialog || !posterImg || !lbImg) return;

  let z = 1, tx = 0, ty = 0;
  let dragging = false, sx = 0, sy = 0, stx = 0, sty = 0;

  function apply() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${z.toFixed(2)})`;
    resetBtn.textContent = `${Math.round(z * 100)}%`;
  }

  openBtn.addEventListener("click", () => {
    if (!lbImg.src) lbImg.src = posterImg.src;
    z = 1; tx = 0; ty = 0;
    apply();
    dialog.showModal();
  });

  closeBtn.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      dialog.close();
    }
  });

  zoomIn.addEventListener("click", () => { z = clamp(z + 0.35, 1, 3.5); apply(); });
  zoomOut.addEventListener("click", () => { z = clamp(z - 0.35, 1, 3.5); if (z === 1) { tx = 0; ty = 0; } apply(); });
  resetBtn.addEventListener("click", () => { z = 1; tx = 0; ty = 0; apply(); });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    z = clamp(z + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.5);
    if (z === 1) { tx = 0; ty = 0; }
    apply();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    if (z <= 1) return;
    dragging = true;
    sx = e.clientX; sy = e.clientY;
    stx = tx; sty = ty;
    stage.setPointerCapture?.(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = stx + (e.clientX - sx);
    ty = sty + (e.clientY - sy);
    apply();
  });
  stage.addEventListener("pointerup", () => { dragging = false; });
  stage.addEventListener("pointercancel", () => { dragging = false; });
}

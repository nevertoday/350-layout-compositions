// 023 对角线构图 · 正文 01–07 节差异化交互与图形渲染模块
// 每节使用不同交互机制，互不重复；严格遵守零五官剪影、真实几何计算与高对比配色。

import { loop, pixelRatio } from "../../lib/stage.js";

const C = {
  porcelain: "#F7F6F1",
  mist: "#EAF1EC",
  white: "#FFFFFF",
  emerald: "#04583B",
  emeraldDark: "#063626",
  tunnel: "#07241B",
  yellow: "#F9C80E",
  red: "#C42E22",
  redBright: "#FF9484",
  ok: "#0E8C5C",
  okBright: "#7BF0B8",
  ink: "#0B1F13",
  grid: "rgba(4, 88, 59, 0.12)",
};

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = pixelRatio(2);
  const w = Math.max(240, Math.round(rect.width || canvas.width));
  const h = Math.max(160, Math.round(rect.height || canvas.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/* ==================== 01 为什么斜线天生显动：斜线效应与物理滚落 ==================== */
export function initSec01() {
  const canvas = document.getElementById("s01-canvas");
  const readout = document.getElementById("s01-readout");
  const chkPyth = document.getElementById("s01-pythagoras");
  const btns = [...document.querySelectorAll("[data-s01-angle]")];
  if (!canvas) return;

  let angle = 35;
  let showPyth = true;
  let ballS = 0; // 0..1 沿斜面滚动位置
  let ballV = 0;

  function updateReadout() {
    const rad = (angle * Math.PI) / 180;
    const sinA = Math.sin(rad);
    const aspect = 1.6;
    if (angle === 0) {
      readout.textContent = "0° 水平静止：重力分量 sin(0°) = 0%，球体停在原地；通道长度 1.00× 框宽，大脑读出彻底的稳定与安宁。";
    } else if (angle === 90) {
      readout.textContent = "90° 垂直矗立：重力全被柱底承托，视线上下直立；路径仅等于短边高度（0.63× 框宽），呈现庄重与纪念感。";
    } else {
      // 过中心斜线在 16:10 画框里的真实长度倍率
      const dx = Math.cos(rad), dy = Math.sin(rad);
      const tMax = Math.min((aspect / 2) / Math.max(1e-4, dx), 0.5 / Math.max(1e-4, dy));
      const lenH = 2 * tMax;
      const lenW = lenH / aspect;
      readout.textContent = `${angle}° 斜势释放：沿斜面切出 ${Math.round(sinA * 100)}% 重力推进分量；框内路径拉长至短边的 ${lenH.toFixed(2)}×（宽度的 ${lenW.toFixed(2)}×）。`;
    }
  }

  const ctrl = loop(canvas, (_t, dt, { still }) => {
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.fillStyle = C.porcelain;
    ctx.fillRect(0, 0, w, h);

    // 淡绿正交参考网（象征人眼 V1 的横竖基准坐标系）
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    const gStep = Math.max(22, Math.round(h / 10));
    for (let x = gStep; x < w; x += gStep) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = gStep; y < h; y += gStep) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const cx = w * 0.5;
    const cy = h * 0.52;
    const rad = (angle * Math.PI) / 180;
    const vx = Math.cos(rad);
    const vy = -Math.sin(rad); // 左低右高

    // 计算画框内的轨道端点（留出清晰边距防标注贴底）
    const padX = 28, padY = 34;
    const halfW = w / 2 - padX;
    const halfH = h / 2 - padY;
    const tLim = Math.min(
      Math.abs(vx) > 1e-4 ? halfW / Math.abs(vx) : 1e9,
      Math.abs(vy) > 1e-4 ? halfH / Math.abs(vy) : 1e9
    );
    const x0 = cx - vx * tLim, y0 = cy - vy * tLim;
    const x1 = cx + vx * tLim, y1 = cy + vy * tLim;

    // 勾股三角形叠层
    if (showPyth && angle > 0 && angle < 90) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y0);
      ctx.lineTo(x1, y1);
      ctx.closePath();
      ctx.fillStyle = "rgba(4, 88, 59, 0.08)";
      ctx.fill();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = C.emerald;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);

      // 标注底边与角度（放在虚线上方，绝不被底沿切掉）
      ctx.fillStyle = C.emerald;
      ctx.font = `600 12px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillText(`水平投影 Δx`, (x0 + x1) / 2, y0 - 8);
      ctx.textAlign = "left";
      ctx.fillText(`${angle}°`, x0 + 30, y0 - 8);
      ctx.restore();
    }

    // 主轨道实体梁
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = angle === 0 || angle === 90 ? C.emeraldDark : C.emerald;
    ctx.lineWidth = 8;
    ctx.lineCap = "butt";
    ctx.stroke();

    // 亮黄速度边线
    if (angle > 0 && angle < 90) {
      ctx.beginPath();
      ctx.moveTo(x0, y0 + 5);
      ctx.lineTo(x1, y1 + 5);
      ctx.strokeStyle = C.yellow;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();

    // 物理小球（沿斜面由高位向低位加速滚动，或静止在水平/垂直稳态）
    if (angle === 0 || angle === 90) {
      ballS = 0.5;
      ballV = 0;
    } else if (still) {
      ballS = 0.38;
    } else {
      const accel = 0.95 * Math.sin(rad);
      ballV += accel * dt;
      ballS += ballV * dt;
      if (ballS > 0.94) {
        ballS = 0.06;
        ballV = 0.12;
      }
    }

    // 高位是 (x1,y1)，低位是 (x0,y0)
    const bx = x1 + (x0 - x1) * ballS;
    const by = y1 + (y0 - y1) * ballS;
    const nx = -vy; // 指向轨道下侧，取反向 (-nx, -ny) 放在轨道上方
    const ny = vx;
    const ballR = 13;
    const ox = angle === 90 ? bx + ballR + 5 : bx - nx * (ballR + 4);
    const oy = angle === 90 ? by : by - ny * (ballR + 4);

    // 重力分力箭头
    if (showPyth && angle > 0 && angle < 90) {
      const fLen = 46 * Math.sin(rad);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox - vx * fLen, oy - vy * fLen);
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.6;
      ctx.stroke();
      // 小箭尖
      const ax = ox - vx * fLen, ay = oy - vy * fLen;
      ctx.beginPath();
      ctx.arc(ax, ay, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = C.red;
      ctx.fill();
      ctx.restore();
    }

    // 滚球
    ctx.beginPath();
    ctx.arc(ox, oy, ballR, 0, Math.PI * 2);
    ctx.fillStyle = angle === 0 || angle === 90 ? C.emerald : C.yellow;
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = C.tunnel;
    ctx.stroke();

    // 角标徽签
    ctx.fillStyle = C.tunnel;
    ctx.fillRect(12, 12, 148, 26);
    ctx.fillStyle = C.yellow;
    ctx.font = `600 12px "IBM Plex Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      angle === 0 ? "0° · 水平稳态" : angle === 90 ? "90° · 垂直支承" : `${angle}° · 活跃斜势`,
      22,
      25
    );
  });

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      angle = Number(b.dataset.s01Angle);
      ballS = 0.08;
      ballV = 0.12;
      btns.forEach((x) => {
        const active = x === b;
        x.classList.toggle("is-active", active);
        x.setAttribute("aria-pressed", String(active));
      });
      updateReadout();
      ctrl.draw();
    });
  });

  chkPyth.addEventListener("change", () => {
    showPyth = chkPyth.checked;
    ctrl.draw();
  });

  updateReadout();
  window.addEventListener("resize", () => ctrl.draw());
}

/* ==================== 02 角度与朝向改情绪：坡度卡片 + 左右镜像翻转 ==================== */
export function initSec02() {
  const canvas = document.getElementById("s02-canvas");
  const cards = [...document.querySelectorAll("[data-s02-band]")];
  const mirrorBtn = document.getElementById("s02-mirror-btn");
  const dirLabel = document.getElementById("s02-dir-label");
  const noteTitle = document.getElementById("s02-note-title");
  const noteBody = document.getElementById("s02-note-body");
  if (!canvas) return;

  const BANDS = {
    pseudo: {
      deg: 7,
      name: "伪水平歪斜带",
      ascTitle: "7° 左低右高 · 像地平线拍歪了",
      ascBody: "角度过小，大脑仍把它当成失败的水平线，反复触发纠错冲动而非速度感。",
      descTitle: "7° 左高右下 · 地面向右溜斜",
      descBody: "同样落在水平容错雷区里，整张画面像端歪的托盘往右下滑水。",
    },
    gentle: {
      deg: 24,
      name: "缓坡流动带",
      ascTitle: "24° 左下→右上 · 轻盈延展",
      ascBody: "平缓上坡拉开水平视野的同时保留前进势头，不急躁、适合风光长卷、建筑航拍与轻生活海报。",
      descTitle: "24° 左上→右下 · 顺读滑入",
      descBody: "顺着从左到右、从上到下的中文阅读轨迹把目光自然送入右下主角，轻快利落。",
    },
    sprint: {
      deg: 38,
      name: "黄金冲刺带",
      ascTitle: "38° 左下→右上 · 攀升冲刺",
      ascBody: "对习惯从左到右阅读的读者来说，左下起势、右上突进常带有前进、爬升与昂扬感；点「左右镜像翻转」立见情绪反转。",
      descTitle: "38° 左上→右下 · 高速俯冲",
      descBody: "同一角度镜像翻成左上→右下后，重力心理与斜势叠加，立刻转为凌厉的俯冲加速与冲撞感。",
    },
    steep: {
      deg: 58,
      name: "陡坡爆发带",
      ascTitle: "58° 左下→右上 · 陡峭突围",
      ascBody: "张力拉满、情绪紧绷，像冲向山脊或突破封锁；但须留意对侧留白与配重，否则容易头重脚轻。",
      descTitle: "58° 左上→右下 · 急坠压迫",
      descBody: "极具侵略性与危险悬念的陡降斜势，电影悬疑片海报与极限滑雪俯冲镜头最爱借它制造心跳感。",
    },
  };

  let bandKey = "sprint";
  let mirrored = false; // false: 左下→右上 (上冲) ; true: 左上→右下 (俯冲)

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    const band = BANDS[bandKey];
    const deg = mirrored ? -band.deg : band.deg;
    const rad = (deg * Math.PI) / 180;

    // 背景
    ctx.fillStyle = C.porcelain;
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.54;
    const vx = Math.cos(rad);
    const vy = -Math.sin(rad);
    const nx = -vy;
    const ny = vx;
    const far = Math.hypot(w, h) * 1.1;

    // 淡青绿斜切山坡面
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - vx * far, cy - vy * far);
    ctx.lineTo(cx + vx * far, cy + vy * far);
    ctx.lineTo(cx + vx * far + nx * far, cy + vy * far + ny * far);
    ctx.lineTo(cx - vx * far + nx * far, cy - vy * far + ny * far);
    ctx.closePath();
    ctx.fillStyle = bandKey === "pseudo" ? "#E8DAD6" : C.emerald;
    ctx.fill();

    // 亮黄动势斜带
    const bw = 16;
    ctx.beginPath();
    ctx.moveTo(cx - vx * far, cy - vy * far);
    ctx.lineTo(cx + vx * far, cy + vy * far);
    ctx.lineTo(cx + vx * far + nx * bw, cy + vy * far + ny * bw);
    ctx.lineTo(cx - vx * far + nx * bw, cy - vy * far + ny * bw);
    ctx.closePath();
    ctx.fillStyle = bandKey === "pseudo" ? C.red : C.yellow;
    ctx.fill();
    ctx.restore();

    // 极简冲刺剪影列车 / 箭矢模块
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-rad);
    ctx.fillStyle = C.tunnel;
    ctx.beginPath();
    ctx.moveTo(-66, -30);
    ctx.lineTo(28, -30);
    ctx.lineTo(58, -4);
    ctx.lineTo(-66, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C.white;
    ctx.fillRect(-52, -22, 22, 8);
    ctx.fillRect(-24, -22, 22, 8);
    ctx.fillRect(4, -22, 22, 8);

    // 方向大箭头
    ctx.strokeStyle = bandKey === "pseudo" ? C.red : C.yellow;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(74, -14);
    ctx.lineTo(116, -14);
    ctx.moveTo(104, -24);
    ctx.lineTo(117, -14);
    ctx.lineTo(104, -4);
    ctx.stroke();
    ctx.restore();

    // 角度弧与标尺
    ctx.save();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(22, cy);
    ctx.lineTo(w - 22, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = C.tunnel;
    ctx.fillRect(14, 14, 178, 28);
    ctx.fillStyle = C.yellow;
    ctx.font = `600 12px "IBM Plex Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${band.deg}° · ${mirrored ? "左上→右下 ↘" : "左下→右上 ↗"}`, 24, 28);
    ctx.restore();

    // 更新文案
    dirLabel.textContent = mirrored
      ? "当前方向：左上 → 右下（俯冲 ↘）"
      : "当前方向：左下 → 右上（上冲 ↗）";
    noteTitle.textContent = mirrored ? band.descTitle : band.ascTitle;
    noteBody.textContent = mirrored ? band.descBody : band.ascBody;
  }

  cards.forEach((c) => {
    c.addEventListener("click", () => {
      bandKey = c.dataset.s02Band;
      cards.forEach((x) => {
        const active = x === c;
        x.classList.toggle("is-active", active);
        x.setAttribute("aria-pressed", String(active));
      });
      draw();
    });
  });

  mirrorBtn.addEventListener("click", () => {
    mirrored = !mirrored;
    mirrorBtn.setAttribute("aria-pressed", String(mirrored));
    draw();
  });

  draw();
  window.addEventListener("resize", draw);
}

/* ==================== 03 疏密与配重稳住画面：三层勾选解剖台 ==================== */
export function initSec03() {
  const canvas = document.getElementById("s03-canvas");
  const chkScale = document.getElementById("s03-scale");
  const chkSpace = document.getElementById("s03-spacing");
  const chkCounter = document.getElementById("s03-counter");
  const scoreEl = document.getElementById("s03-score");
  const explainEl = document.getElementById("s03-explain");
  if (!canvas) return;

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    const hasScale = chkScale.checked;
    const hasSpace = chkSpace.checked;
    const hasCounter = chkCounter.checked;
    const count = [hasScale, hasSpace, hasCounter].filter(Boolean).length;

    ctx.fillStyle = C.porcelain;
    ctx.fillRect(0, 0, w, h);

    // 淡灰构图方框
    const pad = 26;
    const fw = w - pad * 2;
    const fh = h - pad * 2;
    ctx.strokeStyle = "#B8C7BE";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad, pad, fw, fh);

    // 主对角虚线（左下到右上）
    const x0 = pad + fw * 0.12, y0 = pad + fh * 0.86;
    const x1 = pad + fw * 0.88, y1 = pad + fh * 0.14;

    ctx.save();
    ctx.setLineDash([7, 6]);
    ctx.strokeStyle = C.emerald;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();

    // 沿线 4 个节点的参数：位置 t 与半径 r
    const ts = hasSpace ? [0.08, 0.42, 0.68, 0.88] : [0.10, 0.36, 0.62, 0.88];
    const rs = hasScale ? [42, 30, 20, 12] : [26, 26, 26, 26];
    const scaleFactor = Math.min(w, h) / 420;

    // 实算视觉质心
    let sumW = 0, sumX = 0, sumY = 0;
    for (let i = 0; i < 4; i++) {
      const px = x0 + (x1 - x0) * ts[i];
      const py = y0 + (y1 - y0) * ts[i];
      const r = rs[i] * scaleFactor;
      const mass = r * r;
      sumW += mass;
      sumX += px * mass;
      sumY += py * mass;

      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 || i === 3 ? C.emerald : C.yellow;
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = C.tunnel;
      ctx.stroke();
    }

    // 对侧配重块（位于右下或左上空域，平衡大型起点圆的重量）
    if (hasCounter) {
      const cwx = pad + fw * 0.72;
      const cwy = pad + fh * 0.72;
      const cwMass = Math.pow(34 * scaleFactor, 2);
      sumW += cwMass;
      sumX += cwx * cwMass;
      sumY += cwy * cwMass;

      ctx.save();
      ctx.fillStyle = C.tunnel;
      ctx.fillRect(cwx - 48 * scaleFactor, cwy - 28 * scaleFactor, 96 * scaleFactor, 56 * scaleFactor);
      ctx.fillStyle = C.yellow;
      ctx.fillRect(cwx - 38 * scaleFactor, cwy - 16 * scaleFactor, 44 * scaleFactor, 8 * scaleFactor);
      ctx.fillStyle = C.porcelain;
      ctx.fillRect(cwx - 38 * scaleFactor, cwy - 1 * scaleFactor, 76 * scaleFactor, 6 * scaleFactor);
      ctx.fillRect(cwx - 38 * scaleFactor, cwy + 11 * scaleFactor, 56 * scaleFactor, 6 * scaleFactor);
      ctx.restore();

      // 反斜细拉线
      ctx.save();
      ctx.strokeStyle = "rgba(4,88,59,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pad + fw * 0.56, pad + fh * 0.56);
      ctx.lineTo(cwx - 48 * scaleFactor, cwy - 28 * scaleFactor);
      ctx.stroke();
      ctx.restore();
    }

    // 绘制视觉质心标靶
    const comX = sumX / sumW;
    const comY = sumY / sumW;
    const centerX = w / 2;
    const centerY = h / 2;
    const offsetPx = Math.hypot(comX - centerX, comY - centerY);
    const offsetPct = Math.round((offsetPx / Math.min(fw, fh)) * 100);
    const balanced = offsetPct <= 11;

    // 稳态参考绿圈
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.min(fw, fh) * 0.11, 0, Math.PI * 2);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = balanced ? C.ok : C.red;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(comX, comY);
    ctx.strokeStyle = balanced ? C.ok : C.red;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(comX, comY, 6, 0, Math.PI * 2);
    ctx.fillStyle = balanced ? C.ok : C.red;
    ctx.fill();

    // 角落质心读数签
    ctx.fillStyle = C.tunnel;
    ctx.fillRect(pad + 10, pad + 10, 146, 26);
    ctx.fillStyle = balanced ? C.okBright : C.redBright;
    ctx.font = `600 12px "IBM Plex Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`质心偏移 ${offsetPct}%${balanced ? " · 稳" : " · 偏"}`, pad + 18, pad + 23);
    ctx.restore();

    // 更新底部文案
    const labels = [
      "0 / 3 层 · 均分板结",
      "1 / 3 层 · 刚起势",
      "2 / 3 层 · 接近成立",
      "3 / 3 层 · 动势与平衡兼得",
    ];
    scoreEl.textContent = labels[count];
    if (count === 0) {
      explainEl.textContent = `三层都未开启：四个等大圆对称排在斜线上，质心虽靠中（偏移 ${offsetPct}%），却像挂歪的串珠没有纵深加速度；勾上 ① 大小递减立刻看到重量猛向左下偏倾，需要 ③ 对侧配重兜底。`;
    } else if (hasScale && !hasCounter) {
      explainEl.textContent = `开启「近大远小」后起势明显增强，但大圆把视觉重量甩向左下（质心偏移 ${offsetPct}%），快勾上「对侧配重」兜住右下角！`;
    } else if (!hasScale && hasCounter) {
      explainEl.textContent = "有了对侧配重，但沿线仍是等大圆，少了从近到远的透视冲刺力；勾上「大小递减」与「间距压缩」。";
    } else if (count === 3) {
      explainEl.textContent = `三层齐备：大圆确立起点、前疏后密拉出冲刺速度，右下辅文配重把质心偏移压回 ${offsetPct}% 稳态绿圈内。`;
    } else {
      explainEl.textContent = `已开 ${count} 层，当前质心偏移 ${offsetPct}%；继续勾选其余层，体会大小、疏密与配重的协同。`;
    }
  }

  [chkScale, chkSpace, chkCounter].forEach((el) => el.addEventListener("change", draw));
  draw();
  window.addEventListener("resize", draw);
}

/* ==================== 04 对角线从哪来：四时代骨架透视画廊 ==================== */
export function initSec04() {
  const canvas = document.getElementById("s04-canvas");
  const tabs = [...document.querySelectorAll("[data-era]")];
  const chkForces = document.getElementById("s04-forces");
  const metaEl = document.getElementById("s04-meta");
  const titleEl = document.getElementById("s04-title");
  const bodyEl = document.getElementById("s04-body");
  const takeEl = document.getElementById("s04-takeaway");
  if (!canvas) return;

  const ERAS = {
    baroque: {
      meta: "17 世纪巴洛克 · Heinrich Wölfflin《艺术史的基本概念》（1915）",
      title: "用「纵深斜入」掀翻文艺复兴平行网格",
      body: "瑞士艺术史家 Heinrich Wölfflin 在 1915 年《艺术史的基本概念》（Kunstgeschichtliche Grundbegriffe）中把文艺复兴与巴洛克的转折总结为「平面与纵深」「封闭与开放」等五组对立概念：文艺复兴偏爱平行画面的横竖稳定结构，而巴洛克刻意把建筑廊柱、光束与人物动态扭向画面深处，用斜向纵深把观众拽进戏剧现场。",
      takeaway: "骨架要诀：告别平面端庄、制造空间卷入感，第一刀就是把平行排列改成斜向切入。",
    },
    gericault: {
      meta: "浪漫主义 · Théodore Géricault《美杜莎之筏》（1818–1819，卢浮宫 INV 4884）",
      title: "双对角金字塔：绝望与希望在同一画框对拉",
      body: "法国画家 Théodore Géricault 在 4.91 × 7.16 米巨作《美杜莎之筏》里搭出两座错位的对角三角：主斜线从左下垂死人群一路攀升至右上高举红白巾呼救的顶点；左侧绷紧的风帆与缆绳则形成反向斜力往左拉扯，让整张画在绝望与一线生机之间拉满张力。",
      takeaway: "骨架要诀：主斜线负责把视线推向高潮顶点，一条克制的反向斜力能让画面张力翻倍而不倾覆。",
    },
    hokusai: {
      meta: "浮世绘 · 葛饰北斋《富岳三十六景·神奈川冲浪里》（约 1830–1832，大都会博物馆 JP1847）",
      title: "巨浪斜弧压境，静稳远峰做锚",
      body: "葛饰北斋在《神奈川冲浪里》用一条从左下方掀起的巨浪斜弧，配合三艘沿斜浪冲锋的木舟，把整个画面的动态能量压向右侧；而远方低稳对称的富士山恰好坐落在反侧空域，一动一静互为配重，也让欧洲印象派与后印象派画家彻底惊叹于东方斜切构图的力量。",
      takeaway: "骨架要诀：越猛烈的斜向巨势，越需要一枚安静稳重的小锚点来反衬速度并兜住画面。",
    },
    rodchenko: {
      meta: "建构主义摄影 · Aleksandr Rodchenko《少先队员女孩》（1930，MoMA 馆藏 44883）与同时期阶梯摄影",
      title: "告别齐胸平拍，主动把相机拧斜",
      body: "20 世纪 20–30 年代，苏联建构主义先锋 Aleksandr Rodchenko 公开反对传统「齐肚脐平拍」的静态审美，在《少先队员女孩》（1930）及同时期俯拍阶梯、消防梯摄影中大胆仰拍、俯拍并倾斜机位，让阶梯与建筑边缘化作劈开画面的锋利斜线；El Lissitzky 等人也把斜楔几何带入现代海报排版，奠定了今天的速度视觉语法。",
      takeaway: "骨架要诀：现代摄影与平面设计不只等待场景里的斜线，还通过机位、裁切与版面斜带主动造出斜势。",
    },
  };

  let current = "baroque";

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    const showF = chkForces.checked;

    ctx.fillStyle = C.white;
    ctx.fillRect(0, 0, w, h);

    // 画框内框
    const p = 24;
    const iw = w - p * 2, ih = h - p * 2;
    ctx.fillStyle = C.porcelain;
    ctx.fillRect(p, p, iw, ih);
    ctx.strokeStyle = C.emerald;
    ctx.lineWidth = 2;
    ctx.strokeRect(p, p, iw, ih);

    if (current === "baroque") {
      // 巴洛克斜纵深柱廊与强光束抽象图解
      ctx.fillStyle = "#DCE7DF";
      ctx.beginPath();
      ctx.moveTo(p, p);
      ctx.lineTo(p + iw * 0.66, p);
      ctx.lineTo(p + iw * 0.42, p + ih);
      ctx.lineTo(p, p + ih);
      ctx.closePath();
      ctx.fill();

      // 纵深退台柱列（由近大到远小斜入）
      const cols = [
        [0.14, 0.14, 0.11, 0.78],
        [0.34, 0.24, 0.08, 0.62],
        [0.50, 0.32, 0.06, 0.48],
        [0.62, 0.38, 0.045, 0.36],
      ];
      for (const [cx, cy, cw, ch] of cols) {
        ctx.fillStyle = C.emeraldDark;
        ctx.fillRect(p + iw * cx, p + ih * cy, iw * cw, ih * ch);
      }

      // 斜射光柱
      ctx.fillStyle = "rgba(249, 200, 14, 0.28)";
      ctx.beginPath();
      ctx.moveTo(p + iw * 0.88, p);
      ctx.lineTo(p + iw, p);
      ctx.lineTo(p + iw * 0.36, p + ih);
      ctx.lineTo(p + iw * 0.14, p + ih);
      ctx.closePath();
      ctx.fill();

      if (showF) {
        drawForceArrow(ctx, p + iw * 0.10, p + ih * 0.88, p + iw * 0.84, p + ih * 0.20, C.yellow, "斜向纵深轴", false, 0.28);
        drawForceArrow(ctx, p + iw * 0.88, p + ih * 0.08, p + iw * 0.26, p + ih * 0.86, C.red, "明暗斜光束", true, 0.30);
      }
    } else if (current === "gericault") {
      // 美杜莎之筏双对角金字塔几何骨架
      // 海浪底
      ctx.fillStyle = "#CEDFD5";
      ctx.fillRect(p, p + ih * 0.68, iw, ih * 0.32);

      // 左倾风帆暗三角（反向拉扯）
      ctx.fillStyle = "rgba(7, 36, 27, 0.72)";
      ctx.beginPath();
      ctx.moveTo(p + iw * 0.08, p + ih * 0.84);
      ctx.lineTo(p + iw * 0.34, p + ih * 0.16);
      ctx.lineTo(p + iw * 0.56, p + ih * 0.84);
      ctx.closePath();
      ctx.fill();

      // 右升求救金字塔（主对角冲顶）
      ctx.fillStyle = "rgba(4, 88, 59, 0.82)";
      ctx.beginPath();
      ctx.moveTo(p + iw * 0.18, p + ih * 0.88);
      ctx.lineTo(p + iw * 0.82, p + ih * 0.18);
      ctx.lineTo(p + iw * 0.92, p + ih * 0.88);
      ctx.closePath();
      ctx.fill();

      // 顶点挥巾信号点
      ctx.beginPath();
      ctx.arc(p + iw * 0.82, p + ih * 0.18, 9, 0, Math.PI * 2);
      ctx.fillStyle = C.yellow;
      ctx.fill();

      if (showF) {
        drawForceArrow(ctx, p + iw * 0.16, p + ih * 0.88, p + iw * 0.82, p + ih * 0.18, C.yellow, "主升势对角（求救顶点）");
        drawForceArrow(ctx, p + iw * 0.50, p + ih * 0.74, p + iw * 0.24, p + ih * 0.24, C.red, "风帆反拉力", true);
      }
    } else if (current === "hokusai") {
      // 神奈川冲浪里：巨浪斜弧 + 稳峰锚点
      ctx.fillStyle = "#E6EFE9";
      ctx.fillRect(p, p, iw, ih);

      // 远方静止对称小富士山（右下中侧锚点）
      ctx.fillStyle = C.emeraldDark;
      ctx.beginPath();
      ctx.moveTo(p + iw * 0.54, p + ih * 0.78);
      ctx.lineTo(p + iw * 0.67, p + ih * 0.54);
      ctx.lineTo(p + iw * 0.80, p + ih * 0.78);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.beginPath();
      ctx.moveTo(p + iw * 0.635, p + ih * 0.61);
      ctx.lineTo(p + iw * 0.67, p + ih * 0.54);
      ctx.lineTo(p + iw * 0.705, p + ih * 0.61);
      ctx.closePath();
      ctx.fill();

      // 左起巨浪斜弧
      ctx.fillStyle = C.emerald;
      ctx.beginPath();
      ctx.moveTo(p, p + ih);
      ctx.lineTo(p, p + ih * 0.34);
      ctx.bezierCurveTo(p + iw * 0.24, p + ih * 0.04, p + iw * 0.54, p + ih * 0.10, p + iw * 0.58, p + ih * 0.34);
      ctx.bezierCurveTo(p + iw * 0.44, p + ih * 0.28, p + iw * 0.36, p + ih * 0.52, p + iw * 0.52, p + ih * 0.78);
      ctx.lineTo(p + iw, p + ih * 0.86);
      ctx.lineTo(p + iw, p + ih);
      ctx.closePath();
      ctx.fill();

      if (showF) {
        drawForceArrow(ctx, p + iw * 0.12, p + ih * 0.84, p + iw * 0.56, p + ih * 0.26, C.yellow, "巨浪斜压弧势");
        ctx.save();
        ctx.beginPath();
        ctx.arc(p + iw * 0.67, p + ih * 0.64, 24, 0, Math.PI * 2);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = C.red;
        ctx.font = `600 11px "Noto Sans SC", sans-serif`;
        ctx.fillText("静稳锚点", p + iw * 0.67 - 22, p + ih * 0.48);
        ctx.restore();
      }
    } else {
      // 建构主义倾斜机位阶梯与剪影
      ctx.save();
      ctx.beginPath();
      ctx.rect(p, p, iw, ih);
      ctx.clip();

      ctx.translate(w / 2, h / 2);
      ctx.rotate(-0.56);
      for (let i = -8; i <= 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? C.emeraldDark : "#DCE7DF";
        ctx.fillRect(-iw, i * 24, iw * 2, 13);
      }
      // 一名无五官俯拍行人纯剪影（圆顶+肩形）
      ctx.fillStyle = C.yellow;
      ctx.beginPath();
      ctx.ellipse(-28, -6, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-28, -14, 7, 0, Math.PI * 2);
      ctx.fillStyle = C.tunnel;
      ctx.fill();
      ctx.restore();

      if (showF) {
        drawForceArrow(ctx, p + iw * 0.12, p + ih * 0.84, p + iw * 0.88, p + ih * 0.16, C.yellow, "倾斜机位锐切阶梯");
      }
    }

    // 同步文字
    const info = ERAS[current];
    metaEl.textContent = info.meta;
    titleEl.textContent = info.title;
    bodyEl.textContent = info.body;
    takeEl.textContent = info.takeaway;
  }

  function drawForceArrow(ctx, x0, y0, x1, y1, color, label, dashed = false, labelT = 0.5) {
    ctx.save();
    if (dashed) ctx.setLineDash([7, 5]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.setLineDash([]);

    const ang = Math.atan2(y1 - y0, x1 - x0);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - 12 * Math.cos(ang - 0.42), y1 - 12 * Math.sin(ang - 0.42));
    ctx.lineTo(x1 - 12 * Math.cos(ang + 0.42), y1 - 12 * Math.sin(ang + 0.42));
    ctx.closePath();
    ctx.fill();

    // 标签底条
    const mx = x0 + (x1 - x0) * labelT;
    const my = y0 + (y1 - y0) * labelT;
    ctx.font = `600 11px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(label).width + 12;
    ctx.fillStyle = C.tunnel;
    ctx.fillRect(mx - tw / 2, my - 11, tw, 22);
    ctx.fillStyle = color === C.red ? C.redBright : C.yellow;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, mx, my);
    ctx.restore();
  }

  tabs.forEach((tb) => {
    tb.addEventListener("click", () => {
      current = tb.dataset.era;
      tabs.forEach((x) => {
        const active = x === tb;
        x.classList.toggle("is-active", active);
        x.setAttribute("aria-selected", String(active));
      });
      draw();
    });
  });

  chkForces.addEventListener("change", draw);
  draw();
  window.addEventListener("resize", draw);
}

/* ==================== 05 和隔壁几条线怎么分：线条家族六格对比台 ==================== */
export function initSec05() {
  const canvas = document.getElementById("s05-canvas");
  const btns = [...document.querySelectorAll("[data-fam]")];
  const titleEl = document.getElementById("s05-title");
  const linkEl = document.getElementById("s05-link");
  const descEl = document.getElementById("s05-desc");
  if (!canvas) return;

  const FAM = {
    "023": {
      title: "023 对角线构图（本页主角）",
      desc: "由一条明确占主导的斜向动线贯穿画框，把静止空间劈开成方向、张力与速度的通道；其余次要元素负责呼应或兜住平衡，绝不和主斜线抢权。",
      href: "#sec-08",
      linkText: "对照本页原海报 ↓",
      external: false,
    },
    "021": {
      title: "021 水平构图",
      desc: "以 0° 水平线为主导，强调辽阔、安宁与稳态；一旦倾斜超过 2°–5° 就会显得歪斜失稳——而对角线恰恰要越过 ±16° 彻底告别水平基准。",
      href: "https://layout.xiaoxiaodong.ai/021/play/",
      linkText: "去 021 互动页 →",
      external: true,
    },
    "022": {
      title: "022 垂直构图",
      desc: "以 90° 铅直立线为主导，传递高耸、庄重与秩序；如果对角线拧到 65° 以上，就会滑入垂直柱列的倾倒错觉。",
      href: "https://layout.xiaoxiaodong.ai/022/play/",
      linkText: "去 022 互动页 →",
      external: true,
    },
    "024": {
      title: "024 平行线构图",
      desc: "重点在「多条同向线反复出现形成的秩序与节拍」（可以是横、竖或斜）；对角线构图则聚焦单条最强斜势的爆发与方向穿透。",
      href: "https://layout.xiaoxiaodong.ai/024/play/",
      linkText: "去 024 互动页 →",
      external: true,
    },
    "025": {
      title: "025 汇聚线构图",
      desc: "多条不同倾角的斜线共同收束向同一个透视灭点，核心任务是把视线死死锁向远方一点；而对角线更强调整段通道本身的速度与张力。",
      href: "https://layout.xiaoxiaodong.ai/025/play/",
      linkText: "去 025 互动页 →",
      external: true,
    },
    "026": {
      title: "026 交叉线构图",
      desc: "两条力量旗鼓相当的反斜线在画中正面相交（如 X 形），主打戏剧冲突、阻隔与交锋；对角线构图是一主一辅，保持单一清晰行进方向。",
      href: "https://layout.xiaoxiaodong.ai/026/play/",
      linkText: "去 026 互动页 →",
      external: true,
    },
  };

  let active = "023";

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.fillStyle = C.porcelain;
    ctx.fillRect(0, 0, w, h);

    const p = 24, iw = w - p * 2, ih = h - p * 2;
    ctx.strokeStyle = "#B8C7BE";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p, p, iw, ih);

    ctx.lineCap = "square";
    if (active === "023") {
      // 单主斜势 + 对侧小配重
      ctx.strokeStyle = C.emerald;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(p + iw * 0.08, p + ih * 0.90);
      ctx.lineTo(p + iw * 0.88, p + ih * 0.14);
      ctx.stroke();

      ctx.strokeStyle = C.yellow;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p + iw * 0.12, p + ih * 0.94);
      ctx.lineTo(p + iw * 0.92, p + ih * 0.18);
      ctx.stroke();

      ctx.fillStyle = C.tunnel;
      ctx.fillRect(p + iw * 0.14, p + ih * 0.18, iw * 0.18, ih * 0.14);
    } else if (active === "021") {
      for (const y of [0.34, 0.56, 0.72]) {
        ctx.strokeStyle = y === 0.56 ? C.emerald : "#8AA79A";
        ctx.lineWidth = y === 0.56 ? 9 : 3;
        ctx.beginPath();
        ctx.moveTo(p + 10, p + ih * y);
        ctx.lineTo(p + iw - 10, p + ih * y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(p + iw * 0.72, p + ih * 0.34, 18, 0, Math.PI * 2);
      ctx.fillStyle = C.yellow;
      ctx.fill();
    } else if (active === "022") {
      for (const x of [0.22, 0.38, 0.50, 0.64, 0.78]) {
        ctx.strokeStyle = x === 0.50 ? C.emerald : "#4B7A67";
        ctx.lineWidth = x === 0.50 ? 12 : 6;
        ctx.beginPath();
        ctx.moveTo(p + iw * x, p + ih * 0.92);
        ctx.lineTo(p + iw * x, p + ih * (x === 0.50 ? 0.12 : 0.22));
        ctx.stroke();
      }
    } else if (active === "024") {
      for (let i = 0; i < 6; i++) {
        const off = i * 0.14;
        ctx.strokeStyle = i % 2 === 0 ? C.emerald : "#4D826D";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(p + iw * (0.04 + off), p + ih * 0.90);
        ctx.lineTo(p + iw * (0.26 + off), p + ih * 0.12);
        ctx.stroke();
      }
    } else if (active === "025") {
      const vx = p + iw * 0.66, vy = p + ih * 0.32;
      const starts = [
        [p + 8, p + ih * 0.14],
        [p + 8, p + ih * 0.56],
        [p + 8, p + ih * 0.94],
        [p + iw * 0.42, p + ih * 0.96],
        [p + iw * 0.94, p + ih * 0.92],
      ];
      for (const [sx, sy] of starts) {
        ctx.strokeStyle = C.emerald;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(vx, vy);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(vx, vy, 11, 0, Math.PI * 2);
      ctx.fillStyle = C.yellow;
      ctx.fill();
      ctx.strokeStyle = C.tunnel;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = C.emerald;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(p + iw * 0.12, p + ih * 0.88);
      ctx.lineTo(p + iw * 0.88, p + ih * 0.12);
      ctx.stroke();

      ctx.strokeStyle = C.red;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(p + iw * 0.12, p + ih * 0.12);
      ctx.lineTo(p + iw * 0.88, p + ih * 0.88);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(p + iw * 0.5, p + ih * 0.5, 13, 0, Math.PI * 2);
      ctx.fillStyle = C.yellow;
      ctx.fill();
    }

    const info = FAM[active];
    titleEl.textContent = info.title;
    descEl.textContent = info.desc;
    linkEl.textContent = info.linkText;
    linkEl.href = info.href;
    if (info.external) {
      linkEl.setAttribute("target", "_blank");
      linkEl.setAttribute("rel", "noopener");
    } else {
      linkEl.removeAttribute("target");
      linkEl.removeAttribute("rel");
    }
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      active = b.dataset.fam;
      btns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      draw();
    });
  });

  draw();
  window.addEventListener("resize", draw);
}

/* ==================== 06 什么时候别用：四张可原地纠偏对比 SVG 卡片 ==================== */
export function initSec06() {
  const cards = [...document.querySelectorAll(".misuse-card")];
  if (!cards.length) return;

  function renderSvg(type, fixed) {
    if (type === "zen") {
      return fixed
        ? `<svg viewBox="0 0 320 180" aria-hidden="true">
            <rect width="320" height="180" fill="#F7F6F1"/>
            <line x1="20" y1="126" x2="300" y2="126" stroke="#04583B" stroke-width="5"/>
            <rect x="118" y="84" width="62" height="40" rx="4" fill="#07241B"/>
            <path d="M180 94 Q194 94 194 104 Q194 114 180 114" fill="none" stroke="#07241B" stroke-width="4"/>
            <path d="M138 74 Q143 62 138 52 M156 74 Q161 62 156 52" fill="none" stroke="#85A495" stroke-width="2.5"/>
            <rect x="20" y="16" width="98" height="22" fill="#04583B"/>
            <text x="30" y="31" fill="#F9C80E" font-size="11" font-weight="700">0° 水平沉静</text>
          </svg>`
        : `<svg viewBox="0 0 320 180" aria-hidden="true">
            <rect width="320" height="180" fill="#F7F6F1"/>
            <g transform="translate(160 112) rotate(-26)">
              <line x1="-170" y1="20" x2="170" y2="20" stroke="#C42E22" stroke-width="5"/>
              <rect x="-32" y="-22" width="62" height="40" rx="4" fill="#07241B"/>
              <path d="M30 -12 Q44 -12 44 -2 Q44 8 30 8" fill="none" stroke="#07241B" stroke-width="4"/>
              <path d="M-26 -20 L-58 4" stroke="#F9C80E" stroke-width="4" stroke-dasharray="4 3"/>
            </g>
            <rect x="20" y="16" width="114" height="22" fill="#C42E22"/>
            <text x="29" y="31" fill="#FFFFFF" font-size="11" font-weight="700">26° 歪斜像要泼茶</text>
          </svg>`;
    }
    if (type === "bodytext") {
      return fixed
        ? `<svg viewBox="0 0 320 180" aria-hidden="true">
            <rect width="320" height="180" fill="#F7F6F1"/>
            <polygon points="220,0 320,0 320,180 175,180" fill="#04583B"/>
            <polygon points="212,0 226,0 181,180 167,180" fill="#F9C80E"/>
            <rect x="24" y="42" width="124" height="10" fill="#07241B"/>
            <rect x="24" y="64" width="144" height="7" fill="#3D594B"/>
            <rect x="24" y="80" width="136" height="7" fill="#3D594B"/>
            <rect x="24" y="96" width="128" height="7" fill="#3D594B"/>
            <rect x="24" y="112" width="112" height="7" fill="#3D594B"/>
            <rect x="20" y="12" width="126" height="20" fill="#04583B"/>
            <text x="28" y="26" fill="#F9C80E" font-size="10.5" font-weight="700">底面斜切 · 正文水平</text>
          </svg>`
        : `<svg viewBox="0 0 320 180" aria-hidden="true">
            <rect width="320" height="180" fill="#F7F6F1"/>
            <g transform="translate(154 96) rotate(-22)">
              <rect x="-86" y="-44" width="152" height="10" fill="#C42E22"/>
              <rect x="-86" y="-24" width="174" height="7" fill="#3D594B"/>
              <rect x="-86" y="-10" width="166" height="7" fill="#3D594B"/>
              <rect x="-86" y="4" width="158" height="7" fill="#3D594B"/>
              <rect x="-86" y="18" width="148" height="7" fill="#3D594B"/>
              <rect x="-86" y="32" width="132" height="7" fill="#3D594B"/>
            </g>
            <rect x="20" y="12" width="128" height="20" fill="#C42E22"/>
            <text x="28" y="26" fill="#FFFFFF" font-size="10.5" font-weight="700">长文跟着歪 · 换行丢行</text>
          </svg>`;
    }
    if (type === "dutch") {
      return fixed
        ? `<svg viewBox="0 0 320 180" aria-hidden="true">
            <rect width="320" height="180" fill="#F7F6F1"/>
            <rect x="20" y="132" width="280" height="32" fill="#DCE6DF"/>
            <rect x="86" y="88" width="148" height="44" fill="#04583B"/>
            <rect x="96" y="74" width="128" height="20" fill="#07241B"/>
            <rect x="44" y="46" width="28" height="86" fill="#9BB3A5"/>
            <rect x="20" y="12" width="122" height="20" fill="#04583B"/>
            <text x="28" y="26" fill="#F9C80E" font-size="10.5" font-weight="700">静态空间端平机位</text>
          </svg>`
        : `<svg viewBox="0 0 320 180" aria-hidden="true">
            <rect width="320" height="180" fill="#F7F6F1"/>
            <g transform="translate(160 100) rotate(20)">
              <rect x="-180" y="32" width="360" height="50" fill="#DCE6DF"/>
              <rect x="-74" y="-12" width="148" height="44" fill="#C42E22"/>
              <rect x="-64" y="-26" width="128" height="20" fill="#07241B"/>
              <rect x="-116" y="-54" width="28" height="86" fill="#9BB3A5"/>
            </g>
            <rect x="20" y="12" width="132" height="20" fill="#C42E22"/>
            <text x="28" y="26" fill="#FFFFFF" font-size="10.5" font-weight="700">静止客厅硬歪 20° 晕眩</text>
          </svg>`;
    }
    // corner
    return fixed
      ? `<svg viewBox="0 0 320 180" aria-hidden="true">
          <rect width="320" height="180" fill="#07241B"/>
          <line x1="26" y1="164" x2="254" y2="38" stroke="#F9C80E" stroke-width="10"/>
          <circle cx="212" cy="62" r="22" fill="#F7F6F1"/>
          <rect x="36" y="30" width="70" height="26" fill="#04583B" stroke="#F9C80E" stroke-width="1.5"/>
          <rect x="20" y="12" width="136" height="20" fill="#04583B"/>
          <text x="28" y="26" fill="#7BF0B8" font-size="10.5" font-weight="700">终点留呼吸 · 左上兜底</text>
        </svg>`
      : `<svg viewBox="0 0 320 180" aria-hidden="true">
          <rect width="320" height="180" fill="#07241B"/>
          <line x1="18" y1="168" x2="318" y2="2" stroke="#C42E22" stroke-width="10"/>
          <circle cx="304" cy="14" r="24" fill="#F7F6F1"/>
          <path d="M292 28 L316 4" stroke="#F9C80E" stroke-width="3"/>
          <rect x="20" y="12" width="142" height="20" fill="#C42E22"/>
          <text x="28" y="26" fill="#FFFFFF" font-size="10.5" font-weight="700">主角撞死角 · 视线滑出</text>
        </svg>`;
  }

  cards.forEach((card) => {
    const type = card.dataset.case;
    const preview = card.querySelector(".mc-preview");
    const badge = card.querySelector(".mc-badge");
    const btn = card.querySelector(".mc-fix-btn");
    let fixed = false;

    const sync = () => {
      preview.innerHTML = renderSvg(type, fixed);
      card.classList.toggle("is-fixed", fixed);
      badge.className = `mc-badge ${fixed ? "is-good" : "is-bad"}`;
      badge.textContent = fixed ? "已纠偏 · 合理收手" : "翻车现场";
      btn.textContent = fixed ? "看回翻车原样" : "点击纠偏 →";
      btn.setAttribute("aria-pressed", String(fixed));
    };

    btn.addEventListener("click", () => {
      fixed = !fixed;
      sync();
    });
    sync();
  });
}

/* ==================== 07 练一练：四选一单变量构图诊断 ==================== */
export function initSec07() {
  const opts = [...document.querySelectorAll(".quiz-opt")];
  const fb = document.getElementById("quiz-feedback");
  if (!opts.length || !fb) return;

  // 极简无五官跑者纯剪影（供 4 个方案复用，保证除构图变量外完全同源！）
  const runnerPath = (x, y, s, color = "#F7F6F1") => `
    <g transform="translate(${x} ${y}) scale(${s})">
      <circle cx="4" cy="-22" r="5" fill="${color}"/>
      <path d="M-2 -15 L7 -12 L13 -3 L8 -1 L3 -8 L0 2 L9 14 L4 16 L-4 5 L-11 13 L-15 10 L-6 -3 L-12 -8 L-9 -12 Z" fill="${color}"/>
    </g>`;

  const THUMBS = {
    // 方案 A：仅 +6° 伪水平微歪
    A: `<svg viewBox="0 0 320 200" aria-hidden="true">
      <rect width="320" height="200" fill="#07241B"/>
      <polygon points="0,140 320,108 320,200 0,200" fill="#04583B"/>
      <line x1="0" y1="138" x2="320" y2="106" stroke="#F9C80E" stroke-width="8"/>
      ${runnerPath(68, 122, 1.05)}
      ${runnerPath(146, 114, 0.85)}
      ${runnerPath(214, 108, 0.68)}
      ${runnerPath(268, 102, 0.54)}
      <rect x="24" y="24" width="88" height="12" fill="#F7F6F1"/>
      <rect x="24" y="42" width="62" height="7" fill="#89B8A3"/>
    </svg>`,

    // 方案 B：+36° 斜角合理，但跑者等大均分 + 标题硬压在右上终点正上方（同侧偏重憋角）
    B: `<svg viewBox="0 0 320 200" aria-hidden="true">
      <rect width="320" height="200" fill="#07241B"/>
      <polygon points="0,192 292,0 320,0 320,200 0,200" fill="#04583B"/>
      <line x1="0" y1="192" x2="292" y2="0" stroke="#F9C80E" stroke-width="8"/>
      ${runnerPath(58, 146, 0.86)}
      ${runnerPath(122, 104, 0.86)}
      ${runnerPath(186, 62, 0.86)}
      ${runnerPath(248, 22, 0.86)}
      <rect x="218" y="10" width="90" height="12" fill="#F7F6F1"/>
      <rect x="236" y="28" width="72" height="7" fill="#F9C80E"/>
    </svg>`,

    // 方案 C（正确）：+36° 黄金冲刺 + 近大远小前疏后密 + 左上克制标题作对侧配重 + 右上留出冲线呼吸余白
    C: `<svg viewBox="0 0 320 200" aria-hidden="true">
      <rect width="320" height="200" fill="#07241B"/>
      <polygon points="0,192 292,0 320,0 320,200 0,200" fill="#04583B"/>
      <line x1="0" y1="192" x2="292" y2="0" stroke="#F9C80E" stroke-width="8"/>
      ${runnerPath(58, 146, 1.24)}
      ${runnerPath(136, 95, 0.92)}
      ${runnerPath(196, 56, 0.68)}
      ${runnerPath(238, 29, 0.50)}
      <rect x="24" y="24" width="94" height="12" fill="#F7F6F1"/>
      <rect x="24" y="42" width="66" height="7" fill="#F9C80E"/>
      <rect x="24" y="54" width="52" height="5" fill="#89B8A3"/>
    </svg>`,

    // 方案 D：+74° 过陡趋近垂直 + 底沿左右对称重块锁死动势
    D: `<svg viewBox="0 0 320 200" aria-hidden="true">
      <rect width="320" height="200" fill="#07241B"/>
      <polygon points="116,200 176,0 320,0 320,200" fill="#04583B"/>
      <line x1="116" y1="200" x2="176" y2="0" stroke="#F9C80E" stroke-width="8"/>
      ${runnerPath(126, 166, 1.05)}
      ${runnerPath(142, 118, 0.85)}
      ${runnerPath(156, 74, 0.68)}
      ${runnerPath(168, 36, 0.52)}
      <rect x="16" y="138" width="84" height="46" fill="#2A6B52"/>
      <rect x="220" y="138" width="84" height="46" fill="#2A6B52"/>
    </svg>`,
  };

  const EXPLAINS = {
    A: {
      ok: false,
      title: "方案 A 不成立 · 倾角仅 +6°，掉进伪水平歪斜区",
      body: "尽管跑者有近大远小、左上也有文字配重，但赛道只抬高了 6°，离水平线太近——人眼第一反应是「图放歪了」，而不是「夜跑冲刺」。对角线要越过约 16° 才能甩开水平基准。",
    },
    B: {
      ok: false,
      title: "方案 B 不成立 · 跑者等大均分，且标题压死右上终点",
      body: "36° 角度本身很好，但四个跑者一样大、等距排布，少了加速纵深；更糟的是标题和终点堆在同一侧右上角，左上整片发空，整张海报向右上角憋死翻车。",
    },
    C: {
      ok: true,
      title: "选对了！方案 C 四要素同时成立",
      body: "赛道落在 36° 黄金冲刺带；跑者由左下大而实渐变为右上小而密，拉出鲜明的透视加速度；右上终点前留出冲线呼吸空间；左上角那组克制标题恰好充当对侧配重，让整幅画既冲得出去又稳得住。",
    },
    D: {
      ok: false,
      title: "方案 D 不成立 · 74° 过陡趋近垂直，底块对称又锁死了动势",
      body: "轨道拉到 74° 已滑向垂直立柱域，路径变短、像快倒的陡梯；同时底部左右两个对称大色块把重心死死拽平，彻底抵消了对角线应有的方向冲劲。",
    },
  };

  opts.forEach((btn) => {
    const id = btn.dataset.opt;
    const thumb = document.getElementById(`quiz-svg-${id}`);
    if (thumb) thumb.innerHTML = THUMBS[id];

    btn.addEventListener("click", () => {
      const info = EXPLAINS[id];
      opts.forEach((x) => {
        x.classList.remove("is-selected", "is-correct", "is-wrong");
        x.setAttribute("aria-pressed", String(x === btn));
      });
      btn.classList.add("is-selected", info.ok ? "is-correct" : "is-wrong");
      fb.classList.toggle("is-wrong", !info.ok);
      fb.innerHTML = `
        <div class="qf-head">
          <span class="qf-pill ${info.ok ? "" : "is-bad"}">${info.ok ? "判断准确" : "差了一步"}</span>
          <h3 class="qf-title">${info.title}</h3>
        </div>
        <p class="qf-body">${info.body}</p>
      `;
    });
  });
}

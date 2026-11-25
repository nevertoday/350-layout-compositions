// 067 重叠空间构图 · 正文各节专属互动模块（sections.js）
// 每节独立控件，相邻两节零重复：
//   01 连续分离→切边→叠压→吞没推拉标尺（T 节点与非模态虚线补全）
//   02 四态重叠机制标本台（实叠 / 梅泰利透叠 / 假透明脏块 / 环形互锁）
//   03 深炭黑暗房 4×3 对比×留白二维矩阵直点板
//   04 5 帧历史时间轴抽象空间图解画布
//   05 4 组真实任务双态翻牌（叠层版 ↔ 分离版）
//   06 2 道单变量对比小练习（中性标签 + 选后 X-Ray 透视显影）
import { P } from "./palette.js";
import { pixelRatio } from "../../lib/stage.js";

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(120, Math.round(rect.width));
  const h = Math.max(100, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// =========================================================================
// 01 节：连续推拉分离 → 擦边 → 叠压 → 吞没（T 节点 & 非模态补全可视化）
// =========================================================================
export function initSec01OcclusionLab() {
  const canvas = document.getElementById("s1-canvas");
  const range = document.getElementById("s1-range");
  const valEl = document.getElementById("s1-val");
  const stageEl = document.getElementById("s1-stage");
  const descEl = document.getElementById("s1-desc");
  if (!canvas || !range) return () => {};

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas);
    const v = Number(range.value); // 0 (分离) -> 100 (全吞)
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = P.paperLight;
    ctx.fillRect(0, 0, w, h);

    // 淡灰建筑参考底格
    ctx.strokeStyle = "rgba(11,13,17,0.06)";
    ctx.lineWidth = 1;
    const step = 28;
    for (let x = step; x < w; x += step) {
      ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke();
    }
    for (let y = step; y < h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke();
    }

    const u = Math.min(w * 0.5, h * 0.85);
    const cy = h * 0.52;
    const rBlue = u * 0.27;
    const sqSize = u * 0.50;
    const bkW = u * 0.42, bkH = u * 0.54;

    // 蓝圆从左侧逐步推进至黄方、再推进黑块
    // v = 0: 间距宽；v = 26: 擦边切线；v = 56: 经验叠压；v = 94: 过深吞没
    const spread = (1 - v / 100);
    const cxYellow = w * 0.50;
    const cxBlue = cxYellow - (sqSize * 0.5 + rBlue) - (spread - 0.74) * u * 1.15;
    const cxBlack = cxYellow + (sqSize * 0.5 + bkW * 0.5) + (spread - 0.74) * u * 1.15;

    // 1) 后层黑块
    ctx.fillStyle = P.ink;
    ctx.fillRect(cxBlack - bkW * 0.5, cy - bkH * 0.5, bkW, bkH);

    // 2) 中层镉黄方
    ctx.fillStyle = P.yellow;
    ctx.fillRect(cxYellow - sqSize * 0.5, cy - sqSize * 0.5, sqSize, sqSize);

    // 3) 若正在遮挡黄方，画出黄方被遮掉的「非模态补全虚线」
    const gapBY = (cxYellow - sqSize * 0.5) - (cxBlue + rBlue);
    if (gapBY < -3) {
      ctx.save();
      ctx.strokeStyle = "rgba(138, 92, 0, 0.55)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(cxYellow - sqSize * 0.5, cy - sqSize * 0.5, sqSize, sqSize);
      ctx.restore();
    }

    // 4) 前层钴蓝圆
    ctx.fillStyle = P.cobalt;
    ctx.beginPath();
    ctx.arc(cxBlue, cy, rBlue, 0, Math.PI * 2);
    ctx.fill();

    // 若发生有效重叠，再在蓝圆内描出被截断的黄方左边虚线（卡尼萨非模态补全）
    if (gapBY < -4) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cxBlue, cy, rBlue, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(cxYellow - sqSize * 0.5, cy - sqSize * 0.5, sqSize, sqSize);
      ctx.restore();

      // 精确标注蓝圆轮廓与黄方各边相交的全部 T 形节点！
      const leftX = cxYellow - sqSize * 0.5;
      const rightX = cxYellow + sqSize * 0.5;
      const topY = cy - sqSize * 0.5;
      const botY = cy + sqSize * 0.5;
      const tPts = [];
      const dxL = leftX - cxBlue;
      if (Math.abs(dxL) < rBlue - 2) {
        const dy = Math.sqrt(Math.max(0, rBlue * rBlue - dxL * dxL));
        if (cy - dy >= topY && cy - dy <= botY) tPts.push([leftX, cy - dy]);
        if (cy + dy >= topY && cy + dy <= botY) tPts.push([leftX, cy + dy]);
      }
      if (tPts.length < 2) {
        const dyT = topY - cy;
        if (Math.abs(dyT) < rBlue - 2) {
          const dx = Math.sqrt(Math.max(0, rBlue * rBlue - dyT * dyT));
          for (const px of [cxBlue - dx, cxBlue + dx]) {
            if (px >= leftX && px <= rightX) {
              tPts.push([px, topY]);
              tPts.push([px, botY]);
            }
          }
        }
      }
      for (const [tx, ty] of tPts.slice(0, 2)) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(tx - 9, ty - 9, 18, 18);
        ctx.strokeStyle = P.cobalt;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(tx - 9, ty - 9, 18, 18);
        ctx.fillStyle = P.cobalt;
        ctx.font = `700 11px "IBM Plex Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("T", tx, ty + 0.5);
      }
    } else if (Math.abs(gapBY) <= 6) {
      // 擦边切线警示
      const tx = cxYellow - sqSize * 0.5;
      ctx.strokeStyle = P.bad;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(tx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = P.bad;
      ctx.fillRect(tx - 26, cy - 34, 52, 18);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 10px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("擦边陷阱", tx, cy - 25);
    }

    // 底部状态文字（单真源同步）
    let zone = "分离无叠";
    let tagClass = "is-bad";
    let text = "三块形体各占一隅，零 T 形节点：视觉系统收不到前后线索，只能把它们读成同一平面上的贴纸。";
    if (gapBY > 6) {
      valEl.textContent = `分离净距 +${Math.round(gapBY)}px`;
    } else if (Math.abs(gapBY) <= 6) {
      zone = "擦边切线";
      valEl.textContent = `切边 ${Math.round(gapBY)}px`;
      text = "最容易翻车的「擦边陷阱」：圆边与方边似碰非碰，轮廓归属含糊，交缝处显得紧绷别扭。";
    } else if (v <= 72) {
      const ovPct = Math.min(62, Math.round((Math.abs(gapBY) / (rBlue * 2)) * 100));
      zone = "有效叠压 · T 节点成立";
      tagClass = "is-good";
      valEl.textContent = `咬合深度 ${ovPct}%`;
      text = "蓝圆完整轮廓截断黄方边缘形成 T 形节点，大脑自动补全虚线处被遮的方角（非模态补全），三层纵深瞬间立起。";
    } else {
      zone = "过度吞没";
      valEl.textContent = `过深吞没 >76%`;
      text = "推进太深把中层黄方压得几乎消失，下层失去可辨轮廓，画面从三层空间退化成一团实心色块。";
    }
    stageEl.textContent = zone;
    stageEl.className = `s1-pill ${tagClass}`;
    descEl.textContent = text;
  }

  range.addEventListener("input", draw);
  draw();
  return draw;
}

// =========================================================================
// 02 节：实叠 / 梅泰利透叠（X 节点）/ 假透明脏块 / 环形互锁 标本台
// =========================================================================
const MODES_02 = {
  opaque: {
    title: "实色锐叠 · T 形节点",
    badge: "最干脆的遮挡",
    polar: "前景轮廓 100% 连续 · 阻断后景",
    body: "上层完全不透明，边界利落切断下层线条，产生无可争辩的前后判定。最适合海报主标压图、高对比信息聚焦，缺点是盖住的地方彻底看不见。",
  },
  metelli: {
    title: "梅泰利透叠 · X 形节点",
    badge: "067 原海报招牌中层",
    polar: "X 节点四象限亮度顺序一致 → 玻璃感成立",
    body: "正如 067 原海报中层磨砂蓝片，以及莫霍利-纳吉 1924 年的《A II》：半透明片跨过深黑与明黄时，浅底处仍比深底处更亮，两条边界直穿形成 X 节点，既交代前后又不遮死底图。",
  },
  muddy: {
    title: "假透明脏块 · 极性反转",
    badge: "常见翻车",
    polar: "叠区亮度顺序错乱 → 退化成补丁",
    body: "如果随意给重叠交集填一个不遵循光混规律的暗灰或怪色，X 节点四象限的明度极性被打乱（梅泰利 1974 法则失效），人眼不再觉得它是透明片，而像生硬贴上去的脏补丁。",
  },
  interlock: {
    title: "环形穿插 · 互锁空间",
    badge: "进阶玩法",
    polar: "A 压 B、B 压 C、C 再压 A",
    body: "打破单调的「永远前中后」线性栈：让带状文字或几何环局部压在主体前、另一端绕到主体后。常见于杂志人物封面字穿肩线，能制造强烈的立体缠绕感。",
  },
};

export function initSec02Mechanisms() {
  const canvas = document.getElementById("s2-canvas");
  const btns = [...document.querySelectorAll("[data-s2-mode]")];
  const titleEl = document.getElementById("s2-title");
  const badgeEl = document.getElementById("s2-badge");
  const polarEl = document.getElementById("s2-polar");
  const bodyEl = document.getElementById("s2-body");
  if (!canvas || !btns.length) return () => {};
  let mode = "metelli";

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = P.paper;
    ctx.fillRect(0, 0, w, h);

    // 右半钴蓝壁呼应原海报
    ctx.fillStyle = P.cobalt;
    ctx.fillRect(w * 0.54, 0, w * 0.46, h);

    const u = Math.min(w * 0.68, h * 0.86);
    const cx = w * 0.48, cy = h * 0.52;

    if (mode === "opaque") {
      // 后层黑大圆
      ctx.fillStyle = P.ink;
      ctx.beginPath(); ctx.arc(cx - u * 0.14, cy + u * 0.06, u * 0.30, 0, Math.PI * 2); ctx.fill();
      // 中层黄方（完全不透明）
      ctx.fillStyle = P.yellow;
      ctx.fillRect(cx - u * 0.08, cy - u * 0.24, u * 0.42, u * 0.42);
      // 前层焦圆（深蓝加白边，确保在黄与蓝壁间清晰）
      ctx.fillStyle = P.cobalt;
      ctx.strokeStyle = "#FBF8F3";
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx + u * 0.20, cy - u * 0.16, u * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // 标出 T 节点
      const pts = [[cx - u * 0.08, cy - u * 0.18], [cx - u * 0.08, cy + u * 0.18]];
      for (const [px, py] of pts) {
        ctx.fillStyle = "#FBF8F3"; ctx.fillRect(px - 9, py - 9, 18, 18);
        ctx.strokeStyle = P.cobalt; ctx.lineWidth = 1.6; ctx.strokeRect(px - 9, py - 9, 18, 18);
        ctx.fillStyle = P.cobalt; ctx.font = `700 11px "IBM Plex Mono", monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("T", px, py + 0.5);
      }
    } else if (mode === "metelli") {
      // 底层：黑圆 + 黄半圆（复刻 067 原海报局部）
      ctx.fillStyle = P.ink;
      ctx.beginPath(); ctx.arc(cx - u * 0.15, cy - u * 0.02, u * 0.31, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.yellow;
      ctx.beginPath(); ctx.arc(cx + u * 0.02, cy + u * 0.16, u * 0.32, 0, Math.PI, false); ctx.closePath(); ctx.fill();

      // 正确透叠玻片（统一 alpha 光混，保持亮度顺序：白底 > 黄底 > 钴蓝 > 黑底）
      const rx = cx - u * 0.06, ry = cy - u * 0.24, rw = u * 0.44, rh = u * 0.50;
      ctx.fillStyle = "rgba(170, 188, 226, 0.56)";
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = "rgba(251, 248, 243, 0.88)";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(rx, ry, rw, rh);

      // X 节点标注
      const xPts = [[rx, cy + u * 0.16], [rx + rw, cy + u * 0.16], [cx + u * 0.06, ry]];
      for (const [px, py] of xPts) {
        ctx.fillStyle = P.ink; ctx.fillRect(px - 9, py - 9, 18, 18);
        ctx.strokeStyle = P.yellowDark; ctx.lineWidth = 1.6; ctx.strokeRect(px - 9, py - 9, 18, 18);
        ctx.fillStyle = P.yellowDark; ctx.font = `700 11px "IBM Plex Mono", monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("X", px, py + 0.5);
      }
    } else if (mode === "muddy") {
      // 底层同上，但交集强行反向涂色（破坏梅泰利亮度单调性）
      ctx.fillStyle = P.ink;
      ctx.beginPath(); ctx.arc(cx - u * 0.15, cy - u * 0.02, u * 0.31, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.yellow;
      ctx.beginPath(); ctx.arc(cx + u * 0.02, cy + u * 0.16, u * 0.32, 0, Math.PI, false); ctx.closePath(); ctx.fill();

      const rx = cx - u * 0.06, ry = cy - u * 0.24, rw = u * 0.44, rh = u * 0.50;
      // 错色块：在深黑上涂太亮、在亮黄上涂发脏褐灰，彻底摧毁透明知觉
      ctx.fillStyle = "#8C857A";
      ctx.fillRect(rx, ry, rw, rh);
      ctx.save();
      ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
      ctx.fillStyle = "#D4CEC2"; // 黑圆交区反变亮白
      ctx.beginPath(); ctx.arc(cx - u * 0.15, cy - u * 0.02, u * 0.31, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#4D463B"; // 亮黄交区反变焦泥
      ctx.beginPath(); ctx.arc(cx + u * 0.02, cy + u * 0.16, u * 0.32, 0, Math.PI, false); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = P.bad; ctx.lineWidth = 2; ctx.strokeRect(rx, ry, rw, rh);

      ctx.fillStyle = P.bad;
      ctx.fillRect(rx + 8, ry + 8, 92, 20);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 10px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText("极性反转 · 发脏", rx + 15, ry + 18.5);
    } else {
      // 环形互锁：蓝环与黄方上下交替穿插
      const R = u * 0.28, thick = u * 0.11;
      const sx = cx - u * 0.02, sy = cy - u * 0.24, sw = u * 0.34, sh = u * 0.48;
      // 先画环下半
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = thick;
      ctx.beginPath(); ctx.arc(cx - u * 0.10, cy, R, 0, Math.PI * 2); ctx.stroke();
      // 画黄方
      ctx.fillStyle = P.yellow;
      ctx.fillRect(sx, sy, sw, sh);
      // 仅把圆环上半截盖在黄方之上 → 上压下穿形成互锁！
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - u * 0.5, cy - u * 0.5, u, u * 0.5);
      ctx.clip();
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = thick;
      ctx.beginPath(); ctx.arc(cx - u * 0.10, cy, R, Math.PI * 1.1, Math.PI * 2.1); ctx.stroke();
      ctx.restore();

      // 标注「上压」「下穿」
      const badge = (bx, by, txt, bg) => {
        ctx.fillStyle = bg; ctx.fillRect(bx - 22, by - 10, 44, 20);
        ctx.fillStyle = "#FFFFFF"; ctx.font = `700 10px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, bx, by + 0.5);
      };
      badge(sx + 2, cy - R + 16, "环压方", P.cobalt);
      badge(sx + 2, cy + R - 16, "方压环", P.ink);
    }

    const info = MODES_02[mode];
    titleEl.textContent = info.title;
    badgeEl.textContent = info.badge;
    badgeEl.className = `s2-badge ${mode === "muddy" ? "is-bad" : "is-good"}`;
    polarEl.textContent = info.polar;
    bodyEl.textContent = info.body;
  }

  for (const b of btns) {
    b.addEventListener("click", () => {
      mode = b.dataset.s2Mode;
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
  }
  draw();
  return draw;
}

// =========================================================================
// 03 节：深炭黑暗房 · 4×3 二维矩阵（三层对比阶梯 × 形体留白密度）
// =========================================================================
const MATRIX_INFO = {
  "flat-sparse":     { ok: false, tag: "双弱失效", msg: "形体散得太小、三层明暗又糊在一起，空间层次与存在感双双归零。" },
  "flat-balanced":   { ok: false, tag: "留白好但糊平", msg: "留白和叠压位置对了，但前中后明度相近，视线进来找不到落脚点。" },
  "flat-crowded":    { ok: false, tag: "灰闷堵死", msg: "最差组合：又挤满又没反差，整个画幅糊成一块沉闷暗板。" },
  "ladder-sparse":   { ok: false, tag: "空散偏薄", msg: "对比很亮眼，但形体缩成画心小团，四周空得撑不起空间体量。" },
  "ladder-balanced": { ok: true,  tag: "经验甜区 · 推荐", msg: "前强中柔后稳的对比阶梯，配上约 35%–50% 呼吸留白，三层纵深一眼通透。" },
  "ladder-crowded":  { ok: false, tag: "过满窒息", msg: "对比虽足，但色块塞满边角（留白 < 18%），每条边缘都在顶撞画框。" },
  "reverse-sparse":  { ok: false, tag: "底抢且空", msg: "后层反抢亮色又孤悬一角，主角小圆几乎被边缘吞没。" },
  "reverse-balanced":{ ok: false, tag: "主次倒挂", msg: "留白位置尚可，但背景大块比前景焦圆更刺眼，眼睛先被拖回底壁。" },
  "reverse-crowded": { ok: false, tag: "反抢且爆仓", msg: "高饱和背景撑爆画幅，前景焦点彻底迷失在色块丛林里。" },
};

export function initSec03Matrix() {
  const canvas = document.getElementById("s3-canvas");
  const cells = [...document.querySelectorAll("[data-m-cell]")];
  const tagEl = document.getElementById("s3-tag");
  const msgEl = document.getElementById("s3-msg");
  const statEl = document.getElementById("s3-stat");
  if (!canvas || !cells.length) return () => {};
  let contrast = "ladder";
  let density = "balanced";

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#141923";
    ctx.fillRect(0, 0, w, h);

    // 内框模拟暖米海报画幅
    const pad = 16;
    const fw = w - pad * 2, fh = h - pad * 2;
    ctx.fillStyle = P.paper;
    ctx.fillRect(pad, pad, fw, fh);
    ctx.fillStyle = P.cobalt;
    ctx.fillRect(pad + fw * 0.56, pad, fw * 0.44, fh);

    const sc = density === "sparse" ? 0.56 : density === "balanced" ? 0.94 : 1.32;
    const u = Math.min(fw, fh) * sc;
    const cx = pad + fw * 0.5, cy = pad + fh * 0.52;

    const cBack = contrast === "flat" ? "#5F6470" : contrast === "reverse" ? "#F7C432" : P.ink;
    const cMid  = contrast === "flat" ? "rgba(120,126,138,0.72)" : contrast === "reverse" ? "rgba(225,45,57,0.75)" : "rgba(155,174,218,0.6)";
    const cFront= contrast === "flat" ? "#687285" : contrast === "reverse" ? "#8D96A6" : P.cobalt;
    const cYel  = contrast === "flat" ? "#7C796F" : contrast === "reverse" ? "#0533B0" : P.yellow;

    ctx.save();
    ctx.beginPath(); ctx.rect(pad, pad, fw, fh); ctx.clip();

    // 后层大黑圆 + 黄底
    ctx.fillStyle = cBack;
    ctx.beginPath(); ctx.arc(cx - u * 0.14, cy + u * 0.05, u * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = cYel;
    ctx.fillRect(cx + u * 0.02, cy - u * 0.30, u * 0.34, u * 0.30);

    // 中层透叠方
    ctx.fillStyle = cMid;
    ctx.fillRect(cx - u * 0.06, cy - u * 0.14, u * 0.36, u * 0.34);
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 1.3;
    ctx.strokeRect(cx - u * 0.06, cy - u * 0.14, u * 0.36, u * 0.34);

    // 前层焦点蓝圆
    ctx.fillStyle = cFront;
    ctx.strokeStyle = "#FBF8F3";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx + u * 0.02, cy - u * 0.16, u * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.restore();

    const key = `${contrast}-${density}`;
    const info = MATRIX_INFO[key];
    tagEl.textContent = info.tag;
    tagEl.className = `s3-tag ${info.ok ? "is-good" : "is-bad"}`;
    msgEl.textContent = info.msg;
    const wsNum = density === "sparse" ? "74%" : density === "balanced" ? "41%" : "14%";
    const crNum = contrast === "flat" ? "1.3:1" : contrast === "ladder" ? "6.4:1" : "主弱底抢";
    statEl.textContent = `估测留白 ${wsNum} · 前后对比 ${crNum}`;
  }

  for (const cell of cells) {
    cell.addEventListener("click", () => {
      contrast = cell.dataset.contrast;
      density = cell.dataset.density;
      cells.forEach((c) => c.setAttribute("aria-pressed", String(c === cell)));
      draw();
    });
  }
  draw();
  return draw;
}

// =========================================================================
// 04 节：5 帧历史时间轴 + 抽象几何空间结构图解画布
// =========================================================================
const HISTORY_04 = [
  {
    id: "chauvet",
    year: "约 3.6 万年前",
    who: "法国肖维岩洞《群马图》",
    en: "Chauvet Cave · Panel of the Horses",
    note: "比文艺复兴线性透视早了三万多年：旧石器时代画师已经用一匹马的头颈轮廓压住另一匹马，仅靠轮廓遮挡就在岩壁上建立了成群奔马的前后纵深。",
  },
  {
    id: "helmholtz",
    year: "1867",
    who: "赫尔曼·冯·亥姆霍兹《生理光学手册》",
    en: "Helmholtz · Handbuch der physiologischen Optik Vol. III",
    note: "在第三卷视觉知觉篇中，亥姆霍兹把「遮挡（interposition）」正式纳入单眼深度线索体系，指出连续轮廓压断另一条轮廓会触发大脑的无意识推论。",
  },
  {
    id: "cubism",
    year: "1912",
    who: "毕加索与布拉克 · 立体派拼贴纸片",
    en: "Picasso & Braque · Papier Collé (1912)",
    note: "毕加索《有藤椅的静物》（1912 年 5 月）与布拉克《果盘与玻璃杯》（1912 年 9 月）抛弃传统深远单点透视，改用浅层叠压的纸片与平面重构现代空间。",
  },
  {
    id: "bauhaus",
    year: "1920–1924",
    who: "利西茨基《Proun 19D》与莫霍利-纳吉《A II》",
    en: "El Lissitzky (MoMA) & Moholy-Nagy (Guggenheim)",
    note: "利西茨基把重叠几何平面称作「绘画到建筑的中转站」，莫霍利-纳吉 1924 年在魏玛包豪斯绘出《A II》，用色块与半透明几何交叠模拟光影空间——这正是 067 原海报的直接血脉。",
  },
  {
    id: "vision",
    year: "1949–1979",
    who: "拉图什、梅泰利与卡尼萨 · 节点算法破译",
    en: "Ratoosh (1949) · Metelli (1974) · Kanizsa (1979)",
    note: "拉图什（1949, PNAS）证明无需熟悉物体，单凭轮廓交点就能判断前后；梅泰利（1974）推导出透明叠层的 X 节点明度规律；卡尼萨（1979）则用非模态补全解释了人脑如何补全被遮的部分。",
  },
];

export function initSec04History() {
  const canvas = document.getElementById("s4-canvas");
  const tabs = [...document.querySelectorAll("[data-h-step]")];
  const yearEl = document.getElementById("s4-year");
  const whoEl = document.getElementById("s4-who");
  const enEl = document.getElementById("s4-en");
  const noteEl = document.getElementById("s4-note");
  if (!canvas || !tabs.length) return () => {};
  let idx = 3; // 默认停在 1920–1924 包豪斯血脉（与原海报呼应），点按自由切 5 帧

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const step = HISTORY_04[idx];
    const u = Math.min(w, h);

    if (step.id === "chauvet") {
      // 抽象叠层剪影（严格无五官，纯几何马颈弧线叠压示意）
      ctx.fillStyle = "#EFE7DA";
      ctx.fillRect(0, 0, w, h);
      const colors = ["#9C8E7A", "#6B5E4E", "#3B3229", "#15120F"];
      for (let i = 0; i < 4; i++) {
        const bx = w * (0.24 + i * 0.14);
        const by = h * (0.64 - i * 0.04);
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.ellipse(bx, by, u * 0.18, u * 0.25, -0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#EFE7DA";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    } else if (step.id === "helmholtz") {
      // 光学视锥 + 前片遮挡后片投射示意
      ctx.fillStyle = P.paperLight;
      ctx.fillRect(0, 0, w, h);
      const eyeX = w * 0.14, eyeY = h * 0.5;
      // 视线射线
      ctx.strokeStyle = "rgba(5, 51, 176, 0.28)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      for (const ty of [h * 0.22, h * 0.38, h * 0.62, h * 0.78]) {
        ctx.beginPath(); ctx.moveTo(eyeX, eyeY); ctx.lineTo(w * 0.86, ty); ctx.stroke();
      }
      ctx.setLineDash([]);
      // 眼位圆点
      ctx.fillStyle = P.cobalt;
      ctx.beginPath(); ctx.arc(eyeX, eyeY, 9, 0, Math.PI * 2); ctx.fill();
      // 近处挡板（钴蓝）
      ctx.fillStyle = P.cobalt;
      ctx.fillRect(w * 0.44, h * 0.34, 14, h * 0.32);
      // 远处被挡面板（黑 + 虚线盲区）
      ctx.fillStyle = P.ink;
      ctx.fillRect(w * 0.74, h * 0.20, 16, h * 0.60);
      ctx.fillStyle = "rgba(245, 185, 21, 0.45)";
      ctx.fillRect(w * 0.74, h * 0.31, 16, h * 0.38);
    } else if (step.id === "cubism") {
      // 浅层纸片交错叠压（立体派平面重构）
      ctx.fillStyle = "#EAE2D3";
      ctx.fillRect(0, 0, w, h);
      const planes = [
        { x: 0.20, y: 0.18, pw: 0.38, ph: 0.58, ang: -0.07, fill: "#C9B99B" },
        { x: 0.36, y: 0.26, pw: 0.36, ph: 0.52, ang: 0.05, fill: "#32353C" },
        { x: 0.46, y: 0.16, pw: 0.30, ph: 0.48, ang: -0.03, fill: "#E6CFA2" },
        { x: 0.28, y: 0.42, pw: 0.32, ph: 0.34, ang: 0.08, fill: P.cobalt },
      ];
      for (const pl of planes) {
        ctx.save();
        ctx.translate(w * (pl.x + pl.pw * 0.5), h * (pl.y + pl.ph * 0.5));
        ctx.rotate(pl.ang);
        ctx.fillStyle = pl.fill;
        ctx.fillRect(-w * pl.pw * 0.5, -h * pl.ph * 0.5, w * pl.pw, h * pl.ph);
        ctx.strokeStyle = "#1B1D22";
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-w * pl.pw * 0.5, -h * pl.ph * 0.5, w * pl.pw, h * pl.ph);
        ctx.restore();
      }
    } else if (step.id === "bauhaus") {
      // 致敬莫霍利-纳吉《A II》(1924) 与利西茨基《Proun》的光影半透明几何构图
      ctx.fillStyle = P.paper;
      ctx.fillRect(0, 0, w, h);
      // 倾斜黑柱
      ctx.save();
      ctx.translate(w * 0.48, h * 0.50);
      ctx.rotate(-0.24);
      ctx.fillStyle = P.ink;
      ctx.fillRect(-u * 0.42, -u * 0.07, u * 0.84, u * 0.14);
      // 透明黄片
      ctx.fillStyle = "rgba(245, 185, 21, 0.72)";
      ctx.fillRect(-u * 0.16, -u * 0.32, u * 0.26, u * 0.62);
      // 透明钴蓝片
      ctx.fillStyle = "rgba(5, 51, 176, 0.68)";
      ctx.fillRect(-u * 0.04, -u * 0.18, u * 0.38, u * 0.30);
      ctx.restore();
      // 前层红黑圆点（极简构成）
      ctx.fillStyle = P.cobalt;
      ctx.beginPath(); ctx.arc(w * 0.30, h * 0.32, u * 0.12, 0, Math.PI * 2); ctx.fill();
    } else {
      // T 节点 + X 节点数学算子图
      ctx.fillStyle = P.darkRoom;
      ctx.fillRect(0, 0, w, h);
      const mid = w * 0.5;
      // 左：T-Junction
      ctx.fillStyle = P.yellowDark;
      ctx.fillRect(w * 0.12, h * 0.34, w * 0.24, h * 0.36);
      ctx.fillStyle = P.cobaltBright;
      ctx.beginPath(); ctx.arc(w * 0.30, h * 0.46, u * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 13px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillText("T-JUNCTION", w * 0.26, h * 0.86);

      // 中分割线
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath(); ctx.moveTo(mid, 18); ctx.lineTo(mid, h - 18); ctx.stroke();

      // 右：X-Junction
      ctx.fillStyle = P.yellowDark;
      ctx.fillRect(w * 0.58, h * 0.30, w * 0.22, h * 0.38);
      ctx.fillStyle = "rgba(127, 176, 255, 0.56)";
      ctx.fillRect(w * 0.68, h * 0.40, w * 0.22, h * 0.34);
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w * 0.68, h * 0.40, w * 0.22, h * 0.34);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("X-JUNCTION", w * 0.74, h * 0.86);
    }

    yearEl.textContent = step.year;
    whoEl.textContent = step.who;
    enEl.textContent = step.en;
    noteEl.textContent = step.note;
  }

  tabs.forEach((btn, i) => {
    btn.addEventListener("click", () => {
      idx = i;
      tabs.forEach((x, j) => x.setAttribute("aria-pressed", String(j === idx)));
      draw();
    });
  });
  draw();
  return draw;
}

// =========================================================================
// 05 节：四场景「叠层版 ↔ 分离版」独立翻牌开关
// =========================================================================
export function initSec05Scenarios() {
  const cards = [...document.querySelectorAll("[data-sc-card]")];
  cards.forEach((card) => {
    const btns = [...card.querySelectorAll("[data-sc-mode]")];
    const verdict = card.querySelector("[data-sc-verdict]");
    const goodOverlap = card.dataset.prefer === "overlap";
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const m = btn.dataset.scMode;
        card.dataset.mode = m;
        btns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        const isOverlap = m === "overlap";
        const right = isOverlap === goodOverlap;
        verdict.textContent = isOverlap ? card.dataset.textOverlap : card.dataset.textFlat;
        verdict.className = `sc-verdict ${right ? "is-good" : "is-bad"}`;
      });
    });
  });
}

// =========================================================================
// 06 节：两道单变量小练习（中性标签 + 选后 X-Ray 叠线显影）
// =========================================================================
const QUIZ_1 = {
  A: {
    ok: false,
    title: "再看看：A 是零重叠分离态",
    body: "四个几何体彼此保持净距，没有任何轮廓截断（T 节点 = 0）。整张版面退化成贴纸陈列，看不出谁在前、谁在后。",
  },
  B: {
    ok: false,
    title: "再看看：B 踩中了「擦边切线陷阱」",
    body: "焦蓝圆边缘恰好与黄方边缘贴着 2px 似碰非碰，大脑无法判定边界归属，交界处紧绷别扭，空间在接缝处塌陷。",
  },
  C: {
    ok: false,
    title: "再看看：C 是大形反压小形",
    body: "巨大的炭黑背景圆被错误提到前层，盖掉了将近一半的焦蓝圆，违背「大形在后、小形在前」的基本纵深次序。",
  },
  D: {
    ok: true,
    title: "选对了：D 的三层重叠关系最清楚",
    body: "大黑圆与黄块沉在后层，磨砂中层玻片用 X 形节点连通前后，小而高对比的钴蓝焦圆完整领前并咬合出清晰 T 节点，四周还保留了透气留白。",
  },
};

const QUIZ_2 = {
  A: {
    ok: false,
    title: "A 很适合重叠空间构图",
    body: "音乐节主视觉追求氛围与视觉张力，大字与几何/主视觉相互叠压能迅速建立记忆点和立体冲击。",
  },
  B: {
    ok: true,
    title: "选对了：B 绝不该用重叠构图",
    body: "航空应急出口牌属于零容错导视，任何图形遮挡箭头或字母都会增加识别延迟；此时必须彻底分离、极高对比、一眼读清。",
  },
  C: {
    ok: false,
    title: "C 是重叠构图的经典用法",
    body: "杂志封面大标局部压在人物肩后或帽檐后（形成局部遮挡），能让人物立刻跳出纸面，是出版界最常用的空间手法。",
  },
  D: {
    ok: false,
    title: "D 很适合重叠空间构图",
    body: "专辑卡片堆叠轮播正是利用左右遮挡与大小对比，让用户无需文字说明就懂「中间在前、两侧可滑」。",
  },
};

export function initSec06Practice() {
  const q1Wrap = document.getElementById("quiz-1");
  const q1Title = document.getElementById("q1-title");
  const q1Body = document.getElementById("q1-body");
  const q1Btns = q1Wrap ? [...q1Wrap.querySelectorAll("[data-q1]")] : [];

  q1Btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.q1;
      const res = QUIZ_1[pick];
      q1Wrap.dataset.answered = "true";
      q1Btns.forEach((b) => {
        const k = b.dataset.q1;
        b.setAttribute("aria-pressed", String(b === btn));
        b.classList.toggle("is-correct", k === "D");
        b.classList.toggle("is-picked-wrong", b === btn && !res.ok);
      });
      q1Title.textContent = res.title;
      q1Title.className = `q-verdict-title ${res.ok ? "is-good" : "is-bad"}`;
      q1Body.textContent = res.body;
    });
  });

  const q2Wrap = document.getElementById("quiz-2");
  const q2Title = document.getElementById("q2-title");
  const q2Body = document.getElementById("q2-body");
  const q2Btns = q2Wrap ? [...q2Wrap.querySelectorAll("[data-q2]")] : [];

  q2Btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.q2;
      const res = QUIZ_2[pick];
      q2Btns.forEach((b) => {
        const k = b.dataset.q2;
        b.setAttribute("aria-pressed", String(b === btn));
        b.classList.toggle("is-correct", k === "B");
        b.classList.toggle("is-picked-wrong", b === btn && !res.ok);
      });
      q2Title.textContent = res.title;
      q2Title.className = `q-verdict-title ${res.ok ? "is-good" : "is-bad"}`;
      q2Body.textContent = res.body;
    });
  });
}

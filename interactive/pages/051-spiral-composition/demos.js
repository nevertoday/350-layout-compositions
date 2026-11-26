// 051 螺旋构图 · 正文 01–06 节独立互动模块
// 相邻节使用截然不同的交互结构与视觉表达，且全部零 shadowBlur、零外部依赖。

import { pixelRatio } from "../../lib/stage.js";
import { PHI, clamp } from "./model.js";

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(240, Math.round(rect.width || canvas.clientWidth || 520));
  const h = Math.max(160, Math.round(rect.height || canvas.clientHeight || 280));
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
// 01 节：曲率折角破环实验（Field, Hayes & Hess 1993 关联场演示）
// =========================================================================
export function mountContourDemo(root) {
  const canvas = root.querySelector("#s01-canvas");
  const jitterInput = root.querySelector("#s01-jitter");
  const noiseInput = root.querySelector("#s01-noise");
  const jitterVal = root.querySelector("#s01-jitter-val");
  const noiseVal = root.querySelector("#s01-noise-val");
  const readout = root.querySelector("#s01-readout");
  const revealBtn = root.querySelector("#s01-reveal");

  let showGuide = false;

  // 预生成确定性背景噪点小段，避免拉滑块时背景乱跳
  const bgSeeds = [];
  let seed = 199302;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 160; i++) {
    bgSeeds.push({
      u: 0.05 + rnd() * 0.9,
      v: 0.08 + rnd() * 0.84,
      ang: rnd() * Math.PI,
      sign: rnd() > 0.5 ? 1 : -1,
    });
  }

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    const jitterDeg = Number(jitterInput.value);
    const noiseCount = Number(noiseInput.value);

    jitterVal.textContent = `${jitterDeg}°`;
    noiseVal.textContent = `${noiseCount} 条`;

    ctx.fillStyle = "#FDF6E9";
    ctx.fillRect(0, 0, w, h);

    // 淡底坐标格
    ctx.strokeStyle = "rgba(10, 25, 50, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 32; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 32; y < h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const cx = w * 0.54;
    const cy = h * 0.52;
    const maxR = Math.min(w, h) * 0.44;
    const minR = Math.min(w, h) * 0.09;
    const segLen = Math.max(9, Math.min(w, h) * 0.048);

    // 1. 背景随机朝向干扰段
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    for (let i = 0; i < noiseCount; i++) {
      const b = bgSeeds[i];
      const bx = b.u * w;
      const by = b.v * h;
      const dx = Math.cos(b.ang) * segLen * 0.5;
      const dy = Math.sin(b.ang) * segLen * 0.5;
      ctx.strokeStyle = "rgba(10, 25, 50, 0.36)";
      ctx.beginPath();
      ctx.moveTo(bx - dx, by - dy);
      ctx.lineTo(bx + dx, by + dy);
      ctx.stroke();
    }

    // 2. 螺旋轮廓上的 24 个对齐线段
    const pathPts = [];
    const N = 24;
    const thetaTotal = 1.65 * Math.PI * 2;
    const bRate = Math.log(1.58) / (Math.PI / 2);
    const den = Math.exp(bRate * thetaTotal) - 1;
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1);
      const u = 1 - s;
      const frac = (Math.exp(bRate * thetaTotal * u) - 1) / den;
      const r = minR + (maxR - minR) * frac;
      const ang = 0.25 * Math.PI + s * thetaTotal;
      pathPts.push({ x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r });
    }

    if (showGuide) {
      ctx.save();
      ctx.strokeStyle = "rgba(230, 98, 64, 0.45)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      pathPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < pathPts.length; i++) {
      const p0 = pathPts[Math.max(0, i - 1)];
      const p1 = pathPts[Math.min(pathPts.length - 1, i + 1)];
      const tangent = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      const sign = i % 2 === 0 ? 1 : -1;
      const a = tangent + (sign * jitterDeg * Math.PI) / 180;
      const dx = Math.cos(a) * segLen * 0.55;
      const dy = Math.sin(a) * segLen * 0.55;
      ctx.strokeStyle = i >= N - 3 ? "#E66240" : "#0A1932";
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(pathPts[i].x - dx, pathPts[i].y - dy);
      ctx.lineTo(pathPts[i].x + dx, pathPts[i].y + dy);
      ctx.stroke();
    }

    // 中心焦核点
    ctx.beginPath();
    ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = "#E66240";
    ctx.fill();

    // 读数解释为什么
    if (jitterDeg <= 12) {
      readout.textContent = `朝向偏差仅 ${jitterDeg}°：即使藏在 ${noiseCount} 条杂乱短线里，视觉皮层的局部关联场仍会自动把顺切线排布的短段「串」成一条直通红核的螺旋路径。`;
    } else if (jitterDeg <= 32) {
      readout.textContent = `朝向偏差增至 ${jitterDeg}°：相邻短段开始偏离切线方向，螺旋路径变得时断时续，眼睛必须放慢速度刻意寻找下一段。`;
    } else {
      readout.textContent = `朝向偏差达 ${jitterDeg}°：超出平滑曲率容限，格式塔良好连续性彻底解体——螺旋淹没在 ${noiseCount} 条背景噪点里，只剩一盘散沙。`;
    }
  }

  jitterInput.addEventListener("input", draw);
  noiseInput.addEventListener("input", draw);
  revealBtn.addEventListener("click", () => {
    showGuide = !showGuide;
    revealBtn.textContent = showGuide ? "隐藏底层螺线" : "透视底层螺线";
    revealBtn.setAttribute("aria-pressed", String(showGuide));
    draw();
  });
  new ResizeObserver(draw).observe(canvas);
  draw();
}

// =========================================================================
// 02 节：阿基米德 vs 对数螺线 · 双轨径向切片对照仪 + 自相似缩放验真
// =========================================================================
export function mountMathCompareDemo(root) {
  const canvas = root.querySelector("#s02-canvas");
  const angleInput = root.querySelector("#s02-angle");
  const angleVal = root.querySelector("#s02-angle-val");
  const zoomBtn = root.querySelector("#s02-zoom");
  const readout = root.querySelector("#s02-readout");

  let zoomLevel = 1; // 1 → 1.618 → 2.618 演示对数螺线放大后旋转重合的自相似性
  const ZOOM_STEPS = [1, PHI, PHI * PHI];
  let zoomIdx = 0;

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    const sliceDeg = Number(angleInput.value);
    const sliceRad = (sliceDeg * Math.PI) / 180;
    angleVal.textContent = `${sliceDeg}°`;

    ctx.fillStyle = "#FFFBF2";
    ctx.fillRect(0, 0, w, h);

    const halfW = w / 2;
    const midY = h * 0.45;
    const maxR = Math.min(halfW * 0.41, h * 0.36);

    // 中线分隔
    ctx.strokeStyle = "rgba(10, 25, 50, 0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(halfW, 14);
    ctx.lineTo(halfW, h - 14);
    ctx.stroke();

    const drawSide = (cx, isLog, title, eq) => {
      // 标题
      ctx.fillStyle = "#0A1932";
      ctx.font = '700 13px "Noto Sans SC", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(title, cx - halfW * 0.45, 24);
      ctx.fillStyle = "#5D5A54";
      ctx.font = '500 11px "IBM Plex Mono", sans-serif';
      ctx.fillText(eq, cx - halfW * 0.45, 41);

      // 螺线路径（带自相似缩放效果）
      const turns = 3.2;
      const totalTheta = turns * Math.PI * 2;
      const bLog = Math.log(1.48) / (Math.PI / 2);
      const r0Log = maxR / Math.exp(bLog * totalTheta);
      const bArch = maxR / totalTheta;

      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - halfW * 0.47, 48, halfW * 0.94, h * 0.62);
      ctx.clip();

      ctx.beginPath();
      const steps = 240;
      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * totalTheta;
        const r = (isLog ? r0Log * Math.exp(bLog * theta) : bArch * theta) * zoomLevel;
        const x = cx + Math.cos(theta) * r;
        const y = midY + Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = isLog ? "#E66240" : "#0A1932";
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // 径向标尺射线与交点
      const rx = cx + Math.cos(sliceRad) * (maxR * 1.12);
      const ry = midY + Math.sin(sliceRad) * (maxR * 1.12);
      ctx.strokeStyle = "rgba(10, 25, 50, 0.48)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, midY);
      ctx.lineTo(rx, ry);
      ctx.stroke();
      ctx.setLineDash([]);

      const hits = [];
      for (let k = 0; k < 4; k++) {
        const theta = sliceRad + k * Math.PI * 2;
        if (theta > totalTheta) break;
        const r = (isLog ? r0Log * Math.exp(bLog * theta) : bArch * theta) * zoomLevel;
        if (r > 3 && r <= maxR * 1.08) {
          hits.push(r);
          ctx.beginPath();
          ctx.arc(cx + Math.cos(sliceRad) * r, midY + Math.sin(sliceRad) * r, 4, 0, Math.PI * 2);
          ctx.fillStyle = isLog ? "#0A1932" : "#E66240";
          ctx.fill();
        }
      }
      ctx.restore();

      // 底部切片间距条形图（直观展示 1:1:1 vs 几何级数增长！）
      const gaps = [];
      for (let i = 1; i < hits.length; i++) gaps.push(hits[i] - hits[i - 1]);
      const barY = h - 42;
      const barX0 = cx - halfW * 0.43;
      const barMaxW = halfW * 0.86;
      const sumGaps = gaps.reduce((a, b) => a + b, 0) || 1;
      let cursor = barX0;

      ctx.font = '500 10.5px "IBM Plex Mono", sans-serif';
      ctx.fillStyle = "#5D5A54";
      ctx.textAlign = "left";
      ctx.fillText(isLog ? "相邻圈距（几何递增）" : "相邻圈距（恒定不变）", barX0, barY - 8);

      gaps.forEach((gVal, idx) => {
        const segW = Math.max(10, (gVal / sumGaps) * barMaxW - 4);
        ctx.fillStyle = isLog
          ? idx === gaps.length - 1
            ? "#E66240"
            : idx === 0
              ? "#F5AD92"
              : "#EB694B"
          : idx % 2 === 0
            ? "#0A1932"
            : "#394657";
        ctx.fillRect(cursor, barY, segW, 14);
        const ratio = gaps[0] > 0.5 ? (gVal / gaps[0]).toFixed(1) : "1.0";
        if (segW > 26) {
          ctx.fillStyle = "#FFFBF2";
          ctx.textAlign = "center";
          ctx.fillText(`${ratio}×`, cursor + segW / 2, barY + 10.5);
        }
        cursor += segW + 4;
      });
      return gaps;
    };

    const archGaps = drawSide(halfW * 0.5, false, "阿基米德螺线（等距）", "r = a + bθ");
    const logGaps = drawSide(halfW * 1.5, true, "对数螺线（等角递缩）", "r = a · e^(bθ)");

    const logRatio =
      logGaps.length >= 2 && logGaps[0] > 0.5 ? (logGaps[logGaps.length - 1] / logGaps[0]).toFixed(1) : "4.8";
    const archRatio =
      archGaps.length >= 2 && archGaps[0] > 0.5 ? (archGaps[archGaps.length - 1] / archGaps[0]).toFixed(1) : "1.0";

    if (zoomIdx > 0) {
      readout.textContent = `当前已放大 ${zoomLevel.toFixed(2)}×：右侧对数螺线放大后只需旋转角度便与原形完全重合（伯努利称它「虽经改变，复归如初」）；左侧阿基米德螺线放大后每圈间距直接被拉宽，无法保持原貌。`;
    } else {
      readout.textContent = `在 ${sliceDeg}° 方向切开两盘螺旋：左侧阿基米德螺线最外圈与最内圈间距之比约 ${archRatio}×（像卷尺和蚊香，节奏平直）；右侧对数螺线外内圈距之比达 ${logRatio}×，视线由宽阔外缘急速收束进核心。`;
    }
  }

  angleInput.addEventListener("input", draw);
  zoomBtn.addEventListener("click", () => {
    zoomIdx = (zoomIdx + 1) % ZOOM_STEPS.length;
    zoomLevel = ZOOM_STEPS[zoomIdx];
    zoomBtn.textContent = zoomIdx === 0 ? "放大验真自相似（1.0×）" : `放大验真自相似（${zoomLevel.toFixed(2)}×）`;
    draw();
  });
  new ResizeObserver(draw).observe(canvas);
  draw();
}

// =========================================================================
// 03 节：跨越两千年的螺旋史（深海军蓝暗室标本画桌）
// =========================================================================
const HISTORY_ITEMS = [
  {
    id: "archimedes",
    year: "约公元前 225 年",
    who: "阿基米德（Archimedes）",
    work: "《论螺线》（On Spirals）",
    note: "在叙拉古系统写下等距螺线 r = aθ 的切线与面积性质：一条绕定点匀速旋转的射线上，动点匀速外移即成此线，奠定了螺旋的几何语言。",
    latin: "De Lineis Spiralibus · r = aθ",
  },
  {
    id: "durer",
    year: "1525 年",
    who: "阿尔布雷希特·丢勒（Albrecht Dürer）",
    work: "《量度指南》（Underweysung der Messung）",
    note: "纽伦堡首版德语数学绘图手册第一卷，专教画师、金匠与石匠如何仅用圆规和直尺接续圆弧绘制「蜗牛线」（Schneckenlinien），用于主教牧杖卷涡与建筑柱头。",
    latin: "Schneckenlinien · Nuremberg 1525",
  },
  {
    id: "bernoulli",
    year: "1638 / 1692 年",
    who: "笛卡尔与雅各布·伯努利",
    work: "《学术纪事》（Acta Eruditorum）· Spira mirabilis",
    note: "笛卡尔 1638 年最早讨论等角螺线；伯努利在 1692 年前后沉迷于它的缩放自相似，命名为「奇妙螺线」，嘱托刻上巴塞尔大教堂墓碑并题辞「虽经改变，复归如初」——结果 1705 年去世后石匠误刻成了阿基米德等距螺线。",
    latin: "Eadem mutata resurgo · Basel 1705",
  },
  {
    id: "hokusai",
    year: "约 1830–1832 年",
    who: "葛饰北斋（Katsushika Hokusai）",
    work: "《富岳三十六景·神奈川冲浪里》",
    note: "大都会艺术博物馆馆藏（JP1847）：高耸巨浪与飞沫形成巨大的内卷螺旋势能，把目光从前景摇晃的船队一路卷向画腹远方静立的富士山尖，是动态螺旋与静谧焦点对比的典范。",
    latin: "Fugaku sanjūrokkei · c. 1830–32",
  },
  {
    id: "thompson",
    year: "1917 年",
    who: "达西·汤普森（D'Arcy Wentworth Thompson）",
    work: "《生长与形态》（On Growth and Form）",
    note: "剑桥大学出版社初版：以数学与力学解释鹦鹉螺壳、羊角与叶序为何呈对数螺线——生物外壳每新增一格（gnomon），都与旧体保持几何相似，从而长大却永不改形。",
    latin: "On Growth and Form · Cambridge 1917",
  },
];

export function mountHistoryDemo(root) {
  const canvas = root.querySelector("#s03-canvas");
  const buttons = [...root.querySelectorAll("[data-era]")];
  const captionTitle = root.querySelector("#s03-title");
  const captionWork = root.querySelector("#s03-work");
  const captionBody = root.querySelector("#s03-body");
  const captionLatin = root.querySelector("#s03-latin");

  let activeId = "bernoulli";

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    const item = HISTORY_ITEMS.find((x) => x.id === activeId) || HISTORY_ITEMS[2];
    captionTitle.textContent = `${item.year} · ${item.who}`;
    captionWork.textContent = item.work;
    captionBody.textContent = item.note;
    captionLatin.textContent = item.latin;

    // 暗蓝制图台底
    ctx.fillStyle = "#10203A";
    ctx.fillRect(0, 0, w, h);

    // 极细星图经纬网
    const cx = w * 0.5;
    const cy = h * 0.52;
    const R = Math.min(w, h) * 0.39;
    ctx.strokeStyle = "rgba(231, 214, 185, 0.12)";
    ctx.lineWidth = 1;
    for (let r = R * 0.33; r <= R * 1.05; r += R * 0.33) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - R * 1.2, cy);
    ctx.lineTo(cx + R * 1.2, cy);
    ctx.moveTo(cx, cy - R * 1.15);
    ctx.lineTo(cx, cy + R * 1.15);
    ctx.stroke();

    ctx.save();
    if (activeId === "archimedes") {
      // 等距螺线 + 匀速旋转射线与切线构造
      ctx.beginPath();
      for (let i = 0; i <= 220; i++) {
        const th = (i / 220) * Math.PI * 6;
        const r = (R / (Math.PI * 6)) * th;
        const x = cx + Math.cos(th) * r;
        const y = cy + Math.sin(th) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#E7D6B9";
      ctx.lineWidth = 2.4;
      ctx.stroke();
      // 等距刻度点
      for (let k = 1; k <= 3; k++) {
        const r = (R / 3) * k;
        ctx.beginPath();
        ctx.arc(cx + r, cy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#FF8B6B";
        ctx.fill();
      }
    } else if (activeId === "durer") {
      // 丢勒双圆心/多圆心圆规接弧「蜗牛线」构造
      ctx.strokeStyle = "#E7D6B9";
      ctx.lineWidth = 2.3;
      const centers = [
        { x: cx - 10, y: cy },
        { x: cx + 10, y: cy },
      ];
      let rad = 16;
      for (let k = 0; k < 6; k++) {
        const c = centers[k % 2];
        ctx.beginPath();
        ctx.arc(c.x, c.y, rad, k % 2 === 0 ? 0 : Math.PI, k % 2 === 0 ? Math.PI : Math.PI * 2);
        ctx.stroke();
        rad += 20;
      }
      // 两个圆规针孔
      centers.forEach((c) => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#FF8B6B";
        ctx.fill();
      });
    } else if (activeId === "bernoulli") {
      // 叠绘墓碑错刻（虚线阿基米德）vs 伯努利原意（实线珊瑚对数螺线）
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = "rgba(231, 214, 185, 0.55)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i <= 180; i++) {
        const th = (i / 180) * Math.PI * 5;
        const r = (R / (Math.PI * 5)) * th;
        const x = cx + Math.cos(th) * r;
        const y = cy + Math.sin(th) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 真正的 Spira mirabilis
      const b = Math.log(1.48) / (Math.PI / 2);
      const maxT = Math.PI * 5;
      const r0 = R / Math.exp(b * maxT);
      ctx.strokeStyle = "#FF8B6B";
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const th = (i / 200) * maxT;
        const r = r0 * Math.exp(b * th);
        const x = cx + Math.cos(th) * r;
        const y = cy + Math.sin(th) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.font = '500 11px "IBM Plex Mono", "Noto Sans SC", sans-serif';
      ctx.fillStyle = "#FF8B6B";
      ctx.fillText("实线：伯努利原意（对数螺线）", 16, 24);
      ctx.fillStyle = "#E7D6B9";
      ctx.fillText("虚线：石匠误刻（阿基米德）", 16, 42);
    } else if (activeId === "hokusai") {
      // 神奈川巨浪螺旋势线 + 远方富士山焦眼
      const fx = cx + R * 0.25;
      const fy = cy + R * 0.22;
      // 巨浪大螺弧
      ctx.strokeStyle = "#E7D6B9";
      ctx.lineWidth = 3;
      ctx.beginPath();
      const maxT = Math.PI * 2.5;
      const b = Math.log(1.62) / (Math.PI / 2);
      const r0 = (R * 1.05) / Math.exp(b * maxT);
      for (let i = 0; i <= 140; i++) {
        const th = (i / 140) * maxT;
        const r = r0 * Math.exp(b * th);
        const x = fx + Math.cos(Math.PI * 1.15 - th) * r;
        const y = fy + Math.sin(Math.PI * 1.15 - th) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // 远山三角焦眼
      ctx.beginPath();
      ctx.moveTo(fx - 26, fy + 18);
      ctx.lineTo(fx, fy - 14);
      ctx.lineTo(fx + 26, fy + 18);
      ctx.closePath();
      ctx.fillStyle = "#FF8B6B";
      ctx.fill();
      ctx.fillStyle = "#E7D6B9";
      ctx.font = '500 11px "Noto Sans SC", sans-serif';
      ctx.fillText("浪势向心收束 → 富士山", 16, 24);
    } else {
      // 达西·汤普森鹦鹉螺气室与 gnomon 等比生长
      const b = Math.log(1.33) / (Math.PI / 2);
      const maxT = Math.PI * 5.2;
      const r0 = R / Math.exp(b * maxT);
      ctx.strokeStyle = "#E7D6B9";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i <= 220; i++) {
        const th = (i / 220) * maxT;
        const r = r0 * Math.exp(b * th);
        const x = cx + Math.cos(th) * r;
        const y = cy + Math.sin(th) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // 气室隔板
      ctx.strokeStyle = "rgba(255, 139, 107, 0.72)";
      ctx.lineWidth = 1.4;
      for (let th = Math.PI; th <= maxT; th += Math.PI / 5.5) {
        const rOut = r0 * Math.exp(b * th);
        const rIn = r0 * Math.exp(b * (th - Math.PI * 2));
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(th) * rIn, cy + Math.sin(th) * rIn);
        ctx.quadraticCurveTo(
          cx + Math.cos(th - 0.16) * ((rIn + rOut) * 0.52),
          cy + Math.sin(th - 0.16) * ((rIn + rOut) * 0.52),
          cx + Math.cos(th) * rOut,
          cy + Math.sin(th) * rOut
        );
        ctx.stroke();
      }
      ctx.fillStyle = "#E7D6B9";
      ctx.font = '500 11px "IBM Plex Mono", "Noto Sans SC", sans-serif';
      ctx.fillText("实测鹦鹉螺 k ≈ 1.33（非 1.618）", 16, 24);
    }
    ctx.restore();
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeId = btn.dataset.era;
      buttons.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      draw();
    });
  });
  new ResizeObserver(draw).observe(canvas);
  draw();
}

// =========================================================================
// 04 节：黄金螺旋的真相 · 真鹦鹉螺比对 + 「事后硬套」拆穿器
// =========================================================================
export function mountMythBusterDemo(root) {
  const canvas = root.querySelector("#s04-canvas");
  const modeBtns = [...root.querySelectorAll("[data-myth]")];
  const shiftInput = root.querySelector("#s04-shift");
  const shiftLabel = root.querySelector("#s04-shift-label");
  const readout = root.querySelector("#s04-readout");

  let mode = "nautilus"; // 'nautilus' | 'retrofit'

  // 固定的一组随机日常散点（咖啡杯、钥匙、纸片等）用于演示「事后硬套黄金框」
  const dots = [
    { u: 0.22, v: 0.26, r: 16, label: "杯口" },
    { u: 0.64, v: 0.34, r: 12, label: "叶影" },
    { u: 0.41, v: 0.68, r: 14, label: "勺柄" },
    { u: 0.78, v: 0.62, r: 11, label: "纸角" },
    { u: 0.31, v: 0.48, r: 9, label: "豆粒" },
    { u: 0.56, v: 0.56, r: 13, label: "折痕" },
  ];

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    const shift = Number(shiftInput.value);

    ctx.fillStyle = "#FDF6E9";
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.52;
    const R = Math.min(w, h) * 0.42;

    if (mode === "nautilus") {
      const kUser = +(1.22 + (shift / 100) * 0.58).toFixed(2);
      shiftLabel.textContent = `对比螺线 k = ${kUser.toFixed(2)}`;

      // 实测鹦鹉螺参考轮廓（k ≈ 1.33，深蓝实线 + 气室）
      const bReal = Math.log(1.33) / (Math.PI / 2);
      const maxT = Math.PI * 5;
      const r0Real = R / Math.exp(bReal * maxT);
      ctx.strokeStyle = "#0A1932";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const th = (i / 200) * maxT;
        const r = r0Real * Math.exp(bReal * th);
        const x = cx + Math.cos(th) * r;
        const y = cy + Math.sin(th) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 叠加用户调节的螺线（默认停在 1.62 黄金螺线，一眼看出根本重合不上！）
      const bTest = Math.log(kUser) / (Math.PI / 2);
      const r0Test = R / Math.exp(bTest * maxT);
      ctx.strokeStyle = "#E66240";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const th = (i / 200) * maxT;
        const r = r0Test * Math.exp(bTest * th);
        const x = cx + Math.cos(th) * r;
        const y = cy + Math.sin(th) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 计算平均径向偏离百分比
      let errSum = 0;
      for (let i = 60; i <= 200; i += 10) {
        const th = (i / 200) * maxT;
        const r1 = r0Real * Math.exp(bReal * th);
        const r2 = r0Test * Math.exp(bTest * th);
        errSum += Math.abs(r1 - r2) / Math.max(1, r1);
      }
      const errPct = Math.round((errSum / 15) * 100);

      ctx.font = '500 11px "IBM Plex Mono", "Noto Sans SC", sans-serif';
      ctx.fillStyle = "#0A1932";
      ctx.fillText("实线：真实鹦鹉螺剖面（k ≈ 1.33）", 14, 22);
      ctx.fillStyle = "#B53D1E";
      ctx.fillText(`虚线：叠合螺线（k = ${kUser.toFixed(2)}，平均偏差 ${errPct}%）`, 14, 40);

      if (Math.abs(kUser - 1.33) <= 0.05) {
        readout.textContent = `当把扩张率拉回到 k = ${kUser.toFixed(2)} 时，两条螺线才几乎完全贴合（偏差仅 ${errPct}%）——鹦鹉螺确实是对数螺线，只是扩张率远缓于黄金比 1.618。`;
      } else if (Math.abs(kUser - PHI) <= 0.06) {
        readout.textContent = `把精确的黄金螺线（k = ${kUser.toFixed(2)}）叠在真实鹦鹉螺（k ≈ 1.33）上，内圈立刻严重错开（偏差 ${errPct}%）。往左拉滑块，看它在哪里才真正重合。`;
      } else {
        readout.textContent = `当前对比螺线 k = ${kUser.toFixed(2)} 与实测鹦鹉螺偏差 ${errPct}%。构图好看的秘诀是「连续递增的对数节奏」，而非必须死守 1.618。`;
      }
    } else {
      // 「事后硬套」拆穿模式：拖动旋转/缩放，黄金螺线总能勉强蹭上随机散点里的 3–4 个！
      const angOff = (shift / 100) * Math.PI * 2;
      shiftLabel.textContent = `任意旋转黄金框 ${Math.round((shift / 100) * 360)}°`;

      // 画随机静物散点
      let hits = 0;
      const bGold = Math.log(PHI) / (Math.PI / 2);
      const maxT = Math.PI * 3.5;
      const r0 = (R * 1.05) / Math.exp(bGold * maxT);

      const spPts = [];
      for (let i = 0; i <= 150; i++) {
        const th = (i / 150) * maxT;
        const r = r0 * Math.exp(bGold * th);
        spPts.push({ x: cx + Math.cos(th + angOff) * r, y: cy + Math.sin(th + angOff) * r });
      }

      dots.forEach((d) => {
        const dx = d.u * w;
        const dy = d.v * h;
        const touched = spPts.some((p) => Math.hypot(p.x - dx, p.y - dy) <= d.r + 12);
        if (touched) hits++;
        ctx.beginPath();
        ctx.arc(dx, dy, d.r, 0, Math.PI * 2);
        ctx.fillStyle = touched ? "rgba(230, 98, 64, 0.22)" : "rgba(10, 25, 50, 0.08)";
        ctx.fill();
        ctx.strokeStyle = touched ? "#E66240" : "rgba(10, 25, 50, 0.4)";
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.fillStyle = "#0A1932";
        ctx.font = '500 10.5px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(d.label, dx, dy + 4);
      });
      ctx.textAlign = "left";

      // 叠上粗黄金螺线
      ctx.strokeStyle = "#E66240";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      spPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();

      readout.textContent = `这 6 个物件只是随手乱摆，但把黄金螺线旋转到 ${Math.round((shift / 100) * 360)}° 时，已经「凑巧」蹭中了 ${hits} 个物件。正因事后允许随便缩放、翻转和裁框，几乎任何画面都能硬套出黄金螺旋（Markowsky, 1992）。`;
    }
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.myth;
      modeBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      shiftInput.value = mode === "nautilus" ? "69" : "28";
      draw();
    });
  });
  shiftInput.addEventListener("input", draw);
  new ResizeObserver(draw).observe(canvas);
  draw();
}

// =========================================================================
// 05 节：什么时候用 vs 什么时候别用（四场景一键换结构对照）
// =========================================================================
const SCENARIOS = {
  stair: {
    title: "建筑摄影 · 旋转楼梯",
    fit: true,
    spiralNote: "物理结构本身呈对数透视下沉，顺着扶手和踏步天然形成 1.6 圈螺旋，视线直落底厅人物或光源。",
    altLabel: "若强行居中平拍",
    altNote: "会失去螺旋梯最迷人的景深压缩感，退化成单调的对称网格。",
  },
  story: {
    title: "叙事海报 · 新品发布",
    fit: true,
    spiralNote: "主标题接住外缘入口，配图曲线带视线绕过核心卖点，最终稳落在右下产品本体，节奏张弛有度。",
    altLabel: "若改为呆板四宫格",
    altNote: "观众不知先看哪格，海报缺少一气呵成的动势与记忆点。",
  },
  dashboard: {
    title: "金融数据报表 · 多指标核对",
    fit: false,
    spiralNote: "硬套螺旋排布数字卡片：眼睛必须转圈比对两项 KPI，扫视成本暴增，横向对齐关系全被曲线破坏。",
    altLabel: "改用四象限 / 网格对照",
    altNote: "改用清晰行列网格或 056 四象限构图后，同类指标一眼横向比对，零阅读阻力。",
  },
  exit: {
    title: "车站紧急出口 · 0.3 秒导视牌",
    fit: false,
    spiralNote: "在需要瞬间做决定的安全警示里绕弯子，螺旋反而拖慢行动判断、增加认知负担。",
    altLabel: "改用直向大箭头 / 强聚焦",
    altNote: "改用高对比单向直线箭头或极简向心聚焦，0.3 秒即可读懂方向。",
  },
};

export function mountUsageDemo(root) {
  const canvas = root.querySelector("#s05-canvas");
  const tabs = [...root.querySelectorAll("[data-scene]")];
  const toggleBtn = root.querySelector("#s05-toggle");
  const badgeEl = root.querySelector("#s05-badge");
  const textEl = root.querySelector("#s05-text");

  let active = "dashboard";
  let useSpiral = true;

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    const sc = SCENARIOS[active];
    const goodNow = (sc.fit && useSpiral) || (!sc.fit && !useSpiral);

    badgeEl.textContent = goodNow ? "结构匹配" : "结构错配";
    badgeEl.dataset.state = goodNow ? "ok" : "bad";
    toggleBtn.textContent = useSpiral ? `切换：${sc.altLabel}` : "切换回：螺旋构图";
    textEl.textContent = useSpiral ? sc.spiralNote : sc.altNote;

    ctx.fillStyle = "#FFFBF2";
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.52;
    const R = Math.min(w, h) * 0.4;

    if (useSpiral) {
      // 画螺旋路径
      ctx.strokeStyle = sc.fit ? "#0A1932" : "#B8292F";
      ctx.lineWidth = 2.4;
      const b = Math.log(1.56) / (Math.PI / 2);
      const maxT = Math.PI * 3.2;
      const r0 = R / Math.exp(b * maxT);
      ctx.beginPath();
      for (let i = 0; i <= 140; i++) {
        const th = (i / 140) * maxT;
        const r = r0 * Math.exp(b * th);
        const x = cx + Math.cos(th) * r;
        const y = cy + Math.sin(th) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (active === "dashboard") {
        // 沿螺线错落排布 5 张 KPI 卡（卡片互不遮死但横纵对齐全失，直观体现核对成本）
        const labels = ["营收 +12%", "留存 68%", "毛利 41%", "客单 ¥290", "转化 4.2%"];
        const coords = [
          { u: 0.76, v: 0.24 },
          { u: 0.24, v: 0.3 },
          { u: 0.26, v: 0.74 },
          { u: 0.74, v: 0.76 },
          { u: 0.52, v: 0.49 },
        ];
        labels.forEach((lb, i) => {
          const x = coords[i].u * w;
          const y = coords[i].v * h;
          ctx.fillStyle = "#FBF0E9";
          ctx.strokeStyle = "#B8292F";
          ctx.lineWidth = 1.25;
          ctx.fillRect(x - 38, y - 13, 76, 26);
          ctx.strokeRect(x - 38, y - 13, 76, 26);
          ctx.fillStyle = "#0A1932";
          ctx.font = '600 10.5px "IBM Plex Mono", "Noto Sans SC", sans-serif';
          ctx.textAlign = "center";
          ctx.fillText(lb, x, y + 4);
        });
      } else if (active === "exit") {
        ctx.fillStyle = "#B8292F";
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFBF2";
        ctx.font = '700 11px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText("EXIT?", cx, cy + 4);
      } else {
        ctx.fillStyle = "#E66240";
        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0A1932";
        ctx.font = '600 11.5px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(active === "stair" ? "天井光源" : "核心产品", cx, cy + 32);
      }
      ctx.textAlign = "left";
    } else {
      // 替代结构示意
      if (active === "dashboard") {
        const pad = 20;
        const cw = (w - pad * 3) / 2;
        const ch = (h - pad * 3) / 2;
        const cells = ["营收 +12.4%", "留存 68.0%", "毛利 41.2%", "转化 4.2%"];
        cells.forEach((txt, i) => {
          const x = pad + (i % 2) * (cw + pad);
          const y = pad + Math.floor(i / 2) * (ch + pad);
          ctx.fillStyle = "#FDF6E9";
          ctx.strokeStyle = "#1B6B56";
          ctx.lineWidth = 1.6;
          ctx.fillRect(x, y, cw, ch);
          ctx.strokeRect(x, y, cw, ch);
          ctx.fillStyle = "#0A1932";
          ctx.font = '700 13px "IBM Plex Mono", "Noto Sans SC", sans-serif';
          ctx.textAlign = "center";
          ctx.fillText(txt, x + cw / 2, y + ch / 2 + 5);
        });
      } else if (active === "exit") {
        // 高对比直线大箭头
        ctx.fillStyle = "#1B6B56";
        ctx.fillRect(28, h * 0.32, w - 56, h * 0.36);
        ctx.fillStyle = "#FFFBF2";
        ctx.font = '900 22px "Space Grotesk", "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText("安全出口  EXIT  →", w * 0.5, h * 0.54);
      } else {
        // 平庸网格对照
        ctx.strokeStyle = "rgba(10, 25, 50, 0.3)";
        ctx.lineWidth = 1.4;
        ctx.strokeRect(w * 0.16, h * 0.16, w * 0.68, h * 0.68);
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.16);
        ctx.lineTo(w * 0.5, h * 0.84);
        ctx.moveTo(w * 0.16, h * 0.5);
        ctx.lineTo(w * 0.84, h * 0.5);
        ctx.stroke();
        ctx.fillStyle = "#5D5A54";
        ctx.font = '500 12px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText("四平八稳，缺少旋入张力", w * 0.5, h * 0.92);
      }
      ctx.textAlign = "left";
    }
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      active = btn.dataset.scene;
      useSpiral = true;
      tabs.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      draw();
    });
  });
  toggleBtn.addEventListener("click", () => {
    useSpiral = !useSpiral;
    draw();
  });
  new ResizeObserver(draw).observe(canvas);
  draw();
}

// =========================================================================
// 06 节：实战辨别小练习（3 题单变量图面考场，绝无暴露好坏的选项标签）
// =========================================================================
const QUIZ_QUESTIONS = [
  {
    id: 0,
    stem: "第 1 题（节奏与螺眼）：为「海湾灯塔」做螺旋构图海报，下面四张草图只在螺旋几何与灯塔位置上差一个变量，哪一张视线引导最顺、最聚焦？",
    correct: 2,
    options: [
      {
        code: "方案 A",
        kind: "q1_coil",
        explain: "等距阿基米德式盘旋超过 3 圈，外圈与内圈间距几乎相同，视线容易绕晕，缺少层层递增的深度感。",
      },
      {
        code: "方案 B",
        kind: "q1_offcore",
        explain: "螺线本身有对数递缩与收锋，但灯塔摆在远离螺眼的左上空白处，眼睛顺流绕完一圈扑了个空。",
      },
      {
        code: "方案 C",
        kind: "q1_good",
        explain: "正确：外缘大势入画，约 1.65 圈对数递缩（k ≈ 1.58）由宽入细自然收锋，灯塔稳稳落在唯一螺眼里。",
      },
      {
        code: "方案 D",
        kind: "q1_arc",
        explain: "旋转不足 0.7 圈且外扩太陡，曲线刚拐弯就冲出画框，退化成单段短弧，无法形成向心盘旋。",
      },
    ],
  },
  {
    id: 1,
    stem: "第 2 题（文字与螺旋入口）：给建筑展海报加主标题「旋梯」，四张草图曲线完全一致，仅标题落位不同，哪一张最不打断视线流？",
    correct: 1,
    options: [
      {
        code: "方案 A",
        kind: "q2_cut",
        explain: "标题粗重地横切过螺带腰部，像一堵墙把平滑的螺旋路径拦腰斩断。",
      },
      {
        code: "方案 B",
        kind: "q2_good",
        explain: "正确：标题顺着外缘入口的留白空间起势，读者读完字就顺理成章踏上螺带滑向中心展品。",
      },
      {
        code: "方案 C",
        kind: "q2_cover",
        explain: "标题直接压死在螺眼核心上方，把原本用来停驻目光的视觉焦点糊成一团。",
      },
      {
        code: "方案 D",
        kind: "q2_corner",
        explain: "标题被挤死在远离入口的角落里，与主体螺线脱节，版面裂成互不搭界的两块。",
      },
    ],
  },
  {
    id: 2,
    stem: "第 3 题（何时别用螺旋）：设计「高铁站应急撤离指示牌」，要求旅客在 0.3 秒内无犹豫识别方向，下面四种版式该选哪一种？",
    correct: 2,
    options: [
      {
        code: "方案 A",
        kind: "q3_spiral",
        explain: "黄金螺旋适合让人停留欣赏和叙事，在应急场景里让眼睛绕圈会拖慢判断。",
      },
      {
        code: "方案 B",
        kind: "q3_double",
        explain: "双臂对旋虽有装饰节奏，但两条方向互相拉扯，旅客第一时间看不清到底往左还是往右。",
      },
      {
        code: "方案 C",
        kind: "q3_good",
        explain: "正确：需要零延迟执行的指示牌应当果断放弃螺旋构图，用高对比单向直线箭头一步到位。",
      },
      {
        code: "方案 D",
        kind: "q3_rings",
        explain: "同心圆（055 同心式构图）只把目光钉在中心靶点，并不传递明确的撤离行进方向。",
      },
    ],
  },
];

function drawQuizThumb(canvas, kind) {
  const { ctx, w, h } = setupCanvas(canvas);
  ctx.fillStyle = "#FDF6E9";
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.56;
  const cy = h * 0.52;
  const R = Math.min(w, h) * 0.42;

  const drawSpiralCurve = (turns, k, isArch = false, color = "#0A1932") => {
    const thetaTotal = turns * Math.PI * 2;
    const b = Math.log(Math.max(1.02, k)) / (Math.PI / 2);
    const den = Math.exp(b * thetaTotal) - 1;
    for (let i = 0; i < 90; i++) {
      const s0 = i / 90;
      const s1 = (i + 1) / 90;
      const frac0 = isArch ? 1 - s0 : (Math.exp(b * thetaTotal * (1 - s0)) - 1) / den;
      const frac1 = isArch ? 1 - s1 : (Math.exp(b * thetaTotal * (1 - s1)) - 1) / den;
      const r0 = 8 + (R - 8) * frac0;
      const r1 = 8 + (R - 8) * frac1;
      const a0 = 0.3 * Math.PI + s0 * thetaTotal;
      const a1 = 0.3 * Math.PI + s1 * thetaTotal;
      ctx.strokeStyle = color;
      ctx.lineWidth = isArch ? 3.2 : 1.4 + 5.8 * Math.pow(1 - s0, 1.2);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0);
      ctx.lineTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1);
      ctx.stroke();
    }
  };

  const drawBeacon = (x, y) => {
    ctx.fillStyle = "#E66240";
    ctx.beginPath();
    ctx.arc(x, y, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFBF2";
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  };

  if (kind === "q1_coil") {
    drawSpiralCurve(3.2, 1.04, true);
    drawBeacon(cx, cy);
  } else if (kind === "q1_offcore") {
    drawSpiralCurve(1.68, 1.58, false);
    drawBeacon(w * 0.2, h * 0.26);
  } else if (kind === "q1_good") {
    drawSpiralCurve(1.68, 1.58, false);
    drawBeacon(cx, cy);
  } else if (kind === "q1_arc") {
    drawSpiralCurve(0.65, 2.38, false);
    drawBeacon(cx, cy);
  } else if (kind.startsWith("q2_")) {
    drawSpiralCurve(1.65, 1.58, false);
    drawBeacon(cx, cy);
    ctx.fillStyle = "#0A1932";
    ctx.font = '900 18px "Noto Sans SC", sans-serif';
    if (kind === "q2_cut") {
      ctx.fillStyle = "#E66240";
      ctx.fillText("旋梯展", cx - 42, cy - 16);
    } else if (kind === "q2_good") {
      ctx.fillText("旋梯展", 16, 30);
      ctx.fillStyle = "#E66240";
      ctx.fillRect(16, 36, 26, 3);
    } else if (kind === "q2_cover") {
      ctx.fillStyle = "#0A1932";
      ctx.textAlign = "center";
      ctx.fillText("旋梯展", cx, cy + 6);
      ctx.textAlign = "left";
    } else {
      ctx.fillText("旋梯展", 10, h - 12);
    }
  } else if (kind === "q3_spiral") {
    drawSpiralCurve(1.75, 1.62, false, "#1B6B56");
    ctx.fillStyle = "#1B6B56";
    ctx.font = '700 11px "Space Grotesk", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("EXIT", cx, cy + 4);
  } else if (kind === "q3_double") {
    drawSpiralCurve(1.4, 1.5, false, "#1B6B56");
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI);
    ctx.translate(-cx, -cy);
    drawSpiralCurve(1.4, 1.5, false, "#0A1932");
    ctx.restore();
  } else if (kind === "q3_good") {
    ctx.fillStyle = "#1B6B56";
    ctx.fillRect(16, h * 0.28, w - 32, h * 0.44);
    ctx.fillStyle = "#FFFBF2";
    ctx.font = '900 17px "Space Grotesk", "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("EXIT  →", w * 0.5, h * 0.55);
  } else if (kind === "q3_rings") {
    [0.2, 0.45, 0.72, 0.96].forEach((f) => {
      ctx.strokeStyle = "#1B6B56";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, R * f, 0, Math.PI * 2);
      ctx.stroke();
    });
  }
}

export function mountQuiz(root) {
  const qTabs = [...root.querySelectorAll("[data-qidx]")];
  const stemEl = root.querySelector("#s06-stem");
  const gridEl = root.querySelector("#s06-options");
  const feedbackEl = root.querySelector("#s06-feedback");

  let currentQ = 0;
  const answers = [null, null, null];

  function renderQuestion() {
    const q = QUIZ_QUESTIONS[currentQ];
    stemEl.textContent = q.stem;
    qTabs.forEach((b, i) => {
      b.classList.toggle("is-active", i === currentQ);
      b.setAttribute("aria-pressed", String(i === currentQ));
    });

    gridEl.innerHTML = "";
    q.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-card";
      btn.dataset.opt = String(idx);
      const chosen = answers[currentQ];
      if (chosen !== null) {
        if (idx === q.correct) btn.classList.add("is-correct");
        else if (idx === chosen) btn.classList.add("is-wrong");
      }
      btn.innerHTML = `<canvas class="quiz-thumb" width="220" height="148" aria-hidden="true"></canvas><span class="quiz-code">${opt.code}</span>`;
      btn.addEventListener("click", () => {
        answers[currentQ] = idx;
        renderQuestion();
      });
      gridEl.appendChild(btn);
      const c = btn.querySelector("canvas");
      requestAnimationFrame(() => drawQuizThumb(c, opt.kind));
    });

    const chosen = answers[currentQ];
    if (chosen === null) {
      feedbackEl.className = "quiz-feedback";
      feedbackEl.innerHTML = "<p>点击上方任一方案（A / B / C / D），查看单变量对照解析。</p>";
    } else {
      const ok = chosen === q.correct;
      feedbackEl.className = `quiz-feedback ${ok ? "is-ok" : "is-wrong"}`;
      const rows = q.options
        .map(
          (o, idx) =>
            `<li class="${idx === q.correct ? "is-right-line" : ""}"><strong>${o.code}</strong>：${o.explain}</li>`
        )
        .join("");
      feedbackEl.innerHTML = `<p class="quiz-verdict">${ok ? `选对了！${q.options[q.correct].code} 最成立。` : `再看看：你选了 ${q.options[chosen].code}，更优解是 ${q.options[q.correct].code}。`}</p><ul class="quiz-reasons">${rows}</ul>`;
    }
  }

  qTabs.forEach((b, idx) => {
    b.addEventListener("click", () => {
      currentQ = idx;
      renderQuestion();
    });
  });

  renderQuestion();
}

// 045 方形构图 · 正文 01–07 节差异化交互组件
// 相邻两节绝不使用同一种控件形式：
// 01: 四步构建演进步进剧场（Stepper + 同步 SVG 建造）
// 02: 阿恩海姆正方形隐蔽力场探测盘（2D Canvas 点击/拖拽探针 + 阿尔伯斯 10:8:6:4 嵌套微移对照）
// 03: 四种构图方法 2×2 同步留白/框厚对比仪
// 04: 五大历史坐标碑牌切换 + 极简几何史料重构图版
// 05: 适用 vs 慎用双向试装诊断卡
// 06: 三道单变量辨析小练习（中性 A/B/C/D 标签 + 作答后叠加实测标尺）
// 07: 原海报可缩放拖拽看图器（draggable="false"）

import { loop, pixelRatio } from "../../lib/stage.js";

// ==================== 01 节：四步构建演进步进剧场 ====================
const BUILD_STEPS = [
  {
    step: 1,
    title: "确立框架",
    posterQuote: "确定正方形边界，作为所有元素的容器。",
    why: "先定 1:1 等边外框，相当于在空纸上划出一块「四向无偏见」的领地。眼睛不再四处漂移，所有后续排布都有了共同的参照边界。",
    eyeCue: "视线动作：瞬间锁住四条边，建立整体边界感。",
  },
  {
    step: 2,
    title: "划分网格",
    posterQuote: "采用等分或模块化网格，建立结构秩序。",
    why: "在正方形内拉出 3×3 等分网格与中轴/对角参考线后，每一个落点都不再凭感觉猜测——间距、对齐和对称都有了客观刻度。",
    eyeCue: "视线动作：隐形网格把画面切出清晰坐标，心理预期瞬间安定。",
  },
  {
    step: 3,
    title: "安排元素",
    posterQuote: "按对称或重复原则放置元素，形成视觉节奏。",
    why: "先在中央落下一枚视觉主核，再沿四角对称排布同尺寸次级模块。重复带来节奏，对称抵消倾斜，主次关系一步成型。",
    eyeCue: "视线动作：第一眼直奔中心核，再顺着四角重复块均匀扫视。",
  },
  {
    step: 4,
    title: "优化细节",
    posterQuote: "调整大小、间距与留白，强化焦点与整体感。",
    why: "收匀四边边距、加厚外框体量、在四边中轴补上焦橙定位小方点——最后这一步把「整齐」提升到「有呼吸的精密秩序」。",
    eyeCue: "视线动作：中心聚焦与四周呼吸平衡，耐看而不呆板。",
  },
];

export function initBuildStepsWidget() {
  const buttons = [...document.querySelectorAll("[data-build-step]")];
  const svg = document.getElementById("build-step-svg");
  const titleEl = document.getElementById("build-step-title");
  const quoteEl = document.getElementById("build-step-quote");
  const whyEl = document.getElementById("build-step-why");
  const cueEl = document.getElementById("build-step-cue");
  if (!svg || !buttons.length) return;

  function renderStep(n) {
    const info = BUILD_STEPS[n - 1] || BUILD_STEPS[0];
    buttons.forEach((b) => {
      const active = Number(b.dataset.buildStep) === n;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    titleEl.textContent = `步骤 0${info.step} · ${info.title}`;
    quoteEl.textContent = `原海报原文：「${info.posterQuote}」`;
    whyEl.textContent = info.why;
    cueEl.textContent = info.eyeCue;

    // 逐步叠加的 SVG 几何建构
    const parts = [];
    // 背景暖米纸
    parts.push(`<rect x="0" y="0" width="280" height="280" fill="#F5EBD6"/>`);
    // 步骤 1：外框（步骤 1 为虚线确立，步骤 4 加厚为实心厚墨绿框）
    if (n === 1) {
      parts.push(`<rect x="24" y="24" width="232" height="232" fill="#FAF5E8" stroke="#254126" stroke-width="3" stroke-dasharray="9 6"/>`);
      parts.push(`<rect x="19" y="19" width="10" height="10" fill="#DC6A0C"/><rect x="251" y="19" width="10" height="10" fill="#DC6A0C"/><rect x="19" y="251" width="10" height="10" fill="#DC6A0C"/><rect x="251" y="251" width="10" height="10" fill="#DC6A0C"/>`);
      parts.push(`<text x="140" y="144" text-anchor="middle" fill="#43593D" font-size="13" font-family="IBM Plex Mono, monospace">1 : 1  CONTAINER</text>`);
    } else if (n < 4) {
      parts.push(`<rect x="24" y="24" width="232" height="232" fill="#FAF5E8" stroke="#254126" stroke-width="5"/>`);
    } else {
      parts.push(`<rect x="24" y="24" width="232" height="232" fill="#FAF5E8" stroke="#254126" stroke-width="14"/>`);
      // 中轴切过粗框细白线
      parts.push(`<line x1="17" y1="140" x2="263" y2="140" stroke="#F5EBD6" stroke-width="1.6"/>`);
      parts.push(`<line x1="140" y1="17" x2="140" y2="263" stroke="#F5EBD6" stroke-width="1.6"/>`);
    }

    // 步骤 2+：3×3 等分网格 + 对角参考线
    if (n >= 2) {
      const g0 = 48;
      const gw = 184;
      const step = gw / 3;
      parts.push(`<line x1="36" y1="36" x2="244" y2="244" stroke="#43593D" stroke-opacity="0.32" stroke-width="1.2" stroke-dasharray="4 4"/>`);
      parts.push(`<line x1="244" y1="36" x2="36" y2="244" stroke="#43593D" stroke-opacity="0.32" stroke-width="1.2" stroke-dasharray="4 4"/>`);
      for (let i = 0; i <= 3; i++) {
        const p = g0 + i * step;
        parts.push(`<line x1="${p}" y1="${g0}" x2="${p}" y2="${g0 + gw}" stroke="#254126" stroke-opacity="0.38" stroke-width="1.1"/>`);
        parts.push(`<line x1="${g0}" y1="${p}" x2="${g0 + gw}" y2="${p}" stroke="#254126" stroke-opacity="0.38" stroke-width="1.1"/>`);
      }
    }

    // 步骤 3+：对称模块与主核
    if (n >= 3) {
      const size = n === 3 ? 42 : 46;
      const off = n === 3 ? 58 : 54;
      const far = 280 - off - size;
      // 四角苔藓模块
      parts.push(`<rect x="${off}" y="${off}" width="${size}" height="${size}" fill="#97A37D"/>`);
      parts.push(`<rect x="${far}" y="${off}" width="${size}" height="${size}" fill="#97A37D"/>`);
      parts.push(`<rect x="${off}" y="${far}" width="${size}" height="${size}" fill="#97A37D"/>`);
      parts.push(`<rect x="${far}" y="${far}" width="${size}" height="${size}" fill="#97A37D"/>`);
      // 中央深绿核（步骤 4 略强化主次）
      const cs = n === 3 ? 48 : 62;
      const c0 = (280 - cs) / 2;
      parts.push(`<rect x="${c0}" y="${c0}" width="${cs}" height="${cs}" fill="#254126"/>`);
    }

    // 步骤 4：四焦橙中轴锚点 + 四角定位钉 + 边距标尺
    if (n === 4) {
      const ps = 11;
      parts.push(`<rect x="${140 - ps / 2}" y="66" width="${ps}" height="${ps}" fill="#DC6A0C"/>`);
      parts.push(`<rect x="${140 - ps / 2}" y="${280 - 66 - ps}" width="${ps}" height="${ps}" fill="#DC6A0C"/>`);
      parts.push(`<rect x="66" y="${140 - ps / 2}" width="${ps}" height="${ps}" fill="#DC6A0C"/>`);
      parts.push(`<rect x="${280 - 66 - ps}" y="${140 - ps / 2}" width="${ps}" height="${ps}" fill="#DC6A0C"/>`);
      // 边距均等双箭头
      parts.push(`<line x1="31" y1="12" x2="54" y2="12" stroke="#9C4200" stroke-width="1.5"/>`);
      parts.push(`<text x="140" y="13" text-anchor="middle" fill="#9C4200" font-size="11" font-family="IBM Plex Mono, monospace">四边均距 · 焦点锁定</text>`);
    }

    svg.innerHTML = parts.join("");
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => renderStep(Number(btn.dataset.buildStep)));
  });
  renderStep(1);
}

// ==================== 02 节：阿恩海姆力场探测器 + 阿尔伯斯嵌套对照 ====================
export function initArnheimFieldWidget() {
  const canvas = document.getElementById("arnheim-canvas");
  const toggleBtn = document.getElementById("arnheim-skeleton-btn");
  const presetBtns = [...document.querySelectorAll("[data-arnheim-pos]")];
  const stateLabel = document.getElementById("arnheim-state-label");
  const stateDesc = document.getElementById("arnheim-state-desc");
  const coordsEl = document.getElementById("arnheim-coords");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  // 开场刻意放在「略偏中心右上方」的经典阿恩海姆焦躁位 (0.61, 0.39)
  const disk = { x: 0.61, y: 0.39, showSkeleton: true, dragging: false };

  let cssW = 320;
  let cssH = 320;
  let dpr = 1;
  let arnDirty = true;

  function measureArn(wIn) {
    const s = Math.max(220, Math.round(wIn || cssW));
    const nextDpr = pixelRatio(window.innerWidth <= 560 ? 1.5 : 2);
    if (s !== cssW || nextDpr !== dpr || canvas.width === 0) {
      cssW = s;
      cssH = s;
      dpr = nextDpr;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      arnDirty = true;
    }
  }
  measureArn(canvas.getBoundingClientRect().width);

  // 计算正方形内任意点相对于「中心 / 中轴 / 对角线 / 边沿」的视觉引力状态（示意）
  function analyzePoint(nx, ny) {
    const dx = nx - 0.5;
    const dy = ny - 0.5;
    const distCenter = Math.hypot(dx, dy);
    const distVAxis = Math.abs(dx);
    const distHAxis = Math.abs(dy);
    const distDiag1 = Math.abs(nx - ny) / Math.SQRT2;
    const distDiag2 = Math.abs(nx + ny - 1) / Math.SQRT2;
    const distEdge = Math.min(nx, 1 - nx, ny, 1 - ny);

    // 构造最近吸引锚点用于画张力箭头
    let pullX = 0.5;
    let pullY = 0.5;
    let zone = "";
    let tier = "";
    let desc = "";

    if (distCenter <= 0.045) {
      tier = "绝对安定（示意）";
      zone = "中心归位";
      desc = "圆片正好压在纵横中轴与两条对角线的四线交点上。所有方向拉力彼此抵消，画面最安静，但也最缺少动势。";
    } else if (distEdge < 0.11) {
      pullX = nx < 0.5 ? (nx < distEdge + 0.01 ? 0.04 : nx) : (1 - nx < distEdge + 0.01 ? 0.96 : nx);
      pullY = ny < 0.5 ? (ny < distEdge + 0.01 ? 0.04 : ny) : (1 - ny < distEdge + 0.01 ? 0.96 : ny);
      tier = "贴边紧绷（示意）";
      zone = "边界吸附";
      desc = "圆片逼近外框内壁，边缘产生的强烈吸附力让它看起来像是要撞上或黏住框线，呼吸空间被压迫。";
    } else if (distCenter < 0.19) {
      pullX = 0.5;
      pullY = 0.5;
      tier = "最强焦躁（示意）";
      zone = "差一点归心";
      desc = "这就是阿恩海姆在《艺术与视知觉》开篇指出的经典位置：离中心太近，眼睛不断想把它「推回正中」，产生最明显的不安感。";
    } else if (Math.min(distVAxis, distHAxis) < 0.04) {
      pullX = 0.5;
      pullY = 0.5;
      tier = "轴线次稳（示意）";
      zone = distVAxis < distHAxis ? "落于竖中轴" : "落于横中轴";
      desc = "圆片落在了主中轴上，左右或上下已经对称，只在沿轴方向保留轻微的向心牵引，适合有节制的静态留白。";
    } else if (Math.min(distDiag1, distDiag2) < 0.045) {
      pullX = 0.5;
      pullY = 0.5;
      tier = "对角张力（示意）";
      zone = "落于对角骨架";
      desc = "圆片骑在正方形隐蔽的对角线上：比随意偏放更有条理，又比正中心多出一股斜向延伸的活气。";
    } else {
      // 既不在轴也不在对角线，受最近轴与中心共同拉扯
      pullX = 0.5;
      pullY = 0.5;
      tier = "悬空摇摆（示意）";
      zone = "脱离结构骨架";
      desc = "圆片落在中心、中轴和对角线之外的空隙里，方向意图含糊，读者难以判断你是刻意偏置还是没摆准。";
    }

    return { distCenter, pullX, pullY, zone, tier, desc };
  }

  function updateReadout() {
    const res = analyzePoint(disk.x, disk.y);
    stateLabel.textContent = `${res.zone} · ${res.tier}`;
    stateDesc.textContent = res.desc;
    coordsEl.textContent = `X ${Math.round(disk.x * 100)}% · Y ${Math.round(disk.y * 100)}%`;
  }

  function render(t, dt, { still }) {
    if (!arnDirty && !still) return;
    arnDirty = false;
    ctx.save();
    ctx.scale(dpr, dpr);

    const pad = 22;
    const s = cssW - pad * 2;
    ctx.fillStyle = "#E6E6D2";
    ctx.fillRect(0, 0, cssW, cssH);

    // 纸芯正方
    ctx.fillStyle = "#FAF5E8";
    ctx.fillRect(pad, pad, s, s);
    ctx.strokeStyle = "#254126";
    ctx.lineWidth = 4;
    ctx.strokeRect(pad, pad, s, s);

    // 阿恩海姆隐蔽结构骨架（中轴 + 对角线 + 中心引力环 + 四角弱锚）
    if (disk.showSkeleton) {
      ctx.save();
      ctx.strokeStyle = "rgba(37, 65, 38, 0.28)";
      ctx.lineWidth = 1.1;
      ctx.setLineDash([4, 4]);
      // 十字中轴
      ctx.beginPath();
      ctx.moveTo(pad, pad + s * 0.5);
      ctx.lineTo(pad + s, pad + s * 0.5);
      ctx.moveTo(pad + s * 0.5, pad);
      ctx.lineTo(pad + s * 0.5, pad + s);
      // 两条对角线
      ctx.moveTo(pad, pad);
      ctx.lineTo(pad + s, pad + s);
      ctx.moveTo(pad + s, pad);
      ctx.lineTo(pad, pad + s);
      ctx.stroke();

      // 中心磁场环
      ctx.setLineDash([]);
      for (const r of [0.08, 0.18, 0.30]) {
        ctx.strokeStyle = "rgba(220, 106, 12, 0.22)";
        ctx.beginPath();
        ctx.arc(pad + s * 0.5, pad + s * 0.5, s * r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // 中心交点小圈
      ctx.fillStyle = "#DC6A0C";
      ctx.beginPath();
      ctx.arc(pad + s * 0.5, pad + s * 0.5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const px = pad + disk.x * s;
    const py = pad + disk.y * s;
    const res = analyzePoint(disk.x, disk.y);

    // 拉力矢量线（不归位时显示方向牵引）
    if (res.distCenter > 0.045) {
      const tx = pad + res.pullX * s;
      const ty = pad + res.pullY * s;
      const ang = Math.atan2(ty - py, tx - px);
      const len = Math.min(52, Math.hypot(tx - px, ty - py) * 0.65);
      const ex = px + Math.cos(ang) * len;
      const ey = py + Math.sin(ang) * len;
      ctx.save();
      ctx.strokeStyle = "#DC6A0C";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      // 箭尖
      ctx.fillStyle = "#DC6A0C";
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - Math.cos(ang - 0.45) * 9, ey - Math.sin(ang - 0.45) * 9);
      ctx.lineTo(ex - Math.cos(ang + 0.45) * 9, ey - Math.sin(ang + 0.45) * 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 阿恩海姆黑圆片
    const rad = Math.max(14, s * 0.068);
    ctx.fillStyle = "#163318";
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FAF5E8";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  const ctl = loop(canvas, render);
  const ro = new ResizeObserver((entries) => {
    const cr = entries[0]?.contentRect;
    if (cr) measureArn(cr.width);
    ctl.draw();
  });
  ro.observe(canvas);

  function setFromPointer(ev) {
    const r = canvas.getBoundingClientRect();
    const pad = 22;
    const s = Math.max(100, r.width - pad * 2);
    disk.x = Math.max(0.08, Math.min(0.92, (ev.clientX - r.left - pad) / s));
    disk.y = Math.max(0.08, Math.min(0.92, (ev.clientY - r.top - pad) / s));
    arnDirty = true;
    updateReadout();
    ctl.draw();
  }

  canvas.addEventListener("pointerdown", (ev) => {
    disk.dragging = true;
    setFromPointer(ev);
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(ev.pointerId); } catch {}
    }
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (!disk.dragging) return;
    setFromPointer(ev);
  });
  canvas.addEventListener("pointerup", () => { disk.dragging = false; });
  canvas.addEventListener("pointercancel", () => { disk.dragging = false; });

  toggleBtn?.addEventListener("click", () => {
    disk.showSkeleton = !disk.showSkeleton;
    toggleBtn.setAttribute("aria-pressed", String(disk.showSkeleton));
    toggleBtn.textContent = disk.showSkeleton ? "隐蔽骨架：开" : "隐蔽骨架：关";
    arnDirty = true;
    ctl.draw();
  });

  presetBtns.forEach((b) => {
    b.addEventListener("click", () => {
      const [x, y] = b.dataset.arnheimPos.split(",").map(Number);
      disk.x = x;
      disk.y = y;
      arnDirty = true;
      updateReadout();
      ctl.draw();
    });
  });

  updateReadout();

  // 阿尔伯斯《向正方形致敬》嵌套对照（绝对同心 vs 下沉聚重 1:2:3 边界感）
  const albersBtns = [...document.querySelectorAll("[data-albers-mode]")];
  const albersSvg = document.getElementById("albers-svg");
  const albersNote = document.getElementById("albers-note");
  if (albersSvg && albersBtns.length) {
    function renderAlbers(mode) {
      albersBtns.forEach((b) => {
        const on = b.dataset.albersMode === mode;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      // 10 : 8 : 6 : 4 四层嵌套正方形
      const outer = 200;
      const x0 = 10;
      const y0 = 10;
      const layers = [
        { units: 10, fill: "#D8DAC0" },
        { units: 8,  fill: "#97A37D" },
        { units: 6,  fill: "#43593D" },
        { units: 4,  fill: "#DC6A0C" },
      ];
      const rects = layers.map((ly, idx) => {
        const size = (ly.units / 10) * outer;
        const dx = (outer - size) / 2;
        // 绝对同心：上下均分；阿尔伯斯下沉：底距占 1 份、侧距占 2 份、顶距占 3 份（每步下移）
        const dy = mode === "concentric"
          ? (outer - size) / 2
          : (outer - size) * 0.75; // 顶距 = 3×底距，侧距 = 2×底距
        return `<rect x="${(x0 + dx).toFixed(1)}" y="${(y0 + dy).toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" fill="${ly.fill}"/>${idx === 3 ? `<line x1="${x0 + outer / 2}" y1="${y0}" x2="${x0 + outer / 2}" y2="${y0 + dy}" stroke="#163318" stroke-width="1" stroke-dasharray="3 3"/><line x1="${x0 + outer / 2}" y1="${y0 + dy + size}" x2="${x0 + outer / 2}" y2="${y0 + outer}" stroke="#163318" stroke-width="1" stroke-dasharray="3 3"/>` : ""}`;
      });
      albersSvg.innerHTML = `<rect x="0" y="0" width="220" height="220" fill="#FAF5E8"/>${rects.join("")}`;
      albersNote.textContent = mode === "concentric"
        ? "四层几何绝对居中（上 = 左 = 右 = 下）：最规整，但看久了会感到微微上飘、略显静止僵硬。"
        : "阿尔伯斯下沉嵌套（底 1 : 侧 2 : 顶 3）：水平依旧严格对称，纵向给底部压出重力感，正方形立刻有了向前呼吸的层次。";
    }
    albersBtns.forEach((b) => b.addEventListener("click", () => renderAlbers(b.dataset.albersMode)));
    renderAlbers("albers");
  }
}

// ==================== 03 节：四种构图方法 2×2 同步分屏对比仪 ====================
export function initFourMethodsWidget() {
  const spaceRange = document.getElementById("methods-space-range");
  const borderRange = document.getElementById("methods-border-range");
  const spaceVal = document.getElementById("methods-space-val");
  const borderVal = document.getElementById("methods-border-val");
  const themeBtns = [...document.querySelectorAll("[data-method-theme]")];
  const verdictEl = document.getElementById("methods-verdict");
  const cards = {
    center: document.getElementById("method-svg-center"),
    nine: document.getElementById("method-svg-nine"),
    wrap: document.getElementById("method-svg-wrap"),
    repeat: document.getElementById("method-svg-repeat"),
  };
  if (!spaceRange || !cards.center) return;

  let theme = "geo"; // 'geo' | 'card' | 'expo'

  function drawCard(kind, padPct, bPx) {
    const S = 180;
    const pad = (padPct / 100) * (S - bPx * 2);
    const ix = bPx + pad;
    const iy = bPx + pad;
    const iw = Math.max(30, S - (bPx + pad) * 2);
    const bg = "#FAF5E8";
    const dark = "#254126";
    const sage = "#97A37D";
    const orange = "#DC6A0C";

    const out = [
      `<rect x="0" y="0" width="${S}" height="${S}" fill="${bg}"/>`,
    ];
    if (bPx > 0) {
      out.push(`<rect x="${bPx / 2}" y="${bPx / 2}" width="${S - bPx}" height="${S - bPx}" fill="none" stroke="${dark}" stroke-width="${bPx}"/>`);
    }

    if (kind === "center") {
      // 中心聚焦式：中央大核 + 四边轻点缀
      const cs = iw * 0.48;
      const cx = ix + (iw - cs) / 2;
      out.push(`<rect x="${cx}" y="${cx}" width="${cs}" height="${cs}" fill="${dark}"/>`);
      if (theme === "geo") {
        const ps = Math.max(8, cs * 0.24);
        out.push(`<rect x="${S / 2 - ps / 2}" y="${S / 2 - ps / 2}" width="${ps}" height="${ps}" fill="${orange}"/>`);
      } else if (theme === "card") {
        out.push(`<rect x="${cx + cs * 0.2}" y="${cx + cs * 0.34}" width="${cs * 0.6}" height="6" fill="#FAF5E8"/>`);
        out.push(`<rect x="${cx + cs * 0.3}" y="${cx + cs * 0.54}" width="${cs * 0.4}" height="4" fill="${orange}"/>`);
      } else {
        out.push(`<circle cx="${S / 2}" cy="${S / 2}" r="${cs * 0.24}" fill="${orange}"/>`);
      }
      // 四角极细定位点
      const d = 5;
      out.push(`<rect x="${ix}" y="${iy}" width="${d}" height="${d}" fill="${sage}"/>`);
      out.push(`<rect x="${ix + iw - d}" y="${iy}" width="${d}" height="${d}" fill="${sage}"/>`);
      out.push(`<rect x="${ix}" y="${iy + iw - d}" width="${d}" height="${d}" fill="${sage}"/>`);
      out.push(`<rect x="${ix + iw - d}" y="${iy + iw - d}" width="${d}" height="${d}" fill="${sage}"/>`);
    } else if (kind === "nine") {
      // 九宫结构式：3×3 清晰九格，中心高亮
      const g = Math.max(3, iw * 0.06);
      const cw = (iw - g * 2) / 3;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const x = ix + c * (cw + g);
          const y = iy + r * (cw + g);
          const isC = r === 1 && c === 1;
          const isCorner = (r === 0 || r === 2) && (c === 0 || c === 2);
          const fill = isC ? orange : isCorner ? dark : "#E6E6D2";
          out.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cw.toFixed(1)}" height="${cw.toFixed(1)}" fill="${fill}" stroke="${dark}" stroke-width="1"/>`);
          if (theme === "card" && !isC && isCorner) {
            out.push(`<rect x="${(x + cw * 0.2).toFixed(1)}" y="${(y + cw * 0.42).toFixed(1)}" width="${(cw * 0.6).toFixed(1)}" height="3" fill="#FAF5E8"/>`);
          }
        }
      }
    } else if (kind === "wrap") {
      // 边框包围式：强化厚边保护内框，顶边压焦橙锚标（1:1 呼应原海报「边框包围式」微缩图！）
      const wrapB = Math.max(10, bPx * 1.9);
      out.push(`<rect x="${wrapB / 2 + 4}" y="${wrapB / 2 + 4}" width="${S - wrapB - 8}" height="${S - wrapB - 8}" fill="none" stroke="${dark}" stroke-width="${wrapB}"/>`);
      const pinW = Math.max(14, wrapB * 1.15);
      out.push(`<rect x="${(S - pinW) / 2}" y="4" width="${pinW}" height="${wrapB}" fill="${orange}"/>`);
      const innerCore = Math.max(22, iw * 0.42);
      const ic = (S - innerCore) / 2;
      if (theme === "geo") {
        out.push(`<rect x="${ic}" y="${ic}" width="${innerCore}" height="${innerCore}" fill="none" stroke="${sage}" stroke-width="2" stroke-dasharray="4 3"/>`);
      } else {
        out.push(`<rect x="${ic}" y="${ic + innerCore * 0.25}" width="${innerCore}" height="6" fill="${dark}"/>`);
        out.push(`<rect x="${ic + innerCore * 0.15}" y="${ic + innerCore * 0.58}" width="${innerCore * 0.7}" height="4" fill="${sage}"/>`);
      }
    } else if (kind === "repeat") {
      // 重复对称式：四角 L 格对称 + 中心橙锚
      const seg = iw * 0.34;
      const far = ix + iw - seg;
      out.push(`<rect x="${ix}" y="${iy}" width="${seg}" height="${seg}" fill="${sage}"/>`);
      out.push(`<rect x="${far}" y="${iy}" width="${seg}" height="${seg}" fill="${sage}"/>`);
      out.push(`<rect x="${ix}" y="${far}" width="${seg}" height="${seg}" fill="${sage}"/>`);
      out.push(`<rect x="${far}" y="${far}" width="${seg}" height="${seg}" fill="${sage}"/>`);
      // 十字连通线
      out.push(`<line x1="${S / 2}" y1="${iy}" x2="${S / 2}" y2="${iy + iw}" stroke="${dark}" stroke-width="1.5"/>`);
      out.push(`<line x1="${ix}" y1="${S / 2}" x2="${ix + iw}" y2="${S / 2}" stroke="${dark}" stroke-width="1.5"/>`);
      const cs = Math.max(14, iw * 0.22);
      out.push(`<rect x="${S / 2 - cs / 2}" y="${S / 2 - cs / 2}" width="${cs}" height="${cs}" fill="${orange}"/>`);
    }
    return out.join("");
  }

  function update() {
    const padPct = Number(spaceRange.value);
    const bPx = Number(borderRange.value);
    spaceVal.textContent = `${padPct}%`;
    borderVal.textContent = `${bPx}px`;

    cards.center.innerHTML = drawCard("center", padPct, bPx);
    cards.nine.innerHTML = drawCard("nine", padPct, bPx);
    cards.wrap.innerHTML = drawCard("wrap", padPct, bPx);
    cards.repeat.innerHTML = drawCard("repeat", padPct, bPx);

    if (padPct < 7) {
      verdictEl.textContent = "当前内留白过紧（< 7%）：九宫结构式与重复对称式最先发闷，元素紧贴边框；只有边框包围式因为自带内缩还勉强撑住。";
    } else if (padPct > 20) {
      verdictEl.textContent = "当前内留白很宽（> 20%）：中心聚焦式与边框包围式显得从容克制；九宫结构式的 9 个单格被压得过小，适合换成极简图标而非长文字。";
    } else if (bPx < 4) {
      verdictEl.textContent = "当前外框偏细（< 4px）：边界束缚感变弱，重复对称式和九宫结构式要靠齐整的格位互相兜住，而中心聚焦式容易在页面上显得发飘。";
    } else {
      verdictEl.textContent = "当前留白（10%–18%）与边框（6–14px）落在均衡区间：四种排法各有分工——要第一眼冲劲选中心聚焦，要装多组信息选九宫结构，要庄重保护感选边框包围，要统一仪式感选重复对称。";
    }
  }

  spaceRange.addEventListener("input", update);
  borderRange.addEventListener("input", update);
  themeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      theme = b.dataset.methodTheme;
      themeBtns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      update();
    });
  });
  update();
}

// ==================== 04 节：五大历史坐标碑牌图版 ====================
const HISTORY_ITEMS = [
  {
    year: "1915",
    place: "彼得格勒 · 0,10 画展",
    title: "马列维奇《黑方块》：正方形成为视觉零点",
    body: "1915 年 12 月，卡西米尔·马列维奇在「0,10 最后一次未来主义画展」上首次展出《黑方块》（现藏莫斯科国立特列季亚科夫画廊），并刻意把它高挂在俄罗斯传统圣像所在的墙角。画布上只有白底与一块黑色近正方形，彻底剥离具象叙事——正方形第一次以纯粹的平面秩序本身成为主角。",
    takeaway: "设计启示：哪怕删光装饰，一块干净的方形边界与高反差留白就足以建立极强的庄重感。",
    plate: () => `
      <rect width="260" height="260" fill="#EFE6CF"/>
      <rect x="26" y="26" width="208" height="208" fill="#FAF5E8" stroke="#B9BAA4" stroke-width="1.5"/>
      <rect x="62" y="62" width="136" height="136" fill="#163318"/>
      <text x="130" y="250" text-anchor="middle" fill="#43593D" font-size="11" font-family="IBM Plex Mono, monospace">MALEVICH · 1915 · 0,10</text>
    `,
  },
  {
    year: "1929",
    place: "德国布伦瑞克 · Franke & Heidecke",
    title: "Rolleiflex 6×6：不用翻转相机的方形取景",
    body: "1929 年登场的 Rolleiflex 6×6 厘米双反相机使用 120 胶卷，一卷 12 张正方形底片。因为腰平取景器始终是 1:1，摄影师不必纠结横拍还是竖拍，开始把建筑对称、人像居中与留白秩序直接放进正方形画框里思考。",
    takeaway: "设计启示：1:1 画框消除横竖取向冲突，让同一系列作品无论怎么并排都天然齐整。",
    plate: () => `
      <rect width="260" height="260" fill="#163318"/>
      <rect x="34" y="34" width="192" height="192" fill="#254126" stroke="#D8DAC0" stroke-width="2"/>
      <line x1="34" y1="98" x2="226" y2="98" stroke="#FAF5E8" stroke-opacity="0.45" stroke-width="1"/>
      <line x1="34" y1="162" x2="226" y2="162" stroke="#FAF5E8" stroke-opacity="0.45" stroke-width="1"/>
      <line x1="98" y1="34" x2="98" y2="226" stroke="#FAF5E8" stroke-opacity="0.45" stroke-width="1"/>
      <line x1="162" y1="34" x2="162" y2="226" stroke="#FAF5E8" stroke-opacity="0.45" stroke-width="1"/>
      <circle cx="130" cy="130" r="24" fill="none" stroke="#FF9F4A" stroke-width="1.8"/>
      <text x="130" y="248" text-anchor="middle" fill="#D8DAC0" font-size="11" font-family="IBM Plex Mono, monospace">ROLLEIFLEX 6×6 CM · 1929</text>
    `,
  },
  {
    year: "1950",
    place: "纽约与耶鲁 · 持续至 1976",
    title: "阿尔伯斯《向正方形致敬》：用嵌套方框做色彩实验",
    body: "1950 年夏，原包豪斯教师约瑟夫·阿尔伯斯开始创作《向正方形致敬》系列并一直画到 1976 年去世（如 MoMA 藏 1951《白色纪念碑》、1961《寂静大厅》）。他把画框固定为三到四层套叠的正方形，故意略微下移内方，以此研究边界留白与相邻色块怎样彼此改写视觉明暗。",
    takeaway: "设计启示：把外框锁成不变的 1:1 常量后，哪怕微小的层级与留白变化也会被放大得很清楚。",
    plate: () => `
      <rect width="260" height="260" fill="#F5EBD6"/>
      <rect x="30" y="24" width="200" height="200" fill="#D8DAC0"/>
      <rect x="50" y="54" width="160" height="160" fill="#97A37D"/>
      <rect x="70" y="84" width="120" height="120" fill="#43593D"/>
      <rect x="90" y="114" width="80" height="80" fill="#DC6A0C"/>
      <text x="130" y="248" text-anchor="middle" fill="#43593D" font-size="11" font-family="IBM Plex Mono, monospace">JOSEF ALBERS · 1950–1976</text>
    `,
  },
  {
    year: "1954",
    place: "加州大学出版社 · 1974 修订",
    title: "阿恩海姆《艺术与视知觉》：揭开正方形的隐蔽骨架",
    body: "鲁道夫·阿恩海姆在 1954 年初版、1974 年大幅修订的《艺术与视知觉》开篇第一章里，用「空正方形里的一个黑圆片」证明：人眼看到的空正方形绝不是死板平纸，它自带中心点、纵横中轴与对角线构成的隐蔽张力骨架。",
    takeaway: "设计启示：放进方框的元素天生会和中心与四边产生心理推拉——对准骨架就安定，差一点就焦躁。",
    plate: () => `
      <rect width="260" height="260" fill="#FAF5E8"/>
      <rect x="34" y="26" width="192" height="192" fill="none" stroke="#163318" stroke-width="3"/>
      <line x1="34" y1="122" x2="226" y2="122" stroke="#43593D" stroke-dasharray="4 4" stroke-width="1.2"/>
      <line x1="130" y1="26" x2="130" y2="218" stroke="#43593D" stroke-dasharray="4 4" stroke-width="1.2"/>
      <line x1="34" y1="26" x2="226" y2="218" stroke="#97A37D" stroke-dasharray="4 4" stroke-width="1.2"/>
      <line x1="226" y1="26" x2="34" y2="218" stroke="#97A37D" stroke-dasharray="4 4" stroke-width="1.2"/>
      <circle cx="152" cy="100" r="14" fill="#163318"/>
      <line x1="146" y1="106" x2="133" y2="119" stroke="#DC6A0C" stroke-width="2.2"/>
      <circle cx="130" cy="122" r="4" fill="#DC6A0C"/>
      <text x="130" y="246" text-anchor="middle" fill="#43593D" font-size="11" font-family="IBM Plex Mono, monospace">ARNHEIM · 1954 / 1974</text>
    `,
  },
  {
    year: "1981",
    place: "瑞士 Niggli 出版社 · 德英双语",
    title: "米勒-布罗克曼《网格系统》：方格成为理性排版的通语",
    body: "瑞士国际主义平面设计大师约瑟夫·米勒-布罗克曼在 1981 年首版《平面设计中的网格系统》（Raster Systeme）中，把 8 到 32 格的等分模块化网格写成了系统方法论——用统一的方形/模数格位约束图文，直接传达客观、可靠与专业。",
    takeaway: "设计启示：从企业品牌规范、商品陈列墙到今天的图标与信息卡片，都站在这一套模块化网格之上。",
    plate: () => `
      <rect width="260" height="260" fill="#FAF5E8"/>
      <rect x="34" y="26" width="192" height="192" fill="none" stroke="#254126" stroke-width="2.5"/>
      ${[0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => {
        const x = 44 + c * 44;
        const y = 36 + r * 44;
        const fill = (r === 1 && c === 1) || (r === 1 && c === 2) || (r === 2 && c === 1) ? "#254126"
          : (r === 0 && c === 0) || (r === 3 && c === 3) ? "#DC6A0C"
          : (r + c) % 3 === 0 ? "#97A37D" : "#ECE4CC";
        return `<rect x="${x}" y="${y}" width="38" height="38" fill="${fill}"/>`;
      })).join("")}
      <text x="130" y="246" text-anchor="middle" fill="#43593D" font-size="11" font-family="IBM Plex Mono, monospace">MÜLLER-BROCKMANN · 1981</text>
    `,
  },
];

export function initHistoryWidget() {
  const tabs = [...document.querySelectorAll("[data-history-idx]")];
  const plateEl = document.getElementById("history-plate");
  const placeEl = document.getElementById("history-place");
  const titleEl = document.getElementById("history-title");
  const bodyEl = document.getElementById("history-body");
  const takeawayEl = document.getElementById("history-takeaway");
  if (!plateEl || !tabs.length) return;

  function select(idx) {
    const item = HISTORY_ITEMS[idx] || HISTORY_ITEMS[0];
    tabs.forEach((t, i) => {
      const on = i === idx;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-pressed", String(on));
    });
    plateEl.innerHTML = item.plate();
    placeEl.textContent = `${item.year} · ${item.place}`;
    titleEl.textContent = item.title;
    bodyEl.textContent = item.body;
    takeawayEl.textContent = item.takeaway;
  }

  tabs.forEach((t) => t.addEventListener("click", () => select(Number(t.dataset.historyIdx))));
  select(0);
}

// ==================== 05 节：适用 vs 慎用双向试装诊断卡 ====================
const FIT_SCENARIOS = [
  {
    id: "logo",
    title: "建筑事务所徽章",
    fit: "good",
    badge: "极适合方形",
    squareSummary: "1:1 等边方印自带庄重与契约感，缩小到 24px 图标或印在名片、建筑铭牌上都稳稳站住。",
    altLabel: "若强行拉成长横条",
    altSummary: "拉成宽条后，作为头像、印章或小徽标时两端发虚、识别面积骤减，反倒失去稳重气质。",
    drawSquare: () => `
      <rect x="65" y="18" width="130" height="130" fill="#254126"/>
      <rect x="83" y="36" width="94" height="94" fill="none" stroke="#FAF5E8" stroke-width="4"/>
      <rect x="114" y="67" width="32" height="32" fill="#DC6A0C"/>
      <text x="130" y="166" text-anchor="middle" fill="#1E6B45" font-size="11" font-family="IBM Plex Mono, monospace">1:1 徽标 · 缩放稳固</text>
    `,
    drawAlt: () => `
      <rect x="20" y="54" width="220" height="58" fill="#254126"/>
      <rect x="34" y="66" width="192" height="34" fill="none" stroke="#FAF5E8" stroke-width="2.5"/>
      <rect x="118" y="75" width="24" height="16" fill="#DC6A0C"/>
      <text x="130" y="166" text-anchor="middle" fill="#9C4200" font-size="11" font-family="IBM Plex Mono, monospace">扁条徽标 · 缩小易糊</text>
    `,
  },
  {
    id: "sprint",
    title: "百米冲刺海报",
    fit: "avoid",
    badge: "慎用方形",
    squareSummary: "把向前猛冲的动势硬塞进对称正方框里，四条等长直边瞬间把速度感「刹住」，像被关进展示柜。",
    altLabel: "改用斜向/菱形或倒三角",
    altSummary: "让画面打开斜线与锐角纵深（见 043 倒三角 / 044 菱形构图），冲刺方向立刻顺着斜边喷薄而出。",
    drawSquare: () => `
      <rect x="65" y="18" width="130" height="130" fill="#FAF5E8" stroke="#254126" stroke-width="6"/>
      <line x1="78" y1="83" x2="182" y2="83" stroke="#97A37D" stroke-width="2" stroke-dasharray="4 4"/>
      <polygon points="104,64 156,83 104,102" fill="#B23318"/>
      <text x="130" y="166" text-anchor="middle" fill="#B23318" font-size="11" font-family="IBM Plex Mono, monospace">等边直框 · 速度被锁死</text>
    `,
    drawAlt: () => `
      <rect x="24" y="24" width="212" height="120" fill="#FAF5E8" stroke="#43593D" stroke-width="2"/>
      <line x1="24" y1="136" x2="236" y2="34" stroke="#97A37D" stroke-width="2" stroke-dasharray="6 4"/>
      <polygon points="56,112 204,52 96,126" fill="#DC6A0C"/>
      <text x="130" y="166" text-anchor="middle" fill="#1E6B45" font-size="11" font-family="IBM Plex Mono, monospace">斜向势能 · 动感立现</text>
    `,
  },
  {
    id: "catalog",
    title: "器物系列图册",
    fit: "good",
    badge: "极适合方形",
    squareSummary: "高瓶、矮碗、方盒形态各异，一旦放进同尺寸 1:1 方形模块并保持四边均距，整面墙立刻统一成系列品牌感。",
    altLabel: "若各按器物外轮廓裁切",
    altSummary: "长条配扁框、大小高低参差不齐，读者的视线在碎框间跳来跳去，系列秩序感瞬间瓦解。",
    drawSquare: () => `
      <rect x="22" y="28" width="66" height="66" fill="#FAF5E8" stroke="#254126" stroke-width="3"/>
      <rect x="47" y="42" width="16" height="38" fill="#254126"/>
      <rect x="97" y="28" width="66" height="66" fill="#FAF5E8" stroke="#254126" stroke-width="3"/>
      <circle cx="130" cy="61" r="18" fill="#97A37D"/>
      <rect x="172" y="28" width="66" height="66" fill="#FAF5E8" stroke="#254126" stroke-width="3"/>
      <rect x="190" y="46" width="30" height="30" fill="#DC6A0C"/>
      <text x="130" y="166" text-anchor="middle" fill="#1E6B45" font-size="11" font-family="IBM Plex Mono, monospace">等方模块 · 系列高度统一</text>
    `,
    drawAlt: () => `
      <rect x="28" y="16" width="36" height="114" fill="#FAF5E8" stroke="#43593D" stroke-width="2"/>
      <rect x="40" y="34" width="12" height="78" fill="#254126"/>
      <rect x="78" y="64" width="84" height="44" fill="#FAF5E8" stroke="#43593D" stroke-width="2"/>
      <circle cx="120" cy="86" r="14" fill="#97A37D"/>
      <rect x="174" y="30" width="54" height="84" fill="#FAF5E8" stroke="#43593D" stroke-width="2"/>
      <rect x="188" y="56" width="26" height="32" fill="#DC6A0C"/>
      <text x="130" y="166" text-anchor="middle" fill="#9C4200" font-size="11" font-family="IBM Plex Mono, monospace">异形碎框 · 节奏凌乱</text>
    `,
  },
  {
    id: "horizon",
    title: "辽阔草原地平线",
    fit: "avoid",
    badge: "慎用方形",
    squareSummary: "把绵延数公里的横向地平线硬裁成 1:1，左右延展被齐刷刷砍断，天地开阔感一下子缩成了「井口看天」。",
    altLabel: "改用宽幅矩形构图",
    altSummary: "交给宽矩形画幅（见 046 矩形构图），地平线才能拉出左右呼吸与叙事纵深。",
    drawSquare: () => `
      <rect x="65" y="18" width="130" height="130" fill="#E6E6D2" stroke="#254126" stroke-width="5"/>
      <path d="M68,96 Q130,84 192,96 L192,145 L68,145 Z" fill="#97A37D"/>
      <circle cx="152" cy="54" r="10" fill="#DC6A0C"/>
      <line x1="62" y1="18" x2="62" y2="148" stroke="#B23318" stroke-width="2" stroke-dasharray="4 3"/>
      <line x1="198" y1="18" x2="198" y2="148" stroke="#B23318" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="130" y="166" text-anchor="middle" fill="#B23318" font-size="11" font-family="IBM Plex Mono, monospace">硬裁 1:1 · 两翼辽阔感被砍</text>
    `,
    drawAlt: () => `
      <rect x="16" y="42" width="228" height="88" fill="#E6E6D2" stroke="#254126" stroke-width="3"/>
      <path d="M18,96 Q88,82 150,92 T242,88 L242,128 L18,128 Z" fill="#97A37D"/>
      <circle cx="192" cy="64" r="9" fill="#DC6A0C"/>
      <text x="130" y="166" text-anchor="middle" fill="#1E6B45" font-size="11" font-family="IBM Plex Mono, monospace">宽幅矩形 · 地平线舒展</text>
    `,
  },
];

export function initFitCompareWidget() {
  const scenBtns = [...document.querySelectorAll("[data-fit-scen]")];
  const modeBtns = [...document.querySelectorAll("[data-fit-mode]")];
  const svg = document.getElementById("fit-compare-svg");
  const badge = document.getElementById("fit-compare-badge");
  const summary = document.getElementById("fit-compare-summary");
  const altBtn = document.querySelector('[data-fit-mode="alt"]');
  if (!svg || !scenBtns.length) return;

  let currentIdx = 0;
  let currentMode = "square";

  function render() {
    const s = FIT_SCENARIOS[currentIdx];
    scenBtns.forEach((b, i) => {
      const on = i === currentIdx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (altBtn) altBtn.textContent = s.altLabel;
    modeBtns.forEach((b) => {
      const on = b.dataset.fitMode === currentMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    badge.textContent = s.badge;
    badge.className = `fit-badge ${s.fit === "good" ? "is-good" : "is-avoid"}`;
    svg.innerHTML = `<rect width="260" height="176" fill="#FAF5E8"/>${currentMode === "square" ? s.drawSquare() : s.drawAlt()}`;
    summary.textContent = currentMode === "square" ? s.squareSummary : s.altSummary;
  }

  scenBtns.forEach((b) => b.addEventListener("click", () => {
    currentIdx = Number(b.dataset.fitScen);
    currentMode = "square";
    render();
  }));
  modeBtns.forEach((b) => b.addEventListener("click", () => {
    currentMode = b.dataset.fitMode;
    render();
  }));
  render();
}

// ==================== 06 节：三道单变量辨析小练习（中性 A/B/C/D 标签） ====================
// 严格遵守 BRIEF.md：每题 4 个选项只改变 1 个关键变量，标签只写 A / B / C / D，不透题！
const QUIZ_QUESTIONS = [
  {
    id: 1,
    prompt: "同一套品牌方印（1 枚中心主核 + 四角轻点缀），下面哪一版最符合方形构图的「边缘框定与留白一致」？",
    variableNote: "本题唯一变量：四边内边距的比例与一致性",
    answer: "A",
    options: [
      {
        key: "A",
        reason: "正确。四边边距均等约为 14%，既有清晰外框保护，又让内部模块与外框之间留出匀称的呼吸带。",
        draw: (reveal) => drawQuizMargin(0.14, 0.14, 0.14, 0.14, reveal, true),
      },
      {
        key: "B",
        reason: "B 错在「左右边距不齐」：左侧贴到 4%、右侧空出 24%，虽然总留白没变，但内芯整体滑向左边，秩序感立刻破功。",
        draw: (reveal) => drawQuizMargin(0.14, 0.24, 0.14, 0.04, reveal, false),
      },
      {
        key: "C",
        reason: "C 错在「四边过紧」：边距缩到仅 3%，四周点缀几乎粘在厚外框内壁上，框与内容挤成一团。",
        draw: (reveal) => drawQuizMargin(0.03, 0.03, 0.03, 0.03, reveal, false),
      },
      {
        key: "D",
        reason: "D 错在「四边过宽」：边距放大到 33%，把有效内容压成方框正中一小团米粒，留白沦为空荡。",
        draw: (reveal) => drawQuizMargin(0.33, 0.33, 0.33, 0.33, reveal, false),
      },
    ],
  },
  {
    id: 2,
    prompt: "在相同的 1:1 等边方框和 3×3 九宫格里组织一组信息卡片，哪一版在「主次关系与元素数量」上最站得住脚？",
    variableNote: "本题唯一变量：3×3 格内模块的填充数量与深浅层级",
    answer: "C",
    options: [
      {
        key: "A",
        reason: "A 错在「满塞平权」：9 格全部填满同等体量的方块，留白归零，视觉上立刻变成密不透风的方格砖墙。",
        draw: (reveal) => drawQuizGrid([1, 1, 1, 1, 2, 1, 1, 1, 1], reveal, false),
      },
      {
        key: "B",
        reason: "B 错在「多核争宠且中空」：四角同时放了 4 枚最重的深绿大块，正中反而空着，眼睛在四个角间反复横跳。",
        draw: (reveal) => drawQuizGrid([2, 0, 2, 0, 0, 0, 2, 0, 2], reveal, false),
      },
      {
        key: "C",
        reason: "正确。中央 1 枚深绿主核建立第一焦点，四角以浅苔藓次级模块对称呼应，其余 4 格留白呼吸，主次与节奏兼得。",
        draw: (reveal) => drawQuizGrid([1, 0, 1, 0, 2, 0, 1, 0, 1], reveal, true),
      },
      {
        key: "D",
        reason: "D 错在「单角孤立」：只剩左下角孤零零一块浅模块，其余 8 格空悬，既无焦点也无对称呼应。",
        draw: (reveal) => drawQuizGrid([0, 0, 0, 0, 0, 0, 1, 0, 0], reveal, false),
      },
    ],
  },
  {
    id: 3,
    prompt: "用方形框架陈列一组极简器物专题封面，哪一版真正做到了「方形等边 + 对称均衡」？",
    variableNote: "本题唯一变量：外框 1:1 比例与内部视觉重心分布",
    answer: "B",
    options: [
      {
        key: "A",
        reason: "A 错在「重块偏堆左半侧」：外框虽然是 1:1，但三件重器全压在左边，右边空荡，视觉重心严重左倾。",
        draw: (reveal) => drawQuizBalance("left", reveal),
      },
      {
        key: "B",
        reason: "正确。严格 1:1 等边厚框，中央稳立主器物，左右上下对称点缀配器与轴标，重量在四向完全配平。",
        draw: (reveal) => drawQuizBalance("ok", reveal),
      },
      {
        key: "C",
        reason: "C 错在「外框失方拉扁」：画框被横向拉成了 1.38:1 的扁矩形，方形构图特有的四向中立稳定感已消失。",
        draw: (reveal) => drawQuizBalance("wide", reveal),
      },
      {
        key: "D",
        reason: "D 错在「粗框反客为主」：双层过厚外框吞掉大半画芯面积，内部器物被勒得逼仄局促。",
        draw: (reveal) => drawQuizBalance("heavy", reveal),
      },
    ],
  },
];

function drawQuizMargin(mt, mr, mb, ml, reveal, isOk) {
  const S = 180;
  const b = 10;
  const iw = S - b * 2;
  const gx = b + iw * ml;
  const gy = b + iw * mt;
  const gw = iw * (1 - ml - mr);
  const gh = iw * (1 - mt - mb);
  const cs = Math.min(gw, gh) * 0.42;
  const cx = gx + (gw - cs) / 2;
  const cy = gy + (gh - cs) / 2;
  const d = Math.max(8, Math.min(gw, gh) * 0.16);
  let guide = "";
  if (reveal) {
    const col = isOk ? "#1E6B45" : "#B23318";
    guide = `
      <rect x="${b}" y="${b}" width="${iw * ml}" height="${iw}" fill="${col}" fill-opacity="0.22"/>
      <rect x="${S - b - iw * mr}" y="${b}" width="${iw * mr}" height="${iw}" fill="${col}" fill-opacity="0.22"/>
      <rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" fill="none" stroke="${col}" stroke-width="1.4" stroke-dasharray="3 2"/>
    `;
  }
  return `
    <rect width="${S}" height="${S}" fill="#FAF5E8"/>
    <rect x="${b / 2}" y="${b / 2}" width="${S - b}" height="${S - b}" fill="none" stroke="#254126" stroke-width="${b}"/>
    ${guide}
    <rect x="${gx}" y="${gy}" width="${d}" height="${d}" fill="#97A37D"/>
    <rect x="${gx + gw - d}" y="${gy}" width="${d}" height="${d}" fill="#97A37D"/>
    <rect x="${gx}" y="${gy + gh - d}" width="${d}" height="${d}" fill="#97A37D"/>
    <rect x="${gx + gw - d}" y="${gy + gh - d}" width="${d}" height="${d}" fill="#97A37D"/>
    <rect x="${cx}" y="${cy}" width="${cs}" height="${cs}" fill="#254126"/>
    <rect x="${cx + cs * 0.36}" y="${cy + cs * 0.36}" width="${cs * 0.28}" height="${cs * 0.28}" fill="#DC6A0C"/>
  `;
}

function drawQuizGrid(arr, reveal, isOk) {
  const S = 180;
  const b = 10;
  const pad = 16;
  const gx = b + pad;
  const gw = S - (b + pad) * 2;
  const gap = 6;
  const cw = (gw - gap * 2) / 3;
  const cells = arr.map((v, i) => {
    const r = Math.floor(i / 3);
    const c = i % 3;
    const x = gx + c * (cw + gap);
    const y = gx + r * (cw + gap);
    const fill = v === 2 ? "#254126" : v === 1 ? "#97A37D" : "none";
    const stroke = v === 0 ? "rgba(37,65,38,0.22)" : "none";
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cw.toFixed(1)}" height="${cw.toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
  }).join("");
  const ring = reveal
    ? `<rect x="${gx - 3}" y="${gx - 3}" width="${gw + 6}" height="${gw + 6}" fill="none" stroke="${isOk ? "#1E6B45" : "#B23318"}" stroke-width="1.6" stroke-dasharray="4 3"/>`
    : "";
  return `
    <rect width="${S}" height="${S}" fill="#FAF5E8"/>
    <rect x="${b / 2}" y="${b / 2}" width="${S - b}" height="${S - b}" fill="none" stroke="#254126" stroke-width="${b}"/>
    ${cells}${ring}
  `;
}

function drawQuizBalance(mode, reveal) {
  const S = 180;
  if (mode === "wide") {
    return `
      <rect width="${S}" height="${S}" fill="#EFE6CF"/>
      <rect x="8" y="34" width="164" height="112" fill="#FAF5E8" stroke="#254126" stroke-width="8"/>
      <rect x="74" y="68" width="32" height="44" fill="#254126"/>
      <rect x="34" y="76" width="22" height="28" fill="#97A37D"/>
      <rect x="124" y="76" width="22" height="28" fill="#97A37D"/>
      ${reveal ? `<rect x="34" y="34" width="112" height="112" fill="none" stroke="#B23318" stroke-width="1.6" stroke-dasharray="4 3"/>` : ""}
    `;
  }
  if (mode === "heavy") {
    return `
      <rect width="${S}" height="${S}" fill="#FAF5E8"/>
      <rect x="14" y="14" width="152" height="152" fill="none" stroke="#254126" stroke-width="28"/>
      <rect x="38" y="38" width="104" height="104" fill="none" stroke="#43593D" stroke-width="10"/>
      <rect x="74" y="72" width="32" height="36" fill="#254126"/>
      <rect x="85" y="85" width="10" height="10" fill="#DC6A0C"/>
      ${reveal ? `<rect x="44" y="44" width="92" height="92" fill="none" stroke="#B23318" stroke-width="1.6" stroke-dasharray="4 3"/>` : ""}
    `;
  }
  if (mode === "left") {
    return `
      <rect width="${S}" height="${S}" fill="#FAF5E8"/>
      <rect x="5" y="5" width="170" height="170" fill="none" stroke="#254126" stroke-width="10"/>
      <rect x="26" y="34" width="44" height="52" fill="#254126"/>
      <rect x="26" y="96" width="44" height="50" fill="#43593D"/>
      <rect x="78" y="62" width="32" height="56" fill="#97A37D"/>
      <rect x="134" y="84" width="12" height="12" fill="#DC6A0C"/>
      ${reveal ? `<line x1="90" y1="12" x2="90" y2="168" stroke="#B23318" stroke-width="1.5" stroke-dasharray="4 3"/><circle cx="62" cy="90" r="6" fill="none" stroke="#B23318" stroke-width="2"/>` : ""}
    `;
  }
  return `
    <rect width="${S}" height="${S}" fill="#FAF5E8"/>
    <rect x="5" y="5" width="170" height="170" fill="none" stroke="#254126" stroke-width="10"/>
    <rect x="68" y="64" width="44" height="52" fill="#254126"/>
    <rect x="30" y="32" width="28" height="28" fill="#97A37D"/>
    <rect x="122" y="32" width="28" height="28" fill="#97A37D"/>
    <rect x="30" y="120" width="28" height="28" fill="#97A37D"/>
    <rect x="122" y="120" width="28" height="28" fill="#97A37D"/>
    <rect x="85" y="38" width="10" height="10" fill="#DC6A0C"/>
    <rect x="85" y="132" width="10" height="10" fill="#DC6A0C"/>
    ${reveal ? `<line x1="90" y1="12" x2="90" y2="168" stroke="#1E6B45" stroke-width="1.4" stroke-dasharray="4 3"/><line x1="12" y1="90" x2="168" y2="90" stroke="#1E6B45" stroke-width="1.4" stroke-dasharray="4 3"/>` : ""}
  `;
}

export function initQuizWidget() {
  const qTabs = [...document.querySelectorAll("[data-quiz-idx]")];
  const promptEl = document.getElementById("quiz-prompt");
  const varNoteEl = document.getElementById("quiz-var-note");
  const gridEl = document.getElementById("quiz-options");
  const fbEl = document.getElementById("quiz-feedback");
  const scoreEl = document.getElementById("quiz-score");
  if (!gridEl || !qTabs.length) return;

  let cur = 0;
  const picks = new Map();

  function updateScore() {
    let correct = 0;
    for (const q of QUIZ_QUESTIONS) {
      if (picks.get(q.id) === q.answer) correct++;
    }
    scoreEl.textContent = `已答 ${picks.size} / ${QUIZ_QUESTIONS.length} · 正确 ${correct}`;
  }

  function render() {
    const q = QUIZ_QUESTIONS[cur];
    const chosen = picks.get(q.id) || null;
    const revealed = chosen !== null;

    qTabs.forEach((b, i) => {
      const on = i === cur;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    promptEl.textContent = `第 ${q.id} 题：${q.prompt}`;
    varNoteEl.textContent = q.variableNote;

    gridEl.innerHTML = q.options.map((opt) => {
      const isChosen = chosen === opt.key;
      const isAnswer = opt.key === q.answer;
      let cls = "quiz-card";
      if (revealed) {
        if (isAnswer) cls += " is-correct";
        else if (isChosen) cls += " is-wrong";
      }
      return `
        <button type="button" class="${cls}" data-quiz-opt="${opt.key}" aria-pressed="${isChosen}">
          <span class="quiz-key">${opt.key}</span>
          <svg viewBox="0 0 180 180" aria-hidden="true">${opt.draw(revealed)}</svg>
        </button>
      `;
    }).join("");

    gridEl.querySelectorAll("[data-quiz-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picks.set(q.id, btn.dataset.quizOpt);
        render();
      });
    });

    if (!revealed) {
      fbEl.className = "quiz-feedback";
      fbEl.textContent = "先仔细看四张图的唯一差异，点选 A / B / C / D；选完后画框会自动叠出辅助标尺并说明原因。";
    } else {
      const opt = q.options.find((o) => o.key === chosen);
      const ok = chosen === q.answer;
      fbEl.className = `quiz-feedback ${ok ? "is-ok" : "is-wrong"}`;
      fbEl.innerHTML = `<strong>${ok ? `选对了（${chosen}）` : `选的是 ${chosen}，正确答案是 ${q.answer}`}</strong>：${opt.reason}${ok ? "" : ` — ${q.options.find((o) => o.key === q.answer).reason}`}`;
    }
    updateScore();
  }

  qTabs.forEach((b) => b.addEventListener("click", () => {
    cur = Number(b.dataset.quizIdx);
    render();
  }));
  render();
}

// ==================== 07 节：原海报全屏可拖拽缩放看图器 ====================
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-open-btn");
  const posterImg = document.getElementById("poster");
  const dialog = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const lbStage = document.getElementById("lightbox-stage");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomInBtn = document.getElementById("lightbox-zoom-in");
  const zoomOutBtn = document.getElementById("lightbox-zoom-out");
  const resetBtn = document.getElementById("lightbox-reset");
  const zoomReadout = document.getElementById("lightbox-zoom-val");
  if (!posterImg || !dialog || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomReadout) zoomReadout.textContent = `${Math.round(scale * 100)}%`;
  }

  function openLightbox() {
    lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.hidden = false;
    closeBtn?.focus();
  }

  function closeLightbox() {
    dialog.hidden = true;
    trigger?.focus();
  }

  trigger?.addEventListener("click", openLightbox);
  posterImg.addEventListener("click", openLightbox);
  closeBtn?.addEventListener("click", closeLightbox);
  dialog.addEventListener("click", (ev) => {
    if (ev.target === dialog || ev.target === lbStage) closeLightbox();
  });
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !dialog.hidden) closeLightbox();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3.2, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  resetBtn?.addEventListener("click", () => {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  });

  lbStage?.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    const delta = ev.deltaY < 0 ? 0.18 : -0.18;
    scale = Math.max(0.8, Math.min(3.2, +(scale + delta).toFixed(2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  lbImg.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    drag = { id: ev.pointerId, sx: ev.clientX - tx, sy: ev.clientY - ty };
    if (lbImg.setPointerCapture) {
      try { lbImg.setPointerCapture(ev.pointerId); } catch {}
    }
  });
  lbImg.addEventListener("pointermove", (ev) => {
    if (!drag || ev.pointerId !== drag.id) return;
    tx = ev.clientX - drag.sx;
    ty = ev.clientY - drag.sy;
    applyTransform();
  });
  lbImg.addEventListener("pointerup", () => { drag = null; });
  lbImg.addEventListener("pointercancel", () => { drag = null; });
}

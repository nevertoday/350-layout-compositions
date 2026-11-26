// 256 双列页面 · 正文 01–07 节专属交互模块
// 每节采用不同交互机制，相邻两节绝不复用同一类控件。

import { loop, pixelRatio } from "../../lib/stage.js";

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

// =========================================================================
// 01 为什么两栏比宽单栏好扫 · 任务对照画布（3 任务切卡 + 实时视线行程对照）
// =========================================================================
const S1_TASKS = {
  compare: {
    id: "compare",
    title: "方案参数对照",
    singleNote: "单列排布：A 方案在上、B 方案在下，每核对一项参数眼睛都要大幅度上下回翻，短时记忆反复重置。",
    dualNote: "双列排布：两套方案沿同一条水平基线并置，眼球只需跨过一道清晰中缝做短距横跳，对比一气呵成。",
    singleHops: "上下反复折返 · 行程长（示意）",
    dualHops: "平齐横跳核对 · 行程短（示意）",
  },
  bilingual: {
    id: "bilingual",
    title: "双语平行对读",
    singleNote: "单列混排：中文一段接英文一段，整行拉满宽屏后折返距离过长，想查对应译句还得来回找段落。",
    dualNote: "双列对读：中文居左、英文居右，各占舒适行宽；读完左句一眼即见右译，原海报「自然与生活」即用此法。",
    singleHops: "满屏长行回扫 · 易串行（示意）",
    dualHops: "短行逐段对位 · 视野收束（示意）",
  },
  annotate: {
    id: "annotate",
    title: "主文配旁注",
    singleNote: "单列文末附注：正文读到一半要跳到页尾找注释，再翻回原行续读，思路很容易被打断。",
    dualNote: "60:40 主次双列：左栏 60% 专注正文，右栏 40% 平行放置图示与要点说明，主次分明且不打断阅读。",
    singleHops: "中断跳底查注 · 易迷路（示意）",
    dualHops: "同高瞥读旁注 · 即看即回（示意）",
  },
};

export function initSection01() {
  const canvas = document.getElementById("s1Canvas");
  const buttons = [...document.querySelectorAll("[data-s1-task]")];
  const singleNoteEl = document.getElementById("s1SingleNote");
  const dualNoteEl = document.getElementById("s1DualNote");
  const singleTagEl = document.getElementById("s1SingleTag");
  const dualTagEl = document.getElementById("s1DualTag");
  if (!canvas) return;

  let active = "compare";
  const ctx = canvas.getContext("2d");
  let w = 600, h = 248, dpr = 1;

  function measure() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    dpr = pixelRatio(w < 500 ? 1.5 : 2);
    const tw = Math.round(w * dpr), th = Math.round(h * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }
  }
  measure();

  function syncText() {
    const info = S1_TASKS[active];
    if (singleNoteEl) singleNoteEl.textContent = info.singleNote;
    if (dualNoteEl) dualNoteEl.textContent = info.dualNote;
    if (singleTagEl) singleTagEl.textContent = info.singleHops;
    if (dualTagEl) dualTagEl.textContent = info.dualHops;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s1Task === active)));
  }

  function draw(t, _dt, { still }) {
    if (!canvas.width || !canvas.height) measure();

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#FAF5EA";
    ctx.fillRect(0, 0, w, h);

    const stack = w < 540;
    const pad = 16;
    const gap = 16;
    const boxW = stack ? w - pad * 2 : (w - pad * 2 - gap) / 2;
    const boxH = stack ? (h - pad * 2 - gap) / 2 : h - pad * 2;
    const leftBox = { x: pad, y: pad, w: boxW, h: boxH };
    const rightBox = stack ? { x: pad, y: pad + boxH + gap, w: boxW, h: boxH } : { x: pad + boxW + gap, y: pad, w: boxW, h: boxH };

    const phase = still ? 0.55 : (t * 0.28) % 1;

    // 左框：宽单列排布
    rr(ctx, leftBox.x, leftBox.y, leftBox.w, leftBox.h, 4);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#D4CFC2";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = `600 11px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#5A584F";
    ctx.textBaseline = "top";
    ctx.fillText("宽幅单列 · 纵向叠放", leftBox.x + 12, leftBox.y + 10);

    const sx = leftBox.x + 14;
    const sw = leftBox.w - 28;
    const sy0 = leftBox.y + 34;
    const rowH = Math.max(10, (leftBox.h - 54) / 7);

    // 上段块 A
    ctx.fillStyle = "#235436";
    ctx.fillRect(sx, sy0, sw * 0.36, 7);
    ctx.fillStyle = "#D7DDD1";
    for (let i = 1; i <= 2; i++) ctx.fillRect(sx, sy0 + i * rowH, sw * (i === 2 ? 0.92 : 0.98), 5);

    // 下段块 B（垂直相距甚远）
    const syB = sy0 + rowH * 4;
    ctx.fillStyle = "#8A5600";
    ctx.fillRect(sx, syB, sw * 0.36, 7);
    ctx.fillStyle = "#E6DCC6";
    for (let i = 1; i <= 2; i++) ctx.fillRect(sx, syB + i * rowH, sw * (i === 2 ? 0.88 : 0.96), 5);

    // 单列长距离回扫 / 纵向往返红虚线
    const sPts =
      active === "bilingual"
        ? [
            [sx + 6, sy0 + rowH + 2],
            [sx + sw - 6, sy0 + rowH + 2],
            [sx + 6, sy0 + rowH * 2 + 2],
            [sx + sw - 12, sy0 + rowH * 2 + 2],
            [sx + 6, syB + rowH + 2],
          ]
        : [
            [sx + sw * 0.25, sy0 + rowH + 2],
            [sx + sw * 0.72, sy0 + rowH + 2],
            [sx + sw * 0.28, syB + rowH + 2],
            [sx + sw * 0.74, sy0 + rowH * 2 + 2],
            [sx + sw * 0.3, syB + rowH * 2 + 2],
          ];

    ctx.strokeStyle = "rgba(182, 51, 34, 0.65)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    sPts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.stroke();
    ctx.setLineDash([]);

    // 动点（单列）
    {
      const seg = phase * (sPts.length - 1);
      const idx = Math.min(sPts.length - 2, Math.floor(seg));
      const f = seg - idx;
      const gx = sPts[idx][0] + (sPts[idx + 1][0] - sPts[idx][0]) * f;
      const gy = sPts[idx][1] + (sPts[idx + 1][1] - sPts[idx][1]) * f;
      ctx.fillStyle = "#B63322";
      ctx.beginPath();
      ctx.arc(gx, gy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 右框：双列平行排布
    rr(ctx, rightBox.x, rightBox.y, rightBox.w, rightBox.h, 4);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#235436";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "#1B432A";
    ctx.fillText(active === "annotate" ? "60:40 主次双列 · 同高旁注" : "50:50 平行双列 · 基线对齐", rightBox.x + 12, rightBox.y + 10);

    const dx = rightBox.x + 14;
    const dw = rightBox.w - 28;
    const dGap = 18;
    const ratio = active === "annotate" ? 0.6 : 0.5;
    const c1W = (dw - dGap) * ratio;
    const c2W = dw - dGap - c1W;
    const c2X = dx + c1W + dGap;
    const dy0 = rightBox.y + 34;

    // 清晰中缝河道
    ctx.fillStyle = "rgba(177, 195, 166, 0.24)";
    ctx.fillRect(dx + c1W, dy0 - 4, dGap, rightBox.h - 46);
    ctx.strokeStyle = "#B1C3A6";
    ctx.beginPath();
    ctx.moveTo(dx + c1W + dGap / 2, dy0 - 4);
    ctx.lineTo(dx + c1W + dGap / 2, rightBox.y + rightBox.h - 12);
    ctx.stroke();

    // 左栏
    ctx.fillStyle = "#235436";
    ctx.fillRect(dx, dy0, c1W * 0.65, 7);
    ctx.fillStyle = "#C9D6C0";
    for (let i = 1; i <= 4; i++) ctx.fillRect(dx, dy0 + i * rowH, c1W * (i === 4 ? 0.72 : 0.92), 5);

    // 右栏（齐顶对齐）
    ctx.fillStyle = "#EDB146";
    ctx.fillRect(c2X, dy0, c2W * 0.68, 7);
    ctx.fillStyle = active === "annotate" ? "#EFE6D0" : "#D6DFCF";
    if (active === "annotate") {
      ctx.fillRect(c2X, dy0 + rowH, c2W * 0.92, rowH * 2.1);
      ctx.fillStyle = "#B1C3A6";
      ctx.fillRect(c2X, dy0 + rowH * 3.5, c2W * 0.8, 5);
    } else {
      for (let i = 1; i <= 4; i++) ctx.fillRect(c2X, dy0 + i * rowH, c2W * (i === 4 ? 0.68 : 0.92), 5);
    }

    // 双列短距平齐横跳绿虚线
    const dPts = [
      [dx + c1W * 0.35, dy0 + rowH + 2],
      [c2X + c2W * 0.35, dy0 + rowH + 2],
      [dx + c1W * 0.35, dy0 + rowH * 2 + 2],
      [c2X + c2W * 0.35, dy0 + rowH * 2 + 2],
      [dx + c1W * 0.35, dy0 + rowH * 3 + 2],
      [c2X + c2W * 0.35, dy0 + rowH * 3 + 2],
    ];
    ctx.strokeStyle = "rgba(35, 84, 54, 0.75)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    dPts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.stroke();
    ctx.setLineDash([]);

    // 动点（双列）
    {
      const seg = phase * (dPts.length - 1);
      const idx = Math.min(dPts.length - 2, Math.floor(seg));
      const f = seg - idx;
      const gx = dPts[idx][0] + (dPts[idx + 1][0] - dPts[idx][0]) * f;
      const gy = dPts[idx][1] + (dPts[idx + 1][1] - dPts[idx][1]) * f;
      ctx.fillStyle = "#235436";
      ctx.beginPath();
      ctx.arc(gx, gy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#F5BA53";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  const ctrl = loop(canvas, draw);
  new ResizeObserver(() => {
    measure();
    ctrl.draw();
  }).observe(canvas);
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      active = btn.dataset.s1Task;
      syncText();
      ctrl.draw();
    });
  });
  syncText();
}

// =========================================================================
// 02 比例、中缝与对齐铁律 · 原海报线框蓝图检视器（结构切开关 + 实时 CSS）
// =========================================================================
const S2_MODES = {
  "50-50": {
    cols: "1fr 1fr",
    leftPct: 50,
    label: "50 : 50 对等分栏",
    use: "双语对读、AB 方案对比、同类并列分类。两栏权重相等，更依赖齐平基线与相近的视觉墨量。",
  },
  "60-40": {
    cols: "3fr 2fr",
    leftPct: 60,
    label: "60 : 40 主次分栏",
    use: "左栏承载核心正文或商品详情，右栏放置摘要、目录、参数表或行动卡片；保留足够阅读行宽又不喧宾夺主。",
  },
  "38-62": {
    cols: "38fr 62fr",
    leftPct: 38,
    label: "38 : 62 左导右展",
    use: "左栏做提纲、筛选或图例，右栏留给大幅视觉作品与展开示例——256 原海报自身的大骨架即近似此比例。",
  },
};

export function initSection02() {
  const root = document.getElementById("s2Blueprint");
  if (!root) return;
  const modeBtns = [...document.querySelectorAll("[data-s2-mode]")];
  const toggles = [...document.querySelectorAll("[data-s2-toggle]")];
  const wireGrid = document.getElementById("s2WireGrid");
  const descEl = document.getElementById("s2ModeDesc");
  const cssEl = document.getElementById("s2CssOut");
  const statusEl = document.getElementById("s2WireStatus");

  const st = {
    mode: "50-50",
    topAlign: true,
    baseline: true,
    safeGutter: true,
    divider: true,
  };

  function sync() {
    const m = S2_MODES[st.mode];
    modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s2Mode === st.mode)));
    toggles.forEach((t) => {
      const k = t.dataset.s2Toggle;
      t.setAttribute("aria-pressed", String(!!st[k]));
    });
    if (descEl) descEl.textContent = m.use;
    if (wireGrid) {
      wireGrid.style.gridTemplateColumns = m.cols;
      wireGrid.style.columnGap = st.safeGutter ? "28px" : "4px";
      wireGrid.dataset.topAlign = st.topAlign ? "on" : "off";
      wireGrid.dataset.baseline = st.baseline ? "on" : "off";
      wireGrid.dataset.divider = st.divider ? "on" : "off";
      wireGrid.dataset.gutter = st.safeGutter ? "safe" : "tight";
    }
    if (cssEl) {
      const lines = [
        `.two-col {`,
        `  display: grid;`,
        `  grid-template-columns: ${m.cols};`,
        `  column-gap: ${st.safeGutter ? "2rem /* 32px 安全中缝 */" : "4px /* 警告：窄于行距易串行 */"};`,
        `  align-items: ${st.topAlign ? "start" : "start /* 右栏人为下移 28px */"};`,
        `}`,
        st.divider ? `.two-col-right { border-left: 1px solid #ACA9A1; padding-left: 1.5rem; }` : `/* 仅靠留白中缝分隔，不画中线 */`,
      ];
      cssEl.textContent = lines.join("\n");
    }
    if (statusEl) {
      const warns = [];
      if (!st.safeGutter) warns.push("中缝过窄易串行");
      if (!st.topAlign) warns.push("右栏顶沿失齐");
      statusEl.textContent = warns.length ? `结构警示：${warns.join(" · ")}` : `${m.label} · 秩序完整`;
      statusEl.dataset.state = warns.length ? "warn" : "ok";
    }
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.mode = b.dataset.s2Mode;
      sync();
    })
  );
  toggles.forEach((t) =>
    t.addEventListener("click", () => {
      const k = t.dataset.s2Toggle;
      st[k] = !st[k];
      sync();
    })
  );
  sync();
}

// =========================================================================
// 03 眼动偏左与扫描陷阱 · 深林暗室眼动回放台（模式切换 + 播放/暂停 + 步进器）
// =========================================================================
const S3_PATTERNS = {
  aligned: {
    id: "aligned",
    name: "齐边双栏（左锚清晰）",
    hops: 5,
    leftShare: "左重右辅 · 路径笔直（示意）",
    summary: "所有标题对齐同一条左轴，右侧配图与摘要始终留在右栏。眼球顺左栏垂直速扫即可收齐全部小标题，无需每行重新寻找文字起点。",
    // 归一化坐标 [x, y, 停留权重]
    stops: [
      [0.18, 0.22, 1.0],
      [0.42, 0.22, 0.72],
      [0.18, 0.48, 0.92],
      [0.18, 0.74, 0.84],
      [0.72, 0.48, 0.55],
    ],
  },
  zigzag: {
    id: "zigzag",
    name: "交错之字形（Zigzag）",
    hops: 8,
    leftShare: "左右折返 · 扫视多跳（示意）",
    summary: "图左文右与文左图右逐行交替。Kim Flaherty（NN/g，2017）的眼动测试指出，此类交错排布会迫使眼睛每换一行就重新定位文字起边，扫描效率低于整齐纵向对齐的双栏。",
    stops: [
      [0.18, 0.2, 0.9],
      [0.72, 0.2, 0.78],
      [0.62, 0.45, 0.64],
      [0.2, 0.45, 0.85],
      [0.74, 0.45, 0.55],
      [0.24, 0.72, 0.82],
      [0.7, 0.72, 0.76],
      [0.34, 0.84, 0.52],
    ],
  },
  rightblind: {
    id: "rightblind",
    name: "右栏孤立失焦",
    hops: 4,
    leftShare: "左偏约八成 · 右栏易漏（示意）",
    summary: "NN/g（Jakob Nielsen 2010；Therese Fessenden 2017）眼动研究显示，桌面端用户将约八成水平观看时间留在页面左半侧。把关键结论塞进像广告条的孤立右栏，极易被整栏忽略。",
    stops: [
      [0.18, 0.2, 1.0],
      [0.38, 0.22, 0.82],
      [0.18, 0.52, 0.92],
      [0.22, 0.78, 0.86],
    ],
  },
};

export function initSection03() {
  const canvas = document.getElementById("s3Canvas");
  const modeBtns = [...document.querySelectorAll("[data-s3-mode]")];
  const playBtn = document.getElementById("s3PlayBtn");
  const stepInput = document.getElementById("s3StepRange");
  const stepOut = document.getElementById("s3StepOut");
  const summaryEl = document.getElementById("s3Summary");
  const metricEl = document.getElementById("s3Metric");
  if (!canvas) return;

  let mode = "aligned";
  let playing = true;
  let progress = 1; // 0..stops.length
  const ctx = canvas.getContext("2d");
  let w = 600, h = 290, dpr = 1;

  function measure() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    dpr = pixelRatio(w < 500 ? 1.5 : 2);
    const tw = Math.round(w * dpr), th = Math.round(h * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }
  }
  measure();

  function syncInfo() {
    const p = S3_PATTERNS[mode];
    modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s3Mode === mode)));
    if (summaryEl) summaryEl.textContent = p.summary;
    if (metricEl) metricEl.textContent = p.leftShare;
    if (stepInput) {
      stepInput.max = String(p.stops.length);
      stepInput.value = String(Math.max(1, Math.min(p.stops.length, Math.ceil(progress))));
    }
    if (stepOut) stepOut.textContent = `停顿 ${Math.max(1, Math.min(p.stops.length, Math.ceil(progress)))} / ${p.stops.length}（示意）`;
    if (playBtn) playBtn.textContent = playing ? "暂停回放" : "继续回放";
  }

  function draw(_t, dt, { still }) {
    if (!canvas.width || !canvas.height) measure();

    const p = S3_PATTERNS[mode];
    if (still) {
      progress = p.stops.length;
    } else if (playing && dt > 0) {
      progress += dt * 1.15;
      if (progress > p.stops.length + 1.2) progress = 0.2;
      if (stepInput && document.activeElement !== stepInput) {
        stepInput.value = String(Math.max(1, Math.min(p.stops.length, Math.ceil(progress))));
      }
      if (stepOut) {
        stepOut.textContent = `停顿 ${Math.max(1, Math.min(p.stops.length, Math.ceil(progress)))} / ${p.stops.length}（示意）`;
      }
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 深林暗室底
    ctx.fillStyle = "#0F291A";
    ctx.fillRect(0, 0, w, h);

    // 柔和左半屏注意力区指示（水平中心虚线）
    const midX = w * 0.5;
    ctx.fillStyle = "rgba(185, 212, 176, 0.05)";
    ctx.fillRect(0, 0, midX, h);
    ctx.strokeStyle = "rgba(185, 212, 176, 0.22)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(midX, 12);
    ctx.lineTo(midX, h - 12);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `500 10.5px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#B9D4B0";
    ctx.textBaseline = "top";
    ctx.fillText("左半屏 · 主注意区", 14, 10);
    ctx.fillStyle = "rgba(247, 199, 104, 0.85)";
    ctx.fillText("右半屏 · 次注意区", midX + 12, 10);

    // 绘制三种模式对应的示意版面骨架
    const padX = Math.round(w * 0.07);
    const colGap = 24;
    const colW = (w - padX * 2 - colGap) / 2;
    const lx = padX;
    const rx = padX + colW + colGap;

    const drawTextBlock = (x, y, bw, accent) => {
      ctx.fillStyle = accent;
      ctx.fillRect(x, y, bw * 0.58, 8);
      ctx.fillStyle = "rgba(235, 242, 232, 0.34)";
      ctx.fillRect(x, y + 16, bw * 0.92, 5);
      ctx.fillRect(x, y + 27, bw * 0.78, 5);
    };
    const drawImgBlock = (x, y, bw, bh) => {
      rr(ctx, x, y, bw, bh, 4);
      ctx.fillStyle = "rgba(149, 174, 143, 0.22)";
      ctx.fill();
      ctx.strokeStyle = "rgba(185, 212, 176, 0.32)";
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const rows = [0.17, 0.43, 0.69];
    if (mode === "aligned") {
      rows.forEach((ry) => {
        drawTextBlock(lx, h * ry, colW, "#B9D4B0");
        drawImgBlock(rx, h * ry, colW, h * 0.17);
      });
    } else if (mode === "zigzag") {
      rows.forEach((ry, i) => {
        if (i % 2 === 0) {
          drawTextBlock(lx, h * ry, colW, "#F7C768");
          drawImgBlock(rx, h * ry, colW, h * 0.17);
        } else {
          drawImgBlock(lx, h * ry, colW, h * 0.17);
          drawTextBlock(rx, h * ry, colW, "#F7C768");
        }
      });
    } else {
      rows.forEach((ry) => drawTextBlock(lx, h * ry, colW * 1.18, "#B9D4B0"));
      // 孤立窄右栏（形似广告侧盒）
      const adX = lx + colW * 1.18 + 26;
      const adW = Math.max(54, w - padX - adX);
      rr(ctx, adX, h * 0.17, adW, h * 0.56, 4);
      ctx.fillStyle = "rgba(255, 138, 122, 0.12)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 138, 122, 0.48)";
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#FFB4A8";
      ctx.font = `600 10.5px "Noto Sans SC", sans-serif`;
      ctx.fillText("易被跳过", adX + 8, h * 0.42);
    }

    // 眼动注视热晕与跳视路径（按 progress 绘制到当前步）
    const visCount = Math.max(1, Math.min(p.stops.length, Math.ceil(progress)));
    const pts = p.stops.slice(0, visCount).map(([ux, uy, wt]) => ({ x: ux * w, y: uy * h, wt }));

    // 轨迹连线
    ctx.strokeStyle = mode === "zigzag" ? "#FF8A7A" : "#F7C768";
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();

    // 热区圈 + 序号
    pts.forEach((pt, i) => {
      const r = 16 + pt.wt * 18;
      const grad = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, r);
      grad.addColorStop(0, mode === "zigzag" ? "rgba(255, 138, 122, 0.58)" : "rgba(247, 199, 104, 0.58)");
      grad.addColorStop(1, "rgba(247, 199, 104, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = mode === "zigzag" ? "#FF8A7A" : "#F7C768";
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0F291A";
      ctx.font = `700 10.5px "IBM Plex Mono", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), pt.x, pt.y + 0.5);
    });
    ctx.textAlign = "left";
    ctx.restore();
  }

  const ctrl = loop(canvas, draw);
  new ResizeObserver(() => {
    measure();
    ctrl.draw();
  }).observe(canvas);

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.s3Mode;
      progress = 1;
      syncInfo();
      ctrl.draw();
    });
  });
  playBtn?.addEventListener("click", () => {
    playing = !playing;
    syncInfo();
    ctrl.draw();
  });
  stepInput?.addEventListener("input", () => {
    playing = false;
    progress = Number(stepInput.value);
    syncInfo();
    ctrl.draw();
  });

  syncInfo();
}

// =========================================================================
// 04 双列版式从哪来 · 四纪元横轴切页与结构蓝图演进
// =========================================================================
const S4_ERAS = {
  "1455": {
    year: "约 1455",
    place: "美因茨 · 活字印刷开端",
    title: "《古腾堡四十二行圣经》：用双栏驯服大开本",
    body: "约翰内斯·古腾堡印制的四十二行拉丁文圣经承袭了中世纪手抄大开本的双栏传统：每页两栏、每栏 42 行。大开本如果通栏排满，单行会宽到难以顺畅回扫；中缝把行宽一分为二，同时让羊皮纸与纸张利用率更高。",
    source: "核实来源：美国国会图书馆（Library of Congress）古腾堡圣经特展档案。",
    spec: "2 栏 × 42 行 · 中缝留白分割 · 手工补绘红蓝章首",
  },
  "1981": {
    year: "1981",
    place: "瑞士 · 国际主义排版风格",
    title: "米勒-布罗克曼《平面设计中的网格系统》",
    body: "瑞士设计师约瑟夫·米勒-布罗克曼在 1981 年由 Niggli 出版社首版《Rastersysteme für die visuelle Gestaltung》，将双栏与多栏版面从直觉推向数学网格：栏宽、中缝与页边距按字号和行距严格换算，证明非等宽的双栏同样能靠对齐和比例取得稳健秩序。",
    source: "核实来源：Niggli Verlag 出版社 1981 年原版书目信息（ISBN 978-3721201451）。",
    spec: "模数网格 · 中缝 ≥ 行距 · 不对称两栏配图法",
  },
  "2010": {
    year: "2010",
    place: "互联网 · 移动终端普及",
    title: "伊桑·马科特提出「响应式网页设计」",
    body: "2010 年 5 月 25 日，伊桑·马科特在《A List Apart》发表《Responsive Web Design》，把流式网格、弹性图片与媒体查询合成一套方法。自此，网页双列不再假定屏幕永远宽大——到了手机竖屏必须优雅折回单列，避免两栏互相压碎。",
    source: "核实来源：A List Apart 原文（2010-05-25）。",
    spec: "流式百分比宽 + @media 断点折叠（双列 → 单列）",
  },
  "2017": {
    year: "2016–2017",
    place: "W3C · 现代二维布局标准",
    title: "CSS Grid Level 1 终结表格与浮动拼凑时代",
    body: "W3C 于 2016 年 9 月 29 日发布 CSS Grid Layout Level 1 首版候选推荐标准，2017 年主流浏览器全面支持。早期靠 table 与 float 拼出两栏时动辄错位塌陷；如今一行 grid-template-columns 与 column-gap 就能原生锁死栏比、中缝与顶沿对齐。",
    source: "核实来源：W3C CSS Grid Layout Module Level 1 规范文档。",
    spec: "grid-template-columns: 3fr 2fr; column-gap: 2rem;",
  },
};

export function initSection04() {
  const btns = [...document.querySelectorAll("[data-s4-era]")];
  const yearEl = document.getElementById("s4Year");
  const placeEl = document.getElementById("s4Place");
  const titleEl = document.getElementById("s4Title");
  const bodyEl = document.getElementById("s4Body");
  const srcEl = document.getElementById("s4Source");
  const specEl = document.getElementById("s4Spec");
  const diagrams = [...document.querySelectorAll("[data-s4-diagram]")];
  if (!btns.length) return;

  let active = "1455";
  function sync() {
    const e = S4_ERAS[active];
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s4Era === active)));
    if (yearEl) yearEl.textContent = e.year;
    if (placeEl) placeEl.textContent = e.place;
    if (titleEl) titleEl.textContent = e.title;
    if (bodyEl) bodyEl.textContent = e.body;
    if (srcEl) srcEl.textContent = e.source;
    if (specEl) specEl.textContent = e.spec;
    diagrams.forEach((d) => {
      d.hidden = d.dataset.s4Diagram !== active;
    });
  }
  btns.forEach((b) =>
    b.addEventListener("click", () => {
      active = b.dataset.s4Era;
      sync();
    })
  );
  sync();
}

// =========================================================================
// 05 什么时候用，什么时候别用 · 窄屏折叠试炼器（视口滑尺 + 策略切开关 + 场景）
// =========================================================================
export function initSection05() {
  const widthInput = document.getElementById("s5WidthRange");
  const widthOut = document.getElementById("s5WidthOut");
  const strategyBtns = [...document.querySelectorAll("[data-s5-strategy]")];
  const contentBtns = [...document.querySelectorAll("[data-s5-content]")];
  const frame = document.getElementById("s5PreviewFrame");
  const grid = document.getElementById("s5PreviewGrid");
  const verdictEl = document.getElementById("s5Verdict");
  if (!widthInput || !frame || !grid) return;

  const st = {
    vw: 400,
    strategy: "force2", // "force2" 硬撑双栏 | "responsive" 响应式折单列
    content: "form",    // "form" 顺序表单 | "compare" 方案对比
  };

  function sync() {
    widthOut.textContent = `${st.vw}px`;
    strategyBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s5Strategy === st.strategy)));
    contentBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s5Content === st.content)));

    // 真实按比例缩放预览视口框（桌面最宽 100%，按 1040px 归一）
    const pct = Math.max(36, Math.min(100, Math.round((st.vw / 1040) * 100)));
    frame.style.width = `${pct}%`;

    const shouldCollapse = st.strategy === "responsive" && st.vw < 640;
    const forceOneColForm = st.strategy === "responsive" && st.content === "form";
    const isSingle = shouldCollapse || forceOneColForm;

    grid.dataset.cols = isSingle ? "1" : "2";
    grid.dataset.content = st.content;

    if (st.content === "form") {
      grid.innerHTML = isSingle
        ? `
          <div class="s5-field"><span class="s5-lbl">1. 收件人姓名</span><span class="s5-box">陈默</span></div>
          <div class="s5-field"><span class="s5-lbl">2. 联系电话</span><span class="s5-box">138-0000-2560</span></div>
          <div class="s5-field"><span class="s5-lbl">3. 邮寄地址</span><span class="s5-box">上海市静安区常德路 256 号</span></div>
          <div class="s5-field"><span class="s5-lbl">4. 发票抬头</span><span class="s5-box">个人 / 电子普票</span></div>
        `
        : `
          <div class="s5-field"><span class="s5-lbl">1. 姓名</span><span class="s5-box">陈默</span></div>
          <div class="s5-field"><span class="s5-lbl">2. 电话</span><span class="s5-box">138-0000...</span></div>
          <div class="s5-field"><span class="s5-lbl">3. 地址</span><span class="s5-box">上海市静安...</span></div>
          <div class="s5-field"><span class="s5-lbl">4. 抬头</span><span class="s5-box">电子普票</span></div>
        `;
    } else {
      grid.innerHTML = `
        <div class="s5-plan">
          <div class="s5-plan-hd">标准版 · ¥68</div>
          <div class="s5-plan-tx">离线单文件导出、12 套网格模板、个人项目商用授权。</div>
        </div>
        <div class="s5-plan s5-plan-pro">
          <div class="s5-plan-hd">专业版 · ¥198</div>
          <div class="s5-plan-tx">团队共享色板字库、六端自动质检、组件变量实时同步。</div>
        </div>
      `;
    }

    if (st.content === "form" && !isSingle) {
      verdictEl.dataset.state = "warn";
      verdictEl.textContent =
        st.vw < 640
          ? `双重踩坑（${st.vw}px）：顺序表单硬排双列既打断自上而下的填写节奏，又在窄屏里把输入框截断。请切换「响应式合理折叠」或改用 255 单列页面。`
          : `顺序填写踩坑（${st.vw}px）：宽屏下把表单拆成左右两列，用户会犹豫先往下填还是往右填，漏填率上升（NN/g 表单可用性建议坚持单列顺序）。`;
    } else if (st.content === "compare" && !isSingle && st.vw < 640) {
      verdictEl.dataset.state = "warn";
      verdictEl.textContent = `窄屏硬撑双列（${st.vw}px）：每栏实际可用宽不到 ${Math.round((st.vw - 56) / 2)}px，一句话被切成七八段，失去并行优势。低于 640px 应自动折成单列。`;
    } else if (st.content === "compare" && !isSingle && st.vw >= 640) {
      verdictEl.dataset.state = "ok";
      verdictEl.textContent = `双列主场（${st.vw}px）：宽屏并置「标准版」与「专业版」，价格与权益处在同一水平线，一眼完成横向对比。`;
    } else {
      verdictEl.dataset.state = "ok";
      verdictEl.textContent =
        st.content === "form"
          ? `顺流单列（${st.vw}px）：顺序填写的表单退回单一纵轴，视线一路向下无分叉，填写失误最低。`
          : `窄屏安全折叠（${st.vw}px）：在 640px 断点下方自动折回单列，保住每行舒适字数与点击热区。`;
    }
  }

  widthInput.addEventListener("input", () => {
    st.vw = Number(widthInput.value);
    sync();
  });
  strategyBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.strategy = b.dataset.s5Strategy;
      sync();
    })
  );
  contentBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.content = b.dataset.s5Content;
      sync();
    })
  );
  sync();
}

// =========================================================================
// 06 小练习 · 单变量控制四选一考场（答案在 C）
// =========================================================================
const S6_FEEDBACK = {
  A: {
    correct: false,
    head: "再看看中缝：A 版仅把中缝压到了 6px",
    body: "其他条件都和 C 相同，但 6px 的中缝比正文行距还窄。按格式塔亲密性原则，左栏行尾和右栏行首贴得过近，读者容易直接横穿中缝串行，两条平行通道糊成一片。",
  },
  B: {
    correct: false,
    head: "再看看对齐：B 版仅让右栏顶沿下沉了 44px",
    body: "栏宽与中缝都没错，但右栏整体下沉后，两套方案的标题、价格与功能条目全都不在同一水平线上。对比阅读被迫变成斜向来回找点，失去双列并置的核心效率。",
  },
  C: {
    correct: true,
    head: "选对了：C 版四项双列结构同时成立",
    body: "50:50 等宽配合 32px 安全中缝（约 1.6× 正文行距），有效隔断跨栏串行；两栏顶沿、价格行与要点完全齐平，视觉分量相当，读者可以沿同一条水平线迅速比对两套方案。",
  },
  D: {
    correct: false,
    head: "再看看平衡：D 版把视觉分量全压在了左栏（78:22）",
    body: "虽然两栏框宽还是 50:50，但左栏塞入双图与密集附注、右栏只剩三行孤立细字，视觉重心剧烈左倾，不仅版面像未完工，也会让用户潜意识觉得右栏方案缩水。",
  },
};

export function initSection06() {
  const opts = [...document.querySelectorAll("[data-quiz-opt]")];
  const out = document.getElementById("s6Feedback");
  const head = document.getElementById("s6FeedbackHead");
  const body = document.getElementById("s6FeedbackBody");
  if (!opts.length || !out) return;

  opts.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.quizOpt;
      const fb = S6_FEEDBACK[choice];
      opts.forEach((o) => {
        const k = o.dataset.quizOpt;
        o.setAttribute("aria-pressed", String(k === choice));
        o.dataset.mark = k === choice ? (fb.correct ? "right" : "wrong") : k === "C" && !fb.correct ? "hint" : "";
      });
      out.hidden = false;
      out.dataset.state = fb.correct ? "right" : "wrong";
      head.textContent = fb.head;
      body.textContent = fb.body;
    });
  });
}

// =========================================================================
// 07 原海报灯箱（复用 #poster.src，draggable="false"，支持缩放/拖动/Esc 关闭）
// =========================================================================
export function initPosterLightbox() {
  const thumb = document.getElementById("poster");
  const openBtn = document.getElementById("posterOpenBtn");
  const modal = document.getElementById("posterModal");
  const stage = document.getElementById("posterStage");
  const bigImg = document.getElementById("posterBig");
  const closeBtn = document.getElementById("posterCloseBtn");
  const zoomInBtn = document.getElementById("posterZoomIn");
  const zoomOutBtn = document.getElementById("posterZoomOut");
  const resetBtn = document.getElementById("posterReset");
  if (!thumb || !modal || !bigImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    bigImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }
  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }
  function open() {
    if (!bigImg.getAttribute("src")) bigImg.src = thumb.src;
    resetView();
    modal.hidden = false;
    closeBtn?.focus();
  }
  function close() {
    modal.hidden = true;
    openBtn?.focus();
  }

  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3.2, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  resetBtn?.addEventListener("click", resetView);

  stage.addEventListener("wheel", (e) => {
    if (modal.hidden) return;
    e.preventDefault();
    scale = Math.max(0.8, Math.min(3.2, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    stage.setPointerCapture?.(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  stage.addEventListener("pointerup", () => {
    dragging = false;
  });
}

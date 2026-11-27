// 181 非对称字体排版 · 正文 01–07 节全部独立交互模块
// 每节交互机制互不重复：卷帘对比器 / 四要素力矩矩阵 / 深靛 X-Ray 动线画布 /
// 四时代活体排印标本台 / 6 场景适配筛选诊断 / 2 道单变量精绘 SVG 考题 / 原海报缩放拖动灯箱
import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";

/* ============================================================
 * 01 节：对称与非对称卷帘对照器
 * ============================================================ */
const COMPARE_COPIES = {
  exhibit: {
    tag: "EXHIBITION · 2026",
    titleA: "形状与声音",
    titleB: "秋季平面展",
    meta: "10.18 — 12.06 · 当代设计馆 B 厅",
    lead: "三十六件欧洲现代排印原稿与动态字形实验。",
    note: "同一组 38 个字：对称版（左侧幕）把信息切成均等横条，目光在中间停顿；拉开卷帘看非对称版，标题压左上、展期挂偏轴、右下留出整块呼吸空间并由几何块拉住重心，视线顺着 ①→②→③ 走完整张海报。",
  },
  catalog: {
    tag: "ISSUE NO. 14",
    titleA: "留白建筑志",
    titleB: "空间与网格",
    meta: "总第 14 期 · 巴塞尔 / 东京双城特辑",
    lead: "从活字排盘到屏幕栅格，记录文字如何切分空间。",
    note: "杂志特辑目录最怕平铺直叙：对称居中让期号、主题、副标分不出主次；非对称拉开体量反差后，大标题先抓眼球，整块负空间让副标和导语呼吸清晰。",
  },
  concert: {
    tag: "CHAMBER NIGHT",
    titleA: "巴赫无伴奏",
    titleB: "大提琴夜场",
    meta: "11.22 周六 19:30 · 音乐厅小剧场",
    lead: "六首组曲完整演绎，开场前 15 分钟停止入场。",
    note: "音乐会海报若走中轴居中，端庄安静但偏传统；改用非对称偏轴 + 右翼斜势导语后，立刻生出弦乐行进般的节奏动势，演出时间也更容易一眼扫到。",
  },
};

export function initSection01Compare() {
  const stage = document.getElementById("compare-stage");
  const clip = document.getElementById("compare-clip");
  const handle = document.getElementById("compare-handle");
  const range = document.getElementById("compare-range");
  const valEl = document.getElementById("compare-val");
  const noteEl = document.getElementById("cmp-note");
  const btnEye = document.getElementById("cmp-toggle-eye");
  const btnVoid = document.getElementById("cmp-toggle-void");
  if (!stage || !clip || !range) return;

  let split = 52;
  let showEye = false;
  let showVoid = false;
  let copyKey = "exhibit";

  function applySplit(next) {
    split = Math.max(0, Math.min(100, Math.round(next)));
    clip.style.clipPath = `inset(0 ${100 - split}% 0 0)`;
    handle.style.left = `${split}%`;
    range.value = String(split);
    valEl.textContent = split <= 12 ? "纯非对称成稿" : split >= 88 ? "纯居中对称版" : `对称 ${split}% / 非对称 ${100 - split}%`;
  }

  function applyCopy(key) {
    copyKey = key;
    const c = COMPARE_COPIES[key] || COMPARE_COPIES.exhibit;
    stage.querySelectorAll("[data-c-tag]").forEach((el) => (el.textContent = c.tag));
    stage.querySelectorAll("[data-c-ta]").forEach((el) => (el.textContent = c.titleA));
    stage.querySelectorAll("[data-c-tb]").forEach((el) => (el.textContent = c.titleB));
    stage.querySelectorAll("[data-c-meta]").forEach((el) => (el.textContent = c.meta));
    stage.querySelectorAll("[data-c-lead]").forEach((el) => (el.textContent = c.lead));
    noteEl.textContent = c.note;
    document.querySelectorAll("[data-cmp-copy]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.cmpCopy === key));
    });
  }

  range.addEventListener("input", () => applySplit(Number(range.value)));

  // 直接拖动卷帘手柄或点击舞台水平滑动
  let dragging = false;
  const moveAt = (clientX) => {
    const r = stage.getBoundingClientRect();
    applySplit(((clientX - r.left) / Math.max(1, r.width)) * 100);
  };
  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, input")) return;
    dragging = true;
    moveAt(e.clientX);
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (dragging) moveAt(e.clientX);
  });
  stage.addEventListener("pointerup", () => (dragging = false));
  stage.addEventListener("pointercancel", () => (dragging = false));

  document.querySelectorAll("[data-cmp-copy]").forEach((btn) => {
    btn.addEventListener("click", () => applyCopy(btn.dataset.cmpCopy));
  });
  document.querySelectorAll("[data-cmp-snap]").forEach((btn) => {
    btn.addEventListener("click", () => applySplit(Number(btn.dataset.cmpSnap)));
  });

  btnEye.addEventListener("click", () => {
    showEye = !showEye;
    stage.classList.toggle("show-eye", showEye);
    btnEye.setAttribute("aria-pressed", String(showEye));
  });
  btnVoid.addEventListener("click", () => {
    showVoid = !showVoid;
    stage.classList.toggle("show-void", showVoid);
    btnVoid.setAttribute("aria-pressed", String(showVoid));
  });

  applyCopy(copyKey);
  applySplit(split);
}

/* ============================================================
 * 02 节：四要素字重与留白力矩平衡仪
 * ============================================================ */
export function initSection02Mass() {
  const btns = [...document.querySelectorAll("[data-mass-key]")];
  const preview = document.getElementById("mass-preview");
  const cogPin = document.getElementById("mass-cog-pin");
  const cogText = document.getElementById("mass-cog-text");
  const noteEl = document.getElementById("mass-note");
  const qTL = document.getElementById("mass-quad-tl");
  const qTR = document.getElementById("mass-quad-tr");
  const qBL = document.getElementById("mass-quad-bl");
  const qBR = document.getElementById("mass-quad-br");
  if (!preview || !btns.length) return;

  // 每个要素在四象限的视觉墨量（示意值）
  const active = { title: true, blue: true, dots: true, giant: true };

  function render() {
    // 同步 SVG/DOM 显隐
    preview.dataset.title = String(active.title);
    preview.dataset.blue = String(active.blue);
    preview.dataset.dots = String(active.dots);
    preview.dataset.giant = String(active.giant);

    btns.forEach((b) => {
      const k = b.dataset.massKey;
      const on = active[k];
      b.setAttribute("aria-pressed", String(on));
      const tag = b.querySelector(".mass-state");
      if (tag) tag.textContent = on ? "已启用" : "已撤除";
    });

    // 正文与三徽标始终占一小份基础左翼重量
    const tl = 10 + (active.title ? 36 : 0);
    const tr = 2 + (active.blue ? 26 : 0) + (active.dots ? 9 : 0);
    const bl = 18; // 左下正文+三徽
    const br = 6 + (active.giant ? 31 : 0) + (active.dots ? 5 : 0);
    const sum = tl + tr + bl + br || 1;
    const pTL = Math.round((tl / sum) * 100);
    const pTR = Math.round((tr / sum) * 100);
    const pBL = Math.round((bl / sum) * 100);
    const pBR = Math.max(0, 100 - pTL - pTR - pBL);

    qTL.textContent = `${pTL}%`;
    qTR.textContent = `${pTR}%`;
    qBL.textContent = `${pBL}%`;
    qBR.textContent = `${pBR}%`;

    const leftShare = (tl + bl) / sum;
    const rightShare = (tr + br) / sum;
    const cogPct = Math.round(50 + (rightShare - leftShare) * 44);
    cogPin.style.left = `${cogPct}%`;

    const bias = cogPct - 50;
    const balanced = Math.abs(bias) <= 10;
    cogPin.dataset.ok = String(balanced);
    cogText.textContent = balanced
      ? `水平重心 ${cogPct}% · 对角稳衡（示意）`
      : `水平重心 ${cogPct}% · ${bias < 0 ? "向左倾坠" : "向右倾坠"}（示意）`;

    if (!active.blue && !active.giant) {
      noteEl.textContent = "右翼的电光钴蓝圆和破框巨字都被撤掉了：左上大标题的漆黑墨量完全失去对手，整张版面像跷跷板一样沉向左缘，右侧空白从「活跃留白」退化成「死空」。";
    } else if (!active.title) {
      noteEl.textContent = "撤掉左上粗黑主标题后，右侧蓝圆与巨字瞬间反客为主，重心明显右滑——这说明对角配重必须与主标题体量匹配，不能脱离主标独自做大。";
    } else if (!active.giant) {
      noteEl.textContent = "只留右上钴蓝圆、撤掉右下破框巨字：上半部稳住了，但左下三徽与右下形成头重脚轻，视线滑到中段后缺少右下角的收束锚点。";
    } else if (!active.blue) {
      noteEl.textContent = "撤掉右上电光蓝圆、只靠右下破框巨字斜向对拉：重心仍大致稳衡，但右上大片空白缺少高饱和色彩锚点，张力比完整原海报略轻。";
    } else if (!active.dots) {
      noteEl.textContent = "撤掉热朱橙点阵与橙点后，蓝与黑的对角重量仍在，但少了那一抹高明度暖色呼吸节拍，整体氛围变得偏冷偏硬。";
    } else {
      noteEl.textContent = "四个要素齐全时，左上重黑主标 + 左下细密三徽（左翼约一半墨量）隔着整片蜜桃留白，与右上电光钴蓝圆 + 右下破框巨字稳稳拉平——不靠镜像，照样稳如磐石。";
    }
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.massKey;
      active[k] = !active[k];
      render();
    });
  });

  render();
}

/* ============================================================
 * 03 节（深靛暗室）：隐性挂轴与斜势动线 X-Ray 灯箱（2D Canvas）
 * ============================================================ */
const XRAY_LAYOUTS = {
  leftAxis: {
    label: "偏左隐性挂轴",
    axisLines: [{ type: "v", p: 0.12 }, { type: "h", p: 0.22 }],
    blocks: [
      { id: "t", x: 0.12, y: 0.13, w: 0.44, h: 0.20, kind: "title", text: "偏左挂轴" },
      { id: "b", x: 0.12, y: 0.40, w: 0.36, h: 0.16, kind: "body", text: "多组文字共用左侧 12% 隐性垂线" },
      { id: "c", x: 0.12, y: 0.72, w: 0.24, h: 0.15, kind: "meta", text: "细节落款" },
      { id: "a", x: 0.72, y: 0.22, w: 0.22, h: 0.34, kind: "accent", text: "右翼配重" },
      { id: "g", x: 0.64, y: 0.68, w: 0.28, h: 0.22, kind: "giant", text: "锚" },
    ],
    flow: [[0.28, 0.23], [0.26, 0.48], [0.76, 0.38], [0.76, 0.78]],
    note: "最经典的瑞士非对称骨架：标题、正文、落款全部严丝合缝挂在左侧 12% 隐性垂线上，右侧大片留白放高对比配重，秩序清晰到闭眼都能摸出脊梁。",
  },
  zDiag: {
    label: "Z 形对角动势",
    axisLines: [{ type: "v", p: 0.10 }, { type: "v", p: 0.90 }, { type: "d", x1: 0.16, y1: 0.22, x2: 0.84, y2: 0.80 }],
    blocks: [
      { id: "t", x: 0.10, y: 0.12, w: 0.46, h: 0.20, kind: "title", text: "对角推进" },
      { id: "a", x: 0.72, y: 0.14, w: 0.18, h: 0.24, kind: "accent", text: "右上焦" },
      { id: "b", x: 0.10, y: 0.44, w: 0.34, h: 0.15, kind: "body", text: "中段文字轻托" },
      { id: "q", x: 0.50, y: 0.56, w: 0.32, h: 0.12, kind: "tilt", text: "斜势导语过桥", tilt: -19 },
      { id: "g", x: 0.66, y: 0.73, w: 0.24, h: 0.20, kind: "giant", text: "丢" },
    ],
    flow: [[0.28, 0.22], [0.80, 0.26], [0.27, 0.51], [0.64, 0.61], [0.78, 0.83]],
    note: "181 原海报正是这种 Z 形对角动势：左上粗标定起点 → 右上蓝圆挑起张力 → 中段正文与 -22° 斜导语渡桥 → 右下破框巨字稳稳收束。",
  },
  stepTilt: {
    label: "阶梯错落轴",
    axisLines: [{ type: "v", p: 0.14 }, { type: "v", p: 0.38 }, { type: "v", p: 0.62 }],
    blocks: [
      { id: "t", x: 0.14, y: 0.14, w: 0.36, h: 0.18, kind: "title", text: "阶梯一号" },
      { id: "b", x: 0.38, y: 0.40, w: 0.34, h: 0.16, kind: "body", text: "向右跨一栏起第二阶" },
      { id: "c", x: 0.62, y: 0.66, w: 0.28, h: 0.16, kind: "meta", text: "再右跨一栏收尾" },
      { id: "a", x: 0.14, y: 0.64, w: 0.18, h: 0.22, kind: "accent", text: "左下回拉" },
    ],
    flow: [[0.30, 0.23], [0.54, 0.48], [0.74, 0.74], [0.23, 0.75]],
    note: "三段文字严格踩在三栏网格的 14% / 38% / 62% 隐性列线上逐级右移，左下角放一枚蓝块回拉重心——每一步错位都有格可依，绝不漂浮。",
  },
  chaos: {
    label: "拆轴乱摆（反例）",
    axisLines: [],
    blocks: [
      { id: "t", x: 0.23, y: 0.11, w: 0.38, h: 0.15, kind: "title", text: "无轴乱摆" },
      { id: "b", x: 0.09, y: 0.39, w: 0.35, h: 0.15, kind: "body", text: "各自找不着共同对齐线" },
      { id: "q", x: 0.55, y: 0.44, w: 0.30, h: 0.11, kind: "tilt", text: "反倾割裂", tilt: 17 },
      { id: "c", x: 0.41, y: 0.76, w: 0.28, h: 0.14, kind: "meta", text: "悬在半空" },
      { id: "a", x: 0.77, y: 0.18, w: 0.14, h: 0.14, kind: "accent", text: "零散" },
    ],
    flow: [[0.42, 0.18], [0.24, 0.46], [0.70, 0.49], [0.55, 0.83], [0.84, 0.25]],
    note: "拆掉隐性挂轴的反例：标题在 23%、正文在 9%、落款在 41%，导语还反向斜倾，视线被迫来回折返抽搐——切到「隐性挂轴」灯箱就能一眼看出它根本没有骨架。",
  },
};

export function initSection03Xray() {
  const canvas = document.getElementById("xray-canvas");
  const noteEl = document.getElementById("xray-note");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: false });

  let layoutKey = "zDiag";
  let layerKey = "axis"; // raw | axis | grid | flow
  let W = 600;
  let H = 360;
  let dpr = 1;
  let dirty = true;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const nw = Math.max(260, Math.round(r.width));
    const nh = Math.max(220, Math.round(r.height));
    const nd = pixelRatio(2);
    if (nw !== W || nh !== H || nd !== dpr) {
      W = nw;
      H = nh;
      dpr = nd;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      dirty = true;
    }
  }

  function renderFrame(t, still) {
    const cfg = XRAY_LAYOUTS[layoutKey];
    ctx.save();
    ctx.scale(dpr, dpr);

    // 深靛暗室灯箱底
    ctx.fillStyle = "#101836";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(123, 162, 255, 0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    // 1. 黄金/三分网格切层
    if (layerKey === "grid") {
      ctx.save();
      ctx.strokeStyle = "rgba(123, 162, 255, 0.24)";
      ctx.setLineDash([4, 4]);
      [1 / 3, 2 / 3, 0.382, 0.618].forEach((p, idx) => {
        ctx.strokeStyle = idx < 2 ? "rgba(123, 162, 255, 0.30)" : "rgba(255, 130, 77, 0.26)";
        ctx.beginPath();
        ctx.moveTo(W * p, 0);
        ctx.lineTo(W * p, H);
        ctx.moveTo(0, H * p);
        ctx.lineTo(W, H * p);
        ctx.stroke();
      });
      ctx.restore();
    }

    // 2. 隐性挂轴切层
    if (layerKey === "axis") {
      ctx.save();
      if (cfg.axisLines.length === 0) {
        // 乱摆反例：给每个块左缘画参差红线
        ctx.strokeStyle = PALETTE.badDark;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.4;
        cfg.blocks.forEach((b) => {
          ctx.beginPath();
          ctx.moveTo(b.x * W, 12);
          ctx.lineTo(b.x * W, H - 12);
          ctx.stroke();
        });
        ctx.fillStyle = PALETTE.badDark;
        ctx.font = '600 12px "Noto Sans SC", sans-serif';
        ctx.fillText("5 个元素踩在 5 条互不相干的纵线上（无共享隐性挂轴）", 16, H - 16);
      } else {
        cfg.axisLines.forEach((ln) => {
          ctx.strokeStyle = ln.type === "d" ? PALETTE.vermilionGlow : PALETTE.cobaltGlow;
          ctx.setLineDash([6, 4]);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          if (ln.type === "v") {
            ctx.moveTo(ln.p * W, 0);
            ctx.lineTo(ln.p * W, H);
          } else if (ln.type === "h") {
            ctx.moveTo(0, ln.p * H);
            ctx.lineTo(W, ln.p * H);
          } else {
            ctx.moveTo(ln.x1 * W, ln.y1 * H);
            ctx.lineTo(ln.x2 * W, ln.y2 * H);
          }
          ctx.stroke();
        });
      }
      ctx.restore();
    }

    // 3. 画出各排印块
    cfg.blocks.forEach((b) => {
      const x = b.x * W;
      const y = b.y * H;
      const bw = b.w * W;
      const bh = b.h * H;
      ctx.save();
      if (b.tilt) {
        ctx.translate(x + bw / 2, y + bh / 2);
        ctx.rotate((b.tilt * Math.PI) / 180);
        ctx.fillStyle = "rgba(255, 130, 77, 0.16)";
        ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
        ctx.strokeStyle = PALETTE.vermilionGlow;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-bw / 2, bh / 2);
        ctx.lineTo(bw / 2, bh / 2);
        ctx.stroke();
        ctx.fillStyle = PALETTE.darkText;
        ctx.font = '600 12px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(b.text, 0, -2);
      } else if (b.kind === "accent") {
        ctx.fillStyle = PALETTE.cobalt;
        const r = Math.min(bw, bh) * 0.48;
        ctx.beginPath();
        ctx.arc(x + bw / 2, y + bh / 2, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFF";
        ctx.font = '600 11px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(b.text, x + bw / 2, y + bh / 2);
      } else if (b.kind === "giant") {
        ctx.fillStyle = "rgba(252, 220, 210, 0.16)";
        ctx.fillRect(x, y, bw, bh);
        ctx.fillStyle = PALETTE.peachPaper;
        ctx.font = `900 ${Math.round(bh * 0.82)}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(b.text, x + bw / 2, y + bh / 2 + 2);
      } else {
        ctx.fillStyle = b.kind === "title" ? "rgba(252, 220, 210, 0.94)" : "rgba(248, 236, 232, 0.12)";
        ctx.fillRect(x, y, bw, bh);
        ctx.strokeStyle = b.kind === "title" ? PALETTE.peachPaper : "rgba(248, 236, 232, 0.30)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, bw, bh);
        ctx.fillStyle = b.kind === "title" ? PALETTE.black : PALETTE.darkText;
        ctx.font = b.kind === "title" ? '900 17px "Noto Sans SC", sans-serif' : '500 12px "Noto Sans SC", sans-serif';
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(b.text, x + 10, y + bh / 2, Math.max(40, bw - 16));
      }
      ctx.restore();
    });

    // 4. 动势矢量切层（实时脉冲光点沿视线流走）
    if (layerKey === "flow") {
      const pts = cfg.flow.map(([u, v]) => [u * W, v * H]);
      const bad = layoutKey === "chaos";
      ctx.save();
      ctx.strokeStyle = bad ? PALETTE.badDark : PALETTE.vermilionGlow;
      ctx.lineWidth = 2.4;
      ctx.setLineDash(bad ? [6, 5] : []);
      ctx.beginPath();
      pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
      ctx.stroke();
      ctx.setLineDash([]);

      // 脉冲流珠
      const phase = still ? 0.6 : (t * 0.42) % 1;
      const segs = pts.length - 1;
      const pos = phase * segs;
      const idx = Math.min(segs - 1, Math.floor(pos));
      const frac = pos - idx;
      const lx = pts[idx][0] + (pts[idx + 1][0] - pts[idx][0]) * frac;
      const ly = pts[idx][1] + (pts[idx + 1][1] - pts[idx][1]) * frac;
      ctx.beginPath();
      ctx.arc(lx, ly, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#FFF";
      ctx.fill();

      pts.forEach(([px, py], i) => {
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.fillStyle = bad ? PALETTE.badLight : PALETTE.cobalt;
        ctx.fill();
        ctx.fillStyle = "#FFF";
        ctx.font = '700 11px "IBM Plex Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), px, py + 0.5);
      });
      ctx.restore();
    }

    ctx.restore();
  }

  const ctrl = loop(canvas, (t, _dt, { still }) => {
    resize();
    if (still || dirty || layerKey === "flow") {
      dirty = false;
      renderFrame(t, still);
    }
  });

  function updateUI() {
    document.querySelectorAll("[data-xray-layout]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.xrayLayout === layoutKey));
    });
    document.querySelectorAll("[data-xray-layer]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.xrayLayer === layerKey));
    });
    noteEl.textContent = XRAY_LAYOUTS[layoutKey].note;
    dirty = true;
    ctrl.draw();
  }

  document.querySelectorAll("[data-xray-layout]").forEach((b) => {
    b.addEventListener("click", () => {
      layoutKey = b.dataset.xrayLayout;
      updateUI();
    });
  });
  document.querySelectorAll("[data-xray-layer]").forEach((b) => {
    b.addEventListener("click", () => {
      layerKey = b.dataset.xrayLayer;
      updateUI();
    });
  });

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  updateUI();
}

/* ============================================================
 * 04 节：从包豪斯到瑞士网格（四时代活体排印标本台）
 * ============================================================ */
const ERAS = {
  "1923": {
    year: "1923 · 魏玛包豪斯",
    who: "László Moholy-Nagy（拉兹洛·莫霍利-纳吉）",
    work: "《Die neue Typographie》短文，收入魏玛包豪斯展览图录《Staatliches Bauhaus in Weimar 1919–1923》",
    quote: "“Typography is a tool of communication. It must be communication in its most intense form.”",
    caption: "包豪斯提出：字体排版首先是最强烈的沟通工具，清晰易读绝不应被先验的居中对称装饰所牺牲。粗黑无衬线、粗重功能横条与偏轴留白开始登台。",
    styleClass: "era-1923",
    kicker: "WEIMAR · 1923",
    headline: "DIE NEUE TYPOGRAPHIE",
    sub: "清晰沟通优先于先验对称",
    body: "以偏轴粗黑条、几何色块与强体量反差打破古典书页的居中框架，让眼睛直奔重点。",
  },
  "1928": {
    year: "1928 & 1935 · 柏林 / 巴塞尔",
    who: "Jan Tschichold（扬·奇肖尔德）",
    work: "1928 年《Die neue Typographie》（柏林初版）；1935 年《Typographische Gestaltung》（1967 年 Ruari McLean 英译《Asymmetric Typography》）",
    quote: "系统整理现代主义非对称字排手册，将前卫实验转化为印刷工人都能落地的规则。",
    caption: "奇肖尔德把构成主义与包豪斯的先锋理念写进了实用手册：强调按信息逻辑分层、采用无衬线字、把留白当作主动材料，让非对称真正走进日常海报、目录与商业印品。",
    styleClass: "era-1928",
    kicker: "BERLIN 1928 / BASEL 1935",
    headline: "ASYMMETRIC TYPOGRAPHY",
    sub: "按功能与逻辑组织动态平衡",
    body: "不强行把所有行推到同一条中轴，而是让主标、日期与说明按重要程度各占体量与空间。",
  },
  "1947": {
    year: "1946 论战 · 1947–1949 企鹅图书",
    who: "Jan Tschichold vs. Max Bill（马克斯·比尔）",
    work: "1946 年瑞士《SGM》论战（Bill《Über Typografie》与 Tschichold《Glaube und Wirklichkeit》）；1947 年《Penguin Composition Rules》",
    quote: "奇肖尔德用企鹅平装书改版证明：古典长篇书籍需要沉静对称，教条化的非对称同样危险。",
    caption: "这段历史转折极其珍贵：曾经最激进的非对称布道者，在 1940 年代反思「把非对称当唯一正确」的极端，回到企鹅图书用端庄居中衬线重塑了数以百计的平装文学书——从此确立了「按媒介分工」的成熟观。",
    styleClass: "era-1947",
    kicker: "PENGUIN BOOKS · LONDON 1947",
    headline: "Symmetry & Readability",
    sub: "THE PENGUIN COMPOSITION RULES",
    body: "长篇连续文学阅读需要不打扰读者的沉静对称与精细字距，而不是每页都在制造视觉刺激。",
  },
  "1967": {
    year: "1967 巴塞尔 · 1981 苏黎世",
    who: "Emil Ruder（埃米尔·鲁德尔）& Josef Müller-Brockmann（约瑟夫·米勒-布罗克曼）",
    work: "1967 年《Typographie》（Arthur Niggli）；1981 年《Grid Systems in Graphic Design》（Arthur Niggli）",
    quote: "黑字与白空相互成就；非对称网格把视觉张力变成可复用的理性基础设施。",
    caption: "瑞士国际主义把非对称字排推向巅峰：鲁德尔深入剖析字形与留白（形与反形）的对话，米勒-布罗克曼用严格多栏数学网格，让非对称既有建筑秩序又充满动势——直接奠定了当代网页与海报设计的底层语法。",
    styleClass: "era-1967",
    kicker: "BASEL 1967 · ZÜRICH 1981",
    headline: "GRID & WHITE SPACE",
    sub: "黑字与空白的结构对话",
    body: "借助隐性多栏网格，偏轴排印不再靠手感瞎蒙，留白与文字体量在严密比例下彼此拉紧。",
  },
};

export function initSection04History() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const card = document.getElementById("era-specimen");
  const metaEl = document.getElementById("era-meta");
  const capEl = document.getElementById("era-caption");
  if (!btns.length || !card) return;

  function selectEra(key) {
    const e = ERAS[key] || ERAS["1928"];
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.era === key)));
    card.className = `era-specimen ${e.styleClass}`;
    card.innerHTML = `
      <div class="era-sp-kicker">${e.kicker}</div>
      <div class="era-sp-head">${e.headline}</div>
      <div class="era-sp-rule" aria-hidden="true"></div>
      <div class="era-sp-sub">${e.sub}</div>
      <p class="era-sp-body">${e.body}</p>
    `;
    metaEl.innerHTML = `<strong>${e.year}</strong> · ${e.who}<br><span>${e.work}</span>`;
    capEl.textContent = e.caption;
  }

  btns.forEach((b) => b.addEventListener("click", () => selectEra(b.dataset.era)));
  selectEra("1928");
}

/* ============================================================
 * 05 节：什么时候用，什么时候别用（6 场景筛选与展开诊断）
 * ============================================================ */
const USE_CASES = [
  {
    id: "poster",
    verdict: "fit",
    badge: "适合非对称",
    title: "展览招贴与演出海报",
    summary: "需要在 1–2 秒内从远处抓人眼球，并把主标、时间、地点排出清晰先后的大幅平面。",
    detail: "大幅纸面有充足负空间，可以用超大粗黑主标压阵，再借偏轴挂线与对角色块把视线导到展期与票务信息，张力远胜居中排法。",
    alt: "",
  },
  {
    id: "editorial",
    verdict: "fit",
    badge: "适合非对称",
    title: "杂志跨页与专题开篇",
    summary: "跨页宽幅天生自带不对称节奏：大字题图压一翼，留白与导语托起另一翼。",
    detail: "非对称能帮专题页迅速跳出常规正文流，制造「翻到重头戏」的停顿感；进入多栏长正文后再交回规整左齐排法。",
    alt: "配合 <a href=\"https://layout.xiaoxiaodong.ai/184/play/\" target=\"_blank\" rel=\"noopener\">184 跨栏标题</a> 效果更利落。",
  },
  {
    id: "landing",
    verdict: "fit",
    badge: "适合非对称",
    title: "品牌发布页与首屏叙事",
    summary: "产品主视觉与核心卖点体量悬殊，天然适合偏轴对比与大面积留白呼吸。",
    detail: "左挂大标题 + 短行动按钮，右翼给到破框主图或巨字锚点，能在宽屏下迅速建立主次与现代感。",
    alt: "大字边缘微调可参考 <a href=\"https://layout.xiaoxiaodong.ai/187/play/\" target=\"_blank\" rel=\"noopener\">187 凸排标点</a>。",
  },
  {
    id: "novel",
    verdict: "avoid",
    badge: "别硬用",
    title: "长篇小说与学术正文",
    summary: "读者需要连续几小时不被打断地读字，每页偏轴跳跃只会迅速耗尽眼力。",
    detail: "正如奇肖尔德 1947 年改版企鹅图书时指出的：长篇连续阅读要的是隐形的秩序和稳定页心，而不是花哨动势。",
    alt: "改用 <a href=\"https://layout.xiaoxiaodong.ai/176/play/\" target=\"_blank\" rel=\"noopener\">176 左对齐右参差</a>、<a href=\"https://layout.xiaoxiaodong.ai/179/play/\" target=\"_blank\" rel=\"noopener\">179 两端对齐</a> 或 <a href=\"https://layout.xiaoxiaodong.ai/186/play/\" target=\"_blank\" rel=\"noopener\">186 首行缩进</a>。",
  },
  {
    id: "ceremony",
    verdict: "avoid",
    badge: "别硬用",
    title: "纪念碑、证书与庄重请柬",
    summary: "礼仪场合传达的是永恒、肃穆与仪式感，打破对称反而显得轻佻不安。",
    detail: "对称的静止感在这里不是缺点，而是恰如其分的情绪容器——强行拉偏轴会削弱权威与庄重感。",
    alt: "改用 <a href=\"https://layout.xiaoxiaodong.ai/178/play/\" target=\"_blank\" rel=\"noopener\">178 居中排版</a>。",
  },
  {
    id: "table",
    verdict: "avoid",
    badge: "别硬用",
    title: "财务核对表、目录清单与极窄卡片",
    summary: "高频纵向扫描和极窄容器里没有多余空白可对话，偏轴会直接破坏对齐核对效率。",
    detail: "当宽度不足以形成整块负空间时，硬把字推偏只会像没排齐的残次版面；表格与清单更需要严谨基线与统一左缘。",
    alt: "改用 <a href=\"https://layout.xiaoxiaodong.ai/185/play/\" target=\"_blank\" rel=\"noopener\">185 悬挂缩进</a> 与 <a href=\"https://layout.xiaoxiaodong.ai/188/play/\" target=\"_blank\" rel=\"noopener\">188 基线对齐</a>。",
  },
];

export function initSection05UseCases() {
  const grid = document.getElementById("use-grid");
  const filterBtns = [...document.querySelectorAll("[data-use-filter]")];
  if (!grid) return;

  let filter = "all";
  let expandedId = "novel";

  function render() {
    filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.useFilter === filter)));
    const list = USE_CASES.filter((c) => filter === "all" || c.verdict === filter);
    grid.innerHTML = list
      .map((c) => {
        const open = expandedId === c.id;
        return `
          <article class="use-card ${c.verdict} ${open ? "is-open" : ""}">
            <button type="button" class="use-head" data-use-toggle="${c.id}" aria-expanded="${open}">
              <span class="use-pill ${c.verdict}">${c.badge}</span>
              <h3>${c.title}</h3>
              <p class="use-sum">${c.summary}</p>
              <span class="use-more">${open ? "收起诊断 −" : "查看细节 +"}</span>
            </button>
            <div class="use-body" ${open ? "" : "hidden"}>
              <p>${c.detail}</p>
              ${c.alt ? `<p class="use-alt">${c.alt}</p>` : ""}
            </div>
          </article>
        `;
      })
      .join("");

    grid.querySelectorAll("[data-use-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.useToggle;
        expandedId = expandedId === id ? "" : id;
        render();
      });
    });
  }

  filterBtns.forEach((b) => {
    b.addEventListener("click", () => {
      filter = b.dataset.useFilter;
      const list = USE_CASES.filter((c) => filter === "all" || c.verdict === filter);
      if (list.length && !list.some((x) => x.id === expandedId)) expandedId = list[0].id;
      render();
    });
  });

  render();
}

/* ============================================================
 * 06 节（深靛考场）：2 道单变量排印选择题（选项只写中性编号！）
 * ============================================================ */
function posterMiniSVG(variant, showOverlay) {
  // 4 张精绘 3:4 微缩海报，配色/字形/几何要素完全相同，只差一个结构变量！
  const bg = PALETTE.peachPaper;
  const blue = PALETTE.cobalt;
  const orange = PALETTE.vermilion;
  const black = PALETTE.black;

  if (variant === "A") {
    // 中轴对称锁死
    return `
      <svg viewBox="0 0 180 240" class="quiz-svg" aria-hidden="true">
        <rect width="180" height="240" fill="${bg}"/>
        <circle cx="90" cy="40" r="24" fill="${blue}"/>
        <rect x="42" y="76" width="96" height="14" fill="${black}"/>
        <rect x="52" y="96" width="76" height="14" fill="${black}"/>
        <rect x="78" y="118" width="24" height="3" fill="${orange}"/>
        <rect x="44" y="132" width="92" height="6" fill="${black}" opacity="0.65"/>
        <rect x="50" y="144" width="80" height="6" fill="${black}" opacity="0.65"/>
        <rect x="54" y="164" width="72" height="5" fill="${orange}"/>
        <text x="90" y="218" text-anchor="middle" font-size="36" font-weight="900" fill="${black}" font-family="Noto Sans SC, sans-serif">展</text>
        ${showOverlay ? `<line x1="90" y1="6" x2="90" y2="234" stroke="#BE1F1F" stroke-width="2" stroke-dasharray="5 4"/>` : ""}
      </svg>`;
  }
  if (variant === "B") {
    // 打破对称却忘了配重：全员挤在左缘单边塌方
    return `
      <svg viewBox="0 0 180 240" class="quiz-svg" aria-hidden="true">
        <rect width="180" height="240" fill="${bg}"/>
        <rect x="14" y="24" width="82" height="18" fill="${black}"/>
        <rect x="14" y="48" width="68" height="18" fill="${black}"/>
        <rect x="14" y="74" width="24" height="3" fill="${orange}"/>
        <rect x="14" y="88" width="76" height="6" fill="${black}" opacity="0.7"/>
        <rect x="14" y="100" width="66" height="6" fill="${black}" opacity="0.7"/>
        <circle cx="44" cy="144" r="24" fill="${blue}"/>
        <text x="42" y="220" text-anchor="middle" font-size="48" font-weight="900" fill="${black}" font-family="Noto Sans SC, sans-serif">展</text>
        ${showOverlay ? `<rect x="106" y="12" width="64" height="216" fill="rgba(190,31,31,0.14)" stroke="#BE1F1F" stroke-dasharray="4 3"/>` : ""}
      </svg>`;
  }
  if (variant === "C") {
    // 正确答案：左挂隐性纵轴 + 强级差 + 斜势导语 + 右上破框蓝圆与右下破框巨字对角配平
    return `
      <svg viewBox="0 0 180 240" class="quiz-svg" aria-hidden="true">
        <rect width="180" height="240" fill="${bg}"/>
        <circle cx="164" cy="64" r="42" fill="${blue}"/>
        <rect x="16" y="34" width="84" height="18" fill="${black}"/>
        <rect x="16" y="58" width="72" height="18" fill="${black}"/>
        <rect x="16" y="84" width="22" height="3.5" fill="${orange}"/>
        <rect x="16" y="102" width="76" height="5.5" fill="${black}" opacity="0.72"/>
        <rect x="16" y="113" width="64" height="5.5" fill="${black}" opacity="0.72"/>
        <g transform="translate(120 144) rotate(-20)">
          <rect x="-34" y="-8" width="68" height="5" fill="${black}" opacity="0.8"/>
          <line x1="-34" y1="6" x2="34" y2="6" stroke="${orange}" stroke-width="2"/>
        </g>
        <circle cx="22" cy="170" r="5" fill="${blue}"/>
        <rect x="17" y="186" width="10" height="10" fill="${orange}"/>
        <polygon points="17,208 28,213 17,218" fill="${blue}"/>
        <circle cx="102" cy="206" r="7" fill="${orange}"/>
        <text x="150" y="226" text-anchor="middle" font-size="68" font-weight="900" fill="${black}" font-family="Noto Sans SC, sans-serif" transform="rotate(-10 150 206)">展</text>
        ${showOverlay ? `<line x1="16" y1="12" x2="16" y2="228" stroke="#0D6B44" stroke-width="1.8" stroke-dasharray="5 3"/><line x1="36" y1="54" x2="148" y2="206" stroke="#0D6B44" stroke-width="1.5" stroke-dasharray="4 3"/>` : ""}
      </svg>`;
  }
  // D：脱轴乱飘 + 级差压平（保留同样要素，只差结构轴与级差）
  return `
    <svg viewBox="0 0 180 240" class="quiz-svg" aria-hidden="true">
      <rect width="180" height="240" fill="${bg}"/>
      <rect x="44" y="24" width="66" height="10" fill="${black}"/>
      <rect x="44" y="38" width="54" height="10" fill="${black}"/>
      <rect x="44" y="54" width="22" height="3" fill="${orange}"/>
      <rect x="14" y="88" width="76" height="8" fill="${black}" opacity="0.78"/>
      <rect x="14" y="102" width="64" height="8" fill="${black}" opacity="0.78"/>
      <circle cx="144" cy="70" r="22" fill="${blue}"/>
      <g transform="translate(116 144) rotate(18)">
        <rect x="-32" y="-6" width="64" height="6" fill="${black}" opacity="0.8"/>
        <line x1="-32" y1="6" x2="32" y2="6" stroke="${orange}" stroke-width="2"/>
      </g>
      <circle cx="30" cy="184" r="5" fill="${orange}"/>
      <text x="96" y="216" text-anchor="middle" font-size="30" font-weight="900" fill="${black}" font-family="Noto Sans SC, sans-serif">展</text>
      ${showOverlay ? `<line x1="44" y1="12" x2="44" y2="228" stroke="#BE1F1F" stroke-width="1.5" stroke-dasharray="4 3"/><line x1="14" y1="12" x2="14" y2="228" stroke="#BE1F1F" stroke-width="1.5" stroke-dasharray="4 3"/><line x1="96" y1="12" x2="96" y2="228" stroke="#BE1F1F" stroke-width="1.5" stroke-dasharray="4 3"/>` : ""}
    </svg>`;
}

const QUIZZES = [
  {
    id: 0,
    title: "题 1 · 挑出成立的非对称海报",
    prompt: "四张海报使用完全相同的配色、文案和几何元素，只差一个排印结构变量。哪一张真正做到了「打破对称、层级清晰、留白对话、对角平衡」？",
    type: "svg",
    answer: "C",
    options: [
      { key: "A", label: "方案 A", explain: "四组元素全贴在 50% 垂直中轴上左右镜像，虽然整齐，但停留在静态对称里，缺少非对称应有的视线推力与整块呼吸留白。" },
      { key: "B", label: "方案 B", explain: "打破了中轴，但把主标、蓝圆和巨字全堆到左侧，右半幅彻底虚空——只破对称不做对角配重，整张海报向左塌方。" },
      { key: "C", label: "方案 C", explain: "正确：主标、正文与三徽严守左侧隐性挂轴，主次体量级差鲜明；斜势导语横跨留白渡桥，右上破框蓝圆与右下破框巨字隔空回拉，重与轻形成稳定对话。" },
      { key: "D", label: "方案 D", explain: "主标在 24%、正文在 8%、底注在 41% 各漂各的，既没公共隐性挂轴，主次字号也拉不开级差，导语还反向斜倾割裂视线。" },
    ],
  },
  {
    id: 1,
    title: "题 2 · 什么时候不该用非对称",
    prompt: "客户委托你设计一本 360 页的经典长篇文学小说内文与标准章节页，读者需要连续阅读数小时。下面哪种排印方案最合适？",
    type: "text",
    answer: "B",
    options: [
      { key: "A", label: "方案 A", desc: "每章更换不同的偏轴挂线位置，并把关键对话行斜倾 -20° 强调动势。", explain: "每页跳动的挂轴与斜倾行会不断打断眼球回行节奏，几页之后就会让人眼疲劳——长篇连续阅读切忌炫技式非对称。" },
      { key: "B", label: "方案 B", desc: "全书采用固定沉静单栏版心、稳定字号与行距，章节扉页适度居中留白。", explain: "正确：正如奇肖尔德改版企鹅图书的结论——长篇文学需要隐形的阅读秩序，把非对称留给海报、画册与需要强层级引导的版面。" },
      { key: "C", label: "方案 C", desc: "把每页第一段首字放大到半页高并破出纸边，正文绕开巨字排在另一侧。", explain: "破框巨字适合展览招贴或杂志专题开篇；放在 360 页小说的常规内文里会严重喧宾夺主、割裂叙事连贯性。" },
      { key: "D", label: "方案 D", desc: "正文全向右对齐挂在右侧边缘，并在每一页左上角固定放一枚高饱和色圆配重。", explain: "右对齐左参差会让汉语/横排西文每行起点参差不齐，极大降低长文阅读速度；高饱和圆块更会持续抢走注意力。" },
    ],
  },
];

export function initSection06Quiz() {
  const promptEl = document.getElementById("quiz-prompt");
  const optBox = document.getElementById("quiz-options");
  const fbEl = document.getElementById("quiz-feedback");
  const retryBtn = document.getElementById("quiz-retry");
  const tabBtns = [...document.querySelectorAll("[data-quiz-idx]")];
  if (!promptEl || !optBox) return;

  let qIdx = 0;
  let picked = null;

  function render() {
    const q = QUIZZES[qIdx];
    tabBtns.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.quizIdx) === qIdx)));
    promptEl.textContent = q.prompt;
    optBox.className = `quiz-options ${q.type === "svg" ? "is-svg" : "is-text"}`;

    optBox.innerHTML = q.options
      .map((o) => {
        const isPicked = picked === o.key;
        const isCorrect = picked !== null && o.key === q.answer;
        const isWrong = isPicked && o.key !== q.answer;
        const cls = isCorrect ? "is-correct" : isWrong ? "is-wrong" : isPicked ? "is-picked" : "";
        return `
          <button type="button" class="quiz-opt ${cls}" data-pick="${o.key}" aria-pressed="${isPicked}">
            <div class="quiz-opt-head">
              <span class="quiz-opt-key">${o.label}</span>
              ${picked !== null ? `<span class="quiz-opt-mark">${isCorrect ? "✓ 成立" : isWrong ? "× 你的选择" : ""}</span>` : ""}
            </div>
            ${q.type === "svg" ? `<div class="quiz-svg-wrap">${posterMiniSVG(o.key, picked !== null)}</div>` : `<p class="quiz-opt-desc">${o.desc}</p>`}
          </button>
        `;
      })
      .join("");

    optBox.querySelectorAll("[data-pick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked = btn.dataset.pick;
        render();
      });
    });

    if (picked === null) {
      fbEl.innerHTML = `<p class="quiz-fb-idle">点选任意一个方案查看排印拆解（四个选项只差一个结构变量）。</p>`;
      retryBtn.hidden = true;
    } else {
      const chosen = q.options.find((o) => o.key === picked);
      const right = q.options.find((o) => o.key === q.answer);
      const ok = picked === q.answer;
      fbEl.innerHTML = `
        <div class="quiz-fb-box ${ok ? "ok" : "bad"}">
          <div class="quiz-fb-title">${ok ? `选对了 · ${chosen.label}` : `再看一步 · 你选了 ${chosen.label}，正确答案是 ${right.label}`}</div>
          <p>${chosen.explain}</p>
          ${!ok ? `<p class="quiz-fb-right"><strong>为什么选 ${right.label}：</strong>${right.explain}</p>` : ""}
        </div>
      `;
      retryBtn.hidden = false;
    }
  }

  tabBtns.forEach((b) => {
    b.addEventListener("click", () => {
      qIdx = Number(b.dataset.quizIdx);
      picked = null;
      render();
    });
  });

  retryBtn.addEventListener("click", () => {
    picked = null;
    render();
  });

  render();
}

/* ============================================================
 * 07 节：原海报点击放大 / 缩放 / 拖动 / Esc 关闭灯箱
 * ============================================================ */
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("btn-open-poster");
  const box = document.getElementById("poster-lightbox");
  const img = document.getElementById("lightbox-img");
  const stage = document.getElementById("lightbox-stage");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomInBtn = document.getElementById("lightbox-zoom-in");
  const zoomOutBtn = document.getElementById("lightbox-zoom-out");
  const resetBtn = document.getElementById("lightbox-reset");
  if (!poster || !box || !img) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;

  function applyTransform() {
    img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
  }

  function open() {
    // 遵守 GUIDE.md：海报只内联一次，灯箱直接读 #poster 的 src
    img.src = poster.currentSrc || poster.src;
    scale = 1.15;
    tx = 0;
    ty = 0;
    applyTransform();
    box.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    if (box.hidden) return;
    box.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  poster.addEventListener("click", open);
  openBtn?.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  box.addEventListener("click", (e) => {
    if (e.target === box || e.target === stage) close();
  });

  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(3.2, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  resetBtn.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  img.addEventListener("dblclick", () => {
    scale = scale > 1.3 ? 1 : 2.0;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener("pointerdown", (e) => {
    if (e.target !== img) return;
    dragging = true;
    startX = e.clientX - tx;
    startY = e.clientY - ty;
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - startX;
    ty = e.clientY - startY;
    applyTransform();
  });
  stage.addEventListener("pointerup", () => (dragging = false));
  stage.addEventListener("pointercancel", () => (dragging = false));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
}

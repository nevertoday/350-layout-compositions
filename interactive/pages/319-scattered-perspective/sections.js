// 319 散点透视 · 正文 01–07 节独立交互组件（sections.js）
// 相邻两节各用不同交互方式：01 图层徽标镜 / 02 拖动对比拉帘 / 03 长卷视窗滑块 / 04 病灶开关矩阵 / 05 场景体检卡 / 06 四选一实战练习 / 07 原海报灯箱

import { loop, pixelRatio } from "../../lib/stage.js";

/* ================= 01 · 海报三法图层透视镜 ================= */
export function initSection01() {
  const btns = [...document.querySelectorAll("[data-key-tab]")];
  const svg = document.getElementById("s01Diagram");
  const titleEl = document.getElementById("s01CapTitle");
  const bodyEl = document.getElementById("s01CapBody");
  if (!btns.length || !svg) return;

  const COPY = {
    views: {
      title: "多点观看 · 拆掉单一灭点，各立清晰视口",
      body: "海报中五个虚线圆环各自拥有独立视角（正面平视、俯瞰全貌、仰观体量），不再被迫朝同一个消失点变形压缩，单张画面得以并行容纳多组完整场景。",
    },
    dist: {
      title: "自由组织 · 用疏密聚散与隐形路径取代死板对齐",
      body: "自由不等于随便乱撒。近处中枢与左下扇形构成聚簇重心，右上、左上与底端节点拉开大块呼吸留白，再用柔和虚线箭弧把分散的元素编成有因果的关系网。",
    },
    rhythm: {
      title: "全局统筹 · 一主多辅配平视觉重量",
      body: "中央象牙与宝蓝双叠块面积最大、对比最强，充当第一落眼主锚；其余四个视点按次点与微应递减，并借点阵与小方框微调四角配重，整幅画面散而不乱。",
    },
  };

  function activate(key) {
    svg.dataset.layer = key;
    btns.forEach((b) => {
      const active = b.dataset.keyTab === key;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    titleEl.textContent = COPY[key].title;
    bodyEl.textContent = COPY[key].body;
  }

  btns.forEach((b) => b.addEventListener("click", () => activate(b.dataset.keyTab)));
  activate("views");
}

/* ================= 02 · 单灭点 vs 散点：可拖动对比拉帘 Canvas ================= */
export function initSection02() {
  const canvas = document.getElementById("compareCanvas");
  const range = document.getElementById("compareRange");
  const pctEl = document.getElementById("comparePct");
  const noteEl = document.getElementById("compareNote");
  const presets = [...document.querySelectorAll("[data-compare-preset]")];
  if (!canvas || !range) return;

  const ctx = canvas.getContext("2d");
  let split = 0.5; // 0..1，左单灭点，右散点
  let cssW = 860;
  let cssH = 420;
  let dpr = 1;
  let dragging = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(280, Math.round(rect.width));
    cssH = Math.max(200, Math.round(rect.height));
    dpr = pixelRatio(2);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
  }

  // 绘制左半：阿尔贝蒂单灭点焦点透视（所有河岸、建筑急剧收向唯一灭点，远桥与后巷被压扁遮挡）
  function drawSinglePointScene(w, h) {
    ctx.fillStyle = "#080C15";
    ctx.fillRect(0, 0, w, h);

    const vpx = w * 0.52;
    const vpy = h * 0.37;

    // 天际视平线与放射透视线
    ctx.strokeStyle = "rgba(255, 122, 107, 0.24)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(0, vpy);
    ctx.lineTo(w, vpy);
    for (let i = 0; i < 8; i++) {
      const bx = (w * i) / 7;
      ctx.moveTo(vpx, vpy);
      ctx.lineTo(bx, h);
    }
    ctx.moveTo(vpx, vpy);
    ctx.lineTo(0, h * 0.12);
    ctx.moveTo(vpx, vpy);
    ctx.lineTo(w, h * 0.12);
    ctx.stroke();
    ctx.setLineDash([]);

    // 河道急剧收窄成三角形尖端
    ctx.fillStyle = "#175F5C";
    ctx.beginPath();
    ctx.moveTo(w * 0.14, h);
    ctx.lineTo(vpx - 4, vpy);
    ctx.lineTo(vpx + 4, vpy);
    ctx.lineTo(w * 0.86, h);
    ctx.closePath();
    ctx.fill();

    // 近景巨型左侧屋檐（遮挡住后面一切街市）
    ctx.fillStyle = "#ECE6D8";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.18);
    ctx.lineTo(w * 0.27, h * 0.34);
    ctx.lineTo(w * 0.27, h * 0.78);
    ctx.lineTo(0, h * 0.96);
    ctx.closePath();
    ctx.fill();

    // 近景中屋（斜切压迫）
    ctx.fillStyle = "#2444D4";
    ctx.beginPath();
    ctx.moveTo(w * 0.29, h * 0.35);
    ctx.lineTo(w * 0.41, h * 0.37);
    ctx.lineTo(w * 0.41, h * 0.61);
    ctx.lineTo(w * 0.29, h * 0.72);
    ctx.closePath();
    ctx.fill();

    // 右岸建筑斜切收缩
    ctx.fillStyle = "#2444D4";
    ctx.beginPath();
    ctx.moveTo(w, h * 0.22);
    ctx.lineTo(w * 0.72, h * 0.35);
    ctx.lineTo(w * 0.72, h * 0.76);
    ctx.lineTo(w, h * 0.94);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ECE6D8";
    ctx.beginPath();
    ctx.moveTo(w * 0.70, h * 0.35);
    ctx.lineTo(w * 0.59, h * 0.37);
    ctx.lineTo(w * 0.59, h * 0.58);
    ctx.lineTo(w * 0.70, h * 0.70);
    ctx.closePath();
    ctx.fill();

    // 远景虹桥被透视压成极小细条
    ctx.strokeStyle = "#ECE6D8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(vpx, vpy + 22, 16, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // 单一灭点红圈
    ctx.fillStyle = "#FF7A6B";
    ctx.beginPath();
    ctx.arc(vpx, vpy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FF7A6B";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(vpx, vpy, 10, 0, Math.PI * 2);
    ctx.stroke();

    // 标注
    ctx.fillStyle = "rgba(8, 12, 21, 0.86)";
    ctx.fillRect(14, 14, 178, 28);
    ctx.strokeStyle = "#FF7A6B";
    ctx.strokeRect(14, 14, 178, 28);
    ctx.font = '600 12px "Noto Sans SC", sans-serif';
    ctx.fillStyle = "#FF8274";
    ctx.textAlign = "left";
    ctx.fillText("单点透视 · 远景压扁遮挡", 24, 32);
  }

  // 绘制右半：散点多视点平行展开（渡口、虹桥、街市、城门各自保有清晰正面与独立视角）
  function drawScatteredScene(w, h) {
    ctx.fillStyle = "#040507";
    ctx.fillRect(0, 0, w, h);

    // 蜿蜒青碧河带（S 形通脉串联三处独立景致）
    ctx.strokeStyle = "#228C88";
    ctx.lineWidth = Math.max(26, h * 0.11);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-20, h * 0.78);
    ctx.bezierCurveTo(w * 0.25, h * 0.82, w * 0.34, h * 0.34, w * 0.60, h * 0.44);
    ctx.bezierCurveTo(w * 0.78, h * 0.50, w * 0.84, h * 0.26, w + 20, h * 0.28);
    ctx.stroke();

    // 细波纹线条
    ctx.strokeStyle = "rgba(236, 230, 216, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.77);
    ctx.bezierCurveTo(w * 0.28, h * 0.78, w * 0.36, h * 0.36, w * 0.62, h * 0.44);
    ctx.bezierCurveTo(w * 0.79, h * 0.49, w * 0.84, h * 0.28, w * 0.96, h * 0.28);
    ctx.stroke();
    ctx.setLineDash([]);

    // 独立视点 1：左上街市（平视完整正立面）
    const p1x = w * 0.21, p1y = h * 0.30;
    ctx.strokeStyle = "rgba(236, 230, 216, 0.42)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(p1x, p1y, 52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ECE6D8";
    ctx.fillRect(p1x - 32, p1y - 12, 34, 30);
    ctx.fillStyle = "#2444D4";
    ctx.fillRect(p1x + 4, p1y - 24, 28, 42);
    ctx.fillStyle = "#4CD6CE";
    ctx.beginPath();
    ctx.moveTo(p1x - 36, p1y - 12);
    ctx.lineTo(p1x - 15, p1y - 30);
    ctx.lineTo(p1x + 6, p1y - 12);
    ctx.closePath();
    ctx.fill();

    // 独立视点 2：中央偏右虹桥主锚（避开 50% 拉帘中线，高视微俯全貌清晰）
    const p2x = w * 0.58, p2y = h * 0.44;
    ctx.strokeStyle = "rgba(76, 214, 206, 0.72)";
    ctx.lineWidth = 1.3;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(p2x, p2y, 64, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#ECE6D8";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(p2x, p2y + 24, 44, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.lineWidth = 1.3;
    ctx.fillStyle = "#2444D4";
    ctx.fillRect(p2x - 24, p2y - 36, 15, 15);
    ctx.fillRect(p2x + 10, p2y - 32, 17, 13);
    ctx.fillStyle = "#ECE6D8";
    ctx.beginPath();
    ctx.moveTo(p2x - 38, p2y + 26);
    ctx.lineTo(p2x - 12, p2y + 26);
    ctx.lineTo(p2x - 18, p2y + 36);
    ctx.lineTo(p2x - 32, p2y + 36);
    ctx.closePath();
    ctx.fill();

    // 独立视点 3：右下城门瓦肆（正面完整，不受远近缩成针尖）
    const p3x = w * 0.83, p3y = h * 0.69;
    ctx.strokeStyle = "rgba(236, 230, 216, 0.5)";
    ctx.lineWidth = 1.3;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(p3x, p3y, 54, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ECE6D8";
    ctx.fillRect(p3x - 32, p3y - 10, 64, 32);
    ctx.fillStyle = "#040507";
    ctx.beginPath();
    ctx.arc(p3x, p3y + 22, 13, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#2444D4";
    ctx.beginPath();
    ctx.moveTo(p3x - 38, p3y - 10);
    ctx.lineTo(p3x, p3y - 34);
    ctx.lineTo(p3x + 38, p3y - 10);
    ctx.closePath();
    ctx.fill();

    // 视点间虚线呼吸标注
    ctx.font = '600 11px "Space Mono", monospace';
    ctx.fillStyle = "#4CD6CE";
    ctx.textAlign = "center";
    ctx.fillText("VIEW 1 · 平视", p1x, p1y + 68);
    ctx.fillText("VIEW 2 · 虹桥主锚", p2x, p2y + 80);
    ctx.fillText("VIEW 3 · 城门正立", p3x, p3y + 70);

    // 右上标注
    ctx.fillStyle = "rgba(4, 5, 7, 0.88)";
    ctx.fillRect(w - 196, 14, 182, 28);
    ctx.strokeStyle = "#4CD6CE";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(w - 196, 14, 182, 28);
    ctx.font = '600 12px "Noto Sans SC", sans-serif';
    ctx.fillStyle = "#4CD6CE";
    ctx.textAlign = "right";
    ctx.fillText("散点透视 · 多景各自完整", w - 24, 32);
  }

  function render() {
    resize();
    ctx.save();
    ctx.scale(dpr, dpr);

    // 先画右侧完整散点图
    drawScatteredScene(cssW, cssH);

    // 裁出左侧单灭点图
    const sx = Math.round(split * cssW);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, sx, cssH);
    ctx.clip();
    drawSinglePointScene(cssW, cssH);
    ctx.restore();

    // 中间拉帘竖轨与抓手
    ctx.strokeStyle = "#ECE6D8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, cssH);
    ctx.stroke();

    ctx.fillStyle = "#2444D4";
    ctx.fillRect(sx - 18, cssH * 0.5 - 16, 36, 32);
    ctx.strokeStyle = "#ECE6D8";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx - 18, cssH * 0.5 - 16, 36, 32);
    ctx.fillStyle = "#EFECE2";
    ctx.font = '700 13px "Space Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText("↔", sx, cssH * 0.5 + 5);

    ctx.restore();
  }

  function updateSplit(val) {
    split = Math.max(0.08, Math.min(0.92, val));
    range.value = String(Math.round(split * 100));
    pctEl.textContent = `单灭点 ${Math.round(split * 100)}% · 散点 ${Math.round((1 - split) * 100)}%`;
    if (split > 0.72) {
      noteEl.textContent = "几乎全屏交给了单点透视：近景建筑压迫感极强，但远端虹桥被缩成小点、两侧后巷全部被挡死。";
    } else if (split < 0.28) {
      noteEl.textContent = "几乎全屏展开为散点透视：街市、虹桥、城门各自正面完整，靠蜿蜒河道把三处独立视角连成一卷。";
    } else {
      noteEl.textContent = "左右同框对照：左侧忠实于固定单眼一瞬的光学畸变，右侧牺牲严格灭点换取多处空间的完整可读性。";
    }
    ctl.draw();
  }

  const ctl = loop(canvas, () => render());
  const ro = new ResizeObserver(() => ctl.draw());
  ro.observe(canvas);

  range.addEventListener("input", () => updateSplit(Number(range.value) / 100));
  presets.forEach((btn) => {
    btn.addEventListener("click", () => updateSplit(Number(btn.dataset.comparePreset) / 100));
  });

  function setFromClientX(clientX) {
    const rect = canvas.getBoundingClientRect();
    updateSplit((clientX - rect.left) / Math.max(1, rect.width));
  }
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    canvas.setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setFromClientX(e.clientX);
  });
  canvas.addEventListener("pointerup", () => {
    dragging = false;
  });
  canvas.addEventListener("pointercancel", () => {
    dragging = false;
  });

  updateSplit(0.5);
}

/* ================= 03 · 千年脉络：横向手卷视窗漫览滑块 ================= */
export function initSection03() {
  const slider = document.getElementById("scrollViewRange");
  const track = document.getElementById("scrollTrack");
  const tagEl = document.getElementById("scrollStageTag");
  const titleEl = document.getElementById("scrollStageTitle");
  const descEl = document.getElementById("scrollStageDesc");
  const angleEl = document.getElementById("scrollStageAngle");
  const stopBtns = [...document.querySelectorAll("[data-scroll-stop]")];
  if (!slider || !track) return;

  const STOPS = [
    {
      pos: 0,
      tag: "第一幕 · 屏风右起",
      title: "听乐（平视近观）",
      angle: "独立视点 01 · 正面平视",
      desc: "顾闳中以一张直立屏风作为空间起笔，画中人围坐听琵琶，观者如同就在榻前平视，没有远处杂景抢走注意力。",
    },
    {
      pos: 25,
      tag: "第二幕 · 榻案过渡",
      title: "观舞（微俯阔场）",
      angle: "独立视点 02 · 微俯展开",
      desc: "跨过家具隔断，视点悄悄抬高一点，好让舞伎身段与击鼓众人的呼应关系完整铺开——这正是沈括所言「折高、折远，自有妙理」。",
    },
    {
      pos: 50,
      tag: "第三幕 · 立屏换景",
      title: "暂歇（局部内景）",
      angle: "独立视点 03 · 侧斜窥入",
      desc: "高大的山水屏风把前一场的喧闹彻底隔断，同一张长卷里顺理成章切进私密小憩时空，互不穿帮。",
    },
    {
      pos: 75,
      tag: "第四幕 · 排坐舒展",
      title: "清吹（横展群像）",
      angle: "独立视点 04 · 横移平拍",
      desc: "五位乐伎排坐奏管乐，人物尺寸并不因居左居右而按焦点透视缩扁，每人神态与衣纹都保有同等清晰度。",
    },
    {
      pos: 100,
      tag: "第五幕 · 卷尾收束",
      title: "散宴（余韵留白）",
      angle: "独立视点 05 · 疏朗收尾",
      desc: "人物重新疏散、留白扩大，呼应开篇屏风。全卷纵 28.7 厘米、横 335.5 厘米，五处独立视点拼成一部流动的晚宴纪录片。",
    },
  ];

  function renderPos(val) {
    const v = Math.max(0, Math.min(100, val));
    slider.value = String(v);
    // 轨道宽 220%，平移 0% 到 -54.5% 让五段依次进入视窗中央
    const shift = -(v / 100) * 54.5;
    track.style.transform = `translateX(${shift.toFixed(2)}%)`;

    let idx = Math.min(STOPS.length - 1, Math.floor((v + 12.5) / 25));
    const st = STOPS[idx];
    tagEl.textContent = st.tag;
    titleEl.textContent = st.title;
    descEl.textContent = st.desc;
    angleEl.textContent = st.angle;

    stopBtns.forEach((b, i) => {
      const on = i === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  slider.addEventListener("input", () => renderPos(Number(slider.value)));
  stopBtns.forEach((b) => {
    b.addEventListener("click", () => renderPos(Number(b.dataset.scrollStop)));
  });

  renderPos(0);
}

/* ================= 04 · 散而不乱：四枚病灶即时开关矩阵 ================= */
export function initSection04() {
  const toggles = [...document.querySelectorAll("[data-flaw-toggle]")];
  const resetBtn = document.getElementById("s04ResetBtn");
  const svg = document.getElementById("s04MiniSvg");
  const statusEl = document.getElementById("s04Status");
  const explainEl = document.getElementById("s04Explain");
  if (!toggles.length || !svg) return;

  const flaws = { flat: false, grid: false, cut: false, tilt: false };

  const HEALTHY = [
    { id: "A", x: 78, y: 54, r: 22, c: "#2444D4" },
    { id: "B", x: 256, y: 74, r: 21, c: "#228C88" },
    { id: "C", x: 158, y: 128, r: 34, c: "#ECE6D8" },
    { id: "D", x: 248, y: 186, r: 16, c: "#228C88" },
    { id: "E", x: 112, y: 212, r: 17, c: "#2444D4" },
  ];

  function update() {
    const activeKeys = Object.keys(flaws).filter((k) => flaws[k]);
    toggles.forEach((b) => {
      const k = b.dataset.flawToggle;
      const on = flaws[k];
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
      const tag = b.querySelector(".flaw-state");
      if (tag) tag.textContent = on ? "已触发病灶" : "正常";
    });

    // 根据开启的病灶计算 5 个点的几何形态
    const pts = HEALTHY.map((p, i) => {
      let x = p.x;
      let y = p.y;
      let r = p.r;
      if (flaws.grid) {
        const gx = [72, 248, 160, 248, 72][i];
        const gy = [62, 62, 132, 202, 202][i];
        x = gx;
        y = gy;
      }
      if (flaws.tilt) {
        x = 58 + (x - 58) * 0.48;
      }
      if (flaws.flat) {
        r = 22;
      }
      return { ...p, x, y, r };
    });

    // 更新 SVG 节点与连线
    pts.forEach((p) => {
      const g = svg.querySelector(`[data-mini-node="${p.id}"]`);
      if (!g) return;
      g.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      const outer = g.querySelector(".m-ring");
      const core = g.querySelector(".m-core");
      if (outer) outer.setAttribute("r", String(p.r));
      if (core) core.setAttribute("r", String(Math.max(6, p.r * 0.45)));
    });

    const pathEl = svg.querySelector("#s04LinkPath");
    if (pathEl) {
      if (flaws.cut) {
        pathEl.setAttribute("opacity", "0");
      } else {
        pathEl.setAttribute("opacity", "1");
        const d = `M ${pts[0].x} ${pts[0].y} Q ${(pts[0].x + pts[2].x) / 2 - 14} ${(pts[0].y + pts[2].y) / 2 + 12} ${pts[2].x} ${pts[2].y} T ${pts[1].x} ${pts[1].y} M ${pts[2].x} ${pts[2].y} Q ${(pts[2].x + pts[3].x) / 2 + 10} ${(pts[2].y + pts[3].y) / 2 - 10} ${pts[3].x} ${pts[3].y} L ${pts[4].x} ${pts[4].y}`;
        pathEl.setAttribute("d", d);
      }
    }

    // 视觉重心标点
    let sw = 0, sx = 0, sy = 0;
    pts.forEach((p) => {
      const w = p.r * p.r;
      sw += w;
      sx += p.x * w;
      sy += p.y * w;
    });
    const cx = sx / sw;
    const cy = sy / sw;
    const cg = svg.querySelector("#s04Centroid");
    if (cg) {
      cg.setAttribute("cx", cx.toFixed(1));
      cg.setAttribute("cy", cy.toFixed(1));
      cg.setAttribute("fill", flaws.tilt ? "#FF7A6B" : "#4CD6CE");
    }

    if (activeKeys.length === 0) {
      statusEl.textContent = "健康态 · 4 条经验同时成立";
      statusEl.className = "s04-status is-ok";
      explainEl.textContent = "一主四辅、疏密有别、虚线通脉、重心居中。试着点开任意一项病灶开关，观察单变量如何让画面散架。";
    } else {
      const labels = { flat: "五点平权", grid: "机械等距", cut: "切断连脉", tilt: "重心塌左" };
      statusEl.textContent = `触发 ${activeKeys.length} 项病灶：${activeKeys.map((k) => labels[k]).join(" + ")}`;
      statusEl.className = "s04-status is-bad";
      const msgs = [];
      if (flaws.flat) msgs.push("五个圆环同大，眼睛找不到第一落点");
      if (flaws.grid) msgs.push("间距均等对称，节奏立刻退化成僵硬表格");
      if (flaws.cut) msgs.push("连脉消失，五点碎成孤立贴纸");
      if (flaws.tilt) msgs.push("视觉重量全压左半边，右半空洞失衡");
      explainEl.textContent = msgs.join("；") + "。";
    }
  }

  toggles.forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.flawToggle;
      flaws[k] = !flaws[k];
      update();
    });
  });

  resetBtn?.addEventListener("click", () => {
    Object.keys(flaws).forEach((k) => (flaws[k] = false));
    update();
  });

  update();
}

/* ================= 05 · 什么时候用，什么时候别用：场景适配体检卡 ================= */
export function initSection05() {
  const btns = [...document.querySelectorAll("[data-case-id]")];
  const verdictEl = document.getElementById("s05Verdict");
  const titleEl = document.getElementById("s05Title");
  const reasonEl = document.getElementById("s05Reason");
  const tipEl = document.getElementById("s05Tip");
  if (!btns.length) return;

  const CASES = {
    museum: {
      ok: true,
      verdict: "强烈推荐 · 散点透视主场",
      title: "大型博物馆 / 园区全景导览图",
      reason: "观众需要同时看清入口、主展馆、连廊、庭院与出口五个重要节点的位置与关系。若套用单点透视，远处展馆会被压缩得看不清门朝哪开；用散点多视点，每个场馆都能保持清晰正立面，由步道串起全局。",
      tip: "实操提示：把主展馆设为 1.8×–2.5× 视觉主锚，其余场馆错落分级，用一条高辨识游览虚线贯通。",
    },
    promo: {
      ok: false,
      verdict: "建议绕开 · 改用单焦点集中",
      title: "电商限时秒杀弹窗 / 单目标转化首屏",
      reason: "这类页面要求用户在 1–2 秒内只盯住唯一商品和唯一行动按钮。引入多个并置视觉中心会分散注意力、拉长决策路径，直接拉低点击转化率。",
      tip: "替代建议：用强中心构图或单点视线引导，把全部明度对比与空间收敛到唯一主按钮上。",
    },
    festival: {
      ok: true,
      verdict: "非常适合 · 氛围与叙事兼得",
      title: "城市文化漫步节 / 品牌生态全景长图",
      reason: "活动包含市集、音乐、书店、咖啡与夜场多个平行亮点，没有绝对先后顺序。散点透视允许读者从自己最感兴趣的一处落眼，再顺着图形节奏逐一探索其余板块。",
      tip: "实操提示：别把五个活动画成等大五宫格；拉出主活动大块面，再用大面积底色留白承托疏密节奏。",
    },
    car: {
      ok: false,
      verdict: "明确禁区 · 需要严格光学透视",
      title: "工业产品结构渲染 / 建筑实景效果图",
      reason: "客户评审汽车车身比例或建筑真实体量时，依赖严格的近大远小光学规律与统一灭点。散点透视打破了单一机位几何约束，会让人误判真实尺寸与空间纵深。",
      tip: "替代建议：采用严谨的一点/两点透视，或用高远/深远单轴纵深构图交代体量。",
    },
  };

  function pick(id) {
    const c = CASES[id];
    btns.forEach((b) => {
      const on = b.dataset.caseId === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    verdictEl.textContent = c.verdict;
    verdictEl.className = `s05-verdict ${c.ok ? "is-ok" : "is-no"}`;
    titleEl.textContent = c.title;
    reasonEl.textContent = c.reason;
    tipEl.textContent = c.tip;
  }

  btns.forEach((b) => b.addEventListener("click", () => pick(b.dataset.caseId)));
  pick("museum");
}

/* ================= 06 · 小练习：四选一中性实战判题 ================= */
export function initSection06() {
  const cards = [...document.querySelectorAll("[data-quiz-opt]")];
  const fbBox = document.getElementById("quizFeedback");
  const fbHead = document.getElementById("quizFbHead");
  const fbBody = document.getElementById("quizFbBody");
  if (!cards.length || !fbBox) return;

  const ANSWERS = {
    A: {
      correct: false,
      head: "方案 A 不够格：退化成机械等距网格",
      body: "五个节点大小相近、严格等距排成对称十字方阵，虽然不拥挤也有连线，但彻底失去了「主次分级」与「疏密节奏」，人眼一看就像一张死板的图标表格，而非散点透视的灵动秩序。正确答案是方案 C。",
    },
    B: {
      correct: false,
      head: "方案 B 不够格：被单一灭点绑架",
      body: "五个节点被强行收束向右上同一个消失点，远端两个节点急剧缩小重叠、细节模糊，本质上退回了单点焦点透视，违背了散点透视「不依赖单一视点、多景各自清晰」的前提。正确答案是方案 C。",
    },
    C: {
      correct: true,
      head: "答对了！方案 C 站得最稳",
      body: "方案 C 中五处视点各自保持清晰独立形态；中枢主锚体量明确，其余四处次点与微应错落分布、有聚有散且不贴边；克制的虚线曲径将五点顺畅串联，加权总重心平稳落在画心附近，完美平衡了自由与秩序。",
    },
    D: {
      correct: false,
      head: "方案 D 不够格：重心塌角且散而不联",
      body: "虽然拉开了大小差异，也保留了独立视角，但五个节点全部堆挤偏沉在左半边、没有任何关系路径牵引，导致右侧留出失衡空洞，视觉像秤杆一边坠底。正确答案是方案 C。",
    },
  };

  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      const opt = btn.dataset.quizOpt;
      const ans = ANSWERS[opt];
      cards.forEach((c) => {
        const k = c.dataset.quizOpt;
        c.classList.remove("is-picked", "is-right", "is-wrong");
        c.setAttribute("aria-pressed", String(k === opt));
        if (k === opt) c.classList.add("is-picked", ans.correct ? "is-right" : "is-wrong");
        if (k === "C") c.classList.add("is-right");
      });
      fbBox.hidden = false;
      fbBox.className = `quiz-feedback ${ans.correct ? "is-right" : "is-wrong"}`;
      fbHead.textContent = ans.head;
      fbBody.textContent = ans.body;
    });
  });
}

/* ================= 07 · 原海报灯箱（放大、拖动、Esc 关闭） ================= */
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("posterZoomBtn");
  const modal = document.getElementById("posterModal");
  const modalImg = document.getElementById("posterModalImg");
  const closeBtn = document.getElementById("posterCloseBtn");
  const zoomInBtn = document.getElementById("posterZoomIn");
  const zoomOutBtn = document.getElementById("posterZoomOut");
  const zoomResetBtn = document.getElementById("posterZoomReset");
  const stage = document.getElementById("posterModalStage");
  if (!poster || !modal || !modalImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale.toFixed(2)})`;
  }

  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function open() {
    // 复用页面已内联的 poster.webp，不二次内联图片
    if (!modalImg.src) modalImg.src = poster.currentSrc || poster.src;
    resetView();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  openBtn?.addEventListener("click", open);
  poster.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3.2, scale + 0.35);
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.8, scale - 0.35);
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", resetView);

  stage?.addEventListener(
    "wheel",
    (e) => {
      if (modal.hidden) return;
      e.preventDefault();
      scale = Math.max(0.8, Math.min(3.5, scale + (e.deltaY < 0 ? 0.2 : -0.2)));
      applyTransform();
    },
    { passive: false }
  );

  modalImg.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    modalImg.setPointerCapture?.(e.pointerId);
  });
  modalImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  modalImg.addEventListener("pointerup", () => {
    dragging = false;
  });
  modalImg.addEventListener("pointercancel", () => {
    dragging = false;
  });
}

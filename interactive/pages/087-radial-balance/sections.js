// 087 放射平衡 · 第 01–07 节各具特色交互模块（相邻节绝不复用同种控件）
import { PALETTE } from "./palette.js";
import { loop, pixelRatio } from "../../lib/stage.js";

const TAU = Math.PI * 2;
const SVG_NS = "http://www.w3.org/2000/svg";

function elSvg(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

/* ==================== 01｜八方位矢量拔河 SVG 盘 ==================== */
export function initTugLab() {
  const svg = document.getElementById("tug-svg");
  const readout = document.getElementById("tug-readout");
  const explain = document.getElementById("tug-explain");
  if (!svg) return;

  // 8 个方位的砝码重量（0..3），开场故意右下偏载
  const weights = [0, 2, 3, 2, 0, 0, 0, 1];
  const labels = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  const cx = 180;
  const cy = 180;
  const ringR = 122;

  function render() {
    svg.innerHTML = "";

    // 外刻度圈与十字淡线
    svg.append(
      elSvg("circle", { cx, cy, r: ringR, fill: "none", stroke: "rgba(100,23,32,0.22)", "stroke-dasharray": "4 4", "stroke-width": 1.3 }),
      elSvg("circle", { cx, cy, r: 44, fill: "none", stroke: "rgba(228,91,69,0.26)", "stroke-dasharray": "3 4", "stroke-width": 1.1 }),
      elSvg("line", { x1: cx - ringR - 14, y1: cy, x2: cx + ringR + 14, y2: cy, stroke: "rgba(100,23,32,0.14)", "stroke-width": 1 }),
      elSvg("line", { x1: cx, y1: cy - ringR - 14, x2: cx, y2: cy + ringR + 14, stroke: "rgba(100,23,32,0.14)", "stroke-width": 1 })
    );

    let sx = 0;
    let sy = 0;
    let sw = 0;

    for (let i = 0; i < 8; i++) {
      const ang = (i * 45 - 90) * (Math.PI / 180);
      const x = cx + Math.cos(ang) * ringR;
      const y = cy + Math.sin(ang) * ringR;
      const w = weights[i];
      if (w > 0) {
        sx += w * Math.cos(ang);
        sy += w * Math.sin(ang);
        sw += w;
      }

      // 射线连杆
      svg.append(elSvg("line", {
        x1: cx, y1: cy, x2: x, y2: y,
        stroke: w > 0 ? PALETTE.burgundy : "rgba(100,23,32,0.16)",
        "stroke-width": w > 0 ? 1.2 + w * 0.7 : 1,
        "stroke-dasharray": w > 0 ? "none" : "3 4",
      }));

      // 可点击的砝码圆槽（≥ 40px 命中区）
      const g = elSvg("g", {
        class: "tug-node",
        role: "button",
        tabindex: "0",
        "aria-label": `${labels[i]}方向，当前砝码 ${w} 级，点击增减`,
        style: "cursor:pointer",
      });

      // 隐形扩大点击区
      g.append(elSvg("circle", { cx: x, cy: y, r: 24, fill: "transparent" }));
      const visR = w === 0 ? 13 : 11 + w * 4.2;
      g.append(elSvg("circle", {
        cx: x, cy: y, r: visR,
        fill: w === 0 ? PALETTE.paperBright : w === 3 ? PALETTE.burgundy : w === 2 ? PALETTE.coral : PALETTE.tan,
        stroke: w === 0 ? PALETTE.burgundy : PALETTE.paperBright,
        "stroke-width": w === 0 ? 1.5 : 2,
      }));
      const txt = elSvg("text", {
        x, y: y + 4.5,
        "text-anchor": "middle",
        fill: w === 0 ? PALETTE.inkSoft : "#FFFDF9",
        "font-family": '"Space Mono", monospace',
        "font-size": "13",
        "font-weight": "700",
      });
      txt.textContent = String(w);
      g.append(txt);

      const lx = cx + Math.cos(ang) * (ringR + 30);
      const ly = cy + Math.sin(ang) * (ringR + 30) + 4;
      const lbl = elSvg("text", {
        x: lx, y: ly,
        "text-anchor": "middle",
        fill: PALETTE.inkSoft,
        "font-size": "11",
        "font-weight": "700",
      });
      lbl.textContent = labels[i];
      svg.append(lbl);

      const toggle = () => {
        weights[i] = (weights[i] + 1) % 4;
        render();
      };
      g.addEventListener("click", toggle);
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
      svg.append(g);
    }

    // 中心核与合力矢量箭
    const drift = sw > 0 ? Math.hypot(sx, sy) / sw : 0;
    const driftPct = Math.round(drift * 100);
    const activeSlots = weights.filter((v) => v > 0).length;
    const isBalanced = activeSlots >= 3 && drift <= 0.08;

    // 检查是不是「不等角但平衡」
    const symmetric = weights.every((v, i) => v === weights[(i + 4) % 8]);

    svg.append(elSvg("circle", {
      cx, cy, r: 24,
      fill: isBalanced ? PALETTE.ok : PALETTE.coral,
      stroke: PALETTE.paperBright,
      "stroke-width": 2.5,
    }));

    if (sw > 0 && drift > 0.03) {
      const vx = cx + (sx / sw) * (ringR * 0.78);
      const vy = cy + (sy / sw) * (ringR * 0.78);
      const a = Math.atan2(vy - cy, vx - cx);
      const col = isBalanced ? PALETTE.ok : PALETTE.warn;
      svg.append(elSvg("line", { x1: cx, y1: cy, x2: vx, y2: vy, stroke: col, "stroke-width": 3 }));
      const p1 = `${vx},${vy}`;
      const p2 = `${vx - 11 * Math.cos(a - 0.45)},${vy - 11 * Math.sin(a - 0.45)}`;
      const p3 = `${vx - 11 * Math.cos(a + 0.45)},${vy - 11 * Math.sin(a + 0.45)}`;
      svg.append(elSvg("polygon", { points: `${p1} ${p2} ${p3}`, fill: col }));
    } else if (isBalanced) {
      const check = elSvg("text", {
        x: cx, y: cy + 5,
        "text-anchor": "middle",
        fill: "#FFFDF9",
        "font-family": '"Space Mono", monospace',
        "font-size": "12",
        "font-weight": "700",
      });
      check.textContent = "Δ0";
      svg.append(check);
    }

    readout.classList.toggle("is-ok", isBalanced);
    if (sw === 0) {
      readout.textContent = "空盘 · 请点圆槽放砝码";
      explain.textContent = "盘面上还没有视觉重量。试着在任意方位点几下，先制造偏载，再在对面找回平衡。";
    } else if (activeSlots < 3) {
      readout.textContent = `仅 ${activeSlots} 枚 · 偏单薄（偏移 ${driftPct}%）`;
      explain.textContent = "只放一两枚砝码时，画面像直线跷跷板而不是向四周扩散的放射场。至少在 3 个以上方位落子，才真正构成放射平衡。";
    } else if (isBalanced) {
      readout.textContent = symmetric ? `等角对称平衡 · ΔG ${driftPct}%` : `不等角力矩配平 · ΔG ${driftPct}%`;
      explain.textContent = symmetric
        ? "各方位等角对称，力矩两两抵消，这是最稳妥、最容易一眼读懂的经典放射平衡。"
        : "漂亮！左右角度并不对称，但一侧重块抵消了对侧多枚轻块的合力，矢量同样归零——这就是更富动态张力的非对称放射平衡。";
    } else {
      const deg = ((Math.atan2(sy, sx) * 180) / Math.PI + 360) % 360;
      const idx = Math.round(((deg + 90) % 360) / 45) % 8;
      readout.textContent = `合力偏移 ${driftPct}% · 偏${labels[idx]}`;
      explain.textContent = `视觉重量明显倒向${labels[idx]}方向，红箭把重心从圆心扯偏了 ${driftPct}%。往对侧${labels[(idx + 4) % 8]}方位补砝码，就能把它拉回原点。`;
    }
  }

  document.querySelectorAll("[data-tug]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.tug;
      const map = {
        skew:  [0, 2, 3, 2, 0, 0, 0, 1],
        sym:   [2, 1, 2, 1, 2, 1, 2, 1],
        // 不等角但精确合力≈0：北3 抵消 东南2+西南2(2*0.707*2=2.83) 加微调 -> 西3 抵消 东北2+东南2(2*0.707*2=2.83)，偏移仅 2.4%！
        asym:  [0, 2, 0, 2, 0, 0, 3, 0],
        clear: [0, 0, 0, 0, 0, 0, 0, 0],
      };
      const next = map[mode];
      if (next) {
        next.forEach((v, i) => { weights[i] = v; });
        render();
      }
    });
  });

  render();
}

/* ==================== 02｜一核三层原海报乐谱剥离 ==================== */
export function initTierDeck() {
  const canvas = document.getElementById("tier-canvas");
  const caption = document.getElementById("tier-caption");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const layers = { hub: true, cardinal: true, diagonal: true, minor: true };
  let rmode = "tiered"; // "tiered" | "uniform" | "inverted"

  function draw() {
    const dpr = pixelRatio(2);
    const size = Math.min(400, Math.max(260, Math.round(canvas.getBoundingClientRect().width || 360)));
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.43;

    // 双层虚线测角环
    ctx.strokeStyle = "rgba(228,91,69,0.36)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.27, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    const lenMap = rmode === "uniform"
      ? { cardinal: 0.86, diagonal: 0.86, minor: 0.86 }
      : rmode === "inverted"
        ? { cardinal: 0.50, diagonal: 0.72, minor: 0.94 }
        : { cardinal: 0.92, diagonal: 0.78, minor: 0.62 };

    // 4 十字主轴
    if (layers.cardinal) {
      for (let i = 0; i < 4; i++) {
        const a = (i * 90 - 90) * (Math.PI / 180);
        const r1 = R * lenMap.cardinal;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a);
        ctx.strokeStyle = PALETTE.burgundy;
        ctx.lineWidth = rmode === "uniform" ? 1.5 : 2.1;
        ctx.beginPath();
        ctx.moveTo(R * 0.25, 0);
        ctx.lineTo(r1, 0);
        ctx.stroke();
        if (rmode !== "uniform") {
          ctx.fillStyle = PALETTE.coral;
          ctx.fillRect(R * 0.48, -6, 15, 12);
          ctx.fillStyle = PALETTE.burgundy;
          ctx.beginPath();
          ctx.arc(r1, 0, 10, 0, TAU);
          ctx.fill();
        } else {
          ctx.fillStyle = PALETTE.burgundy;
          ctx.beginPath();
          ctx.arc(r1, 0, 5.5, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // 4 斜脉
    if (layers.diagonal) {
      for (let i = 0; i < 4; i++) {
        const a = (i * 90 - 45) * (Math.PI / 180);
        const r1 = R * lenMap.diagonal;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a);
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(R * 0.25, 0);
        ctx.lineTo(r1, 0);
        ctx.stroke();
        if (rmode !== "uniform") {
          ctx.save();
          ctx.translate(r1 * 0.62, 0);
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = PALETTE.burgundy;
          ctx.fillRect(-6, -6, 12, 12);
          ctx.restore();
          ctx.save();
          ctx.translate(r1, 0);
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = PALETTE.coral;
          ctx.fillRect(-5, -5, 10, 10);
          ctx.restore();
        } else {
          ctx.fillStyle = PALETTE.burgundy;
          ctx.beginPath();
          ctx.arc(r1, 0, 5.5, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // 8 副沙金射线
    if (layers.minor) {
      for (let i = 0; i < 8; i++) {
        const a = (i * 45 - 67.5) * (Math.PI / 180);
        const r1 = R * lenMap.minor;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a);
        ctx.strokeStyle = rmode === "uniform" ? PALETTE.burgundy : PALETTE.tan;
        ctx.lineWidth = rmode === "uniform" ? 1.5 : 1.1;
        ctx.setLineDash(rmode === "uniform" ? [] : [5, 4]);
        ctx.beginPath();
        ctx.moveTo(R * 0.25, 0);
        ctx.lineTo(r1, 0);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = rmode === "uniform" ? PALETTE.burgundy : i % 2 === 0 ? PALETTE.tan : PALETTE.coral;
        ctx.beginPath();
        ctx.arc(r1, 0, rmode === "uniform" ? 5.5 : 5, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }

    // 第 1 层：珊瑚圆核
    if (layers.hub) {
      ctx.fillStyle = PALETTE.coral;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.205, 0, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = "rgba(184,42,26,0.55)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.205, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();

    const onCount = Object.values(layers).filter(Boolean).length;
    if (onCount === 0) {
      caption.textContent = "所有层级均已关闭。先打开「珊瑚圆核」，再逐层加上十字主轴、斜脉与副射线。";
    } else if (!layers.hub) {
      caption.textContent = "关掉珊瑚圆核后，虽然四周射线仍然对称，中间却裂开一个空洞——这就是缺少「中心聚合」的空心感。";
    } else if (rmode === "uniform") {
      caption.textContent = "等长钢丝轮模式：16 条射线被压成相同长度与端珠。虽然 100% 对称，但呆板沉闷，缺乏强弱拍的节奏变化。";
    } else if (rmode === "inverted") {
      caption.textContent = "主短副长倒置：原本轻快的 8 根副射线冲得比主轴更长，主次层次翻转，外围轮廓显得杂乱焦躁。";
    } else if (layers.hub && layers.cardinal && !layers.diagonal && !layers.minor) {
      caption.textContent = "仅剩圆核 + 十字主轴：重心极稳，但四个 90° 象限大片空缺，还只是十字坐标，尚未化开成圆润放射场。";
    } else {
      caption.textContent = `当前开启 ${onCount}/4 层 · 三阶递进：珊瑚圆核锁定焦点，长主轴定方位，斜脉补对角，沙金副点带出呼吸韵律。`;
    }
  }

  document.querySelectorAll("#tier-switches .layer-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.layer;
      layers[k] = !layers[k];
      btn.classList.toggle("is-on", layers[k]);
      btn.setAttribute("aria-pressed", String(layers[k]));
      btn.querySelector(".layer-state").textContent = layers[k] ? "开启" : "关闭";
      draw();
    });
  });

  document.querySelectorAll(".step-btn[data-rmode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      rmode = btn.dataset.rmode;
      document.querySelectorAll(".step-btn[data-rmode]").forEach((b) => b.classList.toggle("is-active", b === btn));
      draw();
    });
  });

  window.addEventListener("resize", draw);
  draw();
}

/* ==================== 03｜历史里程碑（4 年代实时拓扑 Canvas） ==================== */
const ERAS = {
  chartres: {
    title: "沙特尔主教座堂的三座 13 世纪玫瑰窗",
    body: "法国沙特尔主教座堂（联合国教科文组织世界遗产第 81 号）在西、北、南三面各建有一座巨型 13 世纪彩绘玫瑰窗，直径均超过 10 米。中央圆盘安置核心圣像，石窗棂自圆心分层向外辐射，把几十块叙事彩璃收拢成一眼可辨的向心秩序。",
    takeaway: "排版启发：放射结构能把几十块零碎信息收编进同一个清晰骨架里，不靠文字编号也能分出由内到外的主次层级。",
  },
  nightingale: {
    title: "1858 年南丁格尔极区面积图（玫瑰图）",
    body: "佛罗伦斯·南丁格尔在 1858 年呈交英国政府的克里米亚战地卫生报告里，把 12 个月等角排成一圈扇区，以扇区面积代表不同死因人数。她借此让非专业官员一眼看见：可预防的医院疫病（外扩宽扇）远高于前线战伤，直接促成了医院卫生改革；同年她当选皇家统计学会首位女性会员。",
    takeaway: "排版启发：遇到 12 个月、24 小时这类循环周期数据时，放射扇区能让对比和周期波峰一秒击中决策者。",
  },
  thompson: {
    title: "1917 年汤普森《生长与形态》与自然叶序",
    body: "苏格兰生物数学家达西·温特沃思·汤普森在剑桥大学出版社出版《生长与形态》（1917 年初版，1942 年修订），系统用表面张力、力学平衡与几何学解释放射虫骨架、水母与植物螺旋叶序。自然界大量采用辐射对称，是因为它在各个方向上承受流体阻力与获取光照最省材料。",
    takeaway: "排版启发：人眼天然偏爱放射平衡，不只因为美观，还因为我们在自然界亿万次见过这套低耗高效的稳定结构。",
  },
  piemenu: {
    title: "1982 年阿恩海姆与 1988 年 CHI 饼形菜单",
    body: "鲁道夫·阿恩海姆在《中心的力量》（1982）里把向心放射系统与直角网格并列为视觉构图的两大母型。六年后的 ACM CHI ’88 会议上，卡拉汉、霍普金斯、韦泽与施耐德曼发表经典论文实证：围绕光标等角排布的饼形菜单依据菲茨定律，选择速度比传统线性下拉菜单快约 15%，误选率也更低。",
    takeaway: "排版启发：当用户从屏幕中心点起手选择 4–8 个高频动作时，放射布局把每个目标的移动距离拉成完全相等的最短半径。",
  },
};

export function initHistoryLab() {
  const canvas = document.getElementById("history-canvas");
  const titleEl = document.getElementById("era-title");
  const bodyEl = document.getElementById("era-body");
  const takeEl = document.getElementById("era-takeaway");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let activeEra = "chartres";
  let spin = 0;

  function drawFrame(t, dt, { still }) {
    if (!still) spin += dt * 0.22;
    const dpr = pixelRatio(2);
    const size = Math.min(340, Math.max(220, Math.round(canvas.getBoundingClientRect().width || 300)));
    if (canvas.width !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.42;

    // 暗底测角细圆
    ctx.strokeStyle = "rgba(245,236,224,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.stroke();

    if (activeEra === "chartres") {
      // 12 瓣双环哥特玫瑰窗几何拓扑
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + (still ? 0 : spin * 0.12);
        const mid = a + Math.PI / 12;
        ctx.strokeStyle = "rgba(245,236,224,0.34)";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();

        // 外瓣彩璃圆
        ctx.fillStyle = i % 2 === 0 ? "rgba(228,91,69,0.72)" : "rgba(180,127,90,0.58)";
        ctx.beginPath();
        ctx.arc(cx + Math.cos(mid) * R * 0.72, cy + Math.sin(mid) * R * 0.72, R * 0.145, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = PALETTE.lightText;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // 内瓣菱光
        ctx.fillStyle = "rgba(245,236,224,0.18)";
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * R * 0.42, cy + Math.sin(a) * R * 0.42, R * 0.08, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = PALETTE.coral;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.21, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = PALETTE.lightText;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    } else if (activeEra === "nightingale") {
      // 12 月极区面积图示意（前几月卫生改革前疫病扇区巨大，改革后骤降）
      const disease = [0.24, 0.34, 0.56, 0.78, 0.94, 0.98, 0.86, 0.64, 0.44, 0.32, 0.26, 0.22];
      const wounds  = [0.14, 0.18, 0.24, 0.30, 0.28, 0.22, 0.20, 0.18, 0.15, 0.13, 0.12, 0.11];
      const step = TAU / 12;
      for (let i = 0; i < 12; i++) {
        const a0 = -Math.PI / 2 + i * step;
        const a1 = a0 + step;
        // 疫病外扇（冷青灰呼应历史图版，保持高可见度）
        ctx.fillStyle = "rgba(140, 212, 198, 0.42)";
        ctx.strokeStyle = "rgba(245,236,224,0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R * disease[i], a0, a1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 战伤内扇（珊瑚红）
        ctx.fillStyle = "rgba(228,91,69,0.78)";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R * wounds[i], a0, a1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = PALETTE.lightText;
      ctx.font = '700 11px "Space Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("12 MONTHS · POLAR AREA", cx, size - 10);
    } else if (activeEra === "thompson") {
      // 黄金角 137.5° 植物叶序放射螺旋
      const golden = 137.508 * (Math.PI / 180);
      const count = 88;
      for (let i = 1; i <= count; i++) {
        const r = R * 0.94 * Math.sqrt(i / count);
        const a = i * golden + (still ? 0 : spin * 0.25);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        const dotR = 2.4 + (i / count) * 4.2;
        ctx.fillStyle = i % 3 === 0 ? PALETTE.coral : i % 3 === 1 ? PALETTE.tan : PALETTE.lightText;
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = PALETTE.lightText;
      ctx.font = '700 11px "Space Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("137.5° PHYLLOTAXIS", cx, size - 10);
    } else {
      // CHI '88 饼形菜单等距扇区示意（扫过高亮）
      const slices = 8;
      const hi = still ? 1 : Math.floor((t * 1.1) % slices);
      const step = TAU / slices;
      for (let i = 0; i < slices; i++) {
        const a0 = -Math.PI / 2 + i * step;
        const a1 = a0 + step;
        ctx.fillStyle = i === hi ? "rgba(228,91,69,0.78)" : "rgba(245,236,224,0.08)";
        ctx.strokeStyle = "rgba(245,236,224,0.38)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R * 0.92, a0, a1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      // 中心光标圈与等距矢量箭头
      const midA = -Math.PI / 2 + (hi + 0.5) * step;
      ctx.strokeStyle = PALETTE.okLight;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(midA) * R * 0.62, cy + Math.sin(midA) * R * 0.62);
      ctx.stroke();

      ctx.fillStyle = PALETTE.darkRoom;
      ctx.strokeStyle = PALETTE.lightText;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.22, 0, TAU);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = PALETTE.lightText;
      ctx.font = '700 11px "Space Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("EQUAL RADIUS · FITTS LAW", cx, size - 10);
    }

    ctx.restore();
  }

  const ctrl = loop(canvas, drawFrame);

  document.querySelectorAll(".era-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeEra = btn.dataset.era;
      const d = ERAS[activeEra];
      titleEl.textContent = d.title;
      bodyEl.textContent = d.body;
      takeEl.textContent = d.takeaway;
      document.querySelectorAll(".era-btn").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      ctrl.draw();
    });
  });
}

/* ==================== 04｜6 扇区真能点选径向菜单 ==================== */
export function initPieDemo() {
  const wheel = document.getElementById("pie-wheel");
  const status = document.getElementById("pie-status");
  const orientBtn = document.getElementById("btn-pie-orient");
  const hubBtn = document.getElementById("pie-hub");
  if (!wheel) return;

  const wedges = [...wheel.querySelectorAll(".pie-wedge")];
  let rotated = false;

  function place() {
    const r = wheel.clientWidth < 265 ? 92 : 102;
    for (const w of wedges) {
      const deg = Number(w.dataset.angle);
      const rad = (deg * Math.PI) / 180;
      const tx = Math.round(Math.cos(rad) * r);
      const ty = Math.round(Math.sin(rad) * r);
      // 展示「水平易读」vs「硬按圆周旋转导致下半圆倒字」的真实区别
      const rot = rotated ? ` rotate(${deg + 90}deg)` : "";
      w.style.transform = `translate(${tx}px, ${ty}px)${rot}`;
    }
  }

  wedges.forEach((w) => {
    w.addEventListener("click", () => {
      wedges.forEach((x) => x.classList.toggle("is-selected", x === w));
      status.textContent = `已触发「${w.dataset.cmd}」· 方向 ${w.dataset.angle}°，与其余 5 项同距直达`;
    });
  });

  hubBtn?.addEventListener("click", () => {
    wedges.forEach((x) => x.classList.remove("is-selected"));
    status.textContent = "已回到工具核 · 任意方向滑出相同距离即可命中对应指令";
  });

  orientBtn?.addEventListener("click", () => {
    rotated = !rotated;
    orientBtn.textContent = rotated ? "文字朝向：贴弧旋转（底项倒立）" : "文字朝向：水平易读";
    place();
  });

  window.addEventListener("resize", place);
  place();
}

/* ==================== 05｜什么时候别用：四组翻面排雷对照 SVG ==================== */
const ANTI_DATA = {
  longtext: {
    badDesc: "<strong>翻车原因：</strong>长文靠稳定整齐的左对齐起始边维持扫读节奏。把正文绕成辐射状，读者每换一行都要重找起点，四角还会空出大量废白。",
    goodDesc: "<strong>改用正解：</strong>切回清晰的单栏或双栏左对齐阅读网格，把放射结构留给章节封面或配图，不折腾连续阅读的眼球。",
    badSvg: `<svg viewBox="0 0 300 130" aria-hidden="true">
      <rect x="8" y="6" width="284" height="118" fill="#FAF5EC" stroke="#B82A1A" stroke-dasharray="4 3"/>
      <circle cx="150" cy="65" r="14" fill="#E45B45"/>
      <g stroke="#641720" stroke-width="3" stroke-linecap="round">
        <line x1="150" y1="44" x2="150" y2="16"/><line x1="171" y1="65" x2="255" y2="65"/>
        <line x1="150" y1="86" x2="150" y2="114"/><line x1="129" y1="65" x2="45" y2="65"/>
        <line x1="166" y1="50" x2="225" y2="20"/><line x1="166" y1="80" x2="225" y2="110"/>
        <line x1="134" y1="50" x2="75" y2="20"/><line x1="134" y1="80" x2="75" y2="110"/>
      </g>
      <text x="20" y="22" font-size="11" fill="#B82A1A" font-weight="700">废白</text>
      <text x="256" y="116" font-size="11" fill="#B82A1A" font-weight="700">折返</text>
    </svg>`,
    goodSvg: `<svg viewBox="0 0 300 130" aria-hidden="true">
      <rect x="8" y="6" width="284" height="118" fill="#FAF5EC" stroke="#1A6B4F" stroke-width="1.5"/>
      <rect x="24" y="20" width="110" height="8" fill="#341114"/>
      <g fill="#59393B" opacity="0.72">
        <rect x="24" y="38" width="118" height="5"/><rect x="24" y="50" width="112" height="5"/><rect x="24" y="62" width="116" height="5"/><rect x="24" y="74" width="96" height="5"/>
        <rect x="160" y="38" width="114" height="5"/><rect x="160" y="50" width="110" height="5"/><rect x="160" y="62" width="116" height="5"/><rect x="160" y="74" width="102" height="5"/>
      </g>
      <text x="24" y="108" font-size="11" fill="#1A6B4F" font-weight="700">整齐左起点 · 连续流畅扫读</text>
    </svg>`,
  },
  steps: {
    badDesc: "<strong>翻车原因：</strong>放射圆周天然暗示「各个方向地位等价、不分先后」。把 1→6 步硬摆成花瓣，读者常找不到起点在哪、顺时针还是逆时针看。",
    goodDesc: "<strong>改用正解：</strong>强先后流程用清晰的横向时间轨或阶梯流，起点在左、终点在右，因果顺序一眼贯通。",
    badSvg: `<svg viewBox="0 0 300 130" aria-hidden="true">
      <rect x="8" y="6" width="284" height="118" fill="#FAF5EC" stroke="#B82A1A" stroke-dasharray="4 3"/>
      <circle cx="150" cy="65" r="11" fill="#E45B45"/>
      <g font-family="Space Mono,monospace" font-size="11" font-weight="700" text-anchor="middle">
        <circle cx="150" cy="24" r="12" fill="#641720"/><text x="150" y="28" fill="#FFF">?</text>
        <circle cx="195" cy="44" r="12" fill="#641720"/><text x="195" y="48" fill="#FFF">?</text>
        <circle cx="195" cy="86" r="12" fill="#641720"/><text x="195" y="90" fill="#FFF">?</text>
        <circle cx="150" cy="106" r="12" fill="#641720"/><text x="150" y="110" fill="#FFF">?</text>
        <circle cx="105" cy="86" r="12" fill="#641720"/><text x="105" y="90" fill="#FFF">?</text>
        <circle cx="105" cy="44" r="12" fill="#641720"/><text x="105" y="48" fill="#FFF">?</text>
      </g>
      <text x="18" y="116" font-size="11" fill="#B82A1A" font-weight="700">无明确起点</text>
    </svg>`,
    goodSvg: `<svg viewBox="0 0 300 130" aria-hidden="true">
      <rect x="8" y="6" width="284" height="118" fill="#FAF5EC" stroke="#1A6B4F" stroke-width="1.5"/>
      <line x1="36" y1="62" x2="264" y2="62" stroke="#1A6B4F" stroke-width="2"/>
      <g font-family="Space Mono,monospace" font-size="11" font-weight="700" text-anchor="middle">
        <circle cx="44" cy="62" r="13" fill="#1A6B4F"/><text x="44" y="66" fill="#FFF">1</text>
        <circle cx="114" cy="62" r="13" fill="#1A6B4F"/><text x="114" y="66" fill="#FFF">2</text>
        <circle cx="184" cy="62" r="13" fill="#1A6B4F"/><text x="184" y="66" fill="#FFF">3</text>
        <circle cx="254" cy="62" r="13" fill="#E45B45"/><text x="254" y="66" fill="#FFF">4</text>
      </g>
      <text x="24" y="108" font-size="11" fill="#1A6B4F" font-weight="700">线性顺序流 · 起点终点零歧义</text>
    </svg>`,
  },
  crowded: {
    badDesc: "<strong>翻车原因：</strong>经验上径向菜单在 4–8 项时最顺手；一旦塞进十几个选项，每个扇区夹角缩到 25° 以下，手指极易误点，文字也互相踩踏。",
    goodDesc: "<strong>改用正解：</strong>多于 8 项时改用分组卡片列表或二级抽屉，给每条选项留足 44px 以上舒适点击区。",
    badSvg: `<svg viewBox="0 0 300 132" aria-hidden="true">
      <rect x="8" y="6" width="284" height="120" fill="#FAF5EC" stroke="#B82A1A" stroke-dasharray="4 3"/>
      <g transform="translate(150,56)" stroke="#641720" stroke-width="1.2">
        ${Array.from({ length: 18 }, (_, i) => {
          const a = (i * 20 * Math.PI) / 180;
          return `<line x1="0" y1="0" x2="${(Math.cos(a) * 40).toFixed(1)}" y2="${(Math.sin(a) * 40).toFixed(1)}"/>`;
        }).join("")}
        <circle r="40" fill="none" stroke="#B82A1A"/>
        <circle r="10" fill="#E45B45"/>
      </g>
      <text x="150" y="118" text-anchor="middle" font-size="11" fill="#B82A1A" font-weight="700">18 项挤成细针 · 极易误触</text>
    </svg>`,
    goodSvg: `<svg viewBox="0 0 300 132" aria-hidden="true">
      <rect x="8" y="6" width="284" height="120" fill="#FAF5EC" stroke="#1A6B4F" stroke-width="1.5"/>
      <g fill="#EBE0CE" stroke="#1A6B4F">
        <rect x="24" y="20" width="76" height="26"/><rect x="112" y="20" width="76" height="26"/><rect x="200" y="20" width="76" height="26"/>
        <rect x="24" y="56" width="76" height="26"/><rect x="112" y="56" width="76" height="26"/><rect x="200" y="56" width="76" height="26"/>
      </g>
      <text x="150" y="112" text-anchor="middle" font-size="11" fill="#1A6B4F" font-weight="700">分组平铺网格 · 触控区充裕</text>
    </svg>`,
  },
  strip: {
    badDesc: "<strong>翻车原因：</strong>放射平衡在近 1:1 到 3:4 / 4:3 画幅里最舒展。画幅长宽比一旦超过约 2.5:1（经验值），纵向射线要么被框腰斩，要么两侧空出死白。",
    goodDesc: "<strong>改用正解：</strong>狭长横幅改用水平引导轴或节奏重复排布；若必须保留放射元素，让其作为局部出血装饰而非全幅主骨架。",
    badSvg: `<svg viewBox="0 0 300 132" aria-hidden="true">
      <rect x="8" y="26" width="284" height="58" fill="#FAF5EC" stroke="#B82A1A" stroke-dasharray="4 3"/>
      <circle cx="150" cy="55" r="40" fill="none" stroke="#B82A1A" stroke-width="1.5"/>
      <circle cx="150" cy="55" r="11" fill="#E45B45"/>
      <line x1="150" y1="14" x2="150" y2="96" stroke="#641720" stroke-width="2"/>
      <line x1="110" y1="55" x2="190" y2="55" stroke="#641720" stroke-width="2"/>
      <text x="150" y="118" text-anchor="middle" font-size="11" fill="#B82A1A" font-weight="700">上下被腰斩，左右大片空死</text>
    </svg>`,
    goodSvg: `<svg viewBox="0 0 300 132" aria-hidden="true">
      <rect x="8" y="26" width="284" height="58" fill="#FAF5EC" stroke="#1A6B4F" stroke-width="1.5"/>
      <circle cx="48" cy="55" r="14" fill="#E45B45"/>
      <rect x="78" y="42" width="118" height="10" fill="#341114"/>
      <rect x="78" y="58" width="84" height="6" fill="#59393B"/>
      <rect x="218" y="41" width="58" height="28" fill="#1A6B4F"/>
      <text x="150" y="118" text-anchor="middle" font-size="11" fill="#1A6B4F" font-weight="700">顺应横幅轴向 · 左锚中字右动点</text>
    </svg>`,
  },
};

export function initAntiCases() {
  const flipped = { longtext: false, steps: false, crowded: false, strip: false };
  const update = (key) => {
    const isFixed = flipped[key];
    const card = document.querySelector(`.anti-card[data-case="${key}"]`);
    const vis = document.getElementById(`anti-vis-${key}`);
    const desc = document.getElementById(`anti-desc-${key}`);
    const btn = document.querySelector(`.flip-btn[data-flip="${key}"]`);
    const idx = card?.querySelector(".anti-idx");
    if (!card || !vis || !desc || !btn) return;
    card.classList.toggle("is-fixed", isFixed);
    vis.innerHTML = isFixed ? ANTI_DATA[key].goodSvg : ANTI_DATA[key].badSvg;
    desc.innerHTML = isFixed ? ANTI_DATA[key].goodDesc : ANTI_DATA[key].badDesc;
    btn.setAttribute("aria-pressed", String(isFixed));
    btn.textContent = isFixed ? "看回翻车版" : "切看正解";
    if (idx) idx.textContent = isFixed ? "FIXED" : `TRAP 0${Object.keys(ANTI_DATA).indexOf(key) + 1}`;
  };

  Object.keys(ANTI_DATA).forEach((k) => {
    update(k);
    document.querySelector(`.flip-btn[data-flip="${k}"]`)?.addEventListener("click", () => {
      flipped[k] = !flipped[k];
      update(k);
    });
  });
}

/* ==================== 06｜眼力小测（3 题单变量精绘 Canvas） ==================== */
const QUESTIONS = [
  {
    prompt: "【变量：角度分布】以下四张图的核径、臂长与粗细完全一致，只差射线角度。哪一张真正达成放射平衡？",
    answer: 2,
    notes: ["方案 A", "方案 B", "方案 C", "方案 D"],
    options: [
      { kind: "angle-right" },
      { kind: "angle-gap" },
      { kind: "angle-even" },
      { kind: "angle-vertical" },
    ],
    explain: "答案是 C。A 把 12 根射线挤在右半圆，重心剧烈右偏；B 左侧裂开 115° 大缺口导致合力右漂；D 上下堆叠成蝴蝶结而左右全空；只有 C 让 12 根射线在圆周匀称展开，各向合力在圆心完全归零。",
  },
  {
    prompt: "【变量：长短节奏】以下四张图的角度全部 16 等分且核径相同，只差主副长短粗细对比。哪一张既有稳定又有韵律？",
    answer: 1,
    notes: ["方案 A", "方案 B", "方案 C", "方案 D"],
    options: [
      { kind: "rhythm-flat" },
      { kind: "rhythm-tiered" },
      { kind: "rhythm-inverted" },
      { kind: "rhythm-chaos" },
    ],
    explain: "答案是 B。A 全员等长等粗，僵硬得像自行车钢丝轮；C 把副射线拉得比主轴更长，主次反客为主；D 毫无周期规律显得杂乱；B 复刻了三阶递进节奏（长十字主轴 + 中斜脉 + 短副点），稳而不死。",
  },
  {
    prompt: "【变量：核径与外沿】以下四张图的角度和三阶节奏完全相同，只差中心核径与外延留白。哪一张的收放比例最得当？",
    answer: 3,
    notes: ["方案 A", "方案 B", "方案 C", "方案 D"],
    options: [
      { kind: "scale-tinyhub" },
      { kind: "scale-gianthub" },
      { kind: "scale-clipped" },
      { kind: "scale-ideal" },
    ],
    explain: "答案是 D。A 的中心核缩成针眼，压不住外围辐射；B 的圆核撑到 45% 吞掉射线，退化成一块孤立红饼；C 外端冲破画框被硬生生削平；D 的中心核约占 20%、外沿留出舒展呼吸白，聚合与发散两头兼得。",
  },
];

function drawQuizOption(canvas, kind, reveal) {
  const dpr = pixelRatio(2);
  const s = 220;
  canvas.width = s * dpr;
  canvas.height = s * dpr;
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, s, s);

  const cx = s / 2;
  const cy = s / 2;
  const R = s * 0.42;

  // 外参考圈
  ctx.strokeStyle = "rgba(100,23,32,0.16)";
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);

  let hubR = R * 0.20;
  let angles = [];
  let tiers = [];
  let reach = 0.86;

  if (kind.startsWith("angle-")) {
    const n = 12;
    for (let i = 0; i < n; i++) tiers.push(i % 3 === 0 ? 3 : i % 3 === 1 ? 1 : 2);
    if (kind === "angle-right") {
      angles = Array.from({ length: n }, (_, i) => -82 + (i / (n - 1)) * 164);
    } else if (kind === "angle-gap") {
      angles = Array.from({ length: n }, (_, i) => -115 + (i / (n - 1)) * 235);
    } else if (kind === "angle-vertical") {
      angles = [-122, -106, -90, -74, -58, -42, 58, 74, 90, 106, 122, 138];
    } else {
      angles = Array.from({ length: n }, (_, i) => -90 + (i / n) * 360);
    }
  } else if (kind.startsWith("rhythm-")) {
    const n = 16;
    angles = Array.from({ length: n }, (_, i) => -90 + (i / n) * 360);
    if (kind === "rhythm-flat") {
      tiers = new Array(n).fill(2);
    } else if (kind === "rhythm-tiered") {
      tiers = Array.from({ length: n }, (_, i) => (i % 4 === 0 ? 3 : i % 4 === 2 ? 2 : 1));
    } else if (kind === "rhythm-inverted") {
      tiers = Array.from({ length: n }, (_, i) => (i % 4 === 0 ? 1 : i % 4 === 2 ? 2 : 3));
    } else {
      const chaos = [3, 1, 3, 2, 1, 1, 3, 2, 2, 1, 3, 1, 2, 3, 1, 2];
      tiers = chaos;
    }
  } else {
    const n = 16;
    angles = Array.from({ length: n }, (_, i) => -90 + (i / n) * 360);
    tiers = Array.from({ length: n }, (_, i) => (i % 4 === 0 ? 3 : i % 4 === 2 ? 2 : 1));
    if (kind === "scale-tinyhub") hubR = R * 0.055;
    if (kind === "scale-gianthub") hubR = R * 0.46;
    if (kind === "scale-clipped") reach = 1.18;
    if (kind === "scale-ideal") reach = 0.86;
  }

  let sx = 0;
  let sy = 0;
  let sw = 0;

  angles.forEach((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    const t = tiers[i];
    const mult = kind === "rhythm-flat"
      ? 0.84
      : kind === "rhythm-chaos"
        ? [0.48, 0.92, 0.62, 0.85, 0.42, 0.95, 0.56, 0.78][i % 8]
        : t === 3 ? 1.0 : t === 2 ? 0.82 : 0.60;
    const r0 = hubR + 5;
    const r1 = Math.max(r0 + 8, R * reach * mult);
    const w = t === 3 ? 1.0 : t === 2 ? 0.72 : 0.45;
    sx += Math.cos(rad) * r1 * w;
    sy += Math.sin(rad) * r1 * w;
    sw += r1 * w;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rad);
    ctx.strokeStyle = t === 3 ? PALETTE.burgundy : t === 2 ? PALETTE.ink : PALETTE.tan;
    ctx.lineWidth = kind === "rhythm-flat" ? 1.6 : t === 3 ? 2.1 : t === 2 ? 1.5 : 1.1;
    ctx.beginPath();
    ctx.moveTo(r0, 0);
    ctx.lineTo(r1, 0);
    ctx.stroke();

    const dr = kind === "rhythm-flat" ? 5 : t === 3 ? 7 : t === 2 ? 5 : 3.5;
    ctx.fillStyle = t === 3 ? PALETTE.burgundy : t === 2 ? PALETTE.coral : PALETTE.tan;
    ctx.beginPath();
    ctx.arc(r1, 0, dr, 0, TAU);
    ctx.fill();
    ctx.restore();
  });

  // 中心核
  ctx.fillStyle = PALETTE.coral;
  ctx.beginPath();
  ctx.arc(cx, cy, hubR, 0, TAU);
  ctx.fill();

  // 揭晓答案后叠加矢量偏移箭
  if (reveal && sw > 0) {
    const drift = Math.hypot(sx, sy) / sw;
    if (drift > 0.08) {
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + (sx / sw) * R * 0.85, cy + (sy / sw) * R * 0.85);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function initQuiz() {
  const qEl = document.getElementById("quiz-question");
  const scoreEl = document.getElementById("quiz-score");
  const fb = document.getElementById("quiz-feedback");
  const fbHead = document.getElementById("qf-head");
  const fbBody = document.getElementById("qf-body");
  const nextBtn = document.getElementById("btn-next-q");
  const opts = [...document.querySelectorAll(".quiz-opt")];
  const tabs = [...document.querySelectorAll(".quiz-tab")];
  if (!qEl || !opts.length) return;

  let cur = 0;
  const picked = [null, null, null];

  function render() {
    const q = QUESTIONS[cur];
    qEl.textContent = q.prompt;
    tabs.forEach((b, i) => {
      b.classList.toggle("is-active", i === cur);
      b.setAttribute("aria-selected", String(i === cur));
    });

    const userPick = picked[cur];
    const revealed = userPick !== null;

    opts.forEach((btn, i) => {
      const cvs = btn.querySelector("canvas");
      drawQuizOption(cvs, q.options[i].kind, revealed);
      btn.classList.remove("is-right", "is-wrong");
      if (revealed) {
        if (i === q.answer) btn.classList.add("is-right");
        else if (i === userPick) btn.classList.add("is-wrong");
      }
    });

    const doneCount = picked.filter((v) => v !== null).length;
    const rightCount = picked.filter((v, i) => v === QUESTIONS[i].answer).length;
    scoreEl.textContent = doneCount ? `已完成 ${doneCount} / 3 · 答对 ${rightCount}` : "已完成 0 / 3";

    if (revealed) {
      fb.hidden = false;
      const ok = userPick === q.answer;
      fbHead.classList.toggle("is-err", !ok);
      fbHead.textContent = ok ? "判断准确！" : `选了 ${"ABCD"[userPick]}，再看一眼几何结构`;
      fbBody.textContent = q.explain;
      nextBtn.textContent = cur < QUESTIONS.length - 1 ? "做下一题" : "回到第 1 题重温";
    } else {
      fb.hidden = true;
    }
  }

  opts.forEach((btn) => {
    btn.addEventListener("click", () => {
      picked[cur] = Number(btn.dataset.opt);
      render();
    });
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      cur = Number(tab.dataset.q);
      render();
    });
  });

  nextBtn?.addEventListener("click", () => {
    cur = (cur + 1) % QUESTIONS.length;
    render();
  });

  render();
}

/* ==================== 07｜原海报高清灯箱（缩放/拖动/Esc） ==================== */
export function initPosterLightbox() {
  const openBtn = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const box = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const viewport = document.getElementById("lb-viewport");
  const scaleEl = document.getElementById("lb-scale");
  const closeBtn = document.getElementById("lb-close");
  if (!openBtn || !posterImg || !box || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let tx0 = 0;
  let ty0 = 0;

  function apply() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    scaleEl.textContent = `${Math.round(scale * 100)}%`;
  }

  function reset() {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  }

  function open() {
    // 海报只内联一次，直接复用 #poster 的 src
    if (!lbImg.src) lbImg.src = posterImg.src;
    box.hidden = false;
    reset();
    closeBtn?.focus();
  }

  function close() {
    box.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  document.getElementById("lb-zoom-in")?.addEventListener("click", () => {
    scale = Math.min(3.5, scale + 0.35);
    apply();
  });
  document.getElementById("lb-zoom-out")?.addEventListener("click", () => {
    scale = Math.max(0.6, scale - 0.35);
    apply();
  });
  document.getElementById("lb-reset")?.addEventListener("click", reset);

  viewport?.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.6, Math.min(3.5, scale + (e.deltaY < 0 ? 0.16 : -0.16)));
    apply();
  }, { passive: false });

  viewport?.addEventListener("pointerdown", (e) => {
    if (e.target === viewport) {
      close();
      return;
    }
    dragging = true;
    viewport.classList.add("is-dragging");
    sx = e.clientX;
    sy = e.clientY;
    tx0 = tx;
    ty0 = ty;
    viewport.setPointerCapture?.(e.pointerId);
  });

  viewport?.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = tx0 + (e.clientX - sx);
    ty = ty0 + (e.clientY - sy);
    apply();
  });

  const endDrag = () => {
    dragging = false;
    viewport?.classList.remove("is-dragging");
  };
  viewport?.addEventListener("pointerup", endDrag);
  viewport?.addEventListener("pointercancel", endDrag);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
}

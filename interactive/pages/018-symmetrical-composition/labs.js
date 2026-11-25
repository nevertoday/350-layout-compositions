// 正文各节互动实验 + 原海报灯箱（纯 SVG / DOM，零外部依赖）
import { reducedMotion } from "../../lib/stage.js";

export function initLabs() {
  initDetectionTimerAndBahnsen();
  initFamiliesLab();
  initBreakerLab();
  initCalibrationLab();
  initQuiz();
  initLightbox();
}

// ---------- 第 02 节：实验 A 帕尔默–赫门威轴向识别计时小测 + 实验 B 巴恩森图底翻转 ----------
function initDetectionTimerAndBahnsen() {
  const svg = document.getElementById("rt-svg");
  const polyEl = document.getElementById("rt-poly");
  const axisEl = document.getElementById("rt-axis");
  const dotEl = document.getElementById("rt-dot");
  const flashEl = document.getElementById("rt-flash");
  const badgeEl = document.getElementById("rt-badge");
  const startBtn = document.getElementById("rt-start");
  const yesBtn = document.getElementById("rt-yes");
  const noBtn = document.getElementById("rt-no");
  const noteEl = document.getElementById("rt-note");

  const statEls = {
    0: {
      ms: document.getElementById("rt-ms-0"),
      acc: document.getElementById("rt-acc-0"),
      bar: document.getElementById("rt-bar-0"),
      box: document.querySelector('[data-rt-axis="0"]'),
    },
    90: {
      ms: document.getElementById("rt-ms-90"),
      acc: document.getElementById("rt-acc-90"),
      bar: document.getElementById("rt-bar-90"),
      box: document.querySelector('[data-rt-axis="90"]'),
    },
    45: {
      ms: document.getElementById("rt-ms-45"),
      acc: document.getElementById("rt-acc-45"),
      bar: document.getElementById("rt-bar-45"),
      box: document.querySelector('[data-rt-axis="45"]'),
    },
  };

  // 单轴封闭多边形模板：[r0(顶轴), r1(30°), r2(60°), r3(90°), r4(120°), r5(150°), r6(底轴)]
  // 所有模板保证上下不同（r0≠r6, r1≠r5, r2≠r4），严格只有一条单对称轴
  const TEMPLATES = [
    [76, 44, 82, 50, 68, 36, 60],
    [62, 78, 42, 74, 48, 80, 44],
    [82, 48, 64, 38, 84, 52, 56],
    [52, 72, 86, 46, 62, 40, 78],
    [74, 38, 76, 68, 42, 72, 50],
    [68, 82, 50, 40, 78, 44, 84],
  ];

  const CX = 180;
  const CY = 120;
  const AXIS_LABEL = { 0: "0° 竖轴", 90: "90° 横轴", 45: "45° 斜轴" };

  let trials = [];
  let idx = 0;
  let phase = "idle"; // idle | gap | trial | feedback | done
  let startedAt = 0;
  let timerId = 0;
  let stats = {
    0: { times: [], ok: 0, n: 0 },
    90: { times: [], ok: 0, n: 0 },
    45: { times: [], ok: 0, n: 0 },
  };

  function buildPolygonPoints(axisDeg, isSym, tplIdx) {
    const base = TEMPLATES[tplIdx % TEMPLATES.length];
    // 12 顶点按 30° 间隔围绕中心，0 为顶轴点，6 为底轴点
    const r = [
      base[0],
      base[1],
      base[2],
      base[3],
      base[4],
      base[5],
      base[6],
      base[5],
      base[4],
      base[3],
      base[2],
      base[1],
    ];
    // 加入轻度对称微扰，保证每次重测图形新鲜
    for (let k = 0; k <= 6; k++) {
      const jitter = Math.round((Math.random() - 0.5) * 8);
      r[k] = Math.max(32, Math.min(88, r[k] + jitter));
      if (k >= 1 && k <= 5) r[12 - k] = r[k];
    }
    if (!isSym) {
      // 仿照帕尔默与赫门威近似对称干扰：仅单侧 2 个相邻顶点做明显径向破缺（±24px）
      const sideRight = Math.random() < 0.5;
      const i1 = sideRight ? 2 : 10;
      const i2 = sideRight ? 4 : 8;
      r[i1] = r[i1] > 60 ? r[i1] - 25 : r[i1] + 25;
      r[i2] = r[i2] > 60 ? r[i2] - 23 : r[i2] + 23;
    }

    // 45° 斜轴随机取 +45° 或 -45°（左右对角线均属斜轴）
    const drawDeg = axisDeg === 45 ? (Math.random() < 0.5 ? 45 : -45) : axisDeg;
    const radAxis = (drawDeg * Math.PI) / 180;

    const pts = [];
    for (let k = 0; k < 12; k++) {
      const theta = (k * Math.PI) / 6; // 0 = 12 点方向
      const lx = Math.sin(theta) * r[k];
      const ly = -Math.cos(theta) * r[k];
      const x = CX + lx * Math.cos(radAxis) - ly * Math.sin(radAxis);
      const y = CY + lx * Math.sin(radAxis) + ly * Math.cos(radAxis);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    const axHalf = 96;
    const axDx = Math.sin(radAxis) * axHalf;
    const axDy = -Math.cos(radAxis) * axHalf;
    return {
      points: pts.join(" "),
      axisLine: { x1: CX - axDx, y1: CY - axDy, x2: CX + axDx, y2: CY + axDy },
    };
  }

  function makeDeck() {
    // 每轮 6 题：0°、45°、90° 各 1 道完全对称 + 1 道不对称，随机打乱
    const deck = [
      { axis: 0, sym: true },
      { axis: 0, sym: false },
      { axis: 45, sym: true },
      { axis: 45, sym: false },
      { axis: 90, sym: true },
      { axis: 90, sym: false },
    ];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck.map((item, k) => ({ ...item, tplIdx: k }));
  }

  function renderStats() {
    const avgs = {};
    let maxAvg = 0;
    for (const ax of [0, 90, 45]) {
      const s = stats[ax];
      if (s.times.length > 0) {
        const avg = Math.round(s.times.reduce((a, b) => a + b, 0) / s.times.length);
        avgs[ax] = avg;
        if (avg > maxAvg) maxAvg = avg;
      } else {
        avgs[ax] = null;
      }
    }

    let fastestAxis = null;
    if (avgs[0] !== null && avgs[90] !== null && avgs[45] !== null) {
      fastestAxis = [0, 90, 45].reduce((best, ax) => (avgs[ax] < avgs[best] ? ax : best), 0);
    }

    for (const ax of [0, 90, 45]) {
      const s = stats[ax];
      const ui = statEls[ax];
      if (!ui) continue;
      if (ui.ms) ui.ms.textContent = avgs[ax] !== null ? `${avgs[ax]} ms` : "—";
      if (ui.acc) {
        ui.acc.textContent =
          s.n > 0 ? `${s.ok}/${s.n} · ${Math.round((s.ok / s.n) * 100)}%` : "待测";
      }
      if (ui.bar) {
        const pct = avgs[ax] !== null && maxAvg > 0 ? Math.max(18, Math.round((avgs[ax] / maxAvg) * 100)) : 0;
        ui.bar.style.width = `${pct}%`;
      }
      if (ui.box) {
        ui.box.classList.toggle("is-fastest", fastestAxis === ax);
      }
    }
    return avgs;
  }

  function setButtons(running) {
    if (yesBtn) yesBtn.disabled = !running;
    if (noBtn) noBtn.disabled = !running;
  }

  function showTrial() {
    if (idx >= trials.length) {
      finishRound();
      return;
    }
    const cur = trials[idx];
    const shape = buildPolygonPoints(cur.axis, cur.sym, cur.tplIdx);
    cur.axisLine = shape.axisLine;

    if (polyEl) {
      polyEl.setAttribute("points", shape.points);
      polyEl.setAttribute("opacity", "1");
    }
    if (axisEl) {
      axisEl.setAttribute("x1", shape.axisLine.x1.toFixed(1));
      axisEl.setAttribute("y1", shape.axisLine.y1.toFixed(1));
      axisEl.setAttribute("x2", shape.axisLine.x2.toFixed(1));
      axisEl.setAttribute("y2", shape.axisLine.y2.toFixed(1));
      axisEl.setAttribute("opacity", "0");
    }
    if (dotEl) dotEl.setAttribute("opacity", "0");
    if (flashEl) flashEl.setAttribute("opacity", "0");
    if (svg) {
      svg.dataset.trialAxis = String(cur.axis);
      svg.dataset.trialTruth = cur.sym ? "sym" : "asym";
    }
    if (badgeEl) badgeEl.textContent = `${idx + 1} / ${trials.length}`;
    phase = "trial";
    startedAt = performance.now();
    setButtons(true);
  }

  function queueNextTrial() {
    clearTimeout(timerId);
    if (idx >= trials.length) {
      finishRound();
      return;
    }
    const gapMs = reducedMotion.matches ? 20 : 160;
    phase = "gap";
    setButtons(false);
    if (polyEl) polyEl.setAttribute("opacity", "0");
    if (axisEl) axisEl.setAttribute("opacity", "0");
    if (flashEl) flashEl.setAttribute("opacity", "0");
    if (dotEl) dotEl.setAttribute("opacity", "1");
    timerId = setTimeout(showTrial, gapMs);
  }

  function finishRound() {
    phase = "done";
    setButtons(false);
    const avgs = renderStats();
    if (startBtn) startBtn.textContent = "重新测速（6 题）";
    if (badgeEl) badgeEl.textContent = `${trials.length} / ${trials.length}`;
    if (svg) {
      delete svg.dataset.trialAxis;
      delete svg.dataset.trialTruth;
    }

    const totalOk = stats[0].ok + stats[90].ok + stats[45].ok;
    const totalN = stats[0].n + stats[90].n + stats[45].n;
    const totalAcc = totalN > 0 ? Math.round((totalOk / totalN) * 100) : 0;

    if (noteEl) {
      const fastest = [0, 90, 45].reduce((b, ax) => (avgs[ax] < avgs[b] ? ax : b), 0);
      const summary = `本机示意结果（共 ${totalN} 题，总正确率 ${totalAcc}%）：竖轴 ${avgs[0]} ms、横轴 ${avgs[90]} ms、斜轴 ${avgs[45]} ms。`;
      noteEl.textContent =
        fastest === 0
          ? `${summary}这次你的竖轴反应最快，与帕尔默与赫门威（1978）的经典排序一致（6 题样本较小，仅作个人体感示意）。`
          : `${summary}本次最快的是${AXIS_LABEL[fastest]}——6 题样本很小，本机单次体感容易波动（仅供示意）；大样本受控实验下，帕尔默与赫门威（1978）测出的稳定排序为竖轴最快、横轴次之、斜轴最慢。`;
    }
  }

  function handleAnswer(choice) {
    if (phase !== "trial") return;
    const elapsed = Math.max(1, Math.round(performance.now() - startedAt));
    const cur = trials[idx];
    const ok = (choice === "sym") === cur.sym;

    stats[cur.axis].times.push(elapsed);
    stats[cur.axis].n += 1;
    if (ok) stats[cur.axis].ok += 1;
    renderStats();

    phase = "feedback";
    setButtons(false);
    // 亮出隐藏对称轴并给简短反馈
    if (axisEl) axisEl.setAttribute("opacity", "1");
    if (flashEl) {
      flashEl.textContent = `${ok ? "判对" : "判错"} · ${elapsed} ms · ${AXIS_LABEL[cur.axis]}（${cur.sym ? "对称" : "不对称"}）`;
      flashEl.setAttribute("opacity", "1");
    }

    idx += 1;
    const fbMs = reducedMotion.matches ? 40 : 360;
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      if (idx >= trials.length) {
        finishRound();
      } else {
        queueNextTrial();
      }
    }, fbMs);
  }

  function startRound() {
    clearTimeout(timerId);
    stats = {
      0: { times: [], ok: 0, n: 0 },
      90: { times: [], ok: 0, n: 0 },
      45: { times: [], ok: 0, n: 0 },
    };
    trials = makeDeck();
    idx = 0;
    renderStats();
    if (startBtn) startBtn.textContent = "重开本轮";
    if (noteEl) {
      noteEl.textContent = "已开始计时：先看多边形整体，凭第一眼按「完全对称」或「不对称」，系统按 0° / 90° / 45° 分别统计本机示意用时。";
    }
    showTrial();
  }

  startBtn?.addEventListener("click", startRound);
  yesBtn?.addEventListener("click", () => handleAnswer("sym"));
  noBtn?.addEventListener("click", () => handleAnswer("asym"));
  renderStats();

  // Part B：巴恩森（1928）对称图底演示
  const bahnsenSvg = document.getElementById("bahnsen-svg");
  const bahnsenBtns = [...document.querySelectorAll("[data-bahnsen]")];
  const bahnsenAxesBtn = document.getElementById("bahnsen-axes-btn");
  const bahnsenNote = document.getElementById("bahnsen-note");
  let showAxes = false;

  function setBahnsen(mode) {
    if (!bahnsenSvg) return;
    bahnsenSvg.dataset.sym = mode;
    bahnsenBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.bahnsen === mode)));
    if (bahnsenNote) {
      bahnsenNote.textContent =
        mode === "cream"
          ? "两侧面积正好 50 : 50，但现在三根奶油柱自身左右对称、深海蓝缝是平行折波——眼睛会立刻把奶油柱当成前景物体。"
          : "反色互换后，三根深海蓝柱自身左右对称、奶油退成平行折波缝——同样的轮廓，前景物体瞬间翻成深海蓝柱。";
    }
  }
  bahnsenBtns.forEach((b) => b.addEventListener("click", () => setBahnsen(b.dataset.bahnsen)));
  bahnsenAxesBtn?.addEventListener("click", () => {
    showAxes = !showAxes;
    if (bahnsenSvg) bahnsenSvg.dataset.axes = showAxes ? "on" : "off";
    bahnsenAxesBtn.setAttribute("aria-pressed", String(showAxes));
    bahnsenAxesBtn.textContent = showAxes ? "隐藏对称轴" : "标出对称轴";
  });
  setBahnsen("cream");
}

// ---------- 第 03 节：对称四大家族标本台 ----------
function initFamiliesLab() {
  const familyBtns = [...document.querySelectorAll("[data-family]")];
  const foldWrap = document.getElementById("fam-fold-wrap");
  const foldBtns = [...document.querySelectorAll("[data-rot-n]")];
  const stageSvg = document.getElementById("fam-svg");
  const famTitle = document.getElementById("fam-title");
  const famDesc = document.getElementById("fam-desc");
  const famUse = document.getElementById("fam-use");

  let active = "bilateral";
  let rotN = 6;

  const COPY = {
    bilateral: {
      title: "左右轴对称 · Bilateral",
      desc: "沿单条竖直中轴镜像对应，是最经典、识别最快的对称形式。视觉重量稳稳落在中轴上，天然自带庄重与仪式感。",
      use: "常用于：品牌标志、建筑立面、封面主视觉、正式请柬。",
    },
    biaxial: {
      title: "双轴对称 · Horizontal & Biaxial",
      desc: "同时拥有竖轴与横轴两条镜像线，上下左右四象限彼此扣死。极度安静、稳定，几乎没有方向性推力。",
      use: "常用于：徽章织锦、平面图、水面建筑倒影与十字构图。",
    },
    approximate: {
      title: "近似对称 · Approximate",
      desc: "左右共享中轴与大轮廓，保持相同视觉份量，但刻意让局部形态或文字细节略有不同——保住秩序，又不至于呆板像复印件。",
      use: "常用于：杂志跨页、人像双人构图、海报与产品专题页。",
    },
    rotational: {
      title: "旋转 / 放射对称 · Rotational",
      desc: "一个母题围绕中心枢轴每次旋转固定角度（360° ÷ n）重复展开，所有力量向圆心汇聚或从圆心绽放。",
      use: "常用于：玫瑰花窗、印章纹样、花卉特写与纪念徽标。",
    },
  };

  function drawFamily() {
    if (!stageSvg) return;
    const ns = "http://www.w3.org/2000/svg";
    stageSvg.innerHTML = "";
    const el = (tag, attrs) => {
      const n = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
      return n;
    };

    const cx = 210;
    const cy = 140;

    if (active === "bilateral") {
      stageSvg.append(
        el("path", { d: "M122 52 C156 52 192 80 192 140 C192 200 156 228 122 228 Z", fill: "#F9F0D6" }),
        el("path", { d: "M298 52 C264 52 228 80 228 140 C228 200 264 228 298 228 Z", fill: "#F9F0D6" }),
        el("circle", { cx: 148, cy: 140, r: 24, fill: "#032A48" }),
        el("circle", { cx: 272, cy: 140, r: 24, fill: "#032A48" }),
        el("circle", { cx: 148, cy: 62, r: 10, fill: "#032A48" }),
        el("circle", { cx: 272, cy: 62, r: 10, fill: "#032A48" }),
        el("line", { x1: cx, y1: 18, x2: cx, y2: 262, stroke: "#032A48", "stroke-width": 2, "stroke-dasharray": "6 5" }),
        el("circle", { cx, cy, r: 6, fill: "#032A48" })
      );
    } else if (active === "biaxial") {
      const dirs = [
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ];
      for (const [sx, sy] of dirs) {
        const g = el("g", { transform: `translate(${cx} ${cy}) scale(${sx} ${sy})` });
        g.append(
          el("path", { d: "M14 14 L92 14 C92 58 58 92 14 92 Z", fill: "#F9F0D6" }),
          el("circle", { cx: 46, cy: 46, r: 16, fill: "#032A48" }),
          el("circle", { cx: 88, cy: 88, r: 8, fill: "#F9F0D6" })
        );
        stageSvg.append(g);
      }
      stageSvg.append(
        el("line", { x1: cx, y1: 18, x2: cx, y2: 262, stroke: "#032A48", "stroke-width": 1.8, "stroke-dasharray": "6 5" }),
        el("line", { x1: 56, y1: cy, x2: 364, y2: cy, stroke: "#032A48", "stroke-width": 1.8, "stroke-dasharray": "6 5" }),
        el("circle", { cx, cy, r: 7, fill: "#032A48" })
      );
    } else if (active === "approximate") {
      stageSvg.append(
        el("rect", { x: 86, y: 48, width: 106, height: 184, rx: 14, fill: "#F9F0D6" }),
        el("circle", { cx: 139, cy: 112, r: 30, fill: "#032A48" }),
        el("rect", { x: 106, y: 162, width: 66, height: 12, fill: "#032A48" }),
        el("rect", { x: 116, y: 184, width: 46, height: 8, fill: "#032A48", opacity: 0.65 }),
        el("rect", { x: 228, y: 48, width: 106, height: 184, rx: 14, fill: "#F9F0D6" }),
        el("polygon", { points: "281,80 311,140 251,140", fill: "#032A48" }),
        el("circle", { cx: 281, cy: 118, r: 11, fill: "#F9F0D6" }),
        el("rect", { x: 248, y: 162, width: 30, height: 30, fill: "#032A48" }),
        el("rect", { x: 284, y: 162, width: 30, height: 30, fill: "#032A48", opacity: 0.55 }),
        el("line", { x1: cx, y1: 18, x2: cx, y2: 262, stroke: "#032A48", "stroke-width": 2, "stroke-dasharray": "6 5" }),
        el("circle", { cx, cy, r: 6, fill: "#032A48" })
      );
    } else {
      for (let i = 0; i < rotN; i++) {
        const deg = (360 / rotN) * i;
        const g = el("g", { transform: `rotate(${deg} ${cx} ${cy})` });
        g.append(
          el("path", {
            d: `M${cx} ${cy - 18} C${cx + 26} ${cy - 48} ${cx + 24} ${cy - 92} ${cx} ${cy - 108} C${cx - 24} ${cy - 92} ${cx - 26} ${cy - 48} ${cx} ${cy - 18} Z`,
            fill: i % 2 === 0 ? "#F9F0D6" : "#032A48",
          }),
          el("circle", { cx, cy: cy - 72, r: 6, fill: i % 2 === 0 ? "#032A48" : "#F9F0D6" })
        );
        stageSvg.append(g);
      }
      stageSvg.append(
        el("circle", { cx, cy, r: 18, fill: "#8BE0CF", stroke: "#032A48", "stroke-width": 2.5 }),
        el("circle", { cx, cy, r: 5, fill: "#032A48" })
      );
    }

    const info = COPY[active];
    if (famTitle) famTitle.textContent = active === "rotational" ? `${info.title} · ${rotN} 阶（${Math.round(360 / rotN)}°）` : info.title;
    if (famDesc) famDesc.textContent = info.desc;
    if (famUse) famUse.textContent = info.use;
    if (foldWrap) foldWrap.hidden = active !== "rotational";

    familyBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.family === active)));
    foldBtns.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.rotN) === rotN)));
  }

  familyBtns.forEach((b) =>
    b.addEventListener("click", () => {
      active = b.dataset.family;
      drawFamily();
    })
  );
  foldBtns.forEach((b) =>
    b.addEventListener("click", () => {
      rotN = Number(b.dataset.rotN);
      drawFamily();
    })
  );
  drawFamily();
}

// ---------- 第 05 节：整体对称 + 单点破缺实验室 ----------
function initBreakerLab() {
  const btns = [...document.querySelectorAll("[data-break-mode]")];
  const grid = document.getElementById("breaker-grid");
  const badge = document.getElementById("breaker-badge");
  const note = document.getElementById("breaker-note");
  const copyTrap = document.getElementById("copy-trap");
  const fixCopyBtn = document.getElementById("fix-copy-btn");

  const NOTES = {
    pure: {
      badge: "完全对称 · 均匀安静",
      text: "六扇对称拱窗完全一致：秩序最强，但视线在左右之间来回扫，没有哪一格先跳出来。",
    },
    color: {
      badge: "单点反色 · 焦点锁定",
      text: "几何骨架一点没歪，只把右侧中间格（R-02）换作暖奶油反色——整组对称秩序瞬间成了那一格的聚光灯。",
    },
    tilt: {
      badge: "单翼微倾 · 叙事打断",
      text: "只让右侧 R-02 倾斜 11°（示意角度），规整的阵列立刻长出戏剧冲突，常用来制造悬念或海报主视觉爆点。",
    },
    absence: {
      badge: "空缺一格 · 留白发声",
      text: "拿掉右侧 R-02 只留虚线框：因为中轴两边全是对称参照，那个「少了的空位」反倒成了最响的焦点。",
    },
    copy: {
      badge: "反面案例 · 字长失衡",
      text: "对称最怕真实文案长度不一：左边四个字一行排完，右边折成多行，整组版式立刻塌成「假对称」。",
    },
  };

  let fixedCopy = false;

  function setMode(mode) {
    if (!grid) return;
    grid.dataset.mode = mode;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.breakMode === mode)));
    const info = NOTES[mode];
    if (badge) badge.textContent = info.badge;
    if (note) note.textContent = info.text;
    if (copyTrap) {
      copyTrap.hidden = mode !== "copy";
      if (mode !== "copy") {
        fixedCopy = false;
        copyTrap.classList.remove("is-fixed");
      }
    }
    if (fixCopyBtn) {
      fixCopyBtn.setAttribute("aria-pressed", String(fixedCopy));
      fixCopyBtn.textContent = fixedCopy ? "恢复长短不一的原文" : "收紧字数预算修复对称";
    }
  }

  btns.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.breakMode)));
  fixCopyBtn?.addEventListener("click", () => {
    fixedCopy = !fixedCopy;
    copyTrap?.classList.toggle("is-fixed", fixedCopy);
    fixCopyBtn.setAttribute("aria-pressed", String(fixedCopy));
    fixCopyBtn.textContent = fixedCopy ? "恢复长短不一的原文" : "收紧字数预算修复对称";
    if (note) {
      note.textContent = fixedCopy
        ? "把两侧标题收进相同行高与字数预算，秩序立刻回来；如果真实内容天生一长一短，就干脆换用非对称构图。"
        : NOTES.copy.text;
    }
  });
  setMode("pure");
}

// ---------- 第 06 节：真对称 vs 偏离画宽 4% 假对称校准尺 ----------
function initCalibrationLab() {
  const btns = [...document.querySelectorAll("[data-cal]")];
  const gate = document.getElementById("cal-gate");
  const readout = document.getElementById("cal-readout");

  const COPY = {
    exact: "偏离画宽 0%（正中对齐）：左右墙距严格相等，一眼读出刻意安排的庄重。",
    almost: "偏离画宽 4%（示意「差一点」）：大脑先按对称去核对，立刻撞上没对齐的别扭感——看着不像有意构图，只像手抖放歪了。",
    deliberate: "偏离画宽 20%（果断偏开）：一眼就能看懂这是故意让出右侧空间，画面反而重新松弛自然。",
  };

  function setCal(id) {
    if (!gate) return;
    gate.dataset.cal = id;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cal === id)));
    if (readout) readout.textContent = COPY[id];
  }

  btns.forEach((b) => b.addEventListener("click", () => setCal(b.dataset.cal)));
  setCal("almost");
}

// ---------- 第 07 节：四版近似对称小练习（客观判据：每版只差一个变量） ----------
function initQuiz() {
  const options = [...document.querySelectorAll(".quiz-card")];
  const verdict = document.getElementById("quiz-verdict");
  const vTitle = document.getElementById("quiz-v-title");
  const vText = document.getElementById("quiz-v-text");
  const grid = document.getElementById("quiz-grid");

  const BEST = "C";
  const FEEDBACK = {
    A: {
      ok: false,
      title: "A 版违背了「平衡视觉」原则（正确是 C）",
      text: "A 版中轴居中、画风也统一，但把所有近似对称的细部全堆到了右翼（顶标加框、内瓣多处镂空、底叶成双、底栏厚重），左翼几乎留空，视觉重量明显偏右；近似对称要求两翼分量相当。",
    },
    B: {
      ok: false,
      title: "B 版违背了「确定轴线」原则（正确是 C）",
      text: "B 版两翼的细部体量和画风其实与 C 版完全一致，但亮出深蓝虚线中轴就能看见：标题与蝶翼外廓整体向右偏离了画宽 4%，落进了最容易显得手抖放歪的假对称陷阱。",
    },
    C: {
      ok: true,
      title: "选对了：C 版同时守住了轴线、平衡与风格三条原则",
      text: "外廓与短标题严格居中压在中轴上；统一平涂画风下，两翼各做一处体量相当、形状不同的纯几何细部（左圆配双横条，右菱形配双菱点，底栏等重呼应），既稳住秩序又保留呼吸感。",
    },
    D: {
      ok: false,
      title: "D 版违背了「统一风格」原则（正确是 C）",
      text: "D 版中轴居中、细部占位也与 C 版对等，但左翼改用细虚线描边稿、右翼保留厚重平涂实色块——两翼用了两套画风，不仅整体感割裂，也让画面明显右重左轻。",
    },
  };

  options.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.pick;
      const fb = FEEDBACK[pick];
      grid?.classList.add("is-revealed");
      options.forEach((b) => {
        b.setAttribute("aria-pressed", String(b === btn));
        b.classList.toggle("is-correct", b.dataset.pick === BEST);
        b.classList.toggle("is-wrong", b === btn && pick !== BEST);
      });
      if (verdict) {
        verdict.dataset.state = fb.ok ? "ok" : "no";
      }
      if (vTitle) vTitle.textContent = fb.title;
      if (vText) vText.textContent = fb.text;
    });
  });
}

// ---------- 第 08 节：原海报放大拖看灯箱 ----------
function initLightbox() {
  const trigger = document.getElementById("poster-btn");
  const poster = document.getElementById("poster");
  if (!trigger || !poster) return;

  let overlay = null;
  let img = null;
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    if (img) img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
  }

  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    img = null;
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  }

  function open() {
    if (overlay) return;
    scale = 1;
    tx = 0;
    ty = 0;
    overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "原海报放大查看");

    const bar = document.createElement("div");
    bar.className = "lb-bar";

    const zoomBtn = document.createElement("button");
    zoomBtn.type = "button";
    zoomBtn.className = "lb-btn";
    zoomBtn.textContent = "放大 1.6×";
    zoomBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      scale = scale > 1.2 ? 1 : 1.6;
      if (scale === 1) {
        tx = 0;
        ty = 0;
      }
      zoomBtn.textContent = scale > 1.2 ? "还原 1×" : "放大 1.6×";
      applyTransform();
    });

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "lb-btn";
    closeBtn.textContent = "关闭 (Esc)";
    closeBtn.addEventListener("click", close);

    bar.append(zoomBtn, closeBtn);

    const frame = document.createElement("div");
    frame.className = "lb-frame";

    img = document.createElement("img");
    img.src = poster.src;
    img.alt = poster.alt;
    img.draggable = false;
    img.className = "lb-img";

    img.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      dragging = true;
      sx = e.clientX - tx;
      sy = e.clientY - ty;
      try {
        img.setPointerCapture(e.pointerId);
      } catch {}
    });
    img.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      tx = e.clientX - sx;
      ty = e.clientY - sy;
      applyTransform();
    });
    img.addEventListener("pointerup", () => {
      dragging = false;
    });
    img.addEventListener("pointercancel", () => {
      dragging = false;
    });

    frame.append(img);
    overlay.append(bar, frame);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target === frame) close();
    });

    document.body.append(overlay);
    trigger.setAttribute("aria-expanded", "true");
    closeBtn.focus();
  }

  trigger.addEventListener("click", open);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay) close();
  });
}

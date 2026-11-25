// 327 计白当黑构图 · 01–07 章节各具特色的交互实验室
// 每一节与相邻节采用完全不同的控件形态：
//   01 鲁宾图底幕帘与三标本  |  02 三步演进+五区矩阵  |  03 5×4 刻白通道 BFS 流向
//   04 百年四境拓片+显影镜头 |  05 真实对比度失效压力台 |  06 两题单变量测验+反拓验形
//   07 原海报缩放拖拽灯箱

import { PALETTE, clamp } from "./model.js";

function setupHiDPI(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");
  return { ctx, w, h, dpr };
}

/* ==================== 01 鲁宾图底边界归属剥离仪 ==================== */
export function initSec01() {
  const canvas = document.getElementById("fg-canvas");
  const slider = document.getElementById("fg-curtain");
  const valEl = document.getElementById("fg-curtain-val");
  const readingEl = document.getElementById("fg-reading");
  const specWrap = document.getElementById("fg-specimens");
  const modeWrap = document.getElementById("fg-modes");
  if (!canvas || !slider) return;

  const state = { spec: "vase", mode: "split", curtain: 50 };

  const DESC = {
    vase: {
      split: "幕帘停在中间：左右共用同一条 S 形轮廓线。左侧大脑容易把中央纯白读成高脚杯；右侧反色后，两侧黑色侧影轮廓会瞬间反客为主。",
      outline: "去掉所有黑白填充，只留一条共同边界线：器皿与双侧影的形状完全由同一条曲线定义——谁抢到边界归属，谁就是前景形体。",
      white: "抽离出纯白形体单独看：原来所谓的「背景空白」本身就是一座完整对称的器皿剪影。",
      black: "抽离出玄墨部分单独看：左右两道对称侧影围拢过来，靠自身的凹弧把中间的白色器皿雕出来。",
    },
    arch: {
      split: "双柱与白拱门：左半玄墨压柱、白拱挺立；右半翻转极性，原本退后的拱腔立刻向前凸出，双柱与拱门互换主客。",
      outline: "单线剥离视图：建筑立面里的门洞之所以有力量，是因为柱身与门洞共用一条挺拔的垂线与半圆弧。",
      white: "单看白色部分：正是一座独立完整的古典圆顶拱门。",
      black: "单看黑色部分：左右两座厚重门墩围合出中央空间，白形全靠黑墩「夹」出来。",
    },
    steps: {
      split: "墨阶与白倒影：五级折梯把画幅一分为二，左右翻转黑白后，向上攀升的石阶与倒悬的白色廊顶彼此咬合。",
      outline: "一条连续折线决定上下两个形体的命运：在计白当黑里，修整一条边等于同时雕刻黑白两块形体。",
      white: "单看白色形体：它不是多余的空角，而是与黑梯严丝合缝的反向阶梯。",
      black: "单看黑色形体：厚重折梯向上推进，每退一步就在对面凿出等量白形。",
    },
  };

  function drawSpecimen(ctx, w, h, spec, invert, mode) {
    const bg = mode === "outline" ? "#F8F7F2" : invert ? PALETTE.white : PALETTE.ink;
    const fg = mode === "outline" ? PALETTE.ink : invert ? PALETTE.ink : PALETTE.white;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // 绘制中央主白形（纯几何侧影，绝不画任何五官细节）
    const cx = w * 0.5;
    const drawShapePath = () => {
      ctx.beginPath();
      if (spec === "vase") {
        // 经典鲁宾杯对称轮廓（光滑曲线构成双面侧影与器皿）
        const top = h * 0.1;
        const bot = h * 0.9;
        const span = bot - top;
        ctx.moveTo(cx - w * 0.24, top);
        ctx.lineTo(cx + w * 0.24, top);
        ctx.bezierCurveTo(cx + w * 0.19, top + span * 0.16, cx + w * 0.11, top + span * 0.24, cx + w * 0.15, top + span * 0.34);
        ctx.bezierCurveTo(cx + w * 0.19, top + span * 0.42, cx + w * 0.08, top + span * 0.50, cx + w * 0.13, top + span * 0.58);
        ctx.bezierCurveTo(cx + w * 0.16, top + span * 0.65, cx + w * 0.09, top + span * 0.74, cx + w * 0.11, top + span * 0.84);
        ctx.bezierCurveTo(cx + w * 0.13, top + span * 0.92, cx + w * 0.21, bot, cx + w * 0.24, bot);
        ctx.lineTo(cx - w * 0.24, bot);
        ctx.bezierCurveTo(cx - w * 0.21, bot, cx - w * 0.13, top + span * 0.92, cx - w * 0.11, top + span * 0.84);
        ctx.bezierCurveTo(cx - w * 0.09, top + span * 0.74, cx - w * 0.16, top + span * 0.65, cx - w * 0.13, top + span * 0.58);
        ctx.bezierCurveTo(cx - w * 0.08, top + span * 0.50, cx - w * 0.19, top + span * 0.42, cx - w * 0.15, top + span * 0.34);
        ctx.bezierCurveTo(cx - w * 0.11, top + span * 0.24, cx - w * 0.19, top + span * 0.16, cx - w * 0.24, top);
        ctx.closePath();
      } else if (spec === "arch") {
        const r = Math.min(w, h) * 0.29;
        const ay = h * 0.42;
        ctx.moveTo(cx - r, h * 0.92);
        ctx.lineTo(cx - r, ay);
        ctx.arc(cx, ay, r, Math.PI, 0, false);
        ctx.lineTo(cx + r, h * 0.92);
        ctx.closePath();
      } else {
        // 五级阶梯共边
        const n = 5;
        const x0 = w * 0.16;
        const x1 = w * 0.84;
        const y0 = h * 0.12;
        const y1 = h * 0.88;
        const sw = (x1 - x0) / n;
        const sh = (y1 - y0) / n;
        ctx.moveTo(x0, y0);
        for (let i = 0; i < n; i++) {
          ctx.lineTo(x0 + (i + 1) * sw, y0 + i * sh);
          ctx.lineTo(x0 + (i + 1) * sw, y0 + (i + 1) * sh);
        }
        ctx.lineTo(x1, y0);
        ctx.closePath();
      }
    };

    if (mode === "outline") {
      drawShapePath();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2.6;
      ctx.stroke();
      // 金色标出共边提示
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = PALETTE.goldDeep;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (mode === "white") {
      ctx.fillStyle = "#ECEAE2";
      ctx.fillRect(0, 0, w, h);
      drawShapePath();
      ctx.fillStyle = PALETTE.white;
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (mode === "black") {
      ctx.fillStyle = "#ECEAE2";
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(w * 0.12, h * 0.08, w * 0.76, h * 0.84);
      drawShapePath();
      ctx.fillStyle = "#ECEAE2";
      ctx.fill();
      ctx.restore();
    } else {
      drawShapePath();
      ctx.fillStyle = fg;
      ctx.fill();
    }
  }

  function render() {
    const { ctx, w, h } = setupHiDPI(canvas);
    ctx.clearRect(0, 0, w, h);

    if (state.mode === "split") {
      const splitX = (state.curtain / 100) * w;
      // 左半：原极性（黑底白形）
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, h);
      ctx.clip();
      drawSpecimen(ctx, w, h, state.spec, false, "split");
      ctx.restore();

      // 右半：反极性（白底黑形）
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, w - splitX, h);
      ctx.clip();
      drawSpecimen(ctx, w, h, state.spec, true, "split");
      ctx.restore();

      // 金色幕帘分界线
      ctx.save();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, h);
      ctx.stroke();
      // 幕帘标签
      ctx.font = `700 12px "Noto Serif SC", sans-serif`;
      if (splitX > 76) {
        ctx.fillStyle = PALETTE.gold;
        ctx.fillText("玄底白形", 14, 24);
      }
      if (w - splitX > 76) {
        ctx.fillStyle = PALETTE.goldDeep;
        ctx.textAlign = "right";
        ctx.fillText("白纸黑拓", w - 14, 24);
        ctx.textAlign = "left";
      }
      ctx.restore();
    } else {
      drawSpecimen(ctx, w, h, state.spec, false, state.mode);
    }

    valEl.textContent = `${state.curtain}%`;
    readingEl.textContent = DESC[state.spec][state.mode];
  }

  slider.addEventListener("input", () => {
    state.curtain = Number(slider.value);
    state.mode = "split";
    for (const b of modeWrap.querySelectorAll("button")) {
      b.classList.toggle("is-active", b.dataset.mode === "split");
    }
    render();
  });

  specWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-spec]");
    if (!btn) return;
    state.spec = btn.dataset.spec;
    for (const b of specWrap.querySelectorAll("button")) b.classList.toggle("is-active", b === btn);
    render();
  });

  modeWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-mode]");
    if (!btn) return;
    state.mode = btn.dataset.mode;
    for (const b of modeWrap.querySelectorAll("button")) b.classList.toggle("is-active", b === btn);
    render();
  });

  render();
}

/* ==================== 02 三步演进 + 黑白张力五区对照盘 ==================== */
export function initSec02() {
  const canvas = document.getElementById("bal-canvas");
  const regimesWrap = document.getElementById("bal-regimes");
  const readingEl = document.getElementById("bal-reading");
  const stepper = document.getElementById("s02-stepper");
  const stepDescEl = document.getElementById("s02-step-desc");
  if (!canvas || !regimesWrap) return;

  const state = { step: 3, regime: "classic" };

  const STEPS = {
    1: "第一步「确定结构」：先用极简骨架线定出主拱外框、门洞位置与底道斜角——不填满细节，先把大形空间关系钉牢。",
    2: "第二步「安排留白」：把空白当成实心白色积木放进骨架里，让主形拱门、次形门洞与底道形成明晰的三层黑白嵌套。",
    3: "第三步「优化节奏」：微调拱壁厚薄、并在大片下白中嵌入一枚圆黑眼「白中有黑」，整幅画立刻生出呼吸与视觉张力。",
  };

  const REGIMES = {
    choked: {
      white: 0.12,
      text: "白占仅 12%（黑压成缝）：大面积黑地压得喘不过气，白色退化成纤细折线，只能读成描边而读不成独立形体。",
    },
    classic: {
      white: 0.38,
      text: "白占约 38%（主次相生）：玄墨沉稳托底，纯白拱门、门洞与光道各成完整形体，底部圆黑眼稳稳收住重心，这是最耐看的经验平衡带。",
    },
    fifty: {
      white: 0.5,
      text: "白占约 50%（均势拉锯）：黑与白旗鼓相当，图底会频繁来回翻转——适合刻意追求双关张力的实验海报，但信息排版中要谨防主次难分。",
    },
    shattered: {
      white: 0.38,
      text: "同样白占 38%，却被切成了七零八落的细碎小条（碎白无形）：面积达标并不等于计白当黑，留白必须整片成形、轮廓干脆。",
    },
    flooded: {
      white: 0.82,
      text: "白占飙至 82%（白漫吞黑）：白形膨胀冲破四壁，黑色被迫退成边角碎屑。黑地一散，白形也跟着失去边界约束而发虚。",
    },
  };

  function render() {
    const { ctx, w, h } = setupHiDPI(canvas);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(0, 0, w, h);

    if (state.step === 1) {
      // 1. 确定结构：纯线框
      ctx.strokeStyle = PALETTE.white;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.24, h * 0.62);
      ctx.lineTo(w * 0.24, h * 0.36);
      ctx.arc(w * 0.5, h * 0.36, w * 0.26, Math.PI, 0, false);
      ctx.lineTo(w * 0.76, h * 0.62);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.52);
      ctx.lineTo(w * 0.84, h * 0.88);
      ctx.lineTo(w * 0.16, h * 0.88);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = PALETTE.gold;
      ctx.font = `700 13px "Noto Serif SC", sans-serif`;
      ctx.fillText("STEP 1 · 先定骨架关系", 16, 26);
      return;
    }

    if (state.regime === "shattered") {
      // 同 38% 白色面积但被切碎成散块
      ctx.fillStyle = PALETTE.white;
      const pieces = [
        [0.12, 0.14, 0.26, 0.12],
        [0.54, 0.12, 0.34, 0.14],
        [0.14, 0.36, 0.18, 0.22],
        [0.42, 0.34, 0.2, 0.14],
        [0.72, 0.38, 0.16, 0.24],
        [0.18, 0.68, 0.28, 0.16],
        [0.56, 0.72, 0.3, 0.14],
      ];
      for (const [x, y, rw, rh] of pieces) {
        ctx.fillRect(w * x, h * y, w * rw, h * rh);
      }
      ctx.strokeStyle = PALETTE.errDark;
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      return;
    }

    const rMap = { choked: 0.15, classic: 0.54, fifty: 0.68, flooded: 0.96 };
    const k = rMap[state.regime] ?? 0.54;
    const outerR = w * (0.21 + k * 0.18);
    const wallT = w * (0.025 + k * 0.13);
    const innerR = Math.max(w * 0.06, outerR - wallT);
    const cx = w * 0.5;
    const cy = h * 0.35;

    ctx.fillStyle = PALETTE.white;
    // 主拱
    ctx.beginPath();
    ctx.moveTo(cx - outerR, h * 0.62);
    ctx.lineTo(cx - outerR, cy);
    ctx.arc(cx, cy, outerR, Math.PI, 0, false);
    ctx.lineTo(cx + outerR, h * 0.62);
    ctx.lineTo(cx + innerR, h * 0.57);
    ctx.lineTo(cx + innerR, cy);
    ctx.arc(cx, cy, innerR, 0, Math.PI, true);
    ctx.lineTo(cx - innerR, h * 0.57);
    ctx.closePath();
    ctx.fill();

    // 下白道
    const halfBase = w * (0.18 + k * 0.3);
    ctx.beginPath();
    ctx.moveTo(cx, h * 0.52);
    ctx.lineTo(cx + halfBase, h * 0.88);
    ctx.quadraticCurveTo(cx, h * 0.94, cx - halfBase, h * 0.88);
    ctx.closePath();
    ctx.fill();

    // 次形门洞
    const pw = w * (0.032 + k * 0.03);
    ctx.beginPath();
    ctx.moveTo(cx - pw, h * 0.58);
    ctx.lineTo(cx - pw, h * 0.46);
    ctx.arc(cx, h * 0.46, pw, Math.PI, 0, false);
    ctx.lineTo(cx + pw, h * 0.58);
    ctx.closePath();
    ctx.fill();

    // 第 3 步才点入圆黑眼（与第 2 步形成立即可见的差异！）
    if (state.step === 3 && state.regime !== "choked") {
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(cx, h * 0.74, w * (0.055 + k * 0.025), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  regimesWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-regime]");
    if (!btn) return;
    state.regime = btn.dataset.regime;
    if (state.step === 1) {
      state.step = 3;
      for (const b of stepper.querySelectorAll("button")) b.classList.toggle("is-active", b.dataset.step === "3");
      stepDescEl.textContent = STEPS[3];
    }
    for (const b of regimesWrap.querySelectorAll("button")) b.classList.toggle("is-active", b === btn);
    readingEl.textContent = REGIMES[state.regime].text;
    render();
  });

  stepper.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-step]");
    if (!btn) return;
    state.step = Number(btn.dataset.step);
    for (const b of stepper.querySelectorAll("button")) b.classList.toggle("is-active", b === btn);
    stepDescEl.textContent = STEPS[state.step];
    render();
  });

  render();
}

/* ==================== 03 5×4 墨阵刻白导流沙盘（BFS 实时路径） ==================== */
export function initSec03() {
  const board = document.getElementById("maze-board");
  const svg = document.getElementById("maze-svg");
  const presetsWrap = document.getElementById("path-presets");
  const ratioEl = document.getElementById("maze-ratio");
  const stepsEl = document.getElementById("maze-steps");
  const badgeEl = document.getElementById("maze-badge");
  const readingEl = document.getElementById("maze-reading");
  if (!board || !svg) return;

  const COLS = 5;
  const ROWS = 4;
  const START = [3, 2]; // 底部中央入口
  const GOAL = [0, 2];  // 顶部中央门洞

  // 1 = 留白通道，0 = 实墨块
  const PRESETS = {
    wedge: [
      0, 0, 1, 0, 0,
      0, 0, 1, 0, 0,
      0, 1, 1, 1, 0,
      0, 1, 1, 1, 0,
    ],
    zigzag: [
      0, 0, 1, 1, 0,
      0, 0, 0, 1, 0,
      0, 1, 1, 1, 0,
      0, 1, 1, 0, 0,
    ],
    blocked: [
      0, 0, 1, 0, 0,
      0, 0, 0, 0, 0,
      0, 1, 1, 1, 0,
      0, 1, 1, 1, 0,
    ],
    leak: [
      1, 1, 1, 1, 1,
      1, 1, 1, 1, 1,
      1, 1, 1, 1, 0,
      1, 1, 1, 1, 1,
    ],
  };

  let grid = [...PRESETS.wedge];

  function findPath() {
    const idx = (r, c) => r * COLS + c;
    if (!grid[idx(START[0], START[1])] || !grid[idx(GOAL[0], GOAL[1])]) return null;
    const q = [[START[0], START[1]]];
    const prev = new Map();
    const key = (r, c) => `${r},${c}`;
    prev.set(key(START[0], START[1]), null);
    const dirs = [[-1, 0], [0, -1], [0, 1], [1, 0]];
    while (q.length) {
      const [r, c] = q.shift();
      if (r === GOAL[0] && c === GOAL[1]) {
        const path = [];
        let cur = key(r, c);
        while (cur) {
          const [pr, pc] = cur.split(",").map(Number);
          path.push([pr, pc]);
          cur = prev.get(cur);
        }
        return path.reverse();
      }
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        const k = key(nr, nc);
        if (grid[idx(nr, nc)] && !prev.has(k)) {
          prev.set(k, key(r, c));
          q.push([nr, nc]);
        }
      }
    }
    return null;
  }

  function render() {
    board.innerHTML = "";
    let whiteCount = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const isW = grid[i] === 1;
        if (isW) whiteCount++;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `maze-cell ${isW ? "is-white" : "is-black"}`;
        if (r === START[0] && c === START[1]) btn.classList.add("is-start");
        if (r === GOAL[0] && c === GOAL[1]) btn.classList.add("is-goal");
        btn.setAttribute("aria-label", `第 ${r + 1} 行第 ${c + 1} 列，当前为${isW ? "留白通道" : "实墨块"}，点击翻转`);
        btn.dataset.idx = String(i);
        btn.textContent = isW ? "白" : "墨";
        board.appendChild(btn);
      }
    }

    const whitePct = Math.round((whiteCount / (COLS * ROWS)) * 100);
    const path = findPath();
    ratioEl.textContent = `白道占比 ${whitePct}%`;

    if (path && whitePct <= 65 && whitePct >= 20) {
      const pts = path.map(([r, c]) => `${c * 100 + 50},${r * 100 + 50}`).join(" ");
      const [er, ec] = path[path.length - 1];
      svg.innerHTML = `
        <polyline points="${pts}" fill="none" stroke="${PALETTE.gold}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>
        <circle cx="${START[1] * 100 + 50}" cy="${START[0] * 100 + 50}" r="12" fill="${PALETTE.ink}" stroke="${PALETTE.gold}" stroke-width="4"/>
        <circle cx="${ec * 100 + 50}" cy="${er * 100 + 50}" r="14" fill="${PALETTE.gold}"/>
      `;
      stepsEl.textContent = `通路步数 ${path.length} 格`;
      badgeEl.textContent = "光道贯通";
      badgeEl.className = "maze-badge";
      readingEl.textContent =
        path.length > 4
          ? `视线顺着 ${path.length} 格曲折白廊回转递进，两侧实墨稳稳夹住通道，既有层次变化又稳准抵达门洞。`
          : `底部宽白入口逐级收窄，经 ${path.length} 格直贯顶部门洞，实墨像石墙一样护住气口不外泄。`;
    } else if (path && whitePct > 65) {
      const pts = path.map(([r, c]) => `${c * 100 + 50},${r * 100 + 50}`).join(" ");
      svg.innerHTML = `<polyline points="${pts}" fill="none" stroke="${PALETTE.errDark}" stroke-width="6" stroke-dasharray="12 8"/>`;
      stepsEl.textContent = `白格过满 ${whitePct}%`;
      badgeEl.textContent = "通道泄散";
      badgeEl.className = "maze-badge is-err";
      readingEl.textContent = `虽然起点和终点相连，但白格占了 ${whitePct}%，四周没有黑墙夹束，视线一进来就四处散开，失去「引导」作用。`;
    } else {
      svg.innerHTML = `
        <line x1="250" y1="350" x2="250" y2="210" stroke="${PALETTE.errDark}" stroke-width="5" stroke-dasharray="8 8"/>
        <circle cx="250" cy="200" r="14" fill="${PALETTE.errDark}"/>
      `;
      stepsEl.textContent = "通道中断";
      badgeEl.textContent = "死胡同阻断";
      badgeEl.className = "maze-badge is-err";
      readingEl.textContent = "从「入」到「门」的白道被实墨截断了——读者视线在半路撞墙卡住。点开中段墨格，凿出一条连贯的白色通路。";
    }
  }

  board.addEventListener("click", (e) => {
    const cell = e.target.closest(".maze-cell");
    if (!cell) return;
    const i = Number(cell.dataset.idx);
    grid[i] = grid[i] ? 0 : 1;
    for (const b of presetsWrap.querySelectorAll("button")) b.classList.remove("is-active");
    render();
  });

  presetsWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-preset]");
    if (!btn) return;
    grid = [...PRESETS[btn.dataset.preset]];
    for (const b of presetsWrap.querySelectorAll("button")) b.classList.toggle("is-active", b === btn);
    render();
  });

  render();
}

/* ==================== 04 从哪来：百年四境拓片翻检匣 ==================== */
export function initSec04() {
  const tabs = document.getElementById("era-tabs");
  const canvas = document.getElementById("era-canvas");
  const stampEl = document.getElementById("era-stamp");
  const xrayBtn = document.getElementById("btn-era-xray");
  const metaEl = document.getElementById("era-meta");
  const titleEl = document.getElementById("era-title");
  const quoteEl = document.getElementById("era-quote");
  const descEl = document.getElementById("era-desc");
  if (!tabs || !canvas) return;

  const ERAS = {
    1680: {
      stamp: "无画成境",
      meta: "清·康熙十九年（1680） · 笪重光（1623–1692）《画筌》",
      title: "把「无画处」抬升到与笔墨同等的全局地位",
      quote: "「位置相戾，有画处多属赘疣；虚实相生，无画处皆成妙境。」",
      descHTML:
        '清初画论家笪重光于康熙十九年（1680）撰成《画筌》，同代名家王翚、恽寿平评注更点破「人但知有画处是画，不知无画处皆画」。传统章法里与它同源的还有讲究节奏转折的<a href="https://layout.xiaoxiaodong.ai/332/play/" target="_blank" rel="noopener">332 起承转合构图</a>、隐显相托的<a href="https://layout.xiaoxiaodong.ai/333/play/" target="_blank" rel="noopener">333 藏露关系构图</a>和险中求稳的<a href="https://layout.xiaoxiaodong.ai/334/play/" target="_blank" rel="noopener">334 欹正关系构图</a>。',
    },
    1844: {
      stamp: "计白当黑",
      meta: "清·道光二十四年（1844）《安吴四种》初刊 · 包世臣《艺舟双楫·述书上》记邓石如",
      title: "「计白当黑」正式定名：书法与篆刻的刀笔铁律",
      quote: "「字画疏处可以走马，密处不使透风，常计白以当黑，奇趣乃出。」",
      descHTML:
        "清代书家包世臣（1775–1855）在《艺舟双楫·卷五·述书上》（道光二十四年 1844 随《安吴四种》初刊）中，记述向怀宁篆刻大家邓石如（1743–1805）求法时听到的核心要诀。篆刻印石方寸之间，刀过留白、石留成朱，正因把每一道白缝都当实画来算，才有了疏密跌宕的奇趣。",
    },
    1915: {
      stamp: "图底互转",
      meta: "1915 · 丹麦心理学家 Edgar Rubin（1886–1951）《Synsoplevede Figurer》",
      title: "视觉心理学揭开底层机理：边界归属与图底反转",
      quote: "一条封闭轮廓线在同一瞬间只归属于「图」，另一侧则自动退后为「底」。",
      descHTML:
        "1915 年，Edgar Rubin 在哥本哈根大学博士论文《Synsoplevede Figurer》中发表了著名的鲁宾杯实验，首次系统证明大脑会主动划分图（Figure）与底（Ground）。东方画论讲了三百年的「计白当黑」，由此获得了严谨的感知科学解释。",
    },
    1994: {
      stamp: "负形生箭",
      meta: "1975–1994 · 福田繁雄（1932–2009）与 Lindon Leader（FedEx 字标）",
      title: "现代平面设计的极简杀招：一画两读的负形符号",
      quote: "精算字母 E 与 x 之间的空白，让一支向右的箭头在白色负空间里天然长成。",
      descHTML:
        "战后日本平面大师福田繁雄以犀利的黑白图底反转海报享誉世界；1994 年，Landor Associates 的设计师 Lindon Leader 为 FedEx 设计的字标，借精确字距把 E 与 x 之间的空白闭合出一支隐形箭头——无需多画一笔，速度与精准不言自明。",
    },
  };

  let cur = "1680";
  let xray = false;

  function drawPlate() {
    const { ctx, w, h } = setupHiDPI(canvas);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    if (cur === "1680") {
      // 传统山水虚实拓片：重峦叠嶂与远岸墨峰之间，夹出曲折明亮的 S 形云水江道
      ctx.fillStyle = PALETTE.white;
      ctx.fillRect(22, 18, w - 44, h - 36);
      // 极淡远山淡墨雾带（不抢主轮廓，增添水墨层次）
      ctx.fillStyle = "rgba(0,6,22,0.12)";
      ctx.beginPath();
      ctx.moveTo(22, h * 0.42);
      ctx.quadraticCurveTo(w * 0.2, h * 0.22, w * 0.36, h * 0.33);
      ctx.quadraticCurveTo(w * 0.52, h * 0.14, w * 0.68, h * 0.28);
      ctx.lineTo(w * 0.68, 18);
      ctx.lineTo(22, 18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = PALETTE.ink;
      // 左上主山群峰（高低错落的峰峦剪影，留出右上至左下的云水江道）
      ctx.beginPath();
      ctx.moveTo(22, 18);
      ctx.lineTo(w * 0.56, 18);
      ctx.lineTo(w * 0.51, h * 0.25);
      ctx.lineTo(w * 0.44, h * 0.2);
      ctx.lineTo(w * 0.37, h * 0.38);
      ctx.quadraticCurveTo(w * 0.28, h * 0.42, w * 0.22, h * 0.48);
      ctx.lineTo(w * 0.14, h * 0.43);
      ctx.lineTo(22, h * 0.56);
      ctx.closePath();
      ctx.fill();

      // 右下近坡与松岩（反抱出江面）
      ctx.beginPath();
      ctx.moveTo(w - 22, h - 18);
      ctx.lineTo(w * 0.34, h - 18);
      ctx.quadraticCurveTo(w * 0.46, h * 0.78, w * 0.56, h * 0.72);
      ctx.lineTo(w * 0.64, h * 0.64);
      ctx.lineTo(w * 0.72, h * 0.68);
      ctx.lineTo(w * 0.82, h * 0.46);
      ctx.lineTo(w * 0.9, h * 0.5);
      ctx.lineTo(w - 22, h * 0.34);
      ctx.closePath();
      ctx.fill();

      // 江心一叶孤舟与篷顶（微墨点破大片白水）
      ctx.beginPath();
      ctx.moveTo(w * 0.44, h * 0.56);
      ctx.quadraticCurveTo(w * 0.5, h * 0.605, w * 0.56, h * 0.56);
      ctx.lineTo(w * 0.535, h * 0.55);
      ctx.lineTo(w * 0.465, h * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.548, 5, Math.PI, 0, false);
      ctx.fill();

      if (xray) {
        ctx.strokeStyle = PALETTE.goldDeep;
        ctx.lineWidth = 3;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(w * 0.66, 26);
        ctx.bezierCurveTo(w * 0.58, h * 0.44, w * 0.38, h * 0.58, w * 0.18, h - 26);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = PALETTE.goldDeep;
        ctx.font = `700 13px "Noto Serif SC", sans-serif`;
        ctx.fillText("未着一墨的「云水白带」成全幅气脉", w * 0.25, h * 0.48);
      }
    } else if (cur === "1844") {
      // 篆刻疏密章法印面示意（上密不透风，下疏可走马）
      const s = 224;
      const ox = (w - s) / 2;
      const oy = (h - s) / 2;
      ctx.fillStyle = "#9F231B";
      ctx.fillRect(ox, oy, s, s);
      ctx.fillStyle = PALETTE.white;
      // 上部密刻细条
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(ox + 22, oy + 24 + i * 21, s - 44, 7);
      }
      ctx.fillRect(ox + 64, oy + 20, 8, 84);
      ctx.fillRect(ox + s - 72, oy + 20, 8, 84);
      // 下部大块疏白庭院
      ctx.fillRect(ox + 24, oy + 122, s - 48, 80);
      // 中间一根小朱柱回护
      ctx.fillStyle = "#9F231B";
      ctx.fillRect(ox + s / 2 - 14, oy + 148, 28, 30);
      if (xray) {
        ctx.strokeStyle = PALETTE.gold;
        ctx.lineWidth = 3;
        ctx.strokeRect(ox + 24, oy + 122, s - 48, 80);
        ctx.fillStyle = PALETTE.gold;
        ctx.font = `700 12px "Noto Serif SC", sans-serif`;
        ctx.fillText("密不透风", ox + s + 16, oy + 62);
        ctx.fillText("疏可走马", ox + s + 16, oy + 168);
      }
    } else if (cur === "1915") {
      // 鲁宾双义对称器皿（纯侧影剪影，无五官）
      const cx = w * 0.5;
      ctx.fillStyle = PALETTE.white;
      ctx.beginPath();
      ctx.moveTo(cx - 88, 26);
      ctx.lineTo(cx + 88, 26);
      ctx.bezierCurveTo(cx + 68, 84, cx + 34, 114, cx + 52, 148);
      ctx.bezierCurveTo(cx + 68, 178, cx + 32, 208, cx + 48, 242);
      ctx.bezierCurveTo(cx + 62, 262, cx + 76, 274, cx + 88, 274);
      ctx.lineTo(cx - 88, 274);
      ctx.bezierCurveTo(cx - 76, 274, cx - 62, 262, cx - 48, 242);
      ctx.bezierCurveTo(cx - 32, 208, cx - 68, 178, cx - 52, 148);
      ctx.bezierCurveTo(cx - 34, 114, cx - 68, 84, cx - 88, 26);
      ctx.closePath();
      ctx.fill();
      if (xray) {
        ctx.strokeStyle = PALETTE.gold;
        ctx.lineWidth = 3.2;
        ctx.stroke();
        ctx.fillStyle = PALETTE.gold;
        ctx.font = `700 13px "Noto Serif SC", sans-serif`;
        ctx.fillText("同一条闭合边界决定正负两形", 20, 32);
      }
    } else {
      // 1994 现代字标 E → x 负形箭头几何示意
      ctx.fillStyle = PALETTE.white;
      ctx.fillRect(72, 46, w - 144, h - 92);
      ctx.fillStyle = PALETTE.ink;
      // 几何粗体 E
      ctx.fillRect(96, 68, 34, 164);
      ctx.fillRect(96, 68, 128, 38);
      ctx.fillRect(96, 131, 108, 34);
      ctx.fillRect(96, 194, 128, 38);
      // 右侧几何 X-切块形成精确向右箭头
      ctx.beginPath();
      ctx.moveTo(224, 68);
      ctx.lineTo(420, 68);
      ctx.lineTo(420, 232);
      ctx.lineTo(224, 232);
      ctx.lineTo(224, 200);
      ctx.lineTo(298, 148);
      ctx.lineTo(224, 96);
      ctx.closePath();
      ctx.fill();
      // 右侧 X 右缺口
      ctx.fillStyle = PALETTE.white;
      ctx.beginPath();
      ctx.moveTo(420, 96);
      ctx.lineTo(356, 148);
      ctx.lineTo(420, 200);
      ctx.closePath();
      ctx.fill();
      if (xray) {
        ctx.fillStyle = PALETTE.gold;
        ctx.beginPath();
        ctx.moveTo(204, 131);
        ctx.lineTo(234, 131);
        ctx.lineTo(234, 104);
        ctx.lineTo(296, 148);
        ctx.lineTo(234, 192);
        ctx.lineTo(234, 165);
        ctx.lineTo(204, 165);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = PALETTE.gold;
        ctx.font = `700 13px "Noto Serif SC", sans-serif`;
        ctx.fillText("零多余笔画：E 与 X 间天然闭合出白色箭头", 72, 30);
      }
    }
    ctx.restore();
  }

  function update() {
    const info = ERAS[cur];
    stampEl.textContent = info.stamp;
    metaEl.textContent = info.meta;
    titleEl.textContent = info.title;
    quoteEl.textContent = info.quote;
    descEl.innerHTML = info.descHTML;
    drawPlate();
  }

  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-era]");
    if (!btn) return;
    cur = btn.dataset.era;
    for (const b of tabs.querySelectorAll("button")) {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    }
    update();
  });

  xrayBtn.addEventListener("click", () => {
    xray = !xray;
    xrayBtn.setAttribute("aria-pressed", String(xray));
    xrayBtn.textContent = xray ? "关闭负形显影" : "显影负形轮廓";
    drawPlate();
  });

  update();
}

/* ==================== 05 什么时候别用：真实 WCAG 对比度失效压力台 ==================== */
export function initSec05() {
  const canvas = document.getElementById("stress-canvas");
  const cSlider = document.getElementById("stress-contrast");
  const nSlider = document.getElementById("stress-noise");
  const cVal = document.getElementById("stress-contrast-val");
  const nVal = document.getElementById("stress-noise-val");
  const badgeEl = document.getElementById("stress-badge");
  const readingEl = document.getElementById("stress-reading");
  const textBtns = document.getElementById("stress-text-btns");
  if (!canvas || !cSlider) return;

  const state = { contrast: 100, noise: 0, len: "short" };

  function relLum(r, g, b) {
    const f = (c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }

  function render() {
    const { ctx, w, h } = setupHiDPI(canvas);
    const k = state.contrast / 100; // 1 = 纯黑对纯白，0 = 灰对灰
    // 背景灰度从 #000616 过渡到 #9AA0AA，前景从 #FEFEFC 过渡到 #BDC2CA
    const bgR = Math.round(0 + (1 - k) * 154);
    const bgG = Math.round(6 + (1 - k) * 154);
    const bgB = Math.round(22 + (1 - k) * 148);
    const fgR = Math.round(254 - (1 - k) * 60);
    const fgG = Math.round(254 - (1 - k) * 58);
    const fgB = Math.round(252 - (1 - k) * 52);

    const L1 = Math.max(relLum(fgR, fgG, fgB), relLum(bgR, bgG, bgB));
    const L2 = Math.min(relLum(fgR, fgG, fgB), relLum(bgR, bgG, bgB));
    const ratio = (L1 + 0.05) / (L2 + 0.05);

    ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
    ctx.fillRect(0, 0, w, h);

    // 确定性伪随机背景杂噪纹理（模拟低清照片/花哨底纹）
    if (state.noise > 0) {
      const count = Math.round(state.noise * 11);
      for (let i = 0; i < count; i++) {
        const px = ((i * 97 + 31) % 100) * 0.01 * w;
        const py = ((i * 53 + 17) % 100) * 0.01 * h;
        const rw = 8 + (i % 5) * 10;
        const rh = 6 + (i % 4) * 8;
        ctx.fillStyle = i % 2 === 0 ? `rgba(255,255,255,${(state.noise / 100) * 0.34})` : `rgba(0,0,0,${(state.noise / 100) * 0.28})`;
        ctx.fillRect(px, py, rw, rh);
      }
    }

    // 绘制中央测试样本：拱门白形 + 字标负形箭
    ctx.fillStyle = `rgb(${fgR},${fgG},${fgB})`;
    if (state.len === "short") {
      // 完整简洁的拱门与字间负形箭
      const cx = w * 0.32;
      ctx.beginPath();
      ctx.moveTo(cx - 64, 212);
      ctx.lineTo(cx - 64, 114);
      ctx.arc(cx, 114, 64, Math.PI, 0, false);
      ctx.lineTo(cx + 64, 212);
      ctx.lineTo(cx + 28, 196);
      ctx.lineTo(cx + 28, 114);
      ctx.arc(cx, 114, 28, 0, Math.PI, true);
      ctx.lineTo(cx - 28, 196);
      ctx.closePath();
      ctx.fill();

      // 右侧清晰可辨的 EX 负形箭头铭牌（亮牌面承载粗体 E 与 X，字间负空间自然闭合出向右箭头）
      const cardX = Math.round(w * 0.52);
      const cardY = 56;
      const cardW = 228;
      const cardH = 156;
      ctx.fillStyle = `rgb(${fgR},${fgG},${fgB})`;
      ctx.fillRect(cardX, cardY, cardW, cardH);

      // 用背景深墨在牌面上画清晰的几何粗体 E 与 X
      ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
      const ex0 = cardX + 24;
      const ey0 = cardY + 26;
      const eh = 104;
      // 字母 E：左竖 + 上中下三横
      ctx.fillRect(ex0, ey0, 24, eh);
      ctx.fillRect(ex0, ey0, 82, 24);
      ctx.fillRect(ex0, ey0 + 40, 68, 22);
      ctx.fillRect(ex0, ey0 + eh - 24, 82, 24);

      // 字母 X：两条交叉斜臂，左侧尖角正好与 E 上下横咬合出向右白箭头
      const xLeft = ex0 + 84;
      const xRight = xLeft + 92;
      const xMidY = ey0 + eh / 2;
      ctx.beginPath();
      ctx.moveTo(xLeft, ey0);
      ctx.lineTo(xLeft + 28, ey0);
      ctx.lineTo(xLeft + 46, xMidY - 18);
      ctx.lineTo(xRight - 28, ey0);
      ctx.lineTo(xRight, ey0);
      ctx.lineTo(xLeft + 62, xMidY);
      ctx.lineTo(xRight, ey0 + eh);
      ctx.lineTo(xRight - 28, ey0 + eh);
      ctx.lineTo(xLeft + 46, xMidY + 18);
      ctx.lineTo(xLeft + 28, ey0 + eh);
      ctx.lineTo(xLeft, ey0 + eh);
      ctx.lineTo(xLeft + 30, xMidY);
      ctx.closePath();
      ctx.fill();
    } else if (state.len === "mid") {
      ctx.fillRect(42, 62, w - 84, 146);
      ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
      ctx.font = `900 32px "Noto Serif SC", sans-serif`;
      ctx.fillText("2026 秋季建筑双年展", 68, 130);
      ctx.font = `600 15px "Noto Serif SC", sans-serif`;
      ctx.fillText("主展馆 3 号厅 · 10:00–18:00 · 需提前预约", 68, 172);
    } else {
      // 动态长文案塞爆负形容器
      ctx.fillRect(26, 30, w - 52, 210);
      ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
      ctx.font = `700 17px "Noto Serif SC", sans-serif`;
      const lines = [
        "【动态注入长标题】国际当代建筑空间形态与多语种",
        "跨媒介视觉实验联合特展（巡回站 · 第三期延长场）",
        "票务核验 | 团体预约 | 语音导览 | 交通接驳 | 周边商店",
        "备注：所有原设计好的负形留白通道已被动态文本塞满",
      ];
      lines.forEach((ln, i) => ctx.fillText(ln, 42, 74 + i * 44));
    }

    cVal.textContent = `${ratio.toFixed(1)}:1`;
    nVal.textContent = `${state.noise}%`;

    const failContrast = ratio < 3.2;
    const failNoise = state.noise >= 42;
    const failText = state.len === "long";

    if (failContrast || failNoise || failText) {
      badgeEl.className = "mono lab-badge is-err";
      const reasons = [];
      if (failContrast) reasons.push(`对比度 ${ratio.toFixed(1)}:1 过低`);
      if (failNoise) reasons.push(`杂噪 ${state.noise}% 撕碎边界`);
      if (failText) reasons.push("动态长文案挤毁负形");
      badgeEl.textContent = `失灵 · ${reasons[0]}`;
      readingEl.textContent = `当前触发失效条件（${reasons.join("；")}）：计白当黑高度依赖锐利明度边界与可控留白块，这类场景应改用清晰栅格卡片，别强套负形构图。`;
    } else if (state.len === "mid") {
      badgeEl.className = "mono lab-badge";
      badgeEl.textContent = `临界 · 对比度 ${ratio.toFixed(1)}:1`;
      readingEl.textContent = "中长标题开始挤占留白：虽然对比度依然清晰，但字间已难雕出独立几何白形，需退回到常规层次排版。";
    } else {
      badgeEl.className = "mono lab-badge";
      badgeEl.textContent = `对比度 ${ratio.toFixed(1)}:1 · 清晰成立`;
      readingEl.textContent = `明度比 ${ratio.toFixed(1)}:1、杂噪 ${state.noise}%、定版短标：黑白边界锐利如刀切，拱门与中央负形箭头一眼可读。试着拉低反差或切到「动态长文案」看它如何崩塌。`;
    }
  }

  cSlider.addEventListener("input", () => { state.contrast = Number(cSlider.value); render(); });
  nSlider.addEventListener("input", () => { state.noise = Number(nSlider.value); render(); });
  textBtns.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-len]");
    if (!btn) return;
    state.len = btn.dataset.len;
    for (const b of textBtns.querySelectorAll("button")) b.classList.toggle("is-active", b === btn);
    render();
  });

  render();
}

/* ==================== 06 小练习（两题同构单变量四选一 + 反拓验证） ==================== */
export function initSec06() {
  const switchWrap = document.getElementById("quiz-switch");
  const invertBtn = document.getElementById("btn-quiz-invert");
  const promptEl = document.getElementById("quiz-prompt");
  const grid = document.getElementById("quiz-grid");
  const feedbackEl = document.getElementById("quiz-feedback");
  if (!grid || !switchWrap) return;

  const QUESTIONS = [
    {
      prompt: "下面四张海报采用完全相同的玄墨底色与拱门元素，只差一个构图变量。挑一挑哪一版真正做到「留白立成实形、层次独立、导向顺畅」：",
      answer: "C",
      options: [
        {
          id: "A",
          reason: "方案 A 虽然也有拱门、门洞与光道，但拱壁被压得过瘦，退化成一条细空心线框——留白撑不起实心体量，打开「反拓黑白验形」一眼能看出骨架发虚。",
          draw(ctx, w, h, inv) {
            const bg = inv ? PALETTE.white : PALETTE.ink;
            const fg = inv ? PALETTE.ink : PALETTE.white;
            ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = fg;
            drawMiniArch(ctx, w, h, { ro: 0.31, ri: 0.265, portalY: 0.46, portalX: 0.5, aimX: 0.5, eyeX: 0.5, eyeY: 0.77, bg, fg });
          },
        },
        {
          id: "B",
          reason: "方案 B 的外拱与下白道都有体量，但中间的次形白门洞向上顶死撞进外拱白壁，黑腔被挤破并块，双层空间纵深塌成了平面一团。",
          draw(ctx, w, h, inv) {
            const bg = inv ? PALETTE.white : PALETTE.ink;
            const fg = inv ? PALETTE.ink : PALETTE.white;
            ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = fg;
            drawMiniArch(ctx, w, h, { ro: 0.33, ri: 0.16, portalY: 0.25, portalX: 0.5, aimX: 0.5, eyeX: 0.5, eyeY: 0.77, bg, fg });
          },
        },
        {
          id: "C",
          reason: "答对了！方案 C 外白拱立成主形、黑腔内稳稳浮起独立次形门洞、底部白道正指门洞并嵌黑眼平衡重心。打开「反拓黑白验形」，白块翻成黑墨依然像完整建筑。",
          draw(ctx, w, h, inv) {
            const bg = inv ? PALETTE.white : PALETTE.ink;
            const fg = inv ? PALETTE.ink : PALETTE.white;
            ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = fg;
            drawMiniArch(ctx, w, h, { ro: 0.33, ri: 0.16, portalY: 0.46, portalX: 0.5, aimX: 0.5, eyeX: 0.5, eyeY: 0.77, bg, fg });
          },
        },
        {
          id: "D",
          reason: "方案 D 的外拱、门洞与黑眼都立住了，但唯独底部白光道的尖顶大幅向右偏歪，把读者的视线径直甩向右侧黑边，错过了中轴门洞。",
          draw(ctx, w, h, inv) {
            const bg = inv ? PALETTE.white : PALETTE.ink;
            const fg = inv ? PALETTE.ink : PALETTE.white;
            ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = fg;
            drawMiniArch(ctx, w, h, { ro: 0.33, ri: 0.16, portalY: 0.46, portalX: 0.5, aimX: 0.78, eyeX: 0.55, eyeY: 0.78, bg, fg });
          },
        },
      ],
    },
    {
      prompt: "下面四枚单色标志用了完全相同的几何字母 E 与 X，只差字距与对齐这一个变量。挑一挑哪一版的字间负空间自然闭合出清晰向右箭头：",
      answer: "B",
      options: [
        {
          id: "A",
          reason: "方案 A 字距拉得太松，E 与 X 之间散成一条宽走廊，负形箭头无法闭合，只剩两个孤立字母。",
          draw(ctx, w, h, inv) { drawMiniEX(ctx, w, h, inv, { gap: 28, yOff: 0 }); },
        },
        {
          id: "B",
          reason: "答对了！方案 B 的 E 与 X 严丝合缝咬合，中间负空间自然闭合出一支锐利完整的向右箭头——无需多画一笔，点「反拓黑白验形」箭头更是一目了然。",
          draw(ctx, w, h, inv) { drawMiniEX(ctx, w, h, inv, { gap: 2, yOff: 0 }); },
        },
        {
          id: "C",
          reason: "方案 C 把 E 与 X 压得过紧叠死，字间负空间被碾碎成扁窄残缝，箭头形状完全消失。",
          draw(ctx, w, h, inv) { drawMiniEX(ctx, w, h, inv, { gap: -18, yOff: 0 }); },
        },
        {
          id: "D",
          reason: "方案 D 的字距虽接近，但右侧字母 X 向下错位，把负形箭尖与箭身硬生生剪断成了不规则梯形。",
          draw(ctx, w, h, inv) { drawMiniEX(ctx, w, h, inv, { gap: 2, yOff: 22 }); },
        },
      ],
    },
  ];

  function drawMiniArch(ctx, w, h, { ro = 0.33, ri = 0.16, portalY, portalX, aimX, eyeX, eyeY, bg, fg }) {
    const cx = w * 0.5;
    const cy = h * 0.34;
    const rOuter = w * ro;
    const rInner = w * ri;
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(cx - rOuter, h * 0.59);
    ctx.lineTo(cx - rOuter, cy);
    ctx.arc(cx, cy, rOuter, Math.PI, 0, false);
    ctx.lineTo(cx + rOuter, h * 0.59);
    ctx.lineTo(cx + rInner, h * 0.53);
    ctx.lineTo(cx + rInner, cy);
    ctx.arc(cx, cy, rInner, 0, Math.PI, true);
    ctx.lineTo(cx - rInner, h * 0.53);
    ctx.closePath();
    ctx.fill();

    // 下道
    ctx.beginPath();
    ctx.moveTo(w * aimX, h * 0.54);
    ctx.lineTo(w * 0.9, h * 0.9);
    ctx.quadraticCurveTo(w * 0.5, h * 0.96, w * 0.1, h * 0.9);
    ctx.closePath();
    ctx.fill();

    // 次形门洞
    const pw = w * 0.052;
    ctx.beginPath();
    ctx.moveTo(w * portalX - pw, h * 0.58);
    ctx.lineTo(w * portalX - pw, h * portalY);
    ctx.arc(w * portalX, h * portalY, pw, Math.PI, 0, false);
    ctx.lineTo(w * portalX + pw, h * 0.58);
    ctx.closePath();
    ctx.fill();

    // 黑眼
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(w * eyeX, h * eyeY, w * 0.085, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMiniEX(ctx, w, h, inv, { gap, yOff }) {
    // inv=false 时：白牌面载玄墨 E/X（让字间白箭一目了然）；反拓 inv=true 时：玄墨牌面载纯白 E/X，箭变纯黑
    const outerBg = inv ? PALETTE.white : PALETTE.ink;
    const plateBg = inv ? PALETTE.ink : PALETTE.white;
    const glyphFg = inv ? PALETTE.white : PALETTE.ink;

    ctx.fillStyle = outerBg;
    ctx.fillRect(0, 0, w, h);

    const padX = 16;
    const padY = 58;
    ctx.fillStyle = plateBg;
    ctx.fillRect(padX, padY, w - padX * 2, h - padY * 2);

    const eh = 104;
    const ey0 = Math.round((h - eh) / 2);
    const eW = 72;
    const xW = 82;
    const totalW = eW + gap + xW;
    const ex0 = Math.round((w - totalW) / 2);
    const xLeft = ex0 + eW + gap;
    const xRight = xLeft + xW;
    const xMidY = ey0 + eh / 2 + yOff;

    ctx.save();
    ctx.beginPath();
    ctx.rect(padX, padY, w - padX * 2, h - padY * 2);
    ctx.clip();

    ctx.fillStyle = glyphFg;
    // 清晰几何粗体 E
    ctx.fillRect(ex0, ey0, 22, eh);
    ctx.fillRect(ex0, ey0, eW, 24);
    ctx.fillRect(ex0, ey0 + 40, eW - 12, 22);
    ctx.fillRect(ex0, ey0 + eh - 24, eW, 24);

    // 清晰几何粗体 X（左侧斜臂张口正好与 E 咬合出向右负形箭头）
    const xy0 = ey0 + yOff;
    ctx.beginPath();
    ctx.moveTo(xLeft, xy0);
    ctx.lineTo(xLeft + 25, xy0);
    ctx.lineTo(xLeft + 41, xMidY - 16);
    ctx.lineTo(xRight - 25, xy0);
    ctx.lineTo(xRight, xy0);
    ctx.lineTo(xLeft + 55, xMidY);
    ctx.lineTo(xRight, xy0 + eh);
    ctx.lineTo(xRight - 25, xy0 + eh);
    ctx.lineTo(xLeft + 41, xMidY + 16);
    ctx.lineTo(xLeft + 25, xy0 + eh);
    ctx.lineTo(xLeft, xy0 + eh);
    ctx.lineTo(xLeft + 27, xMidY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = inv ? "rgba(254,254,252,0.28)" : "rgba(0,6,22,0.18)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padX, padY, w - padX * 2, h - padY * 2);
  }

  let qIdx = 0;
  let picked = null;
  let quizInv = false;

  function render() {
    const q = QUESTIONS[qIdx];
    promptEl.textContent = q.prompt;
    grid.innerHTML = "";

    for (const opt of q.options) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-opt";
      btn.dataset.opt = opt.id;
      if (picked === opt.id) {
        btn.classList.add(opt.id === q.answer ? "is-correct" : "is-wrong");
      } else if (picked && opt.id === q.answer) {
        btn.classList.add("is-correct");
      }

      const cv = document.createElement("canvas");
      cv.width = 240;
      cv.height = 300;
      opt.draw(cv.getContext("2d"), cv.width, cv.height, quizInv);

      const head = document.createElement("div");
      head.className = "quiz-opt-head";
      const mark = picked ? (opt.id === q.answer ? "正确" : picked === opt.id ? "未中" : "") : "";
      head.innerHTML = `<span>方案 ${opt.id}</span><span class="quiz-mark">${mark}</span>`;

      btn.appendChild(cv);
      btn.appendChild(head);
      grid.appendChild(btn);
    }

    if (!picked) {
      feedbackEl.className = "quiz-feedback";
      feedbackEl.textContent = "点击任意一张方案作答；拿不准时，点一旁的「反拓黑白验形」把留白翻成黑墨，优劣会立刻浮现。";
    } else {
      const chosen = q.options.find((o) => o.id === picked);
      const ok = picked === q.answer;
      feedbackEl.className = `quiz-feedback ${ok ? "is-correct" : "is-wrong"}`;
      feedbackEl.textContent = chosen.reason;
    }
  }

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-opt]");
    if (!btn) return;
    picked = btn.dataset.opt;
    render();
  });

  switchWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-q]");
    if (!btn) return;
    qIdx = Number(btn.dataset.q);
    picked = null;
    for (const b of switchWrap.querySelectorAll("button")) b.classList.toggle("is-active", b === btn);
    render();
  });

  invertBtn.addEventListener("click", () => {
    quizInv = !quizInv;
    invertBtn.setAttribute("aria-pressed", String(quizInv));
    invertBtn.textContent = quizInv ? "反拓黑白验形：开" : "反拓黑白验形：关";
    render();
  });

  render();
}

/* ==================== 07 原海报放大灯箱（支持拖拽、缩放、Esc 关） ==================== */
export function initLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-btn");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const zoomOut = document.getElementById("lb-out");
  const zoomIn = document.getElementById("lb-in");
  const zoomReset = document.getElementById("lb-reset");
  const closeBtn = document.getElementById("lb-close");
  const zoomLabel = document.getElementById("lb-zoom");
  if (!poster || !openBtn || !lb || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    closeBtn.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  zoomIn.addEventListener("click", () => { scale = clamp(scale + 0.35, 0.75, 3.5); applyTransform(); });
  zoomOut.addEventListener("click", () => { scale = clamp(scale - 0.35, 0.75, 3.5); applyTransform(); });
  zoomReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.2 : -0.2), 0.75, 3.5);
    applyTransform();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage && scale <= 1.05) { close(); return; }
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbStage.setPointerCapture(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const endDrag = () => { dragging = false; };
  lbStage.addEventListener("pointerup", endDrag);
  lbStage.addEventListener("pointercancel", endDrag);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

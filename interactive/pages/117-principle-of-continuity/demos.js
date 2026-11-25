// 117 连续性原则 · 01–07 节独立交互组件（demos.js）
// 相邻两节互不复用同一种控件套路：
// 01 点选原话驱动 SVG 交点切线放大镜
// 02 实体可拖遮挡幕布 + 切线错位（Kellman & Shipley 1991 可关联性）
// 03 深靛暗室 Canvas Gabor/短棒噪点场捞蛇（Field, Hayes & Hess 1993 关联场）
// 04 格式塔邻居拔河 3 组「协同 / 对抗」实验台
// 05 真实 UI/排版原型 + 隐形导轨显影开关
// 06 什么时候别用：三病例「误读修复台」
// 07 纯墨单变量四选一练一练（A/B/C/D）

import { loop, pixelRatio } from "../../lib/stage.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// =========================================================
// 01 节：三条原话与交点切线放大解剖
// =========================================================
export function initSec01Anatomy() {
  const cards = [...document.querySelectorAll("[data-p1-card]")];
  const toggleBtn = document.getElementById("s1-compare-btn");
  const svg = document.getElementById("s1-svg");
  const cap = document.getElementById("s1-caption");
  const angleReadout = document.getElementById("s1-angle");
  if (!cards.length || !svg) return;

  let active = "p1";
  let shallowMode = false;

  const TEXT = {
    p1: {
      normal: "交点放大：绿轨顺势下行（+28°），橘轨平滑上行（-20°），交角 48°。眼睛若要在交点从绿拐去橘，得猛折 132°——大脑绝不会走费力的急拐弯。",
      shallow: "切换成 14° 浅角贴行：交点附近两轨切线几乎平行，从绿轨跳去橘轨只偏转 14°，人眼极易在交点悄悄串轨。",
    },
    p2: {
      normal: "整段平滑曲线上，任意相邻两点的切线偏转角都在 8° 以内，曲率连续变化。即使不画连线，大脑也会把离散圆点脑补成一条丝带。",
      shallow: "当其中一颗点突然偏折 44° 形成硬折角，曲率连续性立刻中断，丝带在折点处被眼睛切开。",
    },
    p3: {
      normal: "海报原话「不会彼此拐弯或中断」有一个隐含前提：交角足够舒展（约 32° 以上）且各自不急折。符合前提时，两条路径互不抢道。",
      shallow: "看「有前提」的反例：把两条轨拧到仅剩 14° 夹角，或让一侧急弯，两条路径在交点处就会粘连串轨——连续性不是无条件自动成立的。",
    },
  };

  function render() {
    cards.forEach((c) => {
      const on = c.dataset.p1Card === active;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-pressed", String(on));
    });

    svg.dataset.mode = active;
    svg.dataset.shallow = shallowMode ? "1" : "0";

    // 根据 active 与 shallowMode 实时更新 SVG 几何（真实单真源）
    const gPath = svg.querySelector("#s1-path-g");
    const oPath = svg.querySelector("#s1-path-o");
    const gDots = svg.querySelector("#s1-dots-g");
    const oDots = svg.querySelector("#s1-dots-o");
    const arcEl = svg.querySelector("#s1-arc");
    const jumpHint = svg.querySelector("#s1-jump-hint");

    const isShallow = shallowMode && (active === "p1" || active === "p3");
    const isKink = shallowMode && active === "p2";

    // 绿轨点列
    const gPts = [];
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const x = 44 + t * 352;
      let y = 76 + 152 * (0.5 - 0.5 * Math.cos(Math.PI * t));
      if (isKink && i === 4) y -= 52;
      if (isKink && i === 3) y -= 22;
      gPts.push([x, y]);
    }
    // 橘轨点列
    const oPts = [];
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const x = 44 + t * 352;
      const y = isShallow
        ? 110 + 96 * t // 浅角贴近绿轨
        : 214 - 118 * t - 12 * Math.sin(Math.PI * t);
      oPts.push([x, y]);
    }

    const toD = (pts) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    gPath.setAttribute("d", toD(gPts));
    oPath.setAttribute("d", toD(oPts));

    gDots.innerHTML = gPts
      .map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === 4 && isKink ? 10 : 8.5}" class="${i === 4 && isKink ? "is-alert" : ""}"/>`)
      .join("");
    oDots.innerHTML = oPts
      .map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8.5"/>`)
      .join("");

    if (isShallow) {
      arcEl.setAttribute("d", "M 258 164 A 42 42 0 0 1 255 174");
      angleReadout.textContent = "交角 14° · 极易串轨";
      angleReadout.classList.add("is-warn");
      jumpHint.style.opacity = "1";
    } else if (isKink) {
      arcEl.setAttribute("d", "M 192 104 A 30 30 0 0 1 248 104");
      angleReadout.textContent = "折角 44° · 曲率中断";
      angleReadout.classList.add("is-warn");
      jumpHint.style.opacity = "0";
    } else {
      arcEl.setAttribute("d", "M 262 140 A 46 46 0 0 1 258 178");
      angleReadout.textContent = active === "p2" ? "步偏角 ≤ 8° · 曲率顺滑" : "交角 48° · 穿交不拐弯";
      angleReadout.classList.remove("is-warn");
      jumpHint.style.opacity = "0";
    }

    if (toggleBtn) {
      toggleBtn.setAttribute("aria-pressed", String(shallowMode));
      toggleBtn.textContent =
        active === "p2"
          ? (shallowMode ? "恢复平滑曲线" : "试看：中段掰出 44° 折角")
          : (shallowMode ? "恢复原海报 48° 穿交" : "试看反例：压到 14° 浅角串轨");
    }
    cap.textContent = shallowMode ? TEXT[active].shallow : TEXT[active].normal;
  }

  cards.forEach((c) => {
    c.addEventListener("click", () => {
      active = c.dataset.p1Card;
      render();
    });
  });

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      shallowMode = !shallowMode;
      render();
    });
  }

  render();
}

// =========================================================
// 02 节：遮挡补全拉帘实验（Kellman & Shipley 1991 可关联性）
// =========================================================
export function initSec02Occlusion() {
  const stage = document.getElementById("s2-stage");
  const curtain = document.getElementById("s2-curtain");
  const widthSlider = document.getElementById("s2-width");
  const offsetSlider = document.getElementById("s2-offset");
  const widthVal = document.getElementById("s2-width-val");
  const offsetVal = document.getElementById("s2-offset-val");
  const verdict = document.getElementById("s2-verdict");
  const rightSeg = document.getElementById("s2-right-seg");
  const ghostSeg = document.getElementById("s2-ghost-seg");
  const peekBtn = document.getElementById("s2-peek");
  if (!stage || !curtain || !widthSlider || !offsetSlider) return;

  let curtainW = 140;  // SVG viewBox 0..640 里的遮挡宽度
  let rightOffset = 0; // 右出口相对左延长线的垂直错位（px）
  let curtainX = 320;  // 遮挡块中心 X（可直接在图上横拖！）
  let peeking = false;

  function render() {
    const xLeft = clamp(curtainX - curtainW / 2, 140, 500 - curtainW);
    curtain.setAttribute("x", xLeft.toFixed(1));
    curtain.setAttribute("width", curtainW.toFixed(1));
    const handleLine = stage.querySelector("#s2-curtain-grip");
    if (handleLine) {
      handleLine.setAttribute("transform", `translate(${(xLeft + curtainW / 2).toFixed(1)}, 120)`);
    }
    curtain.style.opacity = peeking ? "0.22" : "1";

    // 右侧出口平滑移动（验证可关联性：0px 顺接，> 18px 错断）
    rightSeg.setAttribute("transform", `translate(0, ${rightOffset.toFixed(1)})`);
    // 虚线显示左端切线自然延展的预期出口
    ghostSeg.style.opacity = Math.abs(rightOffset) > 10 || peeking ? "0.85" : "0.28";

    widthVal.textContent = `${Math.round((curtainW / 640) * 100)}% 遮挡`;
    offsetVal.textContent = rightOffset === 0 ? "0px 对齐" : `${rightOffset > 0 ? "+" : ""}${rightOffset}px 错位`;

    const absOff = Math.abs(rightOffset);
    if (absOff <= 8) {
      verdict.className = "s2-verdict is-ok";
      verdict.innerHTML =
        `<strong>可关联性成立（顺接补全）：</strong>哪怕中间被不透明色块挡掉 ${Math.round((curtainW / 640) * 100)}%，两侧边界沿切线顺滑对齐，大脑依然毫不犹豫地把它们读作「穿在挡板背后的同一条连续绿带」。`;
    } else if (absOff <= 22) {
      verdict.className = "s2-verdict is-mid";
      verdict.innerHTML =
        `<strong>边界起疑（轻微错位 ${absOff}px）：</strong>右侧出口已经偏离左侧切线的自然落点，你的眼睛会觉得背后好像折了一下，开始犹豫这还是不是同一条带子。`;
    } else {
      verdict.className = "s2-verdict is-bad";
      verdict.innerHTML =
        `<strong>可关联性崩塌（错断 ${absOff}px）：</strong>两侧切线再也接不成一条单调平滑曲线（违背 Kellman &amp; Shipley 1991 可关联准则），眼睛立刻把它拆成「藏在挡板后面的两截无关短条」。`;
    }
  }

  widthSlider.addEventListener("input", () => {
    curtainW = Number(widthSlider.value);
    render();
  });
  offsetSlider.addEventListener("input", () => {
    rightOffset = Number(offsetSlider.value);
    render();
  });
  if (peekBtn) {
    peekBtn.addEventListener("click", () => {
      peeking = !peeking;
      peekBtn.setAttribute("aria-pressed", String(peeking));
      peekBtn.textContent = peeking ? "放回实心遮挡" : "半透明透视背后";
      render();
    });
  }

  // 支持直接横拖遮挡块
  let dragging = false;
  let startClientX = 0;
  let startCX = 320;
  stage.addEventListener("pointerdown", (e) => {
    const rect = stage.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * 640;
    if (Math.abs(sx - curtainX) <= curtainW * 0.65) {
      dragging = true;
      startClientX = e.clientX;
      startCX = curtainX;
      stage.setPointerCapture(e.pointerId);
    }
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const rect = stage.getBoundingClientRect();
    const dx = ((e.clientX - startClientX) / rect.width) * 640;
    curtainX = clamp(startCX + dx, 140 + curtainW / 2, 500 - curtainW / 2);
    render();
  });
  stage.addEventListener("pointerup", () => { dragging = false; });
  stage.addEventListener("pointercancel", () => { dragging = false; });

  render();
}

// =========================================================
// 03 节：深靛暗室 · Field, Hayes & Hess (1993) 关联场捞蛇
// =========================================================
export function initSec03AssociationField() {
  const canvas = document.getElementById("s3-canvas");
  const bendInput = document.getElementById("s3-bend");
  const tiltInput = document.getElementById("s3-tilt");
  const bendVal = document.getElementById("s3-bend-val");
  const tiltVal = document.getElementById("s3-tilt-val");
  const revealBtn = document.getElementById("s3-reveal");
  const reshuffleBtn = document.getElementById("s3-shuffle");
  const readout = document.getElementById("s3-readout");
  if (!canvas || !bendInput || !tiltInput) return;

  const ctx = canvas.getContext("2d");
  let bendDeg = 18;      // 路径相邻元素偏角（0°–65°）
  let tiltDeg = 0;       // 元素自身朝向相对路径切线的偏角（0° 共线 → 90° 梯子侧排）
  let reveal = false;
  let seed = 117;

  // 确定性伪随机生成器
  function mulberry32(a) {
    return () => {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  let noiseBars = [];
  let snakeBars = [];

  function generateField() {
    const rng = mulberry32(seed);
    const W = 960;
    const H = 340;
    const step = 52;
    const snakeCount = 15;

    // 1. 生成一条穿过画面中部的「蛇形路径」
    snakeBars = [];
    let x = 76;
    let y = 170 + (rng() - 0.5) * 56;
    let heading = (rng() - 0.5) * 0.42;
    const turnSignBase = rng() > 0.5 ? 1 : -1;

    for (let i = 0; i < snakeCount; i++) {
      const angRad = (bendDeg * Math.PI) / 180;
      if (i > 0) {
        let sign = i % 5 < 3 ? turnSignBase : -turnSignBase;
        if (y < 68) sign = 1;
        if (y > H - 68) sign = -1;
        heading += sign * angRad * (0.85 + rng() * 0.25);
        heading = clamp(heading, -1.05, 1.05);
        x += Math.cos(heading) * step;
        y += Math.sin(heading) * step;
        if (x > W - 48) break;
      }
      snakeBars.push({
        x,
        y: clamp(y, 40, H - 40),
        tangent: heading,
      });
    }

    // 修正首尾真实切向
    for (let i = 0; i < snakeBars.length; i++) {
      const a = snakeBars[Math.max(0, i - 1)];
      const b = snakeBars[Math.min(snakeBars.length - 1, i + 1)];
      snakeBars[i].tangent = Math.atan2(b.y - a.y, b.x - a.x);
    }

    // 2. 用网格抖动均匀铺满整块暗室随机朝向短棒（避开蛇形节点防叠穿）
    noiseBars = [];
    const cols = 20;
    const rows = 8;
    const cw = W / cols;
    const ch = H / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nx = (c + 0.2 + rng() * 0.6) * cw;
        const ny = (r + 0.2 + rng() * 0.6) * ch;
        const tooClose = snakeBars.some((s) => Math.hypot(s.x - nx, s.y - ny) < 30);
        if (tooClose) continue;
        noiseBars.push({
          x: nx,
          y: ny,
          angle: rng() * Math.PI,
        });
      }
    }
  }

  function drawBar(cx, cy, angle, isSnake) {
    const half = 13.5;
    const dx = Math.cos(angle) * half;
    const dy = Math.sin(angle) * half;

    // 仿 Gabor 斑：中心明亮主脊 + 两侧细微暗/亮伴瓣（在深靛底上既有科研仪器感又极其清晰）
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    if (reveal && isSnake) {
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 138, 61, 0.20)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 138, 61, 0.72)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // 侧翼细伴线
    ctx.lineCap = "round";
    ctx.strokeStyle = reveal && isSnake ? "rgba(75, 224, 136, 0.45)" : "rgba(170, 182, 232, 0.22)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-half * 0.72, -4.4);
    ctx.lineTo(half * 0.72, -4.4);
    ctx.moveTo(-half * 0.72, 4.4);
    ctx.lineTo(half * 0.72, 4.4);
    ctx.stroke();

    // 主轴脊线
    ctx.strokeStyle = reveal && isSnake ? "#FF8A3D" : "#F3EFE4";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-half, 0);
    ctx.lineTo(half, 0);
    ctx.stroke();

    ctx.restore();
    // 消除未使用变量警告
    void dx; void dy;
  }

  function updateText() {
    bendVal.textContent = `${bendDeg}°`;
    tiltVal.textContent = tiltDeg === 0 ? "0° 共线（蛇形）" : tiltDeg >= 75 ? `${tiltDeg}° 侧排（梯子）` : `${tiltDeg}° 偏斜`;

    if (tiltDeg <= 15 && bendDeg <= 32) {
      readout.innerHTML =
        `<strong>路径自动浮现（高可检出）：</strong>相邻短棒首尾顺着切线对齐（偏转 ${bendDeg}°），落进视皮层 V1 关联场的兴奋区内——即使它们和旁边 ${noiseBars.length} 枚噪点完全同色同粗，这条「蛇」也会立刻从杂乱背景中跳出来。`;
    } else if (tiltDeg > 45) {
      readout.innerHTML =
        `<strong>「梯子效应」致路径隐身（朝向错偏 ${tiltDeg}°）：</strong>短棒的位置一个都没动，仅仅把每根棒子转成侧向并排，关联场就失去了共线响应。Field、Hayes 与 Hess（1993）正是用这个对照证明：大脑连的是「切线方向」，不只是「点距」。`;
    } else if (bendDeg > 45) {
      readout.innerHTML =
        `<strong>弯折越界（相邻转角 ${bendDeg}°）：</strong>曲率变化逼近并超过关联场约 ±60° 的临界带，相邻两根短棒不再互相增强，整条蛇迅速溶回噪点海里。`;
    } else {
      readout.innerHTML =
        `<strong>临界模糊带（弯折 ${bendDeg}° · 朝向偏 ${tiltDeg}°）：</strong>仔细扫视还能隐约抓到几节残段，但已无法一眼认出完整路径。点「显影隐藏路径」核对你的眼睛有没有找对。`;
    }
  }

  function renderFrame() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.save();
    ctx.scale(dpr, dpr);

    // 深靛夜航暗室底
    ctx.fillStyle = "#111044";
    ctx.fillRect(0, 0, w, h);

    // 极微弱实验室刻度格
    ctx.strokeStyle = "rgba(180, 195, 255, 0.06)";
    ctx.lineWidth = 1;
    const grid = 40;
    for (let gx = grid; gx < w; gx += grid) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
    }
    for (let gy = grid; gy < h; gy += grid) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }

    // 等比居中映射到 960×340 逻辑场（铺满整块暗室且绝不拉伸变形）
    const scale = Math.min((w - 16) / 960, (h - 16) / 340);
    const ox = (w - 960 * scale) / 2;
    const oy = (h - 340 * scale) / 2;
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    if (reveal && snakeBars.length > 1) {
      ctx.beginPath();
      snakeBars.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.strokeStyle = "rgba(255, 138, 61, 0.52)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (const b of noiseBars) {
      drawBar(b.x, b.y, b.angle, false);
    }
    const tiltRad = (tiltDeg * Math.PI) / 180;
    for (const s of snakeBars) {
      drawBar(s.x, s.y, s.tangent + tiltRad, true);
    }

    ctx.restore();
  }

  generateField();
  updateText();

  const ctl = loop(canvas, () => {
    renderFrame();
  });

  bendInput.addEventListener("input", () => {
    bendDeg = Number(bendInput.value);
    generateField();
    updateText();
    ctl.draw();
  });
  tiltInput.addEventListener("input", () => {
    tiltDeg = Number(tiltInput.value);
    updateText();
    ctl.draw();
  });
  if (revealBtn) {
    revealBtn.addEventListener("click", () => {
      reveal = !reveal;
      revealBtn.setAttribute("aria-pressed", String(reveal));
      revealBtn.textContent = reveal ? "隐去路径提示" : "显影隐藏路径";
      ctl.draw();
    });
  }
  if (reshuffleBtn) {
    reshuffleBtn.addEventListener("click", () => {
      seed += 19;
      generateField();
      updateText();
      ctl.draw();
    });
  }

  window.addEventListener("resize", () => ctl.draw(), { passive: true });
}

// =========================================================
// 04 节：与格式塔邻居的拔河（3 组协同/对抗对比）
// =========================================================
export function initSec04Neighbors() {
  const tabs = [...document.querySelectorAll("[data-tug-pair]")];
  const modeBtns = [...document.querySelectorAll("[data-tug-mode]")];
  const svg = document.getElementById("s4-svg");
  const titleEl = document.getElementById("s4-title");
  const descEl = document.getElementById("s4-desc");
  if (!tabs.length || !svg) return;

  let pair = "similarity"; // similarity | proximity | region
  let mode = "conflict";   // align | conflict

  const COPY = {
    similarity: {
      align: [
        "连续性 + 相似性（115）协同：同色同向双保险",
        "两条交叉弧线各自保持独立颜色（松绿与朱橘）与平滑路径，方向线索与颜色线索指向同一个分组答案，辨识毫无阻力。",
      ],
      conflict: [
        "连续性 vs 相似性（115）拔河：换色后谁赢？",
        "把两条交叉线在交点后故意「互换颜色」（左上绿接右下橘）。此时颜色想拽着你在交点急拐弯，但平滑弧线仍强力把视线推向对角——谁赢取决于交角顺不顺、色差有多刺眼。",
      ],
    },
    proximity: {
      align: [
        "连续性 + 邻近性（116）协同：步距均匀自然串线",
        "沿弧线排布的圆点彼此间距一致，局部既靠得近又顺着切线走，大脑轻松合成一条流畅轨迹。",
      ],
      conflict: [
        "连续性 vs 邻近性（116）拔河：大缝撕碎流线",
        "明明所有点仍严格落在同一条平滑弧线上，可一旦中间拉开两道宽空隙，邻近性会占上风——你看到的不再是一条长弧，而是三小簇独立点群。",
      ],
    },
    region: {
      align: [
        "连续性 + 共同区域（120）协同：轨道被干净托底",
        "整条平滑步骤流放进同一块柔和底框里，边框和路径合力告诉读者这是一套完整流程。",
      ],
      conflict: [
        "连续性 vs 共同区域（120）拔河：硬边框一刀斩断",
        "给同一条平滑直线的中段硬塞进两张封闭方框。共同区域的封闭边界力量极强，哪怕里面的点依旧排成一条直线，视线也会被边框硬生生截成两格。",
      ],
    },
  };

  function render() {
    tabs.forEach((b) => {
      const on = b.dataset.tugPair === pair;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    modeBtns.forEach((b) => {
      const on = b.dataset.tugMode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    const [t, d] = COPY[pair][mode];
    titleEl.textContent = t;
    descEl.textContent = d;

    // 绘制对应拔河 SVG
    let html = "";
    if (pair === "similarity") {
      // 交叉双弧：align = 绿到底/橘到底；conflict = 交点后绿橘互换！
      for (let i = 0; i < 11; i++) {
        const u = i / 10;
        const x = 44 + u * 472;
        const y1 = 44 + 142 * (0.5 - 0.5 * Math.cos(Math.PI * u));
        const y2 = 186 - 142 * (0.5 - 0.5 * Math.cos(Math.PI * u));
        const c1 = mode === "conflict" && i > 5 ? "#F65A04" : "#006627";
        const c2 = mode === "conflict" && i > 5 ? "#006627" : "#F65A04";
        html += `<circle cx="${x.toFixed(1)}" cy="${y1.toFixed(1)}" r="9" fill="${c1}"/>`;
        if (i !== 5) {
          html += `<circle cx="${x.toFixed(1)}" cy="${y2.toFixed(1)}" r="9" fill="${c2}"/>`;
        }
      }
      if (mode === "conflict") {
        html += `<path d="M 254 88 Q 280 115 306 88" fill="none" stroke="#B8231E" stroke-width="2" stroke-dasharray="4 4"/>`;
        html += `<text x="280" y="34" text-anchor="middle" fill="#B8231E" font-size="12" font-weight="700">颜色想让你在交点急拐，弧线却拽着你直穿</text>`;
      } else {
        html += `<text x="280" y="34" text-anchor="middle" fill="#005721" font-size="12" font-weight="700">颜色与路径方向完全一致</text>`;
      }
    } else if (pair === "proximity") {
      const ts = mode === "align"
        ? [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
        : [0.02, 0.08, 0.14, 0.42, 0.48, 0.54, 0.82, 0.88, 0.94];
      html += `<path d="M 40 164 Q 280 42 520 164" fill="none" stroke="#D5CEC2" stroke-width="1.5" stroke-dasharray="5 5"/>`;
      ts.forEach((u) => {
        const x = 40 + u * 480;
        const y = 164 - 122 * 2 * u * (1 - u);
        html += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="#006627"/>`;
      });
      if (mode === "conflict") {
        html += `<text x="280" y="206" text-anchor="middle" fill="#B8231E" font-size="12" font-weight="700">虽在同一条平滑弧上，宽空隙让邻近性把它拆成了 3 簇</text>`;
      } else {
        html += `<text x="280" y="206" text-anchor="middle" fill="#005721" font-size="12" font-weight="700">步距均齐，连成一条完整拱弧</text>`;
      }
    } else {
      // 共同区域
      if (mode === "align") {
        html += `<rect x="30" y="64" width="500" height="92" rx="14" fill="#F1F6F2" stroke="#006627" stroke-width="1.6"/>`;
      } else {
        html += `<rect x="32" y="64" width="234" height="92" rx="12" fill="#FFFFFF" stroke="#13115F" stroke-width="2"/>`;
        html += `<rect x="294" y="64" width="234" height="92" rx="12" fill="#FDF1F4" stroke="#B8231E" stroke-width="2"/>`;
      }
      for (let i = 0; i < 8; i++) {
        const x = 68 + i * 60.5;
        html += `<circle cx="${x.toFixed(1)}" cy="110" r="10" fill="#111111"/>`;
      }
      html += `<text x="280" y="196" text-anchor="middle" fill="${mode === "conflict" ? "#B8231E" : "#005721"}" font-size="12" font-weight="700">${
        mode === "conflict" ? "八颗点严格共线，却被两道闭合框硬截成左右两组" : "单一共同区域托住整条直线流，内外方向统一"
      }</text>`;
    }

    svg.innerHTML = html;
  }

  tabs.forEach((b) => b.addEventListener("click", () => { pair = b.dataset.tugPair; render(); }));
  modeBtns.forEach((b) => b.addEventListener("click", () => { mode = b.dataset.tugMode; render(); }));
  render();
}

// =========================================================
// 05 节：界面与版面的隐形导轨（真实 UI 原型 + 导轨显影）
// =========================================================
export function initSec05RealUI() {
  const tabs = [...document.querySelectorAll("[data-ui-case]")];
  const railToggle = document.getElementById("s5-rail-toggle");
  const modeToggle = document.getElementById("s5-mode-toggle");
  const viewport = document.getElementById("s5-viewport");
  const noteEl = document.getElementById("s5-note");
  if (!tabs.length || !viewport) return;

  let activeCase = "carousel"; // carousel | form | chart
  let showRails = true;
  let brokenVariant = false;

  const NOTES = {
    carousel: {
      good: "最后一张卡片故意露出 28% 在右缘裁口处——人眼凭连续性立刻补全「右边还有下一张」，根本不用写硕大的「向右滑动」。",
      bad: "当三张卡刚好严丝合缝卡在容器边缘，连续路径在右框戛然而止，多数用户会以为只有这三张，压根不会横滑。",
    },
    form: {
      good: "标签、输入框左沿与步骤圆点严格踩在同一条隐形垂线上，视线像顺着铅垂线一路下滑，扫完 4 项毫不费力。",
      bad: "居中对称排布让每一行左起点参差不齐，眼睛每换一行都要重新搜索起点，平白多出锯齿状折返。",
    },
    chart: {
      good: "两条趋势折线以清晰角度穿交，并配均匀采样点与端点直标：读者无需反复回看图例，视线自然顺着各自走势直达终点。",
      bad: "两条折线在交点附近几乎贴着重叠，又缺少平滑节奏与端点直标，读到中段很容易把蓝线走势误接成橘线。",
    },
  };

  function render() {
    tabs.forEach((b) => {
      const on = b.dataset.uiCase === activeCase;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    viewport.dataset.case = activeCase;
    viewport.dataset.rails = showRails ? "1" : "0";
    viewport.dataset.broken = brokenVariant ? "1" : "0";

    if (railToggle) {
      railToggle.setAttribute("aria-pressed", String(showRails));
      railToggle.textContent = showRails ? "隐形导轨：显影" : "隐形导轨：关闭";
    }
    if (modeToggle) {
      modeToggle.setAttribute("aria-pressed", String(brokenVariant));
      modeToggle.textContent = brokenVariant ? "当前：断流反例（切回顺畅版）" : "当前：顺畅版（切去断流反例）";
    }
    noteEl.textContent = brokenVariant ? NOTES[activeCase].bad : NOTES[activeCase].good;
  }

  tabs.forEach((b) => b.addEventListener("click", () => { activeCase = b.dataset.uiCase; render(); }));
  if (railToggle) railToggle.addEventListener("click", () => { showRails = !showRails; render(); });
  if (modeToggle) modeToggle.addEventListener("click", () => { brokenVariant = !brokenVariant; render(); });
  render();
}

// =========================================================
// 06 节：什么时候别用连续性（三病例误读修复台）
// =========================================================
export function initSec06WhenNot() {
  const buttons = [...document.querySelectorAll("[data-fix-btn]")];
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest("[data-anti-card]");
      if (!card) return;
      const fixed = card.dataset.fixed === "1";
      const next = !fixed;
      card.dataset.fixed = next ? "1" : "0";
      btn.setAttribute("aria-pressed", String(next));
      btn.textContent = next ? btn.dataset.labelUndo : btn.dataset.labelFix;
      const status = card.querySelector("[data-anti-status]");
      if (status) {
        status.textContent = next ? status.dataset.after : status.dataset.before;
      }
    });
  });
}

// =========================================================
// 07 节：练一练 · 纯墨单变量四选一测验（A / B / C / D）
// =========================================================
export function initSec07Practice() {
  const choices = [...document.querySelectorAll("[data-quiz]")];
  const titleEl = document.getElementById("q-title");
  const bodyEl = document.getElementById("q-body");
  const resetBtn = document.getElementById("q-reset");
  const grid = document.getElementById("q-grid");
  if (!choices.length || !titleEl || !bodyEl) return;

  const FEEDBACK = {
    A: {
      ok: true,
      title: "选对了：A 最稳（约 52° 清晰穿交 · 无折角无缺口）",
      body: "四张图刻意去掉颜色差异、只剩纯墨点列，唯一变量就是交点处的几何延续方式。A 的两条平滑点列以 52° 舒展穿交，相邻步偏角都在 8° 以内且步距均齐——你的眼睛几乎不用思考，就能各自直穿到底。",
    },
    B: {
      ok: false,
      title: "差一点：B 栽在「14° 浅角贴行」",
      body: "看揭示出的切线：B 的两条路径在交点几乎平行贴在一起（夹角仅 14°）。去掉颜色后，从左上沿弧线进入交点时，跳到右上支路和继续走右下支路的偏角几乎一样小，视线当场串轨。正确选项是 A。",
    },
    C: {
      ok: false,
      title: "差一点：C 栽在「交点 48° 急拐折角」",
      body: "C 的主轨在交点处突然向上猛折 48°，违背了视觉系统偏爱最小偏转的本能。眼睛走到交点时会顺着惯性直接冲向对面更平直的交叉支路，把两条轨看反。正确选项是 A。",
    },
    D: {
      ok: false,
      title: "差一点：D 栽在「交点 3.2× 大缺口」",
      body: "虽然 D 的两条轨也是 52° 相交，但交点前后被掏出了 3.2 倍步距的空洞，超出了局部关联场的自然桥接距离。结果不是两条贯通的线，而是四截互相观望的断臂。正确选项是 A。",
    },
  };

  function pick(ans) {
    grid.classList.add("is-revealed");
    choices.forEach((btn) => {
      const k = btn.dataset.quiz;
      btn.setAttribute("aria-pressed", String(k === ans));
      btn.classList.toggle("is-picked", k === ans);
      btn.classList.toggle("is-right", k === "A");
      btn.classList.toggle("is-wrong", k === ans && k !== "A");
    });
    const fb = FEEDBACK[ans];
    titleEl.textContent = fb.title;
    titleEl.className = `q-verdict-title ${fb.ok ? "is-ok" : "is-warn"}`;
    bodyEl.textContent = fb.body;
    if (resetBtn) resetBtn.hidden = false;
  }

  choices.forEach((btn) => {
    btn.addEventListener("click", () => pick(btn.dataset.quiz));
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      grid.classList.remove("is-revealed");
      choices.forEach((btn) => {
        btn.setAttribute("aria-pressed", "false");
        btn.classList.remove("is-picked", "is-right", "is-wrong");
      });
      titleEl.textContent = "先去掉颜色依赖，凭眼力选一张。";
      titleEl.className = "q-verdict-title";
      bodyEl.textContent = "四张图点径、点数和起终点完全相同，仅交点处的几何延续不同。选完后四张图会同步浮现切线与视线探针走向。";
      resetBtn.hidden = true;
    });
  }
}

// =========================================================
// 08 节：原海报点击放大、拖拽平移、Esc 收起
// =========================================================
export function initPosterLightbox() {
  const openBtn = document.getElementById("poster-btn");
  const imgSrc = document.getElementById("poster");
  if (!openBtn || !imgSrc) return;

  let dlg = null;
  let tx = 0, ty = 0, scale = 1;
  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;

  function ensureDialog() {
    if (dlg) return dlg;
    dlg = document.createElement("div");
    dlg.className = "lightbox";
    dlg.setAttribute("role", "dialog");
    dlg.setAttribute("aria-modal", "true");
    dlg.setAttribute("aria-label", "连续性原则原海报放大预览");
    dlg.hidden = true;
    dlg.innerHTML = `
      <div class="lb-bar">
        <span class="lb-hint">拖动平移 · 点按缩放 · Esc 收起</span>
        <div class="lb-actions">
          <button type="button" class="lb-btn" id="lb-zoom">放大 1.6×</button>
          <button type="button" class="lb-btn" id="lb-close">收起 Esc</button>
        </div>
      </div>
      <div class="lb-stage" id="lb-stage">
        <img id="lb-img" src="${imgSrc.src}" draggable="false" alt="连续性原则原海报完整大图">
      </div>
    `;
    document.body.appendChild(dlg);

    const lbImg = dlg.querySelector("#lb-img");
    const zoomBtn = dlg.querySelector("#lb-zoom");
    const closeBtn = dlg.querySelector("#lb-close");
    const stage = dlg.querySelector("#lb-stage");

    const apply = () => {
      lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      zoomBtn.textContent = scale > 1.1 ? "还原 1×" : "放大 1.6×";
    };

    zoomBtn.addEventListener("click", () => {
      scale = scale > 1.1 ? 1 : 1.6;
      if (scale === 1) { tx = 0; ty = 0; }
      apply();
    });
    closeBtn.addEventListener("click", close);
    stage.addEventListener("click", (e) => {
      if (e.target === stage) close();
    });

    lbImg.addEventListener("pointerdown", (e) => {
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = tx; oy = ty;
      lbImg.setPointerCapture(e.pointerId);
    });
    lbImg.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      tx = ox + (e.clientX - sx);
      ty = oy + (e.clientY - sy);
      apply();
    });
    lbImg.addEventListener("pointerup", () => { dragging = false; });
    lbImg.addEventListener("pointercancel", () => { dragging = false; });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !dlg.hidden) close();
    });

    dlg._reset = () => { tx = 0; ty = 0; scale = 1; apply(); };
    return dlg;
  }

  function open() {
    const d = ensureDialog();
    d._reset();
    d.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    d.querySelector("#lb-close").focus();
  }

  function close() {
    if (!dlg || dlg.hidden) return;
    dlg.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
}

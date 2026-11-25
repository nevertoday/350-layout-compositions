// 121 共同命运原则 · 正文 01–07 节专属交互模块
// 每节独立控件，绝不复用同一种交互做同一件事；全部画布走 lib/stage.js 的 loop()，离开视口即停。
import { loop, pixelRatio } from "../../lib/stage.js";

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const dpr = pixelRatio(rect.width < 640 ? 1.5 : 2);
  const nw = Math.round(rect.width * dpr);
  const nh = Math.round(rect.height * dpr);
  if (canvas.width !== nw || canvas.height !== nh) {
    canvas.width = nw;
    canvas.height = nh;
  }
  return { ctx: canvas.getContext("2d"), w: rect.width, h: rect.height, dpr };
}

// =========================================================================
// 01 节：随机点阵破伪装显形器（静止伪装 / 同向平移 / 无序乱抖 / 广义同步变亮）
// =========================================================================
export function initSec01Camouflage() {
  const canvas = document.getElementById("sec01-canvas");
  const readout = document.getElementById("sec01-readout");
  const buttons = [...document.querySelectorAll("[data-camo-mode]")];
  if (!canvas || !buttons.length) return;

  let mode = "still";
  let animT = 0;

  // 确定性伪随机生成 170 颗背景散点 + 34 颗组成「向右大箭头」的隐藏编队点（外观完全一致）
  function lcg(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  const rand = lcg(12101);
  const dots = [];
  // 隐藏向右大箭头轮廓判断（归一化坐标 0..1）
  function insideArrow(u, v) {
    // 箭杆：u ∈ [0.24, 0.56], v ∈ [0.39, 0.61]
    if (u >= 0.24 && u <= 0.56 && v >= 0.39 && v <= 0.61) return true;
    // 箭头三角：u ∈ [0.54, 0.78], |v - 0.5| <= (0.78 - u) * 1.15
    if (u >= 0.54 && u <= 0.78 && Math.abs(v - 0.5) <= (0.78 - u) * 1.18) return true;
    return false;
  }
  for (let i = 0; i < 210; i++) {
    const u = 0.06 + rand() * 0.88;
    const v = 0.09 + rand() * 0.82;
    dots.push({
      u,
      v,
      inShape: insideArrow(u, v),
      r: 3.4 + rand() * 2.2,
      ang: rand() * Math.PI * 2,
      spd: 0.7 + rand() * 0.9,
      baseLum: 22 + Math.floor(rand() * 28), // 外观都近似墨灰
    });
  }

  const MODE_COPY = {
    still: "静止伪装：所有点大小与墨色完全一致，藏在中间的「向右箭头」彻底隐身，眼睛只能看到一片均匀噪点。",
    translate: "同向平移（共同命运）：只要箭头内的 40 余颗点同步向右缓移，它们无需变色、无需描边，瞬间凝成一个清晰的整体箭头。",
    jitter: "无序乱抖（无共同方向）：虽然这些点都在动，但各自朝随机方向颤动，没有共同速度矢量，箭头依然散成雾团。",
    luminance: "同步变亮（广义共同命运 · Sekuler & Bennett 2001）：所有点原地不动，仅让箭头内的点沿同一方向同步由暗变亮再变暗，照样把轮廓浮出来。",
  };

  function render(t, dt, { still }) {
    const f = fitCanvas(canvas);
    if (!f) return;
    const { ctx, w, h, dpr } = f;
    if (!still && dt > 0) animT += dt;
    const phase = still ? 0.68 : animT;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#FAF6F1";
    ctx.fillRect(0, 0, w, h);

    // 淡框刻度
    ctx.strokeStyle = "#E5DDD0";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    const drift = mode === "translate" ? Math.sin(phase * 1.7) * 0.065 : 0;
    const lumWave = mode === "luminance" ? (Math.sin(phase * 2.4) * 0.5 + 0.5) : 0;

    for (const d of dots) {
      let x = d.u * w;
      let y = d.v * h;
      let fill = `rgb(${d.baseLum}, ${d.baseLum + 4}, ${d.baseLum + 8})`;

      if (d.inShape) {
        if (mode === "translate") {
          x += drift * w;
          // 静态 reduced-motion 下给极细尾影，让静态帧也看得见平移方向
          if (still) {
            ctx.fillStyle = "rgba(229, 82, 7, 0.28)";
            ctx.beginPath();
            ctx.arc(x - 10, y, d.r * 0.9, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (mode === "jitter") {
          const jAmp = 7;
          x += Math.cos(d.ang + phase * 6 * d.spd) * jAmp;
          y += Math.sin(d.ang * 1.4 + phase * 5.2 * d.spd) * jAmp;
        } else if (mode === "luminance") {
          // 同步向亮橘高明度过渡，展示广义共同命运（亮度同向变化）
          const rCol = Math.round(d.baseLum + (229 - d.baseLum) * lumWave);
          const gCol = Math.round(d.baseLum + (108 - d.baseLum) * lumWave);
          const bCol = Math.round(d.baseLum + (42 - d.baseLum) * lumWave);
          fill = `rgb(${rCol}, ${gCol}, ${bCol})`;
        }
      }

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(x, y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 角落小签
    const badge = mode === "still"
      ? "静止：形状完全隐藏"
      : mode === "translate"
        ? "同向平移：箭头瞬间浮现"
        : mode === "jitter"
          ? "随机乱抖：无法成组"
          : "同步亮度变化：原地浮现";
    ctx.font = `600 11px "Noto Sans SC", sans-serif`;
    const bw = ctx.measureText(badge).width + 18;
    ctx.fillStyle = mode === "translate" || mode === "luminance" ? "#0E553B" : "#07045E";
    ctx.fillRect(12, 12, bw, 24);
    ctx.fillStyle = "#FFFDF9";
    ctx.textBaseline = "middle";
    ctx.fillText(badge, 21, 24.5);

    ctx.restore();
  }

  const ctl = loop(canvas, render);

  function selectMode(m) {
    mode = m;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.camoMode === m)));
    if (readout) readout.textContent = MODE_COPY[m] || "";
    ctl.draw();
  }

  buttons.forEach((b) => {
    b.addEventListener("click", () => selectMode(b.dataset.camoMode));
  });
  selectMode("still");
}

// =========================================================================
// 02 节：四轨道缓动与错峰发射台（真实 DOM 滑块并行对比）
// =========================================================================
export function initSec02Timing() {
  const stage = document.getElementById("sec02-tracks");
  const readout = document.getElementById("sec02-readout");
  const verdict = document.getElementById("sec02-verdict");
  const buttons = [...document.querySelectorAll("[data-timing-mode]")];
  const replayBtn = document.getElementById("sec02-replay");
  if (!stage || !buttons.length) return;

  const MODES = {
    sync: {
      verdict: "强整体 · 0ms 齐步同速",
      ok: true,
      note: "三枚元素同时出发、速度曲线完全一致、同时落停。大脑把它们合成一块刚性编队，哪怕彼此上下相隔较远。",
      lanes: [
        { delay: 0, dur: 920, ease: "cubic-bezier(0.25, 0.85, 0.35, 1)", tag: "0ms · 920ms" },
        { delay: 0, dur: 920, ease: "cubic-bezier(0.25, 0.85, 0.35, 1)", tag: "0ms · 920ms" },
        { delay: 0, dur: 920, ease: "cubic-bezier(0.25, 0.85, 0.35, 1)", tag: "0ms · 920ms" },
      ],
    },
    ripple: {
      verdict: "有秩序的队列 · 35ms 轻错峰",
      ok: true,
      note: "30–50ms 的极短错峰（经验值）能在保留「同组归属」的同时多交代一点先后顺序，常用于列表整体展开；但再拉长就会开始解体。",
      lanes: [
        { delay: 0, dur: 900, ease: "cubic-bezier(0.25, 0.85, 0.35, 1)", tag: "0ms · 900ms" },
        { delay: 35, dur: 900, ease: "cubic-bezier(0.25, 0.85, 0.35, 1)", tag: "+35ms · 900ms" },
        { delay: 70, dur: 900, ease: "cubic-bezier(0.25, 0.85, 0.35, 1)", tag: "+70ms · 900ms" },
      ],
    },
    stagger: {
      verdict: "裂成多米诺 · 260ms 严重错拍",
      ok: false,
      note: "方向完全相同，但间隔 260ms 依次起跑：第一颗已过中段，第三颗还没动。视觉把它们拆成三次先后发生的独立事件。",
      lanes: [
        { delay: 0, dur: 820, ease: "cubic-bezier(0.25, 0.85, 0.35, 1)", tag: "0ms · 先发" },
        { delay: 260, dur: 820, ease: "cubic-bezier(0.25, 0.85, 0.35, 1)", tag: "+260ms · 迟到" },
        { delay: 520, dur: 820, ease: "cubic-bezier(0.25, 0.85, 0.35, 1)", tag: "+520ms · 掉队" },
      ],
    },
    speed: {
      verdict: "途中撕裂 · 快慢相差 2.6×",
      ok: false,
      note: "虽然三颗同在 0ms 齐发起步，但速度相差 2.6 倍且缓动各异——不到半秒领头者就把队友甩开，共同命运当场瓦解。",
      lanes: [
        { delay: 0, dur: 520, ease: "cubic-bezier(0.12, 0.9, 0.25, 1)", tag: "520ms · 疾冲" },
        { delay: 0, dur: 940, ease: "linear", tag: "940ms · 匀速" },
        { delay: 0, dur: 1360, ease: "cubic-bezier(0.7, 0.05, 0.85, 0.6)", tag: "1360ms · 拖后" },
      ],
    },
  };

  let curMode = "sync";
  let runRight = true;
  const pucks = [...stage.querySelectorAll(".sec02-puck")];
  const tags = [...stage.querySelectorAll(".sec02-lane-tag")];

  function fire(modeKey, toggleDir = false) {
    curMode = modeKey;
    const cfg = MODES[modeKey];
    if (toggleDir) runRight = !runRight;
    else runRight = true;

    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.timingMode === modeKey)));
    if (verdict) {
      verdict.textContent = cfg.verdict;
      verdict.dataset.state = cfg.ok ? "ok" : "err";
    }
    if (readout) readout.textContent = cfg.note;

    // 先瞬间复位到起点，再下一帧按各轨道真实延迟与时长发射
    pucks.forEach((puck, idx) => {
      const lane = cfg.lanes[idx];
      if (tags[idx]) tags[idx].textContent = lane.tag;
      puck.style.transition = "none";
      puck.dataset.pos = runRight ? "start" : "end";
    });
    // 强制重排以确保 transition 生效
    void stage.offsetWidth;
    requestAnimationFrame(() => {
      pucks.forEach((puck, idx) => {
        const lane = cfg.lanes[idx];
        puck.style.transition = `left ${lane.dur}ms ${lane.ease} ${lane.delay}ms`;
        puck.dataset.pos = runRight ? "end" : "start";
      });
    });
  }

  buttons.forEach((b) => b.addEventListener("click", () => fire(b.dataset.timingMode, false)));
  if (replayBtn) replayBtn.addEventListener("click", () => fire(curMode, true));
  fire("sync", false);
}

// =========================================================================
// 03 节：Wertheimer 1923 逆结构平移与格式塔拔河（深墨松绿暗室 Canvas）
// =========================================================================
export function initSec03Tug() {
  const canvas = document.getElementById("sec03-canvas");
  const readout = document.getElementById("sec03-readout");
  const cueBtns = [...document.querySelectorAll("[data-tug-cue]")];
  const moveToggle = document.getElementById("sec03-move-toggle");
  if (!canvas || !moveToggle) return;

  let staticCue = "color"; // "proximity" | "color" | "region"
  let contraActive = false;
  let shiftProg = 0; // 0..1 平滑推演逆结构斜移

  // 3 组 × 4 枚 = 12 枚点。逆结构平移故意挑出跨三组的 4 枚（每组挑 1–2 枚异色/异框点）同步右上斜移！
  const CONTRA_SET = new Set([1, 4, 7, 10]);

  const CUE_DESC = {
    proximity: {
      still: "静止时，12 枚圆点按间距紧紧抱成「左、中、右三簇」，邻近性主导视觉分组。",
      moving: "逆结构平移启动！分别来自左、中、右三簇的 4 枚点同步向右上滑出——距离再远，眼睛立刻把这 4 枚跨簇点重编为同一组！",
    },
    color: {
      still: "静止时，朱橘、柔樱粉、暖砂三种颜色把画面干净分成三行，相似性主导视觉分组。",
      moving: "逆结构平移启动！哪怕这 4 枚点颜色各不相同，同步一致的斜向位移立刻压倒了颜色相似，强行把异色点焊成一队！",
    },
    region: {
      still: "静止时，三道圆角围栏框各自圈住 4 枚点，共同区域清晰划定了三个阵营。",
      moving: "逆结构平移启动！4 枚点同步跨框沿同一矢量滑移，动态共同命运直接冲破静态围栏边界，重组前景编队。",
    },
  };

  function updateCopy() {
    if (readout) readout.textContent = CUE_DESC[staticCue][contraActive ? "moving" : "still"];
    moveToggle.setAttribute("aria-pressed", String(contraActive));
    moveToggle.textContent = contraActive ? "停下归位（还原静态分组）" : "发动逆结构同向斜移";
  }

  function render(t, dt, { still }) {
    const f = fitCanvas(canvas);
    if (!f) return;
    const { ctx, w, h, dpr } = f;

    if (still) {
      shiftProg = contraActive ? 1 : 0;
    } else if (dt > 0) {
      const target = contraActive ? 1 : 0;
      shiftProg += (target - shiftProg) * Math.min(1, dt * 5.2);
      if (Math.abs(target - shiftProg) < 0.002) shiftProg = target;
    }
    const osc = contraActive && !still ? Math.sin(t * 2.2) * 0.14 : 0;
    const effShift = Math.max(0, Math.min(1.15, shiftProg + (contraActive ? osc : 0)));

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#103F2E";
    ctx.fillRect(0, 0, w, h);

    // 淡网格底
    ctx.strokeStyle = "rgba(195, 232, 214, 0.10)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    const groupColors = ["#FF8547", "#F598C0", "#E4D7C3"];
    const rad = Math.max(10, Math.min(18, Math.min(w, h) * 0.055));

    // 计算 12 点基础位置
    const pts = [];
    for (let g = 0; g < 3; g++) {
      for (let k = 0; k < 4; k++) {
        const idx = g * 4 + k;
        let bx, by;
        if (staticCue === "proximity") {
          // 三簇紧凑方阵
          const cx = w * (0.21 + g * 0.29);
          const cy = h * 0.56;
          bx = cx + ((k % 2) - 0.5) * rad * 3.1;
          by = cy + (Math.floor(k / 2) - 0.5) * rad * 3.1;
        } else {
          // 三横排，每排 4 颗
          bx = w * (0.18 + k * 0.21);
          by = h * (0.31 + g * 0.24);
        }
        pts.push({
          idx,
          group: g,
          bx,
          by,
          color: staticCue === "color" ? groupColors[g] : (staticCue === "region" ? "#E8EFEA" : "#DDF2E7"),
          inContra: CONTRA_SET.has(idx),
        });
      }
    }

    // 共同区域模式：绘三道静态圆角围栏
    if (staticCue === "region") {
      for (let g = 0; g < 3; g++) {
        const y0 = h * (0.31 + g * 0.24) - rad * 1.65;
        ctx.save();
        ctx.fillStyle = "rgba(255, 253, 249, 0.07)";
        ctx.strokeStyle = "rgba(123, 227, 181, 0.45)";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.roundRect(w * 0.10, y0, w * 0.80, rad * 3.3, 14);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    const dxMove = w * 0.085 * effShift;
    const dyMove = -h * 0.145 * effShift;

    // 绘每个点；参与逆结构斜移的 4 枚点绘虚线位移轨与共同方向箭
    for (const p of pts) {
      const px = p.bx + (p.inContra ? dxMove : 0);
      const py = p.by + (p.inContra ? dyMove : 0);

      if (p.inContra && effShift > 0.03) {
        ctx.save();
        ctx.strokeStyle = "#FF8547";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(p.bx, p.by);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.setLineDash([]);
        // 原位虚环
        ctx.strokeStyle = "rgba(255, 133, 71, 0.45)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.bx, p.by, rad * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
      if (p.inContra && effShift > 0.12) {
        ctx.strokeStyle = "#FFFDF9";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 顶部角签
    const tag = contraActive ? "逆结构平移中：4 枚跨组点立刻结成新整体" : "静态对照：由传统静态线索分组";
    ctx.font = `600 11px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(tag).width + 18;
    ctx.fillStyle = contraActive ? "#E55207" : "#07271C";
    ctx.fillRect(12, 10, tw, 24);
    ctx.fillStyle = "#FFFDF9";
    ctx.textBaseline = "middle";
    ctx.fillText(tag, 21, 22.5);

    ctx.restore();
  }

  const ctl = loop(canvas, render);

  cueBtns.forEach((b) => {
    b.addEventListener("click", () => {
      staticCue = b.dataset.tugCue;
      cueBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      updateCopy();
      ctl.draw();
    });
  });

  moveToggle.addEventListener("click", () => {
    contraActive = !contraActive;
    updateCopy();
    ctl.draw();
  });

  updateCopy();
}

// =========================================================================
// 04 节：真实可用三 Tab 微界面（批量勾选归档 / 手风琴同步推开 / 静态动势暗示）
// =========================================================================
export function initSec04UiDemo() {
  const tabs = [...document.querySelectorAll("[data-ui-tab]")];
  const panels = [...document.querySelectorAll("[data-ui-panel]")];
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.uiTab;
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      panels.forEach((p) => { p.hidden = p.dataset.uiPanel !== target; });
    });
  });

  // Tab A：真实批量勾选归档
  const archiveBtn = document.getElementById("sec04-archive");
  const resetListBtn = document.getElementById("sec04-reset");
  const listStatus = document.getElementById("sec04-list-status");
  const rows = [...document.querySelectorAll(".sec04-task-row")];

  function updateListCount() {
    const checked = rows.filter((r) => !r.classList.contains("is-archived") && r.querySelector("input")?.checked);
    if (archiveBtn) archiveBtn.disabled = checked.length === 0;
    if (listStatus) {
      listStatus.textContent = checked.length
        ? `已勾选 ${checked.length} 项：点「同步归档」看它们如何作为一个整体向右滑出，未勾选项稳稳原地锚定。`
        : "勾选至少 2 条不相邻的任务，再点「同步归档」感受跨距同步成组。";
    }
  }
  rows.forEach((r) => {
    const cb = r.querySelector("input");
    if (cb) cb.addEventListener("change", updateListCount);
  });
  if (archiveBtn) {
    archiveBtn.addEventListener("click", () => {
      const picked = rows.filter((r) => !r.classList.contains("is-archived") && r.querySelector("input")?.checked);
      if (!picked.length) return;
      picked.forEach((r) => r.classList.add("is-archived"));
      if (listStatus) {
        listStatus.textContent = `已把 ${picked.length} 项作为一个整体同步右滑归档，其余未选条目全程静止，用户绝不会看错删掉了哪几条。`;
      }
      archiveBtn.disabled = true;
    });
  }
  if (resetListBtn) {
    resetListBtn.addEventListener("click", () => {
      rows.forEach((r, idx) => {
        r.classList.remove("is-archived");
        const cb = r.querySelector("input");
        if (cb) cb.checked = idx === 0 || idx === 3 || idx === 5;
      });
      updateListCount();
    });
  }
  updateListCount();

  // Tab B：真实手风琴同步推开
  const accBtns = [...document.querySelectorAll(".sec04-acc-trigger")];
  const accModeBtn = document.getElementById("sec04-acc-mode");
  const accWrap = document.getElementById("sec04-acc-wrap");
  let smoothPush = true;
  accBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      const body = btn.nextElementSibling;
      if (body) body.classList.toggle("is-open", !expanded);
    });
  });
  if (accModeBtn && accWrap) {
    accModeBtn.addEventListener("click", () => {
      smoothPush = !smoothPush;
      accWrap.classList.toggle("is-snap", !smoothPush);
      accModeBtn.textContent = smoothPush ? "当前：下方条目同步平滑下推（点切瞬跳）" : "当前：无过渡生硬瞬跳（点切同步下推）";
    });
  }

  // Tab C：静态海报动势暗示切换
  const staticBtns = [...document.querySelectorAll("[data-static-cue]")];
  const staticSvg = document.getElementById("sec04-static-svg");
  const staticNote = document.getElementById("sec04-static-note");
  const STATIC_COPY = {
    none: "无动势线索：纸面完全静止时，3 颗橘点只靠颜色相近隐约有关，看不出「正朝同一目的地前进」的动势。",
    arrows: "统一斜向箭头：给 3 颗橘点加上一致的右上 30° 箭头，方向性瞬间建立了共同意图，但缺少来路轨迹。",
    trails: "平行弧轨 + 三连残影（121 原海报做法）：加入三条平行虚线弧轨和渐隐残影，静止的印刷画面立刻生出强烈的时间同步与编队整体感。",
  };
  staticBtns.forEach((b) => {
    b.addEventListener("click", () => {
      const cue = b.dataset.staticCue;
      staticBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      if (staticSvg) staticSvg.dataset.cue = cue;
      if (staticNote) staticNote.textContent = STATIC_COPY[cue] || "";
    });
  });
}

// =========================================================================
// 05 节：1973 Johansson 光点生物运动（纯 11 颗圆点，零五官！）
// =========================================================================
export function initSec05BioMotion() {
  const canvas = document.getElementById("sec05-bio-canvas");
  const toggleBtn = document.getElementById("sec05-bio-toggle");
  const boneBtn = document.getElementById("sec05-bio-bones");
  const statusEl = document.getElementById("sec05-bio-status");
  if (!canvas || !toggleBtn) return;

  let walking = false;
  let showBones = false;
  let walkPhase = 0.35; // 静止初始冻结在一个单看最像随机散点的相位

  // 11 颗关节光点（侧视步态运动学，绝不画五官，纯圆点）
  function computeJoints(phi, cx, cy, scale) {
    const bob = Math.abs(Math.sin(phi)) * 0.035;
    const head = { x: cx + 0.01 * scale, y: cy - (0.37 - bob) * scale };
    const shoulder = { x: cx, y: cy - (0.24 - bob) * scale };
    const hip = { x: cx - 0.01 * scale, y: cy + (0.04 + bob * 0.6) * scale };

    // 前后摆臂
    const armL = Math.sin(phi) * 0.42;
    const armR = Math.sin(phi + Math.PI) * 0.42;
    const elbowL = { x: shoulder.x + Math.sin(armL) * 0.16 * scale, y: shoulder.y + Math.cos(armL) * 0.16 * scale };
    const wristL = { x: elbowL.x + Math.sin(armL + 0.38) * 0.15 * scale, y: elbowL.y + Math.cos(armL + 0.38) * 0.15 * scale };
    const elbowR = { x: shoulder.x + Math.sin(armR) * 0.16 * scale, y: shoulder.y + Math.cos(armR) * 0.16 * scale };
    const wristR = { x: elbowR.x + Math.sin(armR + 0.38) * 0.15 * scale, y: elbowR.y + Math.cos(armR + 0.38) * 0.15 * scale };

    // 双腿迈步
    const thighL = Math.sin(phi + Math.PI) * 0.44;
    const kneeBendL = Math.max(0, Math.sin(phi + Math.PI + 0.8)) * 0.65;
    const kneeL = { x: hip.x + Math.sin(thighL) * 0.21 * scale, y: hip.y + Math.cos(thighL) * 0.21 * scale };
    const ankleL = { x: kneeL.x + Math.sin(thighL - kneeBendL) * 0.21 * scale, y: kneeL.y + Math.cos(thighL - kneeBendL) * 0.21 * scale };

    const thighR = Math.sin(phi) * 0.44;
    const kneeBendR = Math.max(0, Math.sin(phi + 0.8)) * 0.65;
    const kneeR = { x: hip.x + Math.sin(thighR) * 0.21 * scale, y: hip.y + Math.cos(thighR) * 0.21 * scale };
    const ankleR = { x: kneeR.x + Math.sin(thighR - kneeBendR) * 0.21 * scale, y: kneeR.y + Math.cos(thighR - kneeBendR) * 0.21 * scale };

    return {
      list: [head, shoulder, hip, elbowL, wristL, elbowR, wristR, kneeL, ankleL, kneeR, ankleR],
      bones: [
        [head, shoulder], [shoulder, hip],
        [shoulder, elbowL], [elbowL, wristL],
        [shoulder, elbowR], [elbowR, wristR],
        [hip, kneeL], [kneeL, ankleL],
        [hip, kneeR], [kneeR, ankleR],
      ],
    };
  }

  function render(t, dt, { still }) {
    const f = fitCanvas(canvas);
    if (!f) return;
    const { ctx, w, h, dpr } = f;
    if (walking && !still && dt > 0) {
      walkPhase += dt * 4.4;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#0E1110";
    ctx.fillRect(0, 0, w, h);

    // 地面参考微线（行走时向左滚动，强化人向右迈步的相对运动）
    const groundY = h * 0.87;
    ctx.strokeStyle = "rgba(250, 246, 241, 0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, groundY);
    ctx.lineTo(w - 16, groundY);
    ctx.stroke();

    const offsetTick = walking ? ((walkPhase * 18) % 28) : 0;
    for (let x = w - 20 - offsetTick; x > 18; x -= 28) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, groundY + 5);
      ctx.stroke();
    }

    const scale = Math.min(w * 0.72, h * 0.78);
    const { list, bones } = computeJoints(walkPhase, w * 0.5, h * 0.49, scale);

    if (showBones) {
      ctx.strokeStyle = "rgba(229, 82, 7, 0.55)";
      ctx.lineWidth = 1.6;
      for (const [a, b] of bones) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // 静态 reduced-motion 且开启行走时，画淡橙弧形轨迹提示摆动方向
    if (walking && still) {
      const prev = computeJoints(walkPhase - 0.55, w * 0.5, h * 0.49, scale).list;
      ctx.strokeStyle = "rgba(255, 133, 71, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      list.forEach((pt, idx) => {
        ctx.beginPath();
        ctx.moveTo(prev[idx].x, prev[idx].y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    for (const pt of list) {
      ctx.fillStyle = "#FAF6F1";
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  const ctl = loop(canvas, render);

  function syncUi() {
    toggleBtn.setAttribute("aria-pressed", String(walking));
    toggleBtn.textContent = walking ? "停成 11 颗静止散点" : "启动行走（1973 光点实验）";
    if (boneBtn) {
      boneBtn.setAttribute("aria-pressed", String(showBones));
      boneBtn.textContent = showBones ? "隐藏参考连线" : "显示关节连线核对";
    }
    if (statusEl) {
      statusEl.textContent = walking
        ? "正在迈步：11 颗纯白圆点共享共同前进节奏与关节约束，大脑在不到半秒内拼出侧影行人。"
        : "静止帧：只看这 11 颗白点几乎难以辨认含义；按下「启动行走」，共同运动矢量会立刻把它变成活人。";
    }
    ctl.draw();
  }

  toggleBtn.addEventListener("click", () => { walking = !walking; syncUi(); });
  if (boneBtn) boneBtn.addEventListener("click", () => { showBones = !showBones; syncUi(); });
  syncUi();
}

// =========================================================================
// 06 节：前庭安全降级对照台（大幅横移 vs 同步淡入高亮）
// =========================================================================
export function initSec06ReducedCompare() {
  const btns = [...document.querySelectorAll("[data-a11y-mode]")];
  const stage = document.getElementById("sec06-a11y-stage");
  const note = document.getElementById("sec06-a11y-note");
  const triggerBtn = document.getElementById("sec06-a11y-trigger");
  if (!stage || !btns.length) return;

  let mode = "motion";
  let active = false;

  const COPY = {
    motion: "未降级模式：点击「触发组选」时，同组三张卡片大幅度跨屏平移——正常视觉清晰，但对前庭敏感用户可能引发眩晕（WCAG 2.3.3）。",
    reduced: "prefers-reduced-motion 降级模式：取消长距离位移，改用「同步边框点亮 + 同步明度提亮」（Sekuler & Bennett 广义共同命运），零位移同样清晰交代归属。",
  };

  function apply() {
    stage.dataset.mode = mode;
    stage.dataset.active = String(active);
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.a11yMode === mode)));
    if (note) note.textContent = COPY[mode];
    if (triggerBtn) triggerBtn.textContent = active ? "恢复默认态" : "触发同组响应";
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.a11yMode;
      active = true;
      apply();
    });
  });
  if (triggerBtn) {
    triggerBtn.addEventListener("click", () => {
      active = !active;
      apply();
    });
  }
  apply();
}

// =========================================================================
// 07 节：单变量动态小练习 + 原海报灯箱（放大 / 拖拽 draggable="false" / Esc 关）
// =========================================================================
export function initSec07QuizAndPoster() {
  // 1) 四项迷你动画预览画布（只差一个变量：运动矢量与同步策略）
  const previews = [...document.querySelectorAll(".quiz-canvas")];
  const previewControllers = [];

  for (const c of previews) {
    const variant = c.dataset.variant; // A | B | C | D
    // 6 行单列清晰滑道：4 张跨行选中朱橘卡 + 2 张夹在中间的未选浅灰卡，右侧留宽敞滑道绝不重叠遮挡！
    const slots = [
      { u: 0.24, v: 0.14, sel: true },
      { u: 0.24, v: 0.285, sel: false },
      { u: 0.24, v: 0.43, sel: true },
      { u: 0.24, v: 0.575, sel: true },
      { u: 0.24, v: 0.72, sel: false },
      { u: 0.24, v: 0.865, sel: true },
    ];
    let pt = 0.52;
    const ctl = loop(c, (t, dt, { still }) => {
      const f = fitCanvas(c);
      if (!f) return;
      const { ctx, w, h, dpr } = f;
      if (!still && dt > 0) pt += dt;
      const cyc = still ? 0.56 : ((pt * 0.46) % 1);

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#FAF6F1";
      ctx.fillRect(0, 0, w, h);

      // 目标右侧区虚线
      ctx.strokeStyle = "#CFC5B4";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(w * 0.65, 8, w * 0.29, h - 16);
      ctx.setLineDash([]);

      let selRank = 0;
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        let x = s.u * w;
        let y = s.v * h;
        let alpha = 1;

        if (s.sel) {
          const r = selRank++;
          if (variant === "A") {
            // 依次错峰并朝不同方向散开
            const p = Math.max(0, Math.min(1, (cyc - r * 0.15) / 0.55));
            const dirs = [[-0.08, -0.09], [0.24, -0.10], [-0.07, 0.08], [0.22, 0.09]];
            x += dirs[r][0] * w * p;
            y += dirs[r][1] * h * p;
            alpha = 1 - p * 0.42;
          } else if (variant === "B") {
            // ✅ 正确答案：4 张同向同步等速右滑，其余静止
            const p = Math.min(1, cyc / 0.74);
            const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            x += w * 0.55 * ease;
          } else if (variant === "C") {
            // 4 张右滑，但未选卡片同时反方向左移扰动
            const p = Math.min(1, cyc / 0.74);
            x += w * 0.48 * p;
          } else if (variant === "D") {
            // 同向右滑但速度差 3 倍且错峰
            const delays = [0, 0.17, 0.34, 0.50];
            const speeds = [1.85, 1.15, 0.75, 0.58];
            const p = Math.max(0, Math.min(1, (cyc - delays[r]) * speeds[r]));
            x += w * 0.55 * p;
          }
        } else if (variant === "C") {
          const p = Math.min(1, cyc / 0.74);
          x -= w * 0.12 * p;
        }

        const cw = w * 0.25;
        const ch = h * 0.105;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.sel ? "#E55207" : "#D7CCBB";
        ctx.fillRect(x - cw / 2, y - ch / 2, cw, ch);
        if (s.sel) {
          ctx.fillStyle = "#FFFDF9";
          ctx.fillRect(x - cw / 2 + 4, y - 1.5, cw * 0.48, 3);
        }
        ctx.restore();
      }
      ctx.restore();
    });
    previewControllers.push(ctl);
  }

  // 2) 答题逻辑（选项中性，选后解释每个选项）
  const optBtns = [...document.querySelectorAll(".quiz-opt")];
  const feedback = document.getElementById("quiz-feedback");
  const EXPLAIN = {
    A: {
      ok: false,
      title: "再看看：方案 A 破坏了共同方向与同步性",
      body: "4 张卡片朝上下左右各自散开，起止时间还错开——虽然它们都被勾选了，但视觉上完全看不出它们正前往同一个「明日清单」。",
    },
    B: {
      ok: true,
      title: "选对了！方案 B 完整命中共同命运原则的三要素",
      body: "4 张跨区分布的选中卡片在同一时刻、沿同一向右方向、以相同速度平滑滑向目标列，而未选卡片纹丝不动作为静止背景。即便它们原先分散在角落，人脑也会瞬间把它们归成同一批操作。",
    },
    C: {
      ok: false,
      title: "差一点：方案 C 让背景也动了起来",
      body: "未选卡片同时向左移，抹掉了「动与静」的清晰对比。用户余光被背景反向位移拉走，容易怀疑未选中的卡片是不是也被误操作了。",
    },
    D: {
      ok: false,
      title: "常见误区：方案 D 只保住了「同向」，却丢了「同速与同步」",
      body: "海报强调共同方向，但工程里还必须速度接近、起止同步。快慢相差 3 倍且间隔半秒起跑，会把一次批量归档撕裂成 4 次互不相干的孤立动作。",
    },
  };

  optBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.choice;
      const res = EXPLAIN[choice];
      optBtns.forEach((b) => {
        b.setAttribute("aria-pressed", String(b === btn));
        b.classList.remove("is-correct", "is-wrong");
        if (b === btn) b.classList.add(res.ok ? "is-correct" : "is-wrong");
        if (!res.ok && b.dataset.choice === "B") b.classList.add("is-hint");
        else b.classList.remove("is-hint");
      });
      if (feedback) {
        feedback.hidden = false;
        feedback.dataset.state = res.ok ? "ok" : "err";
        feedback.innerHTML = `<strong>${res.title}</strong><p>${res.body}</p>`;
      }
      previewControllers.forEach((c) => c.draw());
    });
  });

  // 3) 原海报灯箱（放大、鼠标/触摸拖动、draggable="false"、Esc 关）
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const modal = document.getElementById("poster-lightbox");
  const modalImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomInBtn = document.getElementById("lightbox-zoom-in");
  const zoomOutBtn = document.getElementById("lightbox-zoom-out");
  const zoomResetBtn = document.getElementById("lightbox-zoom-reset");
  const stageEl = document.getElementById("lightbox-stage");

  if (!posterImg || !modal || !modalImg || !stageEl) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    modalImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (zoomResetBtn) zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
  }

  function openLightbox() {
    if (!modalImg.src) modalImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function closeLightbox() {
    modal.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  openBtn?.addEventListener("click", openLightbox);
  posterImg.addEventListener("click", openLightbox);
  closeBtn?.addEventListener("click", closeLightbox);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stageEl) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") closeLightbox();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3.2, +(scale + 0.4).toFixed(2));
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.7, +(scale - 0.4).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stageEl.addEventListener("wheel", (e) => {
    if (modal.hidden) return;
    e.preventDefault();
    scale = Math.max(0.7, Math.min(3.2, +(scale - e.deltaY * 0.0015).toFixed(2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  modalImg.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    drag = { id: e.pointerId, sx: e.clientX - tx, sy: e.clientY - ty };
    try { modalImg.setPointerCapture(e.pointerId); } catch {}
  });
  modalImg.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    tx = e.clientX - drag.sx;
    ty = e.clientY - drag.sy;
    applyTransform();
  });
  const endDrag = (e) => {
    if (drag && e.pointerId === drag.id) drag = null;
  };
  modalImg.addEventListener("pointerup", endDrag);
  modalImg.addEventListener("pointercancel", endDrag);
}

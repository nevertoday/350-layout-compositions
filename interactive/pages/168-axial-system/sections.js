// 168 轴线系统 · 正文 01–07 节全部独立互动模块
// 保证相邻两节控件与交互完全不同：
// 01 X 光推窗滑轨 · 02 杠杆力矩天平单选+配重 · 03 端景脉冲 Canvas + 构件复选 · 04 四时代剖面切签
// 05 实战需求翻牌诊断 · 06 四选一单变量轴线测验 · 07 原海报全屏缩放拖动检视

import { loop, pixelRatio } from "../../lib/stage.js";

// ---------- 01 节：隐性轴线 X 光推窗对比 ----------
export function mountXraySection() {
  const slider = document.getElementById("xray-range");
  const modeBtns = [...document.querySelectorAll("[data-xray-mode]")];
  const maskGood = document.getElementById("xray-mask-good");
  const maskBad = document.getElementById("xray-mask-bad");
  const lineGood = document.getElementById("xray-line-good");
  const lineBad = document.getElementById("xray-line-bad");
  const readout = document.getElementById("xray-readout");
  const pctEl = document.getElementById("xray-pct");
  if (!slider) return;

  function apply(val) {
    const p = Math.max(0, Math.min(100, Number(val)));
    slider.value = String(p);
    if (pctEl) pctEl.textContent = `${p}%`;
    const clip = `inset(0 ${100 - p}% 0 0)`;
    if (maskGood) maskGood.style.clipPath = clip;
    if (maskBad) maskBad.style.clipPath = clip;
    if (lineGood) lineGood.style.left = `${p}%`;
    if (lineBad) lineBad.style.left = `${p}%`;

    modeBtns.forEach((b) => {
      const m = b.dataset.xrayMode;
      const on = (m === "clean" && p <= 8) || (m === "half" && p > 8 && p < 92) || (m === "full" && p >= 92);
      b.setAttribute("aria-pressed", String(on));
    });

    if (readout) {
      if (p <= 10) {
        readout.textContent =
          "完全隐去参考线：左图靠两翼共享同一道笔直切缝，没画线大脑也自动补出一条竖脊；右图每行起止各自漂移，秩序瞬间瓦解。";
      } else if (p >= 90) {
        readout.textContent =
          "X 光全开：能清楚看见左图所有要素死死咬住 38% 隐性主轴；右图即便硬画一根红线，也没几个元素真贴在它旁边。";
      } else {
        readout.textContent =
          `X 光推窗 ${p}%：把辅助线半遮半露来回刮开——真正的轴线系统是「线没画出来，秩序已经在那儿了」。`;
      }
    }
  }

  slider.addEventListener("input", () => apply(slider.value));
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const m = btn.dataset.xrayMode;
      apply(m === "clean" ? 0 : m === "half" ? 50 : 100);
    });
  });
  apply(36);
}

// ---------- 02 节：中轴 / 偏轴 / 斜轴 视觉力矩天平 ----------
export function mountBalanceSection() {
  const radios = [...document.querySelectorAll('input[name="axis-arch"]')];
  const leftInc = document.getElementById("bal-l-inc");
  const leftDec = document.getElementById("bal-l-dec");
  const rightInc = document.getElementById("bal-r-inc");
  const rightDec = document.getElementById("bal-r-dec");
  const beamGroup = document.getElementById("bal-beam");
  const fulcrumEl = document.getElementById("bal-fulcrum");
  const leftBlocksG = document.getElementById("bal-left-blocks");
  const rightBlocksG = document.getElementById("bal-right-blocks");
  const archLineEl = document.getElementById("bal-arch-line");
  const archSubEl = document.getElementById("bal-arch-sub");
  const readTitle = document.getElementById("bal-title");
  const readBody = document.getElementById("bal-body");
  const readStats = document.getElementById("bal-stats");
  if (!radios.length) return;

  const ARCHS = {
    center: {
      name: "古典居中对称轴（50%）",
      fulcrum: 0.5,
      tilt: 0,
      cross: false,
      defL: 3,
      defR: 3,
      note: "轴线居正中，左右力臂相等，所以需要近似等重的视觉块来维持庄重平衡——多见于纪念碑立面、古典书扉与仪式场景。",
    },
    offset: {
      name: "现代偏心非对称轴（38%）",
      fulcrum: 0.38,
      tilt: 0,
      cross: false,
      defL: 4,
      defR: 2,
      note: "轴线偏左后，左翼力臂短、右翼力臂长。按杠杆原理，左翼用高饱和深蓝重块压舱，右翼用轻疏文字栏舒展，照样稳如磐石——这才是排印轴线系统的拿手戏。",
    },
    tilted: {
      name: "10° 动势斜轴",
      fulcrum: 0.5,
      tilt: 10,
      cross: false,
      defL: 3,
      defR: 3,
      note: "把主轴倾斜 8°–12° 立即打破静态端坐感，产生海报级前冲张力；但两侧咬合与力矩依旧要守稳，角度不能超 14°。",
    },
    cross: {
      name: "主轴 + 正交次轴（T 形）",
      fulcrum: 0.44,
      tilt: 0,
      cross: true,
      defL: 3,
      defR: 3,
      note: "当信息需要分层时，引入一条与主轴垂直的次轴作为章节分水岭——次轴分量必须明显弱于主轴，绝不平行争权。",
    },
  };

  let cur = "offset";
  let leftW = ARCHS[cur].defL; // 1..6
  let rightW = ARCHS[cur].defR; // 1..6

  function render() {
    const a = ARCHS[cur];
    const fx = 60 + a.fulcrum * 320; // SVG viewBox 0 0 440 220
    const leftArm = a.fulcrum;
    const rightArm = 1 - a.fulcrum;
    const mL = leftW * leftArm;
    const mR = rightW * rightArm;
    const bias = (mR - mL) / Math.max(0.01, mL + mR); // -1..+1
    const angle = Math.max(-16, Math.min(16, bias * 32));
    const balanced = Math.abs(bias) <= 0.18;

    if (fulcrumEl) fulcrumEl.setAttribute("transform", `translate(${fx.toFixed(1)}, 156)`);
    if (beamGroup) {
      beamGroup.setAttribute("transform", `rotate(${angle.toFixed(1)}, ${fx.toFixed(1)}, 156)`);
    }
    if (archLineEl) {
      const dx = Math.tan((a.tilt * Math.PI) / 180) * 65;
      archLineEl.setAttribute("x1", (fx - dx).toFixed(1));
      archLineEl.setAttribute("x2", (fx + dx).toFixed(1));
    }
    if (archSubEl) archSubEl.style.opacity = a.cross ? "1" : "0";

    // 重绘横梁上左右实体配重块
    if (leftBlocksG) {
      let svg = "";
      for (let i = 0; i < leftW; i++) {
        const x = fx - 24 - (i % 3) * 26 - 20;
        const y = 148 - Math.floor(i / 3) * 22 - 18;
        svg += `<rect x="${x.toFixed(1)}" y="${y}" width="20" height="18" fill="#0B3BB2" stroke="#0E1014" stroke-width="1"/>`;
      }
      leftBlocksG.innerHTML = svg;
    }
    if (rightBlocksG) {
      let svg = "";
      for (let i = 0; i < rightW; i++) {
        const x = fx + 24 + (i % 3) * 28;
        const y = 148 - Math.floor(i / 3) * 22 - 18;
        svg += `<rect x="${x.toFixed(1)}" y="${y}" width="22" height="18" fill="${i % 2 === 0 ? "#0E1014" : "#FAF6EE"}" stroke="#0E1014" stroke-width="1.2"/>`;
      }
      rightBlocksG.innerHTML = svg;
    }

    if (readTitle) {
      const stateWord = balanced
        ? "力矩平衡 · 画面稳立"
        : bias > 0
          ? `向右倾倒 ${Math.round(Math.abs(bias) * 100)}%`
          : `向左倾倒 ${Math.round(Math.abs(bias) * 100)}%`;
      readTitle.textContent = `${a.name} — ${stateWord}`;
      readTitle.dataset.ok = String(balanced);
    }
    if (readBody) {
      readBody.textContent = balanced
        ? a.note
        : bias > 0
          ? `右翼力矩（${mR.toFixed(2)}）明显压过左翼（${mL.toFixed(2)}）。试着给左翼加一块深蓝重块，或撤掉一块右翼块，感受非对称平衡点。`
          : `左翼力矩（${mL.toFixed(2)}）压过右翼（${mR.toFixed(2)}）。减一块左翼配重或补一块右翼块就能拉平天平。`;
    }
    if (readStats) {
      readStats.textContent = `左翼 ${leftW} 块 × 臂 ${Math.round(leftArm * 100)}% = ${mL.toFixed(2)} ｜ 右翼 ${rightW} 块 × 臂 ${Math.round(rightArm * 100)}% = ${mR.toFixed(2)}`;
    }
  }

  radios.forEach((r) => {
    r.addEventListener("change", () => {
      if (!r.checked) return;
      cur = r.value;
      leftW = ARCHS[cur].defL;
      rightW = ARCHS[cur].defR;
      render();
    });
  });
  leftInc?.addEventListener("click", () => { leftW = Math.min(6, leftW + 1); render(); });
  leftDec?.addEventListener("click", () => { leftW = Math.max(1, leftW - 1); render(); });
  rightInc?.addEventListener("click", () => { rightW = Math.min(6, rightW + 1); render(); });
  rightDec?.addEventListener("click", () => { rightW = Math.max(1, rightW - 1); render(); });

  render();
}

// ---------- 03 节：深蓝暗室 · 起止端景与视线脉冲 2D Canvas ----------
export function mountTerminusSection() {
  const canvas = document.getElementById("terminus-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const checks = {
    start: document.getElementById("term-start"),
    trees: document.getElementById("term-trees"),
    gate: document.getElementById("term-gate"),
    sphere: document.getElementById("term-sphere"),
  };
  const playBtn = document.getElementById("term-play");
  const readout = document.getElementById("term-readout");
  const statusEl = document.getElementById("term-status");

  let W = 720;
  let H = 340;
  let dpr = 1;
  let playing = true;
  let phase = 0.65; // 0..1 视线脉冲进度

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    dpr = pixelRatio(2);
    W = Math.round(r.width);
    H = Math.round(r.height || 320);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  function flags() {
    return {
      start: !!checks.start?.checked,
      trees: !!checks.trees?.checked,
      gate: !!checks.gate?.checked,
      sphere: !!checks.sphere?.checked,
    };
  }

  function updateCopy() {
    const f = flags();
    const n = [f.start, f.trees, f.gate, f.sphere].filter(Boolean).length;
    if (statusEl) {
      statusEl.textContent =
        !f.sphere && !f.gate
          ? "视线滑出顶边 · 缺少终点"
          : !f.start
            ? "缺少入口起点 · 进入迟疑"
            : n === 4
              ? "四段完整 · 视线稳停端景"
              : `已设 ${n}/4 构件 · 动线可继续加强`;
      statusEl.dataset.ok = String(n === 4);
    }
    if (readout) {
      if (!f.sphere && !f.gate) {
        readout.textContent =
          "既没有门框也没有蓝球端景：朱红视线脉冲一路冲到画框顶沿直接逸出。没有终点的轴线只是一条让人迷茫的空走廊。";
      } else if (!f.start) {
        readout.textContent =
          "远端有蓝球，但前景少了起点台阶：视线不知从哪落脚切入。原海报特意在底部画出阶梯，就是给目光一个清晰的起跑线。";
      } else if (!f.trees) {
        readout.textContent =
          "有起有止，但中段少了两侧列柱与柏树节拍：中间显得过空，纵深距离感变弱。序列节拍是把起点和终点缝在一起的鼓点。";
      } else if (n === 4) {
        readout.textContent =
          "起（前景石阶）→ 承（对称列树与水池节拍）→ 转（门廊框景）→ 合（巨型克莱因蓝球）：视线沿着这条单点透视轴线一次到位、稳稳停住。";
      } else {
        readout.textContent =
          "门框收住了开口，但缺少高潮体量（蓝球），终点气场偏弱。点亮蓝球端景看看视线停留感的变化。";
      }
    }
  }

  function drawFrame(p) {
    const f = flags();
    const cx = W * 0.5;
    const hy = H * 0.42;
    const botY = H - 24;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 深海蓝建筑暗室底
    ctx.fillStyle = "#081433";
    ctx.fillRect(0, 0, W, H);

    // 细建筑制图网格
    ctx.strokeStyle = "rgba(139, 179, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 24; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 24; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // 透视通道两翼
    const topHalf = 18;
    const botHalf = Math.min(130, W * 0.24);
    ctx.strokeStyle = "rgba(139, 179, 255, 0.42)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - botHalf, botY);
    ctx.lineTo(cx - topHalf, hy);
    ctx.lineTo(cx + topHalf, hy);
    ctx.lineTo(cx + botHalf, botY);
    ctx.stroke();

    // 2. 两侧列树/柱廊韵律节拍
    if (f.trees) {
      for (let i = 0; i < 5; i++) {
        const u = 0.14 + i * 0.19;
        const yy = hy + (botY - hy) * u;
        const hw = topHalf + (botHalf - topHalf) * u;
        const h = 16 + u * 44;
        const r = 5 + u * 10;
        [-1, 1].forEach((dir) => {
          const tx = cx + dir * (hw + 14 + u * 34);
          ctx.fillStyle = "rgba(139, 179, 255, 0.22)";
          ctx.strokeStyle = "#8BB3FF";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(tx, yy - h);
          ctx.lineTo(tx + r, yy - 6);
          ctx.lineTo(tx - r, yy - 6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          // 节奏标点连线
          ctx.strokeStyle = "rgba(255, 120, 71, 0.28)";
          ctx.beginPath();
          ctx.moveTo(cx, yy);
          ctx.lineTo(tx, yy);
          ctx.stroke();
        });
      }
    }

    // 4. 蓝球高潮端景
    const sR = Math.min(54, H * 0.17);
    if (f.sphere) {
      const g = ctx.createRadialGradient(cx - sR * 0.3, hy - sR * 0.85, 6, cx, hy - sR * 0.6, sR);
      g.addColorStop(0, "#5F92FF");
      g.addColorStop(0.55, "#194FD4");
      g.addColorStop(1, "#0C297D");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, hy - sR * 0.62, sR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#8BB3FF";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // 3. 门廊框景
    if (f.gate) {
      const gw = 56;
      const gh = 54;
      ctx.fillStyle = "#12265A";
      ctx.strokeStyle = "#FAF6EE";
      ctx.lineWidth = 1.6;
      ctx.fillRect(cx - gw / 2, hy - gh, gw, gh);
      ctx.strokeRect(cx - gw / 2, hy - gh, gw, gh);
      ctx.fillStyle = "#0B3BB2";
      ctx.fillRect(cx - 10, hy - 34, 20, 34);
    }

    // 1. 前景入口石阶
    if (f.start) {
      ctx.fillStyle = "rgba(250, 246, 238, 0.16)";
      ctx.strokeStyle = "#FAF6EE";
      ctx.lineWidth = 1.3;
      ctx.fillRect(cx - botHalf * 1.05, botY - 8, botHalf * 2.1, 8);
      ctx.strokeRect(cx - botHalf * 1.05, botY - 8, botHalf * 2.1, 8);
      ctx.fillRect(cx - botHalf * 1.15, botY, botHalf * 2.3, 8);
      ctx.strokeRect(cx - botHalf * 1.15, botY, botHalf * 2.3, 8);
    }

    // 朱红中轴射线
    const stopY = f.sphere || f.gate ? hy - (f.sphere ? sR * 0.62 : 24) : 6;
    ctx.strokeStyle = "#FF7847";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, botY + 6);
    ctx.lineTo(cx, stopY);
    ctx.stroke();

    // 视线脉冲光点
    const py = botY - (botY - stopY) * p;
    ctx.fillStyle = "#FF7847";
    ctx.beginPath();
    ctx.arc(cx, py, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FAF6EE";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 终点反馈环或逃逸警示箭
    if (f.sphere || f.gate) {
      const ringR = 12 + Math.sin(p * Math.PI) * 14;
      ctx.strokeStyle = "rgba(102, 227, 182, 0.72)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, stopY, ringR, 0, Math.PI * 2);
      ctx.stroke();
      const labelX = cx + sR + 18;
      ctx.strokeStyle = "rgba(102, 227, 182, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 10, stopY);
      ctx.lineTo(labelX - 4, stopY);
      ctx.stroke();
      ctx.fillStyle = "#66E3B6";
      ctx.font = `600 11px "JetBrains Mono", monospace`;
      ctx.textAlign = "left";
      ctx.fillText("TERMINUS · 视线落定", labelX, stopY + 4);
    } else {
      ctx.fillStyle = "#FF875C";
      ctx.beginPath();
      ctx.moveTo(cx, 2);
      ctx.lineTo(cx - 8, 16);
      ctx.lineTo(cx + 8, 16);
      ctx.closePath();
      ctx.fill();
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText("× 无端景，视线逸出画外", cx + 14, 18);
    }

    ctx.restore();
  }

  Object.values(checks).forEach((el) => el?.addEventListener("change", () => { updateCopy(); ctl.draw(); }));
  playBtn?.addEventListener("click", () => {
    playing = !playing;
    playBtn.textContent = playing ? "暂停视线脉冲" : "播放视线脉冲";
    playBtn.setAttribute("aria-pressed", String(playing));
    ctl.draw();
  });

  const ro = new ResizeObserver(() => { resize(); ctl.draw(); });
  ro.observe(canvas);
  resize();
  updateCopy();

  const ctl = loop(canvas, (_t, dt, { still }) => {
    if (still) {
      drawFrame(0.76);
      return;
    }
    if (playing && dt > 0) {
      phase = (phase + dt * 0.42) % 1;
    }
    drawFrame(phase);
  });
}

// ---------- 04 节：历史脉络四时代切签 ----------
export function mountHistorySection() {
  const tabs = [...document.querySelectorAll("[data-era]")];
  const panels = [...document.querySelectorAll("[data-era-panel]")];
  if (!tabs.length) return;

  function select(id) {
    tabs.forEach((t) => {
      const on = t.dataset.era === id;
      t.setAttribute("aria-selected", String(on));
      t.classList.toggle("is-active", on);
    });
    panels.forEach((p) => {
      const on = p.dataset.eraPanel === id;
      p.hidden = !on;
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => select(t.dataset.era)));
  select(tabs[0].dataset.era);
}

// ---------- 05 节：实战需求翻牌诊断 ----------
export function mountBoundarySection() {
  const cards = [...document.querySelectorAll("[data-case-card]")];
  cards.forEach((card) => {
    const answer = card.dataset.answer; // "use" | "avoid"
    const btns = [...card.querySelectorAll("[data-pick]")];
    const fb = card.querySelector(".case-fb");
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const pick = btn.dataset.pick;
        const ok = pick === answer;
        btns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        card.dataset.judged = ok ? "right" : "wrong";
        if (fb) {
          fb.hidden = false;
          const prefix = fb.querySelector(".case-verdict");
          if (prefix) prefix.textContent = ok ? "判断准确：" : "再想一步：";
        }
      });
    });
  });
}

// ---------- 06 节：四选一单变量轴线测验 ----------
export function mountPracticeSection() {
  const opts = [...document.querySelectorAll("[data-quiz-opt]")];
  const verdictBox = document.getElementById("quiz-verdict");
  const vTitle = document.getElementById("quiz-v-title");
  const vBody = document.getElementById("quiz-v-body");
  const grid = document.getElementById("quiz-grid");
  if (!opts.length) return;

  const REASONS = {
    A: {
      ok: false,
      title: "选了 A：全员居中对齐，和 38% 偏心轴互相打架",
      body: "四张图的主轴都在 38% 偏左。A 把文字全部设成自身居中，结果没有哪一条边真正咬住 38% 轴线，右侧留出一整块死白，视觉摇晃。",
    },
    B: {
      ok: false,
      title: "选了 B：外缘贴墙、内缘脱轴，隐性脊柱塌了",
      body: "新手最常犯的错：左边左对齐、右边右对齐，把字往画框外缘推。靠近主轴的内侧变成宽窄乱跳的锯齿缝，藏起红线后根本看不出轴线存在。",
    },
    C: {
      ok: true,
      title: "答对了，正是 C：两翼内齐咬轴 + 非对称力矩平衡",
      body: "左侧时间与标目右对齐紧贴 38% 轴左沿，右侧主标与说明左对齐紧贴 38% 轴右沿，共同切出一条笔直隐性脊柱；左翼深蓝重块压住短力臂，右翼轻疏正文舒展在长力臂上，加上顶底蓝锚收束，藏掉红线也稳稳立住。",
    },
    D: {
      ok: false,
      title: "选了 D：咬合对了，但视觉重量全堆右翼倾覆",
      body: "D 的左右内对齐咬合是正确的，却把深蓝重块和大标题全压到长力臂的右翼，左翼只剩两行浅灰小字，整张版面明显向右栽倒。",
    },
  };

  opts.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.quizOpt;
      const r = REASONS[k];
      if (!r) return;
      grid?.classList.add("is-revealed");
      opts.forEach((b) => {
        const bk = b.dataset.quizOpt;
        b.setAttribute("aria-pressed", String(bk === k));
        b.dataset.state = bk === "C" ? "correct" : bk === k ? "wrong" : "dim";
      });
      if (verdictBox) verdictBox.dataset.state = r.ok ? "correct" : "wrong";
      if (vTitle) vTitle.textContent = r.title;
      if (vBody) vBody.textContent = r.body;
    });
  });
}

// ---------- 07 节：原海报全屏放大 + 鼠标/触摸拖动 + Esc 关闭 ----------
export function mountPosterViewer() {
  const openBtn = document.getElementById("poster-open");
  const modal = document.getElementById("poster-modal");
  const closeBtn = document.getElementById("poster-close");
  const zoomIn = document.getElementById("poster-zin");
  const zoomOut = document.getElementById("poster-zout");
  const zoomReset = document.getElementById("poster-zreset");
  const zoomImg = document.getElementById("poster-zoom-img");
  const posterSrcImg = document.getElementById("poster");
  const viewport = document.getElementById("poster-viewport");
  if (!openBtn || !modal || !zoomImg || !posterSrcImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let ox = 0;
  let oy = 0;

  function applyTransform() {
    zoomImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomReset) zoomReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    // 复用同一张内联海报 data URI，绝不二次内联
    if (!zoomImg.getAttribute("src")) zoomImg.src = posterSrcImg.src;
    scale = 1.25;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    closeBtn?.focus();
  }

  function close() {
    modal.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });

  zoomIn?.addEventListener("click", () => { scale = Math.min(3, +(scale + 0.35).toFixed(2)); applyTransform(); });
  zoomOut?.addEventListener("click", () => { scale = Math.max(0.8, +(scale - 0.35).toFixed(2)); applyTransform(); });
  zoomReset?.addEventListener("click", () => { scale = 1.25; tx = 0; ty = 0; applyTransform(); });

  viewport?.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.8, Math.min(3.2, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  viewport?.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    ox = tx;
    oy = ty;
    viewport.setPointerCapture?.(e.pointerId);
  });
  viewport?.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = ox + (e.clientX - sx);
    ty = oy + (e.clientY - sy);
    applyTransform();
  });
  viewport?.addEventListener("pointerup", () => { dragging = false; });
  viewport?.addEventListener("pointercancel", () => { dragging = false; });
}

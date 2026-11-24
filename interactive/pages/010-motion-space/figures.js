import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, idealLead } from "./model.js";

const $ = (id) => document.getElementById(id);

const C = {
  orange: "#EB540F",
  cream: "#F3EDE2",
  cream2: "#E6DDCE",
  navy: "#0B1D36",
  navy2: "#162E4E",
  danger: "#C92412",
  white: "#FAF7F2",
};

// =========================================================================
// 01 表征动量体验：球在哪一刻消失？
// =========================================================================
function initRmLab() {
  const canvas = $("rm-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const btnLaunch = $("rm-launch");
  const speedBtns = [...document.querySelectorAll("[data-rm-speed]")];
  const badge = $("rm-badge");
  const msg = $("rm-msg");

  const rm = {
    mode: "demo", // demo | running | waitClick | result
    speedKey: "fast",
    ballU: 0.54,
    vanishU: 0.54,
    guessU: 0.60,
    t0: 0,
    raf: 0,
  };

  function draw() {
    const r = canvas.getBoundingClientRect();
    const W = Math.max(260, Math.round(r.width || 680));
    const H = Math.max(130, Math.round(r.height || 160));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 深蓝轨道背景
    ctx.fillStyle = C.navy;
    ctx.fillRect(0, 0, W, H);

    const padX = 28;
    const trackW = W - padX * 2;
    const midY = H * 0.52;

    // 标尺刻度（0%..100%）
    ctx.strokeStyle = "rgba(243,237,226,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, midY);
    ctx.lineTo(W - padX, midY);
    ctx.stroke();

    ctx.font = `600 10px "Inter", sans-serif`;
    ctx.textAlign = "center";
    for (let i = 0; i <= 10; i++) {
      const tx = padX + (trackW * i) / 10;
      const tall = i % 2 === 0;
      ctx.strokeStyle = tall ? "rgba(243,237,226,0.38)" : "rgba(243,237,226,0.16)";
      ctx.beginPath();
      ctx.moveTo(tx, midY - (tall ? 10 : 5));
      ctx.lineTo(tx, midY + (tall ? 10 : 5));
      ctx.stroke();
      if (tall) {
        ctx.fillStyle = "rgba(243,237,226,0.52)";
        ctx.fillText(`${i * 10}%`, tx, midY + 26);
      }
    }

    // 前进箭头提示
    ctx.fillStyle = "rgba(243,237,226,0.55)";
    ctx.font = `600 11px "Noto Sans SC", "Inter", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(rm.speedKey === "fast" ? "高速运动方向 →" : "慢速运动方向 →", padX, 24);

    if (rm.mode === "running") {
      const bx = padX + trackW * rm.ballU;
      // 拖尾
      const tailLen = rm.speedKey === "fast" ? 58 : 22;
      const g = ctx.createLinearGradient(bx, midY, bx - tailLen, midY);
      g.addColorStop(0, "rgba(235,84,15,0.85)");
      g.addColorStop(1, "rgba(235,84,15,0)");
      ctx.fillStyle = g;
      ctx.fillRect(Math.max(padX, bx - tailLen), midY - 6, Math.min(tailLen, bx - padX), 12);

      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(bx, midY, 11, 0, Math.PI * 2);
      ctx.fill();
    } else if (rm.mode === "waitClick") {
      ctx.fillStyle = C.cream;
      ctx.font = `600 14px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("球消失了！在轨道上点击你认为它最后出现的位置", W / 2, midY - 24);
    } else {
      // demo 或 result：展示真实消失点与心理落点
      const vx = padX + trackW * rm.vanishU;
      const gx = padX + trackW * rm.guessU;

      // 偏差带
      ctx.fillStyle = "rgba(235,84,15,0.28)";
      ctx.fillRect(Math.min(vx, gx), midY - 14, Math.abs(gx - vx), 28);

      // 真实消失点
      ctx.strokeStyle = C.cream;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(vx, 34);
      ctx.lineTo(vx, H - 16);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = C.cream;
      ctx.beginPath();
      ctx.arc(vx, midY, 9, 0, Math.PI * 2);
      ctx.fill();

      // 点击/预判点
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(gx, 34);
      ctx.lineTo(gx, H - 16);
      ctx.stroke();

      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(gx, midY, 7, 0, Math.PI * 2);
      ctx.fill();

      // 标注
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = vx <= gx ? "right" : "left";
      ctx.fillStyle = C.cream;
      ctx.fillText(`真实消失 ${Math.round(rm.vanishU * 100)}%`, vx + (vx <= gx ? -10 : 10), 46);

      ctx.textAlign = gx >= vx ? "left" : "right";
      ctx.fillStyle = C.orange;
      const gLabel = rm.mode === "demo" ? "常见心理落点" : "你的点击";
      ctx.fillText(`${gLabel} ${Math.round(rm.guessU * 100)}%`, gx + (gx >= vx ? 10 : -10), 46);
    }

    ctx.restore();
  }

  function launch() {
    cancelAnimationFrame(rm.raf);
    rm.vanishU = 0.42 + Math.random() * 0.28;
    if (reducedMotion.matches) {
      rm.mode = "waitClick";
      badge.textContent = "等待点击";
      msg.textContent = "已开启减少动态效果：请点击轨道上任意位置查看与真实消失点的对比。";
      draw();
      return;
    }
    rm.mode = "running";
    rm.ballU = 0.04;
    rm.t0 = performance.now();
    badge.textContent = "观察中…";
    msg.textContent = "盯住橙色小球，看它在哪一格突然消失。";
    const speedPerSec = rm.speedKey === "fast" ? 0.92 : 0.38;

    const tick = (now) => {
      const elapsed = (now - rm.t0) / 1000;
      rm.ballU = 0.04 + elapsed * speedPerSec;
      if (rm.ballU >= rm.vanishU) {
        rm.mode = "waitClick";
        badge.textContent = "点击轨道";
        msg.textContent = "球消失了！在上方轨道点出它消失的那一点（键盘可按 Enter 估算）。";
        draw();
        return;
      }
      draw();
      rm.raf = requestAnimationFrame(tick);
    };
    rm.raf = requestAnimationFrame(tick);
  }

  function pickAt(u) {
    if (rm.mode !== "waitClick") return;
    rm.guessU = clamp(u, 0.02, 0.98);
    rm.mode = "result";
    const delta = Math.round((rm.guessU - rm.vanishU) * 100);
    if (delta > 1) {
      badge.textContent = `往前偏了 +${delta}%`;
      msg.textContent = `你的落点比真实消失处往前多冲了 ${delta}%——这就是表征动量。即使球停了，大脑仍替它惯性向前多走了一段。`;
    } else if (delta < -1) {
      badge.textContent = `偏后 ${delta}%`;
      msg.textContent = `这次你落点偏保守（比真实处靠后 ${Math.abs(delta)}%）。换「高速」再试一次，高速下更容易出现向前过冲。`;
    } else {
      badge.textContent = "几乎精准命中";
      msg.textContent = `误差仅 ${Math.abs(delta)}%！多数人在高速下仍会顺着方向往前偏 3%–8%，所以快画面必须提前打开前路。`;
    }
    draw();
  }

  btnLaunch.addEventListener("click", launch);
  speedBtns.forEach((b) => {
    b.addEventListener("click", () => {
      rm.speedKey = b.dataset.rmSpeed;
      speedBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      if (rm.mode === "demo") {
        rm.vanishU = 0.54;
        rm.guessU = rm.speedKey === "fast" ? 0.61 : 0.56;
        msg.textContent = rm.speedKey === "fast"
          ? "高速下，大脑往前多算出的惯性距离更大（常见向前偏移约 6%–8%）。点「发球」试试。"
          : "慢速下，表征动量仍存在但幅度明显变小（约 2%）。点「发球」对比一下。";
      }
      draw();
    });
  });

  canvas.addEventListener("click", (e) => {
    if (rm.mode !== "waitClick") {
      launch();
      return;
    }
    const r = canvas.getBoundingClientRect();
    const padX = 28;
    const u = (e.clientX - r.left - padX) / Math.max(1, r.width - padX * 2);
    pickAt(u);
  });

  canvas.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (rm.mode === "waitClick") pickAt(rm.vanishU + (rm.speedKey === "fast" ? 0.06 : 0.02));
      else launch();
    }
  });

  new ResizeObserver(draw).observe(canvas);
  draw();
}

// =========================================================================
// 02 速度 × 空间对照台
// =========================================================================
function initSpeedLab() {
  const diagram = $("spd-diagram");
  const slider = $("spd-slider");
  const out = $("spd-out");
  const explain = $("spd-explain");
  const tabs = [...document.querySelectorAll(".spd-tab")];
  if (!diagram || !slider) return;

  function render(val) {
    const s = clamp(val / 100, 0.05, 1);
    const lead = idealLead(s); // 0.45 .. 0.68
    const halfW = s > 0.8 ? 0.11 : 0.07;
    const u = clamp(1 - lead - halfW, 0.17, 0.46);
    const trail = clamp(u - halfW, 0.11, 0.4);
    const leadPct = Math.round(lead * 100);
    const trailPct = Math.round(trail * 100);

    let modeName, kmhText, desc;
    if (val < 25) {
      modeName = "散步";
      kmhText = `${Math.round(3 + (val / 25) * 4)} km/h`;
      desc = `低速移动时，大脑往前预演的距离很短。主体放在偏左 ${Math.round(u * 100)}% 附近、前方留约 ${leadPct}% 就已从容，不必退得太靠边。`;
    } else if (val < 55) {
      modeName = "慢跑";
      kmhText = `${Math.round(8 + ((val - 25) / 30) * 8)} km/h`;
      desc = `步伐加快后，身体明显前倾，前方需要打开到 ${leadPct}% 左右（接近左三分线一带），同时身后留出 ${trailPct}% 缓冲。`;
    } else if (val < 85) {
      modeName = "冲刺";
      kmhText = `${Math.round(18 + ((val - 55) / 30) * 18)} km/h`;
      desc = `高速冲刺带来强烈的表征动量。主体退到 ${Math.round(u * 100)}% 处，把 ${leadPct}% 的画幅留作跑道，才能压住「马上撞出画框」的急迫感。`;
    } else {
      modeName = "赛车极速";
      kmhText = `${Math.round(140 + ((val - 85) / 15) * 140)} km/h`;
      desc = `极速目标眨眼就能横穿整块屏幕：主体压到后四分之一区域，前方留出近 ${leadPct}% 的大段空路，同时仍保住 ${trailPct}% 后缘呼吸边不切尾。`;
    }

    out.textContent = `${modeName}（${kmhText}）· 推荐前方空间 ${leadPct}%`;
    explain.textContent = desc;

    tabs.forEach((t) => {
      const tv = Number(t.dataset.spd);
      t.setAttribute("aria-pressed", String(Math.abs(tv - val) <= 6));
    });

    // 构建清晰矢量示意图
    const W = 720, H = 200;
    const cx = Math.round(u * W);
    const fx = Math.round((u + halfW) * W);
    const bx = Math.round((u - halfW) * W);
    const coneLen = Math.round((W - fx - 20) * (0.45 + s * 0.5));
    const trackY = 148;

    // 速度越快，主体剪影从步行→冲刺→赛车形态平滑呼应
    const figureSvg = val >= 84
      ? `<g transform="translate(${cx} ${trackY})">
           <path d="M-46,-9 L-44,-22 L-20,-33 L8,-33 L28,-21 L50,-15 L52,-8 Z" fill="${C.navy}"/>
           <polygon points="-47,-22 -52,-30 -42,-29 -40,-22" fill="${C.orange}"/>
           <rect x="-38" y="-17" width="76" height="3" fill="${C.orange}"/>
           <circle cx="-27" cy="-9" r="9" fill="${C.navy}" stroke="${C.cream}" stroke-width="2"/>
           <circle cx="28" cy="-9" r="9" fill="${C.navy}" stroke="${C.cream}" stroke-width="2"/>
         </g>`
      : `<g transform="translate(${cx} ${trackY})">
           <polygon points="-4,-28 ${Math.round(-16 - s * 14)},-10 ${Math.round(-28 - s * 16)},-2 ${Math.round(-14 - s * 10)},-6 2,-24" fill="${C.orange}"/>
           <polygon points="0,-28 ${Math.round(14 + s * 14)},-16 ${Math.round(24 + s * 18)},0 ${Math.round(10 + s * 10)},-12 -5,-25" fill="${C.navy}"/>
           <polygon points="${Math.round(4 + s * 12)},-60 ${Math.round(16 + s * 16)},-56 6,-24 -6,-28" fill="${C.navy}"/>
           <polyline points="${Math.round(5 + s * 10)},-52 ${Math.round(-8 - s * 8)},-42 ${Math.round(-16 - s * 8)},-34" fill="none" stroke="${C.navy}" stroke-width="5.5" stroke-linejoin="miter"/>
           <polyline points="${Math.round(12 + s * 14)},-52 ${Math.round(24 + s * 14)},-42 ${Math.round(33 + s * 16)},-50" fill="none" stroke="${C.navy}" stroke-width="6" stroke-linejoin="miter"/>
           <circle cx="${Math.round(14 + s * 18)}" cy="${Math.round(-69 + s * 4)}" r="8.5" fill="${C.navy}"/>
         </g>`;

    diagram.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="spd-svg" role="img" aria-label="${modeName}推荐前方空间${leadPct}%">
      <rect width="${W}" height="${H}" fill="${C.cream}"/>
      <polygon points="0,0 ${Math.min(W - 60, cx + 80)},0 ${Math.max(20, cx - 40)},${trackY} 0,${trackY}" fill="${C.orange}" opacity="0.14"/>
      <polygon points="${fx},${trackY - 48} ${fx + coneLen},${trackY - 78} ${fx + coneLen},${trackY - 12} ${fx},${trackY - 22}" fill="${C.orange}" opacity="0.16"/>
      <line x1="${fx}" y1="18" x2="${fx}" y2="${trackY}" stroke="${C.navy}" stroke-width="1.4" stroke-dasharray="5 5" opacity="0.5"/>
      <line x1="${bx}" y1="42" x2="${bx}" y2="${trackY}" stroke="${C.navy}" stroke-width="1" stroke-dasharray="3 4" opacity="0.28"/>
      <line x1="${fx + 4}" y1="54" x2="${W - 22}" y2="54" stroke="${C.orange}" stroke-width="2.4"/>
      <polygon points="${W - 14},54 ${W - 25},48 ${W - 25},60" fill="${C.orange}"/>
      <text x="${Math.round((fx + W - 14) / 2)}" y="44" text-anchor="middle" fill="${C.orange}" font-family="Inter, Noto Sans SC, sans-serif" font-weight="800" font-size="13">前方空间 ${leadPct}%</text>
      <text x="${Math.round((fx + W - 14) / 2)}" y="74" text-anchor="middle" fill="${C.navy}" opacity="0.58" font-family="Inter, Noto Sans SC, sans-serif" font-weight="600" font-size="11">心理预演区随速度扩大</text>
      <text x="${Math.max(38, Math.round(bx / 2))}" y="112" text-anchor="middle" fill="${C.navy}" opacity="0.6" font-family="Inter, Noto Sans SC, sans-serif" font-weight="600" font-size="11">后缘 ${trailPct}%</text>
      <rect x="0" y="${trackY}" width="${W}" height="${H - trackY}" fill="${C.navy}"/>
      <rect x="${fx}" y="${trackY + 18}" width="${W - fx - 14}" height="6" fill="${C.orange}"/>
      <rect x="14" y="${trackY + 18}" width="${Math.max(4, bx - 14)}" height="6" fill="${C.cream}" opacity="0.4"/>
      ${figureSvg}
    </svg>`;
  }

  slider.addEventListener("input", () => render(Number(slider.value)));
  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      slider.value = t.dataset.spd;
      render(Number(t.dataset.spd));
    });
  });

  render(Number(slider.value));
}

// =========================================================================
// 03 摇拍快门与前后留白模拟器
// =========================================================================
function initPanLab() {
  const canvas = $("pan-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const sShutter = $("pan-shutter");
  const sPos = $("pan-pos");
  const outShutter = $("pan-shutter-out");
  const outPos = $("pan-pos-out");
  const readout = $("pan-readout");

  const st = {
    shutter: Number(sShutter.value) / 100, // 0=1/1000s 凝固, 1=1/15s 极速拉丝
    u: Number(sPos.value) / 100,
    scroll: 0,
  };

  function describe() {
    const sh = st.shutter;
    const shLabel = sh < 0.2 ? "1/1000s · 高速凝固" : sh < 0.5 ? "1/250s · 轻微动态模糊" : sh < 0.8 ? "1/30s · 经典摇拍拖影" : "1/15s · 极致拉丝速度感";
    outShutter.textContent = shLabel;

    const half = 0.095;
    const lead = Math.round(clamp(1 - (st.u + half), 0, 1) * 100);
    const trail = Math.round(clamp(st.u - half, 0, 1) * 100);
    outPos.textContent = `前方 ${lead}% · 后方 ${trail}%`;

    if (lead < 16) {
      readout.textContent = `后方拖影很长（${trail}%），但前方只剩 ${lead}%——车头马上撞出画框，观众只觉得紧张，失去了前进的舒展感。`;
    } else if (sh > 0.55 && trail < 16) {
      readout.textContent = `你用了慢速摇拍快门，但主体贴得太靠左，后方只剩 ${trail}%：最能体现「刚经过、跑多快」的速度拖影被画框硬切掉了！把位置往右稍微移到 35%–42% 看看。`;
    } else if (sh > 0.55 && trail >= 22 && lead >= 42) {
      readout.textContent = `摇拍黄金配比：前方 ${lead}% 给出清晰去向，后方 ${trail}% 留足舞台让慢快门拖影充分展开——既有「要去哪」，又有「跑得多快」。`;
    } else if (sh < 0.25 && lead >= 50) {
      readout.textContent = `高速快门把背景完全凝固了，没有拖影帮忙交代速度；此时动势几乎全靠前方这 ${lead}% 的留白与姿态前倾来撑住。`;
    } else {
      readout.textContent = `前方 ${lead}% 负责方向与呼吸，后方 ${trail}% 负责承接背景动态流线。拉动快门和位置，找两者平衡点。`;
    }
  }

  let W = 720, H = 260, dpr = 1;
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(260, Math.round(r.width || 720));
    H = Math.max(180, Math.round(r.height || 260));
    dpr = pixelRatio(2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  // 固定背景柱与色块
  const props = [
    { x: 0.08, y: 0.2, h: 0.52, w: 12, col: "#173154" },
    { x: 0.24, y: 0.3, h: 0.42, w: 18, col: "#D7CCBA" },
    { x: 0.42, y: 0.16, h: 0.56, w: 10, col: "#EB540F" },
    { x: 0.61, y: 0.26, h: 0.46, w: 22, col: "#25456D" },
    { x: 0.78, y: 0.22, h: 0.5, w: 14, col: "#C9BCA7" },
    { x: 0.93, y: 0.34, h: 0.38, w: 16, col: "#EB540F" },
  ];

  function drawFrame(t, dt, { still }) {
    if (!W || !H) resize();
    if (!still) st.scroll = (st.scroll + dt * 0.42) % 1;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 背景底
    ctx.fillStyle = C.cream;
    ctx.fillRect(0, 0, W, H);

    const groundY = H * 0.76;
    const blur = st.shutter; // 0..1

    // 摇拍背景：快门越慢，立柱被拉得越长越透明，变成水平速度丝带
    for (const p of props) {
      const px = (((p.x - st.scroll) % 1 + 1) % 1) * (W + 180) - 90;
      const py = H * p.y;
      const ph = H * p.h;
      const stretch = p.w + blur * blur * W * 0.44;
      ctx.save();
      ctx.globalAlpha = 0.82 - blur * 0.52;
      if (blur > 0.15) {
        const g = ctx.createLinearGradient(px - stretch * 0.5, py, px + stretch * 0.5, py);
        g.addColorStop(0, "rgba(243,237,226,0)");
        g.addColorStop(0.25, p.col);
        g.addColorStop(0.75, p.col);
        g.addColorStop(1, "rgba(243,237,226,0)");
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = p.col;
      }
      ctx.fillRect(px - stretch * 0.5, py, stretch, ph);
      ctx.restore();
    }

    // 水平动态模糊细丝（快门慢时加强）
    if (blur > 0.12) {
      const lines = Math.round(6 + blur * 18);
      for (let i = 0; i < lines; i++) {
        const ly = 24 + ((i * 37) % (groundY - 40));
        const lx = (((i * 0.23 - st.scroll * 1.4) % 1 + 1) % 1) * W;
        const len = 30 + blur * 170;
        ctx.strokeStyle = i % 4 === 0 ? `rgba(235,84,15,${0.18 + blur * 0.28})` : `rgba(11,29,54,${0.1 + blur * 0.18})`;
        ctx.lineWidth = i % 3 === 0 ? 2.5 : 1.2;
        ctx.beginPath();
        ctx.moveTo(lx - len, ly);
        ctx.lineTo(lx, ly);
        ctx.stroke();
      }
    }

    // 地面深蓝跑道
    ctx.fillStyle = C.navy;
    ctx.fillRect(0, groundY, W, H - groundY);

    // 主体位置
    const sx = st.u * W;
    const halfPx = 0.095 * W;
    const frontX = sx + halfPx;
    const backX = sx - halfPx;

    // 车身后方专属尾流拖影（仅在后方空间可见——空间太窄会被左框裁断！）
    if (blur > 0.15) {
      const wakeLen = 40 + blur * W * 0.36;
      const g = ctx.createLinearGradient(backX, groundY - 26, backX - wakeLen, groundY - 26);
      g.addColorStop(0, "rgba(235,84,15,0.68)");
      g.addColorStop(0.6, "rgba(235,84,15,0.22)");
      g.addColorStop(1, "rgba(235,84,15,0)");
      ctx.fillStyle = g;
      ctx.fillRect(Math.max(0, backX - wakeLen), groundY - 40, Math.min(wakeLen, backX), 26);
    }

    // 主体（清晰锐利的骑行者剪影：摇拍中主体保持清晰，背景虚化！）
    const sc = clamp(W / 540, 0.72, 1.25);
    ctx.save();
    ctx.translate(sx, groundY + 1);
    ctx.scale(sc, sc);
    // 两轮
    for (const wx of [-25, 25]) {
      ctx.strokeStyle = C.navy;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(wx, -17, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(wx, -17, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = C.navy;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-25, -17); ctx.lineTo(-2, -14); ctx.lineTo(17, -36); ctx.lineTo(25, -17);
    ctx.moveTo(-25, -17); ctx.lineTo(-11, -37); ctx.lineTo(-2, -14);
    ctx.stroke();
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(-11, -37); ctx.lineTo(17, -36);
    ctx.stroke();
    // 骑行者剪影
    ctx.fillStyle = C.navy;
    ctx.beginPath();
    ctx.moveTo(-16, -40); ctx.lineTo(11, -55); ctx.lineTo(16, -46); ctx.lineTo(-9, -34);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(21, -54, 9, 6.5, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 底部前后空间对比条（与下方滑块读数使用完全一致的 leadPct / trailPct）
    const barY = groundY + 24;
    const leadPct = Math.round(clamp(1 - (st.u + 0.095), 0, 1) * 100);
    const trailPct = Math.round(clamp(st.u - 0.095, 0, 1) * 100);
    const leadW = Math.max(0, W - frontX - 16);
    const trailW = Math.max(0, backX - 16);

    ctx.fillStyle = C.orange;
    ctx.fillRect(frontX, barY, leadW, 6);
    ctx.fillStyle = "rgba(243,237,226,0.55)";
    ctx.fillRect(16, barY, trailW, 6);

    ctx.font = `700 11px "Noto Sans SC", "Inter", sans-serif`;
    if (leadW > 70) {
      ctx.fillStyle = C.orange;
      ctx.textAlign = "center";
      ctx.fillText(`前方「去哪」${leadPct}%`, frontX + leadW / 2, barY + 22);
    }
    if (trailW > 70) {
      ctx.fillStyle = C.cream;
      ctx.textAlign = "center";
      ctx.fillText(`后方「拖影」${trailPct}%`, 16 + trailW / 2, barY + 22);
    }

    ctx.restore();
  }

  resize();
  const panLoop = loop(canvas, drawFrame);
  new ResizeObserver(() => { resize(); panLoop.draw(); }).observe(canvas);

  sShutter.addEventListener("input", () => {
    st.shutter = Number(sShutter.value) / 100;
    describe();
    panLoop.draw();
  });
  sPos.addEventListener("input", () => {
    st.u = Number(sPos.value) / 100;
    describe();
    panLoop.draw();
  });

  describe();
  panLoop.draw();
}

// =========================================================================
// 04 五种运动轨迹
// =========================================================================
const TRAJS = {
  horiz: {
    en: "HORIZONTAL SPRINT",
    title: "水平冲刺：空间留在正前方",
    desc: "跑道短跑、公路车、横向列车是最经典的运动空间场景：主体压在左三分线或后四分之一处，右前方整片留白接住水平速度向量。",
    tip: "要点：身体前倾越厉害、速度越快，主体越往后退，前方留到 55%–68%。",
    svg: () => `<svg viewBox="0 0 420 250">
      <rect width="420" height="250" fill="${C.cream}"/>
      <rect x="148" y="34" width="248" height="156" fill="${C.orange}" opacity="0.14"/>
      <line x1="148" y1="24" x2="148" y2="196" stroke="${C.navy}" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.5"/>
      <line x1="148" y1="112" x2="378" y2="112" stroke="${C.orange}" stroke-width="2.6"/>
      <polygon points="390,112 376,105 376,119" fill="${C.orange}"/>
      <text x="270" y="98" text-anchor="middle" fill="${C.orange}" font-weight="800" font-size="13">水平前导空间</text>
      <rect x="0" y="196" width="420" height="54" fill="${C.navy}"/>
      <g transform="translate(106 196)">
        <polygon points="-4,-30 -24,-8 -36,0 -18,-5 3,-24" fill="${C.orange}"/>
        <polygon points="0,-30 19,-16 32,0 13,-12 -6,-26" fill="${C.navy}"/>
        <polygon points="10,-66 24,-61 8,-25 -6,-29" fill="${C.navy}"/>
        <polyline points="11,-57 -6,-46 -18,-36" fill="none" stroke="${C.navy}" stroke-width="6" stroke-linejoin="miter"/>
        <polyline points="19,-56 32,-44 42,-53" fill="none" stroke="${C.navy}" stroke-width="6.5" stroke-linejoin="miter"/>
        <circle cx="24" cy="-76" r="9.5" fill="${C.navy}"/>
      </g>
    </svg>`,
  },
  diag: {
    en: "DIAGONAL CLIMB",
    title: "斜向爬坡：空间沿着斜线铺向右上角",
    desc: "登山车爬坡、飞机起飞、滑雪腾空都是斜向运动。这时不仅右边要空，上方也要跟着留空——整块留白落在右上方象限。",
    tip: "要点：斜线本身已自带速度张力，切记别让斜向顶点顶到画框顶边。",
    svg: () => `<svg viewBox="0 0 420 250">
      <rect width="420" height="250" fill="${C.cream}"/>
      <polygon points="150,175 400,20 400,150 175,200" fill="${C.orange}" opacity="0.15"/>
      <polygon points="0,235 420,108 420,250 0,250" fill="${C.navy}"/>
      <line x1="154" y1="152" x2="365" y2="48" stroke="${C.orange}" stroke-width="2.6" stroke-dasharray="7 5"/>
      <polygon points="378,42 361,42 368,55" fill="${C.orange}"/>
      <text x="276" y="72" text-anchor="middle" fill="${C.orange}" font-weight="800" font-size="13">右上象限留白</text>
      <g transform="translate(115 198) rotate(-17)">
        <circle cx="-22" cy="-14" r="14" fill="none" stroke="${C.navy}" stroke-width="3.2"/>
        <circle cx="22" cy="-14" r="14" fill="none" stroke="${C.navy}" stroke-width="3.2"/>
        <path d="M-22,-14 L-2,-14 L15,-31 L22,-14 M-22,-14 L-10,-32 L-2,-14" fill="none" stroke="${C.navy}" stroke-width="3"/>
        <line x1="-10" y1="-32" x2="15" y2="-31" stroke="${C.orange}" stroke-width="3.2"/>
        <polygon points="-14,-35 11,-48 16,-40 -7,-30" fill="${C.navy}"/>
        <circle cx="19" cy="-49" r="7" fill="${C.navy}"/>
      </g>
    </svg>`,
  },
  arc: {
    en: "PARABOLIC ARC",
    title: "抛物线球路：给整条弧线与落点留出画幅",
    desc: "投篮、网球扣杀、足球长传的轨迹是一条弧线。你不能只把球放左边，还要同时留出弧线最高点的上方空间，以及终点（篮筐/落点）方向。",
    tip: "要点：把「出手点」和「落点」包进同一条完整弧线，观众一眼看懂这一球去哪。",
    svg: () => `<svg viewBox="0 0 420 250">
      <rect width="420" height="250" fill="${C.cream}"/>
      <path d="M98,142 Q225,18 358,108" fill="none" stroke="${C.orange}" stroke-width="2.6" stroke-dasharray="6 5"/>
      <path d="M98,142 Q225,18 358,108 L358,176 L98,176 Z" fill="${C.orange}" opacity="0.12"/>
      <polygon points="366,114 352,112 360,100" fill="${C.orange}"/>
      <rect x="0" y="210" width="420" height="40" fill="${C.navy}"/>
      <!-- 球 -->
      <circle cx="136" cy="108" r="13" fill="${C.orange}"/>
      <path d="M124,108 H148 M136,96 V120" stroke="${C.cream}" stroke-width="1.5" opacity="0.7"/>
      <!-- 篮筐目标 -->
      <line x1="382" y1="84" x2="382" y2="146" stroke="${C.navy}" stroke-width="5"/>
      <line x1="354" y1="120" x2="382" y2="120" stroke="${C.orange}" stroke-width="4"/>
      <path d="M358,122 L362,146 H376 L380,122" fill="none" stroke="${C.navy}" stroke-width="1.5" stroke-dasharray="3 2"/>
      <text x="232" y="54" text-anchor="middle" fill="${C.orange}" font-weight="800" font-size="13">完整抛物线空间</text>
      <!-- 投篮者剪影 -->
      <g transform="translate(74 210)">
        <polygon points="-8,-42 8,-42 12,-76 -6,-74" fill="${C.navy}"/>
        <line x1="6" y1="-70" x2="22" y2="-92" stroke="${C.navy}" stroke-width="6"/>
        <line x1="-4" y1="-42" x2="-10" y2="0" stroke="${C.navy}" stroke-width="7"/>
        <line x1="6" y1="-42" x2="10" y2="0" stroke="${C.navy}" stroke-width="7"/>
        <circle cx="3" cy="-86" r="8.5" fill="${C.navy}"/>
      </g>
    </svg>`,
  },
  jump: {
    en: "VERTICAL LEAP & DROP",
    title: "起跳与下落：向上留天，向下留落点",
    desc: "垂直运动同样遵守运动空间：起跳瞬间，画面上方留空表现腾空高度；跳水或下坠瞬间，画面下方留出水面与落点，才能交代重力与势能。",
    tip: "要点：别和 011 头部空间混为一谈——起跳留白是为了「接住上升路线」，比常规头顶余量宽得多。",
    svg: () => `<svg viewBox="0 0 420 250">
      <rect width="420" height="250" fill="${C.cream}"/>
      <line x1="210" y1="16" x2="210" y2="234" stroke="${C.navy}" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.3"/>
      <!-- 左侧：向上起跳 -->
      <rect x="24" y="20" width="166" height="106" fill="${C.orange}" opacity="0.14"/>
      <line x1="107" y1="138" x2="107" y2="38" stroke="${C.orange}" stroke-width="2.5" stroke-dasharray="5 4"/>
      <polygon points="107,26 100,40 114,40" fill="${C.orange}"/>
      <text x="107" y="64" text-anchor="middle" fill="${C.orange}" font-weight="800" font-size="12">起跳 · 上方留空</text>
      <rect x="24" y="216" width="166" height="18" fill="${C.navy}"/>
      <g transform="translate(107 192)">
        <circle cx="0" cy="-46" r="8" fill="${C.navy}"/>
        <polygon points="-7,-36 7,-36 5,-10 -5,-10" fill="${C.navy}"/>
        <line x1="-6" y1="-34" x2="-18" y2="-52" stroke="${C.navy}" stroke-width="5"/>
        <line x1="6" y1="-34" x2="18" y2="-52" stroke="${C.navy}" stroke-width="5"/>
        <line x1="-4" y1="-10" x2="-10" y2="12" stroke="${C.orange}" stroke-width="5.5"/>
        <line x1="4" y1="-10" x2="10" y2="12" stroke="${C.navy}" stroke-width="5.5"/>
      </g>
      <!-- 右侧：向下跳水 -->
      <rect x="230" y="110" width="166" height="106" fill="${C.orange}" opacity="0.14"/>
      <line x1="313" y1="98" x2="313" y2="198" stroke="${C.orange}" stroke-width="2.5" stroke-dasharray="5 4"/>
      <polygon points="313,210 306,196 320,196" fill="${C.orange}"/>
      <text x="313" y="166" text-anchor="middle" fill="${C.orange}" font-weight="800" font-size="12">下坠 · 下方留水面</text>
      <rect x="230" y="216" width="166" height="18" fill="${C.navy}"/>
      <g transform="translate(313 62) rotate(165)">
        <circle cx="0" cy="-26" r="7.5" fill="${C.navy}"/>
        <polygon points="-6,-18 6,-18 4,14 -4,14" fill="${C.navy}"/>
        <line x1="-4" y1="-16" x2="-2" y2="-38" stroke="${C.orange}" stroke-width="4.5"/>
        <line x1="4" y1="-16" x2="2" y2="-38" stroke="${C.orange}" stroke-width="4.5"/>
      </g>
    </svg>`,
  },
  depth: {
    en: "APPROACHING DEPTH",
    title: "迎面而来：前景地面就是运动空间",
    desc: "当火车、跑者或自行车正对或微斜冲向镜头，左右没有明显侧向矢量时，把前景的路面、跑道在画面下方铺开——那片前景就是它即将冲进来的纵深空间。",
    tip: "要点：压低机位、留出前方透视汇聚线，冲击感远胜硬往左右偏置。",
    svg: () => `<svg viewBox="0 0 420 250">
      <rect width="420" height="250" fill="${C.cream}"/>
      <!-- 透视跑道 -->
      <polygon points="182,86 238,86 380,250 40,250" fill="${C.navy}"/>
      <polygon points="196,126 224,126 300,250 120,250" fill="${C.orange}" opacity="0.28"/>
      <line x1="210" y1="138" x2="210" y2="232" stroke="${C.orange}" stroke-width="3" stroke-dasharray="8 6"/>
      <polygon points="210,244 202,228 218,228" fill="${C.orange}"/>
      <!-- 迎面列车几何剪影 -->
      <g transform="translate(210 108)">
        <rect x="-24" y="-36" width="48" height="44" fill="${C.navy}"/>
        <rect x="-18" y="-28" width="36" height="14" fill="${C.cream}"/>
        <rect x="-24" y="-6" width="48" height="5" fill="${C.orange}"/>
        <circle cx="-13" cy="2" r="3.5" fill="${C.cream}"/>
        <circle cx="13" cy="2" r="3.5" fill="${C.cream}"/>
      </g>
      <text x="210" y="206" text-anchor="middle" fill="${C.cream}" font-weight="800" font-size="13">前景纵深空间</text>
    </svg>`,
  },
};

function initTrajLab() {
  const stage = $("traj-stage");
  const tabs = [...document.querySelectorAll(".traj-tab")];
  if (!stage || !tabs.length) return;

  function show(k) {
    const item = TRAJS[k];
    if (!item) return;
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.traj === k)));
    stage.innerHTML = item.svg();
    $("traj-en").textContent = item.en;
    $("traj-title").textContent = item.title;
    $("traj-desc").textContent = item.desc;
    $("traj-tip").textContent = item.tip;
  }

  tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.traj)));
  show("horiz");
}

// =========================================================================
// 05 故意不留：三种反构图
// =========================================================================
const BREAKS = {
  wall: {
    title: "贴紧前边：画框变成一堵透明的墙",
    desc: "主体高速向右冲刺，鼻尖和前脚却几乎顶死右边画框，前方只剩不到 8% 的窄缝。观众的心理动量瞬间撞上边框，产生强烈的受阻、窒息与紧迫感——常用于表现走投无路或即将碰撞的瞬间。",
    warn: "注意：想用这一招，就贴得干脆利落；半吊子卡在 65% 左右，只会被看成拍慢了半拍。",
    svg: `<svg viewBox="0 0 260 150">
      <rect width="260" height="150" fill="#102542"/>
      <rect x="252" y="0" width="8" height="114" fill="${C.orange}"/>
      <line x1="16" y1="54" x2="188" y2="54" stroke="${C.cream}" stroke-width="1.4" opacity="0.24"/>
      <line x1="40" y1="74" x2="196" y2="74" stroke="${C.orange}" stroke-width="2" opacity="0.5"/>
      <rect x="0" y="114" width="260" height="36" fill="#071324"/>
      <g transform="translate(216 114) scale(0.86)">
        <polygon points="-4,-28 -24,-8 -36,0 -18,-5 3,-24" fill="${C.orange}"/>
        <polygon points="0,-28 19,-16 30,0 13,-12 -6,-25" fill="${C.cream}"/>
        <polygon points="10,-62 22,-57 7,-24 -6,-28" fill="${C.cream}"/>
        <polyline points="11,-54 -5,-44 -16,-34" fill="none" stroke="${C.cream}" stroke-width="5.5"/>
        <polyline points="18,-53 29,-42 36,-50" fill="none" stroke="${C.cream}" stroke-width="6"/>
        <circle cx="22" cy="-72" r="8.5" fill="${C.cream}"/>
      </g>
    </svg>`,
  },
  blind: {
    title: "切掉前路：制造悬念与未知盲区",
    desc: "惊悚片和动作片常用这种「短边构图」：角色一边往前急跑，镜头却把前方的路完全裁在画外。因为观众看不见两步之外有什么，哪怕画面里什么都没出现，也会本能地屏住呼吸，担心下一帧迎面撞上危险。",
    warn: "用法：当你需要观众和主角一起「两眼一抹黑」时，故意剥夺运动空间比直接拍怪物更抓人。",
    svg: `<svg viewBox="0 0 260 150">
      <rect width="260" height="150" fill="#102542"/>
      <rect x="0" y="114" width="260" height="36" fill="#071324"/>
      <!-- 盲区问号提示在画框右边缘外缘闪烁感 -->
      <line x1="242" y1="12" x2="242" y2="114" stroke="${C.orange}" stroke-width="2" stroke-dasharray="4 4"/>
      <text x="251" y="64" text-anchor="middle" fill="${C.orange}" font-weight="900" font-size="16">?</text>
      <g transform="translate(204 114) scale(0.82)">
        <polygon points="-4,-28 -22,-8 -32,0 -16,-5 3,-24" fill="${C.orange}"/>
        <polygon points="0,-28 17,-15 26,0 11,-12 -6,-25" fill="${C.cream}"/>
        <polygon points="8,-62 20,-57 7,-24 -6,-28" fill="${C.cream}"/>
        <polyline points="10,-54 -5,-44 -15,-34" fill="none" stroke="${C.cream}" stroke-width="5.5"/>
        <polyline points="17,-53 27,-42 34,-50" fill="none" stroke="${C.cream}" stroke-width="6"/>
        <circle cx="20" cy="-72" r="8.5" fill="${C.cream}"/>
      </g>
      <text x="86" y="72" text-anchor="middle" fill="${C.cream}" opacity="0.45" font-size="11" font-weight="600">身后大片空旷</text>
    </svg>`,
  },
  pursuit: {
    title: "留白全在身后：强调追兵或漫长来路",
    desc: "把整片空白留在跑者背后，观众的视线会不由自主地扫向那片空荡荡的后方——他在逃离什么？身后是不是有人马上追上？或者在长跑尾声，用身后漫长的赛道衬托他刚刚熬过的艰辛与疲惫。",
    warn: "区别：前方留白讲「希望与抵达」，后方留白讲「逃离、追迫与走过的路」。",
    svg: `<svg viewBox="0 0 260 150">
      <rect width="260" height="150" fill="#102542"/>
      <rect x="14" y="24" width="166" height="90" fill="${C.orange}" opacity="0.12"/>
      <line x1="26" y1="68" x2="174" y2="68" stroke="${C.orange}" stroke-width="2" stroke-dasharray="6 5"/>
      <polygon points="182,68 170,62 170,74" fill="${C.orange}"/>
      <rect x="0" y="114" width="260" height="36" fill="#071324"/>
      <!-- 远处追影 -->
      <circle cx="38" cy="96" r="5" fill="${C.cream}" opacity="0.28"/>
      <rect x="34" y="102" width="8" height="12" fill="${C.cream}" opacity="0.28"/>
      <g transform="translate(212 114) scale(0.84)">
        <polygon points="-4,-28 -24,-8 -34,0 -18,-5 3,-24" fill="${C.orange}"/>
        <polygon points="0,-28 18,-16 28,0 13,-12 -6,-25" fill="${C.cream}"/>
        <polygon points="10,-62 22,-57 7,-24 -6,-28" fill="${C.cream}"/>
        <polyline points="11,-54 -5,-44 -15,-34" fill="none" stroke="${C.cream}" stroke-width="5.5"/>
        <polyline points="18,-53 29,-42 36,-50" fill="none" stroke="${C.cream}" stroke-width="6"/>
        <circle cx="22" cy="-72" r="8.5" fill="${C.cream}"/>
      </g>
    </svg>`,
  },
};

function initBreakLab() {
  const btns = [...document.querySelectorAll(".break-card")];
  if (!btns.length) return;
  for (const [k, item] of Object.entries(BREAKS)) {
    const slot = $(`bk-${k}`);
    if (slot) slot.innerHTML = item.svg;
  }
  function select(k) {
    const item = BREAKS[k];
    if (!item) return;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.break === k)));
    $("bk-title").textContent = item.title;
    $("bk-desc").textContent = item.desc;
    $("bk-warn").textContent = item.warn;
  }
  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.break)));
  select("wall");
}

// =========================================================================
// 07 小练习：公路自行车冲刺跨页图
// =========================================================================
const QUIZ = {
  A: {
    x: 244,
    good: false,
    title: "再想想 · A 撞上了右框",
    text: "车手正高速向右冲刺，前轮却几乎顶死右边画框，前方几乎零留白。观众感觉像快门按晚了半秒，压迫感很强，不符合「前路开阔、画面舒展」的目标。",
  },
  B: {
    x: 150,
    good: false,
    title: "再想想 · B 居中有点平",
    text: "主体正卡在中线，前后各半。高速骑行时，居中取景既让前路偏短，又失去了方向张力，显得像摆拍而非冲刺。",
  },
  C: {
    x: 84,
    good: true,
    title: "选对了 · C 速度与前路刚刚好",
    text: "车手位于画面偏左（约 28% 处），前方打开近 60% 的开阔赛道承接高速动势，身后仍留有约 15% 的呼吸边与拖影尾流，既有速度感又舒展平衡。",
  },
  D: {
    x: 32,
    good: false,
    title: "再想想 · D 后轮贴边被切了",
    text: "虽然前方留白最大，但车手退得太过火，后轮紧贴甚至切出左边框——前面再空，主体被挤在边缘同样不舒服，还要记得留出后缘呼吸边。",
  },
};

function quizBikeSvg(cx) {
  return `<svg viewBox="0 0 300 170">
    <rect width="300" height="170" fill="${C.cream}"/>
    <polygon points="0,0 ${Math.min(280, cx + 65)},0 ${Math.max(0, cx - 45)},130 0,130" fill="${C.orange}" opacity="0.16"/>
    <!-- 速度拖线 -->
    <line x1="${cx - 90}" y1="90" x2="${cx - 32}" y2="90" stroke="${C.orange}" stroke-width="2.5" opacity="0.55"/>
    <line x1="${cx - 72}" y1="104" x2="${cx - 30}" y2="104" stroke="${C.navy}" stroke-width="1.6" opacity="0.28"/>
    <rect x="0" y="130" width="300" height="40" fill="${C.navy}"/>
    <line x1="14" y1="148" x2="286" y2="148" stroke="${C.cream}" stroke-width="1.2" stroke-dasharray="10 10" opacity="0.35"/>
    <g transform="translate(${cx} 130) scale(0.95)">
      <circle cx="-24" cy="-16" r="15" fill="none" stroke="${C.navy}" stroke-width="3.2"/>
      <circle cx="24" cy="-16" r="15" fill="none" stroke="${C.navy}" stroke-width="3.2"/>
      <path d="M-24,-16 L-2,-14 L16,-34 L24,-16 M-24,-16 L-10,-35 L-2,-14" fill="none" stroke="${C.navy}" stroke-width="3"/>
      <line x1="-10" y1="-35" x2="16" y2="-34" stroke="${C.orange}" stroke-width="3.2"/>
      <polygon points="-14,-39 10,-52 15,-43 -8,-33" fill="${C.navy}"/>
      <ellipse cx="20" cy="-51" rx="8.5" ry="6" fill="${C.navy}"/>
    </g>
  </svg>`;
}

function initQuiz() {
  const opts = [...document.querySelectorAll(".quiz-opt")];
  const verdict = $("quiz-verdict");
  if (!opts.length || !verdict) return;

  for (const [k, item] of Object.entries(QUIZ)) {
    const slot = $(`q-${k}`);
    if (slot) slot.innerHTML = quizBikeSvg(item.x);
  }

  opts.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.opt;
      const q = QUIZ[k];
      if (!q) return;
      opts.forEach((b) => {
        const active = b === btn;
        b.setAttribute("aria-pressed", String(active));
        b.classList.toggle("is-right", active && q.good);
        b.classList.toggle("is-wrong", active && !q.good);
      });
      verdict.hidden = false;
      verdict.dataset.good = String(q.good);
      $("verdict-title").textContent = q.title;
      $("verdict-text").textContent = q.good ? q.text : `${q.text} 对照 C：${QUIZ.C.text}`;
    });
  });
}

// =========================================================================
// 08 原海报大图查看器（放大 + 鼠标拖动平移 + Esc 关）
// =========================================================================
function initPosterViewer() {
  const dlg = $("viewer");
  const openBtn = $("poster-open");
  const closeBtn = $("viewer-close");
  const zoomIn = $("zoom-in");
  const zoomOut = $("zoom-out");
  const zoomVal = $("zoom-val");
  const scroll = $("viewer-scroll");
  const img = $("viewer-img");
  const poster = $("poster");
  if (!dlg || !openBtn || !poster) return;

  const levels = [1, 1.5, 2, 3];
  let idx = 0;

  function applyZoom() {
    const sw = Math.max(240, scroll.clientWidth - 32);
    const sh = Math.max(240, scroll.clientHeight - 32);
    const base = Math.min(sw, (sh * 1086) / 1448);
    img.style.width = `${Math.round(base * levels[idx])}px`;
    zoomVal.textContent = `${Math.round(levels[idx] * 100)}%`;
    zoomOut.disabled = idx === 0;
    zoomIn.disabled = idx === levels.length - 1;
  }

  openBtn.addEventListener("click", () => {
    if (!img.src) img.src = poster.currentSrc || poster.src;
    idx = 0;
    dlg.showModal();
    applyZoom();
    scroll.focus();
  });

  zoomIn.addEventListener("click", () => { idx = Math.min(levels.length - 1, idx + 1); applyZoom(); });
  zoomOut.addEventListener("click", () => { idx = Math.max(0, idx - 1); applyZoom(); });
  closeBtn.addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dlg.open) {
      e.preventDefault();
      dlg.close();
    }
  });
  dlg.addEventListener("close", () => openBtn.focus());

  let pan = null;
  scroll.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    pan = { x: e.clientX, y: e.clientY, l: scroll.scrollLeft, t: scroll.scrollTop };
    try { scroll.setPointerCapture(e.pointerId); } catch {}
    scroll.classList.add("is-panning");
  });
  scroll.addEventListener("pointermove", (e) => {
    if (!pan) return;
    scroll.scrollLeft = pan.l - (e.clientX - pan.x);
    scroll.scrollTop = pan.t - (e.clientY - pan.y);
  });
  const stopPan = () => { pan = null; scroll.classList.remove("is-panning"); };
  scroll.addEventListener("pointerup", stopPan);
  scroll.addEventListener("pointercancel", stopPan);
  addEventListener("resize", () => { if (dlg.open) applyZoom(); });
}

// 温和滚动显现（不阻塞 reduced-motion，也不遮挡任何内容）
function initReveals() {
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("js-motion");
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px 12% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

export function initFigures() {
  initRmLab();
  initSpeedLab();
  initPanLab();
  initTrajLab();
  initBreakLab();
  initQuiz();
  initPosterViewer();
  initReveals();
}

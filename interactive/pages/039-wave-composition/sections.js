// 039 波浪形构图 · 正文 01–07 节专属交互模块（相邻两节绝不重复同一交互控件）
import { loop, pixelRatio } from "../../lib/stage.js";

/* =====================================================================
   01 · 一条波，藏着四个数（四要点圆徽透视解剖）
   ===================================================================== */
const ANATOMY_DATA = {
  soft: {
    title: "柔和波动：波幅管呼吸，圆度管亲和",
    desc: "波浪之所以让人觉得舒服，核心在于峰顶与谷底的切线是平滑过渡的，不会强迫眼球急转刹车。经验上，画幅中波浪振幅控制在总高的 10%–22%、局部最大转向角低于 38°，就能在柔和与活力之间取得平衡。",
    rule: "几何判据：波幅 10%–22% · 圆弧峰顶（避免尖锐折角）",
    svg: `
      <svg viewBox="0 0 560 250" role="img" aria-label="柔和波动几何解剖图：波幅高度与峰顶平滑切线弧">
        <rect width="560" height="250" fill="#EFF9F7"/>
        <path d="M0 162 Q70 112 140 162 T280 162 T420 162 T560 162 L560 250 L0 250 Z" fill="#8ED9D7" opacity="0.35"/>
        <line x1="20" y1="162" x2="540" y2="162" stroke="#001947" stroke-opacity="0.22" stroke-dasharray="5 5"/>
        <line x1="20" y1="108" x2="540" y2="108" stroke="#04686F" stroke-opacity="0.35" stroke-dasharray="4 4"/>
        <line x1="20" y1="216" x2="540" y2="216" stroke="#04686F" stroke-opacity="0.35" stroke-dasharray="4 4"/>
        <path d="M20 162 C55 108, 105 108, 140 162 C175 216, 225 216, 260 162 C295 108, 345 108, 380 162 C415 216, 465 216, 500 162 C516 138, 530 124, 540 118" fill="none" stroke="#08A7B4" stroke-width="5" stroke-linecap="round"/>
        <path d="M298 122 Q320 96 342 122" fill="none" stroke="#FDCA33" stroke-width="5" stroke-linecap="round"/>
        <circle cx="320" cy="111" r="7" fill="#FDCA33" stroke="#001947" stroke-width="2"/>
        <line x1="265" y1="111" x2="375" y2="111" stroke="#001947" stroke-width="2" stroke-dasharray="4 3"/>
        <line x1="80" y1="108" x2="80" y2="216" stroke="#04686F" stroke-width="2"/>
        <path d="M74 116 L80 108 L86 116 M74 208 L80 216 L86 208" fill="none" stroke="#04686F" stroke-width="2"/>
        <rect x="90" y="144" width="114" height="30" rx="15" fill="#001947"/>
        <text x="147" y="164" text-anchor="middle" fill="#FFFFFF" font-size="12.5" font-weight="700">波幅 10%–22%</text>
        <rect x="255" y="42" width="150" height="32" rx="16" fill="#FDD762"/>
        <text x="330" y="63" text-anchor="middle" fill="#001947" font-size="12.5" font-weight="700">平滑圆峰 · 视线不刹车</text>
        <line x1="320" y1="74" x2="320" y2="103" stroke="#001947" stroke-width="1.5" stroke-dasharray="3 3"/>
      </svg>
    `,
  },
  rhythm: {
    title: "重复韵律：周期相等，视觉才听得见节拍",
    desc: "只有一道弯弧叫 C 形或 S 形，至少重复出现 2–3 个波长接近的完整起伏，人眼才会把它读成「节拍」。但节拍不能过密：超过 4 个以上密排高对比波峰，稳定韵律就会反转为令人发晕的条纹噪点。",
    rule: "几何判据：整幅 2.2–3.3 个周期 · 波长等距重复",
    svg: `
      <svg viewBox="0 0 560 250" role="img" aria-label="重复韵律解剖图：三个等距波长标尺">
        <rect width="560" height="250" fill="#EFF9F7"/>
        <path d="M20 175 C52 108, 108 108, 140 175 C172 225, 228 225, 260 175 C292 108, 348 108, 380 175 C412 225, 468 225, 500 175 C516 140, 530 126, 540 120" fill="none" stroke="#08A7B4" stroke-width="5" stroke-linecap="round"/>
        <line x1="80" y1="54" x2="80" y2="124" stroke="#001947" stroke-dasharray="4 4"/>
        <line x1="320" y1="54" x2="320" y2="124" stroke="#001947" stroke-dasharray="4 4"/>
        <line x1="80" y1="68" x2="320" y2="68" stroke="#04686F" stroke-width="2.5"/>
        <circle cx="80" cy="124" r="9" fill="#FDD762" stroke="#001947" stroke-width="2.2"/>
        <circle cx="320" cy="124" r="9" fill="#FDD762" stroke="#001947" stroke-width="2.2"/>
        <circle cx="200" cy="212" r="6" fill="#04686F"/>
        <circle cx="440" cy="212" r="6" fill="#04686F"/>
        <rect x="135" y="48" width="130" height="32" rx="16" fill="#001947"/>
        <text x="200" y="69" text-anchor="middle" fill="#FFFFFF" font-size="13" font-weight="700">波长 λ = 稳拍</text>
        <rect x="366" y="48" width="146" height="32" rx="16" fill="#FDD762"/>
        <text x="439" y="69" text-anchor="middle" fill="#001947" font-size="12.5" font-weight="700">重复 2–3 峰最从容</text>
      </svg>
    `,
  },
  continuity: {
    title: "节奏延续：远近浪层同频，视线一口气滑到底",
    desc: "很多波浪版式不是主波画丑了，而是叠加装饰波时画反了方向。让后景浅色波浪与前景主波保持相近波长、顺势推进，再用细虚线轻描流向，就能在没有硬箭头的情况下把视线一路送过去。",
    rule: "几何判据：多层浪势同向共频 · 错相 ≤ 25%",
    svg: `
      <svg viewBox="0 0 560 250" role="img" aria-label="节奏延续解剖图：三层同频顺势海浪叠加">
        <rect width="560" height="250" fill="#EFF9F7"/>
        <path d="M0 105 C95 65, 190 145, 285 105 C380 65, 475 145, 560 105 L560 250 L0 250 Z" fill="#8ED9D7" opacity="0.55"/>
        <path d="M0 142 C95 102, 190 182, 285 142 C380 102, 475 182, 560 142 L560 250 L0 250 Z" fill="#58C8C9" opacity="0.72"/>
        <path d="M0 182 C95 142, 190 222, 285 182 C380 142, 475 222, 560 182 L560 250 L0 250 Z" fill="#05737F"/>
        <path d="M18 122 C110 82, 200 162, 295 122 C390 82, 470 156, 544 124" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-dasharray="7 6"/>
        <circle cx="145" cy="116" r="5" fill="#FDCA33"/>
        <circle cx="380" cy="112" r="5" fill="#FDCA33"/>
        <rect x="164" y="24" width="232" height="32" rx="16" fill="#001947"/>
        <text x="280" y="45" text-anchor="middle" fill="#FFFFFF" font-size="12.5" font-weight="700">三层浪势同频错落 · 零交叉打架</text>
      </svg>
    `,
  },
  guidance: {
    title: "连续引导：波峰托起重点，波谷留出喘息",
    desc: "波浪不是纯背景花纹。原海报把三枚核心说明圆徽坐落在三座白浪波峰，把最重要的冲浪者与暖阳圆高托在右侧大海浪主峰上——波峰负责承接信息高点，波谷则空出来让画面透气。",
    rule: "几何判据：信息站与主焦点稳落波峰 · 波谷保留呼吸",
    svg: `
      <svg viewBox="0 0 560 250" role="img" aria-label="连续引导解剖图：波峰托起三站点与右侧主焦点">
        <rect width="560" height="250" fill="#EFF9F7"/>
        <circle cx="445" cy="84" r="46" fill="#FDCA33"/>
        <path d="M0 174 C55 118, 125 118, 180 174 C235 226, 295 226, 350 174 C405 118, 475 118, 560 170 L560 250 L0 250 Z" fill="#05737F"/>
        <path d="M0 174 C55 118, 125 118, 180 174 C235 226, 295 226, 350 174 C405 118, 475 118, 560 170" fill="none" stroke="#FFFFFF" stroke-width="6"/>
        <circle cx="90" cy="132" r="22" fill="#FFFFFF" stroke="#001947" stroke-width="2.2"/>
        <text x="90" y="137" text-anchor="middle" fill="#001947" font-size="12" font-weight="900">站 1</text>
        <circle cx="265" cy="212" r="7" fill="#FDCA33"/>
        <text x="265" y="236" text-anchor="middle" fill="#E8FAF8" font-size="11.5" font-weight="700">波谷呼吸</text>
        <circle cx="445" cy="132" r="24" fill="#FDD762" stroke="#001947" stroke-width="2.4"/>
        <text x="445" y="137" text-anchor="middle" fill="#001947" font-size="12" font-weight="900">主焦点</text>
        <path d="M126 116 C205 92, 315 92, 392 92" fill="none" stroke="#001947" stroke-width="2.2" stroke-dasharray="5 5"/>
        <path d="M385 86 L395 92 L385 98" fill="none" stroke="#001947" stroke-width="2.2"/>
      </svg>
    `,
  },
};

export function initAnatomy() {
  const box = document.getElementById("anatomy-svg-box");
  const cap = document.getElementById("anatomy-caption");
  const btns = [...document.querySelectorAll(".anat-card")];

  function render(key) {
    const item = ANATOMY_DATA[key] || ANATOMY_DATA.soft;
    box.innerHTML = item.svg;
    cap.innerHTML = `<h3>${item.title}</h3><p>${item.desc}</p><span class="anatomy-rule">${item.rule}</span>`;
    btns.forEach((b) => {
      const on = b.dataset.anat === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => render(b.dataset.anat)));
  render("soft");
}

/* =====================================================================
   02 · 曲线家族怎么分工（五态同画幅变形对比台）
   ===================================================================== */
const SPECTRUM_SPECS = {
  c: {
    title: "036 C 形构图：单臂半环把视线抱进怀里",
    badge: "单弧环抱",
    desc: "整条路径只弯一次、朝一侧开口，像手臂把主体圈在怀中。重心集中于弧内，不追求左右反复横渡。",
    cycle: "0.5 周期 · 零拐点",
    turn: "单一平滑大弧",
    mood: "聚拢、呵护、有焦点感",
    fit: "产品特写、人像围合",
    link: { id: "036", name: "036 C 形构图" },
    points: (t) => {
      const ang = -Math.PI * 0.72 + t * Math.PI * 1.44;
      return { x: 0.56 - Math.cos(ang) * 0.34, y: 0.50 + Math.sin(ang) * 0.34 };
    },
    focal: { x: 0.58, y: 0.50 },
    stations: [0.16, 0.50, 0.84],
  },
  s: {
    title: "037 S 形构图：只反转一次的纵深河道",
    badge: "单次反弯",
    desc: "曲率在中央翻转一次，天然适合从前景蜿蜒进远景的纵深叙事，节奏一收一放，比波浪更重前后层次。",
    cycle: "1.0 周期 · 1 处拐点",
    turn: "优雅反弯（单次翻号）",
    mood: "优雅、纵深、娓娓道来",
    fit: "风景溪谷、竖版长图故事",
    link: { id: "037", name: "037 S 形构图" },
    points: (t) => ({
      x: 0.50 - Math.sin(t * Math.PI * 2) * 0.25,
      y: 0.14 + t * 0.72,
    }),
    focal: { x: 0.50, y: 0.50 },
    stations: [0.22, 0.50, 0.78],
  },
  curve: {
    title: "038 曲线构图：不求周期，多股自由弧线交汇",
    badge: "自由柔弧",
    desc: "不强制等距重复，而是用宽窄各异的自由弧线把散落元素柔性编织，共同汇聚到一个主焦点周围。",
    cycle: "非周期 · 自由曲率",
    turn: "非对称舒展弧线",
    mood: "轻盈、柔美、有机自由",
    fit: "花艺护肤、优雅品牌海报",
    link: { id: "038", name: "038 曲线构图" },
    points: (t) => ({
      x: 0.08 + t * 0.84,
      y: 0.54 - Math.sin(t * Math.PI * 1.35 + 0.3) * 0.24 + Math.cos(t * Math.PI * 2.1) * 0.06,
    }),
    focal: { x: 0.52, y: 0.44 },
    stations: [0.20, 0.52, 0.82],
  },
  wave: {
    title: "039 波浪形构图：把多个站点串成等拍横渡的韵律流",
    badge: "本页主角",
    desc: "靠 2–3 个圆润重复的峰谷节拍，在横幅画幅上均匀托起多处站点，并顺着连绵浪势把视线温柔送往右侧主焦点。",
    cycle: "2.8 周期 · 多峰重复",
    turn: "平滑圆弧（低转角）",
    mood: "柔和、明朗、亲和连续",
    fit: "横幅、多步导览、音乐运动",
    link: null,
    points: (t) => ({
      x: 0.06 + t * 0.88,
      y: 0.58 - Math.cos(2 * Math.PI * 2.6 * (t - 0.5)) * 0.17,
    }),
    focal: { x: 0.78, y: 0.30 },
    stations: [0.16, 0.50, 0.84],
  },
  zigzag: {
    title: "040 锯齿形构图：把圆峰捏成锐角，换来紧绷冲力",
    badge: "尖角急折",
    desc: "周期与波浪接近，但把圆润峰谷全部削成尖锐折角。亲和与舒缓瞬间消失，取而代之的是尖锐、动荡与竞技冲击力。",
    cycle: "2.8 周期 · 尖角折返",
    turn: "锐角急折（高转角）",
    mood: "紧张、锋利、强烈碰撞",
    fit: "电竞赛事、警示与极限运动",
    link: { id: "040", name: "040 锯齿形构图" },
    points: (t) => {
      const c = Math.cos(2 * Math.PI * 2.6 * (t - 0.5));
      const tri = 1 - (2 / Math.PI) * Math.acos(Math.max(-1, Math.min(1, c)));
      return { x: 0.06 + t * 0.88, y: 0.58 - tri * 0.21 };
    },
    focal: { x: 0.78, y: 0.29 },
    stations: [0.16, 0.50, 0.84],
  },
};

export function initSpectrum() {
  const canvas = document.getElementById("spectrum-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const btns = [...document.querySelectorAll(".spec-btn")];
  const elTitle = document.getElementById("spec-title");
  const elBadge = document.getElementById("spec-badge");
  const elDesc = document.getElementById("spec-desc");
  const elCycle = document.getElementById("spec-stat-cycle");
  const elTurn = document.getElementById("spec-stat-turn");
  const elMood = document.getElementById("spec-stat-mood");
  const elFit = document.getElementById("spec-stat-fit");
  const elLink = document.getElementById("spec-link-row");

  const N = 80;
  let currentKey = "wave";
  let curPts = sampleSpec("wave");
  let targetPts = sampleSpec("wave");
  let curFocal = { ...SPECTRUM_SPECS.wave.focal };
  let targetFocal = { ...SPECTRUM_SPECS.wave.focal };
  let curSt = SPECTRUM_SPECS.wave.stations.map((s) => SPECTRUM_SPECS.wave.points(s));
  let targetSt = curSt.map((p) => ({ ...p }));

  function sampleSpec(key) {
    const fn = SPECTRUM_SPECS[key].points;
    return Array.from({ length: N }, (_, i) => fn(i / (N - 1)));
  }

  function updateCopy(key) {
    const d = SPECTRUM_SPECS[key];
    elTitle.textContent = d.title;
    elBadge.textContent = d.badge;
    elDesc.textContent = d.desc;
    elCycle.textContent = d.cycle;
    elTurn.textContent = d.turn;
    elMood.textContent = d.mood;
    elFit.textContent = d.fit;
    elLink.innerHTML = d.link
      ? `想深挖这种骨架？前往 <a href="https://layout.xiaoxiaodong.ai/${d.link.id}/play/" target="_blank" rel="noopener">${d.link.name}互动页 →</a>`
      : "当前正在体验 039 波浪形构图：多峰重复 + 圆润峰顶是它独一无二的组合。";
    btns.forEach((b) => {
      const on = b.dataset.spec === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function setSpec(key) {
    currentKey = key;
    targetPts = sampleSpec(key);
    targetFocal = { ...SPECTRUM_SPECS[key].focal };
    targetSt = SPECTRUM_SPECS[key].stations.map((s) => SPECTRUM_SPECS[key].points(s));
    updateCopy(key);
    ctrl.draw();
  }

  btns.forEach((b) => b.addEventListener("click", () => setSpec(b.dataset.spec)));
  updateCopy("wave");

  const ctrl = loop(canvas, (t, dt, { still }) => {
    const dpr = pixelRatio(2);
    const w = canvas.clientWidth || 560;
    const h = canvas.clientHeight || 360;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    const k = still ? 1 : Math.min(1, dt * 8.5 || 0.25);
    for (let i = 0; i < N; i++) {
      curPts[i].x += (targetPts[i].x - curPts[i].x) * k;
      curPts[i].y += (targetPts[i].y - curPts[i].y) * k;
    }
    curFocal.x += (targetFocal.x - curFocal.x) * k;
    curFocal.y += (targetFocal.y - curFocal.y) * k;
    for (let i = 0; i < 3; i++) {
      curSt[i].x += (targetSt[i].x - curSt[i].x) * k;
      curSt[i].y += (targetSt[i].y - curSt[i].y) * k;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 海雾网格纸底
    ctx.fillStyle = "#F4FBFA";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(4, 104, 111, 0.09)";
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 40; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 淡色陪衬带
    ctx.beginPath();
    curPts.forEach((p, i) => {
      const px = p.x * w, py = p.y * h;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.strokeStyle = currentKey === "zigzag" ? "rgba(196, 61, 51, 0.16)" : "rgba(8, 167, 180, 0.18)";
    ctx.lineWidth = 28;
    ctx.lineCap = "round";
    ctx.lineJoin = currentKey === "zigzag" ? "miter" : "round";
    ctx.stroke();

    // 主路径线
    ctx.beginPath();
    curPts.forEach((p, i) => {
      const px = p.x * w, py = p.y * h;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.strokeStyle = currentKey === "zigzag" ? "#B82D24" : "#05737F";
    ctx.lineWidth = 4.5;
    ctx.stroke();

    // 流动视点光珠
    if (!still) {
      const idx = Math.floor(((t * 0.35) % 1) * (N - 1));
      const gp = curPts[idx];
      ctx.fillStyle = "#FDCA33";
      ctx.beginPath();
      ctx.arc(gp.x * w, gp.y * h, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#001947";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 主焦点暖阳圆
    const fx = curFocal.x * w, fy = curFocal.y * h;
    ctx.fillStyle = "#FDCA33";
    ctx.beginPath();
    ctx.arc(fx, fy, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#001947";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#001947";
    ctx.font = '700 12px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("焦点", fx, fy);

    // 三个站点圆徽
    const labels = ["①", "②", "③"];
    curSt.forEach((p, i) => {
      const sx = p.x * w, sy = p.y * h;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(sx, sy, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = currentKey === "zigzag" ? "#B82D24" : "#04686F";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = "#001947";
      ctx.font = '700 13px "Noto Sans SC", sans-serif';
      ctx.fillText(labels[i], sx, sy + 0.5);
    });

    ctx.restore();
  });
}

/* =====================================================================
   03 · 峰圆则顺，折尖则断（深海关联场与高频视觉不适实验仪）
   ===================================================================== */
export function initAssociationLab() {
  const canvas = document.getElementById("lab-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const shapeBtns = [...document.querySelectorAll("[data-lab-shape]")];
  const freqBtns = [...document.querySelectorAll("[data-lab-freq]")];
  const elPill = document.getElementById("lab-pill");
  const elTitle = document.getElementById("lab-title");
  const elDesc = document.getElementById("lab-desc");
  const elAngle = document.getElementById("lab-angle");
  const elLink = document.getElementById("lab-link");
  const elStrain = document.getElementById("lab-strain");

  let shape = "smooth"; // smooth | blunt | jagged
  let freq = "medium";  // sparse | medium | dense

  // 固定伪随机背景干扰短线段（确定性种子，不闪烁）
  const clutter = Array.from({ length: 110 }, (_, i) => {
    const s1 = Math.sin(i * 12.9898) * 43758.5453;
    const s2 = Math.sin(i * 78.233) * 19341.21;
    const s3 = Math.sin(i * 41.13) * 9182.77;
    return {
      u: s1 - Math.floor(s1),
      v: s2 - Math.floor(s2),
      a: (s3 - Math.floor(s3)) * Math.PI,
    };
  });

  function waveY(u) {
    const cyc = freq === "sparse" ? 1.0 : freq === "medium" ? 2.6 : 6.0;
    const amp = freq === "dense" ? 0.21 : 0.23;
    const sharp = shape === "smooth" ? 0 : shape === "blunt" ? 0.48 : 0.96;
    const th = 2 * Math.PI * cyc * (u - 0.5);
    const s = Math.cos(th);
    const tri = 1 - (2 / Math.PI) * Math.acos(Math.max(-1, Math.min(1, s)));
    return 0.52 - amp * ((1 - sharp) * s + sharp * tri);
  }

  function updateReadout() {
    const isOk = shape === "smooth" && freq === "medium";
    elPill.className = `lab-status-pill ${isOk ? "is-ok" : "is-bad"}`;

    if (isOk) {
      elPill.textContent = "轮廓自动连通 · 视野舒畅（示意）";
      elTitle.textContent = "相邻短线转向平缓，大脑一瞬间把它们织成一条海浪";
      elDesc.textContent = "即使波脊由互不相连的短光段组成，只要相邻夹角小、波峰密度适中，视皮层的「关联场」（Field et al., 1993）会顺着良好连续律把它们自动串起来，眼球毫无阻力地滑过全幅。";
      elAngle.textContent = "约 11°（顺畅）";
      elLink.textContent = "高（示意）";
      elStrain.textContent = "轻松舒适（示意）";
    } else if (freq === "dense") {
      elPill.textContent = "空间频率过高 · 触发条纹不适（示意）";
      elTitle.textContent = "6 个密集高频波挤在一起，视皮层开始过载发颤";
      elDesc.textContent = "Wilkins 等人（1984）在《Brain》发表的视觉不适研究指出，高对比度、重复过密的条纹/高频周期图案容易引发眼部疲劳与轻微眩晕感。哪怕画得再整齐，太密的波浪也会丢掉亲和力。";
      elAngle.textContent = shape === "jagged" ? "约 78°（急折）" : "约 36°（急促）";
      elLink.textContent = shape === "jagged" ? "断裂（示意）" : "勉强连成密网（示意）";
      elStrain.textContent = "偏高发颤（示意）";
    } else if (shape === "jagged") {
      elPill.textContent = "峰顶转向过急 · 连续轮廓断裂（示意）";
      elTitle.textContent = "尖角处相邻线段突然大角度转向，路径被折断成碎段";
      elDesc.textContent = "当相邻定向线段的转向角大幅超过平滑阈值，视觉关联场的兴奋连接显著衰减（Field et al., 1993）。你的眼睛无法「滑」过尖峰，只能撞停、再重新起跳，这就是波浪滑向锯齿后的紧绷来源。";
      elAngle.textContent = "约 68°（断折）";
      elLink.textContent = "低 · 峰顶断裂（示意）";
      elStrain.textContent = "紧张生硬（示意）";
    } else if (shape === "blunt") {
      elPill.textContent = "峰顶微钝 · 流畅度开始打折（示意）";
      elTitle.textContent = "圆弧里混进直线折弯，律动显得犹豫卡顿";
      elDesc.textContent = "半圆半折的过渡让曲率在峰顶附近出现突变，虽未彻底断成锯齿，却失去了波浪形构图特有的顺滑呼吸。";
      elAngle.textContent = "约 34°（偏硬）";
      elLink.textContent = "中等（示意）";
      elStrain.textContent = "略显生硬（示意）";
    } else {
      elPill.textContent = "周期过疏 · 只剩一道单拱（示意）";
      elTitle.textContent = "全幅只有 1 个波，构不成重复节拍";
      elDesc.textContent = "轮廓虽然顺滑好认，但缺少第二次起伏的呼应，读者感受到的是单弧拱桥（更接近 036 C 形或 037 S 形），而不是连绵的波浪韵律。";
      elAngle.textContent = "约 6°（平缓）";
      elLink.textContent = "高 · 但缺节拍（示意）";
      elStrain.textContent = "偏平淡（示意）";
    }

    shapeBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.labShape === shape));
    freqBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.labFreq === freq));
  }

  shapeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      shape = b.dataset.labShape;
      updateReadout();
      ctrl.draw();
    }),
  );
  freqBtns.forEach((b) =>
    b.addEventListener("click", () => {
      freq = b.dataset.labFreq;
      updateReadout();
      ctrl.draw();
    }),
  );
  updateReadout();

  const ctrl = loop(canvas, (t, dt, { still }) => {
    const dpr = pixelRatio(2);
    const w = canvas.clientWidth || 560;
    const h = canvas.clientHeight || 390;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#03262D";
    ctx.fillRect(0, 0, w, h);

    // 1. 背景随机朝向短线段（对比关联场提取效果）
    ctx.strokeStyle = "rgba(142, 217, 215, 0.22)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (const c of clutter) {
      const cx = c.u * w, cy = c.v * h;
      const dx = Math.cos(c.a) * 8, dy = Math.sin(c.a) * 8;
      ctx.beginPath();
      ctx.moveTo(cx - dx, cy - dy);
      ctx.lineTo(cx + dx, cy + dy);
      ctx.stroke();
    }

    // 2. 高频过密时额外画出高对比干扰波纹层（直观呈现条纹视觉负荷）
    if (freq === "dense") {
      for (let row = -2; row <= 2; row++) {
        if (row === 0) continue;
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const u = i / 120;
          const x = u * w;
          const y = (waveY(u) + row * 0.13) * h;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(255, 156, 143, 0.34)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // 3. 当轮廓连通时显示柔和关联场光晕通道
    const smoothLink = shape === "smooth" && freq !== "dense";
    if (smoothLink) {
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const u = 0.04 + (i / 120) * 0.92;
        const x = u * w, y = waveY(u) * h;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(126, 240, 219, 0.22)";
      ctx.lineWidth = 18;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // 4. 沿波脊排布 34 根离散定向光段（模拟 Field et al. 1993 实验刺激）
    const segs = freq === "dense" ? 46 : 34;
    const pulseU = still ? 0.62 : ((t * 0.28) % 1);
    for (let i = 0; i < segs; i++) {
      const u = 0.05 + (i / (segs - 1)) * 0.90;
      const eps = 0.008;
      const x1 = (u - eps) * w, y1 = waveY(u - eps) * h;
      const x2 = (u + eps) * w, y2 = waveY(u + eps) * h;
      const cx = u * w, cy = waveY(u) * h;
      const ang = Math.atan2(y2 - y1, x2 - x1);

      // 检测是否位于尖折突变点
      const yL = waveY(u - 0.018), yC = waveY(u), yR = waveY(u + 0.018);
      const kink = Math.abs(yL + yR - 2 * yC);
      const brokenHere = shape === "jagged" && kink > 0.025;

      const nearPulse = Math.max(0, 1 - Math.abs(u - pulseU) * 7);
      const len = freq === "dense" ? 7 : 10;

      ctx.strokeStyle = brokenHere
        ? "#FF8E80"
        : nearPulse > 0.15
          ? "#FDCA33"
          : smoothLink
            ? "#7EF0DB"
            : "#A8E6E4";
      ctx.lineWidth = brokenHere ? 3.2 : 2.6 + nearPulse * 1.4;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(ang) * len, cy - Math.sin(ang) * len);
      ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
      ctx.stroke();

      if (brokenHere) {
        ctx.strokeStyle = "rgba(255, 142, 128, 0.75)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 底部简洁图注
    ctx.fillStyle = "#CBEFED";
    ctx.font = '600 12px "Noto Sans SC", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(
      shape === "jagged" ? "红圈处转向角骤增，关联场在峰顶断裂" : freq === "dense" ? "高频多行密纹叠加，视觉负荷升高" : "34 根离散短光段靠平缓转角自然连成连续波脊",
      16,
      h - 16,
    );

    ctx.restore();
  });
}

/* =====================================================================
   04 · 浪从哪里来（四时期潮汐年份卷轴与专属矢量图解）
   ===================================================================== */
const ERAS = {
  hogarth: {
    title: "1753 · 威廉·荷加斯《美的分析》与「波浪美之线」",
    p1: "英国画家兼版画家威廉·荷加斯在 1753 年出版的《美的分析》（The Analysis of Beauty）里，系统比较了七条弯曲程度递增的波浪线（waving line），指出第 4 号平缓起伏的「美之线」既不像直线那样呆板，也不像过弯的弧线那样臃肿，最能牵引目光持续游走而不生厌倦。",
    p2: "这是西方艺术史首次把「温和的波浪曲线」从直觉经验提炼为形式美学法则——今天波浪形构图强调「振幅克制、避免急折」，正是同一条直觉的延续。",
    source: '核实来源：William Hogarth, <em>The Analysis of Beauty</em> (1753), <a href="https://www.gutenberg.org/ebooks/51459" target="_blank" rel="noopener">Project Gutenberg #51459</a>。',
    svg: `
      <svg viewBox="0 0 460 280" role="img" aria-label="荷加斯七条起伏曲线对比示意，第4号柔和波浪线被高亮">
        <rect width="460" height="280" fill="#F2F9F7"/>
        <text x="24" y="34" fill="#001947" font-size="13" font-weight="900">《美的分析》1753 · 七级弯度对照（示意）</text>
        <g fill="none" stroke-linecap="round">
          <path d="M44 68 C100 66, 150 70, 210 68 C270 66, 330 70, 410 68" stroke="#8CA8B8" stroke-width="2"/>
          <path d="M44 102 C105 90, 155 114, 215 102 C275 90, 335 114, 410 102" stroke="#6B98A8" stroke-width="2.2"/>
          <path d="M44 146 C105 112, 165 180, 226 146 C288 112, 348 180, 410 146" stroke="#08A7B4" stroke-width="5.5"/>
          <path d="M44 202 C95 142, 150 262, 226 202 C300 142, 355 262, 410 202" stroke="#8CA8B8" stroke-width="2" stroke-dasharray="5 5"/>
        </g>
        <rect x="280" y="106" width="150" height="28" rx="14" fill="#FDD762"/>
        <text x="355" y="124" text-anchor="middle" fill="#001947" font-size="12" font-weight="900">适度起伏 · 美之线</text>
        <text x="44" y="254" fill="#2D536B" font-size="12">过平则僵，过弯则累——中庸起伏最耐看</text>
      </svg>
    `,
  },
  hokusai: {
    title: "约 1830–1832 · 葛饰北斋《神奈川冲浪里》的浪势焦点",
    p1: "葛饰北斋在《富岳三十六景·神奈川冲浪里》中，用多道层叠起伏的靛蓝巨浪与三艘随浪浮沉的木舟构成宏大的波浪动势。画面的视线并不停留在左侧最高的浪头，而是顺着浪脊连续的弧线一路倾泻，精准落向远景正中的富士山。",
    p2: "这种「用连续浪带建立节奏、把视觉重心压在波浪指向处」的手法，与 039 原海报里海浪托起冲浪者焦点的空间逻辑一脉相承。",
    source: '核实来源：Katsushika Hokusai, <em>Under the Wave off Kanagawa</em> (c. 1830–32), <a href="https://www.metmuseum.org/art/collection/search/45434" target="_blank" rel="noopener">The Metropolitan Museum of Art (JP1847)</a>。',
    svg: `
      <svg viewBox="0 0 460 280" role="img" aria-label="神奈川冲浪里波浪导流指向远景富士山焦点骨架图">
        <rect width="460" height="280" fill="#EFF7F6"/>
        <path d="M275 198 L322 146 L369 198 Z" fill="#001947"/>
        <path d="M308 162 L322 146 L336 162 L329 166 L322 160 L315 166 Z" fill="#FFFFFF"/>
        <path d="M20 220 C48 92, 132 58, 212 108 C166 116, 152 152, 198 178 C245 204, 340 185, 440 202 L440 264 L20 264 Z" fill="#05737F" opacity="0.86"/>
        <path d="M40 198 C82 95, 165 82, 232 126 C268 150, 290 156, 314 152" fill="none" stroke="#FDCA33" stroke-width="3.5" stroke-dasharray="7 5"/>
        <circle cx="322" cy="150" r="10" fill="none" stroke="#FDCA33" stroke-width="3"/>
        <rect x="266" y="42" width="160" height="30" rx="15" fill="#001947"/>
        <text x="346" y="61" text-anchor="middle" fill="#FFFFFF" font-size="12" font-weight="700">巨浪弧势把视线甩向远山</text>
      </svg>
    `,
  },
  bauhaus: {
    title: "1923–1926 · 格式塔良好连续律与康定斯基《点线面》",
    p1: "1923 年，心理学家马克斯·韦特海默在《格式塔理论研究 II》中提出「良好连续律」（gute Fortsetzung）：人眼天生偏向顺着曲率平滑的路线走下去，而非在交叉点急转弯。",
    p2: "三年后的 1926 年，瓦西里·康定斯基在包豪斯丛书第 9 卷《点线面》中，进一步把「波浪状曲线」剖析为水平延展中张力与松弛交替的韵律载体，区分了规则周期波的稳定秩序与自由波的情绪呼吸。",
    source: '核实来源：Max Wertheimer (1923), <a href="https://link.springer.com/article/10.1007/BF00410640" target="_blank" rel="noopener">Psychologische Forschung 4</a>；Wassily Kandinsky, <em>Point and Line to Plane</em> (1926 / 1947), <a href="https://archive.org/details/pointlinetoplane00kand" target="_blank" rel="noopener">Internet Archive</a>。',
    svg: `
      <svg viewBox="0 0 460 280" role="img" aria-label="康定斯基点线面中规则波与自由波节奏对比示意">
        <rect width="460" height="280" fill="#F2F9F7"/>
        <line x1="34" y1="100" x2="426" y2="100" stroke="#001947" stroke-opacity="0.2" stroke-dasharray="4 4"/>
        <path d="M34 100 C66 56, 98 56, 130 100 C162 144, 194 144, 226 100 C258 56, 290 56, 322 100 C354 144, 386 144, 426 100" fill="none" stroke="#001947" stroke-width="3.5"/>
        <text x="34" y="42" fill="#001947" font-size="12.5" font-weight="900">规则几何波：张力与松弛等拍交替</text>
        <line x1="34" y1="204" x2="426" y2="204" stroke="#001947" stroke-opacity="0.2" stroke-dasharray="4 4"/>
        <path d="M34 204 C70 162, 118 158, 166 204 C210 246, 260 232, 296 196 C340 152, 388 182, 426 204" fill="none" stroke="#08A7B4" stroke-width="4.5" stroke-linecap="round"/>
        <circle cx="102" cy="176" r="6" fill="#FDCA33" stroke="#001947" stroke-width="1.8"/>
        <circle cx="348" cy="176" r="8" fill="#FDCA33" stroke="#001947" stroke-width="1.8"/>
        <text x="34" y="256" fill="#04686F" font-size="12.5" font-weight="700">自由波浪线：随情绪加厚波峰，建立主次焦点</text>
      </svg>
    `,
  },
  copacabana: {
    title: "1848–1970 · 从里斯本罗西奥广场到里约科帕卡巴纳浪道",
    p1: "1848–1849 年，里斯本罗西奥广场铺上了黑白碎石拼砌的「宽海」（Mar Largo）波浪地面，用脚下的重复起伏致敬海洋。二十世纪初这一纹样传入巴西里约海滩。",
    p2: "1970 年，巴西景观建筑师罗伯托·布雷·马克思（Roberto Burle Marx）重塑全长 4 公里的科帕卡巴纳海滨长廊，他大胆把波浪转成与海岸线平行延展的巨幅律动，让行人走在其中时，波浪构图直接成为引导步履与视线的环境图形。",
    source: '核实来源：Roberto Burle Marx, Copacabana Promenade (1970), <a href="https://www.neh.gov/humanities/2016/summer/feature/roberto-burle-marx" target="_blank" rel="noopener">NEH Humanities</a>。',
    svg: `
      <svg viewBox="0 0 460 280" role="img" aria-label="科帕卡巴纳海滨大道平行连续黑白波浪石砌铺装示意">
        <rect width="460" height="280" fill="#F2F9F7"/>
        <g>
          <path d="M0 78 Q58 46 115 78 T230 78 T345 78 T460 78 L460 112 Q402 80 345 112 T230 112 T115 112 T0 112 Z" fill="#001947"/>
          <path d="M0 146 Q58 114 115 146 T230 146 T345 146 T460 146 L460 180 Q402 148 345 180 T230 180 T115 180 T0 180 Z" fill="#001947"/>
          <path d="M0 214 Q58 182 115 214 T230 214 T345 214 T460 214 L460 248 Q402 216 345 248 T230 248 T115 248 T0 248 Z" fill="#05737F"/>
        </g>
        <rect x="22" y="16" width="234" height="28" rx="14" fill="#FDD762"/>
        <text x="139" y="34" text-anchor="middle" fill="#001947" font-size="12" font-weight="900">4 公里海滨大道 · 平行连续大浪</text>
      </svg>
    `,
  },
};

export function initLineage() {
  const diag = document.getElementById("lineage-diagram");
  const text = document.getElementById("lineage-text");
  const btns = [...document.querySelectorAll(".era-btn")];

  function render(key) {
    const item = ERAS[key] || ERAS.hogarth;
    diag.innerHTML = item.svg;
    text.innerHTML = `<h3>${item.title}</h3><p>${item.p1}</p><p>${item.p2}</p><p class="lineage-source">${item.source}</p>`;
    btns.forEach((b) => {
      const on = b.dataset.era === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => render(b.dataset.era)));
  render("hogarth");
}

/* =====================================================================
   05 · 什么时候用 / 什么时候别用（三组实景版面对照镜）
   ===================================================================== */
const MIRRORS = {
  finance: {
    offBtn: "切到恰当排法",
    onBtn: "回看强塞波浪",
    offNote: "强行给数据行套上波浪底纹与高低错位，横向比对 Q1–Q4 数值时眼球不停上下跳，核对效率直接腰斩。",
    onNote: "改回严整的水平基线与等宽数字列，同比增减一眼扫清——精密核对场景就该把波浪收起来。",
    offSvg: `
      <svg viewBox="0 0 320 170" role="img" aria-label="财务报表强塞波浪导致数字错位反例">
        <rect width="320" height="170" fill="#FFF4F2"/>
        <path d="M0 54 Q80 24 160 54 T320 54 L320 96 Q240 66 160 96 T0 96 Z" fill="#F9CBC6" opacity="0.55"/>
        <text x="16" y="24" fill="#9E221B" font-size="11.5" font-weight="900">× 强塞波浪：基线上下晃动</text>
        <g font-family="JetBrains Mono, monospace" font-size="11.5" fill="#001947" font-weight="600">
          <text x="20" y="62">Q1  128.4</text>
          <text x="114" y="44">Q2  142.1</text>
          <text x="212" y="68">Q3  139.6</text>
          <text x="20" y="114">成本  84.2</text>
          <text x="114" y="96">成本  91.0</text>
          <text x="212" y="122">成本  88.5</text>
        </g>
        <path d="M22 72 Q120 42 296 76" fill="none" stroke="#B82D24" stroke-width="1.6" stroke-dasharray="4 4"/>
      </svg>
    `,
    onSvg: `
      <svg viewBox="0 0 320 170" role="img" aria-label="财务报表采用平直网格对齐的恰当排法">
        <rect width="320" height="170" fill="#F2FBF9"/>
        <text x="16" y="24" fill="#06615A" font-size="11.5" font-weight="900">✓ 恰当排法：平直行列基线</text>
        <line x1="16" y1="42" x2="304" y2="42" stroke="#001947" stroke-width="1.5"/>
        <line x1="16" y1="84" x2="304" y2="84" stroke="#001947" stroke-opacity="0.16"/>
        <line x1="16" y1="126" x2="304" y2="126" stroke="#001947" stroke-opacity="0.16"/>
        <g font-family="JetBrains Mono, monospace" font-size="11.5" fill="#001947" font-weight="600">
          <text x="20" y="68">Q1  128.4</text>
          <text x="118" y="68">Q2  142.1</text>
          <text x="216" y="68">Q3  139.6</text>
          <text x="20" y="110">成本  84.2</text>
          <text x="118" y="110">成本  91.0</text>
          <text x="216" y="110">成本  88.5</text>
        </g>
      </svg>
    `,
  },
  article: {
    offBtn: "切到恰当排法",
    onBtn: "回看强塞波浪",
    offNote: "让每一行正文跟着波浪左右缩进，眼睛每次回行都要重新寻址；只把波浪留在文章顶部题图处才不扰读。",
    onNote: "顶部用波浪分隔营造轻松开篇，下方正文老老实实左对齐，节奏感和可读性两不误。",
    offSvg: `
      <svg viewBox="0 0 320 170" role="img" aria-label="长正文随波浪缩进导致换行困难反例">
        <rect width="320" height="170" fill="#FFF4F2"/>
        <text x="16" y="24" fill="#9E221B" font-size="11.5" font-weight="900">× 正文沿波缩进：回行找不到起点</text>
        <path d="M24 42 Q56 76 28 108 T44 156" fill="none" stroke="#D44D42" stroke-width="2" stroke-dasharray="4 3"/>
        <g fill="#2D536B">
          <rect x="36" y="44" width="210" height="8" rx="4"/>
          <rect x="64" y="62" width="196" height="8" rx="4"/>
          <rect x="74" y="80" width="204" height="8" rx="4"/>
          <rect x="44" y="98" width="218" height="8" rx="4"/>
          <rect x="30" y="116" width="208" height="8" rx="4"/>
          <rect x="58" y="134" width="192" height="8" rx="4"/>
        </g>
      </svg>
    `,
    onSvg: `
      <svg viewBox="0 0 320 170" role="img" aria-label="顶部波浪题图配左对齐正文的恰当排法">
        <rect width="320" height="170" fill="#F2FBF9"/>
        <path d="M0 0 L320 0 L320 44 Q240 64 160 44 T0 44 Z" fill="#CAEDE6"/>
        <text x="16" y="26" fill="#001947" font-size="11.5" font-weight="900">✓ 题图用波浪，正文齐左缘</text>
        <line x1="24" y1="68" x2="24" y2="148" stroke="#08A7B4" stroke-width="2"/>
        <g fill="#2D536B">
          <rect x="34" y="72" width="240" height="8" rx="4"/>
          <rect x="34" y="90" width="256" height="8" rx="4"/>
          <rect x="34" y="108" width="232" height="8" rx="4"/>
          <rect x="34" y="126" width="248" height="8" rx="4"/>
          <rect x="34" y="144" width="172" height="8" rx="4"/>
        </g>
      </svg>
    `,
  },
  banner: {
    offBtn: "切到僵硬横排对比",
    onBtn: "回看波浪横幅正例",
    offNote: "三个演出时段稳坐三座柔峰，右侧主舞台借高浪抬起，整张横幅像一段可视化旋律，一眼读完且记住高潮。",
    onNote: "换成死板等高横条和方格子后，音乐季的流动松弛感立刻被磨平，看上去像一张普通物业通知栏。",
    offSvg: `
      <svg viewBox="0 0 320 170" role="img" aria-label="海岸音乐季横幅使用三峰波浪构图正例">
        <rect width="320" height="170" fill="#CAEDE6"/>
        <circle cx="256" cy="52" r="24" fill="#FDCA33"/>
        <path d="M0 108 C38 72, 74 72, 112 108 C150 144, 184 144, 222 108 C258 72, 290 72, 320 98 L320 170 L0 170 Z" fill="#05737F"/>
        <path d="M0 108 C38 72, 74 72, 112 108 C150 144, 184 144, 222 108 C258 72, 290 72, 320 98" fill="none" stroke="#FFFFFF" stroke-width="3.5"/>
        <text x="16" y="26" fill="#001947" font-size="11.5" font-weight="900">✓ 恰当正例：三峰串起日程与主舞台</text>
        <circle cx="56" cy="82" r="10" fill="#FFFFFF" stroke="#001947" stroke-width="1.6"/>
        <circle cx="166" cy="134" r="6" fill="#FDCA33"/>
        <circle cx="256" cy="84" r="11" fill="#FDD762" stroke="#001947" stroke-width="1.6"/>
        <rect x="26" y="106" width="60" height="16" rx="8" fill="#FDD762"/>
        <text x="56" y="118" text-anchor="middle" fill="#001947" font-size="9.5" font-weight="900">16:00 民谣</text>
        <rect x="220" y="108" width="72" height="16" rx="8" fill="#FDD762"/>
        <text x="256" y="120" text-anchor="middle" fill="#001947" font-size="9.5" font-weight="900">20:00 主舞台</text>
      </svg>
    `,
    onSvg: `
      <svg viewBox="0 0 320 170" role="img" aria-label="音乐季横幅改成僵硬方框失去流动感对比">
        <rect width="320" height="170" fill="#E8ECEF"/>
        <text x="16" y="26" fill="#2D536B" font-size="11.5" font-weight="900">僵硬方格：丢失音乐与海岸流动感</text>
        <rect x="18" y="48" width="88" height="94" fill="#FFFFFF" stroke="#7A8E9C"/>
        <rect x="116" y="48" width="88" height="94" fill="#FFFFFF" stroke="#7A8E9C"/>
        <rect x="214" y="48" width="88" height="94" fill="#FFFFFF" stroke="#7A8E9C"/>
        <text x="62" y="98" text-anchor="middle" fill="#001947" font-size="10.5">16:00 民谣</text>
        <text x="160" y="98" text-anchor="middle" fill="#001947" font-size="10.5">18:00 爵士</text>
        <text x="258" y="98" text-anchor="middle" fill="#001947" font-size="10.5">20:00 主舞台</text>
      </svg>
    `,
  },
};

export function initUseAvoid() {
  const states = { finance: false, article: false, banner: false };

  function renderOne(key) {
    const m = MIRRORS[key];
    const on = states[key];
    const vis = document.getElementById(`mirror-vis-${key}`);
    const note = document.getElementById(`mirror-note-${key}`);
    const btn = document.querySelector(`[data-mirror-btn="${key}"]`);
    if (!vis || !note || !btn) return;
    vis.innerHTML = on ? m.onSvg : m.offSvg;
    note.textContent = on ? m.onNote : m.offNote;
    btn.textContent = on ? m.onBtn : m.offBtn;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  Object.keys(MIRRORS).forEach((key) => {
    const btn = document.querySelector(`[data-mirror-btn="${key}"]`);
    if (btn) {
      btn.addEventListener("click", () => {
        states[key] = !states[key];
        renderOne(key);
      });
    }
    renderOne(key);
  });
}

/* =====================================================================
   06 · 挑一张最顺眼的波浪（两道严格单变量的 A/B/C/D 小练习）
   ===================================================================== */
function miniWavePath(cycles, amp, sharp, w = 260, baseY = 104) {
  const pts = [];
  for (let i = 0; i <= 72; i++) {
    const u = i / 72;
    const th = 2 * Math.PI * cycles * (u - 0.5);
    const s = Math.cos(th);
    const tri = 1 - (2 / Math.PI) * Math.acos(Math.max(-1, Math.min(1, s)));
    const y = baseY - amp * ((1 - sharp) * s + sharp * tri);
    pts.push(`${(u * w).toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
}

function makeQ1Svg(cycles, sharp) {
  const line = miniWavePath(cycles, 20, sharp, 260, 102);
  const fill = `${line} L260,160 L0,160 Z`;
  const stUs = [0.16, 0.5, 0.84];
  const dots = stUs
    .map((u) => {
      const th = 2 * Math.PI * cycles * (u - 0.5);
      const s = Math.cos(th);
      const tri = 1 - (2 / Math.PI) * Math.acos(Math.max(-1, Math.min(1, s)));
      const y = 102 - 20 * ((1 - sharp) * s + sharp * tri);
      return `<circle cx="${(u * 260).toFixed(1)}" cy="${y.toFixed(1)}" r="7.5" fill="#FFFFFF" stroke="#001947" stroke-width="1.8"/>`;
    })
    .join("");
  return `
    <svg viewBox="0 0 260 160" role="img" aria-label="波形横幅对比方案">
      <rect width="260" height="160" fill="#CAEDE6"/>
      <rect x="16" y="18" width="94" height="10" rx="5" fill="#001947"/>
      <rect x="16" y="34" width="64" height="6" rx="3" fill="#2D536B" opacity="0.65"/>
      <circle cx="212" cy="46" r="22" fill="#FDCA33"/>
      <path d="${fill}" fill="#05737F"/>
      <path d="${line}" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linejoin="${sharp > 0.5 ? "miter" : "round"}"/>
      ${dots}
    </svg>
  `;
}

function makeQ2Svg(stationCoords, focalX, focalY) {
  const line = miniWavePath(2.5, 22, 0.02, 260, 104);
  const fill = `${line} L260,160 L0,160 Z`;
  const dots = stationCoords
    .map(
      ([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="8" fill="#FFFFFF" stroke="#001947" stroke-width="1.8"/><rect x="${x - 16}" y="${y + 12}" width="32" height="7" rx="3.5" fill="#FDD762"/>`,
    )
    .join("");
  return `
    <svg viewBox="0 0 260 160" role="img" aria-label="站点相对波峰落位对比方案">
      <rect width="260" height="160" fill="#D4F2EC"/>
      <rect x="16" y="16" width="84" height="9" rx="4.5" fill="#001947"/>
      <circle cx="${focalX}" cy="${focalY}" r="20" fill="#FDCA33" stroke="#FFFFFF" stroke-width="2"/>
      <path d="${fill}" fill="#05737F"/>
      <path d="${line}" fill="none" stroke="#FFFFFF" stroke-width="3.2"/>
      ${dots}
    </svg>
  `;
}

const QUIZZES = [
  {
    prompt:
      "下面四张「海滨音乐节横幅」的配色、字号、主视觉位置与起伏高度完全一致，<strong>只改变了波形周期与峰谷转折圆度</strong>。哪一张最符合波浪形构图的柔和韵律？",
    answer: "B",
    options: [
      {
        letter: "A",
        param: "0.7 周期 · 圆弧",
        svg: makeQ1Svg(0.7, 0.02),
        reason: "方案 A 只有 0.7 个平缓单拱，缺少二次起伏的呼应，建不起波浪形构图最核心的「重复韵律」，更像拉扁的弧线拱桥。",
      },
      {
        letter: "B",
        param: "2.5 周期 · 圆弧",
        svg: makeQ1Svg(2.5, 0.02),
        reason: "答对了！方案 B 用 2.5 个圆润舒朗的完整起伏，刚好稳稳托起三枚信息圆徽，转向角平缓、呼吸从容，兼具韵律感与亲和力。",
      },
      {
        letter: "C",
        param: "5.4 周期 · 圆弧",
        svg: makeQ1Svg(5.4, 0.02),
        reason: "方案 C 把 5.4 个高频碎波挤进同一张横幅，波峰过密造成视觉发颤（高频条纹疲劳），三枚站点也与细碎起伏错拍脱节。",
      },
      {
        letter: "D",
        param: "2.5 周期 · 折角",
        svg: makeQ1Svg(2.5, 0.96),
        reason: "方案 D 虽然周期数与 B 相同，但峰谷被削成了尖锐折角——这已经滑向 040 锯齿形构图的锋利紧绷感，失去了波浪的柔和亲和。",
      },
    ],
  },
  {
    prompt:
      "进阶题：四张「三步骤茶旅导览图」使用<strong>完全相同的 2.5 周期圆润波浪</strong>，只改变了三枚信息站点与暖阳主角的落位。哪一张引导最顺畅？",
    answer: "C",
    options: [
      {
        letter: "A",
        param: "偏左挤堆",
        svg: makeQ2Svg(
          [
            [42, 86],
            [72, 114],
            [102, 112],
          ],
          208,
          56,
        ),
        reason: "方案 A 把三枚站点全挤在左侧半幅斜坡上，右侧大片波浪落空，节奏前密后散。",
      },
      {
        letter: "B",
        param: "落入波谷",
        svg: makeQ2Svg(
          [
            [78, 124],
            [182, 124],
            [232, 86],
          ],
          130,
          126,
        ),
        reason: "方案 B 让两处站点与暖阳主角都沉进了低洼波谷里，被高起的波峰挡住气势，失去了波浪托举焦点的优势。",
      },
      {
        letter: "C",
        param: "三站落峰",
        svg: makeQ2Svg(
          [
            [28, 84],
            [130, 82],
            [232, 84],
          ],
          212,
          44,
        ),
        reason: "答对了！方案 C 让三枚站点等拍坐稳三座波峰，波谷留白呼吸，暖阳主角高托于右峰上方，视线一口气从左滑到焦点。",
      },
      {
        letter: "D",
        param: "水平脱钩",
        svg: makeQ2Svg(
          [
            [48, 54],
            [130, 54],
            [212, 54],
          ],
          130,
          122,
        ),
        reason: "方案 D 的三站硬排成一条平直横线，完全不理会下方波浪的起伏节奏，波浪退化成了和内容无关的装饰贴纸。",
      },
    ],
  },
];

export function initPractice() {
  const promptEl = document.getElementById("quiz-prompt");
  const grid = document.getElementById("quiz-grid");
  const fb = document.getElementById("quiz-feedback");
  const tabs = [...document.querySelectorAll(".quiz-tab")];

  let qIndex = 0;

  function renderQuiz(idx) {
    qIndex = idx;
    const q = QUIZZES[idx];
    promptEl.innerHTML = q.prompt;
    fb.className = "quiz-feedback";
    fb.innerHTML = `<p class="quiz-placeholder">点选任意一张方案卡（方案 A / B / C / D），即时查看这一组单变量对照的构图理由。</p>`;
    tabs.forEach((t, i) => {
      t.classList.toggle("is-active", i === idx);
      t.setAttribute("aria-selected", i === idx ? "true" : "false");
    });

    grid.innerHTML = q.options
      .map(
        (opt) => `
      <button type="button" class="quiz-opt" data-opt="${opt.letter}">
        <span class="quiz-opt-head">
          <span class="quiz-letter">方案 ${opt.letter}</span>
          <span class="quiz-param">${opt.param}</span>
        </span>
        <span class="quiz-svg">${opt.svg}</span>
      </button>
    `,
      )
      .join("");

    grid.querySelectorAll(".quiz-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        const picked = btn.dataset.opt;
        const opt = q.options.find((o) => o.letter === picked);
        const ok = picked === q.answer;
        grid.querySelectorAll(".quiz-opt").forEach((b) => {
          b.classList.remove("is-picked-ok", "is-picked-bad");
          if (b.dataset.opt === picked) b.classList.add(ok ? "is-picked-ok" : "is-picked-bad");
        });
        fb.className = `quiz-feedback ${ok ? "is-ok" : "is-bad"}`;
        fb.innerHTML = `<h3>${ok ? `选对了 · 方案 ${picked}` : `再看一眼 · 你选了方案 ${picked}（正解是方案 ${q.answer}）`}</h3><p>${opt.reason}</p>`;
      });
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => renderQuiz(Number(t.dataset.quiz))));
  renderQuiz(0);
}

/* =====================================================================
   07 · 原海报放大灯箱（缩放、鼠标/触摸拖动、Esc 关闭）
   ===================================================================== */
export function initPosterLightbox() {
  const openBtn = document.getElementById("poster-open-btn");
  const poster = document.getElementById("poster");
  const box = document.getElementById("lightbox");
  const viewport = document.getElementById("lb-viewport");
  const lbImg = document.getElementById("lb-img");
  const scaleText = document.getElementById("lb-scale");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");
  if (!openBtn || !box || !poster) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function apply() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    scaleText.textContent = `${Math.round(scale * 100)}%`;
  }

  function reset() {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  }

  function open() {
    lbImg.src = poster.src;
    reset();
    box.hidden = false;
    btnClose.focus();
  }

  function close() {
    box.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnReset.addEventListener("click", reset);
  btnIn.addEventListener("click", () => {
    scale = Math.min(3.5, +(scale + 0.35).toFixed(2));
    apply();
  });
  btnOut.addEventListener("click", () => {
    scale = Math.max(0.6, +(scale - 0.35).toFixed(2));
    apply();
  });

  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.6, Math.min(3.5, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    apply();
  }, { passive: false });

  viewport.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    apply();
  });
  const endDrag = () => { dragging = false; };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
}

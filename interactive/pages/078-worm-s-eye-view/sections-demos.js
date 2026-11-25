// 078 虫视构图 · 正文 01–06 节差异化交互模块
// 相邻两节全部采用不同交互机制，绝不复用同一种控件套路：
// 01 三视角高度滑尺对比 SVG | 02 焦段×站距光学 Canvas | 03 五要点暗房排雷开关
// 04 四时期历史构图复原时间轴 | 05 四题材红黑翻牌对比仪 | 06 四图单变量练习

import { clamp, makeCamera, getSceneGeometry, faceNormal, lightShade } from "./model.js";

// =========================================================================
// 01 节：三视角权力天平（高度滑尺 0.15m 虫视 ↔ 1.65m 平视 ↔ 4.20m 俯视）
// =========================================================================
export function initSec01PerspectiveScale() {
  const slider = document.getElementById("s1-height");
  const outH = document.getElementById("s1-height-val");
  const outTitle = document.getElementById("s1-verdict-title");
  const outBody = document.getElementById("s1-verdict-body");
  const outPsych = document.getElementById("s1-psych-tag");
  const svgCam = document.getElementById("s1-cam-group");
  const svgCone = document.getElementById("s1-cone");
  const svgHz = document.getElementById("s1-horizon");
  const svgTower = document.getElementById("s1-tower");
  const svgTowerLit = document.getElementById("s1-tower-lit");
  const svgFig = document.getElementById("s1-figure");
  const svgRays = document.getElementById("s1-rays");
  const btns = [...document.querySelectorAll("[data-s1-preset]")];
  if (!slider || !svgTower) return;

  function update(hVal) {
    const h = clamp(Number(hVal), 0.15, 4.2);
    slider.value = String(h);
    outH.textContent = `${h.toFixed(2)} m`;

    // 左侧剖面图：地面 y=172，高度 0..4.2m 映射到 168..38
    const camY = 170 - (h / 4.2) * 130;
    // 视线朝主体胸口/塔身中段 (x=185, y=92)
    const ang = Math.atan2(92 - camY, 185 - 48);
    const degVal = Math.round((-ang * 180) / Math.PI);
    svgCam.setAttribute("transform", `translate(48 ${camY.toFixed(1)}) rotate(${(ang * 180 / Math.PI).toFixed(1)})`);
    const cLen = 155;
    const x1 = 48 + Math.cos(ang - 0.34) * cLen;
    const y1 = camY + Math.sin(ang - 0.34) * cLen;
    const x2 = 48 + Math.cos(ang + 0.34) * cLen;
    const y2 = camY + Math.sin(ang + 0.34) * cLen;
    svgCone.setAttribute("points", `48,${camY.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);

    // 右侧取景窗（x: 240..540, y: 16..184，中心 x=390）
    // 归一化高度因子 u: 0=虫视(0.15m), 0.37=平视(1.65m), 1=俯视(4.20m)
    const u = (h - 0.15) / (4.2 - 0.15);
    // 虫视时地平线压得很低 (y=172)，俯视时地平线升到顶部 (y=36)
    const hzY = 172 - u * 134;
    svgHz.setAttribute("y1", hzY.toFixed(1));
    svgHz.setAttribute("y2", hzY.toFixed(1));

    // 主体楼体梯形变形：虫视上窄下宽冲顶；平视近似矩形；俯视上宽下窄缩向地面
    const topHalfW = 14 + u * 44; // 14 (虫视尖锐) -> 58 (俯视宽顶)
    const botHalfW = 58 - u * 34; // 58 (虫视厚底) -> 24 (俯视窄脚)
    const topY = 24 + u * 28;
    const botY = 180 - u * 10;
    svgTower.setAttribute(
      "points",
      `${(390 - botHalfW).toFixed(1)},${botY.toFixed(1)} ${(390 + botHalfW).toFixed(1)},${botY.toFixed(1)} ${(390 + topHalfW).toFixed(1)},${topY.toFixed(1)} ${(390 - topHalfW).toFixed(1)},${topY.toFixed(1)}`
    );
    svgTowerLit.setAttribute(
      "points",
      `390,${botY.toFixed(1)} ${(390 + botHalfW).toFixed(1)},${botY.toFixed(1)} ${(390 + topHalfW).toFixed(1)},${topY.toFixed(1)} 390,${topY.toFixed(1)}`
    );

    // 透视延伸辅助线
    const vpY = u < 0.34 ? topY - 12 : u > 0.56 ? botY + 18 : topY;
    if (u < 0.34) {
      svgRays.setAttribute("d", `M${(390 - botHalfW).toFixed(1)} ${botY} L390 ${vpY.toFixed(1)} M${(390 + botHalfW).toFixed(1)} ${botY} L390 ${vpY.toFixed(1)}`);
      svgRays.style.opacity = "0.85";
    } else if (u > 0.56) {
      svgRays.setAttribute("d", `M${(390 - topHalfW).toFixed(1)} ${topY} L390 ${vpY.toFixed(1)} M${(390 + topHalfW).toFixed(1)} ${topY} L390 ${vpY.toFixed(1)}`);
      svgRays.style.opacity = "0.75";
    } else {
      svgRays.style.opacity = "0.18";
      svgRays.setAttribute("d", `M${(390 - botHalfW).toFixed(1)} ${botY} L${(390 - topHalfW).toFixed(1)} ${topY} M${(390 + botHalfW).toFixed(1)} ${botY} L${(390 + topHalfW).toFixed(1)} ${topY}`);
    }

    // 右侧前方无五官纯人物剪影（高度随视角缩放：虫视显得高大伟岸，俯视显得矮小孤立）
    const figScale = 1.24 - u * 0.56;
    const figY = 178 - u * 18;
    svgFig.setAttribute("transform", `translate(486 ${figY.toFixed(1)}) scale(${figScale.toFixed(2)})`);

    // 按钮高亮
    btns.forEach((b) => {
      const target = Number(b.dataset.s1Preset);
      b.setAttribute("aria-pressed", String(Math.abs(target - h) < 0.25));
    });

    // 文案同步单真源
    if (h <= 0.65) {
      outPsych.textContent = `仰视 +${Math.max(12, degVal)}° · 权力上移`;
      outTitle.textContent = "虫视仰拍：观众被压到地面，主体瞬间升格为巨人";
      outBody.textContent = `镜头降到 ${h.toFixed(2)} m，地平线几乎跌出画面底沿，建筑两侧边缘急剧向天顶收束。观众在生理上被迫抬头，触发「仰望高大权威」的直觉，压迫感与纪念碑气势同时拉满。`;
    } else if (h <= 2.35) {
      outPsych.textContent = `平视 ${degVal >= 0 ? "+" : ""}${degVal}° · 平等对话`;
      outTitle.textContent = "平视中立：与人眼同高，客观、亲切但缺少戏剧压迫";
      outBody.textContent = `镜头停在 ${h.toFixed(2)} m 成人视线带，建筑左右边缘基本平行，地平线落在画面中部。这适合客观纪实与亲切访谈（详见 080 平视构图），但想把寻常体量拍出震慑感，这个高度远远不够。`;
    } else {
      outPsych.textContent = `俯视 ${degVal}° · 掌控全局`;
      outTitle.textContent = "高机位俯拍：主体变矮小，注意力转向格局与位置关系";
      outBody.textContent = `镜头抬到 ${h.toFixed(2)} m 俯望，地平线升到画面上方，轮廓下窄上宽，人物在镜头里显得渺小、脆弱或被掌控。想看清街道布局与整体秩序时应转用 077 鸟瞰构图或 079 顶视构图。`;
    }
  }

  slider.addEventListener("input", () => update(slider.value));
  btns.forEach((b) => b.addEventListener("click", () => update(b.dataset.s1Preset)));
  update(0.25);
}

// =========================================================================
// 02 节：焦段 × 站距光学 Canvas 透视台（真三维实时线框 + 天顶消失点轨迹）
// =========================================================================
export function initSec02LensLab() {
  const canvas = document.getElementById("s2-canvas");
  if (!canvas) return;
  const focalBtns = [...document.querySelectorAll("[data-s2-focal]")];
  const distBtns = [...document.querySelectorAll("[data-s2-dist]")];
  const elConv = document.getElementById("s2-conv");
  const elVp = document.getElementById("s2-vp");
  const elFov = document.getElementById("s2-fov");
  const elRead = document.getElementById("s2-readout");

  const st = { focal: 16, distMode: "near" }; // near=18m 贴近墙根, far=48m 退后十步

  function draw() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.max(280, Math.round(rect.width || 560));
    const ch = Math.max(220, Math.round(rect.height || 340));
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    }
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    // 真实参数：近距墙根仰角 56°，远距退后时为了拍到整栋楼只需仰角 24°
    const pitch = st.distMode === "near" ? 56 : 24;
    const camState = { scene: "towers", height: 0.25, pitch, focal: st.focal, light: "side", clutter: false };
    const cam = makeCamera(camState, w, h);
    // 若选远距，手工替换 camDist 演示退后远拍对透视汇聚的毁灭性削弱
    const distScale = st.distMode === "far" ? 2.45 : 1.0;

    // 净白测绘图纸底（呼应 02 节极净冷石白风格，与开场暗紫形成昼夜切换！）
    ctx.fillStyle = "#180C28";
    ctx.fillRect(0, 0, w, h);

    // 网格底纹
    ctx.strokeStyle = "rgba(215, 165, 211, 0.10)";
    ctx.lineWidth = 1;
    const step = 28 * dpr;
    for (let x = step; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = step; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // 自定义距离投影函数
    const th = (pitch * Math.PI) / 180;
    const sinT = Math.sin(th), cosT = Math.cos(th);
    const camZ = 19.5 * distScale;
    const tanHalfV = 12 / st.focal;
    const tanHalfH = tanHalfV * (w / h);
    const proj = (p) => {
      const dx = p.x, dy = p.y - 0.25, dz = p.z - camZ;
      const cy = dy * cosT + dz * sinT;
      const cz = Math.max(0.3, dy * sinT - dz * cosT);
      return {
        x: (0.5 + (dx / (cz * tanHalfH)) * 0.5) * w,
        y: (0.5 - (cy / (cz * tanHalfV)) * 0.5) * h,
        z: cz,
      };
    };

    const geom = getSceneGeometry("towers");
    // 绘制三座核心塔楼的透视线框 + 半透明紫粉体块
    const buildings = geom.prisms.slice(0, 3);
    for (const pr of buildings) {
      for (const f of pr.faces) {
        const n = faceNormal(f.pts);
        const c = f.pts[0];
        if (n.x * -c.x + n.y * (0.25 - c.y) + n.z * (camZ - c.z) <= 0) continue;
        const pts = f.pts.map(proj);
        const shade = lightShade(n, "side");
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
        ctx.fillStyle = shade > 0.55 ? "rgba(235, 117, 161, 0.26)" : "rgba(116, 72, 148, 0.34)";
        ctx.fill();
        ctx.strokeStyle = pr.hero ? "#F49EC9" : "rgba(215, 165, 211, 0.55)";
        ctx.lineWidth = (pr.hero ? 1.5 : 1.0) * dpr;
        ctx.stroke();
      }
    }

    // 真实计算主塔左右棱线收敛夹角与天顶消失点高度
    const pBL = proj({ x: -4.4, y: 2.0, z: 1.2 });
    const pBR = proj({ x: 4.4, y: 2.0, z: 1.2 });
    const pTL = proj({ x: -4.05, y: 45, z: 0.6 });
    const pTR = proj({ x: 4.05, y: 45, z: 0.6 });
    const vlx = pTL.x - pBL.x, vly = pTL.y - pBL.y;
    const vrx = pTR.x - pBR.x, vry = pTR.y - pBR.y;
    const cosA = clamp((vlx * vrx + vly * vry) / ((Math.hypot(vlx, vly) || 1) * (Math.hypot(vrx, vry) || 1)), -1, 1);
    const convDeg = Math.abs(pTR.x - pTL.x) < Math.abs(pBR.x - pBL.x) ? (Math.acos(cosA) * 180) / Math.PI : 0;

    // 天顶消失点坐标（在画布坐标系里，可能高出画布上方几倍！）
    const vpNy = (cosT / sinT) / tanHalfV;
    const vpY = (0.5 - vpNy * 0.5) * h;
    const vpX = w * 0.5;
    const vpIn = vpY >= 12 * dpr && vpY <= h * 0.7;

    // 延伸左右棱线指向天顶
    ctx.save();
    ctx.strokeStyle = "#FF8AC0";
    ctx.setLineDash([5 * dpr, 4 * dpr]);
    ctx.lineWidth = 1.4 * dpr;
    const drawRay = (a, b) => {
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x + (dx / len) * h * 1.4, b.y + (dy / len) * h * 1.4);
      ctx.stroke();
    };
    drawRay(pBL, pTL);
    drawRay(pBR, pTR);
    ctx.setLineDash([]);

    if (vpIn) {
      ctx.fillStyle = "#FF7AB8";
      ctx.beginPath();
      ctx.arc(vpX, vpY, 5.5 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#F7EBF2";
      ctx.font = `500 ${Math.round(10.5 * dpr)}px "DM Mono", "Noto Sans SC", monospace`;
      if (vpY < 30 * dpr) {
        ctx.textAlign = "left";
        ctx.fillText(`ZENITH VP · y=${Math.round((vpY / h) * 100)}%`, vpX + 12 * dpr, vpY + 4 * dpr);
      } else {
        ctx.textAlign = "center";
        ctx.fillText(`ZENITH VP (画内 y=${Math.round((vpY / h) * 100)}%)`, vpX, vpY - 12 * dpr);
      }
      ctx.textAlign = "left";
    } else {
      const outsideH = Math.max(0.1, (-vpY) / h);
      ctx.fillStyle = "#FFD1E6";
      ctx.font = `500 ${Math.round(10.5 * dpr)}px "DM Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "center";
      ctx.fillText(`↑ 天顶消失点在画框上方 ${outsideH.toFixed(1)}× 屏高之外`, vpX, 22 * dpr);
    }
    ctx.restore();

    // 更新读数面板（单真源）
    const vFov = Math.round((2 * Math.atan(12 / st.focal) * 180) / Math.PI);
    elConv.textContent = `${convDeg.toFixed(1)}°`;
    elFov.textContent = `${vFov}°`;
    elVp.textContent = vpIn ? `画内顶部 ${Math.round((vpY / h) * 100)}%` : `画外上方 ${Math.max(0.1, (-vpY) / h).toFixed(1)}× 屏`;

    if (st.distMode === "near" && st.focal <= 24) {
      elRead.textContent = `贴近墙根（19.5m）配 ${st.focal}mm 广角：垂直视场宽达 ${vFov}°，天顶消失点被拽到画面近顶处，主塔棱线急剧向内收束 ${convDeg.toFixed(1)}°——这就是虫视拔地而起的光学源头。`;
    } else if (st.distMode === "near" && st.focal > 24) {
      elRead.textContent = `虽然蹲在墙根，但换上 ${st.focal}mm 镜头后视场缩窄到 ${vFov}°，天顶消失点瞬间甩出画框极远，楼顶直接冲出画框被削掉，只剩几条近乎平行的墙柱（收敛仅 ${convDeg.toFixed(1)}°）。`;
    } else if (st.distMode === "far" && st.focal <= 24) {
      elRead.textContent = `退后到 48m 远观再配 ${st.focal}mm 广角：距离一拉远，仰角被迫降到 24°，主塔缩在画面下方、收敛夹角掉到 ${convDeg.toFixed(1)}°，压迫感顿时散了大半。`;
    } else {
      elRead.textContent = `退后远观配 ${st.focal}mm 中长焦：垂直线几乎不再汇聚（仅 ${convDeg.toFixed(1)}°），整栋大楼像贴在背景纸上的平面立面——这是建筑测绘需要的平直，恰恰是虫视要避开的平淡。`;
    }
  }

  focalBtns.forEach((b) => {
    b.addEventListener("click", () => {
      st.focal = Number(b.dataset.s2Focal);
      focalBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
  });
  distBtns.forEach((b) => {
    b.addEventListener("click", () => {
      st.distMode = b.dataset.s2Dist;
      distBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
  });

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(draw).observe(canvas);
  }
  draw();
}

// =========================================================================
// 03 节：暗房五开关排雷样片（逐条验证原海报右下 5 条拍摄与设计要点）
// =========================================================================
export function initSec03FiveRules() {
  const switches = [...document.querySelectorAll("[data-s3-rule]")];
  const stage = document.getElementById("s3-stage");
  const titleEl = document.getElementById("s3-diag-title");
  const bodyEl = document.getElementById("s3-diag-body");
  const countEl = document.getElementById("s3-active-count");
  if (!switches.length || !stage) return;

  const state = { ground: true, lines: true, tall: true, sky: true, light: true };

  const OFF_EXPLAIN = {
    ground: {
      t: "缺「贴近地面」：机位太高，视线跌回平视日常",
      b: "只要站着微抬头，地平线就会占住画面中下部，建筑底座不再迎面压来，整个画面的仰望姿态立刻软掉。",
    },
    lines: {
      t: "缺「透视线引导」：垂直边缘分散，视线找不到终点",
      b: "如果没有楼角棱线、树干或道路边缘斜指向上收束，观众的眼睛会在画面底部打转，升不到最高点。",
    },
    tall: {
      t: "缺「高大/纵向主体」：把镜头贴地拍矮扁物体，只剩笨重底边",
      b: "虫视靠纵向伸展兑现张力。换成一个矮胖扁平的横盒，再低的角度也拉不出直插云霄的纵深势能。",
    },
    sky: {
      t: "缺「留白天空」：头顶塞满电线与杂云，剪影被割碎",
      b: "高耸主体需要一片干净的上方天幕承接上升动势；一旦头顶横着杂乱电线或屋檐，高大轮廓立刻被压矮泄气。",
    },
    light: {
      t: "缺「光影反差」：全平灰光让摩天楼像一层薄纸板",
      b: "虫视强调戏剧冲击，必须借强侧光或顶逆光劈出受光亮棱与深沉暗面，体量厚重感才立得住。",
    },
  };

  function sync(lastChanged) {
    let onCount = 0;
    for (const k of Object.keys(state)) {
      stage.dataset[k] = state[k] ? "on" : "off";
      if (state[k]) onCount++;
    }
    countEl.textContent = `${onCount} / 5 条开启`;
    switches.forEach((btn) => {
      const k = btn.dataset.s3Rule;
      btn.setAttribute("aria-pressed", String(state[k]));
      const tag = btn.querySelector(".s3-sw-state");
      if (tag) tag.textContent = state[k] ? "开启" : "已关";
    });

    if (onCount === 5) {
      titleEl.textContent = "五条要点齐备：原海报级虫视张力完整成立";
      bodyEl.textContent = "试着逐个关掉上面的任意一条要点——你会直接在样片里看到少了那一步，画面到底是怎么垮掉的。";
    } else if (lastChanged && !state[lastChanged]) {
      titleEl.textContent = OFF_EXPLAIN[lastChanged].t;
      bodyEl.textContent = OFF_EXPLAIN[lastChanged].b;
    } else {
      const firstOff = Object.keys(state).find((k) => !state[k]);
      titleEl.textContent = OFF_EXPLAIN[firstOff].t;
      bodyEl.textContent = OFF_EXPLAIN[firstOff].b;
    }
  }

  switches.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.s3Rule;
      state[k] = !state[k];
      sync(k);
    });
  });

  // 默认全部开启，也可点击「全关看废片」或「全部复原」
  const allOn = document.getElementById("s3-all-on");
  const allOff = document.getElementById("s3-all-off");
  allOn?.addEventListener("click", () => {
    for (const k of Object.keys(state)) state[k] = true;
    sync(null);
  });
  allOff?.addEventListener("click", () => {
    for (const k of Object.keys(state)) state[k] = false;
    sync("ground");
  });

  sync(null);
}

// =========================================================================
// 04 节：从穹顶壁画到掘地拍电影（四时期历史构图复原时间轴）
// =========================================================================
export function initSec04History() {
  const tabs = [...document.querySelectorAll("[data-s4-era]")];
  const panels = [...document.querySelectorAll("[data-s4-panel]")];
  if (!tabs.length) return;

  function select(id) {
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.s4Era === id)));
    panels.forEach((p) => {
      const active = p.dataset.s4Panel === id;
      p.hidden = !active;
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => select(t.dataset.s4Era)));
  select("1465");
}

// =========================================================================
// 05 节：在哪出彩，在哪翻车（四题材红黑诊断翻牌对比仪）
// =========================================================================
export function initSec05WhenNot() {
  const btns = [...document.querySelectorAll("[data-s5-case]")];
  const cards = [...document.querySelectorAll("[data-s5-card]")];
  if (!btns.length) return;

  function show(id) {
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s5Case === id)));
    cards.forEach((c) => {
      c.hidden = c.dataset.s5Card !== id;
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => show(b.dataset.s5Case)));
  show("portrait");
}

// =========================================================================
// 06 节：练一练 · 四张单变量仰拍草图选片（中性标签 A/B/C/D）
// =========================================================================
export function initSec06Practice() {
  const opts = [...document.querySelectorAll("[data-quiz-opt]")];
  const wrap = document.getElementById("quiz-grid");
  const titleEl = document.getElementById("quiz-v-title");
  const bodyEl = document.getElementById("quiz-v-body");
  const retryBtn = document.getElementById("quiz-retry");
  if (!opts.length || !wrap) return;

  const REASONS = {
    A: {
      ok: false,
      title: "选 A 不太稳：顶梢撞穿画框，高耸感被截断了",
      body: "A 确实贴地且用了 20mm 广角，汇聚棱线也很利落；但它只差一个变量——仰角没给够上方空间，主塔尖顶被画框顶边生硬削平。视线一路冲上去却撞了南墙，留不住冲向天空的呼吸感。正确答案是 B。",
    },
    B: {
      ok: true,
      title: "判断准确！B 是四张里唯一完整的虫视成立解",
      body: "B 贴地 0.25m、20mm 广角配合 62° 大仰角：垂直棱线急剧收束于顶部干净天幕中的天顶消失点，塔尖上方留出充足天空留白，强侧光劈开左右亮暗面，把「仰视、高耸、压迫感、戏剧性」四要素全部拉齐。",
    },
    C: {
      ok: false,
      title: "选 C 踩了焦段坑：85mm 中长焦把透视拍平了",
      body: "C 的天空留白和光影都没问题，但它为了把塔装进画面退远换成了 85mm 中长焦。结果建筑两侧边缘几乎竖直平行，缺少广角贴地带来的近大远小扩张与迎面压迫感。正确答案是 B。",
    },
    D: {
      ok: false,
      title: "选 D 被杂线和平光拖了后腿",
      body: "D 的机位、焦段和留白位置都和 B 接近，但头顶横穿了杂乱架空电线，把尖塔利落的剪影割得零碎，同时平光让楼体失去硬朗亮暗分界，戏剧张力瞬间泄气。正确答案是 B。",
    },
  };

  function pick(choice) {
    wrap.dataset.answered = "true";
    wrap.dataset.choice = choice;
    opts.forEach((b) => {
      const k = b.dataset.quizOpt;
      b.setAttribute("aria-pressed", String(k === choice));
      b.dataset.state = k === "B" ? "correct" : k === choice ? "wrong" : "dim";
    });
    const r = REASONS[choice];
    titleEl.textContent = r.title;
    bodyEl.textContent = r.body;
    titleEl.dataset.ok = String(r.ok);
    if (retryBtn) retryBtn.hidden = false;
  }

  function reset() {
    delete wrap.dataset.answered;
    delete wrap.dataset.choice;
    opts.forEach((b) => {
      b.setAttribute("aria-pressed", "false");
      delete b.dataset.state;
    });
    titleEl.textContent = "先凭第一眼直觉，点选 A / B / C / D 中最成立的一张。";
    bodyEl.textContent = "四张画的是同一座广场尖塔，每张错图只差一个关键变量。选完后，四张草图上会同时显出透视收敛线与逐项诊断。";
    delete titleEl.dataset.ok;
    if (retryBtn) retryBtn.hidden = true;
  }

  opts.forEach((b) => b.addEventListener("click", () => pick(b.dataset.quizOpt)));
  retryBtn?.addEventListener("click", reset);
}

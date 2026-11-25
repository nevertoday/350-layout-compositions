// 033 L形构图 · 正文 01–08 节交互模块（每节机制各不相同，零重复套壳）
import { loop, pixelRatio } from "../../lib/stage.js";
import { clamp } from "./model.js";

// ==================== 01 节：四步视线流路径步进器 ====================
function initAnatomy() {
  const btns = [...document.querySelectorAll("[data-step-id]")];
  const svg = document.getElementById("anatomy-svg");
  const titleEl = document.getElementById("anatomy-title");
  const textEl = document.getElementById("anatomy-text");
  if (!btns.length || !svg) return;

  const STEPS = {
    boundary: {
      title: "① 边界建立 · 先立一根竖墙，钉住入口",
      text: "眼睛扫进页面时习惯先找最实、最长的边缘。左侧竖向实体像门柱一样把视线稳稳接住并往下引，不用在空白里漫无目的乱飘。",
    },
    direction: {
      title: "② 方向延展 · 90° 拐角止滑，把视线向右送出",
      text: "视线顺着竖柱下落时，如果没有底梁接住就会直接掉出画框。底部横臂在左下角弯出一个硬朗直角，把向下的重力转成向右的叙事动线。",
    },
    voidSpace: {
      title: "③ 留白对比 · 实块压一角，换出整片呼吸舞台",
      text: "把厚重结构集中到左侧和底部，右上角自然腾出大面积净空。因为旁边有实心砖红衬着，这片空白不是「没画完」，而是最有张力的呼吸场。",
    },
    stability: {
      title: "④ 稳定支撑 · 下盘兜住重力，右上轻焦回望",
      text: "底梁像建筑基座托起整幅画面，消除单侧竖条的倾倒感；再在右上空区悬一枚小焦点，和左下实体隔空呼应，画面既稳又有上扬的轻盈感。",
    },
  };

  function select(id) {
    const item = STEPS[id];
    if (!item) return;
    svg.dataset.active = id;
    if (titleEl) titleEl.textContent = item.title;
    if (textEl) textEl.textContent = item.text;
    for (const b of btns) b.setAttribute("aria-pressed", b.dataset.stepId === id ? "true" : "false");
  }

  for (const b of btns) b.addEventListener("click", () => select(b.dataset.stepId));
  select("boundary");
}

// ==================== 02 节：Poore 杆秤与 Arnheim 重力场 2D 活体杠杆秤 ====================
function initSteelyard() {
  const canvas = document.getElementById("steelyard-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const inpL = document.getElementById("sy-l-weight");
  const inpArm = document.getElementById("sy-arm");
  const inpF = document.getElementById("sy-focus-size");
  const valL = document.getElementById("sy-l-val");
  const valArm = document.getElementById("sy-arm-val");
  const valF = document.getElementById("sy-f-val");
  const outTier = document.getElementById("sy-tier");
  const outNote = document.getElementById("sy-note");

  const st = {
    lWeight: 62, // 左侧 L 实块视觉体量（示意刻度 30..90）
    armDist: 28, // 右侧灰橄榄焦块距支点臂长（示意刻度 15..95，故意开场偏近致左倾）
    focusSize: 22, // 右侧灰橄榄焦块大小（示意刻度 12..42）
  };

  let angleCur = -0.22;
  let dragging = false;
  let cssW = 640;
  let cssH = 260;
  let dpr = 1;
  let sized = false;
  let dirtySy = true;

  function computeTorque() {
    // 左侧 L 块靠近支点（固定短臂 0.36），右侧焦点可远悬（臂长 0.15..0.95）并叠加 Arnheim 右侧视觉增重系数 1.18
    const leftM = st.lWeight * 0.36;
    const rightM = st.focusSize * (st.armDist / 100) * 1.18 * 1.35;
    const diff = rightM - leftM; // <0 左倾，>0 右倾
    const targetAngle = clamp(diff / 34, -0.30, 0.30);

    let tier = "秤平 · 杆秤平衡";
    let note = "左侧重块靠着短臂、右侧小焦挂在远臂，两头力矩刚好拉平——这就是 L 形能做到「一头厚重、一头轻盈却不歪」的秘诀。";
    if (diff < -4.2) {
      tier = "左沉下坠（示意）";
      note = "右侧焦点离支点太近或太弱，压不住左侧厚实的 L 实体，整张画面往左下角一头栽。试试把灰橄榄方块往右拖远一点。";
    } else if (diff > 4.2) {
      tier = "右重反压（示意）";
      note = "右上小焦点变得太大又挂得太远，反客为主把杠杆往右拽翻了。留白里的焦点要克制，别抢掉 L 骨架的稳重。";
    }
    return { leftM, rightM, diff, targetAngle, tier, note };
  }

  function syncText(info) {
    if (valL) valL.textContent = `${st.lWeight}（示意）`;
    if (valArm) valArm.textContent = `${st.armDist}% 臂长`;
    if (valF) valF.textContent = `${st.focusSize}（示意）`;
    if (outTier) {
      outTier.textContent = info.tier;
      outTier.dataset.ok = Math.abs(info.diff) <= 4.2 ? "true" : "false";
    }
    if (outNote) outNote.textContent = info.note;
    if (inpL) inpL.value = String(st.lWeight);
    if (inpArm) inpArm.value = String(st.armDist);
    if (inpF) inpF.value = String(st.focusSize);
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 20 || r.height < 20) return;
    const isNarrow = window.innerWidth <= 844 || matchMedia("(pointer: coarse)").matches;
    const nextDpr = pixelRatio(isNarrow ? 1.25 : 2);
    const bw = Math.round(r.width * nextDpr);
    const bh = Math.round(r.height * nextDpr);
    if (!sized || canvas.width !== bw || canvas.height !== bh || dpr !== nextDpr) {
      cssW = r.width;
      cssH = r.height;
      dpr = nextDpr;
      canvas.width = bw;
      canvas.height = bh;
      sized = true;
      dirtySy = true;
    }
  }

  function draw(_t, dt, { still }) {
    if (!sized) resize();
    const info = computeTorque();
    const settled = !dirtySy && !dragging && Math.abs(info.targetAngle - angleCur) < 0.0015;
    if (settled && !still) return;

    if (still) angleCur = info.targetAngle;
    else angleCur += (info.targetAngle - angleCur) * Math.min(1, Math.max(dt, 0.016) * 8);
    dirtySy = false;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#FAF7ED";
    ctx.fillRect(0, 0, cssW, cssH);

    // 淡参考水平虚线
    const fx = cssW * 0.40;
    const fy = cssH * 0.60;
    ctx.strokeStyle = "rgba(110, 105, 68, 0.25)";
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, fy);
    ctx.lineTo(cssW - 24, fy);
    ctx.stroke();
    ctx.setLineDash([]);

    // 支点三角基座（呼应原海报第四枚三角徽）
    ctx.fillStyle = "#262320";
    ctx.beginPath();
    ctx.moveTo(fx, fy + 2);
    ctx.lineTo(fx - 18, fy + 44);
    ctx.lineTo(fx + 18, fy + 44);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#6E6944";
    ctx.fillRect(fx - 38, fy + 44, 76, 6);

    // 旋转杠杆梁
    const leftLen = Math.min(fx - 26, cssW * 0.30);
    const rightLen = Math.min(cssW - fx - 26, cssW * 0.52);
    const balanced = Math.abs(info.diff) <= 4.2;

    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(angleCur);

    // 杠杆主体
    ctx.strokeStyle = balanced ? "#1B6648" : "#262320";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-leftLen, 0);
    ctx.lineTo(rightLen, 0);
    ctx.stroke();

    // 右侧刻度线
    ctx.strokeStyle = "rgba(38, 35, 32, 0.32)";
    ctx.lineWidth = 1.2;
    for (let k = 2; k <= 9; k++) {
      const tx = (k / 10) * rightLen;
      ctx.beginPath();
      ctx.moveTo(tx, -5);
      ctx.lineTo(tx, 5);
      ctx.stroke();
    }

    // 左侧砖红 L 实块砝码（短臂重块）
    const lx = -leftLen * 0.62;
    const lw = 28 + (st.lWeight - 30) * 0.56;
    const lh = 46 + (st.lWeight - 30) * 0.64;
    ctx.fillStyle = "#A53625";
    ctx.beginPath();
    ctx.moveTo(lx - lw * 0.45, -lh);
    ctx.lineTo(lx - lw * 0.12, -lh);
    ctx.lineTo(lx - lw * 0.12, -lh * 0.30);
    ctx.lineTo(lx + lw * 0.55, -lh * 0.30);
    ctx.lineTo(lx + lw * 0.55, -2);
    ctx.lineTo(lx - lw * 0.45, -2);
    ctx.closePath();
    ctx.fill();

    // 右侧灰橄榄焦块砝码（可横拖改变臂长）
    const rx = (st.armDist / 100) * rightLen;
    const fSide = 16 + (st.focusSize - 12) * 0.92;
    ctx.fillStyle = "#ECE4D2";
    ctx.beginPath();
    ctx.arc(rx, -fSide * 0.72 - 4, fSide * 0.96, 0, Math.PI * 2);
    ctx.fill();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = balanced ? "#1B6648" : "#6E6944";
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#6E6944";
    ctx.fillRect(rx - fSide / 2, -fSide * 1.22 - 4, fSide, fSide);

    // 拖动小提示箭
    ctx.fillStyle = "#262320";
    ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("↔ 拖焦调臂长", rx, 20);

    // 中心销钉
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = balanced ? "#1B6648" : "#A53625";
    ctx.fill();
    ctx.strokeStyle = "#FAF7ED";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 底部状态标
    ctx.fillStyle = balanced ? "#1B6648" : "#A53625";
    ctx.font = `700 12px "Space Mono", "Noto Sans SC", monospace`;
    ctx.textAlign = "right";
    ctx.fillText(balanced ? "倾角 ≈ 0° · 平衡成立" : `倾角 ${Math.round((angleCur * 180) / Math.PI)}° · 失衡`, cssW - 16, 24);
    ctx.restore();
  }

  const runner = loop(canvas, draw);
  const update = () => {
    dirtySy = true;
    syncText(computeTorque());
    runner.draw();
  };
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      resize();
      runner.draw();
    }).observe(canvas);
  }

  // 直接在画布上横拖改变右侧臂长
  const setArmFromEvent = (ev) => {
    const r = canvas.getBoundingClientRect();
    const px = ev.clientX - r.left;
    const fx = r.width * 0.40;
    const rightLen = Math.min(r.width - fx - 26, r.width * 0.52);
    const ratio = clamp((px - fx) / Math.max(40, rightLen), 0.15, 0.95);
    st.armDist = Math.round(ratio * 100);
    update();
  };
  canvas.addEventListener("pointerdown", (ev) => {
    dragging = true;
    try { canvas.setPointerCapture(ev.pointerId); } catch {}
    setArmFromEvent(ev);
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    setArmFromEvent(ev);
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  if (inpL) inpL.addEventListener("input", () => { st.lWeight = Number(inpL.value); update(); });
  if (inpArm) inpArm.addEventListener("input", () => { st.armDist = Number(inpArm.value); update(); });
  if (inpF) inpF.addEventListener("input", () => { st.focusSize = Number(inpF.value); update(); });

  update();
}

// ==================== 03 节（暗室）：90° 四向 L 方位旋转盘 ====================
function initOrientations() {
  const btns = [...document.querySelectorAll("[data-orient]")];
  const stage = document.getElementById("orient-stage");
  const titleEl = document.getElementById("orient-title");
  const descEl = document.getElementById("orient-desc");
  const stabilityEl = document.getElementById("orient-stability");
  const flowEl = document.getElementById("orient-flow");
  if (!btns.length || !stage) return;

  const DATA = {
    bl: {
      title: "标准左 L · 最顺手的阅读流与最稳的下盘",
      desc: "竖柱钉在左缘迎合从左到右的扫视习惯，底梁紧贴地心承重并向右延展，右上大留白自带舒展呼吸，是海报、摄影与网页首屏里出错率最低的基础姿态。",
      stability: "极稳 · 重心落左下底盘",
      flow: "左上进 → 左下拐 → 向右延展 → 右上回望",
    },
    br: {
      title: "镜像反 L · 回望张力与收束感",
      desc: "把实柱移到右侧、底梁向左托出，留白落在左上。当画面主角面朝左看、或者文字排版需要右侧视觉锚点压住页面时，反 L 既能稳住下盘，又制造出回望张力。",
      stability: "稳固 · 重心落右下底盘",
      flow: "左侧入空 → 沿底右行 → 右柱止步上扬",
    },
    tl: {
      title: "左上悬 L · 屋檐遮盖与悬念下探",
      desc: "横梁架到顶部，像建筑挑檐、树冠垂荫或网页顶栏加左侧边栏。因为视觉重力压在上方（阿恩海姆所说的上方更重效应），观感明显比底托更紧绷，右下大片空地则带出开阔下探感。",
      stability: "偏悬 · 上重下轻需留心压迫",
      flow: "顶横导览 → 左柱定界 → 右下开放释放",
    },
    tr: {
      title: "右上悬 L · 险峻封边与戏剧悬垂",
      desc: "重量全压在右上角——既是上方又是右侧，属于视知觉重力最重的一个角落。适合营造悬疑电影镜头、垂悬山崖或刻意制造不安与压迫的先锋海报，日常信息页慎用。",
      stability: "最险 · 右上高重力角牵拉",
      flow: "左下入空 → 视线被拉向右上重压角",
    },
  };

  function setOrient(key) {
    const d = DATA[key];
    if (!d) return;
    stage.dataset.orient = key;
    if (titleEl) titleEl.textContent = d.title;
    if (descEl) descEl.textContent = d.desc;
    if (stabilityEl) stabilityEl.textContent = d.stability;
    if (flowEl) flowEl.textContent = d.flow;
    for (const b of btns) b.setAttribute("aria-pressed", b.dataset.orient === key ? "true" : "false");
  }

  for (const b of btns) b.addEventListener("click", () => setOrient(b.dataset.orient));
  setOrient("bl");
}

// ==================== 04 节：历史源流透视滑块 ====================
function initLineage() {
  const slider = document.getElementById("lineage-xray");
  const valEl = document.getElementById("lineage-xray-val");
  const grid = document.getElementById("lineage-grid");
  if (!slider || !grid) return;

  const apply = () => {
    const v = Number(slider.value);
    grid.style.setProperty("--xray", (v / 100).toFixed(2));
    if (valEl) valEl.textContent = `${v}%`;
  };
  slider.addEventListener("input", apply);
  apply();
}

// ==================== 05 节：四场景模拟成品 + 骨架透视开关 ====================
function initApplications() {
  const tabs = [...document.querySelectorAll("[data-app-case]")];
  const stage = document.getElementById("app-preview");
  const toggleBtn = document.getElementById("app-xray-btn");
  const captionEl = document.getElementById("app-caption");
  if (!tabs.length || !stage) return;

  const CAPTIONS = {
    poster: "展讯海报：左侧竖排粗黑主题字钉住版面左缘，底部贯通展期与场馆横带，右上留白让展品雕塑独自呼吸。",
    photo: "建筑与静物摄影：用前景门框或树干作左柱，石阶/桌面沿底横延，人物侧影或远景孤塔放在右上净空里。",
    web: "网页首屏：桌面端左侧竖排导览与主标形成稳定支点，底沿核心指标条托底，右上大面积留给产品演示与呼吸空地。",
    product: "商品主图：瓶身或高器皿立在左侧偏三分线，底部自然阴影与托盘向右延伸，右上干净浅底直接承载简短卖点。",
  };

  function pick(key) {
    stage.dataset.case = key;
    if (captionEl) captionEl.textContent = CAPTIONS[key] || "";
    for (const t of tabs) t.setAttribute("aria-pressed", t.dataset.appCase === key ? "true" : "false");
  }

  for (const t of tabs) t.addEventListener("click", () => pick(t.dataset.appCase));
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const next = stage.dataset.xray !== "true";
      stage.dataset.xray = next ? "true" : "false";
      toggleBtn.setAttribute("aria-pressed", next ? "true" : "false");
      toggleBtn.textContent = next ? "隐藏砖红 L 骨架" : "透视隐藏的 L 骨架";
    });
  }
  pick("poster");
}

// ==================== 06 节：什么时候别用 · 强套 L vs 换对骨架对照 ====================
function initWhenNot() {
  const caseBtns = [...document.querySelectorAll("[data-break-case]")];
  const modeBtns = [...document.querySelectorAll("[data-break-mode]")];
  const stage = document.getElementById("break-stage");
  const noteEl = document.getElementById("break-note");
  if (!caseBtns.length || !stage) return;

  let curCase = "symmetry";
  let curMode = "forced";

  const NOTES = {
    symmetry: {
      forced: "强套 L 形：把本该居中倒映的古建牌楼硬塞到左下角，中轴对称被一刀劈歪，看起来像相机拿偏了。",
      right: "换回中轴对称：牌楼与水中倒影稳居中央，建筑的庄严仪式感立刻回到画面里。",
    },
    dialogue: {
      forced: "强套 L 形：两位地位平等的受访者被一高一低拆成左柱和右上小点，视觉上变成了主从压迫。",
      right: "换回双栏对峙：两人体量与留白平权分立左右，对话的平等张力一目了然。",
    },
    river: {
      forced: "强套 L 形：蜿蜒奔流的山路河道被硬切成死板的 90° 拐角，流动感在角落里瞬间急刹。",
      right: "换回 S 形曲线：顺着地势自然盘旋进深，把观众的视线顺滑地一路带向远山。",
    },
  };

  function render() {
    stage.dataset.case = curCase;
    stage.dataset.mode = curMode;
    if (noteEl) noteEl.textContent = NOTES[curCase][curMode];
    for (const b of caseBtns) b.setAttribute("aria-pressed", b.dataset.breakCase === curCase ? "true" : "false");
    for (const b of modeBtns) b.setAttribute("aria-pressed", b.dataset.breakMode === curMode ? "true" : "false");
  }

  for (const b of caseBtns) b.addEventListener("click", () => { curCase = b.dataset.breakCase; render(); });
  for (const b of modeBtns) b.addEventListener("click", () => { curMode = b.dataset.breakMode; render(); });
  render();
}

// ==================== 07 节：练一练 · 四张只差单变量的海岸灯塔草图 ====================
function initPractice() {
  const btns = [...document.querySelectorAll("[data-quiz]")];
  const grid = document.getElementById("quiz-grid");
  const titleEl = document.getElementById("quiz-verdict-title");
  const textEl = document.getElementById("quiz-verdict-text");
  if (!btns.length || !grid) return;

  const VERDICTS = {
    A: {
      ok: false,
      title: "A 没成立 · 左侧灯塔柱过肥（占宽 46%），把海天留白挤瘪了",
      text: "实心竖体吃掉近半画面时，右上天空只剩一道窄缝，远帆贴在画框边上喘不过气。「左强右空」的前提是实与空拉开呼吸反差，而不是左墙堵满屏幕。",
    },
    B: {
      ok: true,
      title: "答对了，B 最成立 · 左柱立稳、底堤延展、右上净空托住远帆",
      text: "灯塔占宽约 24% 稳立左边界，防波堤沿底延伸 84% 托住重力并把视线向右送出，右上大片净空里远海小帆正好在杆秤平衡位上回望，四条要点同时过关。",
    },
    C: {
      ok: false,
      title: "C 差一口气 · 底防波堤在 44% 处半途截断，失去方向延展",
      text: "左灯塔的粗细和右上天空都不错，但底部横堤只走了一小截就嘎然而止。视线顺着灯塔滑下来后半路踩空，右侧底部发虚，缺少 L 形底梁的承托与送出感。",
    },
    D: {
      ok: false,
      title: "D 没成立 · 右上留白被浓云杂礁塞满，留白对比塌了",
      text: "灯塔与防波堤构成的 L 骨架本身很标准，但右上空区被重云和杂石填得满满当当，远帆焦点直接被杂影吞没，失去了 L 形最宝贵的实空呼吸反差。",
    },
  };

  for (const b of btns) {
    b.addEventListener("click", () => {
      const pick = b.dataset.quiz;
      const v = VERDICTS[pick];
      if (!v) return;
      grid.dataset.answered = "true";
      grid.dataset.picked = pick;
      for (const btn of btns) {
        btn.setAttribute("aria-pressed", btn === b ? "true" : "false");
        btn.dataset.state = btn.dataset.quiz === "B" ? "correct" : btn === b ? "wrong" : "muted";
      }
      if (titleEl) {
        titleEl.textContent = v.title;
        titleEl.dataset.ok = v.ok ? "true" : "false";
      }
      if (textEl) textEl.textContent = v.text;
    });
  }
}

// ==================== 08 节：原海报放大灯箱（支持缩放、鼠标/触摸拖动、Esc 关） ====================
function initPosterLightbox() {
  const openBtn = document.getElementById("poster-open");
  const dialog = document.getElementById("poster-modal");
  const closeBtn = document.getElementById("poster-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  const stage = document.getElementById("poster-modal-stage");
  const img = document.getElementById("poster-modal-img");
  const posterSrc = document.getElementById("poster");
  if (!openBtn || !dialog || !img || !posterSrc) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragId = null;
  let startX = 0;
  let startY = 0;

  const applyTransform = () => {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomResetBtn) zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
  };

  const open = () => {
    img.src = posterSrc.currentSrc || posterSrc.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.showModal();
    openBtn.setAttribute("aria-expanded", "true");
  };

  const close = () => {
    if (dialog.open) dialog.close();
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  };

  openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  dialog.addEventListener("cancel", (ev) => {
    ev.preventDefault();
    close();
  });
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && dialog.open) {
      ev.preventDefault();
      close();
    }
  });
  dialog.addEventListener("click", (ev) => {
    if (ev.target === dialog) close();
  });

  if (zoomInBtn) zoomInBtn.addEventListener("click", () => { scale = clamp(scale + 0.35, 1, 3); applyTransform(); });
  if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => { scale = clamp(scale - 0.35, 1, 3); if (scale === 1) { tx = 0; ty = 0; } applyTransform(); });
  if (zoomResetBtn) zoomResetBtn.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  if (stage) {
    stage.addEventListener("wheel", (ev) => {
      ev.preventDefault();
      scale = clamp(scale + (ev.deltaY < 0 ? 0.2 : -0.2), 1, 3);
      if (scale === 1) { tx = 0; ty = 0; }
      applyTransform();
    }, { passive: false });

    stage.addEventListener("pointerdown", (ev) => {
      if (scale <= 1) return;
      dragId = ev.pointerId;
      startX = ev.clientX - tx;
      startY = ev.clientY - ty;
      try { stage.setPointerCapture(ev.pointerId); } catch {}
    });
    stage.addEventListener("pointermove", (ev) => {
      if (ev.pointerId !== dragId) return;
      tx = clamp(ev.clientX - startX, -420, 420);
      ty = clamp(ev.clientY - startY, -520, 520);
      applyTransform();
    });
    const end = (ev) => {
      if (ev.pointerId !== dragId) return;
      dragId = null;
      try { stage.releasePointerCapture(ev.pointerId); } catch {}
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
  }
}

export function initSections() {
  initAnatomy();
  initSteelyard();
  initOrientations();
  initLineage();
  initApplications();
  initWhenNot();
  initPractice();
  initPosterLightbox();
}

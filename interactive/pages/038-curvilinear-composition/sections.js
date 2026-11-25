// 038 曲线构图 · 正文 01–07 节全部独立交互装置（相邻两节绝不复用同一种控件）
import { loop, pixelRatio } from "../../lib/stage.js";
import { getMedallion, onMedallionReady } from "./medallion.js";

const lerp = (a, b, t) => a + (b - a) * t;

// =========================================================================
// 01 节：尖角 → 曲线连续变形观测台（器物 / 拱廊 / 界面卡片三联对照）
// =========================================================================
function initSection01Morph() {
  const slider = document.getElementById("s1-morph-range");
  const valEl = document.getElementById("s1-morph-val");
  const readTitle = document.getElementById("s1-read-title");
  const readBody = document.getElementById("s1-read-body");
  const readTag = document.getElementById("s1-read-tag");
  const vasePath = document.getElementById("s1-vase-path");
  const archPath = document.getElementById("s1-arch-path");
  const uiCardA = document.getElementById("s1-ui-a");
  const uiCardB = document.getElementById("s1-ui-b");
  const uiPill = document.getElementById("s1-ui-pill");
  const buttons = [...document.querySelectorAll("[data-s1-jump]")];
  if (!slider || !vasePath) return;

  function updateMorph(pct) {
    const t = pct / 100;
    if (valEl) valEl.textContent = `${pct}%`;

    // 1) 器物轮廓：t=0 尖折菱瓶 → t=1 浑圆陶瓶（平滑插值控制点）
    const cTop = lerp(42, 70, t);
    const bellyX = lerp(98, 96, t);
    const cBelly = lerp(0, 34, t);
    vasePath.setAttribute(
      "d",
      `M 58,28 L 82,28 L ${lerp(82, 79, t)},48 C ${lerp(82, 82, t)},${lerp(48, 56, t)} ${bellyX},${lerp(72, 62, t)} ${bellyX},86 C ${bellyX},${86 + cBelly} ${lerp(82, 86, t)},${lerp(122, 124, t)} 82,126 L 58,126 C ${lerp(58, 54, t)},${lerp(122, 124, t)} ${140 - bellyX},${86 + cBelly} ${140 - bellyX},86 C ${140 - bellyX},${lerp(72, 62, t)} ${lerp(58, 58, t)},${lerp(48, 56, t)} ${lerp(58, 61, t)},48 Z`
    );
    void cTop;

    // 2) 建筑门廊：t=0 折角尖顶 → t=1 柔和半圆拱廊
    const apexY = lerp(24, 34, t);
    const shY = lerp(64, 72, t);
    const ctrlX = lerp(34, 34, t);
    const ctrlY = lerp(64, 24, t);
    archPath.setAttribute(
      "d",
      `M 34,126 L 34,${shY} C ${ctrlX},${ctrlY} ${lerp(70, 50, t)},${apexY} 70,${apexY} C ${lerp(70, 90, t)},${apexY} ${140 - ctrlX},${ctrlY} 106,${shY} L 106,126`
    );

    // 3) 界面卡片与按钮：圆角半径 0 → 22
    const rxCard = (t * 20).toFixed(1);
    const rxPill = (t * 14).toFixed(1);
    if (uiCardA) {
      uiCardA.setAttribute("rx", rxCard);
      uiCardA.setAttribute("ry", rxCard);
    }
    if (uiCardB) {
      uiCardB.setAttribute("rx", rxCard);
      uiCardB.setAttribute("ry", rxCard);
    }
    if (uiPill) {
      uiPill.setAttribute("rx", rxPill);
      uiPill.setAttribute("ry", rxPill);
    }

    if (pct < 28) {
      if (readTag) {
        readTag.textContent = "尖角警觉段（示意）";
        readTag.dataset.tone = "sharp";
      }
      if (readTitle) readTitle.textContent = "转折陡峭，大脑潜意识先拉起戒备";
      if (readBody) {
        readBody.textContent =
          "巴尔与内塔（2007）脑成像实验发现，哪怕只是日常家具或器物，一旦换成尖锐折角，杏仁核激活度会明显高于圆润曲线轮廓。这种轮廓适合表达锐利与警示，却不适合营造松弛感。";
      }
    } else if (pct < 70) {
      if (readTag) {
        readTag.textContent = "刚柔过渡段（示意）";
        readTag.dataset.tone = "mid";
      }
      if (readTitle) readTitle.textContent = "棱角磨圆，清晰秩序与亲和感同时成立";
      if (readBody) {
        readBody.textContent =
          "适度圆弧消解了突兀停顿，同时保留了可辨识的结构边界。大多数日常产品界面与品牌海报都落在这个区间：眼睛走得顺，信息边界也不糊。";
      }
    } else {
      if (readTag) {
        readTag.textContent = "柔弧亲和段（示意）";
        readTag.dataset.tone = "curve";
      }
      if (readTitle) readTitle.textContent = "轮廓连续流动，审美愉悦升至高位";
      if (readBody) {
        readBody.textContent =
          "瓦尔塔尼安等（2013）与贝尔塔米尼等（2016）均证实，光滑曲线本身带有正向审美吸引力；但也要记住 2013 研究的另一半结论——好看并不自动等于效率更高，数据密集页面仍需直线托底。";
      }
    }

    buttons.forEach((b) => b.classList.toggle("is-active", Math.abs(Number(b.dataset.s1Jump) - pct) <= 6));
  }

  slider.addEventListener("input", () => updateMorph(Number(slider.value)));
  buttons.forEach((b) => {
    b.addEventListener("click", () => {
      slider.value = b.dataset.s1Jump;
      updateMorph(Number(b.dataset.s1Jump));
    });
  });
  updateMorph(Number(slider.value));
}

// =========================================================================
// 02 节：年代文献切换 + 康定斯基力学演示画布（单恒力 vs 交替折力 vs 复合变力）
// =========================================================================
const ERA_ITEMS = [
  {
    year: "1893",
    who: "维克多·奥塔 · 塔塞尔公馆（布鲁塞尔）",
    work: "Hôtel Tassel · 新艺术运动建筑起点",
    desc: "奥塔把裸露铸铁立柱、阶梯栏杆与墙面彩绘拧成连绵起伏的植物「鞭梢曲线」（whiplash curve），让建筑第一次摆脱直角墙体的隔断，用一条连续曲线贯通室内空间与光线。",
    forceMode: "curve",
    source: "UNESCO 世界遗产名录第 1005 号（2000 年列入）",
  },
  {
    year: "1894",
    who: "阿尔丰斯·穆夏 · 《吉斯蒙达》剧场海报",
    work: "Gismonda · 平面多股曲线编排典范",
    desc: "在这幅轰动巴黎的石版画海报里，穆夏用一条拱形大光环、垂坠衣褶与缠绕藤蔓组成多股粗细不一的曲线流，把观众视线从修长竖幅底端一路托举到主角脸庞——正是「曲线方向、粗细、终点落焦」的早期平面样本。",
    forceMode: "curve",
    source: "穆夏基金会官方目录档案（Object 161）",
  },
  {
    year: "1926",
    who: "瓦西里·康定斯基 · 《点、线、面》",
    work: "Punkt und Linie zu Fläche · 包豪斯丛书第 9 卷",
    desc: "康定斯基把「线」定义为点在外力推动下的轨迹：单一恒力拉出冷静克制的直线，两股交替外力折出紧绷锐利的折线，而同时持续作用、强弱不断消长的复合外力，才压出充满弹性与抒情张力的自由曲线。",
    forceMode: "angle",
    source: "古根海姆出版档案 / MoMA 1928 版馆藏记录",
  },
  {
    year: "2006–2007",
    who: "莫舍·巴尔 & 迈塔尔·内塔 · 视觉心理学与 fMRI 实验",
    work: "Psychological Science (2006) & Neuropsychologia (2007)",
    desc: "两位研究者先在行为实验里证实人类对日常物品与抽象图形普遍偏好圆润曲线胜过尖角；次年再用功能磁共振发现，尖角轮廓会更强地激活负责威胁预警的杏仁核，为「曲线比直线更温柔、减轻视觉压力」提供了脑科学注脚。",
    forceMode: "straight",
    source: "PubMed PMID 16913943 / PMID 17462678",
  },
  {
    year: "2013 & 2016",
    who: "瓦尔塔尼安等 (PNAS) & 贝尔塔米尼等 (BJP)",
    work: "室内建筑神经美学 & 曲线正向吸引修正",
    desc: "2013 年脑成像研究发现曲线室内空间更常被评为美，且专门激活关联情绪奖赏的前扣带皮层；2016 年实验则进一步证明，就算拿掉尖角、只把曲线与纯直线相比，人眼依旧主动偏爱曲线——曲线的魅力不仅因为「无害」，更来自平滑连续本身的愉悦。",
    forceMode: "curve",
    source: "PNAS 110(Suppl 2):10446–10453 / Brit. J. Psychol. 107(1):154–178",
  },
];

function initSection02History() {
  const eraBtns = [...document.querySelectorAll("[data-era]")];
  const forceBtns = [...document.querySelectorAll("[data-force]")];
  const canvas = document.getElementById("s2-force-canvas");
  const titleEl = document.getElementById("s2-era-title");
  const workEl = document.getElementById("s2-era-work");
  const descEl = document.getElementById("s2-era-desc");
  const srcEl = document.getElementById("s2-era-source");
  const forceCaption = document.getElementById("s2-force-caption");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let mode = "curve"; // "straight" | "angle" | "curve"
  const CAPTIONS = {
    straight: "单一恒力水平推动：方向不变，轨迹笔直冷静、零弹性，视觉重心像尺子一样直去直回。",
    angle: "两股外力轮番打断：每到节点就急停转向，折角积聚尖锐张力，视线反复遭遇急刹车。",
    curve: "两股持续施压的变力同时拉扯：前进中曲率连续起伏，没有一处硬折，形成自由呼吸的有机曲线。",
  };

  function selectEra(idx) {
    const item = ERA_ITEMS[idx];
    if (!item) return;
    eraBtns.forEach((b, i) => {
      b.classList.toggle("is-active", i === idx);
      b.setAttribute("aria-selected", String(i === idx));
    });
    if (titleEl) titleEl.textContent = `${item.year} · ${item.who}`;
    if (workEl) workEl.textContent = item.work;
    if (descEl) descEl.textContent = item.desc;
    if (srcEl) srcEl.textContent = item.source;
    selectForce(item.forceMode);
  }

  function selectForce(m) {
    mode = m;
    forceBtns.forEach((b) => {
      const on = b.dataset.force === m;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (forceCaption) forceCaption.textContent = CAPTIONS[m];
    stage.draw();
  }

  let phase = 0;
  function drawForce(t, dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = pixelRatio(2);
    const pw = Math.round(rect.width * dpr);
    const ph = Math.round(rect.height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = rect.width;
    const H = rect.height;

    if (!still) phase = (phase + dt * 0.28) % 1;
    const pNow = still ? 0.68 : phase;

    ctx.fillStyle = "#FFF9F4";
    ctx.fillRect(0, 0, W, H);

    // 淡参考基线
    ctx.strokeStyle = "rgba(75, 9, 11, 0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(24, H * 0.52);
    ctx.lineTo(W - 24, H * 0.52);
    ctx.stroke();
    ctx.setLineDash([]);

    // 构造 80 点轨迹
    const pts = [];
    const N = 80;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = lerp(34, W - 34, u);
      let y = H * 0.52;
      if (mode === "angle") {
        // 3 段锐利锯齿折线
        const seg = u * 3;
        if (seg < 1) y = lerp(H * 0.66, H * 0.26, seg);
        else if (seg < 2) y = lerp(H * 0.26, H * 0.78, seg - 1);
        else y = lerp(H * 0.78, H * 0.34, seg - 2);
      } else if (mode === "curve") {
        // 连续变曲率自由曲线（非单调正弦，带疏密起伏）
        y = H * 0.52 - Math.sin(u * Math.PI * 1.85) * (H * 0.28) * (0.55 + 0.45 * Math.cos(u * Math.PI * 0.9));
      }
      pts.push({ x, y });
    }

    // 绘制已走过的实轨迹与未走虚轨迹
    const cut = Math.max(2, Math.floor(pNow * N));
    ctx.beginPath();
    pts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.strokeStyle = "rgba(238, 135, 110, 0.34)";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i <= cut; i++) {
      const pt = pts[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.strokeStyle = "#4B090B";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.lineJoin = mode === "angle" ? "miter" : "round";
    ctx.stroke();

    // 动点与施力箭头（展示康定斯基「力驱动点」）
    const cur = pts[cut];
    const prev = pts[Math.max(0, cut - 2)];
    const tx = cur.x - prev.x;
    const ty = cur.y - prev.y;
    const tl = Math.hypot(tx, ty) || 1;
    // 前进推力箭头（酒红）
    const fx2 = cur.x + (tx / tl) * 34;
    const fy2 = cur.y + (ty / tl) * 34;
    ctx.strokeStyle = "#B33324";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cur.x, cur.y);
    ctx.lineTo(fx2, fy2);
    ctx.stroke();

    // 侧向变力箭头（曲线态连续施压、折线态在拐点突冲）
    if (mode !== "straight") {
      const sideForce =
        mode === "curve"
          ? Math.cos(pNow * Math.PI * 1.85) * 36
          : pNow < 0.34
            ? -26
            : pNow < 0.67
              ? 32
              : -26;
      ctx.strokeStyle = "#EE876E";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cur.x, cur.y);
      ctx.lineTo(cur.x, cur.y + sideForce);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 核心运动点
    ctx.beginPath();
    ctx.arc(cur.x, cur.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#4B090B";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cur.x, cur.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#FDF3E8";
    ctx.fill();
  }

  const stage = loop(canvas, drawForce);
  eraBtns.forEach((b, i) => b.addEventListener("click", () => selectEra(i)));
  forceBtns.forEach((b) => b.addEventListener("click", () => selectForce(b.dataset.force)));
  selectEra(0);
}

// =========================================================================
// 03 节（深酒红暗室）：3×3 粗细对比 × 间距韵律 质感标本矩阵
// =========================================================================
const MATRIX_INFO = {
  "0-0": { title: "同粗 + 挤撞贴死", grade: "窒息粘连", ratio: "1.0×", neg: "28%", text: "三条线一样粗又贴死在一起，画面瞬间变成厚重胶带墙，主次与呼吸感全被吃光。" },
  "0-1": { title: "同粗 + 平行死轨", grade: "机械死板", ratio: "1.0×", neg: "52%", text: "像高速路三条等宽车道，虽然不拥挤，却完全没有轻重起伏与有机生命力。" },
  "0-2": { title: "同粗 + 渐收呼吸", grade: "有疏密缺主次", ratio: "1.1×", neg: "66%", text: "间距终于拉开呼吸感，但每条丝带同样粗细，视线不知道该先跟哪一条走。" },
  "1-0": { title: "主粗副细 + 挤撞贴死", grade: "主次在但太憋", ratio: "3.3×", neg: "34%", text: "主丝带已经站出来了，可伴随细弧贴得太死，像勒住主带喘不过气。" },
  "1-1": { title: "主粗副细 + 平行死轨", grade: "工整但偏僵", ratio: "3.3×", neg: "56%", text: "主次清晰，但伴随弧全程保持等距偏移，仍带着圆规制图的机械味。" },
  "1-2": { title: "主粗副细 + 渐收呼吸", grade: "黄金呼吸区", ratio: "3.4×", neg: "70%", text: "原海报正是这一格：主丝带沉稳领跑并自然收尖，细副弧宽入渐收地伴随，虚实、疏密与呼吸一次到位。" },
  "2-0": { title: "主带臃肿 + 挤撞贴死", grade: "厚重堵屏", ratio: "5.2×", neg: "18%", text: "主丝带膨胀成大色块再叠紧副线，整张版面几乎找不到落脚的留白。" },
  "2-1": { title: "主带臃肿 + 平行死轨", grade: "头重脚轻", ratio: "5.2×", neg: "38%", text: "主带压迫感过强，旁边两条细线像无关紧要的装饰边，难以构成轻柔对话。" },
  "2-2": { title: "主带臃肿 + 渐收呼吸", grade: "略重需瘦身", ratio: "5.0×", neg: "50%", text: "呼吸韵律对了，但主带偏胖容易喧宾夺主，把主带收细三成会轻盈许多。" },
};

function initSection03Matrix() {
  const cells = [...document.querySelectorAll("[data-mcell]")];
  const canvas = document.getElementById("s3-specimen-canvas");
  const titleEl = document.getElementById("s3-spec-title");
  const gradeEl = document.getElementById("s3-spec-grade");
  const ratioEl = document.getElementById("s3-spec-ratio");
  const negEl = document.getElementById("s3-spec-neg");
  const textEl = document.getElementById("s3-spec-text");
  if (!canvas || !cells.length) return;
  const ctx = canvas.getContext("2d");

  // 默认停在「1-2 黄金呼吸区」以外的一个反例「0-1 平行死轨」，点一下对比就豁然开朗
  let activeKey = "0-1";

  function drawSpecimen() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = pixelRatio(2);
    const pw = Math.round(rect.width * dpr);
    const ph = Math.round(rect.height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = rect.width;
    const H = rect.height;
    const [wIdx, sIdx] = activeKey.split("-").map(Number);

    ctx.fillStyle = "#3A0D11";
    ctx.fillRect(0, 0, W, H);

    // 淡网格底
    ctx.strokeStyle = "rgba(252, 222, 211, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 32; x < W; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    const mainW = wIdx === 0 ? 18 : wIdx === 1 ? 26 : 44;
    const compW = wIdx === 0 ? 17 : 7;
    const taper = wIdx === 0 ? 0.06 : 0.72;

    const N = 64;
    const basePts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = lerp(W * 0.08, W * 0.90, t);
      const y = H * 0.54 - Math.sin(t * Math.PI * 1.45 - 0.25) * (H * 0.24);
      basePts.push({ x, y, t });
    }

    const drawBand = (side, peakW, color, isMain) => {
      const left = [];
      const right = [];
      for (let i = 0; i <= N; i++) {
        const p = basePts[i];
        const prev = basePts[Math.max(0, i - 1)];
        const next = basePts[Math.min(N, i + 1)];
        let dx = next.x - prev.x;
        let dy = next.y - prev.y;
        const l = Math.hypot(dx, dy) || 1;
        dx /= l;
        dy /= l;
        const nx = -dy;
        const ny = dx;

        let sep = 0;
        if (side !== 0) {
          if (sIdx === 0) sep = (mainW + compW) * 0.55; // 挤撞
          else if (sIdx === 1) sep = 42; // 平行死轨
          else sep = lerp(66, 15, Math.pow(p.t, 0.85)) * (0.72 + 0.28 * Math.sin(p.t * Math.PI * 1.2 + (side > 0 ? 0 : 1.1))); // 渐收呼吸
        }
        const cx = p.x + nx * sep * side;
        const cy = p.y + ny * sep * side;
        const profile = isMain ? 0.24 + 0.76 * Math.sin(p.t * Math.PI) : 0.35 + 0.65 * Math.sin(p.t * Math.PI);
        const hw = peakW * lerp(0.95, profile, taper) * 0.5;
        left.push([cx + nx * hw, cy + ny * hw]);
        right.push([cx - nx * hw, cy - ny * hw]);
      }
      ctx.beginPath();
      ctx.moveTo(left[0][0], left[0][1]);
      for (let i = 1; i <= N; i++) ctx.lineTo(left[i][0], left[i][1]);
      for (let i = N; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    drawBand(-1, compW, "rgba(247, 203, 191, 0.58)", false);
    drawBand(1, compW * 0.85, "rgba(238, 135, 110, 0.52)", false);
    drawBand(0, mainW, activeKey === "1-2" ? "#FCDED3" : "#F0A899", true);

    // 末端焦圆
    const end = basePts[N];
    ctx.beginPath();
    ctx.arc(end.x, end.y, activeKey === "1-2" ? 13 : 9, 0, Math.PI * 2);
    ctx.fillStyle = activeKey === "1-2" ? "#7FE0BE" : "#FF9D85";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#2B080B";
    ctx.fill();
  }

  function pick(key) {
    activeKey = key;
    const info = MATRIX_INFO[key];
    cells.forEach((c) => {
      const on = c.dataset.mcell === key;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-pressed", String(on));
    });
    if (titleEl) titleEl.textContent = info.title;
    if (gradeEl) {
      gradeEl.textContent = info.grade;
      gradeEl.dataset.gold = key === "1-2" ? "1" : "0";
    }
    if (ratioEl) ratioEl.textContent = info.ratio;
    if (negEl) negEl.textContent = info.neg;
    if (textEl) textEl.textContent = info.text;
    drawSpecimen();
  }

  cells.forEach((c) => c.addEventListener("click", () => pick(c.dataset.mcell)));
  window.addEventListener("resize", drawSpecimen);
  pick(activeKey);
}

// =========================================================================
// 04 节：刚柔相济 · 给软弧配一根直骨头（4 个刚性零件独立开关装配板）
// =========================================================================
function initSection04Anchors() {
  const toggles = [...document.querySelectorAll("[data-anchor-part]")];
  const poster = document.getElementById("s4-poster-stage");
  const verdict = document.getElementById("s4-verdict");
  const ratioBar = document.getElementById("s4-ratio-bar");
  const ratioLabel = document.getElementById("s4-ratio-label");
  if (!poster || !toggles.length) return;

  const state = {
    frame: false,
    rule: false,
    date: false,
    bubble: true, // 开场刻意全员软泡泡，演示「没骨头发腻发飘」
  };

  function sync() {
    toggles.forEach((b) => {
      const k = b.dataset.anchorPart;
      const on = !!state[k];
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    poster.dataset.frame = state.frame ? "1" : "0";
    poster.dataset.rule = state.rule ? "1" : "0";
    poster.dataset.date = state.date ? "1" : "0";
    poster.dataset.bubble = state.bubble ? "1" : "0";

    const straightCount = [state.frame, state.rule, state.date, !state.bubble].filter(Boolean).length;
    const straightPct = straightCount * 8; // 约 0%..32% 直线结构占比（示意）
    if (ratioBar) ratioBar.style.width = `${Math.max(4, straightPct * 2.5)}%`;
    if (ratioLabel) ratioLabel.textContent = `直线锚点约 ${straightPct}% · 曲线约 ${100 - straightPct}%（示意）`;

    if (straightCount === 0) {
      verdict.textContent = "全屏都是软弧和圆泡泡：视觉边界发糊，角落缺少水平/垂直参照，整张海报发腻发飘。试试逐个点亮刚性零件。";
      verdict.dataset.ok = "0";
    } else if (straightCount === 1) {
      verdict.textContent = "有了一点支撑，但结构仍偏软；再补一处细线信息框或直线短杠，柔丝带就能被稳稳托住。";
      verdict.dataset.ok = "0";
    } else if (straightCount <= 3) {
      verdict.textContent = "刚柔平衡刚好：满幅柔弧负责情绪与流动，左下细直线框和右上短杠悄悄撑起秩序——这正是 038 原海报耐看的秘诀。";
      verdict.dataset.ok = "1";
    } else {
      verdict.textContent = "全部刚性零件齐全且取消泡泡软壳：版面利落精致，像高端画展与护肤主视觉，既优雅又不失专业感。";
      verdict.dataset.ok = "1";
    }
  }

  toggles.forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.anchorPart;
      state[k] = !state[k];
      sync();
    });
  });
  sync();
}

// =========================================================================
// 05 节：什么时候别用曲线（3 组真实忌用场景「硬套柔弧 vs 换回直线」切卡）
// =========================================================================
function initSection05Avoid() {
  const cards = [...document.querySelectorAll("[data-avoid-card]")];
  cards.forEach((card) => {
    const btnBad = card.querySelector('[data-mode="bad"]');
    const btnGood = card.querySelector('[data-mode="good"]');
    const setMode = (m) => {
      card.dataset.view = m;
      btnBad?.classList.toggle("is-active", m === "bad");
      btnBad?.setAttribute("aria-pressed", String(m === "bad"));
      btnGood?.classList.toggle("is-active", m === "good");
      btnGood?.setAttribute("aria-pressed", String(m === "good"));
    };
    btnBad?.addEventListener("click", () => setMode("bad"));
    btnGood?.addEventListener("click", () => setMode("good"));
    setMode("bad");
  });
}

// =========================================================================
// 06 节：眼力小测（4 幅中性标签矢量展讯，仅差曲线粗细/疏密/终点收束单变量）
// =========================================================================
const QUIZ_FEEDBACK = {
  A: {
    ok: false,
    title: "方案 A · 平行等宽铁轨",
    reason: "三条丝带从头到尾一模一样粗、间距等宽平行，失去了「粗细对比」与「疏密呼吸」，像工业波纹板而非有机流动。",
  },
  B: {
    ok: false,
    title: "方案 B · 逆流打结压主图",
    reason: "两条副弧逆着主丝带交叉横穿，不仅在半路打结干扰视线，还直接劈过中央陶瓶花朵破坏主体完整性。",
  },
  C: {
    ok: true,
    title: "方案 C · 正确答案（主次分明 + 疏密呼吸 + 终点落焦）",
    reason: "主丝带由粗渐细自然领跑，两条伴随细弧宽入渐收地呼应，终点稳稳收进陶瓶花艺焦点；左下角辅以克制细直线展期块锚住重心。",
  },
  D: {
    ok: false,
    title: "方案 D · 曲线终点甩出画框",
    reason: "单看弧度与粗细都柔和，但三股曲线集体从陶瓶上方与右下绕开滑出画框，没做到「终点落在视觉焦点」，看完丝带视线就溜走了。",
  },
};

function drawQuizCards() {
  const canvases = [...document.querySelectorAll("[data-quiz-canvas]")];
  const med = getMedallion();
  canvases.forEach((c) => {
    const opt = c.dataset.quizCanvas;
    const ctx = c.getContext("2d");
    const W = 240;
    const H = 310;
    const dpr = pixelRatio(2);
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 统一底面、统一抬头、统一展期位置与字号，确保仅差「曲线构图」单一变量
    ctx.fillStyle = "#FDF3E8";
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, 64);
    ctx.quadraticCurveTo(W * 0.5, 40, 0, 74);
    ctx.closePath();
    ctx.fillStyle = "#FCDED3";
    ctx.fill();

    // 统一小标题（所有方案完全一致）
    ctx.fillStyle = "#4B090B";
    ctx.font = '700 15px "Noto Sans SC", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("初夏陶艺花事", 18, 34);
    ctx.fillStyle = "#B33324";
    ctx.font = '500 9.5px "Outfit", sans-serif';
    ctx.fillText("CERAMIC FLORAL EXHIBITION", 18, 49);

    const fx = 128;
    const fy = 166;
    const fr = 44;

    // 按方案画不同曲线骨架
    ctx.save();
    ctx.lineCap = "round";
    if (opt === "A") {
      // 等宽平行铁轨
      for (const dy of [-22, 0, 22]) {
        ctx.beginPath();
        ctx.moveTo(14, 92 + dy);
        ctx.bezierCurveTo(96, 86 + dy, 66, 212 + dy, 226, 206 + dy);
        ctx.strokeStyle = "rgba(234, 158, 138, 0.82)";
        ctx.lineWidth = 10;
        ctx.stroke();
      }
    } else if (opt === "B") {
      // 逆流交叉打结并横穿主图
      ctx.beginPath();
      ctx.moveTo(22, 84);
      ctx.bezierCurveTo(186, 108, 28, 198, 212, 248);
      ctx.strokeStyle = "rgba(234, 158, 138, 0.85)";
      ctx.lineWidth = 13;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(218, 86);
      ctx.bezierCurveTo(38, 126, 214, 184, 34, 244);
      ctx.strokeStyle = "rgba(199, 67, 62, 0.65)";
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(18, 186);
      ctx.quadraticCurveTo(126, 132, 224, 154);
      ctx.strokeStyle = "rgba(220, 122, 106, 0.72)";
      ctx.lineWidth = 9;
      ctx.stroke();
    } else if (opt === "C") {
      // 正确答案：主粗渐细 + 两条伴随细弧宽入渐收 + 终点温柔落进焦点
      // 副弧 1
      ctx.beginPath();
      ctx.moveTo(22, 82);
      ctx.bezierCurveTo(120, 62, 184, 104, fx + 12, fy - 12);
      ctx.strokeStyle = "rgba(234, 168, 150, 0.72)";
      ctx.lineWidth = 3.2;
      ctx.stroke();
      // 副弧 2
      ctx.beginPath();
      ctx.moveTo(32, 232);
      ctx.bezierCurveTo(88, 248, 166, 228, fx + 8, fy + 16);
      ctx.strokeStyle = "rgba(238, 178, 160, 0.72)";
      ctx.lineWidth = 2.6;
      ctx.stroke();
      // 主丝带（渐变加粗再收尖汇入焦点）
      const pts = [];
      for (let i = 0; i <= 36; i++) {
        const t = i / 36;
        const m = 1 - t;
        const x = m * m * m * 24 + 3 * m * m * t * 142 + 3 * m * t * t * 44 + t * t * t * fx;
        const y = m * m * m * 98 + 3 * m * m * t * 92 + 3 * m * t * t * 212 + t * t * t * fy;
        pts.push({ x, y, w: 3 + 15 * Math.sin(t * Math.PI) });
      }
      const L = [];
      const R = [];
      pts.forEach((p, i) => {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[Math.min(pts.length - 1, i + 1)];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        L.push([p.x - dy * p.w * 0.5, p.y + dx * p.w * 0.5]);
        R.push([p.x + dy * p.w * 0.5, p.y - dx * p.w * 0.5]);
      });
      ctx.beginPath();
      ctx.moveTo(L[0][0], L[0][1]);
      L.forEach((p) => ctx.lineTo(p[0], p[1]));
      for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
      ctx.closePath();
      ctx.fillStyle = "#F2B6A6";
      ctx.fill();
    } else {
      // 方案 D：弧度与粗细都流畅，但终点全部绕开陶瓶滑出右上与右下画角
      ctx.beginPath();
      ctx.moveTo(16, 108);
      ctx.bezierCurveTo(96, 62, 168, 72, 238, 92);
      ctx.strokeStyle = "#F2B6A6";
      ctx.lineWidth = 14;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(22, 238);
      ctx.bezierCurveTo(92, 266, 178, 256, 238, 286);
      ctx.strokeStyle = "rgba(234, 168, 150, 0.8)";
      ctx.lineWidth = 4.5;
      ctx.stroke();
    }
    ctx.restore();

    // 统一中央花艺圆窗（B 方案中故意有一条逆流线盖过它前层以呈现压主图）
    ctx.save();
    ctx.beginPath();
    ctx.arc(fx, fy, fr + 3, 0, Math.PI * 2);
    ctx.fillStyle = "#FFF8F1";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.clip();
    if (med) {
      ctx.drawImage(med, fx - fr, fy - fr, fr * 2, fr * 2);
    } else {
      ctx.fillStyle = "#CA8475";
      ctx.fillRect(fx - fr, fy - fr, fr * 2, fr * 2);
      ctx.fillStyle = "#F1C4B4";
      ctx.beginPath();
      ctx.arc(fx + 6, fy + 14, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(75, 9, 11, 0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (opt === "B") {
      // 方案 B 的逆流线横压在花朵圆窗上
      ctx.beginPath();
      ctx.moveTo(42, 134);
      ctx.quadraticCurveTo(130, 162, 206, 198);
      ctx.strokeStyle = "rgba(199, 67, 62, 0.72)";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // 统一底部左下细红直线展期框（四幅保持同一刚性信息块，排除干扰变量）
    ctx.strokeStyle = "rgba(75, 9, 11, 0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 260, 118, 34);
    ctx.fillStyle = "#4B090B";
    ctx.font = '600 9.5px "DM Mono", monospace';
    ctx.fillText("06.10 — 07.28", 24, 274);
    ctx.fillStyle = "#6B3637";
    ctx.font = '500 9px "Noto Sans SC", sans-serif';
    ctx.fillText("南山陶艺馆 · 免费入场", 24, 287);
  });
}

function initSection06Quiz() {
  const btns = [...document.querySelectorAll("[data-quiz-opt]")];
  const resultBox = document.getElementById("quiz-result");
  const resultTitle = document.getElementById("quiz-result-title");
  const resultBody = document.getElementById("quiz-result-body");
  const breakdown = document.getElementById("quiz-breakdown");
  const resetBtn = document.getElementById("quiz-reset");
  if (!btns.length) return;

  drawQuizCards();
  onMedallionReady(drawQuizCards);

  let answered = false;
  function choose(opt) {
    answered = true;
    const item = QUIZ_FEEDBACK[opt];
    btns.forEach((b) => {
      const k = b.dataset.quizOpt;
      b.classList.toggle("is-picked", k === opt);
      b.classList.toggle("is-right", k === "C");
      b.classList.toggle("is-wrong", k === opt && k !== "C");
      b.setAttribute("aria-pressed", String(k === opt));
    });
    if (resultBox) {
      resultBox.hidden = false;
      resultBox.dataset.ok = item.ok ? "1" : "0";
    }
    if (resultTitle) resultTitle.textContent = item.ok ? `答对了 · ${item.title}` : `差一点 · 你选了${item.title}`;
    if (resultBody) resultBody.textContent = item.reason;
    if (breakdown) {
      breakdown.innerHTML = Object.entries(QUIZ_FEEDBACK)
        .map(
          ([k, v]) =>
            `<li class="${v.ok ? "is-right" : ""}"><strong>方案 ${k}</strong>：${v.reason}</li>`
        )
        .join("");
    }
  }

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      choose(b.dataset.quizOpt);
    })
  );
  resetBtn?.addEventListener("click", () => {
    if (!answered) return;
    answered = false;
    btns.forEach((b) => {
      b.classList.remove("is-picked", "is-right", "is-wrong");
      b.setAttribute("aria-pressed", "false");
    });
    if (resultBox) resultBox.hidden = true;
  });
}

// =========================================================================
// 07 节：原海报灯箱（点击放大、按钮与滚轮缩放、鼠标拖拽、Esc 关闭）
// =========================================================================
function initSection07Lightbox() {
  const trigger = document.getElementById("poster-trigger");
  const posterImg = document.getElementById("poster");
  const dialog = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lb-img");
  const btnClose = document.getElementById("lb-close");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-zoom-reset");
  const stage = document.getElementById("lb-stage");
  if (!trigger || !posterImg || !dialog || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (btnReset) btnReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function openBox() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    btnClose?.focus();
  }

  function closeBox() {
    dialog.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", openBox);
  btnClose?.addEventListener("click", closeBox);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === stage) closeBox();
  });
  window.addEventListener("keydown", (e) => {
    if (!dialog.hidden && e.key === "Escape") closeBox();
  });
  btnIn?.addEventListener("click", () => {
    scale = Math.min(3.2, scale + 0.35);
    applyTransform();
  });
  btnOut?.addEventListener("click", () => {
    scale = Math.max(0.75, scale - 0.35);
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  btnReset?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage?.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.max(0.75, Math.min(3.2, scale + (e.deltaY < 0 ? 0.18 : -0.18)));
      if (scale <= 1) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    },
    { passive: false }
  );

  lbImg.addEventListener("mousedown", (e) => {
    e.preventDefault();
    dragging = true;
    startX = e.clientX - tx;
    startY = e.clientY - ty;
    lbImg.style.cursor = "grabbing";
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    tx = e.clientX - startX;
    ty = e.clientY - startY;
    applyTransform();
  });
  window.addEventListener("mouseup", () => {
    dragging = false;
    lbImg.style.cursor = "grab";
  });
}

export function initSections() {
  initSection01Morph();
  initSection02History();
  initSection03Matrix();
  initSection04Anchors();
  initSection05Avoid();
  initSection06Quiz();
  initSection07Lightbox();
}

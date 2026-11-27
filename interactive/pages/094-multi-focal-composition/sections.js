// 094 多重焦点构图 — 七大正文小节独立互动模块（相邻节绝不复用同种交互控件）
// 01 权重梯阶混音台 | 02 四拓扑路径切换+故障拨片 | 03 历史时间轴+雅布斯任务眼动模拟器
// 04 五场景 X-Ray 透视滑门 | 05 三问边界诊断树 | 06 单变量四选一盲测 | 07 原海报灯箱

import { reducedMotion } from "../../lib/stage.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(" ");
}

// ============================================================
// 01. 主次权重梯阶混音台（四轨拉杆 + 实时注视分配 + 预览图）
// ============================================================
export function initHierarchyMixer() {
  const root = document.getElementById("sec1-mixer");
  if (!root) return;

  const sliders = [
    root.querySelector('[data-mix="0"]'),
    root.querySelector('[data-mix="1"]'),
    root.querySelector('[data-mix="2"]'),
    root.querySelector('[data-mix="3"]'),
  ];
  const valEls = [
    root.querySelector('[data-mix-val="0"]'),
    root.querySelector('[data-mix-val="1"]'),
    root.querySelector('[data-mix-val="2"]'),
    root.querySelector('[data-mix-val="3"]'),
  ];
  const svg = document.getElementById("sec1-svg");
  const verdictBadge = document.getElementById("sec1-badge");
  const verdictTitle = document.getElementById("sec1-title");
  const verdictBody = document.getElementById("sec1-body");
  const orderEl = document.getElementById("sec1-order");

  const PRESETS_01 = {
    equal: [64, 62, 60, 58],
    ladder: [92, 60, 46, 30],
    single: [98, 22, 16, 14],
  };

  const ANCHORS = [
    { id: "A", name: "雪山主焦", x: 268, y: 84, shape: "circle" },
    { id: "B", name: "灯塔次焦", x: 112, y: 122, shape: "circle" },
    { id: "C", name: "六角城影", x: 274, y: 214, shape: "hex" },
    { id: "D", name: "紫纹细读", x: 108, y: 234, shape: "circle" },
  ];

  function update() {
    const vals = sliders.map((s) => Number(s.value));
    const total = vals.reduce((a, b) => a + b, 0) || 1;
    const shares = vals.map((v) => v / total);
    const ranked = vals
      .map((v, i) => ({ i, id: ANCHORS[i].id, v, share: shares[i] }))
      .sort((a, b) => b.v - a.v);

    const ratio = ranked[1].v > 0 ? ranked[0].v / ranked[1].v : 1;
    const span = ranked[3].v > 0 ? ranked[0].v / ranked[3].v : 1;
    const topShare = ranked[0].share;

    vals.forEach((v, i) => {
      if (valEls[i]) valEls[i].textContent = `${Math.round(shares[i] * 100)}%`;
    });

    // 绘制实时 SVG 焦点星图
    const nodesMarkup = ANCHORS.map((a, i) => {
      const w = vals[i];
      const r = 15 + (w / 100) * 34;
      const alpha = (0.32 + (w / 100) * 0.68).toFixed(2);
      const rankIdx = ranked.findIndex((x) => x.i === i) + 1;
      const isWinner = rankIdx === 1 && ratio >= 1.25;
      const stroke = isWinner ? "#56e8b8" : ratio < 1.22 ? "#ff6b7b" : "#b59cff";
      const shapeEl =
        a.shape === "hex"
          ? `<polygon points="${hexPoints(a.x, a.y, r)}" fill="rgba(127,76,248,${alpha})" stroke="${stroke}" stroke-width="2" />`
          : `<circle cx="${a.x}" cy="${a.y}" r="${r.toFixed(1)}" fill="rgba(127,76,248,${alpha})" stroke="${stroke}" stroke-width="2" />`;
      const outerEl =
        a.shape === "hex"
          ? `<polygon points="${hexPoints(a.x, a.y, r + 7)}" fill="none" stroke="rgba(216,208,255,0.45)" stroke-width="1" stroke-dasharray="3 4" />`
          : `<circle cx="${a.x}" cy="${a.y}" r="${(r + 7).toFixed(1)}" fill="none" stroke="rgba(216,208,255,0.45)" stroke-width="1" stroke-dasharray="3 4" />`;
      return `
        ${outerEl}
        ${shapeEl}
        <text x="${a.x}" y="${a.y - 2}" text-anchor="middle" fill="#f7f5ff" font-size="13" font-weight="700" font-family="Unbounded, sans-serif">${a.id}</text>
        <text x="${a.x}" y="${a.y + 13}" text-anchor="middle" fill="#d8d2f8" font-size="10.5" font-weight="600" font-family="Manrope, sans-serif">${Math.round(shares[i] * 100)}%</text>
      `;
    }).join("");

    // 连接线按权重顺序从重到轻走向
    let pathLines = "";
    for (let k = 0; k < ranked.length - 1; k++) {
      const p1 = ANCHORS[ranked[k].i];
      const p2 = ANCHORS[ranked[k + 1].i];
      pathLines += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${ratio < 1.22 ? "rgba(255,107,123,0.65)" : "rgba(181,156,255,0.55)"}" stroke-width="1.6" stroke-dasharray="5 5" />`;
    }

    svg.innerHTML = `
      <rect x="0" y="0" width="380" height="310" rx="14" fill="#040a2e" />
      <circle cx="190" cy="155" r="56" fill="none" stroke="rgba(164,132,255,0.16)" stroke-dasharray="4 5" />
      ${pathLines}
      ${nodesMarkup}
    `;

    // 更新状态结论
    orderEl.textContent = `实测入口序列（示意）：${ranked.map((r, k) => `${k + 1}. 焦点 ${r.id}（${Math.round(r.share * 100)}%）`).join(" → ")}`;
    verdictBadge.className = "pill-tag";
    if (topShare > 0.56) {
      verdictBadge.classList.add("is-warn");
      verdictBadge.textContent = `单焦垄断 · 占 ${Math.round(topShare * 100)}%`;
      verdictTitle.textContent = `焦点 ${ranked[0].id} 吸走了过半注意力，其余三个沦为背景噪点`;
      verdictBody.textContent = "当头号焦点超过总权重一半以上，观众看完它就会结束阅读，不再向次焦移动——此时版面已退化为单一焦点构图，失去了多焦点传递丰富层次的意义。";
    } else if (ratio < 1.24 || span < 1.65) {
      verdictBadge.classList.add("is-err");
      verdictBadge.textContent = `四王争霸 · 主次比 ${ratio.toFixed(2)}×`;
      verdictTitle.textContent = `入口权重太接近（${ratio.toFixed(2)}×），眼睛被迫反复横跳`;
      verdictBody.textContent = "海报说「多个焦点分散注意力，避免单一焦点造成的视觉压迫」，但这不等于把四个点做成一样大。缺乏明确领头羊时，人眼不知该先看谁，反而更累。";
    } else {
      verdictBadge.classList.add("is-ok");
      verdictBadge.textContent = `梯阶成立 · 主次比 ${ratio.toFixed(2)}×`;
      verdictTitle.textContent = `焦点 ${ranked[0].id} 稳坐第一眼，其余三焦按序接棒`;
      verdictBody.textContent = `最大与次大权重比 ${ratio.toFixed(2)}×、首尾跨度 ${span.toFixed(2)}×（经验理想区间：主次比 1.35×–2.4×，主焦不超过 48%）。既卸掉了单焦压迫，又保住了阅读顺序。`;
    }
  }

  sliders.forEach((s) => s.addEventListener("input", update));
  root.querySelectorAll("[data-mix-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const arr = PRESETS_01[btn.dataset.mixPreset];
      if (!arr) return;
      arr.forEach((v, i) => (sliders[i].value = String(v)));
      root.querySelectorAll("[data-mix-preset]").forEach((b) => b.classList.toggle("is-active", b === btn));
      update();
    });
  });

  update();
}

// ============================================================
// 02. 四种构图路径拓扑对比 + 交叉死结拨片 + SVG 光点演播
// ============================================================
export function initPathwaysLab() {
  const root = document.getElementById("sec2-pathways");
  if (!root) return;

  const TOPOLOGIES = {
    zflow: {
      name: "Z 形四星导读（原海报同源）",
      desc: "A 右上高反差起步 → B 左中灯塔转向 → C 右下六边形承接 → D 左下纹石收束，天然契合现代海报与杂志跨页的折返扫描节拍。",
      nodes: [
        { id: "A", x: 300, y: 78, r: 34, shape: "circle" },
        { id: "B", x: 120, y: 128, r: 26, shape: "circle" },
        { id: "C", x: 306, y: 214, r: 25, shape: "hex" },
        { id: "D", x: 118, y: 242, r: 20, shape: "circle" },
      ],
      goodRoute: [0, 1, 2, 3],
      badRoute: [0, 3, 1, 2],
      rhythm: "2 次折返 · 零交叉顺读",
    },
    triangle: {
      name: "三角主从闭环",
      desc: "用三枚大小递减的焦点构成不等边三角形，重心最稳，视线绕完一圈自然回到主焦，非常适合产品海报与重点三段论。",
      nodes: [
        { id: "A", x: 256, y: 80, r: 36, shape: "circle" },
        { id: "B", x: 106, y: 184, r: 26, shape: "hex" },
        { id: "C", x: 292, y: 234, r: 21, shape: "diamond" },
      ],
      goodRoute: [0, 1, 2, 0],
      badRoute: [0, 2, 1],
      rhythm: "3 段稳闭环 · 零交叉",
    },
    diagonal: {
      name: "对角回声呼应",
      desc: "主焦与次焦分踞对角两端互相牵引，中间用两枚小型形态过渡节点搭桥，在动势与平衡之间拉出高张力。",
      nodes: [
        { id: "A", x: 100, y: 82, r: 35, shape: "circle" },
        { id: "B", x: 202, y: 126, r: 21, shape: "diamond" },
        { id: "C", x: 242, y: 196, r: 23, shape: "hex" },
        { id: "D", x: 326, y: 240, r: 28, shape: "circle" },
      ],
      goodRoute: [0, 1, 2, 3],
      badRoute: [0, 3, 1, 2],
      rhythm: "斜轴递进 · 两端配重",
    },
    scroll: {
      name: "长卷起伏游览（东方散点式）",
      desc: "把焦点按高低起伏排成横向长河，大小强弱如乐章起承转合，适合长图、展墙与时间轴叙事。",
      nodes: [
        { id: "A", x: 76, y: 108, r: 31, shape: "circle" },
        { id: "B", x: 162, y: 218, r: 24, shape: "hex" },
        { id: "C", x: 254, y: 98, r: 28, shape: "circle" },
        { id: "D", x: 344, y: 206, r: 20, shape: "diamond" },
      ],
      goodRoute: [0, 1, 2, 3],
      badRoute: [0, 2, 1, 3],
      rhythm: "横向波浪 · 步移景异",
    },
  };

  let activeKey = "zflow";
  let brokenToggle = false;
  let animTimer = 0;

  const svg = document.getElementById("sec2-svg");
  const titleEl = document.getElementById("sec2-title");
  const descEl = document.getElementById("sec2-desc");
  const metricsEl = document.getElementById("sec2-metrics");
  const faultBtn = document.getElementById("sec2-fault-btn");
  const playBtn = document.getElementById("sec2-play-btn");

  function renderTopology(stepHighlight = -1) {
    const topo = TOPOLOGIES[activeKey];
    const route = brokenToggle ? topo.badRoute : topo.goodRoute;
    const isBad = brokenToggle;

    let totalLen = 0;
    const segs = [];
    for (let i = 0; i < route.length - 1; i++) {
      const a = topo.nodes[route[i]];
      const b = topo.nodes[route[i + 1]];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      totalLen += len;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const bend = isBad ? 0 : (i % 2 === 0 ? -24 : 24);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = len || 1;
      const cpx = mx - (dy / d) * bend;
      const cpy = my + (dx / d) * bend;
      const lit = stepHighlight === i;
      segs.push(
        `<path d="M ${a.x} ${a.y} Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ${b.x} ${b.y}" fill="none" stroke="${
          isBad ? "#ff6b7b" : lit ? "#56e8b8" : "#b59cff"
        }" stroke-width="${lit ? 3.2 : 2}" stroke-dasharray="${isBad ? "7 5" : "6 6"}" />`
      );
      // 方向箭头
      const t = 0.54;
      const ax = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cpx + t * t * b.x;
      const ay = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cpy + t * t * b.y;
      const tx = 2 * (1 - t) * (cpx - a.x) + 2 * t * (b.x - cpx);
      const ty = 2 * (1 - t) * (cpy - a.y) + 2 * t * (b.y - cpy);
      const deg = (Math.atan2(ty, tx) * 180) / Math.PI;
      segs.push(
        `<polygon points="7,0 -6,-5 -3,0 -6,5" fill="#040a2e" stroke="${isBad ? "#ff6b7b" : "#f2eeff"}" stroke-width="1.5" transform="translate(${ax.toFixed(1)},${ay.toFixed(1)}) rotate(${deg.toFixed(1)})" />`
      );
    }

    const nodeEls = topo.nodes
      .map((nd, i) => {
        const activeDot = stepHighlight >= 0 && route[stepHighlight] === i;
        const fill = activeDot ? "#56e8b8" : nd.shape === "hex" ? "#7141ea" : "#4b37a2";
        const stroke = activeDot ? "#ffffff" : "#d8d2f8";
        let shape;
        if (nd.shape === "hex") {
          shape = `<polygon points="${hexPoints(nd.x, nd.y, nd.r)}" fill="${fill}" stroke="${stroke}" stroke-width="1.8" />`;
        } else if (nd.shape === "diamond") {
          shape = `<polygon points="${nd.x},${nd.y - nd.r} ${nd.x + nd.r},${nd.y} ${nd.x},${nd.y + nd.r} ${nd.x - nd.r},${nd.y}" fill="${fill}" stroke="${stroke}" stroke-width="1.8" />`;
        } else {
          shape = `<circle cx="${nd.x}" cy="${nd.y}" r="${nd.r}" fill="${fill}" stroke="${stroke}" stroke-width="1.8" />`;
        }
        return `
          ${shape}
          <text x="${nd.x}" y="${nd.y + 4}" text-anchor="middle" fill="${activeDot ? "#03092e" : "#ffffff"}" font-size="13" font-weight="700" font-family="Unbounded, sans-serif">${nd.id}</text>
        `;
      })
      .join("");

    const badBadge = isBad
      ? `<g transform="translate(210,160)"><circle r="13" fill="#be1e38" stroke="#ffd8de" stroke-width="1.5"/><path d="M-4.5,-4.5 L4.5,4.5 M4.5,-4.5 L-4.5,4.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>`
      : "";

    svg.innerHTML = `
      <rect x="0" y="0" width="420" height="310" rx="14" fill="#040a2e" />
      <circle cx="210" cy="155" r="46" fill="none" stroke="rgba(164,132,255,0.16)" stroke-dasharray="4 4" />
      ${segs.join("")}
      ${badBadge}
      ${nodeEls}
    `;

    titleEl.textContent = isBad ? `${topo.name} · 已触发路径交叉打结` : topo.name;
    descEl.textContent = isBad
      ? "同样四枚焦点、一寸未动，只把引导顺序拧成交叉死结：视线总跳视距离暴涨，观众在中段被迫折返，节奏感立刻散架。"
      : topo.desc;
    metricsEl.innerHTML = `
      <span>跳视总长：<strong>${Math.round(totalLen)} 单位（示意）</strong></span>
      <span>路线状态：<strong class="${isBad ? "txt-err" : "txt-ok"}">${isBad ? "交叉逆折 · 视线卡顿" : topo.rhythm}</strong></span>
    `;
    faultBtn.setAttribute("aria-pressed", String(brokenToggle));
    faultBtn.classList.toggle("is-err-on", brokenToggle);
    faultBtn.textContent = brokenToggle ? "已开启交叉故障（点此恢复顺轨）" : "拧成交叉死结对比";
  }

  root.querySelectorAll("[data-topo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      clearInterval(animTimer);
      activeKey = btn.dataset.topo;
      root.querySelectorAll("[data-topo]").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderTopology(-1);
    });
  });

  faultBtn.addEventListener("click", () => {
    clearInterval(animTimer);
    brokenToggle = !brokenToggle;
    renderTopology(-1);
  });

  playBtn.addEventListener("click", () => {
    clearInterval(animTimer);
    const route = brokenToggle ? TOPOLOGIES[activeKey].badRoute : TOPOLOGIES[activeKey].goodRoute;
    if (reducedMotion.matches) {
      renderTopology(0);
      return;
    }
    let step = 0;
    renderTopology(0);
    animTimer = setInterval(() => {
      step++;
      if (step >= route.length - 1) {
        clearInterval(animTimer);
        renderTopology(-1);
      } else {
        renderTopology(step);
      }
    }, 520);
  });

  renderTopology(-1);
}

// ============================================================
// 03. 历史溯源时间轴 + 致敬雅布斯（1967）的任务切换眼动模拟器
// ============================================================
export function initHistoryAndYarbus() {
  const root = document.getElementById("sec3-history");
  if (!root) return;

  const ERAS = {
    qingming: {
      year: "北宋 · 11–12 世纪",
      title: "张择端《清明上河图》：东方长卷里的多段高潮",
      meta: "绢本淡设色 · 纵 24.8 厘米 × 横 528.7 厘米 · 北京故宫博物院藏",
      body: "与西方单点透视把视点锁死在一处不同，中国手卷随双手边展边卷阅读：画面从郊外薄雾、汴河虹桥险渡到城门街市，一路布置多处强弱交替的焦点群落，靠蜿蜒河道与街巷把视线平滑带完五米长卷。",
    },
    bruegel: {
      year: "1559 年 · 北方文艺复兴",
      title: "勃鲁盖尔《尼德兰箴言》：无单一主角的色点星网",
      meta: "橡木板油画 · 117.2 × 163.8 厘米 · 柏林国立博物馆画廊藏（Ident. Nr. 1720）",
      body: "画中并置了逾百则尼德兰俚语小剧场，没有任何一个绝对主角。勃鲁盖尔巧妙利用散落全画的亮红与鲜蓝衣饰，以及屋脊与河流折线，让观者在无数微型故事之间循环漫游而不觉塌陷。",
    },
    arnheim: {
      year: "1954 / 1974 年 · 视知觉理论",
      title: "鲁道夫·阿恩海姆《艺术与视知觉》：多中心与平衡支点",
      meta: "University of California Press · 1954 初版 / 1974 修订扩充版",
      body: "阿恩海姆将格式塔心理学引入构图分析，指出复杂画面很少只靠几何正中维系，而是由多个「视觉重量」不等的中心围绕隐形支点相互制衡——面积、明暗、色彩与离中距离共同决定力矩。",
    },
    yarbus: {
      year: "1965–1990 年 · 眼动科学与信息设计",
      title: "雅布斯、诺顿-斯塔克与塔夫特：扫描路径与微/宏观阅读",
      meta: "Yarbus (1965/1967) · Noton & Stark (Science, 1971) · Tufte (1990)",
      body: "雅布斯用眼动记录证明，同一幅画在不同阅读任务下会产生截然不同的注视序列；诺顿与斯塔克（1971）将其命名为「扫描路径（scanpath）」；爱德华·塔夫特（1990）则进一步指出优秀信息图必须同时支持宏观总览与微观细读——这正是现代多焦点版式的科学根基。",
    },
  };

  const TASKS = {
    free: {
      label: "任务一：自由漫游",
      desc: "没有预设目标时，视线优先受面积与明暗对比牵引：先落主展视觉（1），再顺构图斜线扫过标题与六角数据卡（2→3），最后补看左下细节（4）。",
      path: [
        { x: 282, y: 92, dwell: 26, tag: "1 主视觉" },
        { x: 112, y: 112, dwell: 19, tag: "2 标题块" },
        { x: 274, y: 204, dwell: 21, tag: "3 数据块" },
        { x: 110, y: 222, dwell: 15, tag: "4 细注脚" },
      ],
    },
    data: {
      label: "任务二：速查核心指标",
      desc: "当读者带着「看数字」的任务进入同一张图，自上而下的认知意图立刻改写扫描路径：跳过主图，直奔六角数据卡（1）与对比柱（2），再回看标题核对口径（3）。",
      path: [
        { x: 274, y: 204, dwell: 28, tag: "1 数据主卡" },
        { x: 208, y: 198, dwell: 18, tag: "2 对比标尺" },
        { x: 112, y: 112, dwell: 16, tag: "3 核对标题" },
        { x: 274, y: 204, dwell: 20, tag: "4 复核数值" },
      ],
    },
    detail: {
      label: "任务三：核对日期与出处",
      desc: "如果读者只想确认时间与落款，眼动会彻底避开大块主图，直接在顶角日期标（1）与底左细注区（2→3）之间高速往返——说明每个角落焦点的信息职责都不可偷懒。",
      path: [
        { x: 344, y: 42, dwell: 22, tag: "1 展期角标" },
        { x: 110, y: 222, dwell: 26, tag: "2 出处细注" },
        { x: 112, y: 112, dwell: 15, tag: "3 展名核验" },
        { x: 344, y: 42, dwell: 16, tag: "4 复看日期" },
      ],
    },
  };

  const eraYear = document.getElementById("sec3-era-year");
  const eraTitle = document.getElementById("sec3-era-title");
  const eraMeta = document.getElementById("sec3-era-meta");
  const eraBody = document.getElementById("sec3-era-body");

  const yarbusSvg = document.getElementById("sec3-yarbus-svg");
  const yarbusDesc = document.getElementById("sec3-yarbus-desc");

  function selectEra(key) {
    const e = ERAS[key];
    if (!e) return;
    eraYear.textContent = e.year;
    eraTitle.textContent = e.title;
    eraMeta.textContent = e.meta;
    eraBody.textContent = e.body;
    root.querySelectorAll("[data-era]").forEach((b) => b.classList.toggle("is-active", b.dataset.era === key));
  }

  function selectTask(key) {
    const task = TASKS[key];
    if (!task) return;
    root.querySelectorAll("[data-task]").forEach((b) => b.classList.toggle("is-active", b.dataset.task === key));
    yarbusDesc.textContent = task.desc;

    let lines = "";
    for (let i = 0; i < task.path.length - 1; i++) {
      const a = task.path[i];
      const b = task.path[i + 1];
      lines += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#56e8b8" stroke-width="2" stroke-dasharray="5 4" />`;
    }
    const rings = task.path
      .map(
        (p, idx) => `
        <circle cx="${p.x}" cy="${p.y}" r="${p.dwell}" fill="rgba(86,232,184,0.16)" stroke="#56e8b8" stroke-width="1.8" />
        <circle cx="${p.x}" cy="${p.y}" r="10" fill="#56e8b8" />
        <text x="${p.x}" y="${p.y + 4}" text-anchor="middle" fill="#03121a" font-size="11" font-weight="700" font-family="Unbounded, sans-serif">${idx + 1}</text>
      `
      )
      .join("");

    // 底图固定不变（无五官纯几何展板），只有绿色注视环与跳视路径随任务剧变
    yarbusSvg.innerHTML = `
      <rect x="0" y="0" width="400" height="270" rx="12" fill="#0c1342" stroke="rgba(164,132,255,0.32)" />
      <rect x="308" y="28" width="72" height="24" rx="4" fill="#212866" />
      <text x="344" y="44" text-anchor="middle" fill="#c7b2ff" font-size="10" font-family="Manrope, sans-serif">OCT 14–28</text>
      <rect x="28" y="80" width="166" height="62" rx="8" fill="#171e58" />
      <rect x="42" y="96" width="112" height="12" rx="3" fill="#e6e2ff" opacity="0.82" />
      <rect x="42" y="116" width="84" height="8" rx="3" fill="#9a8fe0" opacity="0.72" />
      <circle cx="282" cy="92" r="42" fill="#4b37a2" opacity="0.88" />
      <polygon points="256,118 282,68 308,118" fill="#b59cff" opacity="0.8" />
      <polygon points="${hexPoints(274, 204, 34)}" fill="#31247a" stroke="#8c72f5" stroke-width="1.4" />
      <rect x="256" y="196" width="8" height="22" fill="#d8d2f8" />
      <rect x="269" y="186" width="8" height="32" fill="#a468fa" />
      <rect x="282" y="192" width="8" height="26" fill="#d8d2f8" />
      <rect x="190" y="182" width="38" height="32" rx="6" fill="#1c2360" />
      <rect x="30" y="194" width="144" height="50" rx="8" fill="#141a4e" />
      <rect x="44" y="208" width="96" height="7" rx="2" fill="#a69fd8" opacity="0.7" />
      <rect x="44" y="222" width="70" height="7" rx="2" fill="#827bb8" opacity="0.65" />
      ${lines}
      ${rings}
    `;
  }

  root.querySelectorAll("[data-era]").forEach((b) => b.addEventListener("click", () => selectEra(b.dataset.era)));
  root.querySelectorAll("[data-task]").forEach((b) => b.addEventListener("click", () => selectTask(b.dataset.task)));

  selectEra("qingming");
  selectTask("free");
}

// ============================================================
// 04. 五大应用场景实景微排版 + X-Ray 透视滑门（Before/After 幕布）
// ============================================================
export function initApplicationsXRay() {
  const root = document.getElementById("sec4-xray");
  if (!root) return;

  const APPS = {
    infographic: {
      name: "信息图表",
      note: "宏观结论圆环做焦点 A，折线趋势做焦点 B，分项六角块做焦点 C，底部口径注脚做焦点 D——让长数据既有第一眼结论，又耐得住细读。",
      foci: [
        { id: "A", x: 132, y: 112, r: 54, shape: "circle" },
        { id: "B", x: 356, y: 98, r: 40, shape: "circle" },
        { id: "C", x: 344, y: 222, r: 38, shape: "hex" },
        { id: "D", x: 138, y: 234, r: 28, shape: "circle" },
      ],
      design: `
        <rect width="480" height="300" fill="#ffffff" />
        <rect x="24" y="20" width="136" height="14" rx="3" fill="#0c1033" />
        <rect x="24" y="42" width="96" height="7" rx="2" fill="#6758b8" />
        <circle cx="132" cy="118" r="50" fill="none" stroke="#e4dff8" stroke-width="14" />
        <circle cx="132" cy="118" r="50" fill="none" stroke="#4b2bc4" stroke-width="14" stroke-dasharray="216 314" transform="rotate(-90 132 118)" />
        <text x="132" y="124" text-anchor="middle" fill="#0c1033" font-size="22" font-weight="800" font-family="Manrope, sans-serif">68%</text>
        <rect x="256" y="54" width="198" height="86" rx="10" fill="#f3f0fc" />
        <polyline points="274,118 308,96 342,106 378,76 426,68" fill="none" stroke="#5532d4" stroke-width="3.2" />
        <circle cx="426" cy="68" r="5" fill="#4b2bc4" />
        <rect x="256" y="160" width="198" height="114" rx="10" fill="#ece8fa" />
        <rect x="282" y="218" width="22" height="38" rx="3" fill="#8b76e8" />
        <rect x="316" y="192" width="22" height="64" rx="3" fill="#4b2bc4" />
        <rect x="350" y="206" width="22" height="50" rx="3" fill="#7141ea" />
        <rect x="384" y="182" width="22" height="74" rx="3" fill="#2a1b6e" />
        <rect x="24" y="204" width="212" height="70" rx="10" fill="#f6f5fc" stroke="#ded8f4" />
        <rect x="40" y="222" width="132" height="8" rx="2" fill="#373b63" />
        <rect x="40" y="238" width="166" height="6" rx="2" fill="#7d79a6" />
        <rect x="40" y="250" width="118" height="6" rx="2" fill="#7d79a6" />
      `,
    },
    product: {
      name: "产品展示",
      note: "主机轮廓占头号视觉重量（A），核心卖点特写窗（B）与材质截面六角卡（C）形成对比陪衬，参数角标（D）在另一端稳住力矩。",
      foci: [
        { id: "A", x: 162, y: 148, r: 62, shape: "circle" },
        { id: "B", x: 358, y: 92, r: 40, shape: "circle" },
        { id: "C", x: 366, y: 214, r: 36, shape: "hex" },
        { id: "D", x: 82, y: 244, r: 24, shape: "circle" },
      ],
      design: `
        <rect width="480" height="300" fill="#faf9fe" />
        <circle cx="162" cy="146" r="68" fill="#ece7fa" />
        <rect x="116" y="92" width="92" height="114" rx="18" fill="#181c4a" />
        <circle cx="162" cy="138" r="24" fill="#4b37a2" stroke="#b59cff" stroke-width="3" />
        <circle cx="162" cy="138" r="10" fill="#090d2e" />
        <rect x="284" y="46" width="164" height="90" rx="12" fill="#ffffff" stroke="#d8d0f2" />
        <text x="304" y="84" fill="#4b2bc4" font-size="14" font-weight="700" font-family="Unbounded, sans-serif">F/1.4</text>
        <rect x="304" y="98" width="116" height="7" rx="2" fill="#373b63" />
        <rect x="304" y="112" width="84" height="6" rx="2" fill="#8d87b8" />
        <polygon points="${hexPoints(366, 214, 44)}" fill="#2b216b" />
        <text x="366" y="218" text-anchor="middle" fill="#e8e3ff" font-size="11" font-weight="700" font-family="Manrope, sans-serif">TITANIUM</text>
        <rect x="30" y="226" width="104" height="44" rx="8" fill="#ece8fa" />
        <rect x="44" y="240" width="68" height="7" rx="2" fill="#373b63" />
        <rect x="44" y="253" width="48" height="6" rx="2" fill="#7771a3" />
      `,
    },
    magazine: {
      name: "杂志版式",
      note: "跨页左栏用大标题与引语（B）起势，右页大幅摄影（A）夺取主焦，右下异形裁切图（C）与左下注脚（D）让整张跨页重心稳落中缝。",
      foci: [
        { id: "A", x: 344, y: 112, r: 58, shape: "circle" },
        { id: "B", x: 120, y: 102, r: 42, shape: "circle" },
        { id: "C", x: 356, y: 226, r: 34, shape: "hex" },
        { id: "D", x: 114, y: 226, r: 28, shape: "circle" },
      ],
      design: `
        <rect width="480" height="300" fill="#ffffff" />
        <line x1="240" y1="16" x2="240" y2="284" stroke="#e2ddf5" stroke-width="1.5" />
        <rect x="28" y="42" width="176" height="22" rx="3" fill="#0c1033" />
        <rect x="28" y="74" width="144" height="12" rx="3" fill="#4b2bc4" />
        <rect x="28" y="104" width="176" height="44" rx="6" fill="#f3f0fc" />
        <text x="42" y="131" fill="#3b2699" font-size="13" font-style="italic" font-family="Fraunces, serif">“Multiple rhythms, one page.”</text>
        <rect x="28" y="176" width="176" height="7" rx="2" fill="#6b688e" />
        <rect x="28" y="190" width="160" height="7" rx="2" fill="#6b688e" />
        <rect x="28" y="204" width="170" height="7" rx="2" fill="#6b688e" />
        <rect x="28" y="228" width="96" height="42" rx="6" fill="#ece8fa" />
        <rect x="266" y="34" width="184" height="146" rx="10" fill="#2c1f78" />
        <polygon points="292,164 356,74 422,164" fill="#a488ff" opacity="0.85" />
        <polygon points="${hexPoints(358, 232, 36)}" fill="#4b2bc4" />
        <rect x="268" y="206" width="46" height="54" rx="4" fill="#ece8fa" />
      `,
    },
    poster: {
      name: "海报设计",
      note: "即 094 原海报本身：主标压住左上视觉场，A/B/C/D 四枚焦点围绕中央平衡球错落分布，底栏核心卡与四要点封住下缘重量。",
      foci: [
        { id: "A", x: 326, y: 102, r: 54, shape: "circle" },
        { id: "B", x: 152, y: 146, r: 40, shape: "circle" },
        { id: "C", x: 332, y: 214, r: 38, shape: "hex" },
        { id: "D", x: 148, y: 236, r: 28, shape: "circle" },
      ],
      design: `
        <rect width="480" height="300" fill="#03082c" />
        <rect x="28" y="24" width="144" height="22" rx="3" fill="#f4f2fc" />
        <rect x="28" y="54" width="108" height="6" rx="2" fill="#8f72f8" />
        <circle cx="326" cy="102" r="46" fill="#5e3fd4" stroke="#d8d2f8" stroke-width="1.5" />
        <circle cx="152" cy="146" r="34" fill="#352b86" stroke="#b59cff" stroke-width="1.4" />
        <polygon points="${hexPoints(332, 214, 34)}" fill="#4b37a2" stroke="#c7b2ff" stroke-width="1.4" />
        <circle cx="148" cy="236" r="24" fill="#251d62" stroke="#9d86f2" stroke-width="1.2" />
        <circle cx="242" cy="166" r="8" fill="#b4b0d8" />
      `,
    },
    dataviz: {
      name: "数据可视化",
      note: "大屏仪表盘最忌十块卡片等权堆砌。把全局总览做成超大主焦（A），把异常告警（B）、地理分布（C）与明细表（D）按权重逐级退后。",
      foci: [
        { id: "A", x: 162, y: 132, r: 58, shape: "circle" },
        { id: "B", x: 368, y: 84, r: 40, shape: "circle" },
        { id: "C", x: 358, y: 208, r: 38, shape: "hex" },
        { id: "D", x: 142, y: 244, r: 26, shape: "circle" },
      ],
      design: `
        <rect width="480" height="300" fill="#0a0f33" />
        <rect x="22" y="24" width="250" height="176" rx="12" fill="#131a4f" stroke="#363878" />
        <polyline points="42,164 88,128 134,142 182,78 248,66" fill="none" stroke="#56e8b8" stroke-width="3" />
        <circle cx="182" cy="78" r="6" fill="#56e8b8" />
        <rect x="290" y="24" width="168" height="106" rx="12" fill="#1a1f5c" stroke="#5742b8" />
        <text x="310" y="70" fill="#ff808e" font-size="20" font-weight="700" font-family="Manrope, sans-serif">+24.6%</text>
        <rect x="310" y="86" width="112" height="7" rx="2" fill="#8f89c4" />
        <rect x="290" y="146" width="168" height="130" rx="12" fill="#131a4f" stroke="#363878" />
        <polygon points="${hexPoints(374, 210, 38)}" fill="#3d2c91" stroke="#a468fa" />
        <rect x="22" y="216" width="250" height="60" rx="10" fill="#101645" />
        <rect x="38" y="234" width="168" height="6" rx="2" fill="#6f6aa8" />
        <rect x="38" y="249" width="124" height="6" rx="2" fill="#524d88" />
      `,
    },
  };

  let curApp = "infographic";
  let splitPct = 52;

  const designSvg = document.getElementById("sec4-design-svg");
  const xraySvg = document.getElementById("sec4-xray-svg");
  const xrayLayer = document.getElementById("sec4-xray-layer");
  const divider = document.getElementById("sec4-divider");
  const range = document.getElementById("sec4-range");
  const noteEl = document.getElementById("sec4-note");
  const pctEl = document.getElementById("sec4-pct");

  function renderApp() {
    const app = APPS[curApp];
    designSvg.innerHTML = app.design;
    noteEl.textContent = app.note;

    const f = app.foci;
    let lines = "";
    for (let i = 0; i < f.length; i++) {
      const a = f[i];
      const b = f[(i + 1) % f.length];
      lines += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${i === f.length - 1 ? "rgba(181,156,255,0.4)" : "#d4cbff"}" stroke-width="1.8" stroke-dasharray="6 5" />`;
    }
    const nodes = f
      .map((nd) => {
        const shape =
          nd.shape === "hex"
            ? `<polygon points="${hexPoints(nd.x, nd.y, nd.r)}" fill="rgba(127,76,248,0.28)" stroke="#b59cff" stroke-width="2" />`
            : `<circle cx="${nd.x}" cy="${nd.y}" r="${nd.r}" fill="rgba(127,76,248,0.28)" stroke="#b59cff" stroke-width="2" />`;
        return `
          ${shape}
          <circle cx="${nd.x}" cy="${nd.y}" r="12" fill="#4b37a2" stroke="#ffffff" stroke-width="1.4" />
          <text x="${nd.x}" y="${nd.y + 4}" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="700" font-family="Unbounded, sans-serif">${nd.id}</text>
        `;
      })
      .join("");

    // 计算重心支点
    let gx = 0, gy = 0, tw = 0;
    f.forEach((nd) => {
      const w = nd.r * nd.r;
      gx += nd.x * w;
      gy += nd.y * w;
      tw += w;
    });
    gx /= tw;
    gy /= tw;

    xraySvg.innerHTML = `
      <rect width="480" height="300" fill="#03082c" />
      <circle cx="240" cy="150" r="46" fill="none" stroke="rgba(86,232,184,0.38)" stroke-dasharray="4 4" />
      ${lines}
      ${nodes}
      <circle cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="7" fill="#56e8b8" stroke="#03082c" stroke-width="2" />
      <text x="${gx.toFixed(1)}" y="${(gy + 20).toFixed(1)}" text-anchor="middle" fill="#8ff2cf" font-size="10.5" font-weight="600" font-family="Manrope, sans-serif">平衡支点</text>
    `;
  }

  function applySplit(pct) {
    splitPct = Math.max(5, Math.min(95, pct));
    xrayLayer.style.clipPath = `inset(0 0 0 ${splitPct}%)`;
    divider.style.left = `${splitPct}%`;
    range.value = String(Math.round(splitPct));
    pctEl.textContent = `透视揭开 ${Math.round(100 - splitPct)}%`;
  }

  root.querySelectorAll("[data-app]").forEach((btn) => {
    btn.addEventListener("click", () => {
      curApp = btn.dataset.app;
      root.querySelectorAll("[data-app]").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderApp();
    });
  });

  range.addEventListener("input", () => applySplit(Number(range.value)));

  // 支持直接拖动幕布分割线
  const frame = document.getElementById("sec4-frame");
  let dragging = false;
  const moveAt = (clientX) => {
    const rect = frame.getBoundingClientRect();
    applySplit(((clientX - rect.left) / Math.max(1, rect.width)) * 100);
  };
  frame.addEventListener("pointerdown", (e) => {
    dragging = true;
    moveAt(e.clientX);
    if (frame.setPointerCapture) try { frame.setPointerCapture(e.pointerId); } catch {}
  });
  frame.addEventListener("pointermove", (e) => {
    if (dragging) moveAt(e.clientX);
  });
  frame.addEventListener("pointerup", () => (dragging = false));

  renderApp();
  applySplit(52);
}

// ============================================================
// 05. 什么时候别用多重焦点 — 三问情境诊断树
// ============================================================
export function initDecisionTree() {
  const root = document.getElementById("sec5-tree");
  if (!root) return;

  const state = { time: "short", items: "one", size: "small" };
  const verdictTag = document.getElementById("sec5-tag");
  const verdictTitle = document.getElementById("sec5-title");
  const verdictDesc = document.getElementById("sec5-desc");

  function evaluateTree() {
    let score = 0;
    if (state.time === "medium") score += 2;
    if (state.time === "long") score += 3;
    if (state.items === "mid") score += 2;
    if (state.items === "many") score += 3;
    if (state.size === "medium") score += 2;
    if (state.size === "large") score += 3;

    verdictTag.className = "pill-tag";
    if (state.items === "one" || state.time === "short" || (state.size === "small" && score <= 4)) {
      verdictTag.classList.add("is-err");
      verdictTag.textContent = "建议改用单一焦点";
      verdictTitle.textContent = "这个场景请别硬上多重焦点，立刻改用「093 单一焦点构图」";
      verdictDesc.innerHTML = `在「${state.time === "short" ? "3 秒内一瞥" : state.items === "one" ? "单一核心结论" : "极小屏幕/远距识别"}」条件下，多焦点会分散第一眼冲击力。请把全部视觉权重集中到唯一主角（详见 <a href="https://layout.xiaoxiaodong.ai/093/play/" target="_blank" rel="noopener">093 单一焦点构图</a>），若需要瞬间冲刺动势也可转向 <a href="https://layout.xiaoxiaodong.ai/090/play/" target="_blank" rel="noopener">090 动态构图</a>。`;
    } else if (score <= 6) {
      verdictTag.classList.add("is-warn");
      verdictTag.textContent = "谨慎使用 · 精简至 2–3 焦";
      verdictTitle.textContent = "适合「轻量化双焦或三角主从」，切忌塞满四五个强节点";
      verdictDesc.innerHTML = `当前画幅与阅读时长介于中档：保留 1 枚明确主焦 + 1–2 枚次焦即可，主次权重比拉开到 1.8× 以上；若想在边界内收紧安全感，可结合 <a href="https://layout.xiaoxiaodong.ai/092/play/" target="_blank" rel="noopener">092 封闭式构图</a> 的框定手法。`;
    } else {
      verdictTag.classList.add("is-ok");
      verdictTag.textContent = "非常适合多重焦点构图";
      verdictTitle.textContent = "放手搭建 3–5 枚错落焦点，用路径与形态对比引导深读";
      verdictDesc.innerHTML = `宽裕的画幅与停留时间正是多重焦点大显身手的舞台：为第一眼定好主焦，用异形对比和弯弧路径串起次级信息，并盯紧中央平衡支点。若希望视线继续向画外延展，也可与 <a href="https://layout.xiaoxiaodong.ai/091/play/" target="_blank" rel="noopener">091 开放式构图</a> 搭配。`;
    }
  }

  root.querySelectorAll("[data-q]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = btn.dataset.q;
      const v = btn.dataset.val;
      state[q] = v;
      root.querySelectorAll(`[data-q="${q}"]`).forEach((b) => b.classList.toggle("is-active", b === btn));
      evaluateTree();
    });
  });

  evaluateTree();
}

// ============================================================
// 06. 小练习：3 道单变量四选一盲测（中性标签 A/B/C/D，绝不剧透）
// ============================================================
export function initQuiz() {
  const root = document.getElementById("sec6-quiz");
  if (!root) return;

  const QUESTIONS = [
    {
      id: 0,
      tab: "第 1 题 · 主次梯阶",
      prompt: "下面四张版面的位置、颜色与连接路径完全相同，只改变了四个焦点的面积与明暗权重。哪一张最符合多重焦点构图？",
      answer: "C",
      options: [
        {
          key: "A",
          svg: `
            <rect width="200" height="145" rx="8" fill="#040a2e"/>
            <line x1="142" y1="42" x2="60" y2="62" stroke="#9e8ff0" stroke-dasharray="4 3"/>
            <line x1="60" y1="62" x2="144" y2="104" stroke="#9e8ff0" stroke-dasharray="4 3"/>
            <line x1="144" y1="104" x2="58" y2="114" stroke="#9e8ff0" stroke-dasharray="4 3"/>
            <circle cx="142" cy="42" r="21" fill="#7c56f6"/>
            <circle cx="60" cy="62" r="21" fill="#7c56f6"/>
            <polygon points="${hexPoints(144, 104, 21)}" fill="#7c56f6"/>
            <circle cx="58" cy="114" r="20" fill="#7c56f6"/>
          `,
          feedback: "四枚焦点几乎等大等亮，陷入「四王争霸」，观众第一眼不知道从哪进入。",
        },
        {
          key: "B",
          svg: `
            <rect width="200" height="145" rx="8" fill="#040a2e"/>
            <line x1="142" y1="44" x2="60" y2="62" stroke="#9e8ff0" stroke-dasharray="4 3"/>
            <line x1="60" y1="62" x2="144" y2="104" stroke="#9e8ff0" stroke-dasharray="4 3"/>
            <line x1="144" y1="104" x2="58" y2="114" stroke="#9e8ff0" stroke-dasharray="4 3"/>
            <circle cx="142" cy="44" r="34" fill="#9c7aff"/>
            <circle cx="60" cy="62" r="7" fill="#3a3375"/>
            <polygon points="${hexPoints(144, 104, 7)}" fill="#3a3375"/>
            <circle cx="58" cy="114" r="6" fill="#3a3375"/>
          `,
          feedback: "右上角独占绝大部分视觉重量，其余三点缩成微弱噪点，已经退回单一焦点构图。",
        },
        {
          key: "C",
          svg: `
            <rect width="200" height="145" rx="8" fill="#040a2e"/>
            <line x1="142" y1="42" x2="60" y2="62" stroke="#b59cff" stroke-dasharray="4 3"/>
            <line x1="60" y1="62" x2="144" y2="104" stroke="#b59cff" stroke-dasharray="4 3"/>
            <line x1="144" y1="104" x2="58" y2="114" stroke="#b59cff" stroke-dasharray="4 3"/>
            <circle cx="142" cy="42" r="27" fill="#9a72ff"/>
            <circle cx="60" cy="62" r="20" fill="#734ce8"/>
            <polygon points="${hexPoints(144, 104, 18)}" fill="#5f3ec9"/>
            <circle cx="58" cy="114" r="13" fill="#46309c"/>
          `,
          feedback: "正确！主焦明确领头，次焦、六角承焦与细节节点形成清晰的权重梯阶，视线一进场就能顺阶漫游。",
        },
        {
          key: "D",
          svg: `
            <rect width="200" height="145" rx="8" fill="#040a2e"/>
            <line x1="142" y1="42" x2="60" y2="62" stroke="#9e8ff0" stroke-dasharray="4 3"/>
            <line x1="60" y1="62" x2="144" y2="104" stroke="#9e8ff0" stroke-dasharray="4 3"/>
            <line x1="144" y1="104" x2="58" y2="114" stroke="#9e8ff0" stroke-dasharray="4 3"/>
            <circle cx="142" cy="42" r="26" fill="#9a72ff"/>
            <circle cx="60" cy="62" r="10" fill="#423382"/>
            <polygon points="${hexPoints(144, 104, 10)}" fill="#423382"/>
            <circle cx="58" cy="114" r="26" fill="#9a72ff"/>
          `,
          feedback: "对角两枚同样最强，中间两枚彻底断档，眼睛会在对角两端来回弹跳，跳过中段信息。",
        },
      ],
    },
    {
      id: 1,
      tab: "第 2 题 · 重心平衡",
      prompt: "四张版面的主次大小与形态完全一致，只改变了四个焦点在画框里的位置。哪一张把视觉重量平衡得最稳？",
      answer: "B",
      options: [
        {
          key: "A",
          svg: `
            <rect width="200" height="145" rx="8" fill="#040a2e"/>
            <circle cx="100" cy="72" r="18" fill="none" stroke="rgba(164,132,255,0.22)" stroke-dasharray="3 3"/>
            <circle cx="48" cy="36" r="25" fill="#9a72ff"/>
            <circle cx="84" cy="64" r="18" fill="#734ce8"/>
            <polygon points="${hexPoints(46, 98, 17)}" fill="#5f3ec9"/>
            <circle cx="82" cy="116" r="12" fill="#46309c"/>
          `,
          feedback: "全部焦点堆在左半幅，右侧大片塌空，视觉重心严重偏左倾覆。",
        },
        {
          key: "B",
          svg: `
            <rect width="200" height="145" rx="8" fill="#040a2e"/>
            <circle cx="100" cy="72" r="18" fill="none" stroke="rgba(86,232,184,0.34)" stroke-dasharray="3 3"/>
            <circle cx="140" cy="42" r="25" fill="#9a72ff"/>
            <circle cx="58" cy="62" r="19" fill="#734ce8"/>
            <polygon points="${hexPoints(142, 104, 17)}" fill="#5f3ec9"/>
            <circle cx="56" cy="112" r="13" fill="#46309c"/>
          `,
          feedback: "正确！四个焦点围绕画面中央支点形成对角力矩互衡，且彼此之间和画框边缘都留出了舒适呼吸隙。",
        },
        {
          key: "C",
          svg: `
            <rect width="200" height="145" rx="8" fill="#040a2e"/>
            <circle cx="100" cy="72" r="18" fill="none" stroke="rgba(164,132,255,0.22)" stroke-dasharray="3 3"/>
            <circle cx="182" cy="20" r="25" fill="#9a72ff"/>
            <circle cx="18" cy="22" r="19" fill="#734ce8"/>
            <polygon points="${hexPoints(182, 128, 17)}" fill="#5f3ec9"/>
            <circle cx="18" cy="128" r="13" fill="#46309c"/>
          `,
          feedback: "四枚焦点死贴四角边缘，中心空洞过大，边缘张力把视线往画框外拉扯。",
        },
        {
          key: "D",
          svg: `
            <rect width="200" height="145" rx="8" fill="#040a2e"/>
            <circle cx="100" cy="72" r="18" fill="none" stroke="rgba(164,132,255,0.22)" stroke-dasharray="3 3"/>
            <circle cx="110" cy="56" r="25" fill="#9a72ff"/>
            <circle cx="92" cy="74" r="19" fill="#734ce8"/>
            <polygon points="${hexPoints(122, 86, 17)}" fill="#5f3ec9"/>
            <circle cx="76" cy="96" r="13" fill="#46309c"/>
          `,
          feedback: "四枚焦点在中央互相叠压粘连，丧失了各自的独立身份，糊成一团。",
        },
      ],
    },
    {
      id: 2,
      tab: "第 3 题 · 路径与节奏",
      prompt: "四张版面的坐标与权重完全一致，只改变了引导路径与形态搭配。哪一张能最顺畅地带完视线？",
      answer: "C",
      options: [
        {
          key: "A",
          svg: `
            <rect width="200" height="145" rx="8" fill="#040a2e"/>
            <line x1="142" y1="42" x2="56" y2="112" stroke="#d0c6ff" stroke-width="1.8" stroke-dasharray="4 3"/>
            <line x1="56" y1="112" x2="58" y2="54" stroke="#d0c6ff" stroke-width="1.8" stroke-dasharray="4 3"/>
            <line x1="58" y1="54" x2="144" y2="104" stroke="#d0c6ff" stroke-width="1.8" stroke-dasharray="4 3"/>
            <circle cx="142" cy="42" r="25" fill="#9a72ff"/>
            <circle cx="58" cy="54" r="18" fill="#734ce8"/>
            <circle cx="144" cy="104" r="16" fill="#5f3ec9"/>
            <circle cx="56" cy="112" r="12" fill="#46309c"/>
          `,
          feedback: "路径在画布正中交叉成 X 死结，迫使视线来回折返；且四枚全同为圆，节奏平淡。",
        },
        {
          key: "B",
          svg: `
            <rect width="200" height="145" rx="8" fill="#040a2e"/>
            <circle cx="142" cy="42" r="25" fill="#9a72ff"/>
            <circle cx="58" cy="54" r="18" fill="#734ce8"/>
            <circle cx="144" cy="104" r="16" fill="#5f3ec9"/>
            <circle cx="56" cy="112" r="12" fill="#46309c"/>
          `,
          feedback: "焦点之间完全没有视觉路径与形态变化做桥接，四块彼此割裂成孤岛。",
        },
        {
          key: "C",
          svg: `
            <rect width="200" height="145" rx="8" fill="#040a2e"/>
            <path d="M 142 42 Q 96 34 58 54" fill="none" stroke="#d8d2f8" stroke-width="1.8" stroke-dasharray="4 3"/>
            <path d="M 58 54 Q 106 88 144 104" fill="none" stroke="#d8d2f8" stroke-width="1.8" stroke-dasharray="4 3"/>
            <path d="M 144 104 Q 102 124 56 112" fill="none" stroke="#d8d2f8" stroke-width="1.8" stroke-dasharray="4 3"/>
            <circle cx="142" cy="42" r="25" fill="#9a72ff"/>
            <circle cx="58" cy="54" r="18" fill="#734ce8"/>
            <polygon points="${hexPoints(144, 104, 17)}" fill="#6a48de"/>
            <circle cx="56" cy="112" r="12" fill="#46309c"/>
          `,
          feedback: "正确！弯弧虚线零交叉地顺次串联四焦，且用第三枚六边形制造形态变化，像 094 原海报一样赋予画面起承转合的节拍。",
        },
        {
          key: "D",
          svg: `
            <rect width="200" height="145" rx="8" fill="#040a2e"/>
            <line x1="142" y1="42" x2="196" y2="10" stroke="#d0c6ff" stroke-width="1.8" stroke-dasharray="4 3"/>
            <line x1="58" y1="54" x2="6" y2="30" stroke="#d0c6ff" stroke-width="1.8" stroke-dasharray="4 3"/>
            <line x1="144" y1="104" x2="196" y2="132" stroke="#d0c6ff" stroke-width="1.8" stroke-dasharray="4 3"/>
            <line x1="56" y1="112" x2="6" y2="136" stroke="#d0c6ff" stroke-width="1.8" stroke-dasharray="4 3"/>
            <circle cx="142" cy="42" r="25" fill="#9a72ff"/>
            <circle cx="58" cy="54" r="18" fill="#734ce8"/>
            <polygon points="${hexPoints(144, 104, 17)}" fill="#6a48de"/>
            <circle cx="56" cy="112" r="12" fill="#46309c"/>
          `,
          feedback: "所有引导线反向往四角画外发射，非但没串联焦点，反而把视线直接推出画框。",
        },
      ],
    },
  ];

  let curQ = 0;
  const chosen = {};
  const promptEl = document.getElementById("sec6-prompt");
  const gridEl = document.getElementById("sec6-grid");
  const feedbackEl = document.getElementById("sec6-feedback");
  const scoreEl = document.getElementById("sec6-score");

  function updateScore() {
    const answered = Object.keys(chosen).length;
    const correct = QUESTIONS.filter((q) => chosen[q.id] === q.answer).length;
    scoreEl.textContent = `进度 ${answered}/${QUESTIONS.length} · 答对 ${correct} 题`;
  }

  function renderQ() {
    const q = QUESTIONS[curQ];
    promptEl.textContent = q.prompt;
    root.querySelectorAll("[data-qtab]").forEach((b) => {
      const id = Number(b.dataset.qtab);
      b.classList.toggle("is-active", id === curQ);
      b.classList.toggle("is-done", chosen[id] === QUESTIONS[id].answer);
    });

    const pick = chosen[curQ];
    gridEl.innerHTML = q.options
      .map((opt) => {
        const isPicked = pick === opt.key;
        const isRight = pick && opt.key === q.answer;
        const cls = isRight ? "is-right" : isPicked && !isRight ? "is-wrong" : "";
        return `
          <button type="button" class="quiz-card ${cls}" data-opt="${opt.key}" aria-pressed="${isPicked}">
            <svg viewBox="0 0 200 145" class="quiz-svg" aria-hidden="true">${opt.svg}</svg>
            <span class="quiz-label">方案 ${opt.key}</span>
          </button>
        `;
      })
      .join("");

    gridEl.querySelectorAll("[data-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        chosen[curQ] = btn.dataset.opt;
        renderQ();
        updateScore();
      });
    });

    if (!pick) {
      feedbackEl.className = "quiz-feedback";
      feedbackEl.innerHTML = `<p>请从上方四张单变量盲测版面中选出最成立的一张，点击后立即查看解析。</p>`;
    } else {
      const pickedOpt = q.options.find((o) => o.key === pick);
      const rightOpt = q.options.find((o) => o.key === q.answer);
      const isOk = pick === q.answer;
      feedbackEl.className = `quiz-feedback ${isOk ? "is-right" : "is-wrong"}`;
      feedbackEl.innerHTML = `
        <p class="quiz-fb-head"><strong>${isOk ? `选对了！方案 ${q.answer} 成立` : `方案 ${pick} 会出问题（正确答案：方案 ${q.answer}）`}</strong></p>
        <p>${pickedOpt.feedback}${isOk ? "" : ` — 为什么选方案 ${q.answer}：${rightOpt.feedback}`}</p>
      `;
    }
  }

  root.querySelectorAll("[data-qtab]").forEach((b) => {
    b.addEventListener("click", () => {
      curQ = Number(b.dataset.qtab);
      renderQ();
    });
  });

  renderQ();
  updateScore();
}

// ============================================================
// 07. 原海报全屏放大灯箱（缩放、拖拽平移、Esc 关闭）
// ============================================================
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const modal = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const lbStage = document.getElementById("lightbox-stage");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomInBtn = document.getElementById("lightbox-zoom-in");
  const zoomOutBtn = document.getElementById("lightbox-zoom-out");
  const resetBtn = document.getElementById("lightbox-reset");
  if (!trigger || !modal || !posterImg || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbStage.style.cursor = scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in";
  }

  function open() {
    lbImg.src = posterImg.currentSrc || posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    closeBtn.focus();
  }

  function close() {
    modal.hidden = true;
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === lbStage) {
      if (!dragging && scale === 1) close();
    }
  });
  window.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") close();
  });

  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.5).toFixed(2));
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(1, +(scale - 0.5).toFixed(2));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  resetBtn.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(1, Math.min(3, +(scale + (e.deltaY < 0 ? 0.25 : -0.25)).toFixed(2)));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    applyTransform();
    if (lbStage.setPointerCapture) try { lbStage.setPointerCapture(e.pointerId); } catch {}
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  lbStage.addEventListener("pointerup", () => {
    dragging = false;
    applyTransform();
  });
}

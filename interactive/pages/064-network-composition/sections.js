// 064 网络构图 — 正文各节独立交互引擎（01 三层解剖 / 02 交叉与弧度 / 03 三态断链打击 / 04 历史标本 / 05 场景蓝图 / 06 单变量小练习 / 07 原海报灯箱）
import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, ROLE_META } from "./palette.js";
import { NODE_DEFS, QUIZ_OPTIONS, segmentIntersection } from "./model.js";

/* =====================================================================
 * 01 节：三层透视解剖器（完整网络 / 只看节点体量 / 只看连线骨架 / 只看留白与流向）
 * ===================================================================== */
export function mountAnatomyLab(container) {
  const svg = container.querySelector("#anatomySvg");
  const noteEl = container.querySelector("#anatomyNote");
  const btns = [...container.querySelectorAll("[data-layer]")];

  const NOTES = {
    all: {
      title: "完整三层叠加：入口、关系与呼吸同时成立",
      body: "核心与关键圆给出 3 秒内的第一落脚点，实虚线拆开主干与次连，40% 以上空白把标签和交点彼此托开——三层缺任何一层，网络都会迅速失焦。",
    },
    nodes: {
      title: "抽离连线、只看节点：退回 062 分散点阵",
      body: "没有线条连接时，眼睛只能靠大小与颜色分出 3 档主次，却完全看不出「反馈」怎么回到「信息源」、谁依赖谁。节点定轻重，连线才定关系。",
    },
    edges: {
      title: "抽离体量、只看连线：主干与次连靠实虚分工",
      body: "即便把所有圆缩小成等大端点，粗实线仍能一眼画出核心主干，细虚线退居背景承载协同与回流。要是实虚不分，整张网瞬间变成平权线团。",
    },
    space: {
      title: "只看留白与信息流向：空白决定标签活不活得下来",
      body: "每个圆周外缘都留出宽裕纸白，线上中继圆点沿着外环顺畅接力。留白被挤干时，节点字样与交叉线撞成一团，信息流动也无从辨认。",
    },
  };

  function render(layer) {
    svg.dataset.layer = layer;
    const n = NOTES[layer] || NOTES.all;
    noteEl.innerHTML = `<strong>${n.title}</strong><p>${n.body}</p>`;
    btns.forEach((b) => {
      const active = b.dataset.layer === layer;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => render(b.dataset.layer)));
  render("all");
}

/* =====================================================================
 * 02 节：直弧避让与最短跳数实验台（呼应 Helen C. Purchase 1997）
 * ===================================================================== */
export function mountCrossingLab(container) {
  const canvas = container.querySelector("#crossingCanvas");
  const ctx = canvas.getContext("2d");
  const modeBtns = [...container.querySelectorAll("[data-cross-mode]")];
  const curveInput = container.querySelector("#curveRange");
  const curveVal = container.querySelector("#curveVal");
  const readoutEl = container.querySelector("#crossingReadout");

  const LABELS = ["A 源", "B 编", "C 核", "D 推", "E 评", "F 析", "G 传"];
  const LAYOUTS = {
    tangled: [
      { u: 0.14, v: 0.22 }, { u: 0.84, v: 0.20 }, { u: 0.44, v: 0.58 },
      { u: 0.16, v: 0.80 }, { u: 0.84, v: 0.78 }, { u: 0.56, v: 0.16 }, { u: 0.62, v: 0.86 },
    ],
    curved: [
      { u: 0.14, v: 0.22 }, { u: 0.84, v: 0.20 }, { u: 0.44, v: 0.58 },
      { u: 0.16, v: 0.80 }, { u: 0.84, v: 0.78 }, { u: 0.56, v: 0.16 }, { u: 0.62, v: 0.86 },
    ],
    untangled: [
      { u: 0.18, v: 0.26 }, { u: 0.50, v: 0.15 }, { u: 0.50, v: 0.51 },
      { u: 0.82, v: 0.26 }, { u: 0.82, v: 0.76 }, { u: 0.50, v: 0.87 }, { u: 0.18, v: 0.76 },
    ],
  };

  // 同一组拓扑边（10 条），杂乱排布在开放空间显露全部交叉，解结重排后严格归零
  const EDGES = [
    [0, 1], [1, 3], [3, 4], [4, 5], [5, 6], [6, 0],
    [2, 0], [2, 1], [2, 3], [2, 4],
  ];
  const UNTANGLED_EDGES = [
    [0, 1], [1, 3], [3, 4], [4, 5], [5, 6], [6, 0],
    [2, 0], [2, 1], [2, 3], [2, 4],
  ];

  const st = {
    mode: "tangled",
    curve: 0,
    pathFrom: 0,
    pathTo: 4,
    pickStage: 0,
  };

  let W = 560;
  let H = 290;
  let dpr = pixelRatio(2);

  function resize() {
    const cw = canvas.parentElement.clientWidth;
    W = Math.max(240, Math.round(cw));
    H = Math.round(Math.max(230, Math.min(330, W * 0.54)));
    dpr = pixelRatio(2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.height = `${H}px`;
  }

  function activeEdges() {
    return st.mode === "untangled" ? UNTANGLED_EDGES : EDGES;
  }

  function shortestPath(from, to, edges) {
    const adj = Array.from({ length: LABELS.length }, () => []);
    for (const [a, b] of edges) {
      adj[a].push(b);
      adj[b].push(a);
    }
    const q = [[from]];
    const seen = new Set([from]);
    while (q.length) {
      const p = q.shift();
      const last = p[p.length - 1];
      if (last === to) return p;
      for (const nx of adj[last]) {
        if (!seen.has(nx)) {
          seen.add(nx);
          q.push([...p, nx]);
        }
      }
    }
    return [from];
  }

  // 把二次贝塞尔采样成折线来实算几何交叉数，绝不写死假数字
  function edgeSamples(a, b, idx, bend) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const sign = idx % 2 === 0 ? 1 : -1;
    const offset = bend * Math.min(68, len * 0.34) * sign;
    const cx = mx + nx * offset;
    const cy = my + ny * offset;
    const steps = bend > 0.02 ? 10 : 1;
    const pts = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const mt = 1 - t;
      pts.push({
        x: mt * mt * a.x + 2 * mt * t * cx + t * t * b.x,
        y: mt * mt * a.y + 2 * mt * t * cy + t * t * b.y,
      });
    }
    return { cx, cy, pts };
  }

  function countPolyCrossings(polys, edges) {
    const hits = [];
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const [a1, b1] = edges[i];
        const [a2, b2] = edges[j];
        if (a1 === a2 || a1 === b2 || b1 === a2 || b1 === b2) continue;
        const p1 = polys[i].pts;
        const p2 = polys[j].pts;
        let found = false;
        for (let s1 = 0; s1 < p1.length - 1 && !found; s1++) {
          for (let s2 = 0; s2 < p2.length - 1 && !found; s2++) {
            const hit = segmentIntersection(p1[s1], p1[s1 + 1], p2[s2], p2[s2 + 1]);
            if (hit) {
              hits.push(hit);
              found = true;
            }
          }
        }
      }
    }
    return hits;
  }

  function draw() {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = PALETTE.navyDeep;
    ctx.fillRect(0, 0, W, H);

    // 细微坐标网格
    ctx.strokeStyle = "rgba(246, 239, 230, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 40; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 40; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const pts = LAYOUTS[st.mode].map((p) => ({
      x: 42 + p.u * (W - 84),
      y: 34 + p.v * (H - 68),
    }));
    const edges = activeEdges();
    const bend = st.curve / 100;
    const polys = edges.map(([a, b], i) => edgeSamples(pts[a], pts[b], i, bend));
    const hits = countPolyCrossings(polys, edges);

    const path = shortestPath(st.pathFrom, st.pathTo, edges);
    const pathEdgeSet = new Set();
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i], v = path[i + 1];
      pathEdgeSet.add(u < v ? `${u}-${v}` : `${v}-${u}`);
    }

    // 绘制边
    edges.forEach(([a, b], i) => {
      const k = a < b ? `${a}-${b}` : `${b}-${a}`;
      const onPath = pathEdgeSet.has(k);
      const { cx, cy } = polys[i];
      ctx.save();
      ctx.strokeStyle = onPath ? PALETTE.coral : "rgba(246, 239, 230, 0.34)";
      ctx.lineWidth = onPath ? 3.2 : 1.5;
      if (!onPath && i < 6) ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(pts[a].x, pts[a].y);
      ctx.quadraticCurveTo(cx, cy, pts[b].x, pts[b].y);
      ctx.stroke();
      ctx.restore();
    });

    // 绘制交点警示
    for (const h of hits) {
      ctx.save();
      ctx.fillStyle = PALETTE.coralBright;
      ctx.beginPath();
      ctx.arc(h.x, h.y, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.navyDeep;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(h.x - 2.6, h.y - 2.6); ctx.lineTo(h.x + 2.6, h.y + 2.6);
      ctx.moveTo(h.x + 2.6, h.y - 2.6); ctx.lineTo(h.x - 2.6, h.y + 2.6);
      ctx.stroke();
      ctx.restore();
    }

    // 绘制节点
    const r = W < 440 ? 18 : 22;
    pts.forEach((p, idx) => {
      const isEnd = idx === st.pathFrom || idx === st.pathTo;
      const inPath = path.includes(idx);
      ctx.save();
      ctx.fillStyle = isEnd ? PALETTE.coral : idx === 2 ? PALETTE.paper : inPath ? PALETTE.tealOnDark : "#223E5E";
      ctx.beginPath();
      ctx.arc(p.x, p.y, idx === 2 ? r * 1.18 : r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isEnd || idx === 2 || inPath ? PALETTE.navyDeep : PALETTE.paper;
      ctx.font = `700 ${W < 440 ? 11 : 12}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(LABELS[idx], p.x, p.y);
      ctx.restore();
    });

    ctx.restore();

    const pathStr = path.map((i) => LABELS[i]).join(" → ");
    const verdict =
      hits.length === 0
        ? "实测 0 处交叉：先理顺节点拓扑序，比事后把直线弯成大弧更省眼力。"
        : st.mode === "curved"
          ? `弯弧让开了一部分重叠，但仍余 ${hits.length} 处交叉；改用「解结重排」才能把交叉归零。`
          : `实测 ${hits.length} 处硬交叉：每次经过亮红 ×，读者都要重新确认自己还在同一条线上。`;

    readoutEl.innerHTML =
      `<div class="lab-metrics">` +
      `<span>实测交叉 <strong>${hits.length} 处</strong></span>` +
      `<span>边曲率 <strong>${st.curve}%</strong></span>` +
      `<span>追踪路径（${path.length - 1} 跳）<strong>${pathStr}</strong></span>` +
      `</div><p class="lab-verdict">${verdict}</p>`;
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      st.mode = btn.dataset.crossMode;
      if (st.mode === "curved" && st.curve < 45) {
        st.curve = 68;
        curveInput.value = "68";
      } else if (st.mode === "tangled") {
        st.curve = 0;
        curveInput.value = "0";
      } else if (st.mode === "untangled") {
        st.curve = 14;
        curveInput.value = "14";
      }
      curveVal.textContent = `${st.curve}%`;
      modeBtns.forEach((b) => {
        const active = b.dataset.crossMode === st.mode;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      draw();
    });
  });

  curveInput.addEventListener("input", () => {
    st.curve = Number(curveInput.value);
    curveVal.textContent = `${st.curve}%`;
    draw();
  });

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pts = LAYOUTS[st.mode].map((p) => ({
      x: 42 + p.u * (W - 84),
      y: 34 + p.v * (H - 68),
    }));
    const hit = pts.findIndex((p) => Math.hypot(p.x - x, p.y - y) < 28);
    if (hit < 0) return;
    if (st.pickStage === 0) {
      st.pathFrom = hit;
      st.pickStage = 1;
    } else {
      st.pathTo = hit;
      st.pickStage = 0;
    }
    draw();
  });

  const ro = new ResizeObserver(() => { resize(); draw(); });
  ro.observe(canvas.parentElement);
  resize();
  draw();
}

/* =====================================================================
 * 03 节：Paul Baran (1964) 三态拓扑断链打击台（点任意节点使其离线）
 * ===================================================================== */
export function mountBaranLab(container) {
  const cards = [...container.querySelectorAll("[data-baran]")];
  const resetBtn = container.querySelector("#baranReset");

  const TOPOS = {
    centralized: {
      nodes: [
        { id: 0, x: 130, y: 95, hub: true },
        { id: 1, x: 130, y: 26 }, { id: 2, x: 196, y: 54 }, { id: 3, x: 204, y: 128 },
        { id: 4, x: 130, y: 164 }, { id: 5, x: 56, y: 128 }, { id: 6, x: 64, y: 54 },
      ],
      edges: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6]],
      note: (pct, down) =>
        down.includes(0)
          ? `总枢纽已离线：剩余 ${pct}% 各自断联，整张网瞬间瘫痪。`
          : down.length
            ? `打掉边缘节点只丢该点，但只要一碰正中圆心就会全网归零。`
            : `点击正中枢纽试试——星形结构看似整洁，却存在致命单点风险。`,
    },
    decentralized: {
      nodes: [
        { id: 0, x: 78, y: 95, hub: true },
        { id: 1, x: 182, y: 95, hub: true },
        { id: 2, x: 40, y: 40 }, { id: 3, x: 106, y: 34 }, { id: 4, x: 42, y: 150 },
        { id: 5, x: 154, y: 34 }, { id: 6, x: 220, y: 42 }, { id: 7, x: 218, y: 150 },
      ],
      edges: [[0,1],[0,2],[0,3],[0,4],[1,5],[1,6],[1,7],[3,5]],
      note: (pct, down) =>
        down.length
          ? `主连通群仍保 ${pct}%：一个次枢纽受损时，另一片区与顶部跨桥还能保住半壁江山。`
          : `多枢纽分组 + 少量跨桥：既留住视觉抓手，又比单一星形抗打击得多。`,
    },
    distributed: {
      nodes: [
        { id: 0, x: 50, y: 42 }, { id: 1, x: 130, y: 32 }, { id: 2, x: 210, y: 42 },
        { id: 3, x: 44, y: 112 }, { id: 4, x: 130, y: 98 }, { id: 5, x: 216, y: 112 },
        { id: 6, x: 84, y: 162 }, { id: 7, x: 176, y: 162 },
      ],
      edges: [
        [0,1],[1,2],[0,3],[1,4],[2,5],[3,4],[4,5],
        [3,6],[4,6],[4,7],[5,7],[6,7],[0,4],[2,4],
      ],
      note: (pct, down) =>
        down.length
          ? `绕开故障后主群仍保 ${pct}%：网状冗余路径自动兜底，但视觉上缺少一眼锁定的主标题锚点。`
          : `巴兰的分布式网状：没有唯一总管，任意节点受损都能借相邻环路绕行。`,
    },
  };

  const downState = { centralized: new Set(), decentralized: new Set(), distributed: new Set() };

  function calcLargestComponent(topo, downSet) {
    const alive = topo.nodes.map((n) => n.id).filter((id) => !downSet.has(id));
    if (!alive.length) return { pct: 0, main: new Set(), comps: 0 };
    const adj = Object.fromEntries(alive.map((id) => [id, []]));
    for (const [a, b] of topo.edges) {
      if (adj[a] && adj[b]) { adj[a].push(b); adj[b].push(a); }
    }
    const seen = new Set();
    let best = [];
    let comps = 0;
    for (const id of alive) {
      if (seen.has(id)) continue;
      comps++;
      const comp = [];
      const q = [id];
      seen.add(id);
      while (q.length) {
        const cur = q.shift();
        comp.push(cur);
        for (const nx of adj[cur]) if (!seen.has(nx)) { seen.add(nx); q.push(nx); }
      }
      if (comp.length > best.length) best = comp;
    }
    return { pct: Math.round((best.length / topo.nodes.length) * 100), main: new Set(best), comps };
  }

  function renderCard(card) {
    const key = card.dataset.baran;
    const topo = TOPOS[key];
    const down = downState[key];
    const svg = card.querySelector("svg");
    const statEl = card.querySelector(".baran-stat");
    const noteEl = card.querySelector(".baran-note");
    const { pct, main, comps } = calcLargestComponent(topo, down);

    const edgeMarkup = topo.edges
      .map(([a, b]) => {
        const na = topo.nodes[a], nb = topo.nodes[b];
        const dead = down.has(a) || down.has(b);
        const inMain = !dead && main.has(a) && main.has(b);
        const cls = dead ? "b-edge is-dead" : inMain ? "b-edge is-live" : "b-edge is-split";
        return `<line class="${cls}" x1="${na.x}" y1="${na.y}" x2="${nb.x}" y2="${nb.y}" />`;
      })
      .join("");

    const nodeMarkup = topo.nodes
      .map((n) => {
        const isDown = down.has(n.id);
        const inMain = !isDown && main.has(n.id);
        const r = n.hub ? 15 : 10.5;
        const fill = isDown ? "#E5DED3" : inMain ? (n.hub ? PALETTE.navy : PALETTE.coral) : PALETTE.stone;
        const stroke = isDown ? PALETTE.danger : PALETTE.paper;
        return (
          `<g class="b-node ${isDown ? "is-down" : ""}" data-nid="${n.id}" tabindex="0" role="button" aria-label="切换节点 ${n.id + 1} 在线状态">` +
          `<circle cx="${n.x}" cy="${n.y}" r="${r + 6}" fill="transparent" />` +
          `<circle cx="${n.x}" cy="${n.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${isDown ? 2 : 2}" ${isDown ? 'stroke-dasharray="3 3"' : ""} />` +
          (isDown
            ? `<path d="M${n.x - 4} ${n.y - 4} L${n.x + 4} ${n.y + 4} M${n.x + 4} ${n.y - 4} L${n.x - 4} ${n.y + 4}" stroke="${PALETTE.danger}" stroke-width="2" stroke-linecap="round" />`
            : "") +
          `</g>`
        );
      })
      .join("");

    svg.innerHTML = edgeMarkup + nodeMarkup;
    statEl.textContent = `主群连通 ${pct}% · ${comps} 片区`;
    statEl.className = `baran-stat ${pct < 60 ? "is-bad" : pct >= 85 ? "is-good" : ""}`;
    noteEl.textContent = topo.note(pct, [...down]);
  }

  cards.forEach((card) => {
    const key = card.dataset.baran;
    const toggleNode = (target) => {
      const g = target.closest("[data-nid]");
      if (!g) return;
      const id = Number(g.dataset.nid);
      if (downState[key].has(id)) downState[key].delete(id);
      else downState[key].add(id);
      renderCard(card);
    };
    card.addEventListener("click", (e) => toggleNode(e.target));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleNode(e.target);
      }
    });
    renderCard(card);
  });

  resetBtn.addEventListener("click", () => {
    for (const k of Object.keys(downState)) downState[k].clear();
    cards.forEach(renderCard);
  });
}

/* =====================================================================
 * 04 节：历史拓扑演变标本卡
 * ===================================================================== */
export function mountHistoryLab(container) {
  const btns = [...container.querySelectorAll("[data-era]")];
  const stage = container.querySelector("#historySpecimen");
  const titleEl = container.querySelector("#historyTitle");
  const descEl = container.querySelector("#historyDesc");

  const ERAS = {
    euler: {
      title: "1735 / 1741 · 欧拉《关于位置几何问题的解答》（E53）",
      desc: "瑞士数学家欧拉面对哥尼斯堡七桥难题，干脆擦掉了河流弯度与街区尺寸，把四块陆地缩成 4 个顶点、七座桥画成 7 条连边——首次证明「只要保留连接关系，几何比例可以被剥离」。这是所有网络构图的数学起点。",
      svg: `<svg viewBox="0 0 360 190" aria-hidden="true">
        <path d="M18 95 C90 70, 150 120, 342 95" fill="none" stroke="#C5C4C0" stroke-width="26" opacity="0.45"/>
        <path d="M84 42 Q140 58 178 95 M84 42 Q118 85 178 95 M84 148 Q118 108 178 95 M84 148 Q140 132 178 95" fill="none" stroke="#06213E" stroke-width="2.2"/>
        <path d="M178 95 L278 95 M84 42 Q200 22 278 95 M84 148 Q200 168 278 95" fill="none" stroke="#FA6C48" stroke-width="2.2" stroke-dasharray="6 4"/>
        <circle cx="84" cy="42" r="16" fill="#06213E"/><text x="84" y="46" text-anchor="middle" fill="#F6EFE6" font-size="11" font-weight="700">北岸</text>
        <circle cx="84" cy="148" r="16" fill="#06213E"/><text x="84" y="152" text-anchor="middle" fill="#F6EFE6" font-size="11" font-weight="700">南岸</text>
        <circle cx="178" cy="95" r="20" fill="#FA6C48"/><text x="178" y="99" text-anchor="middle" fill="#06213E" font-size="11" font-weight="700">西岛</text>
        <circle cx="278" cy="95" r="16" fill="#C5C4C0"/><text x="278" y="99" text-anchor="middle" fill="#06213E" font-size="11" font-weight="700">东岸</text>
      </svg>`,
    },
    beck: {
      title: "1931 / 1933 · 哈里·贝克 伦敦地铁拓扑图",
      desc: "信号绘图员哈里·贝克借鉴电路图，把弯曲真实的地铁线路拉直成水平、垂直与 45° 斜线，放大拥挤的市中心换乘站、压缩郊区线段。1931 年初稿因「太激进」被拒，1933 年 1 月试印袖珍版后立刻风靡，确立了现代信息网络「重拓扑、轻比例」的视觉公约。",
      svg: `<svg viewBox="0 0 360 190" aria-hidden="true">
        <polyline points="34,132 104,132 146,90 250,90 322,90" fill="none" stroke="#06213E" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="82,36 146,90 146,154 274,154" fill="none" stroke="#FA6C48" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="214,36 250,90 250,154" fill="none" stroke="#0F6B5E" stroke-width="4" stroke-dasharray="7 5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="146" cy="90" r="10" fill="#F6EFE6" stroke="#06213E" stroke-width="4"/>
        <circle cx="250" cy="90" r="10" fill="#F6EFE6" stroke="#06213E" stroke-width="4"/>
        <circle cx="146" cy="154" r="7" fill="#FA6C48"/>
        <circle cx="250" cy="154" r="7" fill="#0F6B5E"/>
        <circle cx="34" cy="132" r="5" fill="#06213E"/>
        <circle cx="322" cy="90" r="5" fill="#06213E"/>
        <text x="146" y="70" text-anchor="middle" fill="#06213E" font-size="11" font-weight="700">45° 换乘枢纽</text>
      </svg>`,
    },
    moreno: {
      title: "1934 · 莫雷诺与詹宁斯《谁将生存？》社会关系图",
      desc: "精神病学家雅各布·莫雷诺与社会心理学家海伦·霍尔·詹宁斯用圆点与箭头连线绘制群体内部的吸引与排斥关系，首次让「核心明星节点」「小圈子」与「边缘孤立者」跃然纸上——圆点加连线的社会网络视觉语法由此定型。",
      svg: `<svg viewBox="0 0 360 190" aria-hidden="true">
        <line x1="154" y1="92" x2="72" y2="54" stroke="#06213E" stroke-width="2"/>
        <line x1="154" y1="92" x2="82" y2="142" stroke="#06213E" stroke-width="2"/>
        <line x1="154" y1="92" x2="224" y2="52" stroke="#FA6C48" stroke-width="2.4"/>
        <line x1="154" y1="92" x2="232" y2="140" stroke="#06213E" stroke-width="1.8" stroke-dasharray="5 4"/>
        <line x1="72" y1="54" x2="82" y2="142" stroke="#06213E" stroke-width="1.5" stroke-dasharray="5 4"/>
        <line x1="224" y1="52" x2="232" y2="140" stroke="#FA6C48" stroke-width="1.8"/>
        <circle cx="154" cy="92" r="22" fill="#FA6C48"/><text x="154" y="96" text-anchor="middle" fill="#06213E" font-size="11" font-weight="700">明星</text>
        <circle cx="72" cy="54" r="12" fill="#06213E"/>
        <circle cx="82" cy="142" r="12" fill="#06213E"/>
        <circle cx="224" cy="52" r="14" fill="#06213E"/>
        <circle cx="232" cy="140" r="12" fill="#C5C4C0"/>
        <circle cx="312" cy="130" r="13" fill="#C5C4C0" stroke="#C9331B" stroke-width="1.8" stroke-dasharray="4 3"/>
        <text x="312" y="158" text-anchor="middle" fill="#B83B1C" font-size="11" font-weight="700">孤立者</text>
      </svg>`,
    },
    baran: {
      title: "1964 · 保罗·巴兰 兰德报告 RM-3420-PR",
      desc: "工程师保罗·巴兰在分布式通信研究报告中并排画出中心化、去中心化、分布式三张极简点线图，直观阐明多路径冗余如何让通信网络在部分节点损毁后依然存活，成为互联网与组织设计领域引用最广的视觉原型之一。",
      svg: `<svg viewBox="0 0 360 190" aria-hidden="true">
        <g transform="translate(0,0)">
          <line x1="60" y1="88" x2="60" y2="42" stroke="#06213E" stroke-width="1.8"/>
          <line x1="60" y1="88" x2="100" y2="66" stroke="#06213E" stroke-width="1.8"/>
          <line x1="60" y1="88" x2="96" y2="122" stroke="#06213E" stroke-width="1.8"/>
          <line x1="60" y1="88" x2="24" y2="122" stroke="#06213E" stroke-width="1.8"/>
          <line x1="60" y1="88" x2="20" y2="66" stroke="#06213E" stroke-width="1.8"/>
          <circle cx="60" cy="88" r="10" fill="#FA6C48"/>
          <circle cx="60" cy="42" r="5" fill="#06213E"/><circle cx="100" cy="66" r="5" fill="#06213E"/><circle cx="96" cy="122" r="5" fill="#06213E"/><circle cx="24" cy="122" r="5" fill="#06213E"/><circle cx="20" cy="66" r="5" fill="#06213E"/>
          <text x="60" y="160" text-anchor="middle" fill="#06213E" font-size="11" font-weight="700">中心化</text>
        </g>
        <g transform="translate(120,0)">
          <line x1="42" y1="88" x2="82" y2="88" stroke="#FA6C48" stroke-width="2.2"/>
          <line x1="42" y1="88" x2="24" y2="54" stroke="#06213E" stroke-width="1.6"/><line x1="42" y1="88" x2="26" y2="124" stroke="#06213E" stroke-width="1.6"/>
          <line x1="82" y1="88" x2="100" y2="54" stroke="#06213E" stroke-width="1.6"/><line x1="82" y1="88" x2="98" y2="124" stroke="#06213E" stroke-width="1.6"/>
          <circle cx="42" cy="88" r="8" fill="#06213E"/><circle cx="82" cy="88" r="8" fill="#06213E"/>
          <circle cx="24" cy="54" r="4.5" fill="#C5C4C0"/><circle cx="26" cy="124" r="4.5" fill="#C5C4C0"/>
          <circle cx="100" cy="54" r="4.5" fill="#C5C4C0"/><circle cx="98" cy="124" r="4.5" fill="#C5C4C0"/>
          <text x="62" y="160" text-anchor="middle" fill="#06213E" font-size="11" font-weight="700">多中心</text>
        </g>
        <g transform="translate(242,0)">
          <polyline points="22,52 60,42 98,52 96,120 60,130 24,120 22,52" fill="none" stroke="#06213E" stroke-width="1.6"/>
          <line x1="60" y1="42" x2="60" y2="130" stroke="#FA6C48" stroke-width="1.6" stroke-dasharray="4 3"/>
          <line x1="22" y1="52" x2="96" y2="120" stroke="#06213E" stroke-width="1.3" stroke-dasharray="4 3"/>
          <circle cx="22" cy="52" r="5" fill="#06213E"/><circle cx="60" cy="42" r="5" fill="#FA6C48"/><circle cx="98" cy="52" r="5" fill="#06213E"/>
          <circle cx="96" cy="120" r="5" fill="#06213E"/><circle cx="60" cy="130" r="5" fill="#FA6C48"/><circle cx="24" cy="120" r="5" fill="#06213E"/>
          <text x="60" y="160" text-anchor="middle" fill="#06213E" font-size="11" font-weight="700">分布式</text>
        </g>
      </svg>`,
    },
  };

  function select(era) {
    const item = ERAS[era] || ERAS.euler;
    titleEl.textContent = item.title;
    descEl.textContent = item.desc;
    stage.innerHTML = item.svg;
    btns.forEach((b) => {
      const active = b.dataset.era === era;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.era)));
  select("euler");
}

/* =====================================================================
 * 05 节：原海报四类适用场景蓝图切换器
 * ===================================================================== */
export function mountScenarioLab(container) {
  const btns = [...container.querySelectorAll("[data-scene]")];
  const box = container.querySelector("#scenarioDetail");

  const SCENES = {
    social: {
      tag: "适用场景 01 · 原海报原话",
      title: "社交网络与社群关系",
      body: "人物与圈层天然存在跨组好友、双向互动与意见领袖。用高对比核心圆标出 2–3 位跨圈桥接者，边缘成员退成浅灰，社群结构与传播路径立刻现形。",
      rule: "排版抓手：桥接节点放大 1.4× 以上，圈内密连用浅灰细线、跨圈强连接用珊瑚实线。",
      svg: `<svg class="scene-blueprint" viewBox="0 0 360 156" aria-hidden="true">
        <line x1="112" y1="78" x2="248" y2="78" stroke="#FA6C48" stroke-width="3.2"/>
        <line x1="112" y1="78" x2="54" y2="38" stroke="#06213E" stroke-width="1.6"/>
        <line x1="112" y1="78" x2="46" y2="108" stroke="#06213E" stroke-width="1.6"/>
        <line x1="112" y1="78" x2="106" y2="132" stroke="#06213E" stroke-width="1.4" stroke-dasharray="4 4"/>
        <line x1="54" y1="38" x2="46" y2="108" stroke="#C5C4C0" stroke-width="1.4"/>
        <line x1="248" y1="78" x2="306" y2="38" stroke="#06213E" stroke-width="1.6"/>
        <line x1="248" y1="78" x2="314" y2="108" stroke="#06213E" stroke-width="1.6"/>
        <line x1="248" y1="78" x2="254" y2="132" stroke="#06213E" stroke-width="1.4" stroke-dasharray="4 4"/>
        <line x1="306" y1="38" x2="314" y2="108" stroke="#C5C4C0" stroke-width="1.4"/>
        <circle cx="112" cy="78" r="20" fill="#06213E"/><text x="112" y="82" text-anchor="middle" fill="#F6EFE6" font-size="10" font-weight="700">圈主 A</text>
        <circle cx="248" cy="78" r="20" fill="#FA6C48"/><text x="248" y="82" text-anchor="middle" fill="#06213E" font-size="10" font-weight="700">桥接 B</text>
        <circle cx="54" cy="38" r="10" fill="#C5C4C0"/><circle cx="46" cy="108" r="10" fill="#C5C4C0"/><circle cx="106" cy="132" r="9" fill="#C5C4C0"/>
        <circle cx="306" cy="38" r="10" fill="#C5C4C0"/><circle cx="314" cy="108" r="10" fill="#C5C4C0"/><circle cx="254" cy="132" r="9" fill="#C5C4C0"/>
        <text x="180" y="68" text-anchor="middle" fill="#B83B1C" font-size="10" font-weight="700">跨圈强桥接</text>
      </svg>`,
    },
    ia: {
      tag: "适用场景 02 · 原海报原话",
      title: "信息架构与内容组织",
      body: "知识库、双链笔记与跨栏目主题页不再是单一文件夹树，同一篇内容会同时被多条专题引用。网络构图把隐藏的双向关联摆到台面上。",
      rule: "排版抓手：主题入口节点深蓝实心，跨专题引用用虚线标明「弱关联」，避免压过主导航。",
      svg: `<svg class="scene-blueprint" viewBox="0 0 360 156" aria-hidden="true">
        <line x1="82" y1="42" x2="180" y2="86" stroke="#06213E" stroke-width="2.4"/>
        <line x1="278" y1="42" x2="180" y2="86" stroke="#06213E" stroke-width="2.4"/>
        <line x1="180" y1="86" x2="96" y2="128" stroke="#06213E" stroke-width="1.5" stroke-dasharray="5 4"/>
        <line x1="180" y1="86" x2="264" y2="128" stroke="#06213E" stroke-width="1.5" stroke-dasharray="5 4"/>
        <line x1="82" y1="42" x2="278" y2="42" stroke="#FA6C48" stroke-width="1.6" stroke-dasharray="5 4"/>
        <line x1="96" y1="128" x2="264" y2="128" stroke="#FA6C48" stroke-width="1.6" stroke-dasharray="5 4"/>
        <circle cx="82" cy="42" r="18" fill="#06213E"/><text x="82" y="46" text-anchor="middle" fill="#F6EFE6" font-size="10" font-weight="700">专题一</text>
        <circle cx="278" cy="42" r="18" fill="#06213E"/><text x="278" y="46" text-anchor="middle" fill="#F6EFE6" font-size="10" font-weight="700">专题二</text>
        <circle cx="180" cy="86" r="22" fill="#FA6C48"/><text x="180" y="90" text-anchor="middle" fill="#06213E" font-size="10" font-weight="700">共享词条</text>
        <circle cx="96" cy="128" r="13" fill="#C5C4C0"/><text x="96" y="132" text-anchor="middle" fill="#06213E" font-size="9" font-weight="700">案例</text>
        <circle cx="264" cy="128" r="13" fill="#C5C4C0"/><text x="264" y="132" text-anchor="middle" fill="#06213E" font-size="9" font-weight="700">术语</text>
      </svg>`,
    },
    workflow: {
      tag: "适用场景 03 · 原海报原话",
      title: "业务流程与协同管理",
      body: "跨部门项目常包含评审退回、并发协作与复盘闭环，单向流水线画不下回流。用网络外环承载复盘反馈，用线上小圆点提示信息流向。",
      rule: "排版抓手：关键审批/交付节点用珊瑚色加粗，回流路径改微弧或虚线，与正向主流程错开。",
      svg: `<svg class="scene-blueprint" viewBox="0 0 360 156" aria-hidden="true">
        <line x1="62" y1="76" x2="178" y2="42" stroke="#06213E" stroke-width="2.4"/>
        <line x1="178" y1="42" x2="296" y2="76" stroke="#06213E" stroke-width="2.4"/>
        <path d="M296 76 Q180 154 62 76" fill="none" stroke="#FA6C48" stroke-width="2" stroke-dasharray="6 4"/>
        <circle cx="180" cy="115" r="5" fill="#FA6C48"/>
        <circle cx="62" cy="76" r="19" fill="#06213E"/><text x="62" y="80" text-anchor="middle" fill="#F6EFE6" font-size="10" font-weight="700">需求</text>
        <circle cx="178" cy="42" r="20" fill="#FA6C48"/><text x="178" y="46" text-anchor="middle" fill="#06213E" font-size="10" font-weight="700">协同</text>
        <circle cx="296" cy="76" r="19" fill="#06213E"/><text x="296" y="80" text-anchor="middle" fill="#F6EFE6" font-size="10" font-weight="700">交付</text>
        <text x="180" y="138" text-anchor="middle" fill="#B83B1C" font-size="10" font-weight="700">复盘回流闭环</text>
      </svg>`,
    },
    analytics: {
      tag: "适用场景 04 · 原海报原话",
      title: "数据分析与指标关联",
      body: "留存、转化、复购与口碑彼此拉动，单指标折线图看不出联动效应。网络构图用线宽编码相关性强弱，一眼找出牵一发动全身的杠杆指标。",
      rule: "排版抓手：只画强于阈值的关键边（通常控制在 10–14 条以内），弱相关先收起防变铁丝网。",
      svg: `<svg class="scene-blueprint" viewBox="0 0 360 156" aria-hidden="true">
        <line x1="180" y1="78" x2="72" y2="44" stroke="#06213E" stroke-width="3.6"/>
        <line x1="180" y1="78" x2="288" y2="44" stroke="#FA6C48" stroke-width="3.6"/>
        <line x1="180" y1="78" x2="86" y2="126" stroke="#06213E" stroke-width="1.4" stroke-dasharray="5 4"/>
        <line x1="180" y1="78" x2="274" y2="126" stroke="#06213E" stroke-width="2.2"/>
        <line x1="72" y1="44" x2="288" y2="44" stroke="#C5C4C0" stroke-width="1.5" stroke-dasharray="4 4"/>
        <circle cx="180" cy="78" r="24" fill="#FA6C48"/><text x="180" y="82" text-anchor="middle" fill="#06213E" font-size="10" font-weight="800">核心留存</text>
        <circle cx="72" cy="44" r="16" fill="#06213E"/><text x="72" y="48" text-anchor="middle" fill="#F6EFE6" font-size="9.5" font-weight="700">拉新</text>
        <circle cx="288" cy="44" r="17" fill="#06213E"/><text x="288" y="48" text-anchor="middle" fill="#F6EFE6" font-size="9.5" font-weight="700">复购</text>
        <circle cx="86" cy="126" r="13" fill="#C5C4C0"/><text x="86" y="130" text-anchor="middle" fill="#06213E" font-size="9" font-weight="700">曝光</text>
        <circle cx="274" cy="126" r="14" fill="#C5C4C0"/><text x="274" y="130" text-anchor="middle" fill="#06213E" font-size="9" font-weight="700">口碑</text>
      </svg>`,
    },
  };

  function select(key) {
    const s = SCENES[key] || SCENES.social;
    box.innerHTML =
      `<span class="scene-tag">${s.tag}</span>` +
      `<h3>${s.title}</h3>` +
      s.svg +
      `<p>${s.body}</p>` +
      `<p class="scene-rule">${s.rule}</p>`;
    btns.forEach((b) => {
      const active = b.dataset.scene === key;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.scene)));
  select("social");
}

/* =====================================================================
 * 06 节：单变量网络构图小练习（由 model.js 同一套坐标与规则实绘 4 张图）
 * ===================================================================== */
export function mountQuiz(container) {
  const grid = container.querySelector("#quizGrid");
  const feedback = container.querySelector("#quizFeedback");

  const SHORT = {
    core: "开源",
    source: "提案",
    user: "开发",
    platform: "代码",
    feedback: "复盘",
    data: "指标",
    channel: "社区",
    content: "规范",
  };

  function buildMiniSvg(opt) {
    const W = 280;
    const H = 196;
    const padX = 28;
    const padY = 24;
    const posMap = {};
    NODE_DEFS.forEach((d) => {
      const x = padX + d.posterPos.u * (W - padX * 2);
      const y = padY + d.posterPos.v * (H - padY * 2);
      let r;
      if (opt.scaleMode === "flat") {
        r = 14;
      } else {
        r = d.fixed ? 23 : d.role === "support" ? 11.5 : d.role === "key" ? 15.5 : 14.5;
      }
      posMap[d.id] = { ...d, x, y, r };
    });

    const lines = opt.edges
      .map(([a, b, kind]) => {
        const na = posMap[a];
        const nb = posMap[b];
        const stroke = kind === "solid" ? "#F6EFE6" : "rgba(246, 239, 230, 0.55)";
        const sw = opt.scaleMode === "flat" ? 1.8 : kind === "solid" ? 2.1 : 1.3;
        const dash = kind === "dashed" ? 'stroke-dasharray="5 4"' : "";
        return `<line x1="${na.x.toFixed(1)}" y1="${na.y.toFixed(1)}" x2="${nb.x.toFixed(1)}" y2="${nb.y.toFixed(1)}" stroke="${stroke}" stroke-width="${sw}" ${dash} />`;
      })
      .join("");

    const circles = NODE_DEFS.map((d) => {
      const n = posMap[d.id];
      const fill = d.fixed
        ? PALETTE.paper
        : d.role === "key"
          ? PALETTE.coral
          : d.role === "support"
            ? PALETTE.stone
            : "#254970";
      const ink = d.fixed || d.role === "key" || d.role === "support" ? PALETTE.navyDeep : PALETTE.paper;
      return (
        `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${n.r}" fill="${fill}" />` +
        `<text x="${n.x.toFixed(1)}" y="${(n.y + 3.5).toFixed(1)}" text-anchor="middle" fill="${ink}" font-size="${d.fixed ? 10 : 8.5}" font-weight="700">${SHORT[d.id]}</text>`
      );
    }).join("");

    return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${lines}${circles}</svg>`;
  }

  grid.innerHTML = QUIZ_OPTIONS.map(
    (opt) =>
      `<button type="button" class="quiz-card" data-quiz="${opt.id}" aria-pressed="false">` +
      `<div class="quiz-canvas">${buildMiniSvg(opt)}</div>` +
      `<div class="quiz-foot"><span class="quiz-tag">${opt.label}</span><span class="quiz-hint">点击选择</span></div>` +
      `</button>`
  ).join("");

  const cards = [...grid.querySelectorAll(".quiz-card")];

  function pick(id) {
    const chosen = QUIZ_OPTIONS.find((o) => o.id === id);
    if (!chosen) return;
    cards.forEach((c) => {
      const opt = QUIZ_OPTIONS.find((o) => o.id === c.dataset.quiz);
      const isChosen = c.dataset.quiz === id;
      c.setAttribute("aria-pressed", String(isChosen));
      c.classList.toggle("is-chosen", isChosen);
      c.classList.toggle("is-correct", opt.correct);
      c.classList.toggle("is-wrong", isChosen && !opt.correct);
    });
    feedback.hidden = false;
    feedback.className = `quiz-feedback ${chosen.correct ? "is-pass" : "is-warn"}`;
    feedback.innerHTML =
      `<strong>${chosen.correct ? `答对了 · ${chosen.label}` : `再看看 · 你选了 ${chosen.label}（更佳解是方案 B）`}</strong>` +
      `<p>${chosen.reason}</p>` +
      `<ul class="quiz-breakdown">` +
      QUIZ_OPTIONS.map((o) => `<li><b>${o.label}：</b>${o.reason}</li>`).join("") +
      `</ul>`;
  }

  cards.forEach((c) => c.addEventListener("click", () => pick(c.dataset.quiz)));
}

/* =====================================================================
 * 07 节：原海报灯箱（复用 #poster.src，放大、拖动 draggable=false、Esc 关闭）
 * ===================================================================== */
export function mountPosterLightbox() {
  const thumb = document.getElementById("poster");
  const openBtn = document.getElementById("openPosterBtn");
  const modal = document.getElementById("posterModal");
  const img = document.getElementById("posterModalImg");
  const closeBtn = document.getElementById("posterModalClose");
  const zoomInBtn = document.getElementById("posterZoomIn");
  const zoomOutBtn = document.getElementById("posterZoomOut");
  const zoomResetBtn = document.getElementById("posterZoomReset");
  const viewport = document.getElementById("posterViewport");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    img.src = thumb.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  window.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") close();
  });

  zoomInBtn.addEventListener("click", () => { scale = Math.min(3, +(scale + 0.35).toFixed(2)); applyTransform(); });
  zoomOutBtn.addEventListener("click", () => { scale = Math.max(0.8, +(scale - 0.35).toFixed(2)); applyTransform(); });
  zoomResetBtn.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  viewport.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    viewport.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, sx: e.clientX - tx, sy: e.clientY - ty };
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    tx = e.clientX - drag.sx;
    ty = e.clientY - drag.sy;
    applyTransform();
  });
  const stopDrag = (e) => { if (drag && drag.id === e.pointerId) drag = null; };
  viewport.addEventListener("pointerup", stopDrag);
  viewport.addEventListener("pointercancel", stopDrag);
}

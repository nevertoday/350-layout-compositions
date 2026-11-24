// 正文 01–07 节的所有互动图示、小练习与原海报放大拖动查看
import { reducedMotion } from "../../lib/stage.js";
import { PALETTE, clamp } from "./model.js";

const $ = (id) => document.getElementById(id);

const SHAPE_COLORS = [PALETTE.orange, PALETTE.pink, PALETTE.cream, PALETTE.lavender, PALETTE.peach, "#7f63bf", PALETTE.pinkSoft];

function miniShape(kind, cx, cy, r, fill) {
  if (kind === "rect") {
    return `<rect x="${(cx - r * 0.92).toFixed(1)}" y="${(cy - r * 0.92).toFixed(1)}" width="${(r * 1.84).toFixed(1)}" height="${(r * 1.84).toFixed(1)}" rx="3" fill="${fill}"/>`;
  }
  if (kind === "tri") {
    return `<polygon points="${cx.toFixed(1)},${(cy - r * 1.05).toFixed(1)} ${(cx + r * 1.04).toFixed(1)},${(cy + r * 0.92).toFixed(1)} ${(cx - r * 1.04).toFixed(1)},${(cy + r * 0.92).toFixed(1)}" fill="${fill}"/>`;
  }
  if (kind === "diamond") {
    return `<polygon points="${cx.toFixed(1)},${(cy - r * 1.05).toFixed(1)} ${(cx + r * 0.92).toFixed(1)},${cy.toFixed(1)} ${cx.toFixed(1)},${(cy + r * 1.05).toFixed(1)} ${(cx - r * 0.92).toFixed(1)},${cy.toFixed(1)}" fill="${fill}"/>`;
  }
  return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}"/>`;
}

// ---------- 01 奇偶视觉拆解对比 ----------
const PAIR_INFO = {
  "2-3": {
    evenN: 2,
    oddN: 3,
    oddCap: "3 个拆不成两半：中间大圆立刻站成主角，左右方体与三角自然退为衬托，视线沿弧线一落两扫。",
    evenCap: "2 个体量接近、各占一边，中间留出死缝，眼睛像看乒乓球一样左右来回蹦。",
  },
  "4-5": {
    evenN: 4,
    oddN: 5,
    oddCap: "5 个构成「1 主 + 左右各 2」的层次波浪，既丰盛又有明确核心，读起来轻快不呆板。",
    evenCap: "4 个会被大脑自动配成「左 2 + 右 2」两对，顶部成一条平线，画面发平、缺少落点。",
  },
  "6-7": {
    evenN: 6,
    oddN: 7,
    oddCap: "7 个虽已接近一眼点清的上限，但中心大主角仍能把左右各 3 个拢成一条完整节奏弧。",
    evenCap: "6 个自然分成左 3 与右 3 两组对称镜像，规整有余，却看不出该先盯住哪一个。",
  },
};

function drawCompareSVG(n, isOdd) {
  const W = 320;
  const H = 152;
  const pad = n <= 3 ? 58 : n <= 5 ? 40 : 30;
  const span = W - pad * 2;
  const rBase = n <= 3 ? 21 : n <= 5 ? 16 : 12.5;
  const mid = Math.floor(n / 2);
  const shapes = ["rect", "circle", "tri", "circle", "diamond", "rect", "tri"];
  const pts = Array.from({ length: n }, (_, i) => {
    const x = pad + (span * i) / (n - 1);
    const isDom = isOdd && i === mid;
    const r = isDom ? rBase * 1.38 : rBase * 0.92;
    const y = isDom ? 78 : 88;
    const color = isDom ? PALETTE.pink : SHAPE_COLORS[(i + (i >= mid ? 1 : 0)) % SHAPE_COLORS.length];
    return { x, y, r, isDom, color, kind: isDom ? "circle" : shapes[i % shapes.length] };
  });

  const out = [
    `<rect width="${W}" height="${H}" rx="10" fill="${PALETTE.bg}"/>`,
    `<ellipse cx="${W / 2}" cy="116" rx="${(W * 0.42).toFixed(0)}" ry="10" fill="${PALETTE.plinth}"/>`,
  ];

  if (isOdd) {
    const dom = pts[mid];
    const topY = dom.y - dom.r - 22;
    out.push(
      `<path d="M${pts[0].x.toFixed(1)},${(pts[0].y - pts[0].r - 6).toFixed(1)} Q${dom.x.toFixed(1)},${(topY - 12).toFixed(1)} ${pts[n - 1].x.toFixed(1)},${(pts[n - 1].y - pts[n - 1].r - 6).toFixed(1)}" fill="none" stroke="${PALETTE.pink}" stroke-width="1.6" stroke-dasharray="4 4"/>`,
      `<circle cx="${dom.x.toFixed(1)}" cy="${(topY + 3).toFixed(1)}" r="3.5" fill="${PALETTE.pink}"/>`
    );
  } else {
    const half = n / 2;
    const midX = W / 2;
    out.push(
      `<line x1="${midX}" y1="22" x2="${midX}" y2="128" stroke="${PALETTE.lavender}" stroke-width="1.6" stroke-dasharray="4 4"/>`,
      `<line x1="${(pts[0].x - 10).toFixed(1)}" y1="48" x2="${(pts[n - 1].x + 10).toFixed(1)}" y2="48" stroke="rgba(147,110,196,0.55)" stroke-width="1.3" stroke-dasharray="4 4"/>`
    );
    const bracket = (a, b, label) => {
      const x1 = a.x - 12;
      const x2 = b.x + 12;
      out.push(
        `<path d="M${x1.toFixed(1)},122 L${x1.toFixed(1)},128 L${x2.toFixed(1)},128 L${x2.toFixed(1)},122" fill="none" stroke="${PALETTE.lavender}" stroke-width="1.4"/>`,
        `<text x="${((x1 + x2) / 2).toFixed(1)}" y="142" text-anchor="middle" fill="${PALETTE.muted}" font-size="10.5">${label}</text>`
      );
    };
    bracket(pts[0], pts[half - 1], `左 ${half}`);
    bracket(pts[half], pts[n - 1], `右 ${half}`);
  }

  for (const p of pts) {
    out.push(miniShape(p.kind, p.x, p.y, p.r, p.color));
  }
  return `<svg viewBox="0 0 ${W} ${H}">${out.join("")}</svg>`;
}

function initCompare() {
  const btns = [...document.querySelectorAll("[data-pair]")];
  const show = (key) => {
    const info = PAIR_INFO[key];
    for (const b of btns) b.setAttribute("aria-pressed", String(b.dataset.pair === key));
    $("cmp-odd-title").textContent = `${info.oddN} 个 · 奇数推荐`;
    $("cmp-even-title").textContent = `${info.evenN} 个 · 偶数平淡`;
    $("cmp-odd-fig").innerHTML = drawCompareSVG(info.oddN, true);
    $("cmp-even-fig").innerHTML = drawCompareSVG(info.evenN, false);
    $("cmp-odd-cap").textContent = info.oddCap;
    $("cmp-even-cap").textContent = info.evenCap;
  };
  for (const b of btns) b.addEventListener("click", () => show(b.dataset.pair));
  show("4-5");
}

// ---------- 02 瞬时点数阶梯 (1–11) ----------
function initSubitizing() {
  const slider = $("sub-n");
  const zones = [...document.querySelectorAll(".sub-zones span")];

  const render = () => {
    const n = +slider.value;
    $("sub-out").textContent = String(n);
    const W = 360;
    const H = 180;
    const isOdd = n % 2 === 1;
    const zone = n <= 2 ? "small" : n <= 7 ? "sweet" : "crowd";
    for (const z of zones) z.classList.toggle("active", z.dataset.z === zone);

    // 把元素排在干净的展示框里
    const items = [];
    if (n <= 7) {
      const pad = n === 1 ? W / 2 : n <= 3 ? 72 : n <= 5 ? 48 : 34;
      const span = n > 1 ? W - pad * 2 : 0;
      const mid = Math.floor(n / 2);
      const rBase = n <= 3 ? 20 : n <= 5 ? 16 : 12.5;
      for (let i = 0; i < n; i++) {
        const x = n === 1 ? W / 2 : pad + (span * i) / (n - 1);
        const isDom = isOdd && n >= 3 && i === mid;
        const r = isDom ? rBase * 1.38 : rBase * 0.92;
        const y = isDom ? 86 : 96 + (n >= 5 ? (i % 2 === 0 ? 4 : -4) : 0);
        items.push({ x, y, r, isDom, fill: isDom ? PALETTE.pink : isOdd ? PALETTE.cream : PALETTE.lavender });
      }
    } else {
      // 8–11 个：排成两行疏密块，凸显「眼睛直接看轮廓不数数」
      const topN = Math.ceil(n / 2);
      const botN = n - topN;
      const placeRow = (cnt, y) => {
        const pad = 54;
        const span = W - pad * 2;
        for (let i = 0; i < cnt; i++) {
          const x = cnt > 1 ? pad + (span * i) / (cnt - 1) : W / 2;
          items.push({ x, y, r: 12, isDom: false, fill: PALETTE.orange });
        }
      };
      placeRow(topN, 68);
      placeRow(botN, 114);
    }

    const parts = [`<rect width="${W}" height="${H}" rx="12" fill="${PALETTE.bg}"/>`];
    if (zone === "crowd") {
      parts.push(
        `<rect x="28" y="38" width="${W - 56}" height="104" rx="18" fill="rgba(242,147,86,0.08)" stroke="${PALETTE.orange}" stroke-width="1.6" stroke-dasharray="6 5"/>`,
        `<text x="${W / 2}" y="26" text-anchor="middle" fill="${PALETTE.orange}" font-size="11.5">眼睛直接把 ${n} 个合并为一块群组</text>`
      );
    } else if (isOdd && n >= 3) {
      const mid = items[Math.floor(n / 2)];
      parts.push(
        `<path d="M${items[0].x.toFixed(1)},${(items[0].y - items[0].r - 8).toFixed(1)} Q${mid.x.toFixed(1)},24 ${items[n - 1].x.toFixed(1)},${(items[n - 1].y - items[n - 1].r - 8).toFixed(1)}" fill="none" stroke="${PALETTE.pink}" stroke-width="1.6" stroke-dasharray="4 4"/>`
      );
    } else if (!isOdd) {
      parts.push(`<line x1="${W / 2}" y1="30" x2="${W / 2}" y2="148" stroke="${PALETTE.lavender}" stroke-width="1.6" stroke-dasharray="4 4"/>`);
    }

    for (const it of items) {
      parts.push(`<circle cx="${it.x.toFixed(1)}" cy="${it.y.toFixed(1)}" r="${it.r.toFixed(1)}" fill="${it.fill}"/>`);
    }
    $("sub-fig").innerHTML = `<svg viewBox="0 0 ${W} ${H}">${parts.join("")}</svg>`;

    const copy = {
      1: ["1 个 · 独白焦点", "不用数就能锁定唯一主角，但还没有多个元素之间的呼应节奏。"],
      2: ["2 个 · 感数区内，成双对峙", "一眼看清是 2 个，但两两对等、中间留缝，适合对比而不是自然节奏。"],
      3: ["3 个 · 奇数法则的黄金起点", "落在人眼最轻松的感数范围内，一主两辅瞬间成立，最稳妥也最利落。"],
      4: ["4 个 · 感数区上限，极易对半拆开", "眼睛立刻把它看成 2 + 2 两对，端正但缺少天然的焦点锚点。"],
      5: ["5 个 · 丰盛又有主次的奇数档", "虽然超出了 4 个的严格瞬间感数，但借「中 1 + 左 2 + 右 2」能轻松读出层次。"],
      6: ["6 个 · 对称成组（3 + 3 或三对）", "看起来规整，适合网格展示；如果要自然焦点，反而比 5 个难控制。"],
      7: ["7 个 · 奇数节奏的实用边界", "正中主角仍能压住左右各 3 个，但密度已经很高，再加就不再按个数读了。"],
      8: ["8 个 · 超出瞬时点数，单双开始失效", "一般人不会一眼数出这是 8 还是 9，大脑只读整块群组的形状和疏密。"],
      9: ["9 个 · 虽是奇数，但读者数不出来", "别为「9 个比 8 个更符合奇数法则」费神——此时该管整体轮廓和留空。"],
      10: ["10 个 · 群组阅读模式", "超过 7 个之后，10 与 9 在视觉心理上几乎没有单双差别。"],
      11: ["11 个 · 群组阅读模式", "数量到了这个量级，把它再拆成 3 组小堆，比数总数是不是奇数管用得多。"],
    };
    $("sub-badge").textContent = copy[n][0];
    $("sub-text").textContent = copy[n][1];
  };

  slider.addEventListener("input", render);
  render();
}

// ---------- 03 变化混音台 ----------
function initMixer() {
  const mix = { n: 3, size: false, pos: false, form: false };
  const nBtns = [...document.querySelectorAll("[data-mixn]")];
  const dBtns = [...document.querySelectorAll("[data-dim]")];

  const render = () => {
    const W = 360;
    const H = 200;
    const n = mix.n;
    const mid = Math.floor(n / 2);
    const pad = n === 3 ? 72 : 44;
    const span = W - pad * 2;
    const rBase = n === 3 ? 25 : 18;
    const shapes = n === 3 ? ["rect", "circle", "tri"] : ["rect", "diamond", "circle", "tri", "rect"];
    const colors = n === 3 ? [PALETTE.orange, PALETTE.pink, PALETTE.cream] : [PALETTE.orange, PALETTE.lavender, PALETTE.pink, PALETTE.cream, PALETTE.peach];

    const pts = Array.from({ length: n }, (_, i) => {
      const isDom = i === mid;
      const x = pad + (span * i) / (n - 1);
      const r = mix.size ? (isDom ? rBase * 1.44 : rBase * 0.82) : rBase * 0.92;
      const dy = mix.pos ? (isDom ? -18 : i % 2 === 0 ? 14 : 4) : 0;
      const y = 108 + dy;
      const kind = mix.form ? shapes[i] : "circle";
      const fill = mix.form ? colors[i] : isDom && mix.size ? PALETTE.pinkSoft : "#9a8ab8";
      return { x, y, r, isDom, kind, fill };
    });

    const score = +mix.size + +mix.pos + +mix.form;
    const parts = [
      `<rect width="${W}" height="${H}" rx="12" fill="${PALETTE.bg}"/>`,
      `<ellipse cx="${W / 2}" cy="158" rx="145" ry="12" fill="${PALETTE.plinth}"/>`,
    ];

    if (score >= 2) {
      const dom = pts[mid];
      parts.push(
        `<path d="M${pts[0].x.toFixed(1)},${(pts[0].y - pts[0].r - 8).toFixed(1)} Q${dom.x.toFixed(1)},${(dom.y - dom.r - 28).toFixed(1)} ${pts[n - 1].x.toFixed(1)},${(pts[n - 1].y - pts[n - 1].r - 8).toFixed(1)}" fill="none" stroke="${PALETTE.pink}" stroke-width="1.6" stroke-dasharray="4 4"/>`
      );
    } else {
      parts.push(
        `<line x1="${(pts[0].x - 14).toFixed(1)}" y1="62" x2="${(pts[n - 1].x + 14).toFixed(1)}" y2="62" stroke="rgba(183,172,207,0.4)" stroke-width="1.4" stroke-dasharray="4 4"/>`
      );
    }
    for (const p of pts) parts.push(miniShape(p.kind, p.x, p.y, p.r, p.fill));
    $("mix-fig").innerHTML = `<svg viewBox="0 0 ${W} ${H}">${parts.join("")}</svg>`;

    $("mix-bar").style.width = `${score === 0 ? 12 : score === 1 ? 42 : score === 2 ? 74 : 100}%`;
    const verdicts = [
      ["0 / 3 · 虽然是奇数，但像站队", `${n} 个元素大小、高度、样子全都一样，奇数带来的主角优势完全没发挥出来。点亮上面任意两个变化试试。`],
      ["1 / 3 · 开始有分化，还差一点层次", "只有一个维度变化时，主角刚刚探出头；再叠加一项（比如高低错落或形态色彩），节奏会立刻出来。"],
      ["2 / 3 · 主次清楚，节奏成立", "已经能一眼锁定主导元素，其余作为支持陪衬，画面摆脱了排仪仗队的僵硬感。"],
      ["3 / 3 · 完整奇数节奏（原海报配方）", "大小、高低与形态色彩同时配合：主角最稳最亮，支持元素错落呼应，奇数法则真正生效。"],
    ];
    $("mix-title").textContent = verdicts[score][0];
    $("mix-text").textContent = verdicts[score][1];
  };

  for (const b of nBtns) {
    b.addEventListener("click", () => {
      mix.n = +b.dataset.mixn;
      for (const x of nBtns) x.setAttribute("aria-pressed", String(x === b));
      render();
    });
  }
  for (const b of dBtns) {
    b.addEventListener("click", () => {
      const d = b.dataset.dim;
      mix[d] = !mix[d];
      b.setAttribute("aria-pressed", String(mix[d]));
      render();
    });
  }
  render();
}

// ---------- 04 版式实景切换（三栏 / 三张卡 / 5个图标） ----------
function initLayouts() {
  let scene = "cols";
  let evenMode = false;
  const tabs = [...document.querySelectorAll(".ui-tabs [role='tab']")];
  const parityBtn = $("ui-parity");

  const render = () => {
    for (const t of tabs) t.setAttribute("aria-selected", String(t.dataset.scene === scene));
    parityBtn.setAttribute("aria-pressed", String(evenMode));
    parityBtn.textContent = evenMode ? "切回奇数版" : "切到偶数对比";

    const stage = $("ui-stage");
    if (scene === "cols") {
      if (!evenMode) {
        stage.innerHTML = `
          <div class="mock-cols c3">
            <div class="m-col"><span class="m-tag">左栏 · 导览</span><div class="m-bar w2"></div><div class="m-bar w3"></div><div class="m-bar w2"></div></div>
            <div class="m-col dom"><span class="m-tag">中栏 · 主报道（主角）</span><div class="m-pic"></div><div class="m-bar w1"></div><div class="m-bar w3"></div></div>
            <div class="m-col"><span class="m-tag">右栏 · 注释</span><div class="m-bar w2"></div><div class="m-bar w3"></div><div class="m-bar w2"></div></div>
          </div>`;
        $("ui-cap-head").textContent = "三栏版式（1 : 2 : 1）· 中心天然承重";
        $("ui-cap-text").textContent = "三栏让中间栏顺理成章成为主阅读区，左右窄栏放目录与注释；既整齐又有清晰的主次。";
      } else {
        stage.innerHTML = `
          <div class="mock-cols c4">
            <div class="m-col"><span class="m-tag">栏 01</span><div class="m-bar w1"></div><div class="m-bar w3"></div><div class="m-bar w2"></div></div>
            <div class="m-col"><span class="m-tag">栏 02</span><div class="m-bar w1"></div><div class="m-bar w3"></div><div class="m-bar w2"></div></div>
            <div class="m-col"><span class="m-tag">栏 03</span><div class="m-bar w1"></div><div class="m-bar w3"></div><div class="m-bar w2"></div></div>
            <div class="m-col"><span class="m-tag">栏 04</span><div class="m-bar w1"></div><div class="m-bar w3"></div><div class="m-bar w2"></div></div>
          </div>`;
        $("ui-cap-head").textContent = "四栏等宽对比 · 容易切成平均豆腐块";
        $("ui-cap-text").textContent = "四栏平均排开时，视线在栏 2 和栏 3 之间的中缝落空，必须额外跨栏合并才能造出主次。";
      }
    } else if (scene === "cards") {
      if (!evenMode) {
        stage.innerHTML = `
          <div class="mock-cards n3">
            <div class="m-card"><h4>基础版</h4><div class="m-price">¥29</div><div class="m-lines"><i></i><i></i></div></div>
            <div class="m-card hero-card"><span class="m-pill">推荐方案</span><h4>专业版</h4><div class="m-price">¥69</div><div class="m-lines"><i></i><i></i><i></i></div></div>
            <div class="m-card"><h4>团队版</h4><div class="m-price">¥149</div><div class="m-lines"><i></i><i></i></div></div>
          </div>`;
        $("ui-cap-head").textContent = "三张价格 / 卖点卡 · 中间卡自然当主角";
        $("ui-cap-text").textContent = "三张卡并排时，把中间那张略微放大提亮，左右两张一低一高形成价格锚定，视线立刻落在推荐项上。";
      } else {
        stage.innerHTML = `
          <div class="mock-cards n4">
            <div class="m-card"><h4>入门版</h4><div class="m-price">¥19</div><div class="m-lines"><i></i><i></i></div></div>
            <div class="m-card"><h4>标准版</h4><div class="m-price">¥49</div><div class="m-lines"><i></i><i></i></div></div>
            <div class="m-card"><h4>进阶版</h4><div class="m-price">¥89</div><div class="m-lines"><i></i><i></i></div></div>
            <div class="m-card"><h4>团队版</h4><div class="m-price">¥149</div><div class="m-lines"><i></i><i></i></div></div>
          </div>`;
        $("ui-cap-head").textContent = "四张卡对比 · 谁都像备选，反而犹豫";
        $("ui-cap-text").textContent = "四张卡片里没有正中位，硬标第 2 张或第 3 张都会打破对称，用户要在四档之间逐项比较。";
      }
    } else {
      const ico = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
      if (!evenMode) {
        stage.innerHTML = `
          <div class="mock-dock d5">
            <div class="m-ico">${ico('<path d="M4 11l8-7 8 7v9H4z"/>')}<span>首页</span></div>
            <div class="m-ico">${ico('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>')}<span>发现</span></div>
            <div class="m-ico center-act"><div class="ico-fab">${ico('<path d="M12 5v14M5 12h14"/>')}</div><span>发布</span></div>
            <div class="m-ico">${ico('<path d="M4 6h16v10H8l-4 3z"/>')}<span>消息</span></div>
            <div class="m-ico">${ico('<circle cx="12" cy="8" r="4"/><path d="M5 20c1.5-4 12.5-4 14 0"/>')}<span>我的</span></div>
          </div>`;
        $("ui-cap-head").textContent = "5 个底部图标 · 正中留给唯一核心按钮";
        $("ui-cap-text").textContent = "左二右二对称护航，正中第 3 个刚好托起最想让用户点的主动作（如「发布」），不用费力找。";
      } else {
        stage.innerHTML = `
          <div class="mock-dock d4">
            <div class="m-ico">${ico('<path d="M4 11l8-7 8 7v9H4z"/>')}<span>首页</span></div>
            <div class="m-ico">${ico('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>')}<span>发现</span></div>
            <div class="dock-seam" aria-hidden="true"></div>
            <div class="m-ico">${ico('<path d="M4 6h16v10H8l-4 3z"/>')}<span>消息</span></div>
            <div class="m-ico">${ico('<circle cx="12" cy="8" r="4"/><path d="M5 20c1.5-4 12.5-4 14 0"/>')}<span>我的</span></div>
          </div>`;
        $("ui-cap-head").textContent = "4 个图标对比 · 中轴落在一道空缝上";
        $("ui-cap-text").textContent = "4 个并列入口彼此平权，适合没有「主按钮」的工具栏；但如果想放一个突出入口，正中根本没位置。";
      }
    }
  };

  for (const t of tabs) {
    t.addEventListener("click", () => {
      scene = t.dataset.scene;
      render();
    });
  }
  parityBtn.addEventListener("click", () => {
    evenMode = !evenMode;
    render();
  });
  render();
}

// ---------- 05 建筑开间实验（3 / 4 / 5 开间：门还是柱子？） ----------
function initBays() {
  const btns = [...document.querySelectorAll("[data-bays]")];
  const draw = (bays) => {
    for (const b of btns) b.setAttribute("aria-pressed", String(+b.dataset.bays === bays));
    const W = 320;
    const H = 152;
    const left = 26;
    const right = W - 26;
    const span = right - left;
    const colW = span / bays;
    const isOdd = bays % 2 === 1;
    const midBay = Math.floor(bays / 2);

    const out = [
      `<rect width="${W}" height="${H}" rx="10" fill="${PALETTE.bg}"/>`,
      // 屋顶三角山花
      `<polygon points="${W / 2},16 ${left - 8},48 ${right + 8},48" fill="${PALETTE.surface2 || "#241a52"}" stroke="${PALETTE.cream}" stroke-opacity="0.3" stroke-width="1.2"/>`,
      `<rect x="${left - 4}" y="48" width="${span + 8}" height="8" fill="${PALETTE.cream}" opacity="0.85"/>`,
      // 地面基座
      `<rect x="${left - 10}" y="128" width="${span + 20}" height="10" rx="2" fill="${PALETTE.plinth}"/>`,
    ];

    // 每个开间的拱门/窗
    for (let i = 0; i < bays; i++) {
      const x = left + i * colW;
      const cx = x + colW / 2;
      const isDoor = isOdd && i === midBay;
      const w = Math.min(colW * 0.56, isDoor ? 36 : 26);
      const h = isDoor ? 58 : 42;
      const y = 128 - h;
      out.push(
        `<path d="M${(cx - w / 2).toFixed(1)},128 L${(cx - w / 2).toFixed(1)},${(y + w / 2).toFixed(1)} A${(w / 2).toFixed(1)},${(w / 2).toFixed(1)} 0 0 1 ${(cx + w / 2).toFixed(1)},${(y + w / 2).toFixed(1)} L${(cx + w / 2).toFixed(1)},128 Z" fill="${isDoor ? PALETTE.pink : "rgba(244,223,194,0.16)"}" stroke="${isDoor ? PALETTE.cream : "rgba(244,223,194,0.28)"}" stroke-width="1.2"/>`
      );
    }

    // 柱子（bays + 1 根）
    for (let i = 0; i <= bays; i++) {
      const cx = left + i * colW;
      const isCenterPillar = !isOdd && i === bays / 2;
      out.push(
        `<rect x="${(cx - 4.5).toFixed(1)}" y="56" width="9" height="72" rx="1.5" fill="${isCenterPillar ? PALETTE.lavender : PALETTE.cream}" opacity="${isCenterPillar ? 1 : 0.78}"/>`
      );
    }

    // 中轴标注线
    out.push(
      `<line x1="${W / 2}" y1="8" x2="${W / 2}" y2="144" stroke="${isOdd ? PALETTE.pink : PALETTE.lavender}" stroke-width="1.4" stroke-dasharray="3 3" opacity="0.85"/>`
    );

    $("bay-fig").innerHTML = `<svg viewBox="0 0 ${W} ${H}">${out.join("")}</svg>`;
    $("bay-note").textContent = isOdd
      ? `${bays} 开间（奇数）：中轴正中是一扇敞开的主门，左右对称陪衬。`
      : `4 开间（偶数）：中轴正中落下了一根紫色柱子，主入口反而没处安放。`;
  };

  for (const b of btns) b.addEventListener("click", () => draw(+b.dataset.bays));
  draw(3);
}

// ---------- 06 小练习 ----------
const QUIZ = {
  A: {
    right: false,
    title: "A：4 件均分横排 — 不太理想",
    text: "数量是偶数且体量一样，眼睛立刻把它对半拆成 2 + 2，中间落空，看不出想主打哪一件。",
    svg() {
      return `<svg viewBox="0 0 180 120"><rect width="180" height="120" rx="8" fill="${PALETTE.bg}"/><line x1="90" y1="18" x2="90" y2="104" stroke="${PALETTE.lavender}" stroke-dasharray="3 3" stroke-width="1.4"/>${[30, 68, 112, 150]
        .map((x, i) => `<circle cx="${x}" cy="64" r="14" fill="${i % 2 === 0 ? PALETTE.orange : PALETTE.lavender}"/>`)
        .join("")}</svg>`;
    },
  },
  B: {
    right: false,
    title: "B：3 件等大站队 — 少了主次变化",
    text: "虽然用了奇数 3 个，但三个方块一样大、排成死直线、颜色全同，还是像排仪仗队，缺乏呼吸和焦点。",
    svg() {
      return `<svg viewBox="0 0 180 120"><rect width="180" height="120" rx="8" fill="${PALETTE.bg}"/>${[42, 90, 138]
        .map((x) => `<rect x="${x - 14}" y="50" width="28" height="28" rx="3" fill="#9a8ab8"/>`)
        .join("")}</svg>`;
    },
  },
  C: {
    right: true,
    title: "对，C 真正用好了奇数法则。",
    text: "3 个元素落在最轻松的感数范围内，同时拉开了大小、高低和形态色彩：中间珊瑚粉大圆自然成主角，左右方与三角错落陪衬，视线稳稳聚焦又有节奏。",
    svg() {
      return `<svg viewBox="0 0 180 120"><rect width="180" height="120" rx="8" fill="${PALETTE.bg}"/><path d="M40,56 Q90,14 140,56" fill="none" stroke="${PALETTE.pink}" stroke-width="1.5" stroke-dasharray="4 4"/><rect x="27" y="62" width="26" height="26" rx="3" fill="${PALETTE.orange}"/><circle cx="90" cy="60" r="22" fill="${PALETTE.pink}"/><polygon points="140,58 156,88 124,88" fill="${PALETTE.cream}"/></svg>`;
    },
  },
  D: {
    right: false,
    title: "D：9 件密排长条 — 超出瞬时点数",
    text: "虽然 9 是奇数，但超过 7 个以后眼睛不再数单双，只会把它们读成一整条均质色带，奇数的主次优势已经消失。",
    svg() {
      return `<svg viewBox="0 0 180 120"><rect width="180" height="120" rx="8" fill="${PALETTE.bg}"/>${Array.from({ length: 9 }, (_, i) => `<circle cx="${(18 + i * 18).toFixed(0)}" cy="64" r="6.5" fill="${PALETTE.orange}"/>`).join("")}</svg>`;
    },
  },
};

function initQuiz() {
  const btns = [...document.querySelectorAll(".opt")];
  for (const b of btns) {
    const k = b.dataset.k;
    const q = QUIZ[k];
    b.querySelector(".opt-fig").innerHTML = q.svg();
    b.classList.toggle("right", q.right);
    b.addEventListener("click", () => {
      for (const x of btns) x.setAttribute("aria-pressed", String(x === b));
      const v = $("verdict");
      v.hidden = false;
      v.classList.toggle("right", q.right);
      $("v-title").textContent = q.title;
      $("v-text").textContent = q.right ? q.text : `${q.text} 对照 C：${QUIZ.C.text}`;
    });
  }
}

// ---------- 07 原海报放大 + 拖动查看 + Esc 关闭 ----------
function initPosterZoom() {
  const fig = $("poster-fig");
  const btn = $("poster-btn");
  const closeBtn = $("poster-close");
  let pan = { x: 0, y: 0 };
  let drag = null;
  let moved = false;

  const applyPan = () => {
    btn.style.transform = fig.classList.contains("zoomed") ? `translate(${pan.x.toFixed(1)}px, ${pan.y.toFixed(1)}px)` : "";
  };

  const setOpen = (open) => {
    fig.classList.toggle("zoomed", open);
    document.documentElement.classList.toggle("noscroll", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "按住拖动查看海报，按 Esc 收起" : "放大原海报");
    closeBtn.hidden = !open;
    pan = { x: 0, y: 0 };
    applyPan();
    if (!open) btn.focus();
  };

  btn.addEventListener("pointerdown", (e) => {
    if (!fig.classList.contains("zoomed")) return;
    e.preventDefault();
    btn.setPointerCapture(e.pointerId);
    drag = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
    moved = false;
  });
  btn.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (Math.hypot(dx, dy) > 4) moved = true;
    pan.x = clamp(drag.px + dx, -520, 520);
    pan.y = clamp(drag.py + dy, -520, 520);
    applyPan();
  });
  const endPan = () => { drag = null; };
  btn.addEventListener("pointerup", endPan);
  btn.addEventListener("pointercancel", endPan);

  btn.addEventListener("click", () => {
    if (!fig.classList.contains("zoomed")) {
      setOpen(true);
    } else if (!moved) {
      setOpen(false);
    }
    moved = false;
  });
  closeBtn.addEventListener("click", () => setOpen(false));
  fig.addEventListener("click", (e) => {
    if (fig.classList.contains("zoomed") && e.target === fig) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && fig.classList.contains("zoomed")) setOpen(false);
  });
}

// ---------- 滚动渐显 ----------
function initReveals() {
  if (reducedMotion.matches) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px 10% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

export function initFigures() {
  initCompare();
  initSubitizing();
  initMixer();
  initLayouts();
  initBays();
  initQuiz();
  initPosterZoom();
  initReveals();
}

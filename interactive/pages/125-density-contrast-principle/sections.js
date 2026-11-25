// 125 疏密对比原则 · 正文 01–07 全部独立交互模块
// 每节使用截然不同的控件与互动隐喻：
// 01 眯眼模糊与密/疏主角翻转 | 02 视觉节拍音阶展廊 | 03 横向拖拉卷帘 Before/After
// 04 历史时代档案与图示切换 | 05 适用/别用翻牌诊断卡 | 06 四选一建筑展盲测 | 07 原海报灯箱

import { PALETTE } from "./palette.js";

// ---------- 01：为什么疏密能定重心（眯眼低通模糊 + 密/疏主角反客为主） ----------
function initSection01() {
  const modeBtns = document.querySelectorAll("[data-s1-mode]");
  const squintBtn = document.getElementById("s1-squint-btn");
  const svg = document.getElementById("s1-svg");
  const caption = document.getElementById("s1-caption");
  const note = document.getElementById("s1-note");
  if (!svg) return;

  let mode = "dense-hero"; // "dense-hero" | "sparse-hero"
  let squint = false;

  const MODES = {
    "dense-hero": {
      caption: "密处成主角：周边大面积疏朗，高密点群靠边缘堆积迅速抓眼",
      note: "在较空旷的纸面上，局部密集聚拢形成最高边缘与特征反差（罗森霍茨称为局部特征拥挤核），第一眼自动落在这里，周围留白则让视网膜迅速完成辨认。",
    },
    "sparse-hero": {
      caption: "疏处反客为主：全盘铺满极密点阵，唯独撕开的一块空白变成视觉靶心",
      note: "这就是对海报「密集处形成视觉重心」的温和补充：真正抓眼的不是绝对的「密」，而是「与周边截然不同的密度反差」。满纸皆密时，留出一口呼吸空窗，空窗本身就是焦点。",
    },
  };

  function render() {
    const ns = "http://www.w3.org/2000/svg";
    svg.innerHTML = "";
    const defs = document.createElementNS(ns, "defs");
    const filt = document.createElementNS(ns, "filter");
    filt.setAttribute("id", "s1-blur-filter");
    const fe = document.createElementNS(ns, "feGaussianBlur");
    fe.setAttribute("stdDeviation", squint ? "7.5" : "0");
    filt.appendChild(fe);
    defs.appendChild(filt);
    svg.appendChild(defs);

    const g = document.createElementNS(ns, "g");
    if (squint) g.setAttribute("filter", "url(#s1-blur-filter)");

    const bg = document.createElementNS(ns, "rect");
    bg.setAttribute("x", "0");
    bg.setAttribute("y", "0");
    bg.setAttribute("width", "560");
    bg.setAttribute("height", "280");
    bg.setAttribute("fill", PALETTE.paper);
    g.appendChild(bg);

    if (mode === "dense-hero") {
      // 左侧高密深靛蓝→深松绿核，右侧疏朗樱粉与暖沙米点
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 6; c++) {
          const cx = 54 + c * 24;
          const cy = 44 + r * 32;
          const dist = Math.hypot(cx - 102, cy - 140);
          if (dist > 94) continue;
          const dot = document.createElementNS(ns, "circle");
          dot.setAttribute("cx", String(cx));
          dot.setAttribute("cy", String(cy));
          dot.setAttribute("r", "9.5");
          dot.setAttribute("fill", dist < 56 ? PALETTE.navy : PALETTE.green);
          g.appendChild(dot);
        }
      }
      const sparseDots = [
        [226, 78, 8.5, PALETTE.orange], [244, 154, 8.5, PALETTE.orange], [218, 218, 8.5, PALETTE.orange],
        [314, 108, 8, PALETTE.pink], [358, 198, 8, PALETTE.pink], [428, 76, 8, PALETTE.sand],
        [486, 174, 8, PALETTE.sand], [448, 232, 8, PALETTE.sand],
      ];
      for (const [cx, cy, r, fill] of sparseDots) {
        const dot = document.createElementNS(ns, "circle");
        dot.setAttribute("cx", String(cx));
        dot.setAttribute("cy", String(cy));
        dot.setAttribute("r", String(r));
        dot.setAttribute("fill", fill);
        g.appendChild(dot);
      }
    } else {
      // 满幅高密网格点阵，但在右偏上 (380, 136) 处挖出一个直径 118px 的纯净呼吸空岛
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 18; c++) {
          const cx = 24 + c * 30;
          const cy = 22 + r * 29;
          const d = Math.hypot(cx - 382, cy - 138);
          if (d < 74) continue;
          const dot = document.createElementNS(ns, "circle");
          dot.setAttribute("cx", String(cx));
          dot.setAttribute("cy", String(cy));
          dot.setAttribute("r", "9");
          dot.setAttribute("fill", d < 108 ? PALETTE.green : PALETTE.navy);
          g.appendChild(dot);
        }
      }
      // 空岛中心只落一枚孤立朱橘小标，反衬周围极密背景
      const core = document.createElementNS(ns, "circle");
      core.setAttribute("cx", "382");
      core.setAttribute("cy", "138");
      core.setAttribute("r", "11");
      core.setAttribute("fill", PALETTE.orange);
      g.appendChild(core);
    }

    svg.appendChild(g);

    // 眯眼模式下叠加清晰文字浮签提示焦点位置
    if (squint) {
      const fx = mode === "dense-hero" ? 102 : 382;
      const fy = mode === "dense-hero" ? 140 : 138;
      const ring = document.createElementNS(ns, "circle");
      ring.setAttribute("cx", String(fx));
      ring.setAttribute("cy", String(fy));
      ring.setAttribute("r", "56");
      ring.setAttribute("fill", "none");
      ring.setAttribute("stroke", PALETTE.orange);
      ring.setAttribute("stroke-width", "2");
      ring.setAttribute("stroke-dasharray", "6 4");
      svg.appendChild(ring);
    }

    if (caption) caption.textContent = MODES[mode].caption;
    if (note) note.textContent = MODES[mode].note;
    modeBtns.forEach((b) => b.setAttribute("aria-pressed", b.dataset.s1Mode === mode ? "true" : "false"));
    if (squintBtn) {
      squintBtn.setAttribute("aria-pressed", String(squint));
      squintBtn.textContent = squint ? "眯眼检验：已开启（反差核浮现）" : "开启「眯眼模糊」检验焦点";
    }
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.s1Mode;
      render();
    });
  });
  if (squintBtn) {
    squintBtn.addEventListener("click", () => {
      squint = !squint;
      render();
    });
  }
  render();
}

// ---------- 02：密到疏的四种节奏型（节拍音阶带 + SVG 路径演播） ----------
function initSection02() {
  const btns = document.querySelectorAll("[data-rhythm]");
  const svg = document.getElementById("s2-svg");
  const barsHost = document.getElementById("s2-bars");
  const titleEl = document.getElementById("s2-title");
  const tempoEl = document.getElementById("s2-tempo");
  const descEl = document.getElementById("s2-desc");
  const useEl = document.getElementById("s2-use");
  if (!svg || !barsHost) return;

  const PATTERNS = {
    gradient: {
      title: "单向渐变 · 从浓到淡一路滑行",
      tempo: "快密起拍 → 渐慢延音",
      desc: "像 125 原海报一样，把高密元素压在一端起势，再沿阅读方向逐步放宽间距。读者会被自然「推」着扫过整个幅面，动势最强。",
      use: "适合海报主视觉、流程叙事横幅、展览导览墙。",
      beats: [95, 92, 84, 72, 58, 44, 34, 24, 18, 12, 8, 6],
      path: "M 64 132 C 180 128, 320 132, 496 132",
      dots: [
        [44, 72, 10, PALETTE.navy], [44, 104, 10, PALETTE.navy], [44, 136, 10, PALETTE.navy], [44, 168, 10, PALETTE.navy], [44, 200, 10, PALETTE.navy],
        [74, 72, 10, PALETTE.navy], [74, 104, 10, PALETTE.navy], [74, 136, 10, PALETTE.navy], [74, 168, 10, PALETTE.navy], [74, 200, 10, PALETTE.navy],
        [106, 80, 10, PALETTE.green], [106, 114, 10, PALETTE.green], [106, 150, 10, PALETTE.green], [106, 186, 10, PALETTE.green],
        [146, 92, 9.5, PALETTE.green], [148, 136, 9.5, PALETTE.green], [142, 178, 9.5, PALETTE.green],
        [204, 88, 9, PALETTE.orange], [216, 140, 9, PALETTE.orange], [198, 192, 9, PALETTE.orange],
        [286, 110, 8.5, PALETTE.pink], [308, 176, 8.5, PALETTE.pink], [386, 132, 8, PALETTE.pink],
        [462, 94, 8, PALETTE.sand], [504, 174, 8, PALETTE.sand],
      ],
    },
    radial: {
      title: "中心辐射 · 核密周疏的向心静力",
      tempo: "弱起 → 中拍聚爆 → 余韵散开",
      desc: "把信息核心紧密压在画面中央，外围逐层稀释成大面积呼吸白边。动势向内收束，自带庄重、克制与仪式感。",
      use: "适合品牌封面、徽标展示页、产品发布会首屏主视觉。",
      beats: [12, 18, 32, 56, 86, 98, 98, 86, 56, 32, 18, 12],
      path: "M 280 136 m -78 0 a 78 78 0 1 0 156 0 a 78 78 0 1 0 -156 0",
      dots: [
        [280, 136, 10, PALETTE.navy],
        [254, 120, 10, PALETTE.navy], [306, 120, 10, PALETTE.navy], [254, 152, 10, PALETTE.navy], [306, 152, 10, PALETTE.navy],
        [280, 106, 10, PALETTE.navy], [280, 166, 10, PALETTE.navy],
        [226, 136, 9.5, PALETTE.green], [334, 136, 9.5, PALETTE.green], [244, 92, 9.5, PALETTE.green], [316, 92, 9.5, PALETTE.green],
        [244, 180, 9.5, PALETTE.green], [316, 180, 9.5, PALETTE.green],
        [192, 102, 9, PALETTE.orange], [368, 102, 9, PALETTE.orange], [192, 172, 9, PALETTE.orange], [368, 172, 9, PALETTE.orange],
        [136, 136, 8.5, PALETTE.pink], [424, 136, 8.5, PALETTE.pink], [280, 52, 8.5, PALETTE.pink], [280, 220, 8.5, PALETTE.pink],
        [72, 76, 8, PALETTE.sand], [488, 76, 8, PALETTE.sand], [72, 198, 8, PALETTE.sand], [488, 198, 8, PALETTE.sand],
      ],
    },
    bipolar: {
      title: "双极呼应 · 一重一轻的对角牵引",
      tempo: "重拍落定 → 休止空拍 → 轻拍回声",
      desc: "左下放一处大面积高密主核，右上留一处体量只有主核三分之一的小密团作回声，中间留出宽阔斜向留白带。既稳住重心，又让视线来回对话。",
      use: "适合杂志跨页图文对位、标题与页码/落款的遥相呼应。",
      beats: [92, 88, 72, 42, 18, 12, 12, 18, 34, 58, 66, 48],
      path: "M 92 186 Q 280 142, 468 78",
      dots: [
        [52, 152, 10, PALETTE.navy], [82, 152, 10, PALETTE.navy], [112, 152, 10, PALETTE.navy],
        [52, 182, 10, PALETTE.navy], [82, 182, 10, PALETTE.navy], [112, 182, 10, PALETTE.navy],
        [52, 212, 10, PALETTE.navy], [82, 212, 10, PALETTE.navy], [112, 212, 10, PALETTE.navy],
        [146, 166, 9.5, PALETTE.green], [148, 200, 9.5, PALETTE.green], [118, 122, 9.5, PALETTE.green],
        [192, 156, 9, PALETTE.orange], [258, 146, 8.5, PALETTE.pink], [344, 118, 8.5, PALETTE.pink],
        [434, 72, 9, PALETTE.green], [462, 72, 9, PALETTE.navy], [490, 72, 9, PALETTE.navy],
        [448, 98, 9, PALETTE.green], [478, 98, 9, PALETTE.navy], [404, 96, 8.5, PALETTE.orange],
        [88, 64, 8, PALETTE.sand], [486, 198, 8, PALETTE.sand],
      ],
    },
    tiered: {
      title: "阶梯呼吸 · 信息段与空白带交替",
      tempo: "密段 — 空行 — 密段 — 空行",
      desc: "把相关条目紧收成紧凑小密块，块与块之间故意切出清晰空白走廊。读者一眼就能分段扫读，不会陷入密密麻麻的「文字墙」。",
      use: "适合长文专栏、产品特性页、移动端的卡片信息流。",
      beats: [82, 86, 78, 14, 14, 76, 82, 74, 14, 14, 68, 60],
      path: "M 54 136 L 160 136 M 224 136 L 332 136 M 396 136 L 502 136",
      dots: [
        // 块 1
        [58, 88, 9.5, PALETTE.navy], [86, 88, 9.5, PALETTE.navy], [114, 88, 9.5, PALETTE.navy], [142, 88, 9.5, PALETTE.green],
        [58, 118, 9.5, PALETTE.navy], [86, 118, 9.5, PALETTE.navy], [114, 118, 9.5, PALETTE.green], [142, 118, 9.5, PALETTE.orange],
        [58, 148, 9.5, PALETTE.navy], [86, 148, 9.5, PALETTE.green], [114, 148, 9.5, PALETTE.orange],
        // 块 2
        [232, 88, 9.5, PALETTE.navy], [260, 88, 9.5, PALETTE.navy], [288, 88, 9.5, PALETTE.green], [316, 88, 9.5, PALETTE.green],
        [232, 118, 9.5, PALETTE.navy], [260, 118, 9.5, PALETTE.green], [288, 118, 9.5, PALETTE.orange],
        [232, 148, 9.5, PALETTE.green], [260, 148, 9.5, PALETTE.orange],
        // 块 3
        [406, 88, 9.5, PALETTE.green], [434, 88, 9.5, PALETTE.green], [462, 88, 9.5, PALETTE.orange], [490, 88, 9.5, PALETTE.pink],
        [406, 118, 9.5, PALETTE.green], [434, 118, 9.5, PALETTE.orange], [462, 118, 9.5, PALETTE.pink],
        // 底部留白余韵
        [188, 212, 8, PALETTE.sand], [362, 212, 8, PALETTE.sand],
      ],
    },
  };

  function select(id) {
    const p = PATTERNS[id];
    if (!p) return;
    btns.forEach((b) => b.setAttribute("aria-pressed", b.dataset.rhythm === id ? "true" : "false"));
    if (titleEl) titleEl.textContent = p.title;
    if (tempoEl) tempoEl.textContent = p.tempo;
    if (descEl) descEl.textContent = p.desc;
    if (useEl) useEl.textContent = p.use;

    // 渲染节拍音阶柱
    barsHost.innerHTML = "";
    p.beats.forEach((val, idx) => {
      const col = document.createElement("div");
      col.className = "s2-beat-col";
      const bar = document.createElement("span");
      bar.className = "s2-beat-bar";
      bar.style.height = `${Math.max(12, val)}%`;
      bar.style.background = val >= 78 ? PALETTE.navy : val >= 52 ? PALETTE.green : val >= 30 ? PALETTE.orange : val >= 18 ? PALETTE.pink : PALETTE.sand;
      const num = document.createElement("span");
      num.className = "s2-beat-idx";
      num.textContent = String(idx + 1).padStart(2, "0");
      col.appendChild(bar);
      col.appendChild(num);
      barsHost.appendChild(col);
    });

    // 渲染 SVG 图示
    const ns = "http://www.w3.org/2000/svg";
    svg.innerHTML = "";
    const bg = document.createElementNS(ns, "rect");
    bg.setAttribute("width", "560");
    bg.setAttribute("height", "268");
    bg.setAttribute("fill", PALETTE.paper);
    svg.appendChild(bg);

    const track = document.createElementNS(ns, "path");
    track.setAttribute("d", p.path);
    track.setAttribute("fill", "none");
    track.setAttribute("stroke", PALETTE.orange);
    track.setAttribute("stroke-width", "2");
    track.setAttribute("stroke-dasharray", "6 5");
    track.setAttribute("opacity", "0.75");
    svg.appendChild(track);

    for (const [cx, cy, r, fill] of p.dots) {
      const c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", String(cx));
      c.setAttribute("cy", String(cy));
      c.setAttribute("r", String(r));
      c.setAttribute("fill", fill);
      svg.appendChild(c);
    }
  }

  btns.forEach((btn) => btn.addEventListener("click", () => select(btn.dataset.rhythm)));
  select("gradient");
}

// ---------- 03：真实排版里的疏密拆解（横向拖拉卷帘 Before / After） ----------
function initSection03() {
  const sceneBtns = document.querySelectorAll("[data-s3-scene]");
  const range = document.getElementById("s3-curtain-range");
  const afterLayer = document.getElementById("s3-after-layer");
  const divider = document.getElementById("s3-divider");
  const pctLabel = document.getElementById("s3-pct");
  const beforeBox = document.getElementById("s3-before-content");
  const afterBox = document.getElementById("s3-after-content");
  const takeaway = document.getElementById("s3-takeaway");
  const ruleLine = document.getElementById("s3-rule-line");
  if (!range || !afterLayer || !beforeBox || !afterBox) return;

  const SCENES = {
    editorial: {
      takeaway: "杂志长文重构：把段落内行距压紧抱团（1.45×），把段落间与天头边白拉宽到 3–4 倍（经验值），文字墙立刻生出清朗的停顿与层级。",
      rule: "经验倍率：字行内距 1× · 段落间距 2.5× · 天头/页边留白 4×",
      before: `
        <div class="mock-ed mock-ed-flat">
          <div class="mock-kicker">ARCHITECTURE QUARTERLY · ISSUE 18 · AUTUMN ESSAY</div>
          <div class="mock-h">城市间隙中的微尺度呼吸空间与街道步行节奏研究报告</div>
          <div class="mock-cols-flat">
            <p>密集街区往往在连续立面中积累高强度的视觉信息，行人穿过时每两米就要处理招牌、门洞与车流，注意力持续处于紧绷状态。</p>
            <p>一旦街角突然退让出二十平米的小广场，树影与石凳构成的空阔带便会迅速解除视觉疲劳，让下一段商业立面重新鲜活起来。</p>
          </div>
          <div class="mock-meta-flat">作者：林知远 · 摄影：周宁 · 页码 042 · 2026 年秋刊 · 全文约 4800 字</div>
        </div>`,
      after: `
        <div class="mock-ed mock-ed-dense">
          <div class="mock-ed-grid2">
            <div class="mock-air-col">
              <span class="mock-pill">ISSUE 18</span>
              <span class="mock-pull-num">042</span>
              <span class="mock-pull-cap">左翼天头留白带</span>
            </div>
            <div class="mock-right-pack">
              <div class="mock-h-tight">城市间隙里的呼吸空间</div>
              <div class="mock-sub-tight">微尺度街道留白与步行节奏 · 林知远</div>
              <div class="mock-lead-col">
                <p>密集街区在连续立面里不断叠加招牌与信息，行人穿过时注意力始终紧绷。</p>
                <p>直到街角退让出一小块空场，疏朗的空间替眼睛松开弦，下一段街景才重新鲜活。</p>
              </div>
            </div>
          </div>
        </div>`,
    },
    poster: {
      takeaway: "展览海报重构：把主标、日期、地点三大块紧密收束成底部高密墨团，上方让出超过 55% 呼吸纸面与渐散星点，5 米之外就能一眼锁定主题。",
      rule: "经验倍率：主标组内距 1× · 主题与余白面积比约 1 : 2.2",
      before: `
        <div class="mock-po mock-po-flat">
          <div class="mock-po-top">2026.10.12 — 11.30 · 每日 10:00-18:00 开放</div>
          <div class="mock-po-mid">当代木构与光影建筑双年展</div>
          <div class="mock-po-dots-flat">
            <span></span><span></span><span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          <div class="mock-po-mid2">主办：南岸美术馆 · 策展人：陈叙 · 免费预约入场</div>
          <div class="mock-po-bot">地点：滨江大道 88 号三号展厅 · 轨道交通 4 号线直达</div>
        </div>`,
      after: `
        <div class="mock-po mock-po-dense">
          <div class="mock-po-sky">
            <span class="po-dot-s"></span>
            <span class="po-dot-m"></span>
            <span class="po-dot-l"></span>
          </div>
          <div class="mock-po-cluster">
            <div class="mock-po-cluster-left">
              <div class="mock-po-big">木构与光影</div>
              <div class="mock-po-en">TIMBER &amp; LIGHT BIENNALE</div>
            </div>
            <div class="mock-po-cluster-right">
              <div>10.12 — 11.30</div>
              <div>南岸美术馆 3 号厅</div>
              <div>每日 10:00–18:00</div>
            </div>
          </div>
        </div>`,
    },
    ui: {
      takeaway: "界面卡片重构：把强关联的价格与主按钮紧贴成高密行动组，卡片外缘与辅助说明拉出宽松间隙；罗森霍茨（2007）的研究证实，压低背景杂乱能显著加快目标搜索。",
      rule: "经验倍率：按钮与主价 8px · 字段组内 12px · 区块隔离 28–36px",
      before: `
        <div class="mock-ui mock-ui-flat">
          <div class="mock-ui-bar"><span>概览</span><span>账单</span><span>导出</span><span>成员</span><span>日志</span><span>设置</span></div>
          <div class="mock-ui-grid-flat">
            <div class="mui-cell"><b>专业版年付</b><small>含 5 席位与离线备份</small><em>¥299/年</em><i>立即升级</i></div>
            <div class="mui-cell"><b>团队协作版</b><small>含 20 席位与权限审计</small><em>¥899/年</em><i>立即升级</i></div>
            <div class="mui-cell"><b>本月用量</b><small>已使用 64% 额度</small><em>12.8 GB</em><i>查看明细</i></div>
            <div class="mui-cell"><b>最近账单</b><small>已开具电子发票</small><em>已结清</em><i>下载发票</i></div>
          </div>
        </div>`,
      after: `
        <div class="mock-ui mock-ui-dense">
          <div class="mock-ui-top-clean">
            <span class="mui-brand">方案与账单</span>
            <span class="mui-meta">年付立省 20%</span>
          </div>
          <div class="mock-ui-focus-row">
            <div class="mui-hero-card">
              <div class="mui-tight-pack">
                <span class="mui-tag">推荐方案</span>
                <div class="mui-price">¥299<span>/年</span></div>
                <div class="mui-cta">立即开通专业版</div>
              </div>
              <div class="mui-note">含 5 席位 · 离线备份 · 随时取消</div>
            </div>
            <div class="mui-side-air">
              <div>当前用量 <b>64%</b></div>
              <div>最近账单 <b>已结清</b></div>
            </div>
          </div>
        </div>`,
    },
  };

  let curScene = "editorial";

  function setSplit(pct) {
    const clamped = Math.max(8, Math.min(92, pct));
    afterLayer.style.clipPath = `inset(0 0 0 ${clamped}%)`;
    if (divider) divider.style.left = `${clamped}%`;
    if (pctLabel) pctLabel.textContent = `左均密 ${Math.round(clamped)}% ｜ 右疏密 ${Math.round(100 - clamped)}%`;
  }

  function renderScene(id) {
    curScene = id;
    const s = SCENES[id];
    if (!s) return;
    beforeBox.innerHTML = s.before;
    afterBox.innerHTML = s.after;
    if (takeaway) takeaway.textContent = s.takeaway;
    if (ruleLine) ruleLine.textContent = s.rule;
    sceneBtns.forEach((b) => b.setAttribute("aria-pressed", b.dataset.s3Scene === id ? "true" : "false"));
  }

  range.addEventListener("input", () => setSplit(parseFloat(range.value)));
  sceneBtns.forEach((b) => b.addEventListener("click", () => renderScene(b.dataset.s3Scene)));

  renderScene(curScene);
  setSplit(parseFloat(range.value) || 50);
}

// ---------- 04：从哪来（四时代档案切换 + 极简历史 SVG 图解） ----------
function initSection04() {
  const tabs = document.querySelectorAll("[data-era]");
  const yearEl = document.getElementById("s4-year");
  const titleEl = document.getElementById("s4-title");
  const quoteEl = document.getElementById("s4-quote");
  const bodyEl = document.getElementById("s4-body");
  const sourceEl = document.getElementById("s4-source");
  const svg = document.getElementById("s4-svg");
  if (!svg) return;

  const ERAS = {
    "1802": {
      year: "1802 · 清嘉庆七年",
      title: "邓石如口授、包世臣记入《艺舟双楫》",
      quote: "「字画疏处可以走马，密处不使透风，常计白以当黑，奇趣乃出。」",
      body: "清代书法篆刻家邓石如用极直观的画面感道破疏密之妙：把笔画紧压处做到严丝合缝，把留白空阔处放得宽可跑马。当疏与密拉开足够落差，字与印的空白就不再是剩余废纸，而是能撑起气势的结构力量。",
      source: "出处：包世臣《艺舟双楫·卷五·述书上》（维基文库可核实原文）",
      draw() {
        // 篆刻疏密章法微图：右半极密竖格，左半开阔可走马
        return `
          <rect x="28" y="16" width="224" height="148" fill="${PALETTE.paper}" stroke="${PALETTE.orange}" stroke-width="3"/>
          <g fill="${PALETTE.orange}">
            <rect x="160" y="34" width="12" height="112"/>
            <rect x="180" y="34" width="12" height="112"/>
            <rect x="200" y="34" width="12" height="112"/>
            <rect x="220" y="34" width="12" height="112"/>
            <rect x="160" y="68" width="72" height="10"/>
            <rect x="160" y="106" width="72" height="10"/>
            <rect x="48" y="34" width="14" height="112"/>
            <rect x="48" y="34" width="52" height="12"/>
          </g>
          <text x="108" y="98" text-anchor="middle" fill="${PALETTE.navy}" font-size="13" font-weight="700">疏可走马</text>
          <text x="196" y="186" text-anchor="middle" fill="${PALETTE.orangeText}" font-size="11.5" font-weight="600">密不透风</text>
        `;
      },
    },
    "1926": {
      year: "1926 · 包豪斯丛书第 9 册",
      title: "瓦西里·康定斯基《点、线、面》",
      quote: "「点的重复与堆积会掀起内在音响的风暴，并生出最原初的视觉节奏。」",
      body: "康定斯基在包豪斯任教期间出版《Punkt und Linie zu Fläche》，把抽象圆点当成有重量与声响的能量单位：圆点紧密叠加会产生高压与轰鸣，稀疏散落则像休止与远声——这正是 125 原海报以五色圆点示演疏密节奏的直系视觉源头。",
      source: "出处：Wassily Kandinsky, Punkt und Linie zu Fläche (Bauhausbücher 9, 1926; Guggenheim 1947 英译本)",
      draw() {
        return `
          <rect x="16" y="20" width="248" height="160" fill="${PALETTE.paper}" stroke="${PALETTE.ink}" stroke-width="1.5"/>
          <g fill="${PALETTE.navy}">
            <circle cx="56" cy="68" r="10"/><circle cx="78" cy="68" r="10"/><circle cx="56" cy="90" r="10"/><circle cx="78" cy="90" r="10"/>
            <circle cx="56" cy="112" r="10"/><circle cx="78" cy="112" r="10"/><circle cx="100" cy="78" r="9"/><circle cx="100" cy="102" r="9"/>
          </g>
          <circle cx="132" cy="84" r="8" fill="${PALETTE.green}"/>
          <circle cx="136" cy="116" r="8" fill="${PALETTE.green}"/>
          <circle cx="168" cy="96" r="7" fill="${PALETTE.orange}"/>
          <circle cx="206" cy="72" r="6" fill="${PALETTE.pink}"/>
          <circle cx="234" cy="134" r="5.5" fill="${PALETTE.sand}"/>
          <line x1="40" y1="154" x2="242" y2="154" stroke="${PALETTE.ink}" stroke-width="1.2" stroke-dasharray="4 3"/>
        `;
      },
    },
    "1954": {
      year: "1954 / 1973 · 格式塔与视觉语法",
      title: "鲁道夫·阿恩海姆 & 多尼斯·A·唐迪斯",
      quote: "「视知觉不是被动录像，而是在重量、张力与对比中主动寻找结构。」",
      body: "格式塔艺术理论家阿恩海姆在 1954 年《艺术与视知觉》中论证了视觉重量与空间场的张力规律；1973 年唐迪斯在 MIT 出版社出版《视觉素养入门》，将聚散、繁简与留白作为成对的视觉语法写入现代平面与传媒教学。",
      source: "出处：Rudolf Arnheim, Art and Visual Perception (1954)；Donis A. Dondis, A Primer of Visual Literacy (MIT Press, 1973)",
      draw() {
        return `
          <rect x="16" y="20" width="248" height="160" fill="${PALETTE.paper}" stroke="${PALETTE.ink}" stroke-width="1.5"/>
          <circle cx="92" cy="100" r="46" fill="none" stroke="${PALETTE.navy}" stroke-width="1.4" stroke-dasharray="4 4"/>
          <circle cx="92" cy="100" r="24" fill="${PALETTE.navy}"/>
          <circle cx="212" cy="100" r="12" fill="${PALETTE.orange}"/>
          <line x1="120" y1="100" x2="196" y2="100" stroke="${PALETTE.green}" stroke-width="2"/>
          <text x="92" y="164" text-anchor="middle" fill="${PALETTE.navy}" font-size="11" font-weight="600">视觉重力场</text>
          <text x="212" y="164" text-anchor="middle" fill="${PALETTE.orangeText}" font-size="11" font-weight="600">平衡呼应点</text>
        `;
      },
    },
    "2007": {
      year: "2007 / 2011 · 视觉拥挤实证研究",
      title: "罗森霍茨（特征拥挤）& 惠特尼 / 列维（视觉拥挤）",
      quote: "「界面越拥挤，人眼在周边视野里越难辨认单个目标，搜索耗时随之攀升。」",
      body: "MIT 视觉科学家露丝·罗森霍茨等人 2007 年在《视觉杂志》提出「特征拥挤（Feature Congestion）」模型；2011 年戴维·惠特尼与丹尼斯·列维在《认知科学趋势》综述「视觉拥挤效应」，从神经科学层面解释了为什么稀疏留白绝非浪费，而是保障清晰识别的必需缓冲。",
      source: "出处：Rosenholtz et al., Journal of Vision 7(2):17 (2007)；Whitney & Levi, Trends in Cognitive Sciences 15(4) (2011)",
      draw() {
        return `
          <rect x="16" y="20" width="114" height="160" fill="#F6E9E8" stroke="${PALETTE.warn}" stroke-width="1.5"/>
          <rect x="150" y="20" width="114" height="160" fill="${PALETTE.paperGreenMist}" stroke="${PALETTE.green}" stroke-width="1.5"/>
          <g fill="${PALETTE.ink}" font-size="15" font-weight="700" text-anchor="middle">
            <text x="54" y="104">A</text><text x="73" y="104" fill="${PALETTE.warn}">R</text><text x="92" y="104">M</text>
            <text x="73" y="84">K</text><text x="73" y="124">H</text>
            <text x="207" y="104" fill="${PALETTE.green}">R</text>
          </g>
          <text x="73" y="164" text-anchor="middle" fill="${PALETTE.warn}" font-size="11" font-weight="600">周边拥挤干扰</text>
          <text x="207" y="164" text-anchor="middle" fill="${PALETTE.green}" font-size="11" font-weight="600">稀疏清晰辨认</text>
        `;
      },
    },
  };

  function showEra(key) {
    const e = ERAS[key];
    if (!e) return;
    tabs.forEach((b) => b.setAttribute("aria-pressed", b.dataset.era === key ? "true" : "false"));
    if (yearEl) yearEl.textContent = e.year;
    if (titleEl) titleEl.textContent = e.title;
    if (quoteEl) quoteEl.textContent = e.quote;
    if (bodyEl) bodyEl.textContent = e.body;
    if (sourceEl) sourceEl.textContent = e.source;
    svg.innerHTML = e.draw();
  }

  tabs.forEach((b) => b.addEventListener("click", () => showEra(b.dataset.era)));
  showEra("1802");
}

// ---------- 05：什么时候用与别用（6 枚项目场景诊断卡翻检） ----------
function initSection05() {
  const cards = document.querySelectorAll("[data-case-card]");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const open = card.getAttribute("aria-expanded") === "true";
      card.setAttribute("aria-expanded", String(!open));
    });
  });
}

// ---------- 06：小练习（4 选 1 建筑展盲测，只差「密度分布」一个变量） ----------
function initSection06() {
  const opts = document.querySelectorAll("[data-quiz-opt]");
  const fb = document.getElementById("quiz-feedback");
  const fbTitle = document.getElementById("quiz-fb-title");
  const fbBody = document.getElementById("quiz-fb-body");
  const resetBtn = document.getElementById("quiz-reset");
  if (!opts.length || !fb) return;

  const ANSWERS = {
    A: {
      ok: false,
      title: "版面 A 是「均匀平铺」：没有第一眼抓手",
      body: "16 枚圆点等距铺满整幅海报，主标题和展期被埋在同样密度的点网里。疏密落差接近 1.1×，读者扫完整张都分不清先看哪里。",
    },
    B: {
      ok: false,
      title: "版面 B 是「死角断崖」：局部窒息、前后割裂",
      body: "16 枚圆点全堵死在左下标题周围，右上七成纸面骤然变空且没有任何过渡点。左下角视觉拥挤发闷，视线也很难顺畅滑向右上角展期。",
    },
    C: {
      ok: true,
      title: "答对了！版面 C 同时做到了重心、呼吸与渐变节奏",
      body: "左下主标题旁紧聚成深靛蓝与深松绿密核，第一眼就锁住展览主题；往右上方借朱橘与樱粉圆点逐步拉宽间距，把视线自然带往右上角开阔留白里的展期，张弛得当。",
    },
    D: {
      ok: false,
      title: "版面 D 是「四角互搏」：四个等重密团分散了焦点",
      body: "四个角落各聚了 4 枚等密圆点，互相拉扯视线，反而把正中的主信息架空。疏密对比需要明确的主次，而不是到处都密一点。",
    },
  };

  function choose(key) {
    const a = ANSWERS[key];
    if (!a) return;
    opts.forEach((btn) => {
      const k = btn.dataset.quizOpt;
      btn.setAttribute("aria-pressed", k === key ? "true" : "false");
      btn.classList.remove("is-picked-ok", "is-picked-wrong", "is-reveal-ok");
      if (k === key) btn.classList.add(a.ok ? "is-picked-ok" : "is-picked-wrong");
      else if (k === "C") btn.classList.add("is-reveal-ok");
    });
    fb.hidden = false;
    fb.dataset.result = a.ok ? "ok" : "wrong";
    if (fbTitle) fbTitle.textContent = a.title;
    if (fbBody) fbBody.textContent = a.body;
  }

  opts.forEach((btn) => btn.addEventListener("click", () => choose(btn.dataset.quizOpt)));
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      opts.forEach((b) => {
        b.setAttribute("aria-pressed", "false");
        b.classList.remove("is-picked-ok", "is-picked-wrong", "is-reveal-ok");
      });
      fb.hidden = true;
    });
  }
}

// ---------- 07：原海报缩放拖动灯箱（draggable="false" + Esc 关闭） ----------
function initLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const dialog = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lb-img");
  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const zoomResetBtn = document.getElementById("lb-zoom-reset");
  const stage = document.getElementById("lb-stage");
  if (!poster || !dialog || !lbImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomResetBtn) zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    dialog.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  openBtn?.addEventListener("click", open);
  poster.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === stage) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dialog.hidden) close();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbImg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    dragging = true;
    startX = e.clientX - tx;
    startY = e.clientY - ty;
    try { lbImg.setPointerCapture(e.pointerId); } catch {}
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - startX;
    ty = e.clientY - startY;
    applyTransform();
  });
  const endPan = () => { dragging = false; };
  lbImg.addEventListener("pointerup", endPan);
  lbImg.addEventListener("pointercancel", endPan);
}

export function initSections() {
  initSection01();
  initSection02();
  initSection03();
  initSection04();
  initSection05();
  initSection06();
  initLightbox();
}

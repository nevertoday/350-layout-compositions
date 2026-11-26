// 259 正文七节互动模块（每节交互形态互不重复）
import { contrastRatio } from "./model.js";

/* ==================== 01 串行长页 vs 极性分屏对照 ==================== */
const S1_TASKS = {
  eval: {
    bridge: "VS",
    leftTitle: "优势 STRENGTHS",
    leftRows: ["提升效率：核心路径缩短一半", "目标明确：双方分工一眼分清", "团队协作：评审口径同屏对齐"],
    rightTitle: "挑战 CHALLENGES",
    rightRows: ["时间压力：首版交付窗口紧迫", "资源限制：半屏可用宽度减半", "不确定性：多端断点需提前校验"],
    serialSummary: "上下串行长页：读完挑战想回头核对优势，需要来回滚动约 4 次（示意），工作记忆反复被打断。",
    splitSummary: "左右极性分屏：两极同框且逐行齐平，眼球水平扫视即可直接比对 3 组差异（0 次翻页回看，示意）。",
  },
  diff: {
    bridge: "↔",
    leftTitle: "改版前 BEFORE",
    leftRows: ["浅灰堆砌：按钮和卡片全同一明度", "入口藏深：首屏看完不知怎么选", "文案冗长：每条说明超过四行"],
    rightTitle: "改版后 AFTER",
    rightRows: ["黑灰分极：13.2:1 反差瞬间划界", "双极直选：两类用户一步进入", "精简三点：首屏留白回到 44%"],
    serialSummary: "上下串行长页：看改版后细节时，改版前的样子已经滚出视野，难以对照哪里变了（约 3 次回滚，示意）。",
    splitSummary: "左右极性分屏：新旧界面并置在同高坐标里，每一处删改都能当场逐行印证（0 次回滚，示意）。",
  },
  path: {
    bridge: "OR",
    leftTitle: "创作者入口 CREATOR",
    leftRows: ["发布作品集与互动样张", "管理会员订阅与版本记录", "一键生成离线打包网页"],
    rightTitle: "团队协作 TEAM",
    rightRows: ["多人同步审稿与批注留痕", "统一字体与色彩规范库", "按项目隔离权限与审批流"],
    serialSummary: "上下串行长页：排在下面的团队版天然被折叠在首屏外，访客容易误以为产品只面向个人（约 2 次折返，示意）。",
    splitSummary: "左右极性分屏：两类核心受众在首屏平起平坐，用户 2 秒内即可认出自己该进哪一侧（示意）。",
  },
};

function initSection01() {
  const stage = document.getElementById("s1-stage");
  const readout = document.getElementById("s1-readout");
  let task = "eval";
  let mode = "split";

  function render() {
    const d = S1_TASKS[task];
    if (mode === "split") {
      stage.innerHTML = `
        <div class="s1-split-view">
          <div class="s1-pane-dark">
            <h3 class="s1-pane-title">${d.leftTitle}</h3>
            <ul class="s1-rows">${d.leftRows.map((r) => `<li>${r}</li>`).join("")}</ul>
          </div>
          <div class="s1-bridge-dot" aria-hidden="true">${d.bridge}</div>
          <div class="s1-pane-light">
            <h3 class="s1-pane-title">${d.rightTitle}</h3>
            <ul class="s1-rows">${d.rightRows.map((r) => `<li>${r}</li>`).join("")}</ul>
          </div>
        </div>`;
      readout.textContent = d.splitSummary;
    } else {
      stage.innerHTML = `
        <div class="s1-serial-view">
          <div class="s1-serial-card">
            <h3 class="s1-pane-title">${d.leftTitle}</h3>
            <ul class="s1-rows">${d.leftRows.map((r) => `<li>${r}</li>`).join("")}</ul>
          </div>
          <div class="s1-serial-gap">↓ 需要向下翻屏后，凭记忆对照下一组 ↓</div>
          <div class="s1-serial-card">
            <h3 class="s1-pane-title">${d.rightTitle}</h3>
            <ul class="s1-rows">${d.rightRows.map((r) => `<li>${r}</li>`).join("")}</ul>
          </div>
        </div>`;
      readout.textContent = d.serialSummary;
    }
  }

  document.getElementById("s1-task-btns").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-s1-task]");
    if (!btn) return;
    task = btn.dataset.s1Task;
    document.querySelectorAll("[data-s1-task]").forEach((b) => b.classList.toggle("is-active", b === btn));
    render();
  });

  document.getElementById("s1-mode-btns").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-s1-mode]");
    if (!btn) return;
    mode = btn.dataset.s1Mode;
    document.querySelectorAll("[data-s1-mode]").forEach((b) => b.classList.toggle("is-active", b === btn));
    render();
  });

  render();
}

/* ==================== 02 四种分屏关系与中缝语法 ==================== */
const S2_ARCHS = {
  vs: {
    badge: "50:50 SYMMETRY",
    title: "50:50 双极入口（VS）",
    desc: "左右严格等分、明暗强烈反转，用于呈现同等重要的两条路径或优劣正反。中缝骑跨圆形 VS 标记，把对立变成有结构的比较。",
    code: `.split-vs {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n}\n@media (max-width: 768px) {\n  .split-vs { grid-template-columns: 1fr; }\n}`,
    tip: "要点：两侧标题字号、行高与要点条数保持一致，避免一方显得草率。",
  },
  and: {
    badge: "42:58 ASYMMETRIC DIALOGUE",
    title: "非对称图文对仗（&）",
    desc: "当一侧是强视觉隐喻（如自然山树插画）、另一侧是理性文字与产品说明时，42:58 或 45:55 让视觉与文本各得其所，同时仍保持双屏对话张力。",
    code: `.split-and {\n  display: grid;\n  grid-template-columns: minmax(280px, 42%) 1fr;\n  align-items: stretch;\n}`,
    tip: "要点：窄侧不可跌破 35%，否则分屏张力会塌缩成普通侧边栏。",
  },
  sticky: {
    badge: "STICKY VISUAL + SCROLLING STORY",
    title: "固屏 + 滚屏叙事（Sticky Split）",
    desc: "一侧用 position: sticky 钉住核心视觉或章节标题，另一侧自由纵向滚动多段故事。这是现代长篇专题页里最常见的分屏演化形态——在示例里上下滚动试试看。",
    code: `.split-sticky {\n  display: grid;\n  grid-template-columns: 44% 56%;\n  align-items: start; /* 关键：勿默认 stretch */\n}\n.sticky-pane { position: sticky; top: 0; }`,
    tip: "避坑（W3C css-position-3）：Grid/Flex 子项默认 stretch 会让 sticky 失效，必须配 align-items: start。",
  },
  curtain: {
    badge: "CO-LOCATED BEFORE / AFTER",
    title: "同位前后拉帘（Before / After）",
    desc: "把两张同尺寸画面重叠在同一画框内，用可拖动的垂直中缝作为光学刀口，适合修图前后、界面改版或明暗主题切换对比。",
    code: `.before-layer {\n  position: absolute;\n  inset: 0;\n  clip-path: inset(0 calc(100% - var(--cut)) 0 0);\n}`,
    tip: "要点：拉帘中缝必须配高对比边界线与明确抓手，且支持键盘方向键操作。",
  },
};

function initSection02() {
  const demo = document.getElementById("s2-demo");
  const badge = document.getElementById("s2-badge");
  const title = document.getElementById("s2-title");
  const desc = document.getElementById("s2-desc");
  const code = document.getElementById("s2-code");
  const tip = document.getElementById("s2-tip");
  let active = "vs";

  function render() {
    const d = S2_ARCHS[active];
    badge.textContent = d.badge;
    title.textContent = d.title;
    desc.textContent = d.desc;
    code.textContent = d.code;
    tip.textContent = d.tip;

    if (active === "vs") {
      demo.innerHTML = `
        <div class="s2-mini-split">
          <div class="s2-m-left">
            <div><strong style="color:#BEEB4B;font-size:18px;">优势</strong><p style="margin:6px 0 0;font-size:13px;color:#D4D7CE;">效率提升 · 目标明确 · 协作顺畅</p></div>
            <span style="font-family:var(--f-mono);font-size:12px;color:#BEEB4B;">50% · #0F0F0F</span>
          </div>
          <div class="s1-bridge-dot" aria-hidden="true">VS</div>
          <div class="s2-m-right">
            <div><strong style="font-size:18px;">挑战</strong><p style="margin:6px 0 0;font-size:13px;color:#343632;">时间压力 · 资源限制 · 不确定性</p></div>
            <span style="font-family:var(--f-mono);font-size:12px;color:#343632;">50% · #D6D6D6</span>
          </div>
        </div>`;
    } else if (active === "and") {
      demo.innerHTML = `
        <div class="s2-mini-split is-asym">
          <div class="s2-m-left">
            <div><strong style="color:#BEEB4B;font-size:18px;">自然 NATURE</strong><p style="margin:6px 0 0;font-size:13px;color:#D4D7CE;">有机秩序 · 生命与平衡</p></div>
            <svg viewBox="0 0 180 68" width="100%" aria-hidden="true">
              <circle cx="38" cy="22" r="14" fill="#BEEB4B"/>
              <path d="M0 68V48Q55 24 108 54T180 44V68Z" fill="#BEEB4B"/>
            </svg>
          </div>
          <div class="s1-bridge-dot" style="left:42%" aria-hidden="true">&amp;</div>
          <div class="s2-m-right">
            <div><strong style="font-size:18px;">设计 DESIGN</strong><p style="margin:6px 0 0;font-size:13px;color:#343632;">以理性思维优化功能与体验，让美好自然融入生活。58% 的空间让正文从容展开。</p></div>
            <svg viewBox="0 0 220 68" width="100%" aria-hidden="true">
              <rect x="26" y="18" width="46" height="46" fill="#0F0F0F"/>
              <circle cx="49" cy="40" r="10" fill="#D6D6D6"/>
              <rect x="72" y="10" width="38" height="54" fill="#6F716B"/>
              <rect x="110" y="28" width="42" height="36" fill="#9DA098"/>
              <rect x="0" y="62" width="220" height="6" fill="#0F0F0F"/>
            </svg>
          </div>
        </div>`;
    } else if (active === "sticky") {
      demo.innerHTML = `
        <div class="s2-sticky-box" id="s2-sticky-box">
          <div class="s2-sticky-left">
            <div>
              <span style="font-family:var(--f-mono);font-size:11.5px;color:#BEEB4B;" id="s2-sticky-pct">POSITION: STICKY · 0%</span>
              <h4 style="margin:8px 0 6px;font-size:18px;">一侧视觉钉住不动</h4>
              <p style="margin:0;font-size:12.5px;color:#C8CBC2;">滚读旁边章节时，品牌主视角始终稳在视野内。</p>
            </div>
            <button type="button" class="btn-primary" id="s2-scroll-next" style="align-self:flex-start;">滚动下一章 ↓</button>
          </div>
          <div class="s2-sticky-right">
            <div class="s2-chapter"><strong>01 / 开场定位</strong><p>先用极性底色锁住受众注意力，一侧固定产品外观或核心主张，避免滚读时丢失全局锚点。</p></div>
            <div class="s2-chapter"><strong>02 / 细节拆解</strong><p>旁边逐段展开参数与使用场景，读者不必向上翻回主图核对关键形态。</p></div>
            <div class="s2-chapter"><strong>03 / 结构印证</strong><p>同一视野里对照文字论证与固定基准画面，维持连续上下文，降低跳转记忆负担。</p></div>
            <div class="s2-chapter"><strong>04 / 边界说明</strong><p>在窄屏断点自动解除固定、回归纵向流式排布，避免小屏被锁死半截画面。</p></div>
            <div class="s2-chapter"><strong>05 / 收束转化</strong><p>滚至文末出现清晰行动入口，整段叙事顺势落地。</p></div>
          </div>
        </div>`;
      const box = document.getElementById("s2-sticky-box");
      const nextBtn = document.getElementById("s2-scroll-next");
      const pctEl = document.getElementById("s2-sticky-pct");
      const syncSticky = () => {
        const max = Math.max(1, box.scrollHeight - box.clientHeight);
        const pct = Math.min(100, Math.round((box.scrollTop / max) * 100));
        if (pctEl) pctEl.textContent = `POSITION: STICKY · ${pct}%`;
        if (nextBtn) nextBtn.textContent = pct >= 95 ? "回到第一章 ↑" : "滚动下一章 ↓";
      };
      if (box) box.addEventListener("scroll", syncSticky, { passive: true });
      if (box && nextBtn) {
        nextBtn.addEventListener("click", () => {
          const max = Math.max(1, box.scrollHeight - box.clientHeight);
          box.scrollTop = box.scrollTop >= max - 8 ? 0 : Math.min(max, box.scrollTop + 110);
          syncSticky();
        });
      }
    } else {
      demo.innerHTML = `
        <div class="s2-curtain-wrap">
          <div class="s2-curtain-stage">
            <div class="s2-curtain-after">
              <span style="font-family:var(--f-mono);font-size:11.5px;font-weight:700;">AFTER · 极性分明</span>
              <div><strong style="font-size:20px;">浅灰亮面承托理性说明</strong><p style="margin:6px 0 0;font-size:13px;">拖动下方拉帘滑块，观察光学刀口在两种状态间扫过。</p></div>
            </div>
            <div class="s2-curtain-before" id="s2-curtain-before">
              <span style="font-family:var(--f-mono);font-size:11.5px;color:#BEEB4B;">BEFORE · 深黑主境</span>
              <div><strong style="font-size:20px;color:#BEEB4B;">纯黑底面凸显高光焦点</strong><p style="margin:6px 0 0;font-size:13px;color:#D5D8CF;">同位像素一一对齐，适合界面改版与前后状态校验。</p></div>
            </div>
            <div class="s2-curtain-line" id="s2-curtain-line"></div>
          </div>
          <label class="s2-curtain-bar" for="s2-curtain-range">
            <span>拉帘位置</span>
            <input type="range" id="s2-curtain-range" min="15" max="85" value="50">
            <span class="mono-val" id="s2-curtain-val">50%</span>
          </label>
        </div>`;
      const rng = document.getElementById("s2-curtain-range");
      const before = document.getElementById("s2-curtain-before");
      const line = document.getElementById("s2-curtain-line");
      const val = document.getElementById("s2-curtain-val");
      rng.addEventListener("input", () => {
        const v = rng.value;
        before.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
        line.style.left = `${v}%`;
        val.textContent = `${v}%`;
      });
    }
  }

  document.getElementById("s2-tabs").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-arch]");
    if (!btn) return;
    active = btn.dataset.arch;
    document.querySelectorAll("[data-arch]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    render();
  });

  render();
}

/* ==================== 03 反差的度：底色矩阵 + 双 CTA 检测 ==================== */
const S3_PAIRS = {
  bw: {
    lBg: "#0F0F0F", lFg: "#F4F5F1", lName: "纯黑 #0F0F0F",
    rBg: "#D6D6D6", rFg: "#0F0F0F", rName: "浅灰 #D6D6D6",
    verdict: "稳健双极：明暗落差大且零色相刺眼，正文对比度双侧均超过 13:1。",
    ok: true,
  },
  bl: {
    lBg: "#0F0F0F", lFg: "#BEEB4B", lName: "纯黑 #0F0F0F",
    rBg: "#BEEB4B", rFg: "#0F0F0F", rName: "酸绿 #BEEB4B",
    verdict: "高能极性：酸青绿只铺一侧，由纯黑承托降噪，适合强宣言与品牌首屏。",
    ok: true,
  },
  clash: {
    lBg: "#BEEB4B", lFg: "#0F0F0F", lName: "酸绿 #BEEB4B",
    rBg: "#FF6B2B", rFg: "#0F0F0F", rName: "亮橙 #FF6B2B",
    verdict: "双高饱和互炸：两块高彩度亮面紧贴，亮度反差仅 2.0:1，眼睛无处落脚。",
    ok: false,
  },
  flat: {
    lBg: "#444542", lFg: "#F4F5F1", lName: "炭灰 #444542",
    rBg: "#52534F", rFg: "#F4F5F1", rName: "中灰 #52534F",
    verdict: "同灰糊死：两屏亮度反差仅 1.2:1，分屏边界几乎消失，像两块没调准的灰板。",
    ok: false,
  },
};

function initSection03() {
  const board = document.getElementById("s3-board");
  const metrics = document.getElementById("s3-metrics");
  let pairKey = "bw";
  let ctaMode = "balanced";

  function render() {
    const p = S3_PAIRS[pairKey];
    const seamRatio = contrastRatio(p.lBg, p.rBg);
    const lTextRatio = contrastRatio(p.lBg, p.lFg);
    const rTextRatio = contrastRatio(p.rBg, p.rFg);
    const ctaOk = ctaMode === "balanced";

    const leftBtnStyle = `background:${p.lFg};color:${p.lBg};border-color:${p.lFg};`;
    const rightBtnStyle = ctaOk
      ? `background:transparent;color:${p.rFg};border-color:${p.rFg};`
      : `background:${p.rFg};color:${p.rBg};border-color:${p.rFg};`;

    board.innerHTML = `
      <div class="s3-pane" style="background:${p.lBg};color:${p.lFg};">
        <span style="font-family:var(--f-mono);font-size:11.5px;">${p.lName}</span>
        <h3>方案 A · 核心推荐</h3>
        <p>把主要视觉重心锚定在一侧，保持简短有力的标题与清晰行动入口。</p>
        <span class="s3-cta-demo" style="${leftBtnStyle}">立即开始（主按钮）</span>
      </div>
      <div class="s3-pane" style="background:${p.rBg};color:${p.rFg};">
        <span style="font-family:var(--f-mono);font-size:11.5px;">${p.rName}</span>
        <h3>方案 B · 对照选项</h3>
        <p>${ctaOk ? "改用描边次级按钮，主次顺序一眼分明，读者不必原地犹豫。" : "两侧同时挂满实心强主按钮，形成两极互相争抢点击的拉锯。"}</p>
        <span class="s3-cta-demo" style="${rightBtnStyle}">${ctaOk ? "了解更多（次按钮）" : "立即预约（同级抢焦）"}</span>
      </div>`;

    metrics.innerHTML = `
      <div class="s3-stat">
        <span>两屏底色反差</span>
        <strong class="${p.ok ? "is-ok" : "is-bad"}">${seamRatio.toFixed(1)}:1 · ${p.ok ? "分区清晰" : "反差失当"}</strong>
      </div>
      <div class="s3-stat">
        <span>双侧正文 WCAG 对比度</span>
        <strong class="${lTextRatio >= 4.5 && rTextRatio >= 4.5 ? "is-ok" : "is-bad"}">左 ${lTextRatio.toFixed(1)}:1 / 右 ${rTextRatio.toFixed(1)}:1</strong>
      </div>
      <div class="s3-stat">
        <span>决策注意力分配</span>
        <strong class="${p.ok && ctaOk ? "is-ok" : "is-bad"}">${!p.ok ? p.verdict : ctaOk ? "一主一次 · 视线顺畅收敛" : "双实心 CTA 抢焦 · 决策迟疑"}</strong>
      </div>`;
  }

  document.getElementById("s3-pair-btns").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pair]");
    if (!btn) return;
    pairKey = btn.dataset.pair;
    document.querySelectorAll("[data-pair]").forEach((b) => b.classList.toggle("is-active", b === btn));
    render();
  });

  document.getElementById("s3-cta-btns").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cta]");
    if (!btn) return;
    ctaMode = btn.dataset.cta;
    document.querySelectorAll("[data-cta]").forEach((b) => b.classList.toggle("is-active", b === btn));
    render();
  });

  render();
}

/* ==================== 04 历史四纪元铰链展板 ==================== */
const S4_ERAS = [
  {
    title: "中世纪铰链双联画：用一条中缝让两界对话",
    body: "约 1395–1399 年创作的《威尔顿双联画》（The Wilton Diptych，现藏伦敦国家美术馆，编号 NG4451）由两块橡木板通过金属铰链相连。左板画跪拜祈祷的英王理查二世，右板画圣母与天使群像——两块板色彩与氛围各自独立，却借中缝朝向彼此，确立了西方视觉文化中「双板并置对话」的原型。",
    src: "核实来源：伦敦国家美术馆藏品档案（NG4451）",
    svg: `<svg viewBox="0 0 360 180" aria-label="双联画铰链双板结构图">
      <rect x="26" y="20" width="144" height="140" fill="#1A1B18" stroke="#BEEB4B" stroke-width="2"/>
      <rect x="190" y="20" width="144" height="140" fill="#D6D6D6" stroke="#BEEB4B" stroke-width="2"/>
      <line x1="180" y1="14" x2="180" y2="166" stroke="#BEEB4B" stroke-width="2" stroke-dasharray="5 4"/>
      <rect x="172" y="48" width="16" height="10" fill="#BEEB4B"/>
      <rect x="172" y="122" width="16" height="10" fill="#BEEB4B"/>
      <circle cx="98" cy="88" r="24" fill="#BEEB4B"/>
      <circle cx="262" cy="88" r="24" fill="#0F0F0F"/>
      <text x="98" y="142" fill="#E6E8E2" font-size="11" text-anchor="middle" font-family="DM Mono, monospace">PANEL I</text>
      <text x="262" y="142" fill="#0F0F0F" font-size="11" text-anchor="middle" font-family="DM Mono, monospace">PANEL II</text>
    </svg>`,
  },
  {
    title: "1913 默片《悬疑》：同帧切分制造时间张力",
    body: "1913 年，电影先驱洛伊斯·韦伯（Lois Weber）与菲利普斯·斯莫利联合执导默片短片《悬疑》（Suspense，2020 年入选美国国会图书馆国家影片登记表）。片中把银幕切分成多块画格，同一瞬间同步呈现屋内的妻子、门外的闯入者与赶回救援的丈夫，把分屏从静态并列推进到了「同时发生的戏剧张力」。",
    src: "核实来源：美国国会图书馆国家影片登记表（2020 年入选名录）",
    svg: `<svg viewBox="0 0 360 180" aria-label="1913 默片多格分屏结构图">
      <rect x="24" y="18" width="312" height="144" fill="#181917" stroke="#5A5C56" stroke-width="2"/>
      <polygon points="24,18 180,90 24,162" fill="#0F0F0F" stroke="#BEEB4B" stroke-width="2"/>
      <polygon points="336,18 180,90 336,162" fill="#3D3E3B" stroke="#BEEB4B" stroke-width="2"/>
      <polygon points="24,18 336,18 180,90" fill="#D6D6D6" stroke="#BEEB4B" stroke-width="2"/>
      <text x="180" y="54" fill="#0F0F0F" font-size="11" font-weight="700" text-anchor="middle" font-family="DM Mono, monospace">ACTION A · SIMULTANEOUS</text>
      <text x="72" y="94" fill="#BEEB4B" font-size="11" text-anchor="middle" font-family="DM Mono, monospace">SCENE B</text>
      <text x="288" y="94" fill="#F4F5F1" font-size="11" text-anchor="middle" font-family="DM Mono, monospace">SCENE C</text>
    </svg>`,
  },
  {
    title: "1968「演示之母」：计算机屏幕首次动态分窗",
    body: "1968 年 12 月 9 日，道格拉斯·恩格尔巴特（Douglas Engelbart）在旧金山秋季联合计算机会议上演示 NLS（oN-Line System），不仅首次公开展示鼠标，还在同一块屏幕上水平与垂直切分出多个独立视窗，让使用者同时对照文档不同段落并接入远程协作画面。",
    src: "核实来源：Doug Engelbart Institute · The 1968 Demo 档案",
    svg: `<svg viewBox="0 0 360 180" aria-label="1968 NLS 动态分屏视窗图">
      <rect x="24" y="18" width="312" height="144" fill="#0F0F0F" stroke="#BEEB4B" stroke-width="2"/>
      <line x1="184" y1="18" x2="184" y2="162" stroke="#BEEB4B" stroke-width="2"/>
      <line x1="184" y1="90" x2="336" y2="90" stroke="#BEEB4B" stroke-width="1.5" stroke-dasharray="4 3"/>
      <text x="42" y="46" fill="#BEEB4B" font-size="11" font-family="DM Mono, monospace">VIEW 1 · OUTLINE</text>
      <line x1="42" y1="62" x2="160" y2="62" stroke="#6E7268" stroke-width="3"/>
      <line x1="42" y1="78" x2="142" y2="78" stroke="#6E7268" stroke-width="3"/>
      <line x1="42" y1="94" x2="152" y2="94" stroke="#6E7268" stroke-width="3"/>
      <text x="200" y="46" fill="#F4F5F1" font-size="11" font-family="DM Mono, monospace">VIEW 2 · DETAIL</text>
      <text x="200" y="118" fill="#BEEB4B" font-size="11" font-family="DM Mono, monospace">VIEW 3 · SHARED</text>
    </svg>`,
  },
  {
    title: "2017–2018 原生 CSS：告别 float 等高 hack",
    body: "早期网页做 50:50 等高分屏要靠 float、table-cell 与繁琐的清除浮动；直到 W3C 的 CSS Grid Level 1（2017 年 2 月进入候选推荐，同年主流浏览器同步实装）、CSS Flexbox Level 1（2018 年候选推荐）和 CSS Positioned Layout Level 3 的 position: sticky 普及，网页才能用几行原生规则做到桌面双极锁屏、窄屏顺滑折叠。",
    src: "核实来源：W3C CSS Grid Level 1 / Flexbox Level 1 / CSS Position Level 3 规范",
    svg: `<svg viewBox="0 0 360 180" aria-label="现代响应式 CSS Grid 分屏与折叠图">
      <rect x="20" y="24" width="206" height="132" fill="#0F0F0F" stroke="#BEEB4B" stroke-width="2"/>
      <rect x="123" y="24" width="103" height="132" fill="#D6D6D6"/>
      <line x1="123" y1="24" x2="123" y2="156" stroke="#BEEB4B" stroke-width="2" stroke-dasharray="5 4"/>
      <text x="72" y="94" fill="#BEEB4B" font-size="12" font-weight="700" text-anchor="middle" font-family="DM Mono, monospace">1fr</text>
      <text x="174" y="94" fill="#0F0F0F" font-size="12" font-weight="700" text-anchor="middle" font-family="DM Mono, monospace">1fr</text>
      <text x="246" y="94" fill="#BEEB4B" font-size="16" text-anchor="middle">→</text>
      <rect x="268" y="24" width="72" height="66" fill="#0F0F0F" stroke="#BEEB4B" stroke-width="2"/>
      <rect x="268" y="90" width="72" height="66" fill="#D6D6D6" stroke="#BEEB4B" stroke-width="2"/>
      <text x="304" y="61" fill="#BEEB4B" font-size="10.5" text-anchor="middle" font-family="DM Mono, monospace">TOP</text>
      <text x="304" y="128" fill="#0F0F0F" font-size="10.5" text-anchor="middle" font-family="DM Mono, monospace">BOT</text>
    </svg>`,
  },
];

function initSection04() {
  const panel = document.getElementById("s4-panel");
  let idx = 0;

  function render() {
    const e = S4_ERAS[idx];
    panel.innerHTML = `
      <div class="era-svg-box">${e.svg}</div>
      <div class="era-copy">
        <h3>${e.title}</h3>
        <p>${e.body}</p>
        <div class="era-src">${e.src}</div>
      </div>`;
  }

  document.getElementById("s4-rail").addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-era]");
    if (!btn) return;
    idx = Number(btn.dataset.era);
    document.querySelectorAll("[data-era]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    render();
  });

  render();
}

/* ==================== 05 响应式断点拉尺 ==================== */
function initSection05() {
  const preview = document.getElementById("s5-preview");
  const status = document.getElementById("s5-status");
  const valEl = document.getElementById("s5-width-val");

  // 把滑块插入 s5-top 下方，保持清晰全宽拖拽
  const topEl = document.querySelector(".s5-top");
  const rangeWrap = document.createElement("div");
  rangeWrap.className = "s5-range-row";
  rangeWrap.innerHTML = `<input type="range" id="s5-width-range" min="360" max="1440" step="10" value="1200" aria-label="模拟视口宽度">`;
  topEl.after(rangeWrap);

  const range = document.getElementById("s5-width-range");
  let strategy = "responsive";

  function render() {
    const w = Number(range.value);
    valEl.textContent = `${w}px`;
    const isNarrow = w < 768;
    const stacked = isNarrow && strategy === "responsive";
    const paneW = stacked ? w : Math.round(w / 2);
    const chars = Math.max(5, Math.floor((paneW - 44) / 15));

    // 将 360–1440px 按比例映射进容器宽（最小 230px，最大 100%）
    const pct = Math.round(((w - 360) / (1440 - 360)) * 72 + 28);
    preview.style.maxWidth = `${pct}%`;

    preview.innerHTML = `
      <div style="display:grid;grid-template-columns:${stacked ? "1fr" : "1fr 1fr"};">
        <div style="background:#0F0F0F;color:#F4F5F1;padding:${paneW < 230 ? 10 : 18}px;">
          <strong style="color:#BEEB4B;font-size:${paneW < 230 ? 14 : 17}px;">优势 STRENGTHS</strong>
          <p style="margin:6px 0 0;font-size:${paneW < 230 ? 12 : 13.5}px;line-height:1.5;">左右清晰分区，把两套要点放进同一视野对照。</p>
        </div>
        <div style="background:#D6D6D6;color:#0F0F0F;padding:${paneW < 230 ? 10 : 18}px;border-top:${stacked ? "2px dashed #BEEB4B" : "none"};">
          <strong style="font-size:${paneW < 230 ? 14 : 17}px;">挑战 CHALLENGES</strong>
          <p style="margin:6px 0 0;font-size:${paneW < 230 ? 12 : 13.5}px;line-height:1.5;">当半屏宽度缩窄，正文会被迅速挤成竖条。</p>
        </div>
      </div>`;

    if (isNarrow && !stacked) {
      status.className = "s5-status is-err";
      status.textContent = `× 视口 ${w}px 死撑左右分屏：单侧只剩 ${paneW}px（每行仅约 ${chars} 字），文字被迫频繁断行，阅读效率骤降。`;
    } else if (stacked) {
      status.className = "s5-status is-ok";
      status.textContent = `✓ 视口 ${w}px 跨过 768px 断点自动折叠为上下双层：单屏完整保有 ${paneW}px（约 ${chars} 字/行），黑灰极性与虚线分界依旧成立。`;
    } else {
      status.className = "s5-status is-ok";
      status.textContent = `✓ 桌面视口 ${w}px 采用 50:50 左右分屏：单侧 ${paneW}px（约 ${chars} 字/行），并行对照从容舒展。`;
    }
  }

  range.addEventListener("input", render);
  document.getElementById("s5-strategy-btns").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-s5-strat]");
    if (!btn) return;
    strategy = btn.dataset.s5Strat;
    document.querySelectorAll("[data-s5-strat]").forEach((b) => b.classList.toggle("is-active", b === btn));
    render();
  });
  render();
}

/* ==================== 06 单变量小练习 ==================== */
const QUIZ_OPTIONS = [
  {
    letter: "A",
    meta: "比例 50:50 · 底色 #464644 / #50504E · 中缝 VS 齐行 · 每侧 3 条",
    ok: false,
    title: "A 版不对：只有底色反差不足（1.15:1）",
    reason: "比例、中缝对齐与要点数量都过关，但左右底色落在相邻炭灰上，亮度对比仅 1.15:1。两套方案糊在一片灰里，读者看不出清晰的阵营划分。",
    svg: `<svg class="quiz-svg" viewBox="0 0 220 120" aria-hidden="true">
      <rect x="0" y="0" width="110" height="120" fill="#464644"/>
      <rect x="110" y="0" width="110" height="120" fill="#50504E"/>
      <line x1="110" y1="0" x2="110" y2="120" stroke="#BEEB4B" stroke-dasharray="4 3"/>
      <circle cx="110" cy="60" r="13" fill="#0F0F0F" stroke="#F4F5F1"/>
      <text x="110" y="64" fill="#BEEB4B" font-size="9" font-weight="700" text-anchor="middle" font-family="Unbounded, sans-serif">VS</text>
      <rect x="14" y="20" width="54" height="8" fill="#E6E8E2"/><rect x="14" y="42" width="76" height="5" fill="#C4C8BE"/><rect x="14" y="58" width="68" height="5" fill="#C4C8BE"/><rect x="14" y="74" width="72" height="5" fill="#C4C8BE"/>
      <rect x="128" y="20" width="54" height="8" fill="#E6E8E2"/><rect x="128" y="42" width="74" height="5" fill="#C4C8BE"/><rect x="128" y="58" width="66" height="5" fill="#C4C8BE"/><rect x="128" y="74" width="70" height="5" fill="#C4C8BE"/>
    </svg>`,
  },
  {
    letter: "B",
    meta: "比例 50:50 · 底色 #0F0F0F / #D6D6D6 · 中缝 VS 齐行 · 每侧 3 条",
    ok: true,
    title: "选对了！B 版四维同时成立",
    reason: "纯黑与浅灰构成 13.2:1 明确极性反差，50:50 让两个定价方案势均力敌，VS 桥接与齐行锚点支持横向速读，每侧收敛在 3 条核心差异内留足呼吸空间。",
    svg: `<svg class="quiz-svg" viewBox="0 0 220 120" aria-hidden="true">
      <rect x="0" y="0" width="110" height="120" fill="#0F0F0F"/>
      <rect x="110" y="0" width="110" height="120" fill="#D6D6D6"/>
      <line x1="110" y1="0" x2="110" y2="120" stroke="#BEEB4B" stroke-dasharray="4 3"/>
      <circle cx="110" cy="60" r="13" fill="#0F0F0F" stroke="#F4F5F1"/>
      <text x="110" y="64" fill="#BEEB4B" font-size="9" font-weight="700" text-anchor="middle" font-family="Unbounded, sans-serif">VS</text>
      <rect x="14" y="20" width="54" height="8" fill="#BEEB4B"/><rect x="14" y="42" width="76" height="5" fill="#D4D7CE"/><rect x="14" y="58" width="68" height="5" fill="#D4D7CE"/><rect x="14" y="74" width="72" height="5" fill="#D4D7CE"/>
      <rect x="128" y="20" width="54" height="8" fill="#0F0F0F"/><rect x="128" y="42" width="74" height="5" fill="#3A3D37"/><rect x="128" y="58" width="66" height="5" fill="#3A3D37"/><rect x="128" y="74" width="70" height="5" fill="#3A3D37"/>
    </svg>`,
  },
  {
    letter: "C",
    meta: "比例 76:24 · 底色 #0F0F0F / #D6D6D6 · 中缝 VS 齐行 · 每侧 3 条",
    ok: false,
    title: "C 版不对：只有分屏比例极偏（76:24）",
    reason: "极性反差、桥接与条数都没错，但左屏吞掉 76%，右侧企业版被压成 24% 窄缝（1280px 下仅 307px 含边距），平等对比退化成单边压制。",
    svg: `<svg class="quiz-svg" viewBox="0 0 220 120" aria-hidden="true">
      <rect x="0" y="0" width="167" height="120" fill="#0F0F0F"/>
      <rect x="167" y="0" width="53" height="120" fill="#D6D6D6"/>
      <line x1="167" y1="0" x2="167" y2="120" stroke="#BEEB4B" stroke-dasharray="4 3"/>
      <circle cx="167" cy="60" r="13" fill="#0F0F0F" stroke="#F4F5F1"/>
      <text x="167" y="64" fill="#BEEB4B" font-size="9" font-weight="700" text-anchor="middle" font-family="Unbounded, sans-serif">VS</text>
      <rect x="14" y="20" width="72" height="8" fill="#BEEB4B"/><rect x="14" y="42" width="120" height="5" fill="#D4D7CE"/><rect x="14" y="58" width="110" height="5" fill="#D4D7CE"/><rect x="14" y="74" width="115" height="5" fill="#D4D7CE"/>
      <rect x="176" y="20" width="32" height="8" fill="#0F0F0F"/><rect x="176" y="42" width="34" height="5" fill="#3A3D37"/><rect x="176" y="58" width="30" height="5" fill="#3A3D37"/><rect x="176" y="74" width="32" height="5" fill="#3A3D37"/>
    </svg>`,
  },
  {
    letter: "D",
    meta: "比例 50:50 · 底色 #0F0F0F / #D6D6D6 · 中缝 VS 齐行 · 每侧 9 条",
    ok: false,
    title: "D 版不对：只有半屏信息严重过载（每侧 9 条）",
    reason: "黑灰反差、50:50 与桥接都没问题，但半屏只有整屏一半宽，两侧同时密排 9 条细则把留白挤压殆尽，失去首屏一眼定夺的清晰感（多细则应转交完整对比表）。",
    svg: `<svg class="quiz-svg" viewBox="0 0 220 120" aria-hidden="true">
      <rect x="0" y="0" width="110" height="120" fill="#0F0F0F"/>
      <rect x="110" y="0" width="110" height="120" fill="#D6D6D6"/>
      <line x1="110" y1="0" x2="110" y2="120" stroke="#BEEB4B" stroke-dasharray="4 3"/>
      <circle cx="110" cy="60" r="13" fill="#0F0F0F" stroke="#F4F5F1"/>
      <text x="110" y="64" fill="#BEEB4B" font-size="9" font-weight="700" text-anchor="middle" font-family="Unbounded, sans-serif">VS</text>
      <rect x="12" y="10" width="52" height="7" fill="#BEEB4B"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="12" y="${24 + i * 10}" width="${78 - (i % 3) * 8}" height="4" fill="#B5B8AE"/>`).join("")}
      <rect x="126" y="10" width="52" height="7" fill="#0F0F0F"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="126" y="${24 + i * 10}" width="${78 - (i % 3) * 8}" height="4" fill="#3A3D37"/>`).join("")}
    </svg>`,
  },
];

function initSection06() {
  const grid = document.getElementById("quiz-grid");
  const fb = document.getElementById("quiz-feedback");

  grid.innerHTML = QUIZ_OPTIONS.map(
    (opt) => `
      <button type="button" class="quiz-card" data-quiz="${opt.letter}">
        <div class="quiz-head">
          <span class="quiz-letter">${opt.letter}</span>
        </div>
        ${opt.svg}
        <span class="quiz-meta">${opt.meta}</span>
      </button>`
  ).join("");

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-quiz]");
    if (!btn) return;
    const picked = QUIZ_OPTIONS.find((o) => o.letter === btn.dataset.quiz);
    if (!picked) return;
    grid.querySelectorAll(".quiz-card").forEach((c) => c.classList.remove("is-picked-ok", "is-picked-bad"));
    btn.classList.add(picked.ok ? "is-picked-ok" : "is-picked-bad");
    fb.classList.toggle("is-bad", !picked.ok);
    fb.innerHTML = `<h3 class="qf-title">${picked.title}</h3><p class="qf-body">${picked.reason}</p>`;
  });
}

/* ==================== 07 原海报灯箱（放大/滚轮/拖拽/Esc） ==================== */
function initPosterLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const lbZoom = document.getElementById("lb-zoom");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbZoom.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    document.getElementById("lb-close").focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  document.getElementById("lb-close").addEventListener("click", close);
  document.getElementById("lb-in").addEventListener("click", () => {
    scale = Math.min(3.5, scale + 0.35);
    applyTransform();
  });
  document.getElementById("lb-out").addEventListener("click", () => {
    scale = Math.max(0.75, scale - 0.35);
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  document.getElementById("lb-reset").addEventListener("click", () => {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.75, Math.min(3.5, scale + (e.deltaY < 0 ? 0.2 : -0.2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage && scale <= 1) {
      close();
      return;
    }
    panning = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  lbStage.addEventListener("pointerup", () => { panning = false; });
  lbStage.addEventListener("pointercancel", () => { panning = false; });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

export function initSections() {
  initSection01();
  initSection02();
  initSection03();
  initSection04();
  initSection05();
  initSection06();
  initPosterLightbox();
}

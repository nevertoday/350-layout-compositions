// 086 深空间构图 · 正文七节独立交互模块（相邻两节绝不重复同一控件）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, lerp } from "./model.js";

// =========================================================================
// 01 节：四层可剥离透明版画叠片器（Acetate Layer Peel Stack）
// =========================================================================
export function initSection01Peel() {
  const host = document.getElementById("peel-stage");
  const readout = document.getElementById("peel-readout");
  const modeBtn = document.getElementById("peel-explode-btn");
  const toggles = [...document.querySelectorAll("[data-peel-layer]")];
  if (!host || !toggles.length) return;

  const active = { fg: true, frames: true, guide: true, scale: true };
  let exploded = true;

  function describeCombo() {
    const n = Object.values(active).filter(Boolean).length;
    if (n === 4) {
      return {
        tag: "4/4 完整纵深",
        title: "四重深度线索咬合，纸面被彻底凿通",
        body: "前景暗叶先立住最近的零点，四道嵌套青门切出中段步阶，阶梯引线把眼睛拽进光口，远端小红人完成近大远小的比例换算——即便关掉立体眼镜，大脑也会毫不犹豫地读出二三十米的通道。",
      };
    }
    if (n === 0) {
      return {
        tag: "0/4 空白画布",
        title: "四层全部剥离，只剩一张平坦的暖米宣纸",
        body: "没有遮挡、框架、引线与尺度锚点时，二维画布没有任何 Z 轴信号。试着一层一层叠回去，感受哪一层最先让画面「陷进去」。",
      };
    }
    if (active.scale && !active.fg && !active.frames) {
      return {
        tag: `${n}/4 悬空贴纸感`,
        title: "只留远景与小红人，人物像贴在纸面上的剪纸",
        body: "虽然把红人画得很小，但缺少前景遮挡和中间门框作为尺度桥接，眼睛无法确认「小」是因为距离远，还是因为人物本身就矮小——这正是吉布森所说「缺连续地面与遮挡序」时的错觉。",
      };
    }
    if (active.frames && !active.fg && !active.guide) {
      return {
        tag: `${n}/4 舞台平片感`,
        title: "有了重门套叠，但还像站在剧场外看布景",
        body: "嵌套门框已经画出中后景层次，却缺少紧贴镜头的前景暗叶和地面引导路径。观者能读出「有几道门」，但缺少把身体拉进走廊的沉浸感。",
      };
    }
    if (active.fg && !active.frames) {
      return {
        tag: `${n}/4 前后断层`,
        title: "只有近景枝叶和远处背景，中间塌成一片真空",
        body: "前后的遮挡序虽然明确（叶在前、山在后），但中景缺少建筑门框过渡，视线从树叶直接跳到天边，空间显得空荡跳跃，不够连贯。",
      };
    }
    if (!active.scale) {
      return {
        tag: `${n}/4 缺尺度参照`,
        title: "走廊壳子搭好了，但观众估不出它有多宏大",
        body: "没有远端红人剪影做比例尺，这道门洞既可以是三米高的园林门，也可以是三十米高的神殿巨门。一个熟悉的人体尺度，瞬间给整条走廊标上真实尺寸。",
      };
    }
    return {
      tag: `${n}/4 局部成立`,
      title: "纵深已经浮现，补齐剩下的一层会让视线更连贯",
      body: `当前开启了 ${[
        active.fg && "前景遮挡",
        active.frames && "嵌套框架",
        active.guide && "阶梯引导线",
        active.scale && "远景尺度锚",
      ].filter(Boolean).join(" + ")}。对比一下把它叠全后的空间张力。`,
    };
  }

  function render() {
    const dx = exploded ? 60 : 0;
    const dy = exploded ? -15 : 0;
    const skew = exploded ? "skewY(-8deg)" : "none";
    const layerDefs = [
      {
        key: "scale",
        label: "04 远景与尺度层",
        tagPos: "top-left",
        idx: 0,
        svg: `
          <rect x="0" y="0" width="260" height="190" fill="#F4E6CF"/>
          <path d="M0 132 L48 92 L96 114 L148 76 L202 108 L260 88 L260 190 L0 190 Z" fill="#C7CCB8"/>
          <path d="M0 144 L66 106 L124 128 L178 96 L260 122 L260 190 L0 190 Z" fill="#9CA89C"/>
          <circle cx="122" cy="76" r="15" fill="#DE532B"/>
          <rect x="0" y="140" width="260" height="50" fill="#F7DFC3"/>
          <g fill="#D1360B">
            <circle cx="136" cy="126" r="3.4"/>
            <rect x="133" y="130" width="6" height="12" rx="1"/>
            <rect x="133.5" y="141" width="2.2" height="9"/>
            <rect x="136.5" y="141" width="2.2" height="9"/>
          </g>`,
      },
      {
        key: "guide",
        label: "03 阶梯与引导线",
        tagPos: "bottom-left",
        idx: 1,
        svg: `
          <polygon points="36,190 98,140 162,140 224,190" fill="rgba(247,223,195,0.68)"/>
          <line x1="36" y1="190" x2="98" y2="140" stroke="#7A8D84" stroke-width="1.5"/>
          <line x1="224" y1="190" x2="162" y2="140" stroke="#7A8D84" stroke-width="1.5"/>
          <line x1="68" y1="166" x2="192" y2="166" stroke="#B7A489" stroke-width="1"/>
          <line x1="84" y1="152" x2="176" y2="152" stroke="#B7A489" stroke-width="1"/>
          <path d="M84 190 L108 171 L126 171 L136 144" fill="none" stroke="#D24322" stroke-width="2.6" stroke-dasharray="6 4"/>
          <circle cx="136" cy="144" r="3.5" fill="#D24322"/>`,
      },
      {
        key: "frames",
        label: "02 嵌套门框层",
        tagPos: "top-right",
        idx: 2,
        svg: `
          <path fill="#7A8E86" d="M68,156 V40 H192 V156 H166 V62 H94 V156 Z"/>
          <path fill="#325955" d="M40,170 V22 H220 V170 H188 V46 H72 V170 Z"/>
          <path fill="#1B4949" d="M8,190 V4 H252 V190 H214 V28 H46 V190 Z"/>`,
      },
      {
        key: "fg",
        label: "01 前景暗叶遮挡",
        tagPos: "bottom-right",
        idx: 3,
        svg: `
          <path d="M260,8 L224,26 Q192,48 214,68 Q174,88 210,112 Q188,136 226,154 L260,182 Z" fill="#0E2221"/>
          <path d="M0,108 Q36,120 22,144 Q48,160 16,184 L0,190 Z" fill="#183633"/>`,
      },
    ];

    const platesHtml = layerDefs.map((ld) => {
      const on = active[ld.key];
      const tx = (ld.idx - 1.5) * dx;
      const ty = (ld.idx - 1.5) * dy;
      const opacity = on ? 1 : 0.08;
      const transform = exploded
        ? `translate(${tx}px, ${ty}px) ${skew} scale(0.88)`
        : `translate(0px, 0px) scale(1)`;
      return `
        <div class="peel-plate ${on ? "is-on" : "is-off"}" style="transform:${transform};opacity:${opacity};z-index:${ld.idx + 1}">
          <svg viewBox="0 0 260 190" aria-hidden="true">${ld.svg}</svg>
          ${exploded ? `<span class="peel-plate-tag is-${ld.tagPos}">${ld.label}</span>` : ""}
        </div>`;
    }).join("");

    host.innerHTML = `<div class="peel-deck ${exploded ? "is-exploded" : "is-merged"}">${platesHtml}</div>`;

    toggles.forEach((btn) => {
      const k = btn.dataset.peelLayer;
      btn.setAttribute("aria-pressed", String(!!active[k]));
      btn.classList.toggle("is-active", !!active[k]);
    });
    if (modeBtn) {
      modeBtn.textContent = exploded ? "合拢为平面成品" : "展开为四层拆解";
      modeBtn.setAttribute("aria-pressed", String(exploded));
    }

    const info = describeCombo();
    if (readout) {
      readout.innerHTML = `
        <div class="peel-badge">${info.tag}</div>
        <h3 class="peel-r-title">${info.title}</h3>
        <p class="peel-r-body">${info.body}</p>`;
    }
  }

  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.peelLayer;
      active[k] = !active[k];
      render();
    });
  });

  if (modeBtn) {
    modeBtn.addEventListener("click", () => {
      exploded = !exploded;
      render();
    });
  }

  render();
}

// =========================================================================
// 02 节：四时代空间结构图谱（Historical Depth Plates）
// =========================================================================
export function initSection02History() {
  const tabs = [...document.querySelectorAll("[data-era]")];
  const plateEl = document.getElementById("era-plate");
  const captionEl = document.getElementById("era-caption");
  if (!tabs.length || !plateEl || !captionEl) return;

  const ERAS = {
    song: {
      year: "1072 / 11 世纪北宋",
      title: "郭熙《林泉高致》· 深远之法",
      latin: "GUO XI · SHENYUAN (DEEP DISTANCE)",
      note: "郭熙提出「自山前而窥山后谓之深远」，不靠西方单一消失点，而是借重重山脊遮挡、曲折云气与幽谷小径让眼睛沿游动视点穿山入壑（见台北故宫《早春图》1072、大都会艺术博物馆《树色平远图》约 1080）。",
      svg: `
        <svg viewBox="0 0 560 300" role="img" aria-label="北宋郭熙深远层叠山壑结构图">
          <rect width="560" height="300" fill="#F4E6CF"/>
          <path d="M0,195 Q95,95 190,145 T380,108 T560,152 L560,300 L0,300 Z" fill="#C9D0C4"/>
          <path d="M0,218 Q135,132 245,178 T445,138 L560,175 L560,300 L0,300 Z" fill="#8C9F96"/>
          <path d="M0,248 Q110,162 210,212 Q310,165 420,216 L560,192 L560,300 L0,300 Z" fill="#3B5E59"/>
          <path d="M0,268 Q90,218 175,260 L175,300 L0,300 Z" fill="#173837"/>
          <path d="M405,274 Q480,215 560,248 L560,300 L405,300 Z" fill="#173837"/>
          <path d="M106,274 Q225,230 284,186 Q326,154 398,124" fill="none" stroke="#D24322" stroke-width="2.4" stroke-dasharray="7 5"/>
          <circle cx="106" cy="274" r="5" fill="#D24322"/>
          <circle cx="284" cy="186" r="5" fill="#D24322"/>
          <circle cx="398" cy="124" r="6" fill="#D24322"/>
          <text x="24" y="34" font-family="DM Mono, monospace" font-size="12" fill="#1B4949">MULTI-VANTAGE LAYERING · 山前窥山后</text>
          <text x="118" y="280" font-family="Noto Serif SC, serif" font-size="12" fill="#FAF4E8">近坡</text>
          <text x="294" y="191" font-family="Noto Serif SC, serif" font-size="12" fill="#FAF4E8">中壑</text>
          <text x="410" y="128" font-family="Noto Serif SC, serif" font-size="12" fill="#1B4949">深远重峰</text>
        </svg>`,
    },
    alberti: {
      year: "1435 文艺复兴佛罗伦萨",
      title: "阿尔伯蒂《论绘画》· 敞开的透视窗",
      latin: "LEON BATTISTA ALBERTI · DE PICTURA",
      note: "1435 年拉丁文本《De pictura》（1436 意大利文本《Della pittura》）把矩形画幅比作「一扇敞开的窗」，确立视平线、单一中心消失点与逐行收窄的地砖网格，让深度首次可以用几何尺规精确推算。",
      svg: `
        <svg viewBox="0 0 560 300" role="img" aria-label="1435年阿尔伯蒂单点透视窗与地砖收敛网格">
          <rect width="560" height="300" fill="#F4E6CF"/>
          <rect x="28" y="22" width="504" height="256" fill="#FAF4E8" stroke="#1B4949" stroke-width="2.5"/>
          <line x1="28" y1="138" x2="532" y2="138" stroke="#7A8D84" stroke-width="1.2" stroke-dasharray="5 4"/>
          <!-- 地砖收束线 -->
          <g stroke="#325955" stroke-width="1.2" opacity="0.85">
            <line x1="280" y1="138" x2="28" y2="278"/>
            <line x1="280" y1="138" x2="112" y2="278"/>
            <line x1="280" y1="138" x2="196" y2="278"/>
            <line x1="280" y1="138" x2="280" y2="278"/>
            <line x1="280" y1="138" x2="364" y2="278"/>
            <line x1="280" y1="138" x2="448" y2="278"/>
            <line x1="280" y1="138" x2="532" y2="278"/>
            <line x1="280" y1="138" x2="28" y2="22"/>
            <line x1="280" y1="138" x2="532" y2="22"/>
          </g>
          <!-- 透视递密横线 -->
          <g stroke="#325955" stroke-width="1.1" opacity="0.65">
            <line x1="28" y1="242" x2="532" y2="242"/>
            <line x1="28" y1="212" x2="532" y2="212"/>
            <line x1="28" y1="188" x2="532" y2="188"/>
            <line x1="28" y1="170" x2="532" y2="170"/>
            <line x1="28" y1="156" x2="532" y2="156"/>
          </g>
          <circle cx="280" cy="138" r="7" fill="#D24322"/>
          <circle cx="280" cy="138" r="14" fill="none" stroke="#D24322" stroke-width="1.5"/>
          <text x="42" y="44" font-family="DM Mono, monospace" font-size="12" fill="#1B4949">FINESTRA APERTA · 中心消失点 VP</text>
          <text x="302" y="133" font-family="Noto Serif SC, serif" font-size="12" fill="#A62C11">灭点 / 视平线</text>
        </svg>`,
    },
    baroque: {
      year: "1631《园冶》× 1656《宫娥》",
      title: "框景借景与画室后门的亮光走廊",
      latin: "JI CHENG YUANYE & VELAZQUEZ LAS MENINAS",
      note: "1631 年计成《园冶》系统总结门洞、漏窗「框景借景」；25 年后，委拉斯开兹在《宫娥》（1656，普拉多博物馆 P001174）中用左侧巨画架压暗前景、右侧窗光与墙画领路，把灭点精准钉在最深处亮门台阶上的背影侍从霍塞·涅托身上。",
      svg: `
        <svg viewBox="0 0 560 300" role="img" aria-label="1631园冶框景与1656宫娥多重套框透视图">
          <rect width="560" height="300" fill="#1B3A39"/>
          <!-- 左半：园冶月洞框景 -->
          <rect x="20" y="20" width="250" height="260" fill="#EFE2CC"/>
          <path fill="#284B48" fill-rule="evenodd" d="M20,20 H270 V280 H20 Z M145,155 m-82,0 a82,82 0 1,0 164,0 a82,82 0 1,0 -164,0"/>
          <path fill="#5A7A73" fill-rule="evenodd" d="M62,72 H228 V238 H62 Z M145,155 m-48,0 a48,48 0 1,0 96,0 a48,48 0 1,0 -96,0"/>
          <circle cx="136" cy="134" r="11" fill="#D24322"/>
          <path d="M98,184 L132,146 L168,170 L194,154 L194,204 L98,204 Z" fill="#95A59C"/>
          <text x="34" y="42" font-family="DM Mono, monospace" font-size="11" fill="#FAF4E8">1631 园冶 · 框景</text>
          <!-- 右半：宫娥深走廊亮门 -->
          <rect x="290" y="20" width="250" height="260" fill="#2A4443"/>
          <polygon points="290,20 352,64 352,254 290,280" fill="#112222"/>
          <polygon points="540,20 468,70 468,236 540,280" fill="#3B5B57"/>
          <polygon points="352,254 468,236 540,280 290,280" fill="#CBB89D"/>
          <rect x="394" y="112" width="44" height="92" fill="#FAF0DA"/>
          <!-- 无五官侍从剪影 -->
          <circle cx="416" cy="148" r="5" fill="#172424"/>
          <rect x="411" y="154" width="10" height="28" fill="#172424"/>
          <line x1="290" y1="20" x2="416" y2="162" stroke="#FF8866" stroke-width="1.3" stroke-dasharray="5 4"/>
          <line x1="540" y1="20" x2="416" y2="162" stroke="#FF8866" stroke-width="1.3" stroke-dasharray="5 4"/>
          <line x1="540" y1="280" x2="416" y2="162" stroke="#FF8866" stroke-width="1.3" stroke-dasharray="5 4"/>
          <text x="304" y="42" font-family="DM Mono, monospace" font-size="11" fill="#FAF4E8">1656 宫娥 · 亮门灭点</text>
        </svg>`,
    },
    cinema: {
      year: "1941 电影 × 1997 波德威尔",
      title: "纵深场面调度（Staging in Depth）",
      latin: "WELLES, TOLAND & DAVID BORDWELL",
      note: "大卫·波德威尔在《电影风格史》（1997）中专门厘清：纵深调度（deep space）与深焦镜头（deep focus）是两件事。前者把前景、中景、远景同时排入戏里，把视线的剪辑权交给观众眼睛；1941 年《公民凯恩》将这一传统推向高潮。",
      svg: `
        <svg viewBox="0 0 560 300" role="img" aria-label="1941电影前景大剪影与远景窗外人物的楔形纵深调度">
          <rect width="560" height="300" fill="#112424"/>
          <!-- 楔形广角透视墙面 -->
          <polygon points="20,20 260,72 260,218 20,280" fill="#1F4240"/>
          <polygon points="540,20 356,72 356,218 540,280" fill="#2A514D"/>
          <rect x="260" y="72" width="96" height="146" fill="#FAF0DA"/>
          <!-- 远景窗外小人物（无五官剪影） -->
          <circle cx="308" cy="168" r="5" fill="#D24322"/>
          <rect x="304" y="174" width="8" height="18" fill="#D24322"/>
          <!-- 中景人物侧影 -->
          <circle cx="210" cy="134" r="14" fill="#6F8C84"/>
          <path d="M188,236 L194,152 Q210,146 226,152 L232,236 Z" fill="#6F8C84"/>
          <!-- 前景巨大人物背影（压住左前景） -->
          <circle cx="96" cy="112" r="32" fill="#071212"/>
          <path d="M36,280 L54,154 Q96,138 138,154 L158,280 Z" fill="#071212"/>
          <!-- 视线楔形连线 -->
          <path d="M96,112 L210,134 L308,172" fill="none" stroke="#FF8866" stroke-width="2" stroke-dasharray="6 4"/>
          <text x="34" y="42" font-family="DM Mono, monospace" font-size="12" fill="#8CD4C6">FG CLOSE-UP  →  MIDGROUND  →  DEEP WINDOW</text>
          <text x="58" y="266" font-family="Noto Serif SC, serif" font-size="12" fill="#FAF4E8">前景大剪影</text>
          <text x="184" y="254" font-family="Noto Serif SC, serif" font-size="12" fill="#FAF4E8">中景</text>
          <text x="278" y="100" font-family="Noto Serif SC, serif" font-size="12" fill="#A62C11">远窗焦点</text>
        </svg>`,
    },
  };

  function show(key) {
    const era = ERAS[key];
    if (!era) return;
    tabs.forEach((t) => {
      const on = t.dataset.era === key;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    plateEl.innerHTML = era.svg;
    captionEl.innerHTML = `
      <div class="era-meta"><span>${era.year}</span><span lang="en" class="era-en">${era.latin}</span></div>
      <h3 class="era-title">${era.title}</h3>
      <p class="era-note">${era.note}</p>`;
  }

  tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.era)));
  show("song");
}

// =========================================================================
// 03 节：暗室实验——20mm–135mm 滑动变焦（Dolly Zoom）纵深压缩与拉伸台
// =========================================================================
export function initSection03DollyZoom() {
  const canvas = document.getElementById("dolly-canvas");
  const slider = document.getElementById("dolly-focal");
  const focalVal = document.getElementById("dolly-focal-val");
  const camDistVal = document.getElementById("dolly-dist-val");
  const bgRatioVal = document.getElementById("dolly-ratio-val");
  const noteEl = document.getElementById("dolly-note");
  const stops = [...document.querySelectorAll("[data-focal-stop]")];
  if (!canvas || !slider) return;

  const ctx = canvas.getContext("2d");
  let focalMm = 28;
  let dirty = true;

  // 核心光学单真源：保持第一门框（基准宽 4.2m）在画幅上恒定占宽 68%，
  // 因此机位到第一门的距离 d1 与焦距 f 成正比：d1 = k * f。
  // 走廊固定物理长度 L = 18m，远门与红人位于 d2 = d1 + L，
  // 远近屏宽比 = d1 / (d1 + L)！焦距越短 d1 越小，远景显得极小极远；焦距越长 d1 越大，远景被压缩贴到门后！
  function opticalMetrics(fMm) {
    const d1 = +(fMm * 0.125).toFixed(1); // 20mm->2.5m, 50mm->6.25m, 135mm->16.9m
    const corridorLen = 18.0;
    const d2 = d1 + corridorLen;
    const farScale = d1 / d2; // 0.122 (极强纵深) .. 0.484 (长焦压扁)
    const fovDeg = Math.round((2 * Math.atan(18 / fMm) * 180) / Math.PI); // 36mm 全画幅水平半宽 18mm 对应水平/等效视角
    const ratio = +(1 / farScale).toFixed(1);
    let verdict;
    if (fMm <= 26) {
      verdict = `超广角 ${fMm}mm 逼近至 ${d1}m：前景门框保持同大，但后方 18m 走廊被狠狠拉深，前后尺度落差高达 ${ratio}×，空间张力极强，代价是边缘微畸变。`;
    } else if (fMm <= 42) {
      verdict = `广角 ${fMm}mm（机位 ${d1}m）：深空间构图的经典甜点焦段，既拉开了 ${ratio}× 的前后尺度梯度，又保持门框建筑线条克制自然。`;
    } else if (fMm <= 65) {
      verdict = `标准焦段 ${fMm}mm（机位退至 ${d1}m）：接近人眼自然透视，前后尺度比收拢至 ${ratio}×，纵深沉稳但不夸张。`;
    } else {
      verdict = `长焦 ${fMm}mm（机位远退至 ${d1}m）：哪怕走廊物理长度一毫米没变，长焦仍把 18m 外的红人与远山直接拉贴到门框背后（尺比只剩 ${ratio}×），空间瞬间变薄。`;
    }
    return { d1, d2, corridorLen, farScale, fovDeg, ratio, verdict };
  }

  function render() {
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(280, Math.round(rect.width));
    const H = Math.max(200, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const m = opticalMetrics(focalMm);

    // 布局：左 64% 取景窗实景 + 右 36% 顶视光学机位图（窄屏上下或精简）
    const split = W >= 520;
    const viewW = split ? Math.round(W * 0.64) : W;
    const viewH = H;

    // 1. 左侧：暗室取景器画面
    ctx.fillStyle = "#F4E6CF";
    ctx.fillRect(0, 0, viewW, viewH);

    const cx = viewW * 0.5;
    const horizonY = viewH * 0.54;

    // 远山与赤日（按 farScale 真实缩放！长焦下赤日与远山剧烈变大压近！）
    const sunR = clamp(10 + m.farScale * 88, 12, viewH * 0.24);
    ctx.fillStyle = "#B7C1B8";
    ctx.beginPath();
    ctx.moveTo(0, horizonY + 18);
    ctx.lineTo(viewW * 0.22, horizonY - 26 - m.farScale * 48);
    ctx.lineTo(viewW * 0.54, horizonY - 8 - m.farScale * 30);
    ctx.lineTo(viewW * 0.78, horizonY - 34 - m.farScale * 54);
    ctx.lineTo(viewW, horizonY + 12);
    ctx.lineTo(viewW, viewH);
    ctx.lineTo(0, viewH);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx - viewW * 0.03, horizonY - sunR * 0.65, sunR, 0, Math.PI * 2);
    ctx.fillStyle = "#DE532B";
    ctx.fill();

    // 地板梯形（从固定前门到动态远门）
    const p0W = viewW * 0.68;
    const p0H = viewH * 0.72;
    const p0Bot = horizonY + p0H * 0.44;
    const p0Top = p0Bot - p0H;

    const pFarW = p0W * m.farScale;
    const pFarH = p0H * m.farScale;
    const pFarBot = horizonY + pFarH * 0.44;
    const pFarTop = pFarBot - pFarH;

    ctx.fillStyle = "#F7DFC3";
    ctx.beginPath();
    ctx.moveTo(cx - p0W * 0.5, p0Bot);
    ctx.lineTo(cx + p0W * 0.5, p0Bot);
    ctx.lineTo(cx + pFarW * 0.5, pFarBot);
    ctx.lineTo(cx - pFarW * 0.5, pFarBot);
    ctx.closePath();
    ctx.fill();

    // 朱红地板引导线
    ctx.save();
    ctx.strokeStyle = "#D24322";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(cx - p0W * 0.14, viewH);
    ctx.lineTo(cx, pFarBot);
    ctx.stroke();
    ctx.restore();

    // 绘制 4 重嵌套倒 U 门框（底沿敞开不盖地板，日光石阶一路通到红人脚下！）
    const colors = ["#1B4949", "#2F5753", "#587771", "#85978E"];
    for (let i = 3; i >= 0; i--) {
      const z = m.d1 + (i / 3) * m.corridorLen;
      const sc = m.d1 / z;
      const w = p0W * sc;
      const h = p0H * sc;
      const bot = horizonY + h * 0.44;
      const top = bot - h;
      const thick = Math.max(8, 28 * sc);
      const oL = cx - w * 0.5 - thick;
      const oR = cx + w * 0.5 + thick;
      const iL = cx - w * 0.5;
      const iR = cx + w * 0.5;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(oL, bot);
      ctx.lineTo(oL, top - thick);
      ctx.lineTo(oR, top - thick);
      ctx.lineTo(oR, bot);
      ctx.lineTo(iR, bot);
      ctx.lineTo(iR, top);
      ctx.lineTo(iL, top);
      ctx.lineTo(iL, bot);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
      ctx.restore();

      // 在最远门洞站立远景红人（按真实 sc 缩放）
      if (i === 3) {
        const fh = Math.max(8, h * 0.36);
        const fw = fh * 0.28;
        ctx.fillStyle = "#D1360B";
        ctx.beginPath();
        ctx.arc(cx, bot - fh * 0.88, fw * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - fw * 0.48, bot - fh * 0.78, fw, fh * 0.46);
        ctx.fillRect(cx - fw * 0.36, bot - fh * 0.34, fw * 0.28, fh * 0.34);
        ctx.fillRect(cx + fw * 0.08, bot - fh * 0.34, fw * 0.28, fh * 0.34);
      }
    }

    // 锁定标尺框（证明最前门洞宽度丝毫未变！）
    ctx.strokeStyle = "rgba(255, 136, 102, 0.85)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(cx - p0W * 0.5, p0Top, p0W, p0H);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(14, 36, 36, 0.84)";
    ctx.fillRect(10, 10, 148, 22);
    ctx.fillStyle = "#FAF4E8";
    ctx.font = '500 11px "DM Mono", monospace';
    ctx.fillText(`f=${focalMm}mm · 前门宽锁定`, 18, 25);

    // 2. 右侧：顶视光学机位示意图（揭示相机其实在物理后退！）
    if (split) {
      const rx = viewW;
      const rw = W - viewW;
      ctx.fillStyle = "#122B2B";
      ctx.fillRect(rx, 0, rw, H);
      ctx.strokeStyle = "#295452";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rx, 0); ctx.lineTo(rx, H);
      ctx.stroke();

      ctx.fillStyle = "#8CD4C6";
      ctx.font = '500 11px "DM Mono", monospace';
      ctx.fillText("TOP-DOWN OPTICS · 顶视机位", rx + 14, 24);

      const pad = 22;
      const mapTop = 44;
      const mapBot = H - 30;
      const mapH = mapBot - mapTop;
      const mapCx = rx + rw * 0.5;
      // 固定标尺：最远门在 mapTop + 12，第一门在 mapTop + mapH * 0.48，相机在下方随 d1 进退
      const maxTotalD = 36;
      const zToY = (distFromFar) => mapTop + 14 + (distFromFar / maxTotalD) * (mapH - 22);

      const farY = zToY(0);
      const p0Y = zToY(m.corridorLen);
      const camY = zToY(m.corridorLen + m.d1);

      // 视锥阴影
      const halfSpanFar = (rw * 0.36) * (m.d2 / m.d1) * 0.38;
      ctx.fillStyle = "rgba(140, 212, 198, 0.14)";
      ctx.beginPath();
      ctx.moveTo(mapCx, camY);
      ctx.lineTo(mapCx - Math.min(rw * 0.44, halfSpanFar), farY);
      ctx.lineTo(mapCx + Math.min(rw * 0.44, halfSpanFar), farY);
      ctx.closePath();
      ctx.fill();

      // 四道固定物理门框
      for (let i = 0; i < 4; i++) {
        const y = lerp(farY, p0Y, i / 3);
        ctx.strokeStyle = i === 3 ? "#FF8866" : "#8CD4C6";
        ctx.lineWidth = i === 3 ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(mapCx - 38, y); ctx.lineTo(mapCx - 16, y);
        ctx.moveTo(mapCx + 16, y); ctx.lineTo(mapCx + 38, y);
        ctx.stroke();
      }
      // 物理长度 18m 标注
      ctx.strokeStyle = "rgba(250,244,232,0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rx + pad, farY); ctx.lineTo(rx + pad, p0Y);
      ctx.stroke();
      ctx.fillStyle = "#FAF4E8";
      ctx.font = '400 10px "DM Mono", monospace';
      ctx.fillText("18m", rx + pad + 4, (farY + p0Y) * 0.5 + 3);

      // 动态机位点
      ctx.fillStyle = "#FF8866";
      ctx.beginPath();
      ctx.arc(mapCx, camY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FAF4E8";
      ctx.fillText(`机位 ${m.d1}m`, mapCx + 10, camY + 4);
      ctx.fillStyle = "#8CD4C6";
      ctx.fillText(`视角 ${m.fovDeg}°`, rx + 14, H - 12);
    }

    if (focalVal) focalVal.textContent = `${focalMm}mm`;
    if (camDistVal) camDistVal.textContent = `${m.d1}m`;
    if (bgRatioVal) bgRatioVal.textContent = `1 : ${m.ratio}`;
    if (noteEl) noteEl.textContent = m.verdict;
    stops.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.focalStop) === focalMm));
  }

  slider.addEventListener("input", () => {
    focalMm = Number(slider.value);
    dirty = true;
    ctrl.draw();
  });
  stops.forEach((b) => {
    b.addEventListener("click", () => {
      focalMm = Number(b.dataset.focalStop);
      slider.value = String(focalMm);
      dirty = true;
      ctrl.draw();
    });
  });

  const ro = new ResizeObserver(() => { dirty = true; ctrl.draw(); });
  ro.observe(canvas);

  const ctrl = loop(canvas, () => {
    if (!dirty) return;
    dirty = false;
    render();
  });
  dirty = true;
  ctrl.draw();
}

// =========================================================================
// 04 节：五策略落地「平面初稿 ⇄ 深空间改造」对比卷帘（Before / After Wipe）
// =========================================================================
export function initSection04Wipe() {
  const canvas = document.getElementById("wipe-canvas");
  const range = document.getElementById("wipe-range");
  const tabs = [...document.querySelectorAll("[data-medium]")];
  const recipeEl = document.getElementById("wipe-recipe");
  if (!canvas || !range) return;

  const ctx = canvas.getContext("2d");
  let splitT = 0.52;
  let mediumKey = "arch";
  let dirty = true;

  const MEDIUMS = {
    arch: {
      name: "建筑摄影",
      strategies: ["框架嵌套", "前景遮挡", "引导线延伸"],
      flatDesc: "正对建筑立面平拍，缺少前景门廊与斜入步道，立面像一张建筑贴图。",
      deepDesc: "退半步进门廊，以暗柱框住入口，顺台阶把视线送往采光中庭里的孤影行人。",
    },
    poster: {
      name: "海报主视觉",
      strategies: ["大小对比", "前景遮挡", "框架嵌套"],
      flatDesc: "标题、圆日与山景全部平排在同层，没有前后穿插，版面单薄。",
      deepDesc: "让大标题与前景框边互叠穿插、巨型赤日压在建筑之后，瞬间拉开三维层序。",
    },
    game: {
      name: "游戏关卡引路",
      strategies: ["引导线延伸", "多层次景深", "框架嵌套"],
      flatDesc: "视野里堆满同亮度障碍物，玩家进门后不知道该往哪走。",
      deepDesc: "用近暗门框压边、地面亮阶引路、最深处高光塔楼做终极地标（经验上称「视觉导引线」）。",
    },
    web: {
      name: "网页首屏分层",
      strategies: ["前景遮挡", "大小对比", "多层次景深"],
      flatDesc: "卡片、标题和背景图全处同一平面，首屏像一堵沉闷的信息墙。",
      deepDesc: "轻度前景产品悬浮、中景清晰标题卡、远景柔化建筑氛围，建立三层阅读纵深。",
    },
    comic: {
      name: "漫画与分镜",
      strategies: ["前景遮挡", "大小对比", "引导线延伸"],
      flatDesc: "角色站在一排平直街景前，对话格缺乏现场临场感。",
      deepDesc: "前景大剪影压角、街道斜线汇聚到远端人物，一格画面就演完距离与孤立感。",
    },
  };

  function drawSide(isDeep, W, H) {
    const theme = mediumKey;
    // 暖纸底
    ctx.fillStyle = isDeep ? "#F4E6CF" : "#EDE3D3";
    ctx.fillRect(0, 0, W, H);

    const cx = W * 0.5;
    const hy = H * 0.52;

    if (!isDeep) {
      // 平面初稿：平直地平线、无框无遮挡、元素同大横排
      ctx.fillStyle = "#D4D7CC";
      ctx.fillRect(0, 0, W, hy);
      ctx.fillStyle = "#DFD3BE";
      ctx.fillRect(0, hy, W, H - hy);

      // 扁平横排建筑块
      ctx.fillStyle = "#5F7873";
      ctx.fillRect(W * 0.14, H * 0.28, W * 0.72, H * 0.36);
      ctx.fillStyle = "#F4E6CF";
      ctx.fillRect(W * 0.36, H * 0.36, W * 0.28, H * 0.28);

      // 平贴小山与圆日
      ctx.fillStyle = "#9BA79E";
      ctx.beginPath();
      ctx.moveTo(W * 0.36, H * 0.64);
      ctx.lineTo(W * 0.48, H * 0.45);
      ctx.lineTo(W * 0.64, H * 0.64);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(W * 0.24, H * 0.22, 20, 0, Math.PI * 2);
      ctx.fillStyle = "#D24322";
      ctx.fill();

      // 人物过大无比例差
      ctx.fillStyle = "#C33316";
      ctx.beginPath();
      ctx.arc(cx, H * 0.52, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 8, H * 0.56, 16, H * 0.24);

      if (theme === "web") {
        ctx.fillStyle = "#FAF4E8";
        ctx.strokeStyle = "#8C9B94";
        ctx.lineWidth = 1.5;
        ctx.fillRect(W * 0.2, H * 0.22, W * 0.6, H * 0.52);
        ctx.strokeRect(W * 0.2, H * 0.22, W * 0.6, H * 0.52);
        ctx.fillStyle = "#5F7873";
        ctx.fillRect(W * 0.26, H * 0.30, W * 0.48, 12);
        ctx.fillRect(W * 0.26, H * 0.42, W * 0.36, 8);
        ctx.fillRect(W * 0.26, H * 0.52, W * 0.44, 8);
      }
    } else {
      // 深空间改造：四重套框 + 前景遮挡 + 阶梯引导线 + 近大远小
      ctx.fillStyle = "#C7D0C5";
      ctx.beginPath();
      ctx.moveTo(0, hy + 16);
      ctx.lineTo(W * 0.28, hy - 42);
      ctx.lineTo(W * 0.52, hy - 18);
      ctx.lineTo(W * 0.74, hy - 48);
      ctx.lineTo(W, hy + 10);
      ctx.lineTo(W, H); ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();

      // 远处红日
      ctx.beginPath();
      ctx.arc(cx - 10, hy - 22, 16, 0, Math.PI * 2);
      ctx.fillStyle = "#DE532B";
      ctx.fill();

      // 透视亮石步道
      ctx.fillStyle = "#F7DFC3";
      ctx.beginPath();
      ctx.moveTo(W * 0.14, H);
      ctx.lineTo(W * 0.86, H);
      ctx.lineTo(cx + W * 0.11, hy + 14);
      ctx.lineTo(cx - W * 0.11, hy + 14);
      ctx.closePath();
      ctx.fill();

      // 朱红引导线
      ctx.save();
      ctx.strokeStyle = "#D24322";
      ctx.lineWidth = 2.4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(W * 0.32, H);
      ctx.lineTo(W * 0.45, H * 0.78);
      ctx.lineTo(cx + 6, hy + 18);
      ctx.stroke();
      ctx.restore();

      // 嵌套倒 U 门框（4 重由远及近，底沿敞开通透）
      const tones = ["#1B4949", "#2E5653", "#587670", "#899A91"];
      const scales = [1.0, 0.72, 0.48, 0.30];
      for (let i = 3; i >= 0; i--) {
        const s = scales[i];
        const w = W * 0.72 * s;
        const h = H * 0.72 * s;
        const thick = 24 * s;
        const bot = hy + 14 + (H - (hy + 14)) * s;
        const top = bot - h;
        const oL = cx - w / 2 - thick;
        const oR = cx + w / 2 + thick;
        const iL = cx - w / 2;
        const iR = cx + w / 2;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(oL, bot);
        ctx.lineTo(oL, top - thick);
        ctx.lineTo(oR, top - thick);
        ctx.lineTo(oR, bot);
        ctx.lineTo(iR, bot);
        ctx.lineTo(iR, top);
        ctx.lineTo(iL, top);
        ctx.lineTo(iL, bot);
        ctx.closePath();
        ctx.fillStyle = tones[i];
        ctx.fill();
        ctx.restore();
      }

      // 远端孤影小红人（近大远小尺度）
      ctx.fillStyle = "#D1360B";
      ctx.beginPath();
      ctx.arc(cx + 6, hy + 2, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx + 3.5, hy + 6, 5, 13);

      // 网页首屏模式加悬浮层级卡片
      if (theme === "web") {
        ctx.fillStyle = "rgba(17, 36, 36, 0.25)";
        ctx.fillRect(W * 0.24 + 8, H * 0.30 + 10, W * 0.52, H * 0.36);
        ctx.fillStyle = "#FAF4E8";
        ctx.fillRect(W * 0.24, H * 0.30, W * 0.52, H * 0.36);
        ctx.fillStyle = "#1B4949";
        ctx.fillRect(W * 0.28, H * 0.36, W * 0.32, 11);
        ctx.fillStyle = "#D24322";
        ctx.fillRect(W * 0.28, H * 0.54, W * 0.16, 16);
      }

      // 前景暗色遮挡枝叶/门柱
      ctx.fillStyle = "#0E2221";
      ctx.beginPath();
      ctx.moveTo(W, H * 0.04);
      ctx.lineTo(W * 0.84, H * 0.16);
      ctx.quadraticCurveTo(W * 0.76, H * 0.32, W * 0.87, H * 0.44);
      ctx.quadraticCurveTo(W * 0.78, H * 0.58, W * 0.88, H * 0.74);
      ctx.lineTo(W, H * 0.94);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#183835";
      ctx.beginPath();
      ctx.moveTo(0, H * 0.56);
      ctx.quadraticCurveTo(W * 0.14, H * 0.66, W * 0.08, H * 0.82);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
    }
  }

  function render() {
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(280, Math.round(rect.width));
    const H = Math.max(200, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const splitX = Math.round(W * splitT);

    // 左：平面初稿
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, H);
    ctx.clip();
    drawSide(false, W, H);
    ctx.restore();

    // 右：深空间改造
    ctx.save();
    ctx.beginPath();
    ctx.rect(splitX, 0, W - splitX, H);
    ctx.clip();
    drawSide(true, W, H);
    ctx.restore();

    // 中线分割把手
    ctx.strokeStyle = "#D24322";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(splitX, 0); ctx.lineTo(splitX, H);
    ctx.stroke();

    ctx.fillStyle = "#D24322";
    ctx.beginPath();
    ctx.arc(splitX, H * 0.5, 14, 0, Math.PI * 2);
    ctx.fill();
    // 纯矢量左右双箭头（零字体缺字依赖）
    ctx.strokeStyle = "#FAF4E8";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(splitX - 3, H * 0.5 - 4);
    ctx.lineTo(splitX - 7, H * 0.5);
    ctx.lineTo(splitX - 3, H * 0.5 + 4);
    ctx.moveTo(splitX + 3, H * 0.5 - 4);
    ctx.lineTo(splitX + 7, H * 0.5);
    ctx.lineTo(splitX + 3, H * 0.5 + 4);
    ctx.stroke();

    // 左右角标
    ctx.fillStyle = "rgba(17, 24, 23, 0.78)";
    ctx.fillRect(12, 12, 92, 22);
    ctx.fillStyle = "#FAF4E8";
    ctx.font = '600 11px "Noto Serif SC", serif';
    ctx.fillText("平面初稿", 24, 27);

    ctx.fillStyle = "rgba(27, 73, 73, 0.9)";
    ctx.fillRect(W - 108, 12, 96, 22);
    ctx.fillStyle = "#FAF4E8";
    ctx.fillText("深空间改造", W - 94, 27);
  }

  function updateMeta() {
    const m = MEDIUMS[mediumKey];
    tabs.forEach((t) => {
      const on = t.dataset.medium === mediumKey;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    if (recipeEl) {
      recipeEl.innerHTML = `
        <div class="wipe-pills">${m.strategies.map((s) => `<span class="wipe-pill">${s}</span>`).join("")}</div>
        <div class="wipe-compare-copy">
          <p><strong>改前（左）：</strong>${m.flatDesc}</p>
          <p><strong>改后（右）：</strong>${m.deepDesc}</p>
        </div>`;
    }
  }

  // 直接在画布上横拖卷帘（touch-action: pan-y）
  let dragging = false;
  const setFromClientX = (clientX) => {
    const r = canvas.getBoundingClientRect();
    splitT = clamp((clientX - r.left) / Math.max(1, r.width), 0.08, 0.92);
    range.value = String(Math.round(splitT * 100));
    dirty = true;
    ctrl.draw();
  };
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setFromClientX(e.clientX);
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  range.addEventListener("input", () => {
    splitT = clamp(Number(range.value) / 100, 0.08, 0.92);
    dirty = true;
    ctrl.draw();
  });

  tabs.forEach((t) => t.addEventListener("click", () => {
    mediumKey = t.dataset.medium;
    updateMeta();
    dirty = true;
    ctrl.draw();
  }));

  const ro = new ResizeObserver(() => { dirty = true; ctrl.draw(); });
  ro.observe(canvas);

  const ctrl = loop(canvas, () => {
    if (!dirty) return;
    dirty = false;
    render();
  });
  updateMeta();
  dirty = true;
  ctrl.draw();
}

// =========================================================================
// 05 节：反例缩略图压力测试卡（什么时候别用深空间）
// =========================================================================
export function initSection05Avoid() {
  const cards = [...document.querySelectorAll("[data-avoid-card]")];
  const scaleBtn = document.getElementById("avoid-scale-btn");
  const grid = document.getElementById("avoid-grid");
  if (!cards.length) return;

  let compact = false;

  cards.forEach((card) => {
    const btn = card.querySelector("[data-avoid-toggle]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const fixed = card.classList.toggle("is-fixed");
      btn.textContent = fixed ? "看回深空间反例" : "切换为简洁正解";
      btn.setAttribute("aria-pressed", String(fixed));
    });
  });

  if (scaleBtn && grid) {
    scaleBtn.addEventListener("click", () => {
      compact = !compact;
      grid.classList.toggle("is-thumb-stress", compact);
      scaleBtn.textContent = compact ? "恢复 100% 大图视角" : "切到 28% 手机缩略图压力测试";
      scaleBtn.setAttribute("aria-pressed", String(compact));
    });
  }
}

// =========================================================================
// 06 节：三题单变量辨析考场（标签仅写 方案 A/B/C/D，绝不剧透）
// =========================================================================
export function initSection06Quiz() {
  const stage = document.getElementById("quiz-body");
  const prog = document.getElementById("quiz-progress");
  const fb = document.getElementById("quiz-feedback");
  const nextBtn = document.getElementById("quiz-next");
  const resetBtn = document.getElementById("quiz-reset");
  if (!stage || !fb) return;

  // 共用纯建筑背景底图生成器（四选项只差题目指定的单个变量，全部采用真实倒 U 敞底门框）
  function corridorSVG({ fgMode = "good", figMode = "good", frameMode = "good" }) {
    let frames = "";
    if (frameMode === "flat") {
      // 三框等大重叠无收缩
      frames = [0, 1, 2].map((i) => `<path d="M${20 + i * 3},146 V${16 + i * 2} H${200 - i * 3} V146" fill="none" stroke="#2D5450" stroke-width="6"/>`).join("");
    } else if (frameMode === "invert") {
      // 明暗倒挂：外浅内黑，把远框拉回脸上
      frames = `
        <path fill="#95A49B" d="M8,148 V6 H212 V148 H186 V24 H34 V148 Z"/>
        <path fill="#52716B" d="M34,136 V24 H186 V136 H162 V40 H58 V136 Z"/>
        <path fill="#112625" d="M58,124 V40 H162 V124 H142 V56 H78 V124 Z"/>`;
    } else if (frameMode === "tunnel") {
      // 过密 7 道黑框吞光
      frames = [0, 1, 2, 3, 4, 5, 6].map((i) => {
        const pad = 6 + i * 11;
        return `<path d="M${pad},148 V${4 + i * 8} H${220 - pad} V148" fill="none" stroke="#132B2A" stroke-width="6"/>`;
      }).join("");
    } else {
      // 标准由深及浅逐级收缩倒 U 门框
      frames = `
        <path fill="#889990" d="M62,122 V42 H158 V122 H138 V58 H82 V122 Z"/>
        <path fill="#456762" d="M36,134 V24 H184 V134 H158 V42 H62 V134 Z"/>
        <path fill="#1B4949" d="M8,148 V6 H212 V148 H184 V24 H36 V148 Z"/>`;
    }

    let fig = "";
    if (figMode === "near") {
      fig = `<g fill="#D1360B"><circle cx="112" cy="84" r="8"/><rect x="104" y="94" width="16" height="48" rx="2"/></g>`;
    } else if (figMode === "midBad") {
      fig = `<g fill="#D1360B"><circle cx="112" cy="70" r="7.5"/><rect x="104.5" y="79" width="15" height="44" rx="2"/></g>`;
    } else if (figMode === "tinyHidden") {
      fig = `<g fill="#D1360B"><circle cx="85" cy="112" r="1.6"/><rect x="84" y="114" width="2.2" height="4"/></g>`;
    } else {
      fig = `<g fill="#D1360B"><circle cx="113" cy="100" r="3"/><rect x="110.5" y="104" width="5" height="15" rx="1"/></g>`;
    }

    let fg = "";
    if (fgMode === "none") {
      fg = "";
    } else if (fgMode === "block") {
      fg = `<path d="M220,0 L118,10 Q86,44 128,74 Q82,102 126,136 L220,148 Z" fill="#0B1E1D"/><path d="M0,56 Q72,72 52,118 L0,148 Z" fill="#0F2625"/>`;
    } else if (fgMode === "behind") {
      // 明显从第一道门柱后面探出（被最前深青门框截断，违背近遮远逻辑）
      fg = `<path d="M192,28 L156,42 Q132,64 158,82 Q134,100 162,124 L192,130 Z" fill="#0B1F1E"/>`;
    } else {
      fg = `<path d="M220,8 L194,24 Q174,44 190,64 Q170,84 192,108 L220,136 Z" fill="#0E2221"/><path d="M0,96 Q24,108 14,132 L0,148 Z" fill="#183835"/>`;
    }

    return `
      <svg viewBox="0 0 220 148" aria-hidden="true">
        <rect width="220" height="148" fill="#F4E6CF"/>
        <path d="M40,120 L92,76 L138,94 L182,78 L182,126 L40,126 Z" fill="#C4CBBF"/>
        <circle cx="105" cy="76" r="9" fill="#DE532B"/>
        <polygon points="28,148 82,118 138,118 192,148" fill="#F7DFC3"/>
        <path d="M74,148 L104,130 L113,119" fill="none" stroke="#D24322" stroke-width="2" stroke-dasharray="5 3"/>
        ${fgMode === "behind" ? fg : ""}
        ${frames}
        ${fig}
        ${fgMode !== "behind" ? fg : ""}
      </svg>`;
  }

  const QUESTIONS = [
    {
      prompt: "第 1 题 · 控制变量：前景遮挡。下面四张图的门框、远山与红人完全相同，哪一张的前景处理最能稳住纵深？",
      answer: "B",
      options: [
        {
          id: "A",
          svg: corridorSVG({ fgMode: "none" }),
          why: "方案 A 缺少任何前景遮挡，画面没有紧贴镜头的近景锚点，整条走廊像漂浮在画外的平面布景。",
        },
        {
          id: "B",
          svg: corridorSVG({ fgMode: "good" }),
          why: "方案 B 正确：暗色枝叶只轻咬两侧画框边缘（约一两成面积），既明确了「叶在门前」的遮挡序，又完整保留中央光口。",
        },
        {
          id: "C",
          svg: corridorSVG({ fgMode: "block" }),
          why: "方案 C 遮挡过头，前景暗叶盖住了接近一半入口，主走廊被闷死，属于典型反向失误。",
        },
        {
          id: "D",
          svg: corridorSVG({ fgMode: "behind" }),
          why: "方案 D 把深色枝叶画在了第一道门框后面，反被门框压住，失去了近景遮挡锚定镜头位置的作用。",
        },
      ],
    },
    {
      prompt: "第 2 题 · 控制变量：尺度与落点。四张图的门框与引线相同，哪一张里的红人最能拉开「近大远小」的空间感？",
      answer: "C",
      options: [
        {
          id: "A",
          svg: corridorSVG({ figMode: "near" }),
          why: "方案 A 的红人站在最前阶，占了小半个画面，与门洞几乎拉不开比例差，走廊显得短促扁平。",
        },
        {
          id: "B",
          svg: corridorSVG({ figMode: "midBad" }),
          why: "方案 B 的红人退到了中段，但身形没有按透视缩小，显得像巨人堵在门里，破坏真实尺度信任感。",
        },
        {
          id: "C",
          svg: corridorSVG({ figMode: "good" }),
          why: "方案 C 正确：红人落脚在最内层光口与朱红引线终点，身高约占内门四分之一，一眼换算出整条走廊的宏大纵深。",
        },
        {
          id: "D",
          svg: corridorSVG({ figMode: "tinyHidden" }),
          why: "方案 D 的红人缩到近乎噪点，还躲进了左侧暗门柱边，脱离光口与引导线终点，视线找不到落脚处。",
        },
      ],
    },
    {
      prompt: "第 3 题 · 控制变量：嵌套框架的递进与明暗序。哪一张最符合深空间构图的层叠节奏？",
      answer: "C",
      options: [
        {
          id: "A",
          svg: corridorSVG({ frameMode: "flat" }),
          why: "方案 A 三道门框几乎等大贴在一起，没有随距离按透视收束，读起来像平铺装饰线框。",
        },
        {
          id: "B",
          svg: corridorSVG({ frameMode: "invert" }),
          why: "方案 B 明暗完全倒挂：外框浅灰、最里层门框反而最深最黑，高对比把远景强行拽回眼前，空间感错乱。",
        },
        {
          id: "C",
          svg: corridorSVG({ frameMode: "good" }),
          why: "方案 C 正确：由近及远门框逐重收窄，色阶从深松青柔和过渡到浅雾青，层层托出明亮远山与红日。",
        },
        {
          id: "D",
          svg: corridorSVG({ frameMode: "tunnel" }),
          why: "方案 D 强行塞进七道密框，门与门之间失去采光留白，纵深节奏退化成窒息的黑条纹隧道。",
        },
      ],
    },
  ];

  let idx = 0;
  let score = 0;
  const answered = new Array(QUESTIONS.length).fill(null);

  function renderQuestion() {
    const q = QUESTIONS[idx];
    const picked = answered[idx];
    if (prog) prog.textContent = `第 ${idx + 1} / ${QUESTIONS.length} 题 · 已答对 ${score} 题`;

    stage.innerHTML = `
      <p class="quiz-prompt">${q.prompt}</p>
      <div class="quiz-grid">
        ${q.options.map((opt) => {
          let cls = "quiz-opt";
          if (picked) {
            if (opt.id === q.answer) cls += " is-right";
            else if (opt.id === picked) cls += " is-wrong";
          }
          return `
            <button type="button" class="${cls}" data-quiz-opt="${opt.id}" ${picked ? "disabled" : ""}>
              <div class="quiz-thumb">${opt.svg}</div>
              <span class="quiz-opt-label">方案 ${opt.id}</span>
            </button>`;
        }).join("")}
      </div>`;

    stage.querySelectorAll("[data-quiz-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (answered[idx]) return;
        const choice = btn.dataset.quizOpt;
        answered[idx] = choice;
        if (choice === q.answer) score++;
        renderQuestion();
      });
    });

    if (!picked) {
      fb.innerHTML = `<p class="quiz-fb-idle">点选上方 4 张图例里的任意一项。四张图只改变一个空间变量，试着先看清再点。</p>`;
    } else {
      const ok = picked === q.answer;
      const pickedObj = q.options.find((o) => o.id === picked);
      const rightObj = q.options.find((o) => o.id === q.answer);
      fb.innerHTML = `
        <div class="quiz-fb-head ${ok ? "is-ok" : "is-err"}">${ok ? `答对了 · 方案 ${picked}` : `选了方案 ${picked} · 正解是方案 ${q.answer}`}</div>
        <p>${pickedObj.why}</p>
        ${!ok ? `<p class="quiz-fb-right"><strong>为什么选方案 ${q.answer}：</strong>${rightObj.why}</p>` : ""}`;
    }

    if (nextBtn) {
      nextBtn.hidden = !picked || idx >= QUESTIONS.length - 1;
    }
    if (resetBtn) {
      resetBtn.hidden = !(picked && idx === QUESTIONS.length - 1);
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (idx < QUESTIONS.length - 1) {
        idx++;
        renderQuestion();
      }
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      idx = 0;
      score = 0;
      answered.fill(null);
      renderQuestion();
    });
  }

  renderQuestion();
}

// =========================================================================
// 07 节：原海报灯箱放大与拖拽平移（draggable="false" + Esc 关闭）
// =========================================================================
export function initPosterLightbox() {
  const thumb = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const dialog = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const stage = document.getElementById("lightbox-stage");
  const zoomIn = document.getElementById("lb-zoom-in");
  const zoomOut = document.getElementById("lb-zoom-out");
  const zoomReset = document.getElementById("lb-zoom-reset");
  const closeBtn = document.getElementById("lb-close");
  if (!thumb || !dialog || !lbImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function apply() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    lbImg.src = thumb.src; // 只复用已内联的一份海报，不另存副本
    scale = 1.25;
    tx = 0;
    ty = 0;
    apply();
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
  thumb.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === stage) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dialog.hidden) close();
  });

  zoomIn?.addEventListener("click", () => { scale = clamp(scale + 0.35, 1, 3.2); apply(); });
  zoomOut?.addEventListener("click", () => {
    scale = clamp(scale - 0.35, 1, 3.2);
    if (scale === 1) { tx = 0; ty = 0; }
    apply();
  });
  zoomReset?.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; apply(); });

  stage.addEventListener("pointerdown", (e) => {
    if (e.target !== lbImg && e.target !== stage) return;
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = clamp(e.clientX - sx, -600, 600);
    ty = clamp(e.clientY - sy, -700, 700);
    apply();
  });
  stage.addEventListener("pointerup", () => { dragging = false; });
  stage.addEventListener("pointercancel", () => { dragging = false; });
}

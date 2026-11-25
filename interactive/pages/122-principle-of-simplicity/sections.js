// 122 简化构图原则 · 正文 01–07 节全部独立交互模块
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE, PUZZLES_S01 } from "./model.js";

/* ==================== 01 节：双解编码天平（SVG 爆裂拆分器） ==================== */
export function initSection01() {
  const svg = document.getElementById("s01-svg");
  const simpleLabel = document.getElementById("s01-simple-label");
  const simpleRules = document.getElementById("s01-simple-rules");
  const fragLabel = document.getElementById("s01-frag-label");
  const fragRules = document.getElementById("s01-frag-rules");
  const explain = document.getElementById("s01-explain");
  const cardSimple = document.getElementById("dr-simple");
  const cardFrag = document.getElementById("dr-frag");

  let activePuzzle = "trio";
  let mode = "simple"; // 'simple' | 'fragment'

  function renderSvg() {
    const p = PUZZLES_S01[activePuzzle];
    simpleLabel.textContent = p.simpleCount;
    simpleRules.textContent = `描述规则约 ${p.simpleRules} 步（示意）`;
    fragLabel.textContent = p.fragmentCount;
    fragRules.textContent = `描述规则约 ${p.fragmentRules} 步（示意）`;
    explain.textContent = p.summary;

    cardSimple.classList.toggle("is-selected-good", mode === "simple");
    cardFrag.classList.toggle("is-selected-heavy", mode === "fragment");

    const isFrag = mode === "fragment";
    let markup = "";

    if (activePuzzle === "trio") {
      // 左侧原始叠压，右侧根据模式显示「3 完整基本形」或「爆裂 11 碎片」
      markup = `
        <text x="120" y="24" text-anchor="middle" fill="#464C49" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif">视觉输入（重叠形态）</text>
        <circle cx="96" cy="116" r="44" fill="#E3540E" fill-opacity="0.92"></circle>
        <rect x="116" y="88" width="66" height="66" fill="#135936" fill-opacity="0.92"></rect>
        <polygon points="124,104 170,186 78,186" fill="#F78EAD" fill-opacity="0.92"></polygon>
        <path d="M220 130 L264 130 L264 120 L282 136 L264 152 L264 142 L220 142 Z" fill="${isFrag ? "#B41C24" : "#135936"}"></path>
        <text x="395" y="24" text-anchor="middle" fill="${isFrag ? "#B41C24" : "#135936"}" font-size="12" font-weight="800" font-family="Noto Sans SC, sans-serif">${isFrag ? "物理硬拆：11 块锯齿残片（拒绝）" : "大脑简解：圆 + 方 + 三角（采纳）"}</text>
        ${isFrag ? `
          <g transform="translate(295,46)">
            <path d="M22,68 A40,40 0 1,1 74,24 L62,56 L36,78 Z" fill="#E3540E" stroke="#0E1110" stroke-width="1.4"></path>
            <path d="M98,18 L152,18 L152,72 L124,72 L106,44 Z" fill="#135936" stroke="#0E1110" stroke-width="1.4"></path>
            <polygon points="74,40 94,40 94,64 68,64" fill="#B23B00" stroke="#0E1110" stroke-width="1.4"></polygon>
            <polygon points="94,76 116,108 72,108" fill="#F78EAD" stroke="#0E1110" stroke-width="1.4"></polygon>
            <polygon points="44,122 68,122 52,164 26,164" fill="#F78EAD" stroke="#0E1110" stroke-width="1.4"></polygon>
            <polygon points="122,122 146,122 166,164 132,164" fill="#F78EAD" stroke="#0E1110" stroke-width="1.4"></polygon>
            <polygon points="76,124 114,124 122,164 68,164" fill="#9E1F4E" stroke="#0E1110" stroke-width="1.4"></polygon>
            <rect x="158" y="84" width="24" height="22" fill="#135936" stroke="#0E1110" stroke-width="1.4"></rect>
            <text x="98" y="192" text-anchor="middle" fill="#B41C24" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">每块都要单独记折角，极难复述</text>
          </g>
        ` : `
          <g transform="translate(295,42)">
            <circle cx="96" cy="36" r="24" fill="#E3540E"></circle>
            <rect x="74" y="70" width="44" height="44" fill="#135936"></rect>
            <polygon points="96,122 126,170 66,170" fill="#F78EAD"></polygon>
            <text x="152" y="40" fill="#0E1110" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">1 个圆</text>
            <text x="152" y="96" fill="#0E1110" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">1 个方</text>
            <text x="152" y="152" fill="#0E1110" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">1 个三角</text>
            <text x="96" y="196" text-anchor="middle" fill="#135936" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">3 枚已知原形 · 描述最短</text>
          </g>
        `}
      `;
    } else if (activePuzzle === "olympic") {
      markup = `
        <text x="120" y="24" text-anchor="middle" fill="#464C49" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif">视觉输入（交叠五环）</text>
        <g fill="none" stroke-width="5.5">
          <circle cx="66" cy="116" r="26" stroke="#1A2962"></circle>
          <circle cx="122" cy="116" r="26" stroke="#0E1110"></circle>
          <circle cx="178" cy="116" r="26" stroke="#E3540E"></circle>
          <circle cx="94" cy="144" r="26" stroke="#135936"></circle>
          <circle cx="150" cy="144" r="26" stroke="#9E1F4E"></circle>
        </g>
        <path d="M220 130 L264 130 L264 120 L282 136 L264 152 L264 142 L220 142 Z" fill="${isFrag ? "#B41C24" : "#135936"}"></path>
        <text x="395" y="24" text-anchor="middle" fill="${isFrag ? "#B41C24" : "#135936"}" font-size="12" font-weight="800" font-family="Noto Sans SC, sans-serif">${isFrag ? "物理硬拆：9 块怪异月牙碎片（拒绝）" : "大脑简解：5 个等径圆环（采纳）"}</text>
        ${isFrag ? `
          <g transform="translate(302,62)" fill="none" stroke-width="5" stroke-linecap="round">
            <path d="M16 44 A24 24 0 1 1 56 26" stroke="#1A2962"></path>
            <path d="M62 24 A24 24 0 0 1 76 58" stroke="#B41C24" stroke-dasharray="4 4"></path>
            <path d="M90 22 A24 24 0 0 1 132 32" stroke="#0E1110"></path>
            <path d="M142 42 A24 24 0 1 1 180 68" stroke="#E3540E"></path>
            <path d="M36 96 A24 24 0 0 0 82 112" stroke="#135936"></path>
            <path d="M106 112 A24 24 0 0 0 154 96" stroke="#9E1F4E"></path>
            <path d="M68 74 Q84 62 96 76" stroke="#B41C24"></path>
            <path d="M114 76 Q128 62 142 74" stroke="#B41C24"></path>
            <text x="94" y="162" text-anchor="middle" fill="#B41C24" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">按交点断开变成 9 段不闭合弧钩</text>
          </g>
        ` : `
          <g transform="translate(304,68)" fill="none" stroke-width="4.5">
            <circle cx="30" cy="40" r="22" stroke="#1A2962"></circle>
            <circle cx="94" cy="40" r="22" stroke="#0E1110"></circle>
            <circle cx="158" cy="40" r="22" stroke="#E3540E"></circle>
            <circle cx="62" cy="96" r="22" stroke="#135936"></circle>
            <circle cx="126" cy="96" r="22" stroke="#9E1F4E"></circle>
            <text x="94" y="156" text-anchor="middle" fill="#135936" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">1 种半径 × 5 次重复 · 编码骤减</text>
          </g>
        `}
      `;
    } else {
      markup = `
        <text x="120" y="24" text-anchor="middle" fill="#464C49" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif">视觉输入（实心十字）</text>
        <path d="M98,66 H142 V110 H186 V154 H142 V198 H98 V154 H54 V110 H98 Z" fill="#1A2962"></path>
        <path d="M220 130 L264 130 L264 120 L282 136 L264 152 L264 142 L220 142 Z" fill="${isFrag ? "#B41C24" : "#135936"}"></path>
        <text x="395" y="24" text-anchor="middle" fill="${isFrag ? "#B41C24" : "#135936"}" font-size="12" font-weight="800" font-family="Noto Sans SC, sans-serif">${isFrag ? "物理硬拆：12 边凹多边形（拒绝）" : "大脑简解：两条正交矩形（采纳）"}</text>
        ${isFrag ? `
          <g transform="translate(302,48)">
            <path d="M68,14 H112 V58 H156 V102 H112 V146 H68 V102 H24 V58 H68 Z" fill="rgba(180,28,36,0.10)" stroke="#B41C24" stroke-width="2.2" stroke-dasharray="5 3"></path>
            <circle cx="68" cy="14" r="3.5" fill="#B41C24"></circle><circle cx="112" cy="14" r="3.5" fill="#B41C24"></circle>
            <circle cx="112" cy="58" r="3.5" fill="#B41C24"></circle><circle cx="156" cy="58" r="3.5" fill="#B41C24"></circle>
            <circle cx="156" cy="102" r="3.5" fill="#B41C24"></circle><circle cx="112" cy="102" r="3.5" fill="#B41C24"></circle>
            <circle cx="112" cy="146" r="3.5" fill="#B41C24"></circle><circle cx="68" cy="146" r="3.5" fill="#B41C24"></circle>
            <circle cx="68" cy="102" r="3.5" fill="#B41C24"></circle><circle cx="24" cy="102" r="3.5" fill="#B41C24"></circle>
            <circle cx="24" cy="58" r="3.5" fill="#B41C24"></circle><circle cx="68" cy="58" r="3.5" fill="#B41C24"></circle>
            <text x="90" y="182" text-anchor="middle" fill="#B41C24" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">逐点记录 12 个交替凹凸顶点</text>
          </g>
        ` : `
          <g transform="translate(302,48)">
            <rect x="68" y="12" width="44" height="136" fill="#135936" fill-opacity="0.82"></rect>
            <rect x="22" y="58" width="136" height="44" fill="#E3540E" fill-opacity="0.78"></rect>
            <text x="90" y="182" text-anchor="middle" fill="#135936" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">1 横 + 1 竖 · 2 条等宽长条</text>
          </g>
        `}
      `;
    }

    svg.innerHTML = markup;
  }

  document.querySelectorAll("[data-puzzle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activePuzzle = btn.dataset.puzzle;
      document.querySelectorAll("[data-puzzle]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      renderSvg();
    });
  });

  document.querySelectorAll("[data-decode-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.decodeMode;
      document.querySelectorAll("[data-decode-mode]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      renderSvg();
    });
  });

  renderSvg();
}

/* ==================== 02 节：四支柱逐级减法器 ==================== */
export function initSection02() {
  const poster = document.getElementById("s02-poster");
  const countEl = document.getElementById("s02-count");
  const noiseEl = document.getElementById("s02-noise");
  const infoEl = document.getElementById("s02-info");
  const noteEl = document.getElementById("s02-note");

  const flags = {
    simplicity: false,
    rule: false,
    order: false,
    readability: false,
    overcut: false,
  };

  function sync() {
    for (const [k, v] of Object.entries(flags)) {
      poster.dataset[k] = v ? "1" : "0";
      const btn = document.querySelector(`[data-s02="${k}"]`);
      if (btn) {
        btn.setAttribute("aria-pressed", String(v));
        const st = btn.querySelector(".ps-state");
        if (st) st.textContent = k === "overcut" ? (v ? "已误删" : "未触发") : (v ? "已生效" : "未启用");
      }
    }

    const activeFour = ["simplicity", "rule", "order", "readability"].filter((k) => flags[k]).length;
    const noiseLeft = (flags.simplicity ? 0 : 4) + (flags.rule ? 0 : 2);
    countEl.textContent = `${activeFour} / 4`;
    noiseEl.textContent = `${noiseLeft} 处`;
    infoEl.textContent = flags.overcut ? "残缺（丢日期地点）" : "完整";

    if (flags.overcut) {
      noteEl.textContent = "你触发了「过度删减」陷阱：展期与场馆被当成冗余一并划掉后，版面虽然极空，读者却无法据此去现场——简化必须保留决策所需的最低事实。";
    } else if (activeFour === 4) {
      noteEl.textContent = "四根支柱全部到位：装饰噪点清零、左缘对齐同一竖轴、主标与时间地点拉开顺位、对比与留白充足——视线进场不到一秒就能把关键信息收进脑中。";
    } else if (activeFour === 0) {
      noteEl.textContent = "当前卡片同时塞进斜纹底图、促销斜带、角标贴纸与无序对齐，眼睛要在多个噪点之间来回跳动才能找到展名与日期。";
    } else {
      const missing = [];
      if (!flags.simplicity) missing.push("简洁（尚有背景斜纹与角标噪点）");
      if (!flags.rule) missing.push("规则（元素仍东倒西歪没进同一轴线）");
      if (!flags.order) missing.push("秩序（标题与正文几乎同大没拉开层级）");
      if (!flags.readability) missing.push("易读（对比偏灰、留白略挤）");
      noteEl.textContent = `已减掉一部分负担，但还差：${missing.join("；")}。`;
    }
  }

  document.querySelectorAll("[data-s02]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.s02;
      flags[k] = !flags[k];
      sync();
    });
  });

  sync();
}

/* ==================== 03 节：深松绿暗室瞬时闪现记忆台 ==================== */
export function initSection03() {
  const canvas = document.getElementById("s03-canvas");
  const ctx = canvas.getContext("2d");
  const msSlider = document.getElementById("s03-ms");
  const msVal = document.getElementById("s03-ms-val");
  const flashBtn = document.getElementById("s03-flash-btn");
  const compareBtn = document.getElementById("s03-compare-btn");
  const physEl = document.getElementById("s03-phys-v");
  const symEl = document.getElementById("s03-sym-v");
  const errEl = document.getElementById("s03-err-v");
  const capEl = document.getElementById("s03-caption");

  const SHAPES = {
    jagged: {
      phys: "18 处",
      sym: "0 条",
      err: "大幅拉平（示意）",
      caption: "左侧实线为 18 折不规则轮廓，右侧浅翠虚线模拟短时记忆回想时大脑自动「拉平」出的近似正方与圆弧：细节越无规律，记错丢掉的部分越多。",
    },
    tilted: {
      phys: "9 处",
      sym: "准对称（偏 7°）",
      err: "自动扶正 7°",
      caption: "面对仅歪斜 7° 的方块与三角，350ms 瞬现后大脑几乎总会把它回忆成完全水平垂直的标准形——这正是阿恩海姆（1954）指出的知觉「拉平」效应。",
    },
    pure: {
      phys: "8 处",
      sym: "竖轴全对称",
      err: "几乎零失真",
      caption: "标准圆、方、三角沿同一对称轴排开时，大脑只需存下 3 个熟知原型与 1 条中轴规则；即使只闪现 150ms，回想轮廓也与原图高度重合。",
    },
  };

  let shapeKey = "jagged";
  let durationMs = 350;
  let showMemoryOverlay = true;
  let flashRemaining = 0; // 秒：>0 表示正在瞬现曝光，0 表示静置对照
  let maskHold = 0; // 曝光结束后短暂遮罩 0.55s 再揭示对比

  function updateCopy() {
    const info = SHAPES[shapeKey];
    physEl.textContent = info.phys;
    symEl.textContent = info.sym;
    errEl.textContent = info.err;
    capEl.textContent = info.caption;
    msVal.textContent = `${durationMs} ms`;
    flashBtn.textContent = `触发 ${durationMs}ms 瞬现记忆`;
  }

  function drawStimulus(cx, cy, r, isMemory) {
    ctx.save();
    ctx.translate(cx, cy);
    if (isMemory) {
      ctx.strokeStyle = "#7CE5AE";
      ctx.lineWidth = 2.4;
      ctx.setLineDash([6, 4]);
    } else {
      ctx.strokeStyle = "#FF8B52";
      ctx.fillStyle = "rgba(227, 84, 14, 0.22)";
      ctx.lineWidth = 2.6;
      ctx.setLineDash([]);
    }

    if (shapeKey === "jagged") {
      if (!isMemory) {
        ctx.beginPath();
        const N = 18;
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2 - Math.PI / 2;
          const rad = r * (0.76 + 0.28 * Math.sin(i * 2.1 + 0.5) + 0.14 * Math.cos(i * 3.7));
          const x = Math.cos(a) * rad;
          const y = Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // 大脑拉平后的近似椭圆/正方记忆轮廓
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (shapeKey === "tilted") {
      const ang = isMemory ? 0 : (7 * Math.PI) / 180;
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.rect(-r * 0.65, -r * 0.65, r * 1.3, r * 1.3);
      if (!isMemory) ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.05);
      ctx.lineTo(r * 0.42, -r * 0.65);
      ctx.lineTo(-r * 0.42, -r * 0.65);
      ctx.closePath();
      if (!isMemory) ctx.fill();
      ctx.stroke();
    } else {
      // 标准圆方三角塔
      ctx.beginPath();
      ctx.arc(0, -r * 0.62, r * 0.30, 0, Math.PI * 2);
      if (!isMemory) ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.rect(-r * 0.30, -r * 0.20, r * 0.60, r * 0.54);
      if (!isMemory) ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, r * 0.44);
      ctx.lineTo(r * 0.36, r * 0.96);
      ctx.lineTo(-r * 0.36, r * 0.96);
      ctx.closePath();
      if (!isMemory) ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function frame(t, dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    if (!still) {
      if (flashRemaining > 0) {
        flashRemaining = Math.max(0, flashRemaining - dt);
        if (flashRemaining === 0) maskHold = 0.55;
      } else if (maskHold > 0) {
        maskHold = Math.max(0, maskHold - dt);
      }
    } else {
      flashRemaining = 0;
      maskHold = 0;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#081F14";
    ctx.fillRect(0, 0, w, h);

    // 微妙网格线
    ctx.strokeStyle = "rgba(124, 229, 174, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 24; x < w; x += 24) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 24; y < h; y += 24) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();

    const r = Math.min(w * 0.22, h * 0.33);

    if (flashRemaining > 0) {
      // 瞬时曝光阶段：仅闪现物理图形
      drawStimulus(w * 0.5, h * 0.52, r, false);
      ctx.fillStyle = "#FF8B52";
      ctx.font = '600 12px "DM Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText(`EXPOSING · ${Math.ceil(flashRemaining * 1000)} ms`, w * 0.5, 24);
    } else if (maskHold > 0) {
      // 短暂遮罩阶段（模拟瞬现后视觉记忆巩固）
      ctx.fillStyle = "#7CE5AE";
      ctx.font = '700 13px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("闭眼回想刚才的形状……正在揭示大脑记忆重建", w * 0.5, h * 0.5);
    } else {
      // 常态对照：左物理输入 × 右记忆重建叠加
      ctx.strokeStyle = "rgba(124, 229, 174, 0.22)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 18);
      ctx.lineTo(w * 0.5, h - 18);
      ctx.stroke();
      ctx.setLineDash([]);

      drawStimulus(w * 0.26, h * 0.54, r * 0.92, false);
      drawStimulus(w * 0.74, h * 0.54, r * 0.92, false);
      if (showMemoryOverlay) {
        drawStimulus(w * 0.74, h * 0.54, r * 0.92, true);
      }

      ctx.font = '700 12px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = "#FF8B52";
      ctx.fillText("实际展示轮廓", w * 0.26, 24);
      ctx.fillStyle = "#7CE5AE";
      ctx.fillText(showMemoryOverlay ? "实际 vs 记忆拉平（翠绿虚线）" : "记忆叠加已关", w * 0.74, 24);
    }

    ctx.restore();
  }

  const ctl = loop(canvas, frame);

  document.querySelectorAll("[data-s03-shape]").forEach((btn) => {
    btn.addEventListener("click", () => {
      shapeKey = btn.dataset.s03Shape;
      document.querySelectorAll("[data-s03-shape]").forEach((b) => b.classList.toggle("is-active", b === btn));
      updateCopy();
      ctl.draw();
    });
  });

  msSlider.addEventListener("input", () => {
    durationMs = Number(msSlider.value);
    updateCopy();
    ctl.draw();
  });

  flashBtn.addEventListener("click", () => {
    if (reducedMotion.matches) {
      showMemoryOverlay = true;
      compareBtn.setAttribute("aria-pressed", "true");
      compareBtn.textContent = "叠加「拉平」记忆轮廓：开";
      ctl.draw();
      return;
    }
    flashRemaining = durationMs / 1000;
    maskHold = 0;
    ctl.draw();
  });

  compareBtn.addEventListener("click", () => {
    showMemoryOverlay = !showMemoryOverlay;
    compareBtn.setAttribute("aria-pressed", String(showMemoryOverlay));
    compareBtn.textContent = `叠加「拉平」记忆轮廓：${showMemoryOverlay ? "开" : "关"}`;
    ctl.draw();
  });

  updateCopy();
  ctl.draw();
}

/* ==================== 04 节：历史年代标本抽屉 ==================== */
export function initSection04() {
  const badgeEl = document.getElementById("era-badge");
  const titleEl = document.getElementById("era-title");
  const p1El = document.getElementById("era-p1");
  const p2El = document.getElementById("era-p2");
  const quoteEl = document.getElementById("era-quote");
  const svgEl = document.getElementById("era-svg");
  const capEl = document.getElementById("era-fig-cap");

  const ERAS = {
    "1923": {
      badge: "1923 · BERLIN & WEIMAR",
      title: "马克斯·韦特海默与魏玛包豪斯的三基本形",
      p1: "1923 年，马克斯·韦特海默在《心理学研究》（Psychologische Forschung）发表《格式塔理论研究 II》，系统梳理邻近、相似、连续、闭合与共同命运等组织原则，并以「好形态（Prägnanz）」作为贯穿全局的指向。",
      p2: "同年在魏玛包豪斯，瓦西里·康定斯基也向师生发放了著名的几何问卷，探索圆、方、三角三种基本图形与红黄蓝原色的心理对应。尽管现代心理学复测表明固定色形配对并非跨文化必然，但「用圆、方、三角归纳复杂世界」从此成了现代平面构图的基本语法。",
      quote: "“The whole is other than the sum of the parts.” — Gestalt School, Berlin 1920s",
      cap: "1923 年包豪斯基础课把视觉形态拆解为圆、方、三角三种最小结构单元。",
      svg: `
        <rect width="280" height="210" fill="#FCF8F2"></rect>
        <circle cx="62" cy="105" r="34" fill="#E3540E"></circle>
        <rect x="112" y="71" width="66" height="68" fill="#135936"></rect>
        <polygon points="228,70 264,139 192,139" fill="#F78EAD"></polygon>
        <text x="140" y="180" text-anchor="middle" fill="#464C49" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">圆 · 方 · 三角：最小几何原语</text>
      `,
    },
    "1935": {
      badge: "1935 · PRINCIPLES OF GESTALT PSYCHOLOGY",
      title: "库尔特·考夫卡正式定调「简洁律」总纲",
      p1: "1935 年，库尔特·考夫卡出版《格式塔心理学原理》（Principles of Gestalt Psychology），写下了后世被引用最广的一句总定义：「心理组织总会尽可能趋向当前条件所允许的最‘好’形态。」",
      p2: "考夫卡特别保留了「当前条件所允许（as the prevailing conditions allow）」这一前提：大脑并非无视现实输入，而是在给定刺激约束下，尽量消除模棱两可、朝规则、对称与稳定收敛。",
      quote: "“Psychological organization will always be as ‘good’ as the prevailing conditions allow.” — Kurt Koffka, 1935",
      cap: "同样由线条围合的图形，视觉系统会自动倾向规则对称的解释而非歪斜扭曲的解释。",
      svg: `
        <rect width="280" height="210" fill="#FCF8F2"></rect>
        <polygon points="32,68 92,50 116,124 48,142" fill="none" stroke="#B41C24" stroke-width="2" stroke-dasharray="5 4"></polygon>
        <path d="M126 100 L152 100 L152 93 L166 105 L152 117 L152 110 L126 110 Z" fill="#135936"></path>
        <rect x="180" y="64" width="72" height="72" fill="#135936" fill-opacity="0.14" stroke="#135936" stroke-width="2.5"></rect>
        <text x="72" y="172" text-anchor="middle" fill="#B41C24" font-size="11" font-family="Noto Sans SC, sans-serif">松散张力</text>
        <text x="216" y="172" text-anchor="middle" fill="#135936" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">稳态好形态</text>
      `,
    },
    "1953": {
      badge: "1953–1954 · MINIMUM PRINCIPLE & ART",
      title: "霍赫伯格量化「好度」，阿恩海姆区分简洁与简陋",
      p1: "1953 年，朱利安·霍赫伯格与爱德华·麦卡利斯特在《实验心理学杂志》提出用信息量度量图形「好度」：观察者看科弗曼立方体时，平面六边形投射的对称度高就容易被看成 2D 平面；稍微转个角度打破平面对称，3D 立方体成了描述更省力的解。",
      p2: "次年，鲁道夫·阿恩海姆出版《艺术与视知觉》（1954），指出真正优秀的简洁绝非「元素少就叫简陋（simplistic）」，而是用最清晰的结构骨架承载丰富张力。",
      quote: "“A quantitative approach to figural ‘goodness’.” — Hochberg & McAlister, 1953",
      cap: "科弗曼立方体示意：左图因 2D 对称极高常被读成平面拼花；右图打破平面对称后立刻立体化。",
      svg: `
        <rect width="280" height="210" fill="#FCF8F2"></rect>
        <g transform="translate(72,96)" fill="none" stroke="#1A2962" stroke-width="2">
          <polygon points="0,-46 40,-23 40,23 0,46 -40,23 -40,-23"></polygon>
          <line x1="0" y1="-46" x2="0" y2="46"></line>
          <line x1="-40" y1="-23" x2="40" y2="23"></line>
          <line x1="40" y1="-23" x2="-40" y2="23"></line>
        </g>
        <g transform="translate(204,96)" fill="none" stroke="#135936" stroke-width="2">
          <rect x="-34" y="-22" width="50" height="50"></rect>
          <rect x="-14" y="-42" width="50" height="50" stroke-dasharray="4 3"></rect>
          <line x1="-34" y1="-22" x2="-14" y2="-42"></line>
          <line x1="16" y1="-22" x2="36" y2="-42"></line>
          <line x1="16" y1="28" x2="36" y2="8"></line>
          <line x1="-34" y1="28" x2="-14" y2="8"></line>
        </g>
        <text x="72" y="174" text-anchor="middle" fill="#1A2962" font-size="11" font-family="Noto Sans SC, sans-serif">2D 对称高 → 偏平面</text>
        <text x="204" y="174" text-anchor="middle" fill="#135936" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">3D 编码短 → 偏立体</text>
      `,
    },
    "1971": {
      badge: "1969–1971 · STRUCTURAL INFORMATION THEORY",
      title: "莱文伯格用「结构信息论」给简化算账",
      p1: "荷兰心理学家伊曼纽尔·莱文伯格在 1969 年《心理学评论》与 1971 年《美国心理学杂志》创立结构信息理论（SIT），把模糊的「看起来简单」改写成可计算的编码长度。",
      p2: "他指出视觉系统通过三种压缩算子压短编码：重复（Iteration）、对称（Symmetry）与交替（Alternation）。重复越多、对称轴越齐，脑中留存该构图所需的信息负荷越低。",
      quote: "Coding operators: Iteration · Symmetry · Alternation — E. L. J. Leeuwenberg, 1971",
      cap: "结构编码对比：同一排 6 个图形，无规律杂排需记 6 项，交替对称只需 2 条压缩规则。",
      svg: `
        <rect width="280" height="210" fill="#FCF8F2"></rect>
        <text x="20" y="34" fill="#B41C24" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">无规律：负荷 = 6</text>
        <circle cx="34" cy="58" r="10" fill="#E3540E"></circle>
        <polygon points="74,47 85,68 63,68" fill="#F78EAD"></polygon>
        <rect x="102" y="48" width="20" height="20" fill="#135936" transform="rotate(18 112 58)"></rect>
        <rect x="142" y="54" width="26" height="9" fill="#1A2962"></rect>
        <circle cx="196" cy="58" r="6" fill="#0E1110"></circle>
        <polygon points="236,48 250,66 226,64" fill="#E3540E"></polygon>

        <line x1="20" y1="98" x2="260" y2="98" stroke="#D6CDC0" stroke-width="1.5"></line>
        <text x="20" y="126" fill="#135936" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">重复 + 对称：负荷 = 2</text>
        <circle cx="42" cy="156" r="11" fill="#E3540E"></circle>
        <rect x="74" y="145" width="22" height="22" fill="#135936"></rect>
        <circle cx="122" cy="156" r="11" fill="#E3540E"></circle>
        <rect x="154" y="145" width="22" height="22" fill="#135936"></rect>
        <circle cx="202" cy="156" r="11" fill="#E3540E"></circle>
        <rect x="234" y="145" width="22" height="22" fill="#135936"></rect>
      `,
    },
    "2006": {
      badge: "1970s–2006 · INDUSTRIAL & DIGITAL DESIGN",
      title: "从迪特·拉姆斯到前田约翰：减法进入产品设计",
      p1: "20 世纪 70 年代末，德国工业设计师迪特·拉姆斯总结「优良设计十原则」，第十条写下影响至今的准则：「好的设计是尽可能少的设计（Less, but better）」——回归纯粹与本质，而不是制造空无一物的装饰。",
      p2: "2006 年，设计师兼学者前田约翰在麻省理工学院出版社出版《简单法则》（The Laws of Simplicity），进一步提出「简化是在删减显而易见的冗余的同时，增添真正有意义的内容」。",
      quote: "“Good design is as little design as possible — Less, but better.” — Dieter Rams",
      cap: "少而精的秩序：把旋钮、刻度与功能块归拢到同一模数网格里，不靠文字说明也看得懂。",
      svg: `
        <rect width="280" height="210" fill="#FCF8F2"></rect>
        <rect x="36" y="34" width="208" height="132" rx="6" fill="#FFFDF9" stroke="#0E1110" stroke-width="2"></rect>
        <circle cx="96" cy="100" r="34" fill="#F2ECE2" stroke="#0E1110" stroke-width="2"></circle>
        <circle cx="96" cy="100" r="8" fill="#E3540E"></circle>
        <rect x="154" y="66" width="66" height="14" fill="#135936"></rect>
        <rect x="154" y="92" width="66" height="14" fill="#1A2962"></rect>
        <rect x="154" y="118" width="42" height="14" fill="#F78EAD"></rect>
        <text x="140" y="190" text-anchor="middle" fill="#464C49" font-size="11" font-family="Noto Sans SC, sans-serif">结构自明，无多余修饰</text>
      `,
    },
    "2012": {
      badge: "2012 · PSYCHOLOGICAL BULLETIN CENTENNIAL",
      title: "百年格式塔综述：大脑如何在简洁与真实间取平衡",
      p1: "2012 年，约翰·瓦格曼斯与六位视觉科学家在《心理学公报》（Psychological Bulletin）发表格式塔百年综述（第二篇），从神经资源经济性、复杂系统自组织、结构信息论与贝叶斯最优推断四个方向重新整合了简洁律。",
      p2: "当代视觉科学表明，「简洁」并不是偷懒——在充满遮挡和噪声的真实世界里，结构简单、对称规则的形态往往也对应更高的物理合理性；把构图理顺，本质上是顺着人眼亿万年演化出的解码偏好工作。",
      quote: "“Simplicity and likelihood meet in perceptual organization.” — Wagemans et al., 2012",
      cap: "简洁性（少规则）与吻合度（贴事实）交汇的平衡区，才是视觉系统最稳的落点。",
      svg: `
        <rect width="280" height="210" fill="#FCF8F2"></rect>
        <circle cx="106" cy="102" r="56" fill="#E3540E" fill-opacity="0.22" stroke="#E3540E" stroke-width="2"></circle>
        <circle cx="174" cy="102" r="56" fill="#135936" fill-opacity="0.22" stroke="#135936" stroke-width="2"></circle>
        <text x="76" y="106" text-anchor="middle" fill="#B23B00" font-size="11.5" font-weight="800" font-family="Noto Sans SC, sans-serif">编码简洁</text>
        <text x="204" y="106" text-anchor="middle" fill="#135936" font-size="11.5" font-weight="800" font-family="Noto Sans SC, sans-serif">证据吻合</text>
        <text x="140" y="106" text-anchor="middle" fill="#0E1110" font-size="11.5" font-weight="900" font-family="Noto Sans SC, sans-serif">最优解</text>
        <text x="140" y="182" text-anchor="middle" fill="#464C49" font-size="11" font-family="Noto Sans SC, sans-serif">不过载，也不丢失判读证据</text>
      `,
    },
  };

  function selectEra(key) {
    const e = ERAS[key];
    badgeEl.textContent = e.badge;
    titleEl.textContent = e.title;
    p1El.textContent = e.p1;
    p2El.textContent = e.p2;
    quoteEl.textContent = e.quote;
    svgEl.innerHTML = e.svg;
    capEl.textContent = e.cap;
  }

  document.querySelectorAll("[data-era]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-era]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      selectEra(btn.dataset.era);
    });
  });

  selectEra("1923");
}

/* ==================== 05 节：三场景五档简化临界刻度台 ==================== */
export function initSection05() {
  const svg = document.getElementById("s05-svg");
  const levelBadge = document.getElementById("s05-level-badge");
  const verdictPill = document.getElementById("s05-verdict-pill");
  const reasonEl = document.getElementById("s05-reason");
  const speedBar = document.getElementById("s05-speed-bar");
  const infoBar = document.getElementById("s05-info-bar");

  const DOMAINS = {
    road: {
      best: [3, 4],
      levels: {
        1: {
          title: "第 1 档 · 写实信息堆砌",
          verdict: "过载拖慢",
          tone: "warn",
          speed: 22,
          info: 100,
          reason: "把风景插画、欢迎标语、赞助商标志和 6 行小字全塞上路牌：驾驶人视线来不及找出口箭头就已经错过了匝道。",
        },
        2: {
          title: "第 2 档 · 去掉背景配图",
          verdict: "仍有冗余",
          tone: "warn",
          speed: 50,
          info: 98,
          reason: "清掉了风景底图，但仍保留多余装饰外框与长句说明，高速扫视依然需要多停留一秒。",
        },
        3: {
          title: "第 3 档 · 标准导视骨架",
          verdict: "推荐落点",
          tone: "ok",
          speed: 86,
          info: 94,
          reason: "保留出口方向箭、公路编号、地名与高对比松绿底色：结构秩序井然，时速百公里下也能一瞥读完。",
        },
        4: {
          title: "第 4 档 · 高速极简符号",
          verdict: "推荐落点",
          tone: "ok",
          speed: 96,
          info: 88,
          reason: "只留超大右转箭与出口编号「EXIT 12」，远在百米之外就能凭几何剪影完成变道决策。",
        },
        5: {
          title: "第 5 档 · 抽空失义红区",
          verdict: "过度简化",
          tone: "danger",
          speed: 98,
          info: 20,
          reason: "连出口编号与方向都删成一只孤零零的圆点，路牌再干净，驾驶人也完全不知道该往哪走。",
        },
      },
    },
    metro: {
      best: [3],
      levels: {
        1: {
          title: "第 1 档 · 真实地理卫星图",
          verdict: "市中心挤死",
          tone: "warn",
          speed: 20,
          info: 100,
          reason: "严格按真实公里数和弯曲河道画地铁，郊区一大片空白，市中心 12 个换乘站挤成一团完全看不清。",
        },
        2: {
          title: "第 2 档 · 弱化地形保留弯线",
          verdict: "依然难追踪",
          tone: "warn",
          speed: 48,
          info: 96,
          reason: "淡化了街道和河流，但线路仍按真实弧度拐弯，眼睛沿着线路数站时容易在交叉口跳线。",
        },
        3: {
          title: "第 3 档 · 45°/90° 拓扑简化",
          verdict: "最佳甜点",
          tone: "ok",
          speed: 92,
          info: 92,
          reason: "像 1933 年伦敦地铁拓扑图一样，放弃精确距离，把线路拉直为水平、垂直与 45° 折线并拉开换乘圈：换乘关系瞬间透明。",
        },
        4: {
          title: "第 4 档 · 省去中途小站名",
          verdict: "开始失真",
          tone: "danger",
          speed: 90,
          info: 46,
          reason: "为了看起来像现代抽象画，藏掉了中途普通站名与换乘方向，乘客进站后不得不反复查手机确认。",
        },
        5: {
          title: "第 5 档 · 仅剩三条色线",
          verdict: "过度简化",
          tone: "danger",
          speed: 96,
          info: 14,
          reason: "删成三道漂亮彩条后，它成了装饰画而不是路线图——简洁不能以剥夺查路功能为代价。",
        },
      },
    },
    med: {
      best: [2],
      levels: {
        1: {
          title: "第 1 档 · 密麻通栏小字墙",
          verdict: "难以定位",
          tone: "warn",
          speed: 24,
          info: 100,
          reason: "把用法用量、禁忌与不良反应塞进毫无分区的密字墙，患者半夜发烧时根本找不到一次吃几粒。",
        },
        2: {
          title: "第 2 档 · 分区分级保全文",
          verdict: "安全落点",
          tone: "ok",
          speed: 80,
          info: 98,
          reason: "用清晰色条和分组突出「用量 / 禁忌 / 警示」，同时完整保留每一条过敏与药物相互作用说明——秩序简化，事实一条不删！",
        },
        3: {
          title: "第 3 档 · 折叠禁忌细则",
          verdict: "风险红区",
          tone: "danger",
          speed: 88,
          info: 54,
          reason: "为了版面留白把儿童减量与孕妇禁忌挪去二维码里，对老人和急用场景已经构成隐患。",
        },
        4: {
          title: "第 4 档 · 只留大号剂量数字",
          verdict: "严重危险",
          tone: "danger",
          speed: 95,
          info: 28,
          reason: "表面极简像高级护肤品包装，但拿掉了禁忌人群与最大日剂量警告，这是最危险的「伪极简」。",
        },
        5: {
          title: "第 5 档 · 极简白盒无警示",
          verdict: "禁止使用",
          tone: "danger",
          speed: 98,
          info: 8,
          reason: "医疗与安全类排版严禁为了视觉干净删减关键警示：这里的底线不是「最简」，而是「零误服」。",
        },
      },
    },
  };

  let domain = "road";
  let step = 3;

  function drawDomainSvg() {
    if (domain === "road") {
      if (step === 1) {
        return `
          <rect width="420" height="220" fill="#135936"></rect>
          <rect x="10" y="10" width="400" height="200" fill="none" stroke="#FCF8F2" stroke-width="2" stroke-dasharray="6 4"></rect>
          <circle cx="62" cy="54" r="24" fill="#E3540E" fill-opacity="0.5"></circle>
          <polygon points="35,140 90,78 145,140" fill="#2A7A50"></polygon>
          <text x="220" y="42" text-anchor="middle" fill="#FCF8F2" font-size="13" font-weight="700" font-family="Noto Sans SC, sans-serif">欢迎光临海滨生态旅游示范区</text>
          <text x="220" y="72" text-anchor="middle" fill="#F78EAD" font-size="11" font-family="Noto Sans SC, sans-serif">本路段风景优美请文明驾驶勿抛物</text>
          <text x="220" y="108" text-anchor="middle" fill="#FCF8F2" font-size="14" font-weight="800" font-family="Noto Sans SC, sans-serif">前方 500 米右转：机场 12 号出口</text>
          <text x="220" y="138" text-anchor="middle" fill="#D6CDC0" font-size="10.5" font-family="Noto Sans SC, sans-serif">服务区加油站餐饮休息停车位均在前方右侧</text>
          <text x="220" y="172" text-anchor="middle" fill="#D6CDC0" font-size="10.5" font-family="Noto Sans SC, sans-serif">高速应急救援电话与旅游咨询热线见护栏</text>
        `;
      }
      if (step === 2) {
        return `
          <rect width="420" height="220" fill="#135936"></rect>
          <rect x="14" y="14" width="392" height="192" fill="none" stroke="#FCF8F2" stroke-width="2"></rect>
          <rect x="24" y="24" width="372" height="172" fill="none" stroke="#7CE5AE" stroke-width="1"></rect>
          <text x="42" y="64" fill="#D6CDC0" font-size="12" font-family="Noto Sans SC, sans-serif">前方 500 米请注意减速变道</text>
          <text x="42" y="114" fill="#FCF8F2" font-size="24" font-weight="900" font-family="Noto Sans SC, sans-serif">机场东 · EXIT 12</text>
          <text x="42" y="154" fill="#FCF8F2" font-size="13" font-family="Noto Sans SC, sans-serif">靠右侧车道驶出主线</text>
          <path d="M312 106 L354 106 L354 92 L378 114 L354 136 L354 122 L312 122 Z" fill="#FCF8F2"></path>
        `;
      }
      if (step === 3) {
        return `
          <rect width="420" height="220" fill="#135936"></rect>
          <rect x="14" y="14" width="392" height="192" rx="8" fill="none" stroke="#FCF8F2" stroke-width="3"></rect>
          <rect x="34" y="34" width="96" height="32" fill="#E3540E"></rect>
          <text x="82" y="55" text-anchor="middle" fill="#FFFDF9" font-size="15" font-weight="800" font-family="DM Mono, monospace">EXIT 12</text>
          <text x="34" y="128" fill="#FFFDF9" font-size="36" font-weight="900" font-family="Noto Sans SC, sans-serif">机场东</text>
          <text x="34" y="164" fill="#D2E8DC" font-size="15" font-weight="700" font-family="DM Mono, monospace">500 m</text>
          <path d="M274 108 L344 108 L344 82 L386 122 L344 162 L344 136 L274 136 Z" fill="#FFFDF9"></path>
        `;
      }
      if (step === 4) {
        return `
          <rect width="420" height="220" fill="#135936"></rect>
          <rect x="14" y="14" width="392" height="192" rx="8" fill="none" stroke="#FCF8F2" stroke-width="3"></rect>
          <text x="44" y="132" fill="#FFFDF9" font-size="52" font-weight="900" font-family="DM Mono, monospace">12</text>
          <path d="M180 100 L316 100 L316 66 L376 116 L316 166 L316 132 L180 132 Z" fill="#FFFDF9"></path>
        `;
      }
      return `
        <rect width="420" height="220" fill="#135936"></rect>
        <circle cx="210" cy="110" r="24" fill="#FFFDF9"></circle>
        <text x="210" y="176" text-anchor="middle" fill="#FF858B" font-size="13" font-weight="700" font-family="Noto Sans SC, sans-serif">（方向与出口号全部删空）</text>
      `;
    }

    if (domain === "metro") {
      if (step === 1) {
        return `
          <rect width="420" height="220" fill="#F2ECE2"></rect>
          <path d="M0 160 Q110 110 200 155 T420 120" fill="none" stroke="#B8D0D8" stroke-width="24"></path>
          <path d="M40 30 Q90 95 165 110 T240 120 Q255 128 242 142 T380 180" fill="none" stroke="#E3540E" stroke-width="3"></path>
          <path d="M180 20 Q220 85 215 116 T235 130 Q260 150 205 200" fill="none" stroke="#135936" stroke-width="3"></path>
          <path d="M120 190 Q190 140 218 122 T350 40" fill="none" stroke="#1A2962" stroke-width="3"></path>
          <circle cx="214" cy="118" r="4" fill="#0E1110"></circle><circle cx="223" cy="122" r="4" fill="#0E1110"></circle>
          <circle cx="218" cy="129" r="4" fill="#0E1110"></circle><circle cx="231" cy="126" r="4" fill="#0E1110"></circle>
          <circle cx="226" cy="114" r="4" fill="#0E1110"></circle>
          <text x="225" y="102" fill="#B41C24" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">市中心 8 站挤成一团</text>
        `;
      }
      if (step === 2) {
        return `
          <rect width="420" height="220" fill="#FCF8F2"></rect>
          <path d="M36 52 Q128 84 210 114 T384 166" fill="none" stroke="#E3540E" stroke-width="4"></path>
          <path d="M170 22 Q204 82 210 114 T244 198" fill="none" stroke="#135936" stroke-width="4"></path>
          <path d="M74 184 Q158 148 210 114 T348 36" fill="none" stroke="#1A2962" stroke-width="4"></path>
          <circle cx="210" cy="114" r="8" fill="#FFFDF9" stroke="#0E1110" stroke-width="2.5"></circle>
          <text x="224" y="106" fill="#0E1110" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">中央站</text>
          <circle cx="136" cy="86" r="4.5" fill="#E3540E"></circle><circle cx="292" cy="142" r="4.5" fill="#E3540E"></circle>
          <circle cx="144" cy="150" r="4.5" fill="#1A2962"></circle><circle cx="288" cy="70" r="4.5" fill="#1A2962"></circle>
        `;
      }
      if (step === 3) {
        return `
          <rect width="420" height="220" fill="#FFFDF9"></rect>
          <polyline points="36,110 384,110" fill="none" stroke="#E3540E" stroke-width="6"></polyline>
          <polyline points="150,24 150,110 210,170 210,200" fill="none" stroke="#135936" stroke-width="6"></polyline>
          <polyline points="80,188 158,110 278,110 344,44" fill="none" stroke="#1A2962" stroke-width="6"></polyline>
          <circle cx="80" cy="110" r="5" fill="#FFFDF9" stroke="#E3540E" stroke-width="2.5"></circle>
          <text x="80" y="96" text-anchor="middle" fill="#0E1110" font-size="10.5" font-weight="700" font-family="Noto Sans SC, sans-serif">西门</text>
          <circle cx="150" cy="110" r="8.5" fill="#FFFDF9" stroke="#0E1110" stroke-width="3"></circle>
          <text x="150" y="92" text-anchor="middle" fill="#0E1110" font-size="11" font-weight="800" font-family="Noto Sans SC, sans-serif">中央换乘</text>
          <circle cx="278" cy="110" r="8.5" fill="#FFFDF9" stroke="#0E1110" stroke-width="3"></circle>
          <text x="278" y="92" text-anchor="middle" fill="#0E1110" font-size="11" font-weight="800" font-family="Noto Sans SC, sans-serif">东站</text>
          <circle cx="348" cy="110" r="5" fill="#FFFDF9" stroke="#E3540E" stroke-width="2.5"></circle>
          <text x="348" y="132" text-anchor="middle" fill="#0E1110" font-size="10.5" font-weight="700" font-family="Noto Sans SC, sans-serif">会展</text>
          <circle cx="150" cy="54" r="5" fill="#FFFDF9" stroke="#135936" stroke-width="2.5"></circle>
          <text x="164" y="58" fill="#0E1110" font-size="10.5" font-weight="700" font-family="Noto Sans SC, sans-serif">北园</text>
        `;
      }
      if (step === 4) {
        return `
          <rect width="420" height="220" fill="#FFFDF9"></rect>
          <line x1="40" y1="110" x2="380" y2="110" stroke="#E3540E" stroke-width="6"></line>
          <line x1="150" y1="30" x2="150" y2="190" stroke="#135936" stroke-width="6"></line>
          <line x1="100" y1="180" x2="320" y2="40" stroke="#1A2962" stroke-width="6"></line>
          <circle cx="150" cy="110" r="8" fill="#FFFDF9" stroke="#0E1110" stroke-width="3"></circle>
          <text x="210" y="198" text-anchor="middle" fill="#B41C24" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">中途站点全部省略，无法核对坐几站</text>
        `;
      }
      return `
        <rect width="420" height="220" fill="#FFFDF9"></rect>
        <line x1="60" y1="74" x2="360" y2="74" stroke="#E3540E" stroke-width="8"></line>
        <line x1="60" y1="110" x2="360" y2="110" stroke="#135936" stroke-width="8"></line>
        <line x1="60" y1="146" x2="360" y2="146" stroke="#1A2962" stroke-width="8"></line>
        <text x="210" y="192" text-anchor="middle" fill="#B41C24" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif">退化成纯装饰条，失去导航功能</text>
      `;
    }

    // med 药品说明书
    if (step === 1) {
      return `
        <rect width="420" height="220" fill="#FFFDF9"></rect>
        <text x="18" y="30" fill="#1E2220" font-size="10.5" font-family="Noto Sans SC, sans-serif">【药品名称】对乙酰氨基酚片【性状】本品为白色片【适应症】用于普通感冒或</text>
        <text x="18" y="48" fill="#1E2220" font-size="10.5" font-family="Noto Sans SC, sans-serif">流行性感冒引起的发热也用于缓解轻至中度疼痛【用法用量】口服成人一次1片若</text>
        <text x="18" y="66" fill="#1E2220" font-size="10.5" font-family="Noto Sans SC, sans-serif">持续发热或疼痛可间隔4-6小时重复用药一次24小时内不得超过4次【不良反应】</text>
        <text x="18" y="84" fill="#1E2220" font-size="10.5" font-family="Noto Sans SC, sans-serif">偶见皮疹荨麻疹药热及粒细胞减少长期大量用药会导致肝肾功能异常【禁忌】严</text>
        <text x="18" y="102" fill="#1E2220" font-size="10.5" font-family="Noto Sans SC, sans-serif">重肝肾功能不全者禁用【注意事项】本品为对症治疗药用于解热连续使用不超过</text>
        <text x="18" y="120" fill="#1E2220" font-size="10.5" font-family="Noto Sans SC, sans-serif">3天用于止痛不超过5天不得同时服用其他含有解热镇痛药的药品饮酒期间禁用</text>
        <text x="18" y="148" fill="#B23B00" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">信息虽全，但毫无分区层级，紧急时极难定位关键用量与禁忌</text>
      `;
    }
    if (step === 2) {
      return `
        <rect width="420" height="220" fill="#FFFDF9"></rect>
        <rect x="16" y="14" width="388" height="44" fill="#E5F4EC" stroke="#135936" stroke-width="1.5"></rect>
        <text x="28" y="34" fill="#135936" font-size="12" font-weight="800" font-family="Noto Sans SC, sans-serif">用法用量（成人）</text>
        <text x="28" y="50" fill="#0E1110" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">每次 1 片 · 间隔 4–6 小时 · 24 小时内最多 4 次</text>
        <rect x="16" y="68" width="388" height="66" fill="#FDECEC" stroke="#B41C24" stroke-width="1.5"></rect>
        <text x="28" y="88" fill="#B41C24" font-size="12" font-weight="800" font-family="Noto Sans SC, sans-serif">禁忌与警示（不可省略）</text>
        <text x="28" y="106" fill="#0E1110" font-size="11" font-family="Noto Sans SC, sans-serif">• 严重肝肾功能不全者禁用；服药期间禁止饮酒</text>
        <text x="28" y="124" fill="#0E1110" font-size="11" font-family="Noto Sans SC, sans-serif">• 勿与其他含同类成分的复方感冒药叠加服用</text>
        <rect x="16" y="144" width="388" height="60" fill="#FCF8F2" stroke="#D6CDC0" stroke-width="1.5"></rect>
        <text x="28" y="164" fill="#1A2962" font-size="11.5" font-weight="800" font-family="Noto Sans SC, sans-serif">疗程与存储</text>
        <text x="28" y="182" fill="#464C49" font-size="11" font-family="Noto Sans SC, sans-serif">解热连用不超 3 天；止痛不超 5 天；避光密闭儿童勿触。</text>
      `;
    }
    if (step === 3) {
      return `
        <rect width="420" height="220" fill="#FFFDF9"></rect>
        <text x="28" y="54" fill="#0E1110" font-size="22" font-weight="900" font-family="Noto Sans SC, sans-serif">退热止痛片</text>
        <text x="28" y="92" fill="#135936" font-size="16" font-weight="800" font-family="Noto Sans SC, sans-serif">成人每次 1 片，每日最多 4 次</text>
        <rect x="28" y="122" width="180" height="36" fill="#F2ECE2" stroke="#0E1110"></rect>
        <text x="118" y="145" text-anchor="middle" fill="#464C49" font-size="12" font-family="Noto Sans SC, sans-serif">禁忌与副作用请扫码查看</text>
        <text x="28" y="192" fill="#B41C24" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif">警告：把高风险禁忌藏到二维码后，极易引发误服！</text>
      `;
    }
    if (step === 4) {
      return `
        <rect width="420" height="220" fill="#FFFDF9"></rect>
        <text x="210" y="96" text-anchor="middle" fill="#0E1110" font-size="44" font-weight="900" font-family="DM Mono, monospace">1 TAB</text>
        <text x="210" y="132" text-anchor="middle" fill="#464C49" font-size="13" font-family="Noto Sans SC, sans-serif">每日按需服用</text>
        <text x="210" y="184" text-anchor="middle" fill="#B41C24" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif">删光上限与禁忌，表面高级实则危险</text>
      `;
    }
    return `
      <rect width="420" height="220" fill="#FFFDF9"></rect>
      <circle cx="210" cy="96" r="24" fill="#F2ECE2" stroke="#0E1110" stroke-width="1.5"></circle>
      <text x="210" y="152" text-anchor="middle" fill="#0E1110" font-size="14" font-weight="700" font-family="Outfit, sans-serif">RELIEF</text>
      <text x="210" y="188" text-anchor="middle" fill="#B41C24" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif">安全信息归零，彻底违反医疗设计底线</text>
    `;
  }

  function render() {
    const info = DOMAINS[domain].levels[step];
    levelBadge.textContent = info.title;
    verdictPill.textContent = info.verdict;
    verdictPill.className = "tl-verdict-pill" + (info.tone === "danger" ? " is-danger" : info.tone === "warn" ? " is-warn" : "");
    reasonEl.textContent = info.reason;
    speedBar.style.width = `${info.speed}%`;
    infoBar.style.width = `${info.info}%`;
    infoBar.className = "tl-bar-fill " + (info.info < 60 ? "is-danger" : "is-navy");
    svg.innerHTML = drawDomainSvg();
  }

  document.querySelectorAll("[data-domain]").forEach((btn) => {
    btn.addEventListener("click", () => {
      domain = btn.dataset.domain;
      step = DOMAINS[domain].best[0];
      document.querySelectorAll("[data-domain]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      document.querySelectorAll("[data-step]").forEach((b) => {
        b.classList.toggle("is-active", Number(b.dataset.step) === step);
      });
      render();
    });
  });

  document.querySelectorAll("[data-step]").forEach((btn) => {
    btn.addEventListener("click", () => {
      step = Number(btn.dataset.step);
      document.querySelectorAll("[data-step]").forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  render();
}

/* ==================== 06 节：两道单变量小练习 ==================== */
export function initSection06() {
  const ANSWERS = {
    q1: {
      correct: "B",
      reasons: {
        A: "方案 A 属于「欠简化」：外层虚框、斜切深蓝绶带与波浪角饰把落日、塔身与光束压住，缩到 24px 图标时会瞬间糊成一团。",
        B: "选对了！方案 B 剥离了外框和装饰绶带，让落日（圆）、灯塔柱（方）、光束（三角）沿垂直中轴清晰排开，编码最短且三项核心语义完整保留。",
        C: "方案 C 踩中了「过度简化」陷阱：把塔身和光束强行磨成三个等大圆点，形状虽最省力，却丢掉了灯塔与光束的辨识骨架，看起来只像红绿灯。",
        D: "方案 D 虽然去掉了多余杂件，但让三块基本形斜向重度叠咬，在交界处制造出大量尖锐凹角碎片，破坏了规则与秩序。",
      },
    },
    q2: {
      correct: "A",
      reasons: {
        A: "选对了！方案 A 撤掉了花哨套框与冗余饰线，用单一左对齐轴线和清晰字号层级保留了展名、时间与场馆三项必读事实，既简洁又实用。",
        B: "方案 B 踩中了「过度删减」陷阱：为了追求最大留白把日期和场馆一并删光，失去了入场券最核心的指引功能。",
        C: "方案 C 属于「欠简化」：给每一行套不同彩框再加上外层虚框与星号装饰，边框抢走了文字本身的主角地位。",
        D: "方案 D 虽然清掉了装饰，但把所有信息用同一字号糊成一段居中文字，缺少「秩序」与「易读」层级，读者得从头逐字扫才能找到时间地点。",
      },
    },
  };

  document.querySelectorAll(".quiz-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = btn.dataset.q;
      const opt = btn.dataset.opt;
      const spec = ANSWERS[q];
      const ok = opt === spec.correct;

      document.querySelectorAll(`.quiz-card[data-q="${q}"]`).forEach((b) => {
        b.classList.remove("is-correct", "is-wrong");
        if (b.dataset.opt === spec.correct && ok) b.classList.add("is-correct");
        if (b === btn) b.classList.add(ok ? "is-correct" : "is-wrong");
      });

      const fb = document.getElementById(`qf-${q}`);
      fb.textContent = spec.reasons[opt];
      fb.className = "quiz-feedback " + (ok ? "is-right" : "is-err");
    });
  });
}

/* ==================== 07 节：原海报全屏灯箱（缩放 + 拖动 + Esc） ==================== */
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-trigger");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const vp = document.getElementById("lb-viewport");
  const zoomVal = document.getElementById("lb-zoom-val");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomVal.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = Math.min(3.2, +(scale + 0.35).toFixed(2)); applyTransform(); });
  btnOut.addEventListener("click", () => { scale = Math.max(0.6, +(scale - 0.35).toFixed(2)); applyTransform(); });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  vp.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.18 : -0.18;
    scale = Math.max(0.6, Math.min(3.5, +(scale + delta).toFixed(2)));
    applyTransform();
  }, { passive: false });

  vp.addEventListener("pointerdown", (e) => {
    if (e.target === vp) { close(); return; }
    vp.setPointerCapture(e.pointerId);
    pan = { sx: e.clientX, sy: e.clientY, ox: tx, oy: ty };
  });

  vp.addEventListener("pointermove", (e) => {
    if (!pan) return;
    tx = pan.ox + (e.clientX - pan.sx);
    ty = pan.oy + (e.clientY - pan.sy);
    applyTransform();
  });

  const endPan = () => { pan = null; };
  vp.addEventListener("pointerup", endPan);
  vp.addEventListener("pointercancel", endPan);

  document.addEventListener("keydown", (e) => {
    if (!lb.hidden && e.key === "Escape") close();
  });
}

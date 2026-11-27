// 180 强制两端对齐 · 主交互控制模块（main.js）
// 严格单真源驱动 Hero 校样机、7 大交互小节、原海报灯箱与全键盘支持。

import { SPECIMENS, clamp, evaluate, fmtEm } from "./model.js";
import { createHeroStage, createRuptureStage } from "./stage.js";

// ==================== 全局状态（Hero 主角玩具） ====================
let activeSpecimen = "poster";
let state = { ...SPECIMENS.poster.bad };

const heroCanvas = document.getElementById("hero-canvas");
const topStatus = document.getElementById("top-status");
const heroTitle = document.getElementById("hero-title");
const heroOrb = document.getElementById("hero-orb");
const probeStrip = document.getElementById("probe-strip");
const stageCaption = document.getElementById("stage-caption");
const diagBar = document.getElementById("diag-bar");
const diagBadge = document.getElementById("diag-badge");
const diagTier = document.getElementById("diag-tier");
const diagTitle = document.getElementById("diag-title");
const diagBody = document.getElementById("diag-body");
const diagAction = document.getElementById("diag-action");
const ctrlMeasure = document.getElementById("ctrl-measure");
const ctrlSplit = document.getElementById("ctrl-split");
const valMeasure = document.getElementById("val-measure");
const valSplit = document.getElementById("val-split");
const btnLines = document.getElementById("btn-lines");
const btnPunct = document.getElementById("btn-punct");
const validPresetsEl = document.getElementById("valid-presets");

const heroStage = createHeroStage(
  heroCanvas,
  () => ({ specimenId: activeSpecimen, state }),
  (patch) => {
    state = { ...state, ...patch };
    syncAll();
  },
);

function renderPresets() {
  const spec = SPECIMENS[activeSpecimen];
  validPresetsEl.innerHTML = "";
  spec.presets.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ok-chip";
    b.textContent = p.label;
    b.title = p.note;
    b.addEventListener("click", () => {
      state = { ...p.state };
      syncAll();
    });
    validPresetsEl.appendChild(b);
  });
}

const probeIcons = {
  tension: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M5 12h14M9 8l-4 4 4 4M15 8l4 4-4 4"/></svg>`,
  fullwidth: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="3" y="3" width="18" height="18"/></svg>`,
  shape: `<span>T</span>`,
};

let probeNodes = null;
function ensureProbeNodes(probes) {
  if (probeNodes) return probeNodes;
  probeStrip.innerHTML = probes
    .map(
      (p) => `
      <div class="probe-item" data-probe="${p.id}">
        <span class="probe-orb" aria-hidden="true">${probeIcons[p.id] || p.icon}</span>
        <span class="probe-vrule" aria-hidden="true"></span>
        <div class="probe-text">
          <div class="probe-title-row">
            <span class="probe-zh">${p.zh}</span>
            <span class="probe-en">${p.en}</span>
          </div>
          <span class="probe-val"></span>
        </div>
      </div>`,
    )
    .join("");
  probeNodes = probes.map((p) => {
    const el = probeStrip.querySelector(`[data-probe="${p.id}"]`);
    return { el, val: el.querySelector(".probe-val") };
  });
  return probeNodes;
}

function setText(el, str) {
  if (el.textContent !== str) el.textContent = str;
}

function syncAll() {
  const spec = SPECIMENS[activeSpecimen];
  const res = evaluate(activeSpecimen, state);

  // 1. 顶栏状态 & 自示范巨标拉伸形态
  setText(topStatus, res.primary.tag);
  topStatus.classList.toggle("is-pass", res.passCount === 4);

  heroTitle.classList.toggle("is-natural", state.mode === "natural");
  heroTitle.classList.toggle("is-wide", state.mode === "forced" && res.measure >= 0.86);
  const orbScale = res.passCount === 4 ? 1.06 : res.anyCollision ? 0.84 : 1.0;
  const nextTransform = `scale(${orbScale})`;
  if (heroOrb.style.transform !== nextTransform) heroOrb.style.transform = nextTransform;

  // 2. 原海报三枚电光蓝圆竖线实时探针（原地复用 DOM，拖曳 0 重建）
  const nodes = ensureProbeNodes(res.probes);
  res.probes.forEach((p, idx) => {
    const node = nodes[idx];
    node.el.classList.toggle("is-ok", p.pass);
    node.el.classList.toggle("is-bad", !p.pass);
    setText(node.val, p.metric);
  });

  // 3. 单真源白话诊单
  diagBar.classList.toggle("is-pass", res.passCount === 4);
  setText(diagBadge, res.primary.tag);
  setText(diagTier, `张力档位：${res.tensionTier}（示意）· 框宽 ${Math.round(res.measure * 100)}%`);
  setText(diagTitle, res.primary.headline);
  setText(diagBody, res.primary.body);
  setText(diagAction, res.primary.action);
  setText(stageCaption, `${spec.caption}（方向键微调 · Space 张力透视）`);

  // 4. 滑轨与按键同步
  const mMin = String(Math.round(spec.minMeasure * 100));
  const mMax = String(Math.round(spec.maxMeasure * 100));
  const mVal = String(Math.round(res.measure * 100));
  if (ctrlMeasure.min !== mMin) ctrlMeasure.min = mMin;
  if (ctrlMeasure.max !== mMax) ctrlMeasure.max = mMax;
  if (ctrlMeasure.value !== mVal) ctrlMeasure.value = mVal;
  setText(valMeasure, `${mVal}%`);

  const maxSplit = String(spec.text.length - (state.lineCount === 3 ? 6 : 2));
  const sVal = String(clamp(state.split1, 2, Number(maxSplit)));
  if (ctrlSplit.max !== maxSplit) ctrlSplit.max = maxSplit;
  if (ctrlSplit.value !== sVal) ctrlSplit.value = sVal;
  setText(valSplit, `${res.lines[0].visibleChars} 字`);

  document.querySelectorAll("[data-mode]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.mode === state.mode);
  });
  document.querySelectorAll("[data-space]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.space === state.spaceMode);
  });
  setText(btnLines, `${state.lineCount} 行排布`);
  btnLines.classList.toggle("is-active", state.lineCount === 3);

  const hasPunct = res.lines.some((l) => l.hasTrailPunct);
  setText(
    btnPunct,
    hasPunct ? `标点挂边：${state.opticalPunct ? "开" : "关"}` : "标点挂边：无尾标点",
  );
  btnPunct.setAttribute("aria-pressed", String(state.opticalPunct));
  btnPunct.classList.toggle("is-active", state.opticalPunct && hasPunct);

  heroStage.draw();
}

// 语境切换
document.querySelectorAll("[data-specimen]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeSpecimen = btn.dataset.specimen;
    state = { ...SPECIMENS[activeSpecimen].bad };
    document.querySelectorAll("[data-specimen]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderPresets();
    syncAll();
  });
});

// 滑轨事件
ctrlMeasure.addEventListener("input", () => {
  state = { ...state, measure: Number(ctrlMeasure.value) / 100 };
  syncAll();
});

ctrlSplit.addEventListener("input", () => {
  const s1 = Number(ctrlSplit.value);
  const n = SPECIMENS[activeSpecimen].text.length;
  const s2 = state.lineCount === 3 ? clamp(Math.round(s1 + (n - s1) / 2), s1 + 2, n - 2) : n;
  state = { ...state, split1: s1, split2: s2 };
  syncAll();
});

// 模式 / 间距 / 行数 / 标点切换
document.querySelectorAll("[data-mode]").forEach((b) => {
  b.addEventListener("click", () => {
    state = { ...state, mode: b.dataset.mode };
    syncAll();
  });
});

document.querySelectorAll("[data-space]").forEach((b) => {
  b.addEventListener("click", () => {
    state = { ...state, spaceMode: b.dataset.space };
    syncAll();
  });
});

btnLines.addEventListener("click", () => {
  const spec = SPECIMENS[activeSpecimen];
  const n = spec.text.length;
  if (state.lineCount === 2) {
    const t1 = Math.round(n / 3);
    const t2 = Math.round((n * 2) / 3);
    state = { ...state, lineCount: 3, split1: t1, split2: t2 };
  } else {
    state = { ...state, lineCount: 2, split1: Math.ceil(n / 2), split2: n };
  }
  syncAll();
});

btnPunct.addEventListener("click", () => {
  state = { ...state, opticalPunct: !state.opticalPunct };
  syncAll();
});

// 诊单快捷按钮
document.getElementById("btn-fix").addEventListener("click", () => {
  state = { ...SPECIMENS[activeSpecimen].presets[0].state };
  syncAll();
});

document.getElementById("btn-reset").addEventListener("click", () => {
  state = { ...SPECIMENS[activeSpecimen].bad };
  syncAll();
});

document.getElementById("btn-scan").addEventListener("click", () => heroStage.triggerScan());
document.getElementById("btn-scan-top").addEventListener("click", () => heroStage.triggerScan());

// 双向试错芯片
document.querySelectorAll("[data-err]").forEach((b) => {
  b.addEventListener("click", () => {
    const spec = SPECIMENS[activeSpecimen];
    const kind = b.dataset.err;
    if (kind === "rupture") {
      state = { ...spec.bad };
    } else if (kind === "normal179") {
      state = { ...spec.presets[0].state, mode: "normal", split1: spec.bad.split1 };
    } else if (kind === "collision") {
      state = { ...spec.presets[0].state, mode: "forced", measure: spec.minMeasure, lineCount: 2, split1: Math.min(spec.text.length - 4, spec.presets[0].state.split1 + 3) };
    } else if (kind === "toowide") {
      state = { ...spec.presets[0].state, mode: "forced", measure: 1.0 };
    } else if (kind === "wordfail") {
      state = { ...spec.presets[0].state, mode: "forced", spaceMode: "word", measure: 0.90 };
    }
    syncAll();
  });
});

// 键盘操作：方向键微调框宽/断行、Space 张力透视
window.addEventListener("keydown", (ev) => {
  const lb = document.getElementById("lightbox");
  if (!lb.hidden) {
    if (ev.key === "Escape") closeLightbox();
    return;
  }
  if (ev.target && /INPUT|TEXTAREA|SELECT|BUTTON/.test(ev.target.tagName)) {
    if (ev.code === "Space" && ev.target.tagName === "BUTTON") return;
    if (ev.target.tagName === "INPUT") return;
  }
  const spec = SPECIMENS[activeSpecimen];
  if (ev.code === "Space") {
    ev.preventDefault();
    heroStage.triggerScan();
  } else if (ev.key === "ArrowRight") {
    ev.preventDefault();
    state = { ...state, measure: clamp(+(state.measure + 0.03).toFixed(3), spec.minMeasure, spec.maxMeasure) };
    syncAll();
  } else if (ev.key === "ArrowLeft") {
    ev.preventDefault();
    state = { ...state, measure: clamp(+(state.measure - 0.03).toFixed(3), spec.minMeasure, spec.maxMeasure) };
    syncAll();
  } else if (ev.key === "ArrowUp") {
    ev.preventDefault();
    state = { ...state, lineCount: 2, split1: clamp(state.split1 + 1, 2, spec.text.length - 2) };
    syncAll();
  } else if (ev.key === "ArrowDown") {
    ev.preventDefault();
    state = { ...state, lineCount: 2, split1: clamp(state.split1 - 1, 2, spec.text.length - 2) };
    syncAll();
  }
});

// ==================== Section 01：四态剥离对照台 ====================
const S1_TEXT = [
  "设计中的文字排版不仅传递信息，",
  "更塑造强烈的视觉节奏与秩序，",
  "让短句凝成横梁。",
];

const S1_INFO = {
  left: {
    metric: "右缘锁死 0/3 行 · 右侧自由起伏（176 逻辑）",
    explain: "所有字符保持均匀自然字距，阅读最省力，但右侧边缘参差下垂，没有建筑式的水平紧绷感。",
  },
  justify: {
    metric: "右缘锁死 2/3 行 · 末行塌缩（179 逻辑）",
    explain: "前两行自动拉齐，但第三行「让短句凝成横梁。」默认退回左齐，整块文字的右下角被削掉一大块。",
  },
  forced: {
    metric: "右缘锁死 3/3 行 · 全幅横梁闭合成块（180 逻辑）",
    explain: "第三行也被强制撑满左右边界，三行共同咬住两侧蓝线——但也请留意：第三行只有 8 字，字距比上面明显更宽，提醒我们排强制齐行时必须挑好每行字数。",
  },
  blur: {
    metric: "眯眼形态化校验 · 仅 180 凝成完整矩形块",
    explain: "把字形细节抹平为黑块后一眼看穿：强制两端对齐把文字变成了几何图形（Text Shape），用左右双边撑起整张海报的骨架。",
  },
};

function renderS1(mode) {
  const container = document.getElementById("s1-lines");
  container.innerHTML = "";
  const isBlur = mode === "blur";
  S1_TEXT.forEach((line, idx) => {
    const row = document.createElement("div");
    const isLast = idx === S1_TEXT.length - 1;
    const cls =
      mode === "left"
        ? "mode-left"
        : mode === "justify"
          ? isLast
            ? "mode-left"
            : "mode-forced"
          : "mode-forced";
    row.className = `s1-line ${cls}${isBlur ? " is-blurred" : ""}`;
    [...line].forEach((ch) => {
      const s = document.createElement("span");
      s.className = "s1-ch";
      s.textContent = ch;
      row.appendChild(s);
    });
    container.appendChild(row);
  });
  document.getElementById("s1-metric").textContent = S1_INFO[mode].metric;
  document.getElementById("s1-explain").textContent = S1_INFO[mode].explain;
}

document.querySelectorAll("[data-s1]").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll("[data-s1]").forEach((x) => x.classList.toggle("is-active", x === b));
    renderS1(b.dataset.s1);
  });
});

// ==================== Section 02：双文种均排解剖仪 ====================
const S2_SCRIPTS = {
  cjk: {
    lines: ["空间秩序决定阅读节奏，", "留白张力撑起视觉骨架。"],
    isLatin: false,
    isLower: false,
    boxEm: 18.0,
    charNatural: 11,
  },
  mixed: {
    lines: ["瑞士网格 GRID 秩序实验展，", "当代排印 TYPE 视觉双年展。"],
    isLatin: false,
    isLower: false,
    boxEm: 19.5,
    charNatural: 12.6,
  },
  caps: {
    lines: ["FORCED JUSTIFICATION", "TENSION FULL WIDTH"],
    isLatin: true,
    isLower: false,
    boxEm: 19.0,
    charNatural: 12.2,
  },
  lower: {
    lines: ["Typography builds quiet order", "across every printed column."],
    isLatin: true,
    isLower: true,
    boxEm: 23.0,
    charNatural: 14.5,
  },
};

let s2Script = "cjk";
let s2Algo = "inter-character";
let s2Punct = true;

function renderS2() {
  const data = S2_SCRIPTS[s2Script];
  const box = document.getElementById("s2-specimen-box");
  const bars = document.getElementById("s2-gap-bars");
  const verdict = document.getElementById("s2-verdict");

  const isCJKNoSpaces = s2Script === "cjk" && s2Algo === "inter-word";
  const isLowerBad = s2Script === "lower" && s2Algo === "inter-character";
  const isWordRiver = (s2Script === "caps" || s2Script === "mixed" || s2Script === "lower") && s2Algo === "inter-word";
  const hasPunct = !data.isLatin;
  const punctDent = hasPunct && !s2Punct && !isCJKNoSpaces;

  const isBad = isCJKNoSpaces || isLowerBad || isWordRiver || punctDent;
  box.classList.toggle("is-bad", isBad);
  verdict.classList.toggle("is-bad", isBad);

  // 渲染样本行
  box.innerHTML = "";
  const metrics = [];

  data.lines.forEach((line, idx) => {
    const row = document.createElement("div");
    row.className = `s2-row${data.isLatin ? " is-latin" : ""}${data.isLower ? " is-lower" : ""}`;

    if (s2Algo === "inter-word") {
      const words = line.split(" ");
      if (words.length <= 1) {
        row.style.justifyContent = "flex-start";
        row.style.gap = "0.04em";
        [...line].forEach((ch) => {
          const sp = document.createElement("span");
          sp.className = "s2-token";
          sp.textContent = ch;
          row.appendChild(sp);
        });
        metrics.push({ label: `第 ${idx + 1} 行`, gap: 0, pct: 4, bad: true, text: "0 空格 · 失灵" });
      } else {
        row.style.justifyContent = "space-between";
        words.forEach((w) => {
          const sp = document.createElement("span");
          sp.className = "s2-token";
          sp.textContent = w;
          row.appendChild(sp);
        });
        const gapEm = (data.boxEm - data.charNatural) / (words.length - 1);
        metrics.push({
          label: `第 ${idx + 1} 行`,
          gap: gapEm,
          pct: clamp((gapEm / 4.5) * 100, 12, 100),
          bad: gapEm > 1.1,
          text: `词空 ${gapEm.toFixed(2)}em`,
        });
      }
    } else {
      row.style.justifyContent = "space-between";
      const chars = [...line];
      chars.forEach((ch, ci) => {
        const sp = document.createElement("span");
        const isTrail = ci === chars.length - 1 && (ch === "，" || ch === "。");
        sp.className = `s2-token${isTrail ? (s2Punct ? " is-punct-hang" : " is-punct-dent") : ""}`;
        sp.textContent = ch === " " ? "\u00A0" : ch;
        row.appendChild(sp);
      });
      const denom = Math.max(1, chars.length - 1);
      const effW = data.boxEm + (hasPunct && s2Punct ? 0.48 : 0);
      const gapEm = (effW - data.charNatural) / denom;
      metrics.push({
        label: `第 ${idx + 1} 行`,
        gap: gapEm,
        pct: clamp((gapEm / 1.5) * 100, 12, 100),
        bad: isLowerBad || punctDent || gapEm > 1.15,
        text: `字缝 ${gapEm.toFixed(2)}em`,
      });
    }
    box.appendChild(row);
  });

  bars.innerHTML = metrics
    .map(
      (m) => `
      <div class="s2-bar-row">
        <span>${m.label}</span>
        <div class="s2-bar-track"><div class="s2-bar-fill${m.bad ? " is-bad" : ""}" style="width:${m.pct.toFixed(0)}%"></div></div>
        <span class="s2-bar-val">${m.text}</span>
      </div>`,
    )
    .join("");

  if (isCJKNoSpaces) {
    verdict.textContent = "失灵：纯中文之间没有空格，CSS text-justify: inter-word 找不到可拉伸的词空，整行缩在左边纹丝不动。中文强制齐行必须按字均分。";
  } else if (isLowerBad) {
    verdict.textContent = "反例（Goudy / Bringhurst 戒律）：拉丁小写字母依靠紧贴形成词形轮廓，按字均分拉开后会碎成难以辨认的单字母串——西文长句绝不要强拉小写字距。";
  } else if (isWordRiver) {
    verdict.textContent = "白河警告：行内只有 1–3 个空格，所有余白全灌进这几个洞里，单词间扯出 2–6 em 悬崖，视觉重心瞬间被劈开。";
  } else if (punctDent) {
    verdict.textContent = "光学凹陷：虽然字框已齐平，但行尾全角逗号、句号右半格为空白（红虚框处），肉眼仍感到右边界往里陷了一截。打开「标点光学挂边」即可拉齐黑墨边界。";
  } else if (s2Script === "caps") {
    verdict.textContent = "成立：正如埃米尔·鲁德（1967）与布林赫斯特（1992）所指，全大写字母本就接近等高矩形块，均匀拉开字距反而提升大气与建筑张力。";
  } else if (s2Script === "mixed") {
    verdict.textContent = "注意细节：中西混排强拉时，应优先把余白分配到汉字间及中西交界；真实排版软件（如 InDesign）与 W3C CLReq 都建议保护英文词内部不被拆得比汉字更散。";
  } else {
    verdict.textContent = "成立：中文方块字天然等宽，按字均分配合行尾标点光学挂边，能把左右黑墨边缘锁得像钢尺切出一样平直。";
  }

  const pb = document.getElementById("s2-punct-btn");
  pb.textContent = hasPunct ? `标点光学挂边：${s2Punct ? "开" : "关"}` : "标点挂边：英文无全角标点";
  pb.classList.toggle("is-active", s2Punct && hasPunct);
  pb.setAttribute("aria-pressed", String(s2Punct));
}

document.querySelectorAll("[data-s2-script]").forEach((b) => {
  b.addEventListener("click", () => {
    s2Script = b.dataset.s2Script;
    document.querySelectorAll("[data-s2-script]").forEach((x) => x.classList.toggle("is-active", x === b));
    renderS2();
  });
});

document.querySelectorAll("[data-s2-algo]").forEach((b) => {
  b.addEventListener("click", () => {
    s2Algo = b.dataset.s2Algo;
    document.querySelectorAll("[data-s2-algo]").forEach((x) => x.classList.toggle("is-active", x === b));
    renderS2();
  });
});

document.getElementById("s2-punct-btn").addEventListener("click", () => {
  s2Punct = !s2Punct;
  renderS2();
});

// ==================== Section 03：暗室末行字数拉裂实验台 ====================
const S3_POOL = [..."更塑造视觉节奏与情感体验张力"];
let s3Count = 4;
const ruptureStage = createRuptureStage(document.getElementById("rupture-canvas"), () => s3Count);

function renderS3() {
  const boxEm = 18.0;
  const gap = (boxEm - s3Count) / (s3Count - 1);
  const safe = gap <= 1.15 && gap >= 0.16;

  document.getElementById("s3-readout").textContent = `${s3Count} 字 · ${fmtEm(gap)}`;
  const strip = document.getElementById("s3-live-strip");
  strip.classList.toggle("is-safe", safe);
  strip.innerHTML = S3_POOL.slice(0, s3Count)
    .map((ch) => `<span class="s3-glyph">${ch}</span>`)
    .join("");

  const diag = document.getElementById("s3-diag");
  if (s3Count <= 3) {
    diag.textContent = `灾难级孤岛：只剩 ${s3Count} 个字硬撑 18 格，字距高达 ${fmtEm(gap)}，两字之间能塞进整句短语，读者根本无法把它们连成一个词。`;
  } else if (gap > 1.15) {
    diag.textContent = `越过 1.15em 撕裂线：${s3Count} 个字撑满 18 格时字距为 ${fmtEm(gap)}，完形接近律已经瓦解，眼睛被迫逐字跳读。继续加字到 9 字以上再看变化。`;
  } else if (gap >= 0.72) {
    diag.textContent = `高张力安全区：${s3Count} 字落在 ${fmtEm(gap)}，既有强烈呼吸张力，又仍能一眼连读——适合海报巨标。`;
  } else {
    diag.textContent = `稳健铺满区：${s3Count} 字字距仅 ${fmtEm(gap)}，左右紧贴边界、字群紧密抱团，是双行/三行海报最可靠的节奏区间。`;
  }

  document.querySelectorAll("[data-n]").forEach((b) => {
    b.classList.toggle("is-active", Number(b.dataset.n) === s3Count);
  });
  ruptureStage.draw();
}

document.getElementById("s3-minus").addEventListener("click", () => {
  s3Count = clamp(s3Count - 1, 2, 14);
  renderS3();
});
document.getElementById("s3-plus").addEventListener("click", () => {
  s3Count = clamp(s3Count + 1, 2, 14);
  renderS3();
});
document.querySelectorAll("[data-n]").forEach((b) => {
  b.addEventListener("click", () => {
    s3Count = Number(b.dataset.n);
    renderS3();
  });
});

// ==================== Section 04：五代排印工坊时间轴 ====================
const ERAS = [
  {
    title: "1455 · 约翰内斯·古腾堡《四十二行圣经》",
    p1: "欧洲第一部金属活字印本（美因茨）为了还原中世纪手抄本紧实平整的双栏外观，必须让每行左右如墙面般齐整。但古腾堡绝不靠把词空扯出大白洞来硬凑齐行。",
    p2: "他的工坊为同一字母铸造了多种不同宽度的变体铅字，并大量使用连字（ligatures）与手抄本缩写符号微调行宽——证明了从活字诞生第一天起，盲目拉伸间距就是下策。",
    source: "核实来源：德国美因茨古腾堡博物馆（Gutenberg-Museum）与大英图书馆 42 行圣经藏品研究。",
    demoLabel: "古腾堡工坊齐行思路 · 换窄字与缩写而非拉白洞",
    demoLines: [
      { left: "In principio creavit Deus", right: "标准宽", tight: true },
      { left: "In pncipio · [fi][st] Ds.", right: "缩写+连字微收", tight: true },
    ],
  },
  {
    title: "1967 · 埃米尔·鲁德《字体排印设计》（Typographie）",
    p1: "瑞士国际主义排印大师埃米尔·鲁德（Emil Ruder）在 Arthur Niggli 出版的经典教材《Typographie》中，把字距提升到“形态与负空间”的建筑高度。",
    p2: "鲁德明确区分大小写：小写字母是靠紧邻形成词形而被一眼认出的，拉散字距会毁掉可读性；唯有全大写字母块适合有意拉开字距，以平衡厚重笔画并建立现代主义海报张力。",
    source: "核实来源：Emil Ruder, Typographie: A Manual of Design (1967, Arthur Niggli AG).",
    demoLabel: "鲁德原则 · 全大写撑张力 vs 小写保词形",
    demoLines: [
      { left: "T Y P O G R A P H I E", right: "全大写 · 可拉张", tight: false },
      { left: "Typographie stays tight", right: "小写 · 禁硬拉", tight: true },
    ],
  },
  {
    title: "1981 · 克努特与普拉斯《Breaking Paragraphs into Lines》",
    p1: "计算机科学家唐纳德·克努特（Donald E. Knuth）与迈克尔·普拉斯（Michael F. Plass）在《Software: Practice and Experience》发表里程碑论文，为 TeX 建立「盒子—胶水—惩罚（Box–Glue–Penalty）」数学模型。",
    p2: "算法用动态规划通盘评估整段断行，只要某一行胶水被拉得过长（出现松垮白洞），坏度（Badness）惩罚值就呈立方暴增——它从数学上证实了为什么强制齐行必须通盘平衡每行字数。",
    source: "核实来源：Knuth & Plass, Software: Practice and Experience, Vol. 11, No. 11 (Nov 1981), pp. 1119–1184.",
    demoLabel: "Box–Glue–Penalty · 弹性胶水成本暴增示意",
    demoLines: [
      { left: "[字]══[字]══[字]══[字]", right: "Badness 低", tight: false },
      { left: "[字]═══════[字]═══════[字]", right: "惩罚立方飙升", tight: false },
    ],
  },
  {
    title: "1992 · 罗伯特·布林赫斯特《字体排印风格要素》",
    p1: "被誉为现代排印圣经的《The Elements of Typographic Style》（1992 首版）在第 2 章给出经典的词距经验标尺：正常正文理想词距约 1/4 em，最小 1/5 em，最好压在 1/3 em 内，最多不超过 1/2 em。",
    p2: "他尖锐批评靠软件粗暴压缩或拉伸字距来强凑齐行的做法，称窄栏强拉会产生“白色痤疮”与“白河”，并重申高迪的忠告：正文绝不可随意拉散小写字母。",
    source: "核实来源：Robert Bringhurst, The Elements of Typographic Style (1992, Hartley & Marks).",
    demoLabel: "布林赫斯特词距经验标尺（西文正文）",
    demoLines: [
      { left: "M/5 紧凑底线 · M/4 理想词距", right: "均匀灰度", tight: true },
      { left: "> M/2 白河警报 · 切忌硬拉", right: "破坏纹理", tight: false },
    ],
  },
  {
    title: "W3C JLReq / CLReq 与 CSS Text Module Level 3",
    p1: "东亚排印早就有「均等割り付け」（日文 JLReq）与中文表头「分散对齐 / 齐行」（CLReq）传统，专门把两字、三字、四字短词均摊成同一宽度，用于名录、表头与俳句短行。",
    p2: "Web 标准在 CSS Text Module Level 3 中把强制两端对齐正式写进规范：text-align: justify 配合 text-align-last: justify（或简写 justify-all）；同时规定当末行无法伸展（例如仅剩一个英文词）时回退为居中。",
    source: "核实来源：W3C CSS Text Module Level 3 (w3.org/TR/css-text-3/)、JLReq (w3.org/TR/jlreq/)、CLReq (w3.org/TR/clreq/)。",
    demoLabel: "东亚均等对齐 + CSS 规范写法",
    demoLines: [
      { left: "姓　　名  /  联 系 电 话", right: "均等割り付け", tight: false },
      { left: "text-align-last: justify;", right: "CSS Text 3", tight: true },
    ],
  },
];

function renderEra(idx) {
  const e = ERAS[idx];
  document.getElementById("era-panel").innerHTML = `
    <div>
      <h3>${e.title}</h3>
      <p>${e.p1}</p>
      <p>${e.p2}</p>
      <p class="era-source">${e.source}</p>
    </div>
    <div class="era-demo">
      <span class="era-demo-label">${e.demoLabel}</span>
      <div class="era-demo-art">
        ${e.demoLines
          .map(
            (l) => `
          <div class="era-line${l.tight ? " is-tight" : ""}">
            <span>${l.left}</span>
            <span class="era-tag-inline">${l.right}</span>
          </div>`,
          )
          .join("")}
      </div>
    </div>`;
}

document.querySelectorAll("[data-era]").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll("[data-era]").forEach((x) => {
      const on = x === b;
      x.classList.toggle("is-active", on);
      x.setAttribute("aria-selected", String(on));
    });
    renderEra(Number(b.dataset.era));
  });
});

// ==================== Section 05：6 组真实场景压测卡 ====================
const SCENARIOS = [
  {
    id: "gallery",
    name: "美术馆展墙双行标",
    good: true,
    type: "lines",
    lines: ["建筑光影与秩序", "空间构成特展"],
    offText: "自然左齐时两行一长一短，挂在宏大展墙上右端显得有些单薄。",
    onText: "成立：两行 7 字对 6 字，强制拉满后变成一整块利落的建筑标题牌。",
  },
  {
    id: "form",
    name: "表单短字段名对齐",
    good: true,
    type: "form",
    rows: [
      { k: "姓名", v: "林默" },
      { k: "手机", v: "138-0000-0180" },
      { k: "电子邮箱", v: "type@studio.cn" },
    ],
    offText: "未均分时「姓名」两字偏短，冒号前参差不齐，扫视字段名不够干脆。",
    onText: "成立：经典东亚均等排列，2 字与 4 字等宽齐列，表单立刻干净利落。",
  },
  {
    id: "mobile",
    name: "手机端长文末行",
    good: false,
    type: "lines",
    lines: ["强制对齐虽然很有气势，", "但长段落最后往往只剩", "三个字。"],
    offText: "正常左对齐时，最后「三个字。」自然收口，阅读流畅不卡顿。",
    onText: "翻车（别用）：末行「三　　个　　字　　。」被硬生生扯碎成横跨整栏的破洞！",
  },
  {
    id: "package",
    name: "极简包装正面铭牌",
    good: true,
    type: "lines",
    lines: ["单一产区浅烘豆", "净含量两百克"],
    offText: "自然左排显得随性，少了一点包装盒正面所需的工业精密度。",
    onText: "成立：字数相近且宽度受控，强制两端对齐立刻赋予包装盒几何秩序感。",
  },
  {
    id: "latin",
    name: "英文小写通知卡片",
    good: false,
    type: "lines",
    lines: ["Please review the draft", "before Friday."],
    offText: "自然左排词形完整，视线一眼扫过即可读懂截止日期。",
    onText: "翻车（别用）：小写拉丁被强行按字拆散，单词完全失去辨识轮廓。",
  },
  {
    id: "i18n",
    name: "多语言弹窗按钮",
    good: false,
    type: "lines",
    lines: ["确定", "CONFIRMATION"],
    offText: "两字中文与 12 字母英文长度天差地别，按钮应居中留呼吸。",
    onText: "翻车（别用）：中文「确　　　　定」跨度荒谬，英文却挤得贴边——动态 UI 禁用。",
  },
];

const scState = Object.fromEntries(SCENARIOS.map((s) => [s.id, false]));

function renderScenarios() {
  const grid = document.getElementById("scenario-grid");
  grid.innerHTML = "";
  SCENARIOS.forEach((sc) => {
    const on = scState[sc.id];
    const card = document.createElement("article");
    card.className = `sc-card${on ? " is-forced" : ""}${sc.good ? " is-good" : " is-fail"}`;

    let previewHtml = "";
    if (sc.type === "form") {
      previewHtml = sc.rows
        .map(
          (r) => `
          <div class="sc-form-row">
            <span class="sc-form-label">${[...r.k].map((c) => `<span>${c}</span>`).join("")}</span>
            <span>：</span>
            <span class="sc-form-val">${r.v}</span>
          </div>`,
        )
        .join("");
    } else {
      previewHtml = sc.lines
        .map((ln) => `<div class="sc-line">${[...ln].map((c) => `<span>${c === " " ? "\u00A0" : c}</span>`).join("")}</div>`)
        .join("");
    }

    card.innerHTML = `
      <div class="sc-top">
        <span class="sc-name">${sc.name}</span>
        <button type="button" class="sc-toggle${on ? " is-on" : ""}" data-sc="${sc.id}">
          ${on ? "已开 · 强制两端" : "自然排版"}
        </button>
      </div>
      <div class="sc-preview">${previewHtml}</div>
      <p class="sc-verdict">${on ? sc.onText : sc.offText}</p>`;
    grid.appendChild(card);
  });

  grid.querySelectorAll("[data-sc]").forEach((btn) => {
    btn.addEventListener("click", () => {
      scState[btn.dataset.sc] = !scState[btn.dataset.sc];
      renderScenarios();
    });
  });

  const allOn = SCENARIOS.every((s) => scState[s.id]);
  document.getElementById("s5-toggle-all").textContent = allOn ? "全部恢复自然排版" : "全部切到强制两端对齐";
}

document.getElementById("s5-toggle-all").addEventListener("click", () => {
  const allOn = SCENARIOS.every((s) => scState[s.id]);
  SCENARIOS.forEach((s) => {
    scState[s.id] = !allOn;
  });
  renderScenarios();
});

// ==================== Section 06：两道中性盲测小练习 ====================
const QUESTIONS = [
  {
    prompt: "展墙有一句 23 字副标：「声音在空旷展厅里折返，把时间拉成一条笔直的线。」设计师希望用强制两端对齐做出紧凑有力的矩形横梁。以下四版字体与配色完全相同，哪一版真正站得住？",
    correct: 2, // C
    options: [
      {
        label: "方案 A",
        type: "lines",
        lines: [
          { text: "声音在空旷展厅里折返，把时间拉成一条", cls: "q-forced" },
          { text: "笔直的线。", cls: "q-forced" },
        ],
        why: "方案 A 是最常见的失手：第 1 行硬塞 18 字、第 2 行只剩 5 字，强制两端对齐把末行字距拉爆到 3 em 以上，上下两行密度断层严重。",
      },
      {
        label: "方案 B",
        type: "lines",
        lines: [
          { text: "声音在空旷展厅里折返，", cls: "q-forced" },
          { text: "把时间拉成一条笔直的线。", cls: "q-left" },
        ],
        why: "方案 B 其实是 179 普通两端对齐：首行铺满，末行却退回左对齐，右下角缺了一截，没有形成 180 所要求的双缘锁定块面。",
      },
      {
        label: "方案 C",
        type: "lines",
        lines: [
          { text: "声音在空旷展厅里折返，", cls: "q-forced" },
          { text: "把时间拉成一条笔直的线。", cls: "q-forced" },
        ],
        why: "答对了！方案 C 在语义停顿逗号处主动均分为 11 字＋12 字，两行字距同落在约 0.42–0.50 em 的稳健张力带内，左右双缘整齐锁死又毫不影响连读。",
      },
      {
        label: "方案 D",
        type: "lines",
        lines: [
          { text: "声音在空旷展厅里折返，", cls: "q-overwide" },
          { text: "把时间拉成一条笔直的线。", cls: "q-overwide" },
        ],
        why: "方案 D 虽然分匀了行数，但相对字号来说框宽拉得过宽（字距越过 1.8 em 孤岛线），整段文字显得稀疏飘散，反而失去了紧绷的视觉凝聚力。",
      },
    ],
  },
  {
    prompt: "你在设计一张中文预约表单卡，包含三个字段标签（「姓名」「手机号」「电子邮箱」）以及一段两行说明文字。以下四版对「哪里该用强制两端对齐」的处理各不相同，哪一版最合理？",
    correct: 1, // B
    options: [
      {
        label: "方案 A",
        type: "form",
        labelJustify: false,
        noteForced: true,
        why: "方案 A 刚好用反了：短字段标签参差未齐，却把两行长说明文字强行拉齐，导致说明末行四个字被拉成孤岛。",
      },
      {
        label: "方案 B",
        type: "form",
        labelJustify: true,
        noteForced: false,
        why: "答对了！方案 B 精准命中 180 的黄金边界：等宽的 2–4 字字段头采用强制两端对齐（均等排列）让冒号成直线，下方阅读性说明保持 176 自然左齐。",
      },
      {
        label: "方案 C",
        type: "form",
        labelJustify: true,
        noteForced: true,
        why: "方案 C 虽然把字段头排齐了，但顺手也给底部说明文字开了强制两端对齐，末行「准时入场。」立刻裂出扎眼白洞。",
      },
      {
        label: "方案 D",
        type: "form",
        labelJustify: false,
        noteForced: false,
        why: "方案 D 虽没犯撕裂错误，但「姓名」与「电子邮箱」长度相差一倍却不做均等排列，标签列右端锯齿感明显，浪费了强制两端对齐最拿手的场景。",
      },
    ],
  },
];

let activeQ = 0;
const answered = [null, null];

function renderQuiz() {
  const q = QUESTIONS[activeQ];
  document.getElementById("quiz-prompt").textContent = q.prompt;
  const done = answered.filter((x) => x !== null).length;
  document.getElementById("quiz-progress").textContent = `已作答 ${done} / ${QUESTIONS.length} 题`;

  const grid = document.getElementById("quiz-grid");
  grid.innerHTML = "";
  const picked = answered[activeQ];

  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    let extraCls = "";
    if (picked !== null) {
      if (idx === q.correct) extraCls = " is-picked-ok";
      else if (idx === picked) extraCls = " is-picked-no";
    }
    btn.className = `quiz-opt${extraCls}`;

    let bodyHtml = "";
    if (opt.type === "lines") {
      bodyHtml = opt.lines
        .map(
          (l) =>
            `<div class="q-line ${l.cls}">${[...l.text].map((c) => `<span>${c}</span>`).join("")}</div>`,
        )
        .join("");
    } else {
      const fields = [
        ["姓名", "林默"],
        ["手机号", "138-0000-0180"],
        ["电子邮箱", "type@studio.cn"],
      ];
      const fHtml = fields
        .map(
          ([k, v]) => `
          <div class="q-form-item">
            <span class="q-fl${opt.labelJustify ? " is-j" : ""}">${[...k].map((c) => `<span>${c}</span>`).join("")}</span>
            <span>${v}</span>
          </div>`,
        )
        .join("");
      const n1 = "请携带预约二维码至展厅前台核验，";
      const n2 = "准时入场。";
      const nCls = opt.noteForced ? "q-forced" : "q-left";
      bodyHtml = `
        <div class="q-form-sample">${fHtml}</div>
        <div class="q-note-p">
          <div class="q-line ${nCls}">${[...n1].map((c) => `<span>${c}</span>`).join("")}</div>
          <div class="q-line ${nCls}">${[...n2].map((c) => `<span>${c}</span>`).join("")}</div>
        </div>`;
    }

    const mark =
      picked === null ? "点击选择" : idx === q.correct ? "✓ 站得住" : idx === picked ? "× 你的选择" : "";

    btn.innerHTML = `
      <div class="quiz-opt-head"><span>${opt.label}</span><span>${mark}</span></div>
      <div class="quiz-specimen">${bodyHtml}</div>`;

    btn.addEventListener("click", () => {
      answered[activeQ] = idx;
      renderQuiz();
    });
    grid.appendChild(btn);
  });

  const fb = document.getElementById("quiz-feedback");
  if (picked === null) {
    fb.hidden = true;
  } else {
    const isRight = picked === q.correct;
    fb.hidden = false;
    fb.classList.toggle("is-wrong", !isRight);
    fb.textContent = isRight
      ? q.options[picked].why
      : `${q.options[picked].why} 正确选择是 ${q.options[q.correct].label}：${q.options[q.correct].why.replace("答对了！", "")}`;
  }
}

document.querySelectorAll("[data-q]").forEach((b) => {
  b.addEventListener("click", () => {
    activeQ = Number(b.dataset.q);
    document.querySelectorAll("[data-q]").forEach((x) => x.classList.toggle("is-active", x === b));
    renderQuiz();
  });
});

// ==================== Section 07：原海报缩放拖动灯箱 ====================
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbViewport = document.getElementById("lb-viewport");
const lbPct = document.getElementById("lb-pct");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbPct.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = document.getElementById("poster").src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.getElementById("poster-open").focus();
}

document.getElementById("poster-open").addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-zoom-in").addEventListener("click", () => {
  lbScale = clamp(+(lbScale + 0.35).toFixed(2), 0.6, 4);
  applyLbTransform();
});
document.getElementById("lb-zoom-out").addEventListener("click", () => {
  lbScale = clamp(+(lbScale - 0.35).toFixed(2), 0.6, 4);
  applyLbTransform();
});
document.getElementById("lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbViewport.addEventListener(
  "wheel",
  (ev) => {
    ev.preventDefault();
    const delta = ev.deltaY < 0 ? 0.2 : -0.2;
    lbScale = clamp(+(lbScale + delta).toFixed(2), 0.6, 4);
    applyLbTransform();
  },
  { passive: false },
);

lbViewport.addEventListener("pointerdown", (ev) => {
  lbDrag = { sx: ev.clientX, sy: ev.clientY, ox: lbX, oy: lbY };
  lbViewport.classList.add("is-grabbing");
  lbViewport.setPointerCapture?.(ev.pointerId);
});
lbViewport.addEventListener("pointermove", (ev) => {
  if (!lbDrag) return;
  lbX = lbDrag.ox + (ev.clientX - lbDrag.sx);
  lbY = lbDrag.oy + (ev.clientY - lbDrag.sy);
  applyLbTransform();
});
lbViewport.addEventListener("pointerup", () => {
  lbDrag = null;
  lbViewport.classList.remove("is-grabbing");
});

lightbox.addEventListener("click", (ev) => {
  if (ev.target === lbViewport) closeLightbox();
});

// ==================== 初始化全部模块 ====================
renderPresets();
syncAll();
renderS1("forced");
renderS2();
renderS3();
renderEra(0);
renderScenarios();
renderQuiz();

// 116 正文 01–08 节全部独立交互与原海报灯箱
// 相邻两节互不复用同一种控件套路；画布均接入 lib/stage.js 的 loop() 与 pixelRatio()。

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, clamp } from "./model.js";

/* ================= 01 · 去框减法实验台 ================= */
function initStripLab() {
  const box = document.getElementById("strip-lab");
  const cap = document.getElementById("strip-caption");
  const btns = [...box.querySelectorAll("[data-strip]")];
  const texts = [
    "当前状态：粗边框、灰底和横线把页面填得满满当当，装饰线条抢走了文字的呼吸空间。",
    "第 1 步：撤掉所有外边框和内部分隔横线，靠浅底色勉强分块，画面立刻轻了一半。",
    "第 2 步（纯邻近）：连浅灰底也全部撤掉！把组内行距压紧到 5px、组间沟槽拉宽到 42px，零框线依然一目了然。",
    "反测警报：撤掉框线后若把组内（16px）和组间（10px）倒挂，三款咖啡豆瞬间糊成一整堵字墙——减法必须拿「距离比」兜底。",
  ];

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = Number(btn.dataset.strip);
      box.dataset.step = String(step);
      btns.forEach((b) => {
        const on = Number(b.dataset.strip) === step;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      cap.textContent = texts[step];
    });
  });
}

/* ================= 02 · 双轴点阵翻转台（Kubovy et al. 1998） ================= */
function initLatticeLab() {
  const canvas = document.getElementById("lattice-canvas");
  const ctx = canvas.getContext("2d");
  const dxInput = document.getElementById("lat-dx");
  const dyInput = document.getElementById("lat-dy");
  const dxLbl = document.getElementById("lat-dx-val");
  const dyLbl = document.getElementById("lat-dy-val");
  const realDxEl = document.getElementById("lat-real-dx");
  const realDyEl = document.getElementById("lat-real-dy");
  const ratioEl = document.getElementById("lat-ratio");
  const verdictEl = document.getElementById("lat-verdict");
  const detailEl = document.getElementById("lat-detail");
  const scaleBtns = [...document.querySelectorAll("[data-lscale]")];

  const st = { dx: 26, dy: 48, scale: 1 };
  let W = 420;
  let H = 290;
  let dpr = 1;
  let dirty = true;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const nw = Math.max(240, Math.round(r.width));
    const nh = Math.max(230, Math.round(r.height));
    const ndpr = pixelRatio(2);
    if (nw !== W || nh !== H || ndpr !== dpr) {
      W = nw;
      H = nh;
      dpr = ndpr;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      dirty = true;
    }
  }

  function updateReadout() {
    const rDx = Math.round(st.dx * st.scale);
    const rDy = Math.round(st.dy * st.scale);
    dxLbl.textContent = `${st.dx}px`;
    dyLbl.textContent = `${st.dy}px`;
    realDxEl.textContent = `${rDx}px`;
    realDyEl.textContent = `${rDy}px`;

    const longD = Math.max(st.dx, st.dy);
    const shortD = Math.min(st.dx, st.dy);
    const ratio = longD / shortD;
    ratioEl.textContent = `${ratio.toFixed(2)}×`;

    if (ratio < 1.14) {
      verdictEl.textContent = "临界拉锯：横行与竖列来回跳动";
      detailEl.textContent = `长短比仅 ${ratio.toFixed(2)}×（近乎 1:1）。眼睛在横排与竖列之间不断切换，画面找不到稳定方向。`;
    } else if (st.dx < st.dy) {
      verdictEl.textContent = "眼睛自动读成「横行」";
      detailEl.textContent = `纵横比 ${ratio.toFixed(2)}×：横向明显比纵向亲近，大脑沿水平方向串成排。现在切一下上方「整幅缩放」，实测像素剧变，但比值不变、分组直觉丝毫不改。`;
    } else {
      verdictEl.textContent = "眼睛瞬间翻转成「竖列」";
      detailEl.textContent = `横纵比 ${ratio.toFixed(2)}×：纵向变得更亲近，整片点阵当场从横排翻转为一列列竖柱。`;
    }
  }

  function render() {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);

    const stepX = st.dx * st.scale;
    const stepY = st.dy * st.scale;
    const rad = clamp(6.5 * st.scale, 4, 11);

    // 居中铺设适配视口的点阵
    const cols = clamp(Math.floor((W - 44) / stepX) + 1, 3, 9);
    const rows = clamp(Math.floor((H - 44) / stepY) + 1, 3, 7);
    const totalW = (cols - 1) * stepX;
    const totalH = (rows - 1) * stepY;
    const ox = (W - totalW) / 2;
    const oy = (H - totalH) / 2;

    const ratio = Math.max(st.dx, st.dy) / Math.min(st.dx, st.dy);
    // 轻柔引导线暗示眼睛当下自动形成的行/列感
    if (ratio >= 1.14) {
      ctx.strokeStyle = st.dx < st.dy ? "rgba(32, 137, 111, 0.24)" : "rgba(243, 83, 28, 0.24)";
      ctx.lineWidth = rad * 1.4;
      ctx.lineCap = "round";
      if (st.dx < st.dy) {
        for (let r = 0; r < rows; r++) {
          ctx.beginPath();
          ctx.moveTo(ox, oy + r * stepY);
          ctx.lineTo(ox + totalW, oy + r * stepY);
          ctx.stroke();
        }
      } else {
        for (let c = 0; c < cols; c++) {
          ctx.beginPath();
          ctx.moveTo(ox + c * stepX, oy);
          ctx.lineTo(ox + c * stepX, oy + totalH);
          ctx.stroke();
        }
      }
    }

    // 全部等大纯黑圆点（证明只靠比值！）
    ctx.fillStyle = PALETTE.ink;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        ctx.arc(ox + c * stepX, oy + r * stepY, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 左上第一组标出 dx / dy 实测细虚线
    if (cols >= 2 && rows >= 2) {
      ctx.strokeStyle = PALETTE.greenDark;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(ox, oy - rad - 8);
      ctx.lineTo(ox + stepX, oy - rad - 8);
      ctx.stroke();
      ctx.strokeStyle = PALETTE.orangeDark;
      ctx.beginPath();
      ctx.moveTo(ox - rad - 8, oy);
      ctx.lineTo(ox - rad - 8, oy + stepY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
    dirty = false;
  }

  const ctl = loop(canvas, () => {
    if (dirty) render();
  });

  function sync() {
    st.dx = Number(dxInput.value);
    st.dy = Number(dyInput.value);
    updateReadout();
    dirty = true;
    ctl.draw();
  }

  dxInput.addEventListener("input", sync);
  dyInput.addEventListener("input", sync);

  scaleBtns.forEach((b) => {
    b.addEventListener("click", () => {
      st.scale = Number(b.dataset.lscale);
      scaleBtns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      updateReadout();
      dirty = true;
      ctl.draw();
    });
  });

  document.getElementById("lat-row").addEventListener("click", () => {
    dxInput.value = "24";
    dyInput.value = "52";
    sync();
  });
  document.getElementById("lat-tie").addEventListener("click", () => {
    dxInput.value = "36";
    dyInput.value = "36";
    sync();
  });
  document.getElementById("lat-col").addEventListener("click", () => {
    dxInput.value = "52";
    dyInput.value = "24";
    sync();
  });

  new ResizeObserver(() => {
    resize();
    ctl.draw();
  }).observe(canvas);
  resize();
  updateReadout();
  ctl.draw();
}

/* ================= 03 · 深松墨暗室：距离 vs 颜色拔河仪（Kubovy & van den Berg 2008） ================= */
function initTugLab() {
  const canvas = document.getElementById("tug-canvas");
  const ctx = canvas.getContext("2d");
  const proxIn = document.getElementById("tug-prox");
  const simIn = document.getElementById("tug-sim");
  const proxVal = document.getElementById("tug-prox-val");
  const simVal = document.getElementById("tug-sim-val");
  const pin = document.getElementById("tug-pin");
  const balTxt = document.getElementById("tug-balance-txt");
  const explain = document.getElementById("tug-explain");

  const st = { prox: 1.65, sim: 65 };
  let W = 400;
  let H = 290;
  let dpr = 1;
  let dirty = true;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const nw = Math.max(240, Math.round(r.width));
    const nh = Math.max(240, Math.round(r.height));
    const ndpr = pixelRatio(2);
    if (nw !== W || nh !== H || ndpr !== dpr) {
      W = nw;
      H = nh;
      dpr = ndpr;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      dirty = true;
    }
  }

  function updateReadout() {
    proxVal.textContent = `${st.prox.toFixed(2)}×`;
    simVal.textContent = `${st.sim}%`;

    // 线性可加示意模型（Kubovy & van den Berg 2008 思想）：
    // 邻近线索强度 = (prox - 1) * 1.15；竖列色形编码强度 = (sim / 100) * 0.95
    const proxScore = (st.prox - 1.0) * 1.15;
    const simScore = (st.sim / 100) * 0.95;
    const net = simScore - proxScore; // 负 = 邻近成行赢；正 = 相似成列赢
    const pct = clamp(50 + net * 42, 8, 92);
    pin.style.left = `${pct.toFixed(1)}%`;

    if (net < -0.2) {
      balTxt.textContent = "示意天平 · 邻近胜（读成横行）";
      explain.textContent = `横向间距比拉到 ${st.prox.toFixed(2)}×，明显盖过 ${st.sim}% 的竖列色形提示。哪怕每一列涂着不同颜色，眼睛依然按「近的成一排」分组。`;
    } else if (net > 0.2) {
      balTxt.textContent = "示意天平 · 相似胜（读成竖列）";
      explain.textContent = `横向距离只比纵向紧一点点（${st.prox.toFixed(2)}×），此时 ${st.sim}% 的竖列强色彩与形状差异反客为主，把视线竖着串联起来。`;
    } else {
      balTxt.textContent = "示意天平 · 势均力敌（撕裂区）";
      explain.textContent = "距离拉你横着读，颜色拉你竖着读，两种线索的砝码几乎打平！真实设计里要坚决避免这种「左右互搏」的尴尬区。";
    }
  }

  function render() {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#0A1815";
    ctx.fillRect(0, 0, W, H);

    const cols = 6;
    const rows = 5;
    // 横向紧、纵向按 prox 比例拉宽
    const maxW = W - 64;
    const maxH = H - 56;
    const stepX = Math.min(maxW / (cols - 1), maxH / ((rows - 1) * st.prox));
    const stepY = stepX * st.prox;
    const ox = (W - (cols - 1) * stepX) / 2;
    const oy = (H - (rows - 1) * stepY) / 2;
    const r = clamp(Math.min(stepX, stepY) * 0.27, 6.5, 12.5);

    // 竖列色彩按 sim 从统一浅米灰平滑过渡到高饱和三色
    const simT = st.sim / 100;
    const colPalette = [
      [99, 230, 195],  // 亮松青
      [255, 145, 102], // 亮朱橘
      [255, 181, 200], // 亮蔷薇
    ];
    const baseRgb = [228, 222, 212];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = ox + col * stepX;
        const y = oy + row * stepY;
        const target = colPalette[col % 3];
        const cr = Math.round(baseRgb[0] + (target[0] - baseRgb[0]) * simT);
        const cg = Math.round(baseRgb[1] + (target[1] - baseRgb[1]) * simT);
        const cb = Math.round(baseRgb[2] + (target[2] - baseRgb[2]) * simT);
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;

        // 编码强度 > 60% 时同步加入轻形状编码（圆 / 方 / 菱），模拟强相似性
        if (simT > 0.6 && col % 3 === 1) {
          ctx.fillRect(x - r * 0.88, y - r * 0.88, r * 1.76, r * 1.76);
        } else if (simT > 0.6 && col % 3 === 2) {
          ctx.beginPath();
          ctx.moveTo(x, y - r * 1.1);
          ctx.lineTo(x + r * 1.1, y);
          ctx.lineTo(x, y + r * 1.1);
          ctx.lineTo(x - r * 1.1, y);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
    dirty = false;
  }

  const ctl = loop(canvas, () => {
    if (dirty) render();
  });

  function sync() {
    st.prox = Number(proxIn.value) / 100;
    st.sim = Number(simIn.value);
    updateReadout();
    dirty = true;
    ctl.draw();
  }

  proxIn.addEventListener("input", sync);
  simIn.addEventListener("input", sync);

  document.getElementById("tug-p-prox").addEventListener("click", () => {
    proxIn.value = "215";
    simIn.value = "70";
    sync();
  });
  document.getElementById("tug-p-tie").addEventListener("click", () => {
    proxIn.value = "155";
    simIn.value = "70";
    sync();
  });
  document.getElementById("tug-p-sim").addEventListener("click", () => {
    proxIn.value = "112";
    simIn.value = "95";
    sync();
  });

  new ResizeObserver(() => {
    resize();
    ctl.draw();
  }).observe(canvas);
  resize();
  updateReadout();
  ctl.draw();
}

/* ================= 04 · 1923 韦特海默一维点列复现条 ================= */
function initWertheimerStrip() {
  const host = document.getElementById("wert-dots");
  const cap = document.getElementById("wert-caption");
  const btns = [...document.querySelectorAll("[data-wert]")];
  const dots = [];
  for (let i = 0; i < 12; i++) {
    const span = document.createElement("span");
    span.className = "w-dot";
    host.appendChild(span);
    dots.push(span);
  }

  const MODES = {
    even: {
      gaps: () => 16,
      color: () => PALETTE.ink,
      text: "12 枚等距黑点：视觉上是一条平滑连续的单行队列，几乎没有内部停顿。",
    },
    pair: {
      gaps: (i) => (i % 2 === 1 ? 36 : 8),
      color: () => PALETTE.ink,
      text: "Wertheimer (1923) 原文最经典的开篇图：只在偶数间隙拉宽停顿，12 点立刻成「6 对」——你很难强迫自己把隔着大缝的两个点看成一对。",
    },
    triple: {
      gaps: (i) => (i % 3 === 2 ? 38 : 7),
      color: () => PALETTE.ink,
      text: "每三点留出一道大缝：眼睛瞬间切出「4 组三联体」，组群节奏一下子慢下来、厚重起来。",
    },
    rhythm: {
      gaps: (i) => (i % 3 === 0 ? 7 : i % 3 === 1 ? 14 : 38),
      color: (i) => (i % 3 === 0 ? PALETTE.orange : PALETTE.ink),
      text: "韦特海默在 1923 年特意指出：把空间缝隙换成时间停顿（哒-哒-哒……哒-哒-哒），耳朵同样靠「时间上的邻近性」听出音乐节拍与摩斯电码。",
    },
  };

  function apply(mode) {
    const cfg = MODES[mode];
    dots.forEach((d, i) => {
      d.style.marginRight = i === dots.length - 1 ? "0px" : `${cfg.gaps(i)}px`;
      d.style.backgroundColor = cfg.color(i);
    });
    cap.textContent = cfg.text;
    btns.forEach((b) => {
      const on = b.dataset.wert === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => apply(b.dataset.wert)));
  apply("even");
}

/* ================= 05 · 三联真 DOM 病历修复台 ================= */
function initClinicCards() {
  const cases = {
    form: {
      card: document.getElementById("clinic-form"),
      ruler: document.getElementById("r-form"),
      note: document.getElementById("n-form"),
      badRuler: "标签下 16px · 项间 6px（倒挂！）",
      okRuler: "标签下 5px · 项间 24px（4.8× 清晰）",
      badNote: "「联系电话」紧贴着上一栏的输入框，离自己该管的输入框反而更远，填表时极易填错行。",
      okNote: "把标签压到自己输入框上方 5px、项间推开到 24px，零分割线就能把两项彻底锁稳。",
    },
    heading: {
      card: document.getElementById("clinic-heading"),
      ruler: document.getElementById("r-heading"),
      note: document.getElementById("n-heading"),
      badRuler: "段前 16px = 段后 16px（1:1 悬浮）",
      okRuler: "段前 26px · 段后 5px（标题吸附正文）",
      badNote: "上下间距 1:1 相等，小标题像浮木一样飘在两段中间，扫读时很难一秒分清归属。",
      okNote: "段前大、段后小，小标题立刻吸附到下方正文上，整篇文章的章节骨架瞬间立住。",
    },
    caption: {
      card: document.getElementById("clinic-caption"),
      ruler: document.getElementById("r-caption"),
      note: document.getElementById("n-caption"),
      badRuler: "图到注 20px · 注到下图 4px",
      okRuler: "图到注 6px · 注到下图 24px",
      badNote: "图 A 的说明文字紧挨着图 B 顶部，读者第一眼会以为这行字是在给图 B 做标题。",
      okNote: "收紧图与图注到 6px、拉开与图 B 的沟槽到 26px，图与注自然绑成一对。",
    },
  };

  document.querySelectorAll(".fix-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const c = cases[btn.dataset.clinic];
      const next = c.card.dataset.fixed !== "true";
      c.card.dataset.fixed = String(next);
      btn.setAttribute("aria-pressed", String(next));
      btn.textContent = next ? "已修复 · 切回病态" : "点此按邻近修复";
      c.ruler.textContent = next ? c.okRuler : c.badRuler;
      c.note.textContent = next ? c.okNote : c.badNote;
    });
  });
}

/* ================= 06 · 四格红线反面验证卡 ================= */
function initAvoidCards() {
  const renderers = [
    // 0: 月历网格（等权 vs 错分假期）
    (bad) => {
      let out = "";
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 7; c++) {
          const extraX = bad && c >= 3 ? 18 : 0;
          const x = 18 + c * 26 + extraX;
          const y = 14 + r * 24;
          const fill = bad && c >= 3 ? "#F3531C" : "#20896F";
          out += `<rect x="${x}" y="${y}" width="18" height="16" rx="2" fill="${fill}" opacity="${bad && c >= 3 ? 0.85 : 0.78}"/>`;
        }
      }
      return out;
    },
    // 1: 紧凑数据表（横线清晰 vs 列距过大竖串行）
    (bad) => {
      let out = "";
      const xs = bad ? [18, 92, 166] : [18, 86, 154];
      for (let r = 0; r < 4; r++) {
        const y = 14 + r * (bad ? 15 : 20);
        if (!bad && r > 0) out += `<line x1="14" y1="${y - 4}" x2="206" y2="${y - 4}" stroke="#2F2A25" stroke-opacity="0.22"/>`;
        xs.forEach((x) => {
          out += `<rect x="${x}" y="${y}" width="38" height="7" rx="2" fill="${bad ? "#B53208" : "#1E1A17"}" opacity="0.82"/>`;
        });
      }
      if (bad) {
        out += `<path d="M37 12v62M111 12v62M185 12v62" stroke="#F3531C" stroke-width="1.4" stroke-dasharray="3 3"/>`;
      }
      return out;
    },
    // 2: 窄顶栏（竖线/色区分 vs 靠 4px 缝误点删除）
    (bad) => {
      if (!bad) {
        return `
          <rect x="16" y="28" width="188" height="36" rx="6" fill="#FFF9F2" stroke="#1E1A17" stroke-opacity="0.25"/>
          <rect x="26" y="38" width="26" height="16" rx="3" fill="#20896F"/>
          <rect x="58" y="38" width="26" height="16" rx="3" fill="#20896F"/>
          <line x1="112" y1="34" x2="112" y2="58" stroke="#1E1A17" stroke-opacity="0.35" stroke-width="1.5"/>
          <rect x="150" y="38" width="44" height="16" rx="3" fill="#B53208"/>
        `;
      }
      return `
        <rect x="16" y="28" width="188" height="36" rx="6" fill="#FFF9F2" stroke="#B53208" stroke-dasharray="4 3"/>
        <rect x="34" y="38" width="32" height="16" rx="3" fill="#1E1A17"/>
        <rect x="74" y="38" width="32" height="16" rx="3" fill="#1E1A17"/>
        <rect x="118" y="38" width="32" height="16" rx="3" fill="#1E1A17"/>
        <rect x="160" y="38" width="32" height="16" rx="3" fill="#1E1A17"/>
      `;
    },
    // 3: 单主角海报（大出血主角 vs 硬拆碎群）
    (bad) => {
      if (!bad) {
        return `
          <rect x="24" y="10" width="172" height="72" rx="3" fill="#ECDEC7"/>
          <circle cx="110" cy="48" r="34" fill="#20896F"/>
          <rect x="34" y="18" width="42" height="6" fill="#060405"/>
        `;
      }
      return `
        <rect x="24" y="10" width="172" height="72" rx="3" fill="#ECDEC7"/>
        <circle cx="48" cy="28" r="8" fill="#B53208"/><circle cx="66" cy="28" r="8" fill="#B53208"/>
        <circle cx="152" cy="28" r="8" fill="#B53208"/><circle cx="170" cy="28" r="8" fill="#B53208"/>
        <circle cx="48" cy="64" r="8" fill="#B53208"/><circle cx="66" cy="64" r="8" fill="#B53208"/>
        <circle cx="152" cy="64" r="8" fill="#B53208"/><circle cx="170" cy="64" r="8" fill="#B53208"/>
      `;
    },
  ];

  const svgs = [0, 1, 2, 3].map((i) => document.getElementById(`av-svg-${i}`));
  svgs.forEach((svg, i) => (svg.innerHTML = renderers[i](false)));

  document.querySelectorAll(".avoid-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.avoid);
      const card = btn.closest(".avoid-card");
      const next = card.dataset.bad !== "true";
      card.dataset.bad = String(next);
      btn.setAttribute("aria-pressed", String(next));
      btn.textContent = next ? "切回正常做法" : "看滥用后果";
      svgs[i].innerHTML = renderers[i](next);
    });
  });
}

/* ================= 07 · 一分钟练眼（2 道只差单一变量的选择题） ================= */
function initQuiz() {
  const promptEl = document.getElementById("quiz-prompt");
  const optHost = document.getElementById("quiz-options");
  const fbBox = document.getElementById("quiz-feedback");
  const fbTitle = document.getElementById("qf-title");
  const fbBody = document.getElementById("qf-body");
  const retryBtn = document.getElementById("qf-retry");
  const qBtns = [...document.querySelectorAll("[data-q]")];

  const QUESTIONS = [
    {
      prompt: "下面四份登录表单的字号、配色、边框完全一致，只改动了纵向间距。哪一份最不容易把标签和输入框配错？",
      answer: 2,
      options: [
        { tag: "方案 A", inGap: 14, outGap: 14, kind: "form" },
        { tag: "方案 B", inGap: 20, outGap: 6, kind: "form" },
        { tag: "方案 C", inGap: 5, outGap: 22, kind: "form" },
        { tag: "方案 D", inGap: 2, outGap: 6, kind: "form" },
      ],
      explain:
        "正确答案是方案 C（组内 5px / 组间 22px，比值约 4.4×）。方案 A 上下均等（14px / 14px），标签飘在正中；方案 B 组内 20px 大于组间 6px，发生致命倒挂；方案 D 虽然有比值，但全部挤成一团、失去基本呼吸缝和点击安全区。",
    },
    {
      prompt: "列表里每件商品的价格文字离上方图片 20px、却离下方图片只有 5px，虽然给价格涂了和上方标题一样的绿色，依然常被看错。只改下面哪一项最先止住误读？",
      answer: 3,
      options: [
        { tag: "方案 A", desc: "保持上 20px / 下 5px，把价格字号再放大两号", topG: 20, botG: 5, big: true, boldColor: false },
        { tag: "方案 B", desc: "保持上 20px / 下 5px，把价格换更艳的橘红色", topG: 20, botG: 5, big: false, boldColor: true },
        { tag: "方案 C", desc: "调成上 13px / 下 13px，居中摆在两件商品正中", topG: 13, botG: 13, big: false, boldColor: false },
        { tag: "方案 D", desc: "改成上 6px / 下 24px，把价格拉回上方商品内部", topG: 6, botG: 24, big: false, boldColor: false },
      ],
      explain:
        "正确答案是方案 D。正如 03 节的线索拔河实验所示：当价格紧紧贴着下一张商品图时，空间邻近会持续把价格拉给下一件商品；只靠放大字号或换色（A/B）只能制造线索打架，均分居中（C）依然模棱两可，唯有修正距离比（上 6px / 下 24px）才能一刀根治。",
    },
  ];

  let curQ = 0;

  function renderPreview(opt) {
    if (opt.kind === "form") {
      return `
        <div style="display:flex;flex-direction:column;gap:${opt.outGap}px;">
          <div style="display:flex;flex-direction:column;gap:${opt.inGap}px;">
            <span style="font-size:11px;font-weight:700;color:#060405;">账号邮箱</span>
            <div style="height:22px;background:#FFF9F2;border:1px solid rgba(30,26,23,.32);border-radius:3px;"></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:${opt.inGap}px;">
            <span style="font-size:11px;font-weight:700;color:#060405;">登录密码</span>
            <div style="height:22px;background:#FFF9F2;border:1px solid rgba(30,26,23,.32);border-radius:3px;"></div>
          </div>
        </div>
      `;
    }
    const priceStyle = `font-family:var(--font-mono);font-size:${opt.big ? 15 : 12}px;font-weight:700;color:${opt.boldColor ? "#B53208" : "#10634F"};margin-top:${opt.topG}px;margin-bottom:${opt.botG}px;`;
    return `
      <div>
        <div style="height:24px;background:#20896F;border-radius:3px;display:flex;align-items:center;padding:0 8px;color:#FFF9F2;font-size:11px;">商品 01 · 手冲壶</div>
        <div style="${priceStyle}">¥ 186</div>
        <div style="height:24px;background:#ECDEC7;border-radius:3px;display:flex;align-items:center;padding:0 8px;color:#1E1A17;font-size:11px;">商品 02 · 磨豆机</div>
      </div>
      <p style="margin:8px 0 0;font-size:12px;line-height:1.45;color:#544B43;">${opt.desc}</p>
    `;
  }

  function mountQuestion(idx) {
    curQ = idx;
    const q = QUESTIONS[idx];
    promptEl.textContent = q.prompt;
    fbBox.hidden = true;
    optHost.innerHTML = "";

    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-opt";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", "false");
      btn.innerHTML = `
        <span class="qo-tag"><span>${opt.tag}</span></span>
        <div class="qo-preview">${renderPreview(opt)}</div>
      `;
      btn.addEventListener("click", () => {
        const all = [...optHost.querySelectorAll(".quiz-opt")];
        all.forEach((el, k) => {
          el.setAttribute("aria-checked", String(k === i));
          if (k === q.answer) el.dataset.state = "correct";
          else if (k === i) el.dataset.state = "wrong";
          else delete el.dataset.state;
        });
        const ok = i === q.answer;
        fbBox.hidden = false;
        fbBox.dataset.ok = String(ok);
        fbTitle.textContent = ok ? `选对了！${q.options[i].tag} 是最稳的距离配比` : `再看一眼差距：你选了 ${q.options[i].tag}，更优的是 ${q.options[q.answer].tag}`;
        fbBody.textContent = q.explain;
      });
      optHost.appendChild(btn);
    });

    qBtns.forEach((b) => {
      const on = Number(b.dataset.q) === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  qBtns.forEach((b) => b.addEventListener("click", () => mountQuestion(Number(b.dataset.q))));
  retryBtn.addEventListener("click", () => mountQuestion(curQ));
  mountQuestion(0);
}

/* ================= 08 · 原海报高清灯箱（缩放 + 拖拽 + Esc） ================= */
function initPosterLightbox() {
  const openBtn = document.getElementById("poster-open");
  const thumb = document.getElementById("poster");
  const box = document.getElementById("lightbox");
  const vp = document.getElementById("lb-viewport");
  const img = document.getElementById("lb-img");
  const zoomEl = document.getElementById("lb-zoom");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function apply() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomEl.textContent = `${Math.round(scale * 100)}%`;
  }

  function reset() {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  }

  function open() {
    if (!img.src) img.src = thumb.src; // 只引用一次海报，不额外内联！
    reset();
    box.hidden = false;
    btnClose.focus();
  }

  function close() {
    if (box.hidden) return;
    box.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => {
    scale = clamp(scale + 0.35, 1, 3.5);
    apply();
  });
  btnOut.addEventListener("click", () => {
    scale = clamp(scale - 0.35, 1, 3.5);
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    apply();
  });
  btnReset.addEventListener("click", reset);

  vp.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = clamp(scale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.5);
      if (scale === 1) {
        tx = 0;
        ty = 0;
      }
      apply();
    },
    { passive: false }
  );

  vp.addEventListener("pointerdown", (e) => {
    if (e.target === vp && scale === 1) {
      close();
      return;
    }
    drag = { x: e.clientX, y: e.clientY, tx, ty };
    vp.setPointerCapture(e.pointerId);
  });

  vp.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = drag.tx + (e.clientX - drag.x);
    ty = drag.ty + (e.clientY - drag.y);
    apply();
  });

  vp.addEventListener("pointerup", () => (drag = null));
  vp.addEventListener("pointercancel", () => (drag = null));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
}

export function initAllSections() {
  initStripLab();
  initLatticeLab();
  initTugLab();
  initWertheimerStrip();
  initClinicCards();
  initAvoidCards();
  initQuiz();
  initPosterLightbox();
}

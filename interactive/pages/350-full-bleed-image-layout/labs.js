// 350 章节交互实验室：
// 01 剧场双幕卷帘对比 · 02 五种叠字遮罩真像素测光 · 03 深宵暗房裁切与视线流光
// 05 何时别用分诊卡 · 06 四选一单变量盲测 · 07 原海报放大拖动灯箱

import { loop, pixelRatio } from "../../lib/stage.js";
import { SCENES, clamp, relLuminance, contrastRatio } from "./model.js";
import { getScenePlate, drawCroppedPlate } from "./scenes.js";

function sizeCanvas(canvas, maxDpr = 1.75) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  const dpr = pixelRatio(maxDpr);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  return { w, h, dpr };
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// =========================================================================
// 01 · 剧场双幕实景卷帘对比器
// =========================================================================
export function initCurtainLab() {
  const stage = document.getElementById("curtain-stage");
  const canvas = document.getElementById("curtain-canvas");
  const handle = document.getElementById("curtain-handle");
  const readout = document.getElementById("curtain-readout");
  if (!stage || !canvas || !handle) return;

  const ctx = canvas.getContext("2d");
  const plate = getScenePlate("valley", "guided");
  let split = 0.36;
  let dragging = false;

  function updateUI() {
    const pct = Math.round(split * 100);
    handle.style.left = `${pct}%`;
    handle.setAttribute("aria-valuenow", String(pct));
    let note;
    if (pct <= 28) {
      note = `卷帘 ${pct}% · 满幅接管整块银幕，情绪与氛围瞬间扑面`;
    } else if (pct >= 72) {
      note = `卷帘 ${pct}% · 白边、蓝栏与四行项目符号把好图挤成邮票块`;
    } else {
      note = `卷帘 ${pct}% · 同张图对比：左侧看模板框，右侧直接入画`;
    }
    if (readout) readout.textContent = note;
  }

  function render() {
    const { w, h, dpr } = sizeCanvas(canvas);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 暗场演讲厅墙面背景
    ctx.fillStyle = "#030914";
    ctx.fillRect(0, 0, w, h);

    // 中央投影银幕区域（上方略留剧场暗墙，底部留前排观众剪影）
    const scrPadX = Math.max(12, w * 0.055);
    const scrTop = Math.max(10, h * 0.055);
    const scrW = w - scrPadX * 2;
    const scrH = h * 0.78;
    const splitPx = Math.round(w * split);

    // 右侧满幅溢出的轻微洋红环境光晕（仅在卷帘右侧照亮剧场暗墙）
    ctx.save();
    ctx.beginPath();
    ctx.rect(splitPx, 0, w - splitPx, h);
    ctx.clip();
    const spill = ctx.createRadialGradient(w * 0.65, scrTop + scrH * 0.45, scrH * 0.1, w * 0.65, scrTop + scrH * 0.45, scrW * 0.68);
    spill.addColorStop(0, "rgba(237, 65, 141, 0.28)");
    spill.addColorStop(0.6, "rgba(1, 77, 138, 0.14)");
    spill.addColorStop(1, "rgba(3, 9, 20, 0)");
    ctx.fillStyle = spill;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // --- 左侧剪裁区：传统企业白边套壳幻灯片 ---
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitPx, h);
    ctx.clip();

    ctx.fillStyle = "#F4F6FA";
    ctx.fillRect(scrPadX, scrTop, scrW, scrH);
    // 传统企业顶栏蓝条
    const barH = Math.max(22, scrH * 0.13);
    ctx.fillStyle = "#1E3A5F";
    ctx.fillRect(scrPadX, scrTop, scrW, barH);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 ${Math.max(11, Math.round(scrH * 0.052))}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText("2026 年度视觉叙事策略与品牌汇报", scrPadX + scrW * 0.03, scrTop + barH * 0.52);

    // 缩小的左图框（灰白框线，保持等比不拉变形）
    const boxX = scrPadX + scrW * 0.035;
    const boxY = scrTop + barH + scrH * 0.08;
    const boxW = scrW * 0.43;
    const boxH = scrH * 0.61;
    drawCroppedPlate(ctx, plate, { x: boxX, y: boxY, w: boxW, h: boxH }, { u0: 0.06, v0: 0.06, viewW: 0.88, viewH: 0.88 }, true);
    ctx.strokeStyle = "#B8C4D4";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // 右侧密密麻麻项目符号骨架
    const txtX = boxX + boxW + scrW * 0.04;
    const txtW = scrW * 0.44;
    ctx.fillStyle = "#1B2A42";
    const fTitle = Math.max(11, Math.round(scrH * 0.05));
    ctx.font = `700 ${fTitle}px "Noto Sans SC", sans-serif`;
    ctx.fillText("核心汇报要点", txtX, boxY + fTitle * 0.7);
    const fLine = Math.max(9.5, Math.round(scrH * 0.036));
    ctx.font = `400 ${fLine}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#485A73";
    const lines = [
      "• 视觉呈现需兼顾品牌规范与页眉统一",
      "• 通过多要点分条罗列汇报背景与依据",
      "• 建议在右下角保留固定页码与密级标",
      "• 详细参数与说明见附录第三节文档表",
    ];
    lines.forEach((ln, i) => {
      const yy = boxY + fTitle * 1.9 + i * (fLine * 1.85);
      if (yy < boxY + boxH) ctx.fillText(ln, txtX, yy, txtW);
    });
    // 底部灰线页脚
    ctx.fillStyle = "#8293A8";
    ctx.font = `400 ${Math.max(9, Math.round(scrH * 0.03))}px "IBM Plex Sans", sans-serif`;
    ctx.fillText("CONFIDENTIAL · TEMPLATE V4 · 14 / 32", scrPadX + scrW * 0.03, scrTop + scrH - scrH * 0.045);
    ctx.restore();

    // --- 右侧剪裁区：350 满幅全图页 ---
    ctx.save();
    ctx.beginPath();
    ctx.rect(splitPx, 0, w - splitPx, h);
    ctx.clip();

    drawCroppedPlate(
      ctx,
      plate,
      { x: scrPadX, y: scrTop, w: scrW, h: scrH },
      { u0: 0.145, v0: 0.13, viewW: 0.71, viewH: 0.71 },
      true
    );
    // 半透明磨砂色块（位于中右暗部/偏中左，36% 开场卷帘下完整可见标题与落日）
    const cardX = scrPadX + scrW * 0.37;
    const cardY = scrTop + scrH * 0.13;
    const cardW = scrW * 0.35;
    const cardH = scrH * 0.36;
    roundRectPath(ctx, cardX, cardY, cardW, cardH, 10);
    ctx.fillStyle = "rgba(1, 12, 29, 0.72)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    const bigF = Math.max(14, Math.round(scrH * 0.095));
    ctx.font = `900 ${bigF}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText("让画面先于语言抵达", cardX + cardW * 0.08, cardY + cardH * 0.18, cardW * 0.84);

    ctx.fillStyle = "#E658A8";
    ctx.fillRect(cardX + cardW * 0.08, cardY + cardH * 0.56, Math.max(24, cardW * 0.16), 3.5);

    ctx.fillStyle = "#D2E4F7";
    const subF = Math.max(10.5, Math.round(scrH * 0.046));
    ctx.font = `400 ${subF}px "Noto Sans SC", sans-serif`;
    ctx.fillText("一张全幅主图，胜过半页项目符号", cardX + cardW * 0.08, cardY + cardH * 0.68, cardW * 0.84);
    ctx.restore();

    // 银幕外细边线
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 1;
    ctx.strokeRect(scrPadX + 0.5, scrTop + 0.5, scrW - 1, scrH - 1);

    // 剧场前排听众背影剪影（纯剪影无五官，增强大屏沉浸比例感）
    const baseY = h;
    const heads = [0.10, 0.22, 0.34, 0.47, 0.60, 0.73, 0.86, 0.94];
    ctx.fillStyle = "#02060E";
    heads.forEach((u, idx) => {
      const cx = w * u;
      const r = Math.max(11, Math.min(20, w * 0.017)) * (idx % 2 === 0 ? 1 : 0.9);
      const hy = baseY - r * 1.45;
      // 肩背弧线
      ctx.beginPath();
      ctx.ellipse(cx, baseY + r * 0.3, r * 2.15, r * 1.35, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      // 头廓
      ctx.beginPath();
      ctx.arc(cx, hy, r * 0.82, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function setFromClientX(clientX) {
    const r = stage.getBoundingClientRect();
    split = clamp((clientX - r.left) / Math.max(1, r.width), 0.08, 0.92);
    updateUI();
    render();
  }

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    stage.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setFromClientX(e.clientX);
  });
  stage.addEventListener("pointerup", () => (dragging = false));
  stage.addEventListener("pointercancel", () => (dragging = false));

  handle.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      split = clamp(split - 0.06, 0.08, 0.92);
      updateUI();
      render();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      split = clamp(split + 0.06, 0.08, 0.92);
      updateUI();
      render();
    }
  });

  document.querySelectorAll("[data-curtain]").forEach((btn) => {
    btn.addEventListener("click", () => {
      split = Number(btn.dataset.curtain) / 100;
      updateUI();
      render();
    });
  });

  new ResizeObserver(() => render()).observe(stage);
  updateUI();
  render();
}

// =========================================================================
// 02 · 五种叠字遮罩真像素实验室
// =========================================================================
export function initScrimLab() {
  const canvas = document.getElementById("scrim-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const elWcag = document.getElementById("scrim-wcag");
  const elPass = document.getElementById("scrim-pass");
  const elMood = document.getElementById("scrim-mood");
  const elMoodNote = document.getElementById("scrim-mood-note");
  const elFill = document.getElementById("wcag-fill");
  const elH = document.getElementById("scrim-verdict-h");
  const elP = document.getElementById("scrim-verdict-p");

  let method = "glass"; // bare | glass | gradient | negative | blackout
  let stress = "twilight"; // twilight | glare | busy

  // 离屏生成 3 种压力底图（均配真实像素采样）
  const stressCache = new Map();
  function getStressPlate(kind) {
    if (stressCache.has(kind)) return stressCache.get(kind);
    if (kind === "twilight") {
      const p = getScenePlate("valley", "guided");
      stressCache.set(kind, p);
      return p;
    }
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 376;
    const x = c.getContext("2d");
    if (kind === "glare") {
      // 强光逆日：全画面偏亮高调，几乎没有深暗区
      const g = x.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, "#B7CBE0");
      g.addColorStop(0.45, "#F9D0C6");
      g.addColorStop(0.75, "#FFE8D4");
      g.addColorStop(1, "#7EA3C2");
      x.fillStyle = g;
      x.fillRect(0, 0, c.width, c.height);
      // 强烈逆光日轮
      const s = x.createRadialGradient(c.width * 0.42, c.height * 0.42, 14, c.width * 0.42, c.height * 0.42, 220);
      s.addColorStop(0, "#FFFDF8");
      s.addColorStop(0.45, "rgba(255, 214, 185, 0.85)");
      s.addColorStop(1, "rgba(255, 190, 175, 0)");
      x.fillStyle = s;
      x.fillRect(0, 0, c.width, c.height);
      // 淡剪影远山
      x.fillStyle = "#5B7898";
      x.beginPath();
      x.moveTo(0, c.height * 0.72);
      x.lineTo(c.width * 0.28, c.height * 0.56);
      x.lineTo(c.width * 0.55, c.height * 0.69);
      x.lineTo(c.width * 0.82, c.height * 0.52);
      x.lineTo(c.width, c.height * 0.65);
      x.lineTo(c.width, c.height);
      x.lineTo(0, c.height);
      x.closePath();
      x.fill();
    } else {
      // 繁杂高噪：明暗交错的城市霓虹灯窗与反光切面
      x.fillStyle = "#0E1D34";
      x.fillRect(0, 0, c.width, c.height);
      const cols = ["#F5629E", "#65D1F5", "#FFE0C2", "#163B6B", "#F2A1B3", "#09172B", "#C5499C"];
      for (let i = 0; i < 64; i++) {
        const bx = ((i * 83) % 610) - 10;
        const by = ((i * 57) % 350) - 10;
        const bw = 38 + (i % 5) * 22;
        const bh = 28 + (i % 4) * 24;
        x.fillStyle = cols[i % cols.length];
        x.globalAlpha = i % 3 === 0 ? 0.88 : 0.65;
        x.fillRect(bx, by, bw, bh);
      }
      x.globalAlpha = 1;
    }
    const lc = document.createElement("canvas");
    lc.width = 80;
    lc.height = 47;
    const lx = lc.getContext("2d", { willReadFrequently: true });
    lx.drawImage(c, 0, 0, 80, 47);
    const data = lx.getImageData(0, 0, 80, 47).data;
    const entry = {
      canvas: c,
      sampleRGB(u, v) {
        const px = clamp(Math.floor(u * 80), 0, 79);
        const py = clamp(Math.floor(v * 47), 0, 46);
        const idx = (py * 80 + px) * 4;
        return [data[idx], data[idx + 1], data[idx + 2]];
      },
    };
    stressCache.set(kind, entry);
    return entry;
  }

  const METHOD_COPY = {
    bare: {
      name: "裸字直压（高风险）",
      mood: "100%",
      moodNote: "零遮罩，全看底图运气",
      okText: "当前恰好落在暗区才侥幸看清；一旦换强光逆日或繁杂背景，白字立刻被吞没。",
      badText: "没有任何底托时，白字笔画直接撞上高亮像素或杂乱纹理，后排观众需要眯眼辨认，3 秒内就会放弃阅读。",
    },
    glass: {
      name: "半透明磨砂块（原海报同款）",
      mood: "86%",
      moodNote: "只托字底，不伤主景",
      okText: "原海报正是这一招：在文字区放一块深海蓝半透明磨砂色块，文字稳稳跨过 WCAG AA，色块外的大片落日与河湾丝毫无损。",
      badText: "即使面对极端强光，加深磨砂块不透明度即可稳守 4.5:1 以上。",
    },
    gradient: {
      name: "单侧暗角渐变（电影感）",
      mood: "82%",
      moodNote: "过渡自然，不见硬边界",
      okText: "从文字所在侧向画面中心平滑衰减至完全透明，观众几乎察觉不到人工遮罩的边界，兼顾电影感与高可读性。",
      badText: "遇到强光逆日底图时，单靠轻薄边缘渐变仍可能压不住中心亮斑，需要收紧文字区或换局部磨砂块。",
    },
    negative: {
      name: "借天然暗区（零遮罩高手解）",
      mood: "100%",
      moodNote: "不加任何色块，纯粹干净",
      okText: "把文字挪到照片自带的深蓝夜空暗部后，不盖任何遮罩也能轻松超过 8:1！前提是挑图时专门留出干净暗区。",
      badText: "一旦照片本身通体明亮（强光逆日）或满屏繁杂纹理，画面根本不存在天然暗区，硬用零遮罩必然失读。",
    },
    blackout: {
      name: "全屏 80% 死黑幕（过度修正反例）",
      mood: "20%",
      moodNote: "画面色彩与层次全被压死",
      okText: "对比度轻松飙到 13:1 以上，但代价是把整张摄影作品糊成了一块沉闷的黑板——图片最珍贵的光感与情绪被一刀抹平。",
      badText: "对比度虽高，却丧失了全图页原本的情绪价值。",
    },
  };

  function render() {
    const { w, h, dpr } = sizeCanvas(canvas);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const plate = getStressPlate(stress);
    // 绘制底图（保持等比不拉圆）
    if (stress === "twilight") {
      drawCroppedPlate(ctx, plate, { x: 0, y: 0, w, h }, { u0: 0.13, v0: 0.12, viewW: 0.74, viewH: 0.74 }, true);
    } else {
      ctx.drawImage(plate.canvas, 0, 0, w, h);
    }

    // 根据方法决定文字盒位置：bare 故意放中右亮区展示风险；negative 主动寻找左上暗角；其余坐落左中舒适位
    const box =
      method === "bare"
        ? { x: 0.42, y: 0.34, w: 0.48, h: 0.32 }
        : method === "negative"
        ? { x: 0.06, y: 0.09, w: 0.44, h: 0.28 }
        : { x: 0.07, y: 0.28, w: 0.46, h: 0.34 };

    // 绘制对应遮罩层
    if (method === "blackout") {
      ctx.fillStyle = "rgba(0, 5, 14, 0.80)";
      ctx.fillRect(0, 0, w, h);
    } else if (method === "gradient") {
      const g = ctx.createLinearGradient(0, 0, w * 0.72, 0);
      g.addColorStop(0, "rgba(1, 10, 24, 0.82)");
      g.addColorStop(0.55, "rgba(1, 10, 24, 0.56)");
      g.addColorStop(1, "rgba(1, 10, 24, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    } else if (method === "glass") {
      roundRectPath(ctx, box.x * w, box.y * h, box.w * w, box.h * h, 10);
      ctx.fillStyle = "rgba(1, 12, 29, 0.76)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 真实像素测光（与绘制完全同源）
    const ratios = [];
    const textLum = relLuminance(248, 251, 255);
    for (let iy = 0; iy < 5; iy++) {
      for (let ix = 0; ix < 7; ix++) {
        const sx = box.x + box.w * ((ix + 0.5) / 7);
        const sy = box.y + box.h * ((iy + 0.5) / 5);
        const u = stress === "twilight" ? 0.13 + sx * 0.74 : sx;
        const v = stress === "twilight" ? 0.12 + sy * 0.74 : sy;
        let [r, g, b] = plate.sampleRGB(u, v);
        if (method === "blackout") {
          r = r * 0.2;
          g = g * 0.2 + 1;
          b = b * 0.2 + 2.8;
        } else if (method === "glass") {
          r = r * 0.24 + 0.76;
          g = g * 0.24 + 9.12;
          b = b * 0.24 + 22.04;
        } else if (method === "gradient") {
          const t = clamp(1 - sx / 0.72, 0, 1);
          const a = t > 0.24 ? 0.56 + (t - 0.24) * 0.34 : t * 2.3;
          const aa = clamp(a, 0, 0.82);
          r = r * (1 - aa) + 1 * aa;
          g = g * (1 - aa) + 10 * aa;
          b = b * (1 - aa) + 24 * aa;
        }
        ratios.push(contrastRatio(textLum, relLuminance(r, g, b)));
      }
    }
    ratios.sort((a, b) => a - b);
    const worst = ratios[Math.floor(ratios.length * 0.15)] ?? ratios[0];

    // 绘制模拟覆盖文字
    const bx = box.x * w + 16;
    const by = box.y * h + 16;
    const bw = box.w * w - 32;
    const titleSize = Math.max(15, Math.round(h * 0.088));
    const subSize = Math.max(11, Math.round(h * 0.046));
    ctx.fillStyle = "#F8FBFF";
    ctx.font = `900 ${titleSize}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText("让视线先落进画面", bx, by, bw);

    ctx.fillStyle = "#E658A8";
    ctx.fillRect(bx, by + titleSize * 1.3, 30, 3);

    ctx.fillStyle = "#E1EEFA";
    ctx.font = `400 ${subSize}px "Noto Sans SC", sans-serif`;
    ctx.fillText("克制遮罩范围，保住照片本身的层次", bx, by + titleSize * 1.65, bw);

    // 测光框微弱虚线标识
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = worst >= 4.5 ? "rgba(109, 210, 242, 0.55)" : "rgba(255, 118, 138, 0.85)";
    ctx.lineWidth = 1.2;
    roundRectPath(ctx, box.x * w, box.y * h, box.w * w, box.h * h, 10);
    ctx.stroke();
    ctx.restore();

    // 更新读数面板
    const meta = METHOD_COPY[method];
    const pass = worst >= 4.5;
    if (elWcag) elWcag.textContent = `${worst.toFixed(1)} : 1`;
    if (elPass) {
      elPass.textContent =
        method === "blackout"
          ? "对比够高，但画面氛围受损"
          : pass
          ? "通过 WCAG AA 正文标准（≥ 4.5:1）"
          : worst >= 3.0
          ? "仅过 3:1 大字线，副标题仍偏吃力"
          : "未达 3:1 底线，后排几乎失读";
      elPass.classList.toggle("is-bad", !pass || method === "blackout");
    }
    if (elMood) elMood.textContent = meta.mood;
    if (elMoodNote) {
      elMoodNote.textContent = meta.moodNote;
      elMoodNote.classList.toggle("is-bad", method === "blackout");
    }
    if (elFill) elFill.style.width = `${clamp((worst / 11) * 100, 8, 100).toFixed(1)}%`;
    if (elH) elH.textContent = meta.name;
    if (elP) elP.textContent = pass ? meta.okText : meta.badText;
  }

  document.querySelectorAll("[data-method]").forEach((btn) => {
    btn.addEventListener("click", () => {
      method = btn.dataset.method;
      document.querySelectorAll("[data-method]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });

  document.querySelectorAll("[data-stress]").forEach((btn) => {
    btn.addEventListener("click", () => {
      stress = btn.dataset.stress;
      document.querySelectorAll("[data-stress]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });

  new ResizeObserver(() => render()).observe(canvas.parentElement);
  render();
}

// =========================================================================
// 03 · 深宵暗房裁切取景与视线引导流光
// =========================================================================
export function initCropLab() {
  const canvas = document.getElementById("crop-canvas");
  const btnTrace = document.getElementById("btn-trace");
  const explain = document.getElementById("crop-explain");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let sceneId = "valley";
  let mode = "offset"; // raw | center | offset | tight
  let traceStart = -10;
  let clock = 0;

  const MODES = {
    raw: {
      rect: { u: 0.03, v: 0.04, w: 0.94, h: 0.92 },
      title: "未裁全景：边角杂物悄悄分流注意力",
      desc: "直接把整张原始底片贴上幻灯片时，左右边缘的电线杆、警示墩或标识牌全部入画。观众视线进屏后先被边角异物绊住，焦点的力量被稀释。",
    },
    center: {
      rect: { u: 0.16, v: 0.13, w: 0.70, h: 0.74 },
      title: "居中满幅：主体稳重，但标题没处安放",
      desc: "裁掉边缘杂物后画面立刻干净，但如果把巨日或独舟锁死在正中央，左右两边都变窄，放覆盖文字时极容易和主角贴脸抢戏，更适合纯停顿无字页。",
    },
    offset: {
      rect: { u: 0.12, v: 0.11, w: 0.72, h: 0.76 },
      title: "偏心净裁：主体与文字各占半壁",
      desc: "外缘杂物干净切出画框；主焦点与引导线稳稳落在右侧三分之二，左侧自然腾出一大片安静深暗的呼吸区托住覆盖文字，眼睛沿引导线一路滑向焦点。",
    },
    tight: {
      rect: { u: 0.38, v: 0.22, w: 0.46, h: 0.49 },
      title: "极近特写：情绪直扑，但要守住清晰度底线",
      desc: "大幅裁切只留巨日、独舟或光柱核心，冲击力极强；前提是原图本身像素足够高，且不靠远景交代空间语境，否则放大上投影会显得发虚局促。",
    },
  };

  let cur = { ...MODES.offset.rect };

  function updateExplain() {
    if (!explain) return;
    const m = MODES[mode];
    explain.innerHTML = `<h3>${m.title}</h3><p>${m.desc}</p>`;
  }

  function drawFrame(t, dt, { still }) {
    clock = t;
    const target = MODES[mode].rect;
    if (still) {
      cur = { ...target };
    } else {
      const k = 1 - Math.exp(-dt * 11);
      cur.u += (target.u - cur.u) * k;
      cur.v += (target.v - cur.v) * k;
      cur.w += (target.w - cur.w) * k;
      cur.h += (target.h - cur.h) * k;
    }

    const { w, h, dpr } = sizeCanvas(canvas);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const plate = getScenePlate(sceneId, "guided");
    const sc = SCENES[sceneId];

    // 底层按 16:9 居中绘制完整原片（不拉伸圆）
    ctx.fillStyle = "#01050D";
    ctx.fillRect(0, 0, w, h);
    const pAR = plate.canvas.width / plate.canvas.height;
    let pw = w;
    let ph = w / pAR;
    if (ph > h) {
      ph = h;
      pw = h * pAR;
    }
    const px0 = (w - pw) / 2;
    const py0 = (h - ph) / 2;
    ctx.drawImage(plate.canvas, px0, py0, pw, ph);

    // 暗房裁切遮罩（把被切掉的外圈压暗 72%，保留轮廓可见）
    const rx = px0 + cur.u * pw;
    const ry = py0 + cur.v * ph;
    const rw = cur.w * pw;
    const rh = cur.h * ph;
    ctx.fillStyle = "rgba(1, 5, 14, 0.72)";
    ctx.fillRect(0, 0, w, ry);
    ctx.fillRect(0, ry + rh, w, h - (ry + rh));
    ctx.fillRect(0, ry, rx, rh);
    ctx.fillRect(rx + rw, ry, w - (rx + rw), rh);

    // 标出外缘杂物被「切掉」还是「留在画内」
    const clutterCut = cur.u > 0.112 && cur.u + cur.w < 0.888;
    ctx.save();
    ctx.strokeStyle = clutterCut ? "#6DD2F2" : "#FF7889";
    ctx.lineWidth = 2;
    ctx.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2);

    // 四角暗房粗角标
    const arm = Math.min(20, rw * 0.08);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    const corners = [
      [rx, ry, 1, 1],
      [rx + rw, ry, -1, 1],
      [rx, ry + rh, 1, -1],
      [rx + rw, ry + rh, -1, -1],
    ];
    for (const [cx, cy, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx + dx * arm, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * arm);
      ctx.stroke();
    }

    // 极轻三分参考虚线
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(rx + (rw * i) / 3, ry);
      ctx.lineTo(rx + (rw * i) / 3, ry + rh);
      ctx.moveTo(rx, ry + (rh * i) / 3);
      ctx.lineTo(rx + rw, ry + (rh * i) / 3);
      ctx.stroke();
    }
    ctx.restore();

    // 偏心净裁下示意左侧安全留字区
    if (mode === "offset") {
      const tx = rx + rw * 0.06;
      const ty = ry + rh * 0.16;
      const tw = rw * 0.34;
      const th = rh * 0.32;
      roundRectPath(ctx, tx, ty, tw, th, 8);
      ctx.fillStyle = "rgba(1, 12, 29, 0.65)";
      ctx.fill();
      ctx.strokeStyle = "rgba(109, 210, 242, 0.45)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#D4EEFB";
      ctx.font = `600 ${Math.max(11, Math.round(h * 0.036))}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText("覆盖文字安静区", tx + 12, ty + th / 2, tw - 24);
    }

    // 视线引导路径流光动画（坐标映射到实际等比原片框 px0..px0+pw）
    const pts = sc.leadPath.map((p) => ({ x: px0 + p.u * pw, y: py0 + p.v * ph }));
    const elapsed = still ? 1.1 : t - traceStart;
    const progress = elapsed >= 0 && elapsed < 2.4 ? clamp(elapsed / 1.35, 0, 1) : 1;

    // 引导虚线底轨
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(255, 117, 184, 0.58)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
    ctx.setLineDash([]);

    // 沿路径行进的高亮彗星流光
    if (elapsed >= 0 && elapsed < 2.4 && !still) {
      const segs = pts.length - 1;
      const scaled = progress * segs;
      const si = Math.min(segs - 1, Math.floor(scaled));
      const frac = scaled - si;
      const p0 = pts[si];
      const p1 = pts[si + 1];
      const gx = p0.x + (p1.x - p0.x) * frac;
      const gy = p0.y + (p1.y - p0.y) * frac;
      const glow = ctx.createRadialGradient(gx, gy, 2, gx, gy, 26);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      glow.addColorStop(0.35, "rgba(255, 109, 181, 0.85)");
      glow.addColorStop(1, "rgba(109, 210, 242, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(gx, gy, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    // 主焦点光环标记
    const fp = { x: px0 + sc.focal.u * pw, y: py0 + sc.focal.v * ph };
    const pulse = still ? 0 : Math.sin(t * 2.6) * 2.5;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fp.x, fp.y, 13 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#ED418D";
    ctx.beginPath();
    ctx.arc(fp.x, fp.y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 左上角裁切状态小标
    const badge = clutterCut ? "外缘杂物已切出画外 ✓" : "注意：左右边缘仍有干扰杂物";
    ctx.font = `600 ${Math.max(11, Math.round(h * 0.036))}px "Noto Sans SC", sans-serif`;
    const bw = ctx.measureText(badge).width + 20;
    roundRectPath(ctx, rx + 10, ry + 10, bw, 26, 5);
    ctx.fillStyle = clutterCut ? "rgba(6, 42, 38, 0.88)" : "rgba(62, 14, 34, 0.90)";
    ctx.fill();
    ctx.fillStyle = clutterCut ? "#9BF5D6" : "#FFB6CB";
    ctx.textBaseline = "middle";
    ctx.fillText(badge, rx + 20, ry + 23);
    ctx.restore();
  }

  const ctrl = loop(canvas, drawFrame);

  document.querySelectorAll("[data-cscene]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sceneId = btn.dataset.cscene;
      document.querySelectorAll("[data-cscene]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      traceStart = clock;
      ctrl.draw();
    });
  });

  document.querySelectorAll("[data-cmode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.cmode;
      document.querySelectorAll("[data-cmode]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      updateExplain();
      traceStart = clock;
      ctrl.draw();
    });
  });

  if (btnTrace) {
    btnTrace.addEventListener("click", () => {
      traceStart = clock;
      ctrl.draw();
    });
  }

  new ResizeObserver(() => ctrl.draw()).observe(canvas.parentElement);
  updateExplain();
  ctrl.draw();
}

// =========================================================================
// 05 · 何时别用交互分诊卡
// =========================================================================
export function initAvoidCards() {
  const cards = document.querySelectorAll("#avoid-grid .avoid-card");
  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      const open = card.classList.toggle("is-open");
      card.setAttribute("aria-expanded", String(open));
      const tg = card.querySelector(".avoid-toggle");
      if (tg) tg.textContent = open ? "已展开" : "点开看换法";
    });
  });
}

// =========================================================================
// 06 · 四选一单变量盲测小练习
// =========================================================================
export function initQuiz() {
  const grid = document.getElementById("quiz-grid");
  const verdict = document.getElementById("quiz-verdict");
  const qvTitle = document.getElementById("qv-title");
  const qvBody = document.getElementById("qv-body");
  if (!grid) return;

  const plate = getScenePlate("valley", "guided");
  const REVEALS = {
    A: "变量差异：文字盒居中压死落日主焦点",
    B: "变量差异：外圈仍留模板白边与页眉框",
    C: "正解：满幅无框 · 避让焦点 · 局部磨砂护情绪",
    D: "变量差异：全屏 76% 浓黑幕压死了落日色彩",
  };
  const EXPLAINS = {
    A: {
      title: "选 A 会让标题和画面主角在正中央打架",
      body: "A 做到了满幅无框，半透明磨砂块也让字很清楚，但把卡片放在画面正中正好挡住了巨日与河湾交汇口——画面最抓人的焦点被文字亲手盖住了。把文字挪到左侧安静暗部，就是正解 C。",
    },
    B: {
      title: "选 B 虽然字很清楚，但四周白框切断了沉浸感",
      body: "B 的文字落位与对比度都没有毛病，却在外圈套了一层白边与企业页眉栏，观众一眼看到的是「套壳 PPT」，照片的尺度感缩水了一大截。撤掉外框直接四边满幅，就是正解 C。",
    },
    C: {
      title: "答对了！C 同时守住了满幅、避焦与护情绪三条线",
      body: "四边彻底出血无模板边框，巨日与荧光河道在右侧畅通无阻地牵引视线；左侧深暗区用克制的局部半透明磨砂块稳稳托住 10 字短标，既让后排一眼读清，又完整保住了晚霞氛围。",
    },
    D: {
      title: "选 D 为了求稳把全屏涂黑，反而毁掉了全图页的意义",
      body: "D 满幅且左置文字，字也极其清晰，但 76% 的全屏黑幕把落日与峡湾的光泽整体压成了一块暗灰墙。只托文字背后、把其余画面还给照片，就是正解 C。",
    },
  };

  function drawOption(canvas, opt) {
    const { w, h, dpr } = sizeCanvas(canvas, 1.75);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (opt === "B") {
      // 唯一差异：外圈套企业白边与极细顶栏
      ctx.fillStyle = "#EEF2F7";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#162C4A";
      ctx.fillRect(0, 0, w, h * 0.085);
      const px = w * 0.055;
      const py = h * 0.125;
      const pw = w - px * 2;
      const ph = h - py - h * 0.065;
      drawCroppedPlate(ctx, plate, { x: px, y: py, w: pw, h: ph }, { u0: 0.14, v0: 0.12, viewW: 0.72, viewH: 0.72 }, true);
      drawQuizTitle(ctx, px + pw * 0.05, py + ph * 0.18, pw * 0.44, ph * 0.34, true);
    } else {
      // A / C / D 均为 100% 满幅出血
      drawCroppedPlate(ctx, plate, { x: 0, y: 0, w, h }, { u0: 0.14, v0: 0.12, viewW: 0.72, viewH: 0.72 }, true);
      if (opt === "D") {
        // 唯一差异：全屏 76% 浓黑幕压死整张画
        ctx.fillStyle = "rgba(0, 4, 12, 0.76)";
        ctx.fillRect(0, 0, w, h);
        drawQuizTitle(ctx, w * 0.06, h * 0.22, w * 0.44, h * 0.33, false);
      } else if (opt === "A") {
        // 唯一差异：文字盒居中压在巨日与河口焦点正上方
        drawQuizTitle(ctx, w * 0.36, h * 0.29, w * 0.46, h * 0.34, true);
      } else {
        // 正解 C：左侧暗部局部磨砂，右侧主焦点完全敞开
        drawQuizTitle(ctx, w * 0.06, h * 0.22, w * 0.44, h * 0.33, true);
      }
    }
  }

  function drawQuizTitle(ctx, x, y, bw, bh, useGlass) {
    if (useGlass) {
      roundRectPath(ctx, x, y, bw, bh, 8);
      ctx.fillStyle = "rgba(1, 12, 29, 0.74)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    const f = Math.max(12, Math.round(bh * 0.27));
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `900 ${f}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText("把时间还给", x + bw * 0.08, y + bh * 0.16, bw * 0.84);
    ctx.fillText("真正重要的事", x + bw * 0.08, y + bh * 0.16 + f * 1.24, bw * 0.84);
    ctx.fillStyle = "#E658A8";
    ctx.fillRect(x + bw * 0.08, y + bh * 0.80, Math.max(20, bw * 0.18), 3);
  }

  const canvases = [...grid.querySelectorAll(".quiz-canvas")];
  const drawAll = () => canvases.forEach((c) => drawOption(c, c.dataset.quiz));

  grid.querySelectorAll(".quiz-card").forEach((card) => {
    card.addEventListener("click", () => {
      const picked = card.dataset.opt;
      grid.querySelectorAll(".quiz-card").forEach((c) => {
        const opt = c.dataset.opt;
        c.setAttribute("aria-pressed", String(opt === picked));
        c.classList.toggle("is-picked", opt === picked);
        c.classList.toggle("is-right", opt === "C");
        c.classList.toggle("is-wrong", opt === picked && opt !== "C");
        const rev = document.getElementById(`qr-${opt}`);
        if (rev) rev.textContent = REVEALS[opt];
      });
      if (verdict) {
        verdict.classList.toggle("is-right", picked === "C");
        verdict.classList.toggle("is-wrong", picked !== "C");
      }
      if (qvTitle) qvTitle.textContent = EXPLAINS[picked].title;
      if (qvBody) qvBody.textContent = EXPLAINS[picked].body;
    });
  });

  new ResizeObserver(() => drawAll()).observe(grid);
  drawAll();
}

// =========================================================================
// 07 · 原海报放大拖动灯箱（复用 #poster.src，不重复内联图片）
// =========================================================================
export function initLightbox() {
  const trigger = document.getElementById("poster-trigger");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const btnClose = document.getElementById("lb-close");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-zoom-reset");
  if (!trigger || !posterImg || !lb || !lbImg || !lbStage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (btnReset) btnReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function openLB() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1.15;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    btnClose?.focus();
  }

  function closeLB() {
    if (lb.hidden) return;
    lb.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", openLB);
  btnClose?.addEventListener("click", closeLB);
  btnIn?.addEventListener("click", () => {
    scale = clamp(scale + 0.3, 0.7, 3.2);
    applyTransform();
  });
  btnOut?.addEventListener("click", () => {
    scale = clamp(scale - 0.3, 0.7, 3.2);
    applyTransform();
  });
  btnReset?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage) {
      closeLB();
      return;
    }
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbStage.classList.add("is-dragging");
    lbStage.setPointerCapture(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  lbStage.addEventListener("pointerup", () => {
    dragging = false;
    lbStage.classList.remove("is-dragging");
  });
  lbStage.addEventListener("pointercancel", () => {
    dragging = false;
    lbStage.classList.remove("is-dragging");
  });
  lbStage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = clamp(scale + (e.deltaY < 0 ? 0.16 : -0.16), 0.7, 3.2);
      applyTransform();
    },
    { passive: false }
  );
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) closeLB();
  });
}

// 第 01–08 节的全部交互实验、练习与原海报灯箱

const $ = (id) => document.getElementById(id);

/* ---------- 01 海报母题三步拆解 ---------- */
export function initClosureLab() {
  const svg = $("closure-svg");
  const read = $("closure-read");
  const ghostBtn = $("closure-ghost");
  const state = { step: 3, ghost: false };

  const COPY = {
    1: "第一步：只有一个青绿圆面。纸底只是被动的背景，画面里什么隐藏形象都没有。",
    2: "第二步：用底纸切进圆面右侧。纸面与绿圆共享同一条轮廓——大脑开始把这条曲线判给空白，猫的额头和耳朵立刻浮现。",
    3: "第三步：只添一只绿眼与三根胡须，仍然不画右下方外框。靠格式塔闭合，人脑自动把整只白猫补全——这就是原海报的做法。",
  };

  function render() {
    const step = state.step;
    const catPath =
      "M 155 292 L 160 250 C 158 220 160 202 152 194 C 138 190 123 189 118 180 C 114 174 116 169 112 164 C 106 159 107 153 115 148 C 125 141 128 125 138 111 C 148 98 161 90 175 86 C 178 72 180 56 184 51 C 188 48 193 55 199 66 C 210 81 221 94 233 107 C 254 130 264 162 273 190 C 283 218 304 232 340 254 L 340 315 L 155 315 Z";

    let out = `<rect width="360" height="320" fill="#f0efeb"/>`;
    out += `<circle cx="182" cy="156" r="126" fill="#aac332"/>`;
    if (step >= 2) {
      out += `<path d="${catPath}" fill="#f0efeb"/>`;
    }
    if (step >= 3) {
      out += `
        <ellipse cx="154" cy="136" rx="4.8" ry="7.4" transform="rotate(14 154 136)" fill="#aac332"/>
        <circle cx="152.5" cy="134" r="1.8" fill="#f0efeb"/>
        <path d="M136 167 Q162 171 185 184 M135 175 Q160 181 181 196 M134 183 Q156 190 175 206"
              fill="none" stroke="#aac332" stroke-width="2" stroke-linecap="round"/>`;
    }
    if (state.ghost && step >= 2) {
      out += `
        <path d="M158 242 Q226 266 292 224" fill="none" stroke="#0c0d08" stroke-width="2" stroke-dasharray="6 5"/>
        <path d="M294 206 A126 126 0 0 1 160 280" fill="none" stroke="#5d700e" stroke-width="1.3" stroke-dasharray="4 4"/>
        <text x="226" y="274" text-anchor="middle" font-size="12" font-weight="700" fill="#0c0d08">这里没画线，是大脑补出来的</text>`;
    }
    svg.innerHTML = out;
    read.textContent = COPY[step];
    ghostBtn.disabled = step === 1;
    ghostBtn.setAttribute("aria-pressed", String(state.ghost && step >= 2));
  }

  $("closure-step").addEventListener("change", (e) => {
    state.step = +e.target.value;
    render();
  });
  ghostBtn.addEventListener("click", () => {
    state.ghost = !state.ghost;
    render();
  });
  render();
}

/* ---------- 02 鲁宾花瓶 · 四个图底争夺开关 ---------- */
export function initRubinLab() {
  const svg = $("rubin-svg");
  const range = $("rubin-width");
  const out = $("rubin-width-out");
  const btnEnc = $("rubin-enclose");
  const btnAsym = $("rubin-asym");
  const btnFlip = $("rubin-flip");
  const pin = $("rubin-pin");
  const read = $("rubin-read");

  const st = { pct: 34, enclose: false, asym: false, flip: false };

  function profilePath(side, xEdge, cx, halfGap, jitter) {
    const s = side;
    const H = 260;
    const y0 = 20;
    const px = (dx) => (cx + s * (halfGap + dx * H)).toFixed(1);
    const py = (t) => (y0 + t * H).toFixed(1);
    const j = side > 0 ? jitter : 0;
    return [
      `M ${xEdge} ${y0}`,
      `L ${px(0.24)} ${py(0)}`,
      `C ${px(0.22)} ${py(0.08)}, ${px(0.16 + j * 0.04)} ${py(0.15)}, ${px(0.15)} ${py(0.22)}`,
      `C ${px(0.15)} ${py(0.27)}, ${px(0.19)} ${py(0.31)}, ${px(0.16)} ${py(0.35)}`,
      `C ${px(0.08 + j * 0.08)} ${py(0.42)}, ${px(0.02 + j * 0.09)} ${py(0.47)}, ${px(0.03 + j * 0.07)} ${py(0.51)}`,
      `C ${px(0.05)} ${py(0.54)}, ${px(0.12)} ${py(0.54)}, ${px(0.10 + j * 0.05)} ${py(0.58)}`,
      `C ${px(0.07)} ${py(0.61)}, ${px(0.08)} ${py(0.64)}, ${px(0.12)} ${py(0.67)}`,
      `C ${px(0.07)} ${py(0.71)}, ${px(0.06)} ${py(0.76)}, ${px(0.13)} ${py(0.79)}`,
      `C ${px(0.24)} ${py(0.83)}, ${px(0.27)} ${py(0.92)}, ${px(0.26)} ${py(1.0)}`,
      `L ${xEdge} ${py(1.0)} Z`,
    ].join(" ");
  }

  function render() {
    out.textContent = `${st.pct}%`;
    const halfGap = ((st.pct - 34) / 28) * 32 + 18;
    const bg = st.flip ? "#0c0d08" : "#f0efeb";
    const fg = st.flip ? "#f0efeb" : "#0c0d08";
    const leftD = profilePath(-1, 20, 180, halfGap, 0);
    const rightD = profilePath(1, 340, 180, halfGap, st.asym ? 1 : 0);

    let extra = "";
    if (st.enclose) {
      extra = `<rect x="20" y="20" width="320" height="22" fill="${fg}"/><rect x="20" y="258" width="320" height="22" fill="${fg}"/>`;
    }

    svg.innerHTML = `
      <rect x="20" y="20" width="320" height="260" fill="${bg}"/>
      <path d="${leftD}" fill="${fg}"/>
      <path d="${rightD}" fill="${fg}"/>
      ${extra}
      <rect x="20" y="20" width="320" height="260" fill="none" stroke="#0c0d08" stroke-width="1.5"/>
    `;

    // 计算视觉偏向：-1 强花瓶，0 势均力敌，+1 强侧脸
    let score = (st.pct - 36) / 24;
    if (st.enclose) score -= 0.48;
    if (st.asym) score += 0.42;
    if (st.flip) score -= 0.12;
    score = Math.max(-1, Math.min(1, score));

    pin.style.left = `${((score + 1) * 50).toFixed(1)}%`;

    const reasons = [];
    if (st.pct <= 28) reasons.push(`中间只占 ${st.pct}%，面积越小越容易被判作「图」`);
    else if (st.pct >= 46) reasons.push(`中间放宽到 ${st.pct}%，两翼反而成了更紧凑的小块`);
    if (st.enclose) reasons.push("上下封口后中间完全被包围，闭合线索强烈推高花瓶");
    if (st.asym) reasons.push("右侧轮廓打破对称，中间不再像规整器皿，大脑改认两侧剪影");
    if (st.flip) reasons.push("反转明暗后中间变深，暗色在亮底上更容易浮向前景");

    let verdict = "";
    if (score < -0.3) verdict = "现在眼睛明显优先看到「中央花瓶」。";
    else if (score > 0.3) verdict = "现在眼睛明显优先看到「对望的两张侧脸」。";
    else verdict = "现在双方势均力敌：花瓶与侧脸会在你眼前来回翻转。";

    read.textContent = reasons.length ? `${verdict} ${reasons.join("；")}。` : `${verdict} 试着调窄面积、点上下封口或打破对称，感受大脑怎样瞬间换边。`;
  }

  range.addEventListener("input", () => {
    st.pct = +range.value;
    render();
  });
  btnEnc.addEventListener("click", () => {
    st.enclose = !st.enclose;
    btnEnc.setAttribute("aria-pressed", String(st.enclose));
    render();
  });
  btnAsym.addEventListener("click", () => {
    st.asym = !st.asym;
    btnAsym.setAttribute("aria-pressed", String(st.asym));
    render();
  });
  btnFlip.addEventListener("click", () => {
    st.flip = !st.flip;
    btnFlip.setAttribute("aria-pressed", String(st.flip));
    render();
  });
  render();
}

/* ---------- 03 四个可核实的经典负形标志 ---------- */
export function initLogoLab() {
  const svg = $("logo-svg");
  const meta = $("logo-meta");
  const title = $("logo-title");
  const how = $("logo-how");
  const craft = $("logo-craft");
  const xrayBtn = $("logo-xray");
  const breakBtn = $("logo-break");
  const tabs = [...document.querySelectorAll(".logo-tab")];

  const CASES = {
    fedex: {
      meta: "Lindon Leader · Landor Associates · 1994",
      title: "FedEx：字距里「挤」出的隐形箭头",
      how: "1994 年联邦快递更名为 FedEx，设计师 Lindon Leader 把大写 E 和小写 x 紧靠在一起，让 E 的下字怀与 x 的左斜角恰好咬合成一支指向右侧的白色箭头，暗喻速度与准确。",
      craft: "关键做法：直接拿现成字体排不出笔直箭头，Leader 融合了 Univers 67 与 Futura Bold 的骨架并手工修整字宽，做到「没发现时文字完全自然，发现后就再也忘不掉」。",
      draw(xray, broken) {
        const shift = broken ? 36 : 0;
        const xJoin = 196;
        const xLeft = xJoin + shift;
        const arrowFill = xray && !broken ? "#aac332" : "none";
        const arrowStroke = xray && !broken ? "#0c0d08" : "none";
        return `
          <rect width="420" height="240" fill="#f0efeb"/>
          ${!broken ? `<polygon points="122,102 ${xJoin},102 ${xJoin},78 ${xJoin + 38},124 ${xJoin},170 ${xJoin},146 122,146" fill="${arrowFill}" stroke="${arrowStroke}" stroke-width="1.8" stroke-dasharray="5 3"/>` : ""}
          <!-- 大写 E -->
          <g fill="#0c0d08">
            <rect x="86" y="42" width="36" height="128"/>
            <rect x="86" y="42" width="114" height="26"/>
            <rect x="86" y="78" width="110" height="24"/>
            <rect x="86" y="146" width="110" height="24"/>
          </g>
          <!-- 小写 x -->
          <g fill="#5d700e">
            <polygon points="${xLeft},78 ${xLeft + 34},78 ${xLeft + 106},170 ${xLeft + 72},170"/>
            <polygon points="${xLeft},170 ${xLeft + 34},170 ${xLeft + 106},78 ${xLeft + 72},78"/>
          </g>
          ${broken ? `<text x="210" y="214" text-anchor="middle" font-size="13" fill="#52544b">普通字距：E 与 x 之间只剩一条空缝，箭头彻底消失</text>` : xray ? `<text x="210" y="214" text-anchor="middle" font-size="13" font-weight="700" fill="#0c0d08">零多余笔画：箭头完全由 E 的横臂与 x 的左角围成</text>` : `<text x="210" y="214" text-anchor="middle" font-size="13" fill="#52544b">盯着 E 和 x 中间的空白看一秒</text>`}
        `;
      },
    },
    wwf: {
      meta: "Landor Associates（Tom Suiter · Jerry Kuyper · Jenny Leibundgut）· 1986 改版",
      title: "WWF 熊猫：砍掉外框，让白纸长成头顶与脊背",
      how: "1961 年初稿由自然学家 Peter Scott 绘制；1986 年 Landor 团队改版时大胆删去了熊猫头顶和背部的黑色闭合线，只留耳朵、眼斑、肩背与四肢几块黑形。",
      craft: "关键做法：利用格式塔闭合原理，白色负空间直接联通背景纸面。没有线条封闭的地方，大脑会自动连起弧线——这与本页海报 013 的白猫如出一辙。",
      draw(xray, broken) {
        return `
          <rect width="420" height="240" fill="#f0efeb"/>
          ${broken ? `<ellipse cx="210" cy="112" rx="68" ry="62" fill="#fafaf7" stroke="#0c0d08" stroke-width="4.5"/>` : ""}
          ${xray && !broken ? `<path d="M168 62 Q210 44 252 62 M146 98 Q140 132 160 158 M274 98 Q280 132 260 158" fill="none" stroke="#aac332" stroke-width="4" stroke-dasharray="7 4"/>` : ""}
          <!-- 简化的黑白块示意熊猫负形闭合 -->
          <g fill="#0c0d08">
            <ellipse cx="164" cy="68" rx="18" ry="15" transform="rotate(-24 164 68)"/>
            <ellipse cx="256" cy="68" rx="18" ry="15" transform="rotate(24 256 68)"/>
            <ellipse cx="186" cy="108" rx="16" ry="20" transform="rotate(14 186 108)"/>
            <ellipse cx="234" cy="108" rx="16" ry="20" transform="rotate(-14 234 108)"/>
            <ellipse cx="210" cy="134" rx="11" ry="7"/>
            <path d="M150 158 C154 140 176 146 184 162 L176 184 C162 184 148 176 150 158 Z"/>
            <path d="M270 158 C266 140 244 146 236 162 L244 184 C258 184 272 176 270 158 Z"/>
          </g>
          ${broken ? `<text x="210" y="216" text-anchor="middle" font-size="13" fill="#52544b">画上闭合黑线：变成普通简笔画，失去了呼吸感与留白张力</text>` : xray ? `<text x="210" y="216" text-anchor="middle" font-size="13" font-weight="700" fill="#0c0d08">青绿虚线处一笔没画，全靠视觉闭合把头背补齐</text>` : `<text x="210" y="216" text-anchor="middle" font-size="13" fill="#52544b">头顶与两颊完全向纸面敞开，仍一眼认出完整轮廓</text>`}
        `;
      },
    },
    f1: {
      meta: "Carter Wong Design（伦敦）· 1994–2017",
      title: "Formula 1：左右夹出来的「飞驰的 1」",
      how: "1994 年启用并沿用 23 年的经典 F1 标志，由伦敦 Carter Wong 事务所设计。左侧是前倾的厚黑 F，右侧是一组红色速度条纹，两者之间夹出的斜向空白恰好是数字 1。",
      craft: "关键做法：许多人看了多年才发现数字 1 根本没上色。把「1」藏在负空间里，既省去了第三个实体色块，又让速度线与字母浑然一体。",
      draw(xray, broken) {
        return `
          <rect width="420" height="240" fill="#f0efeb"/>
          ${xray && !broken ? `<polygon points="214,68 242,68 214,166 186,166 206,96 190,96 196,78" fill="#aac332" stroke="#0c0d08" stroke-width="1.5" stroke-dasharray="4 3"/>` : ""}
          <!-- 左侧斜 F -->
          <g fill="#0c0d08">
            <polygon points="88,68 206,68 198,94 114,94 106,120 174,120 166,144 98,144 91,166 60,166"/>
          </g>
          ${broken ? `<polygon points="214,68 242,68 214,166 186,166 206,96 190,96 196,78" fill="#0c0d08"/>` : ""}
          <!-- 右侧速度纹 -->
          <g fill="#5d700e">
            <polygon points="248,68 346,68 332,94 240,94"/>
            <polygon points="236,104 316,104 304,126 230,126"/>
            <polygon points="226,136 286,136 274,158 220,158"/>
          </g>
          ${broken ? `<text x="210" y="214" text-anchor="middle" font-size="13" fill="#52544b">把 1 直接涂黑：左边黏成一团重块，前冲的锐气没了</text>` : xray ? `<text x="210" y="214" text-anchor="middle" font-size="13" font-weight="700" fill="#0c0d08">左 F 右条纹夹出倾斜的 1，不着一墨却成视觉中心</text>` : `<text x="210" y="214" text-anchor="middle" font-size="13" fill="#52544b">注意黑色 F 与右侧速度条之间的白色斜影</text>`}
        `;
      },
    },
    nbc: {
      meta: "Chermayeff & Geismar（Steff Geissbühler）· 1986 改版",
      title: "NBC 孔雀：一刀切口，把扇面变成回眸的鸟",
      how: "1986 年 Chermayeff & Geismar 将 1956 年原本复杂的 11 根羽毛精简成 6 根彩色羽片，孔雀身体完全交给中央白色负空间，只在第四片羽毛边缘切出一个小三角当作朝右的鸟喙。",
      craft: "关键做法：负空间不一定需要大面积挖空。只要中心空白足够对称，一个仅占画面不到 1% 的微小缺口，就足以把「六瓣花」瞬间转化为「面向未来的孔雀」。",
      draw(xray, broken) {
        const angles = [-72, -44, -16, 16, 44, 72];
        const fills = ["#d6ad22", "#d97824", "#c94238", "#6f4b8c", "#346fa8", "#7aa326"];
        const cx = 210, cy = 166;
        const petals = angles
          .map((deg, idx) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const x = cx + Math.cos(rad) * 62;
            const y = cy + Math.sin(rad) * 62;
            return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="15" ry="44" transform="rotate(${deg} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${fills[idx]}"/>`;
          })
          .join("");

        const bodyFill = xray && !broken ? "#aac332" : "#f0efeb";
        const bodyStroke = xray && !broken ? "#0c0d08" : "none";
        const beak = broken ? "" : `<polygon points="214,114 227,118 215,124" fill="${bodyFill}" stroke="${bodyStroke}" stroke-width="1.4"/>`;

        return `
          <rect width="420" height="240" fill="#f0efeb"/>
          ${petals}
          <!-- 底部齐平遮罩 -->
          <rect x="110" y="166" width="200" height="36" fill="#f0efeb"/>
          <!-- 负空间孔雀身躯与头部 -->
          <path d="M210 107 C216 107 219 113 216 121 C215 129 221 146 221 166 L199 166 C199 146 205 129 204 121 C201 113 204 107 210 107 Z" fill="${bodyFill}" stroke="${bodyStroke}" stroke-width="1.6"/>
          ${beak}
          ${broken ? `<text x="210" y="216" text-anchor="middle" font-size="13" fill="#52544b">去掉那 1 个小切口：立刻退回一朵普通彩色扇花，看不出是鸟</text>` : xray ? `<text x="210" y="216" text-anchor="middle" font-size="13" font-weight="700" fill="#0c0d08">就靠鸟喙这一个极小切口，整条中央空白瞬间活成孔雀</text>` : `<text x="210" y="216" text-anchor="middle" font-size="13" fill="#52544b">六片彩羽围出白色鸟身，右转的小缺口点出方向</text>`}
        `;
      },
    },
  };

  let cur = "fedex";
  let xray = false;
  let broken = false;

  function render() {
    const c = CASES[cur];
    meta.textContent = c.meta;
    title.textContent = c.title;
    how.textContent = c.how;
    craft.textContent = c.craft;
    svg.innerHTML = c.draw(xray, broken);
    xrayBtn.setAttribute("aria-pressed", String(xray));
    breakBtn.setAttribute("aria-pressed", String(broken));
    for (const t of tabs) t.setAttribute("aria-selected", String(t.dataset.logo === cur));
  }

  for (const t of tabs) {
    t.addEventListener("click", () => {
      cur = t.dataset.logo;
      broken = false;
      render();
    });
  }
  xrayBtn.addEventListener("click", () => {
    xray = !xray;
    if (xray) broken = false;
    render();
  });
  breakBtn.addEventListener("click", () => {
    broken = !broken;
    if (broken) xray = false;
    render();
  });

  render();
}

/* ---------- 04 正负形双关咬合实验 ---------- */
export function initPunLab() {
  const svg = $("pun-svg");
  const range = $("pun-lock");
  const out = $("pun-lock-out");
  const read = $("pun-read");
  const flipBtn = $("pun-flip");

  const st = { motif: "table", lock: 100, flip: false };

  function drawTable(t, fg, bg) {
    // 两把叉子左右靠拢，t=1 时中间负空间严丝合缝雕出酒瓶！
    const spread = (1 - t) * 74;
    const lx = -spread;
    const rx = spread;
    // 左叉内缘 = 酒瓶左轮廓；右叉内缘 = 酒瓶右轮廓
    const leftFork = `
      M ${210 + lx} 38 L ${230 + lx} 38 L ${230 + lx} 102 L ${242 + lx} 102 L ${242 + lx} 38 L ${262 + lx} 38 L ${262 + lx} 102
      L ${274 + lx} 102 L ${274 + lx} 38 L ${286 + lx} 38
      L ${286 + lx} 118
      C ${286 + lx} 142, ${264 + lx} 152, ${264 + lx} 174
      L ${264 + lx} 266 L ${236 + lx} 266 L ${236 + lx} 174
      C ${236 + lx} 148, ${210 + lx} 138, ${210 + lx} 110 Z`;
    const rightFork = `
      M ${390 + rx} 38 L ${370 + rx} 38 L ${370 + rx} 102 L ${358 + rx} 102 L ${358 + rx} 38 L ${338 + rx} 38 L ${338 + rx} 102
      L ${326 + rx} 102 L ${326 + rx} 38 L ${314 + rx} 38
      L ${314 + rx} 118
      C ${314 + rx} 142, ${336 + rx} 152, ${336 + rx} 174
      L ${336 + rx} 266 L ${364 + rx} 266 L ${364 + rx} 174
      C ${364 + rx} 148, ${390 + rx} 138, ${390 + rx} 110 Z`;

    return `
      <rect width="600" height="300" fill="${bg}"/>
      <path d="${leftFork}" fill="${fg}"/>
      <path d="${rightFork}" fill="${fg}"/>
    `;
  }

  function drawSteps(t, fg, bg) {
    // 致敬福田繁雄 1975 咬合原理：深色朝下靴影与浅色倒置高跟鞋影无缝互锁
    const sep = (1 - t) * 44;
    const cols = 6;
    const cellW = 76;
    const startX = (600 - cols * cellW) / 2;
    const topY = 34 - sep * 0.5;
    const botY = 266 + sep * 0.5;
    let shapes = `<rect width="600" height="300" fill="${bg}"/>`;
    // 上底条与下底条
    shapes += `<rect x="${startX}" y="${topY}" width="${cols * cellW}" height="18" fill="${fg}"/>`;
    for (let i = 0; i < cols; i++) {
      const x = startX + i * cellW;
      // 朝下的深色靴腿（左直右弯），其空隙正好形成倒置的浅色纤细鞋腿
      shapes += `<path d="M ${x + 4} ${topY + 16} L ${x + 42} ${topY + 16} C ${x + 40} 126, ${x + 36} 184, ${x + 44} ${226 - sep * 0.5} L ${x + 70} ${238 - sep * 0.5} L ${x + 70} ${252 - sep * 0.5} L ${x + 18} ${252 - sep * 0.5} L ${x + 18} ${232 - sep * 0.5} C ${x + 12} 178, ${x + 8} 120, ${x + 4} ${topY + 16} Z" fill="${fg}"/>`;
    }
    shapes += `<rect x="${startX}" y="${botY - 14}" width="${cols * cellW}" height="14" fill="${fg}" opacity="${(0.15 + t * 0.85).toFixed(2)}"/>`;
    return shapes;
  }

  function drawForest(t, fg, bg) {
    // 树冠与树干之间的负空间雕出三只展翅飞鸟
    const spread = (1 - t) * 42;
    const trees = [120 - spread, 240 - spread * 0.35, 360 + spread * 0.35, 480 + spread];
    let outHtml = `<rect width="600" height="300" fill="${bg}"/>`;
    // 地面黑带
    outHtml += `<rect x="40" y="252" width="520" height="18" fill="${fg}"/>`;
    for (const tx of trees) {
      // 树干 + 带有弧形凹口的几何树冠（左右树冠相接时，凹口合拢成飞鸟剪影）
      outHtml += `
        <path d="M ${tx - 16} 254 L ${tx - 12} 166 C ${tx - 46} 156, ${tx - 58} 126, ${tx - 54} 96
                 C ${tx - 42} 108, ${tx - 24} 102, ${tx - 18} 82
                 C ${tx - 12} 54, ${tx + 12} 54, ${tx + 18} 82
                 C ${tx + 24} 102, ${tx + 42} 108, ${tx + 54} 96
                 C ${tx + 58} 126, ${tx + 46} 156, ${tx + 12} 166 L ${tx + 16} 254 Z" fill="${fg}"/>`;
    }
    return outHtml;
  }

  const TEXTS = {
    table: {
      low: "两把叉子离得太远，中间是一片松散空隙，完全看不出酒瓶。",
      mid: "叉柄正在向中间收拢，瓶身和瓶颈已经出现雏形，再拉满即可锁定。",
      high: "100% 咬合：两把叉子的齿与柄共同雕出一支完整的酒瓶——看黑是餐具，看白是酒瓶。",
    },
    steps: {
      low: "上下错开时，这只是一排向下的条形块，空隙是散的。",
      mid: "边界开始接近，反方向的轮廓隐约出现。",
      high: "100% 咬合：几乎没有废掉的背景。深色是朝下的靴影，浅色间隙反向勾出成排脚影，互为图底。",
    },
    forest: {
      low: "四棵树散开排列，树间只是普通的天空缝隙。",
      mid: "树冠的弧度正在靠拢，鸟翼的曲线开始对接。",
      high: "100% 咬合：相邻树冠的凹弧合拢，天空的负空间里长出三只展翅飞鸟。",
    },
  };

  function render() {
    out.textContent = `${st.lock}%`;
    const t = st.lock / 100;
    const fg = st.flip ? "#f0efeb" : "#0c0d08";
    const bg = st.flip ? "#0c0d08" : "#f0efeb";
    if (st.motif === "table") svg.innerHTML = drawTable(t, fg, bg);
    else if (st.motif === "steps") svg.innerHTML = drawSteps(t, fg, bg);
    else svg.innerHTML = drawForest(t, fg, bg);

    const copy = TEXTS[st.motif];
    read.textContent = t < 0.35 ? copy.low : t < 0.85 ? copy.mid : copy.high;
    flipBtn.setAttribute("aria-pressed", String(st.flip));
  }

  $("pun-seg").addEventListener("change", (e) => {
    st.motif = e.target.value;
    render();
  });
  range.addEventListener("input", () => {
    st.lock = +range.value;
    render();
  });
  flipBtn.addEventListener("click", () => {
    st.flip = !st.flip;
    render();
  });
  render();
}

/* ---------- 05 留白比例与「变空」临界实验 ---------- */
export function initEmptyLab() {
  const svg = $("empty-svg");
  const range = $("empty-range");
  const out = $("empty-out");
  const title = $("empty-title");
  const tag = $("empty-tag");
  const text = $("empty-text");

  const st = { space: 72, sabotage: "clean" };

  function render() {
    out.textContent = `${st.space}%`;
    const subjectArea = (100 - st.space) / 100;
    const r = Math.sqrt((440 * 330 * subjectArea) / Math.PI) * 0.86;
    const cx = 220;
    const cy = 156;
    const lowCon = st.sabotage === "lowcon";
    const clutter = st.sabotage === "clutter";

    const discFill = lowCon ? "#d9d9cf" : "#0c0d08";
    const dotFill = lowCon ? "#e4e4dc" : "#aac332";

    let clutterMarkup = "";
    if (clutter) {
      clutterMarkup = `
        <g fill="#52544b" opacity="0.72" font-size="10" font-family="Space Grotesk, Noto Sans SC, sans-serif">
          <rect x="20" y="18" width="66" height="18" fill="none" stroke="#52544b" stroke-width="1"/>
          <text x="27" y="31">ISSUE 04</text>
          <circle cx="392" cy="36" r="14" fill="none" stroke="#52544b" stroke-dasharray="3 2"/>
          <text x="383" y="40">NEW</text>
          <path d="M22 292 L82 292 M22 298 L62 298" stroke="#52544b" stroke-width="2"/>
          <circle cx="96" cy="240" r="6" fill="#aac332"/>
          <circle cx="348" cy="236" r="5" fill="#0c0d08"/>
          <rect x="318" y="280" width="96" height="22" fill="#e2e1d8" stroke="#52544b"/>
          <text x="328" y="295">LIMITED 2026</text>
          <text x="26" y="156">★ ★ ★</text>
          <text x="360" y="132">NO.13</text>
        </g>`;
    }

    // 极简负形器皿主体：黑圆内被纸底切出一弯新月/水滴
    const cutout = `M ${(cx + r * 0.18).toFixed(1)} ${(cy - r * 0.62).toFixed(1)}
      A ${(r * 0.62).toFixed(1)} ${(r * 0.62).toFixed(1)} 0 1 0 ${(cx + r * 0.56).toFixed(1)} ${(cy + r * 0.42).toFixed(1)}
      A ${(r * 0.46).toFixed(1)} ${(r * 0.46).toFixed(1)} 0 1 1 ${(cx + r * 0.18).toFixed(1)} ${(cy - r * 0.62).toFixed(1)} Z`;

    svg.innerHTML = `
      <rect width="440" height="330" fill="#f0efeb"/>
      <circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="${discFill}"/>
      <path d="${cutout}" fill="#f0efeb"/>
      <circle cx="${(cx - r * 0.34).toFixed(1)}" cy="${(cy - r * 0.12).toFixed(1)}" r="${Math.max(2.5, r * 0.11).toFixed(1)}" fill="${dotFill}"/>
      ${clutterMarkup}
      <line x1="176" y1="306" x2="264" y2="306" stroke="${lowCon ? "#c9c9be" : "#0c0d08"}" stroke-width="1.5"/>
    `;

    // 诊断文案
    if (clutter) {
      title.textContent = "空白被切碎：负空间立刻失效";
      tag.textContent = "变乱";
      tag.dataset.state = "bad";
      text.textContent = `虽然空白占比仍是 ${st.space}%，但角落塞满标签、星号与装饰圆点后，原本连贯的场被切成零碎边角。视线四处分神，再大面积也不再是「负空间」。`;
    } else if (lowCon) {
      title.textContent = "明度发灰：图底混成一团";
      tag.textContent = "发虚";
      tag.dataset.state = "bad";
      text.textContent = `主体和底纸明度太过接近，共享轮廓变糊。负空间需要锐利的边界才能托起主体，对比一软，${st.space}% 的留白只让人觉得画面没印清楚。`;
    } else if (st.space < 42) {
      title.textContent = "贴边偏满：冲击力强，但不是负空间";
      tag.textContent = "偏满";
      tag.dataset.state = "warn";
      text.textContent = `留白只剩 ${st.space}%，主体几乎顶到画框，重心变成压迫感与近距冲击——这已经进入「012 填满画面」的打法，空白退回边缘缝隙。`;
    } else if (st.space <= 84) {
      title.textContent = "强聚焦区：静默把主体放大了";
      tag.textContent = "成立";
      tag.dataset.state = "good";
      text.textContent = `${st.space}% 干净连贯的底面 + 高对比锐利主体。四周没有干扰，眼睛无处逃逸，反复落回中心——留白越多，主体反而显得越重、越笃定。`;
    } else {
      title.textContent = "失重临界：负空间退化成「空」";
      tag.textContent = "变空";
      tag.dataset.state = "bad";
      text.textContent = `留白高达 ${st.space}%，主体缩到只占 ${100 - st.space}%。缺乏呼应或引导时，主体压不住这么大的画幅，观者第一反应不是「克制」，而是「图是不是没加载出来」。`;
    }
  }

  range.addEventListener("input", () => {
    st.space = +range.value;
    render();
  });
  $("empty-sabotage").addEventListener("change", (e) => {
    st.sabotage = e.target.value;
    render();
  });
  render();
}

/* ---------- 07 小练习：四张「午夜书店」草图 ---------- */
export function initQuiz() {
  const verdictTitle = $("quiz-title");
  const verdictText = $("quiz-text");
  const buttons = [...document.querySelectorAll(".q-opt")];

  const SVGS = {
    // A: 极小方块缩在中间，95% 空白压不住（失重变空）
    A: `
      <rect width="240" height="300" fill="#f0efeb"/>
      <rect x="110" y="138" width="20" height="24" fill="#0c0d08"/>
      <rect x="114" y="142" width="12" height="4" fill="#aac332"/>
      <text x="120" y="274" text-anchor="middle" font-size="10" fill="#52544b">MIDNIGHT BOOKS</text>
    `,
    // B: 四角塞满杂物，把负空间切得支离破碎
    B: `
      <rect width="240" height="300" fill="#f0efeb"/>
      <rect x="12" y="12" width="216" height="276" fill="none" stroke="#0c0d08" stroke-dasharray="4 3" stroke-width="1.2"/>
      <circle cx="34" cy="34" r="10" fill="#aac332"/>
      <rect x="174" y="24" width="40" height="16" fill="#0c0d08"/>
      <circle cx="120" cy="142" r="40" fill="#0c0d08"/>
      <circle cx="134" cy="134" r="24" fill="#f0efeb"/>
      <circle cx="42" cy="212" r="7" fill="#0c0d08"/>
      <rect x="166" y="204" width="44" height="12" fill="#aac332"/>
      <path d="M26 258 H214" stroke="#0c0d08" stroke-width="1"/>
      <text x="120" y="276" text-anchor="middle" font-size="10" font-weight="700" fill="#0c0d08">OPEN 20:00 · SALE · NEW</text>
    `,
    // C: 最佳！干净厚重的暗色块内用纸底雕出新月与展开的书页，留白连贯、锚点清晰
    C: `
      <rect width="240" height="300" fill="#f0efeb"/>
      <!-- 主块面：深墨圆盘 -->
      <circle cx="132" cy="126" r="76" fill="#0c0d08"/>
      <!-- 负空间 1：上方新月由底纸切出 -->
      <path d="M132 76 A30 30 0 1 0 160 116 A23 23 0 1 1 132 76 Z" fill="#f0efeb"/>
      <!-- 负空间 2：下方展开书页直接向底纸敞开（闭合） -->
      <path d="M74 176 Q104 152 132 168 Q160 152 190 176 L190 212 L74 212 Z" fill="#f0efeb"/>
      <line x1="132" y1="168" x2="132" y2="196" stroke="#aac332" stroke-width="2.5"/>
      <!-- 底部极简克制落款 -->
      <circle cx="34" cy="258" r="3" fill="#0c0d08"/>
      <line x1="42" y1="258" x2="96" y2="258" stroke="#0c0d08" stroke-width="1.2"/>
      <text x="106" y="262" font-size="11" font-weight="700" fill="#0c0d08">午夜书店</text>
      <circle cx="164" cy="258" r="3" fill="#aac332"/>
    `,
    // D: 低对比灰块叠细线，图底边界含糊
    D: `
      <rect width="240" height="300" fill="#f0efeb"/>
      <circle cx="120" cy="134" r="70" fill="#dfdfD6"/>
      <circle cx="144" cy="126" r="46" fill="#e7e7de"/>
      <rect x="86" y="148" width="68" height="44" fill="none" stroke="#c8c8be" stroke-width="1.5"/>
      <line x1="120" y1="148" x2="120" y2="192" stroke="#c8c8be" stroke-width="1.5"/>
      <text x="120" y="262" text-anchor="middle" font-size="10" fill="#a8a89d">午夜书店</text>
    `,
  };

  for (const k of Object.keys(SVGS)) {
    $(`q-svg-${k}`).innerHTML = SVGS[k];
  }

  const FEEDBACK = {
    A: {
      ok: false,
      title: "A：留白太狠，主体缩成孤点，变成了「空」",
      text: "画面虽然极干净，但黑色小块只占约 1%，既没有用空白雕出新形象，也压不住整张画幅，看起来像排版没做完。正确答案是 C。",
    },
    B: {
      ok: false,
      title: "B：有空隙，但空白被四角杂物切碎了",
      text: "中间的新月本身有负形意思，但虚线边框和四角的圆点、色块、广告字把背景切成了碎块，「静默」和「聚焦」全被破坏。正确答案是 C。",
    },
    C: {
      ok: true,
      title: "选对了！C 让空白自己长出了月亮与翻开的书页",
      text: "高对比深墨圆盘稳稳压住画幅，底纸同时雕出弯月和向底部敞开的书页；其余空白完整连贯，把视线牢牢锁在「午夜书店」的核心意象上。",
    },
    D: {
      ok: false,
      title: "D：明度对比太弱，图底边界融成一片灰",
      text: "负空间高度依赖清晰轮廓。当主体与底纸颜色太过接近时，大脑无法分配边界归属，月亮和书本都发虚。正确答案是 C。",
    },
  };

  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      const k = btn.dataset.opt;
      const fb = FEEDBACK[k];
      for (const b of buttons) {
        const isSelf = b === btn;
        const isRight = b.dataset.opt === "C";
        b.setAttribute("aria-pressed", String(isSelf));
        b.dataset.state = isRight ? "right" : isSelf ? "wrong" : "idle";
      }
      verdictTitle.textContent = fb.title;
      verdictText.textContent = fb.text;
      $("quiz-verdict").dataset.ok = String(fb.ok);
    });
  }
}

/* ---------- 08 原海报放大灯箱（支持拖动、Esc 关闭） ---------- */
export function initLightbox() {
  const openBtn = $("poster-btn");
  const posterImg = $("poster");
  const box = $("lightbox");
  const closeBtn = $("lb-close");
  const stage = $("lb-stage");
  const img = $("lb-img");

  let tx = 0;
  let ty = 0;
  let drag = null;

  const apply = () => {
    img.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;
  };

  function open() {
    img.src = posterImg.src;
    tx = 0;
    ty = 0;
    apply();
    box.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    if (box.hidden) return;
    box.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  box.addEventListener("click", (e) => {
    if (e.target === box || e.target === stage) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });

  img.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    img.setPointerCapture(e.pointerId);
    drag = { x: e.clientX - tx, y: e.clientY - ty };
  });
  img.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = e.clientX - drag.x;
    ty = e.clientY - drag.y;
    apply();
  });
  const endDrag = () => (drag = null);
  img.addEventListener("pointerup", endDrag);
  img.addEventListener("pointercancel", endDrag);
}

/* ---------- 滚入淡入动画（支持减少动态效果） ---------- */
export function initReveal() {
  const els = [...document.querySelectorAll(".reveal")];
  if (!("IntersectionObserver" in window)) {
    for (const el of els) el.classList.add("in");
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
  );
  for (const el of els) io.observe(el);
}

// 258 侧边栏页面 — 正文七节专用交互绘图模块（全部原生 2D Canvas / SVG，零外部依赖）
import { PALETTE as P } from "./palette.js";

/**
 * 01 节：眼动扫读路径对比模拟器（Canvas）
 * 对比「顶部多行拥挤链接」vs「左侧对齐垂直侧栏」找目标章节时的视线跳点轨迹
 */
export function mountScanLab(canvas, { onResult } = {}) {
  const ctx = canvas.getContext("2d");
  const TARGETS = [
    { id: 0, name: "课程概览", topIdx: 1, sideIdx: 0 },
    { id: 1, name: "网格与比例", topIdx: 5, sideIdx: 2 },
    { id: 2, name: "响应式断点", topIdx: 9, sideIdx: 5 },
    { id: 3, name: "数据导出", topIdx: 11, sideIdx: 7 },
  ];
  const TOP_ITEMS = [
    "首页", "课程概览", "视觉原则", "字体规范", "色彩系统", "网格与比例",
    "组件库", "图标集", "案例拆解", "响应式断点", "无障碍", "数据导出",
  ];
  const SIDE_ITEMS = [
    "课程概览", "视觉原则", "网格与比例", "色彩系统",
    "组件库", "响应式断点", "无障碍", "数据导出",
  ];

  let targetIdx = 3; // 默认找「数据导出」
  let progress = 1;  // 0..1 动画进度
  let animating = false;
  let mode = "compare"; // compare | side | top

  function drawPanel(x, y, w, h, kind, prog) {
    const t = TARGETS[targetIdx];
    ctx.save();
    ctx.fillStyle = P.paperLight;
    ctx.strokeStyle = P.lineSand;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    // 标题条
    ctx.fillStyle = kind === "top" ? P.cardSand : P.espresso;
    roundRectTop(ctx, x, y, w, 30, 8);
    ctx.fill();
    ctx.fillStyle = kind === "top" ? P.ink : P.paper;
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(kind === "top" ? "A · 顶部双行折行导航（12 项堆叠）" : "B · 左侧垂直对齐导航（8 项主干）", x + 12, y + 15);

    const pts = [];
    if (kind === "top") {
      // 两行 6 列，参差宽度
      const navY = y + 40;
      const cols = 6;
      const cellW = (w - 24) / cols;
      TOP_ITEMS.forEach((label, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const ix = x + 12 + col * cellW;
        const iy = navY + row * 28;
        const isHit = i === t.topIdx;
        ctx.fillStyle = isHit ? P.coral : P.cardCream;
        roundRect(ctx, ix + 2, iy, cellW - 4, 22, 4);
        ctx.fill();
        ctx.fillStyle = isHit ? "#FFFFFF" : P.inkMuted;
        ctx.font = `${isHit ? "700" : "400"} 10.5px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(label.slice(0, 4), ix + cellW / 2, iy + 11);
        if (i <= t.topIdx) {
          pts.push({ x: ix + cellW / 2, y: iy + 22 });
        }
      });
      // 正文示意块
      ctx.fillStyle = P.paperWarm;
      roundRect(ctx, x + 14, y + 110, w - 28, h - 124, 6);
      ctx.fill();
      ctx.fillStyle = P.inkMuted;
      ctx.font = `400 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText("导航在顶部横向折行，眼睛必须左右来回折返换行扫描。", x + 24, y + 134);
    } else {
      // 左侧竖向对齐侧栏
      const railW = Math.max(102, Math.min(132, w * 0.36));
      ctx.fillStyle = P.espresso;
      ctx.fillRect(x + 1, y + 30, railW, h - 31);
      const startY = y + 42;
      const step = Math.min(22, (h - 54) / SIDE_ITEMS.length);
      SIDE_ITEMS.forEach((label, i) => {
        const iy = startY + i * step;
        const isHit = i === t.sideIdx;
        if (isHit) {
          ctx.fillStyle = P.coral;
          roundRect(ctx, x + 18, iy - 1, railW - 22, step - 3, 4);
          ctx.fill();
        }
        ctx.fillStyle = isHit ? "#FFFFFF" : P.bauhausSand;
        ctx.font = `${isHit ? "700" : "400"} 10.5px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.fillText(label, x + 24, iy + (step - 4) / 2);
        // 垂直列表只靠左侧首字扫视，注视点放在文字左缘轨上不遮字
        if (i === 0 || (i < t.sideIdx && i % 2 === 0) || i === t.sideIdx) {
          pts.push({ x: x + 11, y: iy + (step - 4) / 2 });
        }
      });
      // 主内容区
      ctx.fillStyle = P.cardCream;
      roundRect(ctx, x + railW + 14, y + 44, w - railW - 28, h - 58, 6);
      ctx.fill();
      ctx.fillStyle = P.ink;
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx.fillText(`已定位：${t.name}`, x + railW + 26, y + 70);
      ctx.fillStyle = P.inkMuted;
      ctx.font = `400 11px "Noto Sans SC", sans-serif`;
      ctx.fillText("所有词首垂直对齐在一条纵线上，", x + railW + 26, y + 96);
      ctx.fillText("目光沿垂直轴直线下扫即可命中。", x + railW + 26, y + 114);
    }

    // 绘制眼动注视路径（根据 prog 插值）
    if (pts.length > 1) {
      const totalSegs = pts.length - 1;
      const cur = prog * totalSegs;
      const drawCount = Math.floor(cur);
      const frac = cur - drawCount;

      ctx.strokeStyle = kind === "top" ? P.errLight : P.okLight;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i <= Math.min(drawCount, totalSegs); i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      if (drawCount < totalSegs) {
        const a = pts[drawCount], b = pts[drawCount + 1];
        ctx.lineTo(a.x + (b.x - a.x) * frac, a.y + (b.y - a.y) * frac);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 画注视点圆圈
      const shown = Math.min(pts.length, drawCount + 1 + (prog >= 0.99 ? 1 : 0));
      for (let i = 0; i < shown; i++) {
        const p = pts[i];
        const isLast = i === pts.length - 1 && prog >= 0.98;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isLast ? 7 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = isLast ? (kind === "top" ? P.errLight : P.okLight) : "rgba(33,16,6,0.78)";
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // 底部角标（注视跳次示意）
    ctx.fillStyle = kind === "top" ? P.errLight : P.okLight;
    ctx.font = `700 11px "JetBrains Mono", monospace`;
    ctx.textAlign = "right";
    ctx.fillText(`示意注视 ${pts.length} 次 · ${kind === "top" ? "横向折返" : "垂直直扫"}`, x + w - 12, y + h - 12);
    ctx.restore();
    return pts.length;
  }

  function render() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const stacked = w < 560;
    const h = stacked ? 420 : 236;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = `${h}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    let topFix = 0, sideFix = 0;
    if (stacked) {
      topFix = drawPanel(2, 2, w - 4, 200, "top", progress);
      sideFix = drawPanel(2, 214, w - 4, 202, "side", progress);
    } else {
      const gap = 14;
      const pw = (w - gap - 4) / 2;
      topFix = drawPanel(2, 2, pw, h - 4, "top", progress);
      sideFix = drawPanel(2 + pw + gap, 2, pw, h - 4, "side", progress);
    }
    if (onResult) {
      onResult({ target: TARGETS[targetIdx].name, topFix, sideFix });
    }
  }

  function tick(t, dt, { still }) {
    if (still) {
      progress = 1;
      animating = false;
      render();
      return;
    }
    if (animating) {
      progress = Math.min(1, progress + dt * 0.72);
      if (progress >= 1) animating = false;
      render();
    }
  }

  return {
    setTarget(idx, replay = true) {
      targetIdx = idx;
      if (replay) {
        progress = 0.02;
        animating = true;
      } else {
        progress = 1;
        animating = false;
      }
      render();
    },
    replay() {
      progress = 0.02;
      animating = true;
      render();
    },
    render,
    tick,
  };
}

/**
 * 03 节：五十年侧轨史线框图（SVG 字符串生成）
 */
export const HISTORY_ERAS = [
  {
    year: "1980–1983",
    title: "Smalltalk-80 系统浏览器",
    place: "Xerox PARC · Adele Goldberg 团队",
    fact: "施乐帕洛阿尔托研究中心在 Smalltalk-80 环境中定型了多窗格系统浏览器（System Browser），并于 1983–1984 年在经典蓝皮书中公开发表。它把「类别 / 类 / 协议 / 方法」导航列表与下方代码编辑区并排联动，确立了「点列表、换正文」的交互母型。",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="Smalltalk-80 多窗格浏览器示意">
      <rect x="8" y="8" width="344" height="204" rx="4" fill="#2B160A" stroke="#F66041" stroke-width="2"/>
      <rect x="8" y="8" width="344" height="24" fill="#F66041"/>
      <text x="20" y="24" fill="#211006" font-size="11" font-family="JetBrains Mono, monospace" font-weight="700">SYSTEM BROWSER · SMALLTALK-80</text>
      <rect x="16" y="40" width="78" height="72" fill="#180B04" stroke="#E8D2B5" stroke-width="1"/>
      <rect x="98" y="40" width="78" height="72" fill="#180B04" stroke="#E8D2B5" stroke-width="1"/>
      <rect x="180" y="40" width="78" height="72" fill="#180B04" stroke="#E8D2B5" stroke-width="1"/>
      <rect x="262" y="40" width="82" height="72" fill="#180B04" stroke="#E8D2B5" stroke-width="1"/>
      <rect x="20" y="58" width="70" height="14" fill="#F66041"/>
      <rect x="102" y="72" width="70" height="14" fill="#F66041"/>
      <rect x="184" y="48" width="70" height="14" fill="#F66041"/>
      <rect x="266" y="82" width="74" height="14" fill="#F66041"/>
      <text x="22" y="53" fill="#E8D2B5" font-size="9" font-family="JetBrains Mono, monospace">Categories</text>
      <text x="104" y="53" fill="#E8D2B5" font-size="9" font-family="JetBrains Mono, monospace">Classes</text>
      <text x="186" y="74" fill="#E8D2B5" font-size="9" font-family="JetBrains Mono, monospace">Protocols</text>
      <text x="268" y="53" fill="#E8D2B5" font-size="9" font-family="JetBrains Mono, monospace">Methods</text>
      <rect x="16" y="120" width="328" height="82" fill="#FAF2E7"/>
      <rect x="28" y="134" width="128" height="8" fill="#211006"/>
      <rect x="28" y="150" width="260" height="6" fill="#5D4638" opacity="0.6"/>
      <rect x="28" y="164" width="218" height="6" fill="#5D4638" opacity="0.6"/>
      <rect x="28" y="178" width="180" height="6" fill="#5D4638" opacity="0.6"/>
    </svg>`,
  },
  {
    year: "1995–1999",
    title: "Netscape 2.0 与 HTML Frameset",
    place: "Netscape Navigator 2.0 · W3C HTML 4.01",
    fact: "1995 年 9 月 Netscape Navigator 2.0 率先推出 <frameset> 与 <frame>（1999 年纳入 W3C HTML 4.01 Frameset DTD），让早期网页第一次实现「左帧固定目录 + 右帧刷新文档」。但帧集把网址锁死在顶层，书签、打印与读屏均受损，后被 HTML5 正式废止。",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="1995 HTML Frameset 左右帧页面示意">
      <rect x="8" y="8" width="344" height="204" rx="4" fill="#2B160A" stroke="#E8D2B5" stroke-width="1.5"/>
      <rect x="8" y="8" width="344" height="24" fill="#4A2C1B"/>
      <text x="20" y="24" fill="#FAF2E7" font-size="10.5" font-family="JetBrains Mono, monospace">&lt;frameset cols="24%, 76%"&gt;</text>
      <rect x="16" y="40" width="82" height="162" fill="#180B04" stroke="#F66041" stroke-width="1.5"/>
      <rect x="104" y="40" width="240" height="162" fill="#FAF2E7" stroke="#E8D2B5" stroke-width="1.5"/>
      <text x="24" y="58" fill="#FF8A70" font-size="9.5" font-family="JetBrains Mono, monospace">frame_nav</text>
      <rect x="24" y="70" width="58" height="8" rx="2" fill="#F66041"/>
      <rect x="24" y="86" width="50" height="6" rx="2" fill="#E8D2B5" opacity="0.7"/>
      <rect x="24" y="100" width="54" height="6" rx="2" fill="#E8D2B5" opacity="0.7"/>
      <rect x="24" y="114" width="46" height="6" rx="2" fill="#E8D2B5" opacity="0.7"/>
      <line x1="101" y1="40" x2="101" y2="202" stroke="#F66041" stroke-width="3"/>
      <text x="118" y="60" fill="#B83318" font-size="10" font-family="JetBrains Mono, monospace">frame_main (独立 HTML 文档)</text>
      <rect x="118" y="74" width="142" height="10" fill="#211006"/>
      <rect x="118" y="94" width="204" height="6" fill="#5D4638" opacity="0.55"/>
      <rect x="118" y="108" width="188" height="6" fill="#5D4638" opacity="0.55"/>
      <rect x="118" y="122" width="196" height="6" fill="#5D4638" opacity="0.55"/>
      <rect x="118" y="152" width="198" height="34" rx="4" fill="#FCE8E4" stroke="#B92418" stroke-width="1"/>
      <text x="128" y="173" fill="#B92418" font-size="10" font-family="Noto Sans SC, sans-serif" font-weight="700">缺陷：点目录不改地址栏，收藏链接全失效</text>
    </svg>`,
  },
  {
    year: "2003",
    title: "Mac OS X Panther Finder 侧边栏",
    place: "Apple · Mac OS X 10.3（2003 年 10 月）",
    fact: "2003 年 10 月发布的 Mac OS X 10.3 Panther 重新设计了 Finder，把高频位置（个人目录、磁盘、网络与自定义快捷方式）永久停靠在窗口左侧。这种「可拖放定制的左侧边栏」随后成为桌面与网盘产品的行业默认心智。",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="2003 Mac OS X Panther Finder 侧边栏示意">
      <rect x="8" y="8" width="344" height="204" rx="10" fill="#FAF2E7" stroke="#E2C3A2" stroke-width="2"/>
      <rect x="8" y="8" width="344" height="30" rx="10" fill="#E2C3A2"/>
      <circle cx="24" cy="23" r="4.5" fill="#F66041"/>
      <circle cx="38" cy="23" r="4.5" fill="#E8D2B5"/>
      <circle cx="52" cy="23" r="4.5" fill="#211006"/>
      <text x="72" y="27" fill="#211006" font-size="10.5" font-family="JetBrains Mono, monospace" font-weight="700">FINDER · MAC OS X 10.3 PANTHER</text>
      <rect x="8" y="38" width="96" height="174" fill="#211006"/>
      <rect x="16" y="52" width="80" height="20" rx="4" fill="#F66041"/>
      <text x="26" y="66" fill="#FFFFFF" font-size="10" font-family="Noto Sans SC, sans-serif" font-weight="700">常用个人目录</text>
      <text x="26" y="92" fill="#E8D2B5" font-size="10" font-family="Noto Sans SC, sans-serif">桌面 · Desktop</text>
      <text x="26" y="114" fill="#E8D2B5" font-size="10" font-family="Noto Sans SC, sans-serif">文稿 · Docs</text>
      <line x1="18" y1="130" x2="94" y2="130" stroke="#4A2C1B" stroke-dasharray="3 3"/>
      <text x="26" y="150" fill="#FF8A70" font-size="9.5" font-family="Noto Sans SC, sans-serif">可拖拽自定条目</text>
      <rect x="120" y="54" width="66" height="62" rx="6" fill="#EEDBC4"/>
      <rect x="198" y="54" width="66" height="62" rx="6" fill="#EEDBC4"/>
      <rect x="276" y="54" width="62" height="62" rx="6" fill="#EEDBC4"/>
      <rect x="120" y="130" width="218" height="64" rx="6" fill="#F8EBD8" stroke="#E2C3A2"/>
      <text x="134" y="166" fill="#211006" font-size="10.5" font-family="Noto Sans SC, sans-serif">左侧一键直达高频目录，右侧专注文件浏览</text>
    </svg>`,
  },
  {
    year: "2014–今日",
    title: "HTML5 语义地标与自适应三态轨",
    place: "WHATWG HTML · Apple HIG · Material 3",
    fact: "现代网页彻底告别帧集，用语义化的 <nav>（navigation 地标）与 <aside>（complementary 地标）配合 CSS Grid 与 position: sticky 实现独立锚定；并在宽屏完整侧栏、平板图标轨（Navigation Rail）与手机抽屉（Drawer）间自动退让。",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="现代响应式三态侧边栏演进示意">
      <rect x="10" y="24" width="154" height="172" rx="6" fill="#FAF2E7" stroke="#E2C3A2" stroke-width="1.5"/>
      <rect x="10" y="24" width="40" height="172" rx="4" fill="#211006"/>
      <rect x="16" y="42" width="28" height="12" rx="2" fill="#F66041"/>
      <rect x="16" y="62" width="24" height="6" rx="2" fill="#E8D2B5"/>
      <rect x="16" y="76" width="26" height="6" rx="2" fill="#E8D2B5"/>
      <text x="60" y="54" fill="#211006" font-size="10" font-family="JetBrains Mono, monospace" font-weight="700">DESKTOP · SIDEBAR</text>
      <rect x="60" y="66" width="90" height="44" rx="4" fill="#F66041"/>
      <rect x="60" y="120" width="90" height="58" rx="4" fill="#EEDBC4"/>

      <rect x="178" y="24" width="94" height="172" rx="6" fill="#FAF2E7" stroke="#E2C3A2" stroke-width="1.5"/>
      <rect x="178" y="24" width="22" height="172" rx="4" fill="#211006"/>
      <circle cx="189" cy="48" r="5" fill="#F66041"/>
      <circle cx="189" cy="68" r="4" fill="#E8D2B5"/>
      <circle cx="189" cy="86" r="4" fill="#E8D2B5"/>
      <text x="208" y="54" fill="#211006" font-size="9.5" font-family="JetBrains Mono, monospace" font-weight="700">RAIL</text>
      <rect x="208" y="66" width="54" height="112" rx="4" fill="#EEDBC4"/>

      <rect x="286" y="24" width="64" height="172" rx="8" fill="#FAF2E7" stroke="#E2C3A2" stroke-width="1.5"/>
      <rect x="286" y="24" width="64" height="22" rx="6" fill="#211006"/>
      <rect x="294" y="32" width="12" height="2" fill="#F66041"/>
      <rect x="294" y="36" width="12" height="2" fill="#F66041"/>
      <text x="294" y="66" fill="#211006" font-size="9" font-family="JetBrains Mono, monospace" font-weight="700">DRAWER</text>
      <rect x="294" y="76" width="48" height="102" rx="4" fill="#EEDBC4"/>
    </svg>`,
  },
];

/**
 * 06 节：两道单变量小练习题（中性标签 A/B/C/D，绝不剧透好坏）
 */
export const QUIZ_QUESTIONS = [
  {
    id: "q1",
    title: "题目 1 / 2 · 1280px 桌面课程学习页",
    stem: "你在为 1280px 桌面端设计一门 18 节的在线课程学习页，左侧放章节目录，右侧放长文与案例图。以下四个方案里，哪一个在「快速定位」与「正文专注」之间最稳妥？",
    correct: "B",
    options: [
      {
        key: "A",
        label: "方案 A",
        whyWrong: "侧边栏占去 38% 宽度，还塞进大号彩色封面卡，主区正文被明显挤窄，左右两块区域都在争夺第一眼焦点。",
        svg: `<svg viewBox="0 0 220 132" role="img" aria-label="方案 A 缩微布局">
          <rect x="2" y="2" width="216" height="128" rx="6" fill="#FAF2E7" stroke="#4A2C1B" stroke-width="1.5"/>
          <rect x="2" y="2" width="84" height="128" rx="4" fill="#F66041"/>
          <rect x="10" y="12" width="68" height="26" rx="4" fill="#211006"/>
          <rect x="10" y="44" width="68" height="26" rx="4" fill="#E8D2B5"/>
          <rect x="10" y="76" width="68" height="22" rx="4" fill="#211006"/>
          <rect x="10" y="104" width="68" height="18" rx="4" fill="#FAF2E7"/>
          <rect x="96" y="14" width="62" height="9" rx="2" fill="#211006"/>
          <rect x="96" y="30" width="110" height="5" rx="2" fill="#D5BEA4"/>
          <rect x="96" y="40" width="96" height="5" rx="2" fill="#D5BEA4"/>
          <rect x="96" y="50" width="104" height="5" rx="2" fill="#D5BEA4"/>
          <rect x="96" y="66" width="110" height="50" rx="4" fill="#EEDBC4"/>
        </svg>`,
      },
      {
        key: "B",
        label: "方案 B",
        whyRight: "正确！侧边栏克制在约 22% 宽度，当前章节以清晰的朱红锚条与反色胶囊标明坐标，次级条目收敛安静，右侧留出近八成舒展空间给正文与图表。",
        svg: `<svg viewBox="0 0 220 132" role="img" aria-label="方案 B 缩微布局">
          <rect x="2" y="2" width="216" height="128" rx="6" fill="#FAF2E7" stroke="#4A2C1B" stroke-width="1.5"/>
          <rect x="2" y="2" width="48" height="128" rx="4" fill="#211006"/>
          <circle cx="26" cy="18" r="7" fill="#F66041"/>
          <rect x="8" y="34" width="36" height="13" rx="3" fill="#F66041"/>
          <rect x="10" y="54" width="30" height="5" rx="2" fill="#E8D2B5" opacity="0.7"/>
          <rect x="10" y="66" width="26" height="5" rx="2" fill="#E8D2B5" opacity="0.7"/>
          <rect x="10" y="78" width="32" height="5" rx="2" fill="#E8D2B5" opacity="0.7"/>
          <line x1="10" y1="96" x2="42" y2="96" stroke="#F66041" stroke-dasharray="2 3"/>
          <rect x="10" y="106" width="24" height="5" rx="2" fill="#E8D2B5" opacity="0.5"/>
          <rect x="62" y="14" width="64" height="10" rx="2" fill="#211006"/>
          <rect x="62" y="31" width="74" height="5" rx="2" fill="#D5BEA4"/>
          <rect x="62" y="41" width="68" height="5" rx="2" fill="#D5BEA4"/>
          <rect x="62" y="51" width="72" height="5" rx="2" fill="#D5BEA4"/>
          <rect x="144" y="14" width="62" height="46" rx="4" fill="#F66041"/>
          <polygon points="150,58 166,34 178,48 189,38 200,58" fill="#EEDBC4"/>
          <rect x="62" y="72" width="44" height="46" rx="4" fill="#EEDBC4"/>
          <rect x="112" y="72" width="44" height="46" rx="4" fill="#EEDBC4"/>
          <rect x="162" y="72" width="44" height="46" rx="4" fill="#EEDBC4"/>
        </svg>`,
      },
      {
        key: "C",
        label: "方案 C",
        whyWrong: "为了多挤主区宽度，把文字侧栏强压到 11%，结果每条章节名被迫折成两三行并截断成省略号，反而丧失了快速扫读的价值；想压窄应该切为纯图标轨。",
        svg: `<svg viewBox="0 0 220 132" role="img" aria-label="方案 C 缩微布局">
          <rect x="2" y="2" width="216" height="128" rx="6" fill="#FAF2E7" stroke="#4A2C1B" stroke-width="1.5"/>
          <rect x="2" y="2" width="24" height="128" rx="4" fill="#211006"/>
          <rect x="5" y="16" width="18" height="14" rx="2" fill="#F66041"/>
          <text x="14" y="26" text-anchor="middle" fill="#FFFFFF" font-size="6.5" font-family="Noto Sans SC, sans-serif">课…</text>
          <text x="14" y="44" text-anchor="middle" fill="#E8D2B5" font-size="6.5" font-family="Noto Sans SC, sans-serif">重…</text>
          <text x="14" y="60" text-anchor="middle" fill="#E8D2B5" font-size="6.5" font-family="Noto Sans SC, sans-serif">知…</text>
          <text x="14" y="76" text-anchor="middle" fill="#E8D2B5" font-size="6.5" font-family="Noto Sans SC, sans-serif">参…</text>
          <rect x="38" y="14" width="84" height="10" rx="2" fill="#211006"/>
          <rect x="38" y="32" width="166" height="5" rx="2" fill="#D5BEA4"/>
          <rect x="38" y="42" width="154" height="5" rx="2" fill="#D5BEA4"/>
          <rect x="38" y="56" width="50" height="62" rx="4" fill="#EEDBC4"/>
          <rect x="96" y="56" width="50" height="62" rx="4" fill="#EEDBC4"/>
          <rect x="154" y="56" width="50" height="62" rx="4" fill="#EEDBC4"/>
        </svg>`,
      },
      {
        key: "D",
        label: "方案 D",
        whyWrong: "虽然侧栏宽度比例合适，但全部导航条目长得一模一样、没有当前高亮与边界区隔，读者读完一屏后一眼辨不出自己正停在哪一节。",
        svg: `<svg viewBox="0 0 220 132" role="img" aria-label="方案 D 缩微布局">
          <rect x="2" y="2" width="216" height="128" rx="6" fill="#FAF2E7" stroke="#4A2C1B" stroke-width="1.5"/>
          <rect x="10" y="20" width="32" height="5" rx="2" fill="#C9B49C"/>
          <rect x="10" y="34" width="32" height="5" rx="2" fill="#C9B49C"/>
          <rect x="10" y="48" width="32" height="5" rx="2" fill="#C9B49C"/>
          <rect x="10" y="62" width="32" height="5" rx="2" fill="#C9B49C"/>
          <rect x="10" y="76" width="32" height="5" rx="2" fill="#C9B49C"/>
          <rect x="10" y="90" width="32" height="5" rx="2" fill="#C9B49C"/>
          <rect x="62" y="14" width="64" height="10" rx="2" fill="#211006"/>
          <rect x="62" y="31" width="74" height="5" rx="2" fill="#D5BEA4"/>
          <rect x="62" y="41" width="68" height="5" rx="2" fill="#D5BEA4"/>
          <rect x="144" y="14" width="62" height="46" rx="4" fill="#F66041"/>
          <rect x="62" y="72" width="44" height="46" rx="4" fill="#EEDBC4"/>
          <rect x="112" y="72" width="44" height="46" rx="4" fill="#EEDBC4"/>
          <rect x="162" y="72" width="44" height="46" rx="4" fill="#EEDBC4"/>
        </svg>`,
      },
    ],
  },
  {
    id: "q2",
    title: "题目 2 / 2 · 390px 手机竖屏形态退让",
    stem: "同一门 18 节课程被学员在 390px 宽的手机竖屏打开。只改变「侧边栏在窄屏上的处理方式」，哪个方案最能让读者既顺畅读正文又不迷路？",
    correct: "C",
    options: [
      {
        key: "A",
        label: "方案 A",
        whyWrong: "在 390px 窄屏仍硬留一条常驻左侧边栏，正文被压成极窄细列，一行放不下几个字，阅读体验直接崩塌。",
        svg: `<svg viewBox="0 0 220 132" role="img" aria-label="手机方案 A 硬留常驻左栏">
          <rect x="68" y="4" width="84" height="124" rx="10" fill="#FAF2E7" stroke="#4A2C1B" stroke-width="1.5"/>
          <rect x="68" y="4" width="34" height="124" rx="6" fill="#211006"/>
          <rect x="74" y="20" width="22" height="8" rx="2" fill="#F66041"/>
          <rect x="74" y="34" width="20" height="5" rx="2" fill="#E8D2B5"/>
          <rect x="74" y="46" width="20" height="5" rx="2" fill="#E8D2B5"/>
          <rect x="108" y="18" width="36" height="8" rx="2" fill="#211006"/>
          <rect x="108" y="32" width="36" height="4" rx="2" fill="#D5BEA4"/>
          <rect x="108" y="40" width="32" height="4" rx="2" fill="#D5BEA4"/>
          <rect x="108" y="48" width="36" height="4" rx="2" fill="#D5BEA4"/>
          <rect x="108" y="60" width="36" height="48" rx="3" fill="#EEDBC4"/>
        </svg>`,
      },
      {
        key: "B",
        label: "方案 B",
        whyWrong: "把 18 节目录全部平铺展开堆在正文上方，第一屏几乎全被目录列表占满，读者划两屏才看到真正要学的标题。",
        svg: `<svg viewBox="0 0 220 132" role="img" aria-label="手机方案 B 顶部全展开占满首屏">
          <rect x="68" y="4" width="84" height="124" rx="10" fill="#FAF2E7" stroke="#4A2C1B" stroke-width="1.5"/>
          <rect x="68" y="4" width="84" height="92" rx="8" fill="#211006"/>
          <rect x="76" y="14" width="68" height="9" rx="2" fill="#F66041"/>
          <rect x="76" y="29" width="58" height="5" rx="2" fill="#E8D2B5"/>
          <rect x="76" y="40" width="62" height="5" rx="2" fill="#E8D2B5"/>
          <rect x="76" y="51" width="54" height="5" rx="2" fill="#E8D2B5"/>
          <rect x="76" y="62" width="60" height="5" rx="2" fill="#E8D2B5"/>
          <rect x="76" y="73" width="56" height="5" rx="2" fill="#E8D2B5"/>
          <rect x="76" y="84" width="48" height="5" rx="2" fill="#E8D2B5"/>
          <rect x="76" y="104" width="52" height="7" rx="2" fill="#211006"/>
          <rect x="76" y="116" width="68" height="5" rx="2" fill="#D5BEA4"/>
        </svg>`,
      },
      {
        key: "C",
        label: "方案 C",
        whyRight: "正确！在窄屏顶部保留一行紧凑状态栏，直接标明当前章名与「目录」抽屉按钮，正文完整独占 100% 屏幕宽度，想跳章时一点即滑出抽屉。",
        svg: `<svg viewBox="0 0 220 132" role="img" aria-label="手机方案 C 顶部入口加按需抽屉">
          <rect x="68" y="4" width="84" height="124" rx="10" fill="#FAF2E7" stroke="#4A2C1B" stroke-width="1.5"/>
          <rect x="68" y="4" width="84" height="22" rx="8" fill="#211006"/>
          <rect x="76" y="11" width="24" height="9" rx="2" fill="#F66041"/>
          <rect x="106" y="13" width="38" height="5" rx="2" fill="#E8D2B5"/>
          <rect x="76" y="34" width="56" height="9" rx="2" fill="#211006"/>
          <rect x="76" y="49" width="68" height="5" rx="2" fill="#D5BEA4"/>
          <rect x="76" y="58" width="62" height="5" rx="2" fill="#D5BEA4"/>
          <rect x="76" y="69" width="68" height="32" rx="4" fill="#F66041"/>
          <polygon points="84,99 102,78 114,90 124,82 136,99" fill="#EEDBC4"/>
          <rect x="76" y="106" width="68" height="14" rx="3" fill="#EEDBC4"/>
        </svg>`,
      },
      {
        key: "D",
        label: "方案 D",
        whyWrong: "为了省空间干脆把目录入口彻底删掉，只留底部的「上一节 / 下一节」，读者想从第 3 节直接跳去第 15 节得连点十二次，信息可达性归零。",
        svg: `<svg viewBox="0 0 220 132" role="img" aria-label="手机方案 D 彻底删掉目录只留翻页">
          <rect x="68" y="4" width="84" height="124" rx="10" fill="#FAF2E7" stroke="#4A2C1B" stroke-width="1.5"/>
          <rect x="76" y="16" width="56" height="9" rx="2" fill="#211006"/>
          <rect x="76" y="32" width="68" height="5" rx="2" fill="#D5BEA4"/>
          <rect x="76" y="41" width="64" height="5" rx="2" fill="#D5BEA4"/>
          <rect x="76" y="52" width="68" height="44" rx="4" fill="#EEDBC4"/>
          <rect x="76" y="108" width="28" height="12" rx="3" fill="#211006"/>
          <rect x="116" y="108" width="28" height="12" rx="3" fill="#211006"/>
        </svg>`,
      },
    ],
  },
];

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function roundRectTop(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

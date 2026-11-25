// 031 X形构图 · 正文 01–07 节全部交互模块与原海报灯箱
import { loop, pixelRatio } from "../../lib/stage.js";

// =========================================================================
// 01 节：四阶步进力学解剖与视线脉冲画布（2D Canvas）
// =========================================================================
function initSection01() {
  const canvas = document.getElementById("mech-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const STEPS = [
    {
      id: "ortho",
      label: "01 正交静息",
      en: "ORTHOGONAL REST",
      title: "横平竖直贴合重力，眼睛最安心但也最安静",
      body: "视觉心理学中的「斜线效应」（Appelle, 1972）指出，人对水平与垂直方向的分辨精度高于倾斜角度。当线条顺着画框横竖摆放，视觉系统立刻判定它是稳固常态，注意力平稳漫游，不会产生突发冲力。",
      verdict: "状态：高稳定 · 低动势（示意）",
    },
    {
      id: "single",
      label: "02 单斜失重",
      en: "SINGLE DIAGONAL",
      title: "拧出一道斜线，画面有了速度却往一侧滑倒",
      body: "一旦线条偏离横竖坐标，格式塔心理学所称的「归位张力」（Arnheim, 1954）瞬间启动——大脑感觉它正在倾倒或俯冲。但单条斜线只有去向没有回拉，眼睛顺着斜坡滑到底角，容易直接溜出画框。",
      verdict: "状态：高动势 · 单边失衡（示意）",
    },
    {
      id: "cross",
      label: "03 双斜互锁",
      en: "COUNTER-LOCKED X",
      title: "加上反向对角线，两股倾倒之力当场锁死成 X",
      body: "第二条反向斜线以相反的倾势切进来，把第一条斜线往外滑坠的趋势一把拽住。两股力量在交叉点对冲归零，于是整张画面同时获得「斜线的速度感」与「对称托举的稳定感」——这就是海报讲的张力与平衡。",
      verdict: "状态：动静互锁 · 四翼聚力（示意）",
    },
    {
      id: "locked",
      label: "04 焦圆落锁",
      en: "FOCAL ANCHOR",
      title: "主角落进交汇中心，四路视线汇成一个落脚点",
      body: "把最关键的标题、人物剪影或产品放在双线交叉处，四条斜向通道便成了天然导流槽：无论读者先从哪一个角扫进来，目光都会被斜边界送进圆心，在交点处停驻并穿越。",
      verdict: "状态：强聚焦 · 完整 X 构图（示意）",
    },
  ];

  let stepIdx = 0;
  let pulseT = 0;
  let pulseActive = false;

  const btns = [...document.querySelectorAll("[data-mech-step]")];
  const btnPulse = document.getElementById("btn-mech-pulse");
  const elEn = document.getElementById("mech-en");
  const elTitle = document.getElementById("mech-title");
  const elBody = document.getElementById("mech-body");
  const elVerdict = document.getElementById("mech-verdict");

  function syncStep() {
    const s = STEPS[stepIdx];
    for (let i = 0; i < btns.length; i++) {
      const on = i === stepIdx;
      btns[i].classList.toggle("is-active", on);
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (elEn) elEn.textContent = s.en;
    if (elTitle) elTitle.textContent = s.title;
    if (elBody) elBody.textContent = s.body;
    if (elVerdict) elVerdict.textContent = s.verdict;
  }

  function draw(t, dt, { still }) {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(240, Math.round(r.width));
    const h = Math.max(200, Math.round(r.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    if (pulseActive && !still) {
      pulseT += Math.max(dt, 0.016) * 0.85;
      if (pulseT >= 1.15) {
        pulseActive = false;
        pulseT = 0;
      }
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 纸底
    ctx.fillStyle = "#F2EADF";
    ctx.fillRect(0, 0, w, h);

    // 细参照网格
    ctx.strokeStyle = "rgba(17,17,15,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 40; x < w; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 40; y < h; y += 40) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();

    const cx = w * 0.5;
    const cy = h * 0.5;
    const pad = Math.min(w, h) * 0.11;
    const wave = still ? 0.55 : (pulseActive ? Math.min(1, pulseT) : ((t * 0.35) % 1));

    if (stepIdx === 0) {
      // 正交静息：规整横竖线 + 平稳水平扫视点
      ctx.strokeStyle = "#155752";
      ctx.lineWidth = 2.4;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(pad, cy); ctx.lineTo(w - pad, cy);
      ctx.moveTo(cx, pad); ctx.lineTo(cx, h - pad);
      ctx.stroke();
      ctx.setLineDash([]);

      // 四角稳态方框示意
      ctx.strokeStyle = "rgba(17,17,15,0.22)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(pad * 1.4, pad * 1.2, w - pad * 2.8, h - pad * 2.4);

      // 视线平稳水平缓行
      const px = pad + (w - pad * 2) * wave;
      ctx.fillStyle = "#226762";
      ctx.beginPath();
      ctx.arc(px, cy, 6.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#155752";
      ctx.font = `600 12px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("横竖基准：重力稳态", cx, h - 18);
    } else if (stepIdx === 1) {
      // 单斜失重：左下橙楔 + 单条左上-右下斜线 + 滑向底角红球
      ctx.fillStyle = "rgba(243, 108, 70, 0.85)";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.18);
      ctx.lineTo(w * 0.86, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#B0251C";
      ctx.lineWidth = 2.6;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.moveTo(pad, pad * 0.9);
      ctx.lineTo(w - pad, h - pad * 0.9);
      ctx.stroke();
      ctx.setLineDash([]);

      // 滑落点一路冲向右下角
      const sx = pad + (w - pad * 2) * wave;
      const sy = pad * 0.9 + (h - pad * 1.8) * wave;
      ctx.fillStyle = "#B0251C";
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FAF6F0";
      ctx.fillRect(w - 132, h - 42, 120, 26);
      ctx.strokeStyle = "#B0251C";
      ctx.strokeRect(w - 132, h - 42, 120, 26);
      ctx.fillStyle = "#B0251C";
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("视线沿斜坡滑出", w - 72, h - 29);
    } else {
      // 双斜互锁（step 2 & 3）：对称赤橘双楔 + 双对角虚轴 + 四向汇聚粒子
      const gap = Math.min(w, h) * 0.16;
      ctx.fillStyle = "#F36C46";
      // 左楔
      ctx.beginPath();
      ctx.moveTo(0, h * 0.12);
      ctx.lineTo(cx - gap, cy);
      ctx.lineTo(0, h * 0.88);
      ctx.closePath();
      ctx.fill();
      // 右楔
      ctx.beginPath();
      ctx.moveTo(w, h * 0.12);
      ctx.lineTo(cx + gap, cy);
      ctx.lineTo(w, h * 0.88);
      ctx.closePath();
      ctx.fill();

      // 两条深松石青对角虚轴
      ctx.strokeStyle = "#093D3B";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(pad, pad * 0.85); ctx.lineTo(w - pad, h - pad * 0.85);
      ctx.moveTo(pad, h - pad * 0.85); ctx.lineTo(w - pad, pad * 0.85);
      ctx.stroke();
      ctx.setLineDash([]);

      // 四角汇聚脉冲点
      const corners = [
        [pad, pad * 0.85],
        [w - pad, pad * 0.85],
        [pad, h - pad * 0.85],
        [w - pad, h - pad * 0.85],
      ];
      for (const [x0, y0] of corners) {
        const px = x0 + (cx - x0) * wave;
        const py = y0 + (cy - y0) * wave;
        ctx.fillStyle = "#093D3B";
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (stepIdx === 2) {
        // 仅展示互锁矢量环
        ctx.strokeStyle = "#093D3B";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#11110F";
        ctx.font = `700 12px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("反向力抵消锁死", cx, h - 16);
      } else {
        // step 3：深松石焦圆落锁 + 脉冲回响环
        const baseR = Math.min(w, h) * 0.11;
        if (pulseActive) {
          ctx.strokeStyle = `rgba(34, 103, 98, ${(1 - wave * 0.85).toFixed(2)})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, baseR + wave * 36, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.strokeStyle = "#226762";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * 1.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#FAF6F0";
        ctx.beginPath();
        ctx.arc(cx, cy, baseR + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#226762";
        ctx.beginPath();
        ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#093D3B";
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * 0.36, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#093D3B";
        ctx.font = `700 12px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("四路视线收束于圆心", cx, h - 16);
      }
    }

    ctx.restore();
  }

  const runner = loop(canvas, draw);
  syncStep();
  runner.draw();

  btns.forEach((b, i) => {
    b.addEventListener("click", () => {
      stepIdx = i;
      pulseT = 0;
      pulseActive = true;
      syncStep();
      runner.draw();
    });
  });

  if (btnPulse) {
    btnPulse.addEventListener("click", () => {
      pulseT = 0;
      pulseActive = true;
      runner.draw();
    });
  }
}

// =========================================================================
// 02 节：四大变化参数 2×2 实战海报切镜 + 显/隐 X 骨架剥离开关
// =========================================================================
function initSection02() {
  const wrap = document.getElementById("var-grid");
  const toggleBtn = document.getElementById("btn-xray-toggle");
  const noteEl = document.getElementById("var-xray-note");
  if (!wrap || !toggleBtn) return;

  let xray = false;
  const sync = () => {
    wrap.dataset.xray = xray ? "on" : "off";
    toggleBtn.setAttribute("aria-pressed", xray ? "true" : "false");
    toggleBtn.classList.toggle("is-active", xray);
    toggleBtn.textContent = xray ? "还原成稿视图" : "剥离查看 X 骨架";
    if (noteEl) {
      noteEl.textContent = xray
        ? "已显露底层骨架：注意隐性 X 不必画实体粗线，光束、文字切角和体块斜边同样织出交叉通道。"
        : "当前为海报成稿视角。按下按钮剥离表层图形，直看四种 X 骨架怎样驱动画面。";
    }
  };
  toggleBtn.addEventListener("click", () => {
    xray = !xray;
    sync();
  });
  sync();
}

// =========================================================================
// 03 节：深松石暗室 · 四病灶点检与原地翻牌修复台
// =========================================================================
function initSection03() {
  const FAULTS = {
    flat: {
      badge: "病灶 01 · 夹角畸形",
      title: "夹角太扁成横带，太尖成细缝",
      badDesc: "双斜夹角跌破 38° 时，斜向冲力消散，只剩扁平横隙；超过 114° 时，左右楔块几乎挤合，中心主角被夹窒息。",
      goodDesc: "经验参考带：把水平张角落在 42°–96°（经典海报常见 54°–78°），斜线既明显跳出横竖坐标系，又给上下留出呼吸通道。",
      metricBad: "实测：夹角 20°（过扁）",
      metricGood: "修后：夹角 64°（舒展互锁）",
    },
    skew: {
      badge: "病灶 02 · 翼重失衡",
      title: "一侧楔块压死，张力变成翻船",
      badDesc: "很多人以为斜构图就是「越偏越酷」，结果左半铺满重色块、右半空荡无托举，读者看两秒就觉得画面往左边倒。",
      goodDesc: "经验参考带：控制左右楔体视觉面积比在 1:1 至 1.38:1 之间；若一侧用了大块暗色，另一侧可用明度对比或小重块远臂配平。",
      metricBad: "实测：左/右楔比 3.1:1",
      metricGood: "修后：左/右楔比 1.08:1",
    },
    hollow: {
      badge: "病灶 03 · 交点空心或硬撞",
      title: "四路视线送到中心，结果中心啥也没有或糊成一团",
      badDesc: "把核心主体藏在边角，或把大段正文横穿交汇处，都会毁掉 X 最值钱的交点红利——视线冲过来却找不到落脚处。",
      goodDesc: "经验参考带：核心主角锚在交点偏移 ≤ 8% 的圆心区内；说明文字收进上下或左右安静负形区，不和交叉主线抢地盘。",
      metricBad: "实测：主体偏核 31%",
      metricGood: "修后：主体锁心 0% 偏移",
    },
    five: {
      badge: "病灶 04 · 五点抢戏",
      title: "四角塞满大标大徽，四隅和中心同时喊话",
      badDesc: "为了不浪费角落空白，把四张大图或四个高饱和图标塞进四端，人眼在四角与中心之间来回弹跳，整张 X 瞬间炸散。",
      goodDesc: "经验参考带：四条斜翼负责「送视线」，只放极轻量导引信息或保持纯色楔块；整幅画只留交汇中心一个最高对比焦点。",
      metricBad: "实测：5 处同等高对比噪点",
      metricGood: "修后：1 个主焦点 + 4 条净翼",
    },
  };

  const tabBtns = [...document.querySelectorAll("button[data-fault]")];
  const toggleFix = document.getElementById("btn-fault-fix");
  const stage = document.getElementById("fault-stage");
  const elBadge = document.getElementById("fault-badge");
  const elTitle = document.getElementById("fault-title");
  const elDesc = document.getElementById("fault-desc");
  const elMetric = document.getElementById("fault-metric");
  const elStatePill = document.getElementById("fault-state-pill");

  if (!tabBtns.length || !stage) return;
  let current = "flat";
  let fixed = false;

  function render() {
    const f = FAULTS[current];
    stage.dataset.fault = current;
    stage.dataset.fixed = fixed ? "true" : "false";
    for (const b of tabBtns) {
      const on = b.dataset.fault === current;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (elBadge) elBadge.textContent = f.badge;
    if (elTitle) elTitle.textContent = f.title;
    if (elDesc) elDesc.textContent = fixed ? f.goodDesc : f.badDesc;
    if (elMetric) elMetric.textContent = fixed ? f.metricGood : f.metricBad;
    if (elStatePill) {
      elStatePill.textContent = fixed ? "已诊治 · 成立态" : "当前 · 翻车态";
      elStatePill.dataset.fixed = fixed ? "true" : "false";
    }
    if (toggleFix) {
      toggleFix.textContent = fixed ? "退回翻车对比" : "原地诊治这一处";
      toggleFix.setAttribute("aria-pressed", fixed ? "true" : "false");
    }
  }

  tabBtns.forEach((b) => {
    b.addEventListener("click", () => {
      current = b.dataset.fault;
      fixed = false;
      render();
    });
  });

  if (toggleFix) {
    toggleFix.addEventListener("click", () => {
      fixed = !fixed;
      render();
    });
  }
  render();
}

// =========================================================================
// 04 节：从巴洛克到瑞士海报 · 四时代胶片轴切换
// =========================================================================
function initSection04() {
  const ERAS = {
    "1610": {
      year: "1610–1611",
      era: "巴洛克剧场斜交",
      work: "鲁本斯《上十字架》",
      place: "安特卫普圣母大教堂（CODART 典藏档案）",
      note: "文艺复兴偏爱金字塔与正交稳态；鲁本斯在《上十字架》里把沉重木架斜贯整张祭坛画，再用反方向拉拽的人体肌肉线条与斜杠对冲，在画面中段锁出爆发性的交叉张力，开启了西方绘画大规模运用斜交动势的先河。",
      diagram: "baroque",
    },
    "1903": {
      year: "1903",
      era: "学院构图图式化",
      work: "亨利·兰金·普尔《绘画构图与画作评判》",
      place: "纽约 The Baker & Taylor Co. 首版（Internet Archive 存原版扫描）",
      note: "美国画家兼理论家亨利·兰金·普尔在 1903 年的构图教材中，把绘画背后的抽象骨架归纳为十字、放射线、三角形、S 形等「基本形态」，指出交叉轴线与放射视线能把散落物象拧成一个紧绷且平衡的视觉中心。",
      diagram: "poore",
    },
    "1920": {
      year: "1919–1926",
      era: "先锋红楔与包豪斯力学",
      work: "利西茨基《以红楔击溃白军》· 康定斯基《点、线到面》",
      place: "泰特美术馆藏版画（1920）· 包豪斯丛书第 9 卷（1926）",
      note: "俄国先锋艺术家利西茨基用锐利赤红三角形斜劈画框，把纯几何楔块做成极具速度感的海报武器；1926 年康定斯基在包豪斯出版《点、线到面》（1947 年古根海姆基金会推出英文版），进一步从「基础平面」分析两条对角线的不同心理张力，让斜交构图脱离具象绘画、成为现代平面设计通用语法。",
      diagram: "bauhaus",
    },
    "1958": {
      year: "1954–1972",
      era: "瑞士海报与视觉心理学实证",
      work: "阿恩海姆《艺术与视知觉》· 米勒-布罗克曼《Musica Viva》· 阿佩尔「斜线效应」",
      place: "加州大学出版社（1954）· MoMA 藏（1958）· Psychological Bulletin（1972）",
      note: "1954 年阿恩海姆用格式塔心理学解释为何偏离横竖的斜线自带归位张力；1958 年瑞士平面大师米勒-布罗克曼在《Musica Viva》音乐会海报里以严密斜向几何格网拉出震撼节奏；1972 年心理学家斯图尔特·阿佩尔综述确立「斜线效应」，从视觉神经机制坐实了斜角对注意力的特殊唤起。",
      diagram: "swiss",
    },
  };

  const btns = [...document.querySelectorAll("[data-era]")];
  const elYear = document.getElementById("era-year");
  const elName = document.getElementById("era-name");
  const elWork = document.getElementById("era-work");
  const elPlace = document.getElementById("era-place");
  const elNote = document.getElementById("era-note");
  const diagBox = document.getElementById("era-diagram");
  if (!btns.length || !diagBox) return;

  function select(key) {
    const d = ERAS[key];
    if (!d) return;
    for (const b of btns) {
      const on = b.dataset.era === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (elYear) elYear.textContent = d.year;
    if (elName) elName.textContent = d.era;
    if (elWork) elWork.textContent = d.work;
    if (elPlace) elPlace.textContent = d.place;
    if (elNote) elNote.textContent = d.note;
    diagBox.dataset.diagram = d.diagram;
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.era)));
  select("1610");
}

// =========================================================================
// 05 节：什么时候用、什么时候别用 · 6 枚真实项目卡分拣台
// =========================================================================
function initSection05() {
  const CARDS = [
    {
      id: "sneaker",
      name: "运动鞋新品发布主视觉",
      tag: "产品展示 · 运动主题",
      fit: true,
      verdict: "强烈推荐 X 形构图",
      reason: "球鞋鞋身与反向速度光束天然交叉在画心，四条斜边把速度、爆发力与产品轮廓同时锁死在第一眼。",
      alt: null,
    },
    {
      id: "finance",
      name: "季度财务报表与指标总览",
      tag: "数据看板 · 多栏核对",
      fit: false,
      verdict: "别用 X 形构图",
      reason: "财务阅读需要逐行横向比对数字。硬加斜向对角切割会打碎列对齐基准，让读数眼睛反复撞上斜边界。",
      alt: { label: "改看 030 十字构图 或网格排版", href: "https://layout.xiaoxiaodong.ai/030/play/" },
    },
    {
      id: "festival",
      name: "电子音乐节街头海报",
      tag: "海报设计 · 动态叙事",
      fit: true,
      verdict: "非常适合 X 形构图",
      reason: "街头海报只有 1–2 秒抓人窗口。左右大楔形劈开纸面，交汇处放乐队核心徽标，远距离就能一眼压住杂乱墙面。",
      alt: null,
    },
    {
      id: "longread",
      name: "万字人物特写长文内页",
      tag: "长文阅读 · 连续扫读",
      fit: false,
      verdict: "别用 X 形构图",
      reason: "X 的本质是把视线死死吸回中心一个点，和长文「从上到下连贯顺读」的目标正好拧着来，读两段就视觉疲劳。",
      alt: { label: "改看 035 Z 形构图（顺畅扫读路径）", href: "https://layout.xiaoxiaodong.ai/035/play/" },
    },
    {
      id: "bridge",
      name: "城市立交桥与地铁通道摄影",
      tag: "摄影构图 · 建筑透视",
      fit: true,
      verdict: "天生适配 X 形构图",
      reason: "交叉引桥、扶手或屋顶钢桁架自带四向透视引导线，把人物剪影或车辆定格在交点，空间纵深与张力双收。",
      alt: null,
    },
    {
      id: "gov",
      name: "博物馆典藏名录 / 权威公告",
      tag: "沉静秩序 · 多项并列",
      fit: false,
      verdict: "别用 X 形构图",
      reason: "这里需要端庄中立和平等并列，而不是冲突与冲击感。强行斜切反而显得浮躁，也容不下四个以上同等主角。",
      alt: { label: "改看 032 T 形构图 或 033 L 形构图", href: "https://layout.xiaoxiaodong.ai/032/play/" },
    },
  ];

  const cardBtns = [...document.querySelectorAll("[data-case]")];
  const outVerdict = document.getElementById("case-verdict");
  const outReason = document.getElementById("case-reason");
  const outAlt = document.getElementById("case-alt");
  const outBox = document.getElementById("case-result");
  if (!cardBtns.length || !outBox) return;

  function pick(id) {
    const item = CARDS.find((c) => c.id === id);
    if (!item) return;
    for (const b of cardBtns) {
      const on = b.dataset.case === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    }
    outBox.dataset.fit = item.fit ? "yes" : "no";
    if (outVerdict) outVerdict.textContent = `${item.name} — ${item.verdict}`;
    if (outReason) outReason.textContent = item.reason;
    if (outAlt) {
      if (item.alt) {
        outAlt.hidden = false;
        outAlt.innerHTML = `替代建议：<a href="${item.alt.href}" target="_blank" rel="noopener">${item.alt.label} →</a>`;
      } else {
        outAlt.hidden = true;
        outAlt.textContent = "";
      }
    }
  }

  cardBtns.forEach((b) => b.addEventListener("click", () => pick(b.dataset.case)));
  pick("sneaker");
}

// =========================================================================
// 06 节：挑一挑 · 两道单变量精绘 SVG 挑选题
// =========================================================================
function initSection06() {
  const QUESTIONS = [
    {
      id: "q1",
      prompt: "第 1 题（单变量：主体与交点关系）—— 同样是「城市夜跑节」双楔海报，四版夹角都是 62°、左右楔完全对称、文字量一致，只有核心主体与主标落位不同。哪一版最发挥出 X 形构图的聚焦力？",
      answer: "A",
      explain: {
        A: "选对了！方案 A 把核心主角稳稳锁在两条斜线交汇圆心，副标题与日期收进上下安静负形区。四条斜向通道顺畅汇入圆心，视线一落地就接住主角。",
        B: "再看一眼交汇中心：方案 B 把主角挪到了左侧楔缘，四条斜线拼命把眼睛送到中间，中心却一片空心，注意力在「看交点」和「找主角」之间来回扯裂。",
        C: "问题出在压死通道：方案 C 把大块横向文字板直接横压过交汇处与三条斜翼，把引导视线的 X 通道盖平了，张力大打折扣。",
        D: "方案 D 把主体拆成四等份塞到四个角里，结果四角和中心一起抢戏，X 构图最擅长的「单一强焦点」彻底散掉。",
      },
      options: [
        { key: "A", label: "方案 A · 中轴交汇" },
        { key: "B", label: "方案 B · 左侧楔缘" },
        { key: "C", label: "方案 C · 跨翼满铺" },
        { key: "D", label: "方案 D · 四角分置" },
      ],
    },
    {
      id: "q2",
      prompt: "第 2 题（单变量：双斜夹角与互锁）—— 同样做「建筑双年展」封面，主角都居中落在圆心、文案字数相同，只有对角斜线的夹角与结构不同。哪一版同时稳住了张力与平衡？",
      answer: "B",
      explain: {
        A: "方案 A 的双斜夹角只有 18°，近乎一条扁平横带压过画面，斜向速度感消失，失去了 X 构图的垂直穿插张力。",
        B: "选对了！方案 B 以约 62° 舒展交角形成双斜互锁，左右双楔体量对等托举，既打破正交静默，又把视线干脆利落地收拢到圆心主体。",
        C: "方案 C 只有左上到右下一条 45° 单斜线，缺少反向副对角拉住它，整张封面向右下角滑坠，张力有余而平衡不足。",
        D: "方案 D 的夹角拉尖到 142°，左右双楔几乎贴近竖直合拢，把上下通道夹成两条细缝，中心主角显得紧绷局促。",
      },
      options: [
        { key: "A", label: "方案 A · 18° 浅斜" },
        { key: "B", label: "方案 B · 62° 互锁" },
        { key: "C", label: "方案 C · 45° 单斜" },
        { key: "D", label: "方案 D · 142° 锐夹" },
      ],
    },
  ];

  // 生成每道题 4 张精绘 SVG 海报卡（严守单变量、无吓人五官、纯几何排版示范）
  function cardSVG(qId, key, revealed) {
    const showArrows = revealed ? 1 : 0;
    if (qId === "q1") {
      // 固定 62° 左右对称双楔
      const base = `
        <rect width="200" height="250" fill="#F2EADF"/>
        <polygon points="0,32 76,125 0,218" fill="#F36C46"/>
        <polygon points="200,32 124,125 200,218" fill="#F36C46"/>
        <line x1="16" y1="24" x2="184" y2="226" stroke="#155752" stroke-width="1.6" stroke-dasharray="5 4" opacity="${revealed ? 0.95 : 0.42}"/>
        <line x1="184" y1="24" x2="16" y2="226" stroke="#155752" stroke-width="1.6" stroke-dasharray="5 4" opacity="${revealed ? 0.95 : 0.42}"/>
      `;
      let subject = "";
      if (key === "A") {
        subject = `
          <circle cx="100" cy="125" r="28" fill="#FAF6F0"/>
          <circle cx="100" cy="125" r="24" fill="#226762"/>
          <polygon points="92,115 113,125 92,135" fill="#FAF6F0"/>
          <rect x="64" y="20" width="72" height="10" fill="#11110F"/>
          <rect x="74" y="220" width="52" height="6" fill="#3A4440"/>
        `;
      } else if (key === "B") {
        subject = `
          <circle cx="38" cy="125" r="24" fill="#FAF6F0"/>
          <circle cx="38" cy="125" r="20" fill="#226762"/>
          <polygon points="32,117 49,125 32,133" fill="#FAF6F0"/>
          <rect x="64" y="20" width="72" height="10" fill="#11110F"/>
          <rect x="74" y="220" width="52" height="6" fill="#3A4440"/>
          ${showArrows ? `<circle cx="100" cy="125" r="18" fill="none" stroke="#B0251C" stroke-width="2" stroke-dasharray="4 3"/>` : ""}
        `;
      } else if (key === "C") {
        subject = `
          <rect x="14" y="92" width="172" height="66" fill="#11110F"/>
          <rect x="28" y="108" width="144" height="10" fill="#FAF6F0"/>
          <rect x="28" y="126" width="112" height="7" fill="#F36C46"/>
          <rect x="28" y="140" width="88" height="6" fill="#A5B5AF"/>
          <rect x="64" y="20" width="72" height="10" fill="#11110F"/>
        `;
      } else {
        subject = `
          <circle cx="32" cy="40" r="16" fill="#226762"/>
          <circle cx="168" cy="40" r="16" fill="#226762"/>
          <circle cx="32" cy="210" r="16" fill="#226762"/>
          <circle cx="168" cy="210" r="16" fill="#226762"/>
          <circle cx="100" cy="125" r="5" fill="#11110F"/>
        `;
      }
      return `<svg viewBox="0 0 200 250" width="200" height="250" aria-hidden="true">${base}${subject}</svg>`;
    }

    // 第 2 题：主体统一居中圆心，只变双斜夹角与互锁结构
    let bg = `<rect width="200" height="250" fill="#F2EADF"/>`;
    if (key === "A") {
      // 18° 浅斜：近乎水平扁条
      bg += `
        <polygon points="0,104 72,125 0,146" fill="#F36C46"/>
        <polygon points="200,104 128,125 200,146" fill="#F36C46"/>
        <line x1="12" y1="108" x2="188" y2="142" stroke="#155752" stroke-width="1.6" stroke-dasharray="5 4" opacity="${revealed ? 0.95 : 0.45}"/>
        <line x1="188" y1="108" x2="12" y2="142" stroke="#155752" stroke-width="1.6" stroke-dasharray="5 4" opacity="${revealed ? 0.95 : 0.45}"/>
      `;
    } else if (key === "B") {
      // 62° 互锁
      bg += `
        <polygon points="0,32 76,125 0,218" fill="#F36C46"/>
        <polygon points="200,32 124,125 200,218" fill="#F36C46"/>
        <line x1="16" y1="24" x2="184" y2="226" stroke="#155752" stroke-width="1.6" stroke-dasharray="5 4" opacity="${revealed ? 0.95 : 0.45}"/>
        <line x1="184" y1="24" x2="16" y2="226" stroke="#155752" stroke-width="1.6" stroke-dasharray="5 4" opacity="${revealed ? 0.95 : 0.45}"/>
      `;
    } else if (key === "C") {
      // 45° 单斜
      bg += `
        <polygon points="0,42 184,250 0,250" fill="#F36C46"/>
        <line x1="14" y1="22" x2="186" y2="228" stroke="#155752" stroke-width="1.8" stroke-dasharray="5 4" opacity="${revealed ? 0.95 : 0.5}"/>
      `;
    } else {
      // 142° 锐夹
      bg += `
        <polygon points="0,0 82,0 92,125 82,250 0,250" fill="#F36C46"/>
        <polygon points="200,0 118,0 108,125 118,250 200,250" fill="#F36C46"/>
        <line x1="88" y1="12" x2="112" y2="238" stroke="#155752" stroke-width="1.6" stroke-dasharray="5 4" opacity="${revealed ? 0.95 : 0.45}"/>
        <line x1="112" y1="12" x2="88" y2="238" stroke="#155752" stroke-width="1.6" stroke-dasharray="5 4" opacity="${revealed ? 0.95 : 0.45}"/>
      `;
    }
    const core = `
      <circle cx="100" cy="125" r="24" fill="#FAF6F0"/>
      <circle cx="100" cy="125" r="20" fill="#226762"/>
      <rect x="92" y="117" width="16" height="16" fill="#093D3B"/>
      <rect x="64" y="18" width="72" height="9" fill="#11110F"/>
      <rect x="74" y="224" width="52" height="6" fill="#3A4440"/>
    `;
    return `<svg viewBox="0 0 200 250" width="200" height="250" aria-hidden="true">${bg}${core}</svg>`;
  }

  let qIdx = 0;
  const picked = { q1: null, q2: null };

  const qTabs = [...document.querySelectorAll("[data-quiz-tab]")];
  const elPrompt = document.getElementById("quiz-prompt");
  const elGrid = document.getElementById("quiz-grid");
  const elFeedback = document.getElementById("quiz-feedback");
  const elScore = document.getElementById("quiz-score");
  if (!elGrid) return;

  function renderQuiz() {
    const q = QUESTIONS[qIdx];
    const userPick = picked[q.id];
    const revealed = userPick !== null;

    qTabs.forEach((b, i) => {
      const on = i === qIdx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });

    if (elPrompt) elPrompt.textContent = q.prompt;
    if (elScore) {
      const done = Object.values(picked).filter(Boolean).length;
      const right = QUESTIONS.filter((x) => picked[x.id] === x.answer).length;
      elScore.textContent = done ? `已完成 ${done} / 2 题 · 答对 ${right} 题` : "点选下方任意方案检验眼力";
    }

    elGrid.innerHTML = q.options.map((opt) => {
      let stateAttr = "";
      if (revealed) {
        if (opt.key === q.answer) stateAttr = `data-judge="correct"`;
        else if (opt.key === userPick) stateAttr = `data-judge="wrong"`;
      }
      return `
        <button type="button" class="quiz-card" data-opt="${opt.key}" ${stateAttr} aria-pressed="${userPick === opt.key ? "true" : "false"}">
          <span class="quiz-art">${cardSVG(q.id, opt.key, revealed)}</span>
          <span class="quiz-label">${opt.label}</span>
        </button>
      `;
    }).join("");

    elGrid.querySelectorAll("[data-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked[q.id] = btn.dataset.opt;
        renderQuiz();
      });
    });

    if (elFeedback) {
      if (!revealed) {
        elFeedback.dataset.status = "idle";
        elFeedback.textContent = "先观察四张海报唯一不同的那个变量，再点选你认为最成立的一版。";
      } else {
        const isRight = userPick === q.answer;
        elFeedback.dataset.status = isRight ? "ok" : "warn";
        elFeedback.textContent = `${isRight ? "判断准确 · " : `再比对一下（正解为方案 ${q.answer}）· `}${q.explain[userPick]}`;
      }
    }
  }

  qTabs.forEach((b, i) => b.addEventListener("click", () => {
    qIdx = i;
    renderQuiz();
  }));

  renderQuiz();
}

// =========================================================================
// 07 节：原海报全屏灯箱（支持放大、拖动、滚轮、Esc 关闭）
// =========================================================================
function initPosterLightbox() {
  const thumbBtn = document.getElementById("poster-open");
  const thumbImg = document.getElementById("poster");
  const modal = document.getElementById("poster-lightbox");
  const stage = document.getElementById("lb-stage");
  const lbImg = document.getElementById("lb-img");
  const btnClose = document.getElementById("lb-close");
  const btnZoomIn = document.getElementById("lb-in");
  const btnZoomOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const elZoom = document.getElementById("lb-zoom");

  if (!thumbBtn || !thumbImg || !modal || !lbImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function apply() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (elZoom) elZoom.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = thumbImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    btnClose?.focus();
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
    thumbBtn.focus();
  }

  thumbBtn.addEventListener("click", open);
  btnClose?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  window.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "+" || e.key === "=") { scale = Math.min(3.5, +(scale + 0.35).toFixed(2)); apply(); }
    else if (e.key === "-") { scale = Math.max(0.8, +(scale - 0.35).toFixed(2)); apply(); }
    else if (e.key === "0") { scale = 1; tx = 0; ty = 0; apply(); }
  });

  btnZoomIn?.addEventListener("click", () => { scale = Math.min(3.5, +(scale + 0.35).toFixed(2)); apply(); });
  btnZoomOut?.addEventListener("click", () => { scale = Math.max(0.8, +(scale - 0.35).toFixed(2)); apply(); });
  btnReset?.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; apply(); });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.8, Math.min(3.5, +(scale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2)));
    apply();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    drag = { x: e.clientX - tx, y: e.clientY - ty };
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = e.clientX - drag.x;
    ty = e.clientY - drag.y;
    apply();
  });
  stage.addEventListener("pointerup", () => { drag = null; });
  stage.addEventListener("pointercancel", () => { drag = null; });
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

// 324 截景式构图 —— 01 至 07 节全部独立交互控件
// 保证相邻两节绝不用同一种控件做同一件事：
// 01 实体对比卷帘 | 02 切刃落点标尺 | 03 历史节点×伯奇画外六空间罗盘
// 04 同景五式转换台 | 05 六大场景裁决板 | 06 四方案实图小练习 | 07 原海报缩放灯箱
import { BLADE_LAB, BURCH_ZONES, HISTORY_ITEMS, QUIZ_OPTIONS, SCENARIOS, SIBLING_MODES } from "./model.js";

// ---------- 01 节：实体对比卷帘（向心画框 vs 离心遮幅） ----------
export function mountSection01() {
  const wrap = document.getElementById("curtain-stage");
  const range = document.getElementById("curtain-range");
  const cropLayer = document.getElementById("curtain-crop-layer");
  const divider = document.getElementById("curtain-divider");
  const ghostBtn = document.getElementById("curtain-ghost-btn");
  const ghostLayers = [...document.querySelectorAll("[data-s1-ghost]")];
  const readout = document.getElementById("curtain-readout");
  const sceneBtns = [...document.querySelectorAll("[data-s1-scene]")];
  if (!wrap || !range) return;

  let split = 52; // 0..100%，左侧全景封闭，右侧截景切边
  let showGhost = true;
  let scene = "ring";

  const SCENE_META = {
    ring: {
      label: "原海报双环",
      fullText: "全景全收：圆环完整落在框中，四周空出匀称朱砂底，眼睛一眼看完就停住了。",
      cropText: "截景切边：只露六成弧面却像一座庞然大物撞进画框，大脑在画外补出约 2 倍体量。",
    },
    stone: {
      label: "溪石寒梅",
      fullText: "全景全收：整块石与整株梅都装在框里，变成温和的小盆景，缺少山涧奇险。",
      cropText: "截景切边：巨石底边与梅枝右端干脆冲出画外，眼前立现近在咫尺的幽涧绝壁。",
    },
    bike: {
      label: "街头疾驰",
      fullText: "全景全收：整辆单车横在画中，像产品目录侧视图，静止而客套。",
      cropText: "截景切边：左框切掉半个后轮、前方留出开阔路面，车速与扑面而来的现场感立刻出现。",
    },
  };

  function update() {
    cropLayer.style.clipPath = `inset(0 0 0 ${split}%)`;
    divider.style.left = `${split}%`;
    range.value = String(Math.round(split));
    ghostLayers.forEach((g) => { g.style.opacity = showGhost ? "1" : "0"; });
    if (ghostBtn) {
      ghostBtn.setAttribute("aria-pressed", String(showGhost));
      ghostBtn.textContent = showGhost ? "画外脑补轮廓：开" : "画外脑补轮廓：关";
    }
    const meta = SCENE_META[scene];
    if (readout) {
      if (split >= 72) readout.textContent = `当前偏重「向心画框（全景）」：${meta.fullText}`;
      else if (split <= 28) readout.textContent = `当前偏重「离心遮幅（截景）」：${meta.cropText}`;
      else readout.textContent = `左右同屏对照（卷帘 ${Math.round(split)}%）：左为向心封闭，右为离心截景。左右拖动卷帘看体量错觉如何瞬间翻转。`;
    }
  }

  function setScene(next) {
    scene = next;
    sceneBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.s1Scene === next));
    document.querySelectorAll("[data-s1-art]").forEach((el) => {
      el.style.display = el.dataset.s1Art === next ? "" : "none";
    });
    update();
  }

  range.addEventListener("input", () => {
    split = Number(range.value);
    update();
  });

  // 直接在卷帘舞台上横向拖动
  let dragging = false;
  const setFromX = (clientX) => {
    const r = wrap.getBoundingClientRect();
    split = Math.max(6, Math.min(94, ((clientX - r.left) / r.width) * 100));
    update();
  };
  wrap.addEventListener("pointerdown", (e) => {
    dragging = true;
    setFromX(e.clientX);
    try { wrap.setPointerCapture(e.pointerId); } catch {}
  });
  wrap.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setFromX(e.clientX);
  });
  wrap.addEventListener("pointerup", () => { dragging = false; });
  wrap.addEventListener("pointercancel", () => { dragging = false; });

  sceneBtns.forEach((b) => b.addEventListener("click", () => setScene(b.dataset.s1Scene)));
  if (ghostBtn) {
    ghostBtn.addEventListener("click", () => {
      showGhost = !showGhost;
      update();
    });
  }

  setScene("ring");
}

// ---------- 02 节：切刃落点标尺实验室 ----------
export function mountSection02() {
  const modeBtns = [...document.querySelectorAll("[data-s2-mode]")];
  const cutList = document.getElementById("s2-cut-list");
  const bladeLine = document.getElementById("s2-blade-line");
  const shadeRect = document.getElementById("s2-shade-rect");
  const verdictTag = document.getElementById("s2-verdict-tag");
  const verdictTitle = document.getElementById("s2-verdict-title");
  const verdictDesc = document.getElementById("s2-verdict-desc");
  const svgFigure = document.getElementById("s2-svg-figure");
  const svgVessel = document.getElementById("s2-svg-vessel");
  const zoneMarkers = document.getElementById("s2-zone-markers");
  if (!cutList || !bladeLine) return;

  let mode = "figure";
  let activeId = "neck"; // 默认先停在一个典型错切（脖颈关节）让读者立刻看懂避坑点

  function render() {
    const data = BLADE_LAB[mode];
    const current = data.cuts.find((c) => c.id === activeId) || data.cuts[0];
    activeId = current.id;

    modeBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.s2Mode === mode));
    if (svgFigure) svgFigure.style.display = mode === "figure" ? "" : "none";
    if (svgVessel) svgVessel.style.display = mode === "vessel" ? "" : "none";

    // 重建刻度按钮
    cutList.innerHTML = "";
    data.cuts.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `s2-cut-btn ${c.id === current.id ? "is-active" : ""} ${c.ok ? "is-safe" : "is-danger"}`;
      btn.dataset.cutId = c.id;
      btn.innerHTML = `<span class="s2-cut-dot" aria-hidden="true"></span><span class="s2-cut-name">${c.label}</span><span class="s2-cut-tag">${c.tag}</span>`;
      btn.addEventListener("click", () => {
        activeId = c.id;
        render();
      });
      cutList.appendChild(btn);
    });

    // 在 SVG (viewBox 0 0 260 320) 上画出切刀线与被截阴影
    const yPx = Math.round(current.y * 320);
    bladeLine.setAttribute("y1", String(yPx));
    bladeLine.setAttribute("y2", String(yPx));
    bladeLine.setAttribute("stroke", current.ok ? "#146142" : "#B52904");

    // 头顶/瓶口特写切去上方，其余下切遮去下方
    if (current.y < 0.22) {
      shadeRect.setAttribute("y", "0");
      shadeRect.setAttribute("height", String(yPx));
    } else {
      shadeRect.setAttribute("y", String(yPx));
      shadeRect.setAttribute("height", String(320 - yPx));
    }

    // 标出所有刻度线的轻虚线参考
    if (zoneMarkers) {
      zoneMarkers.innerHTML = data.cuts
        .map((c) => {
          const cy = Math.round(c.y * 320);
          const col = c.ok ? "rgba(20,97,66,0.35)" : "rgba(181,41,4,0.42)";
          return `<line x1="16" y1="${cy}" x2="244" y2="${cy}" stroke="${col}" stroke-width="${c.id === current.id ? 0 : 1}" stroke-dasharray="3 4"/>`;
        })
        .join("");
    }

    verdictTag.textContent = current.tag;
    verdictTag.className = `s2-verdict-tag ${current.ok ? "is-safe" : "is-danger"}`;
    verdictTitle.textContent = current.title;
    verdictDesc.textContent = current.desc;
  }

  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.s2Mode;
      activeId = BLADE_LAB[mode].cuts[0].id;
      render();
    });
  });

  render();
}

// ---------- 03 节：历史里程碑 × 伯奇画外六空间罗盘 ----------
export function mountSection03() {
  const milestoneBtns = [...document.querySelectorAll("[data-s3-era]")];
  const zoneBtns = [...document.querySelectorAll("[data-s3-zone]")];
  const eraYear = document.getElementById("s3-era-year");
  const eraTitle = document.getElementById("s3-era-title");
  const eraMuseum = document.getElementById("s3-era-museum");
  const eraBody = document.getElementById("s3-era-body");
  const zoneInfo = document.getElementById("s3-zone-info");
  const artGroups = [...document.querySelectorAll("[data-s3-art]")];
  if (!milestoneBtns.length) return;

  let activeEra = "hiroshige";
  let focusedZone = "left";

  function render() {
    const item = HISTORY_ITEMS.find((h) => h.id === activeEra) || HISTORY_ITEMS[0];
    milestoneBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.s3Era === item.id));
    artGroups.forEach((g) => { g.style.display = g.dataset.s3Art === item.id ? "" : "none"; });

    if (eraYear) eraYear.textContent = item.year;
    if (eraTitle) eraTitle.textContent = `${item.who} · ${item.work}`;
    if (eraMuseum) eraMuseum.textContent = item.museum;
    if (eraBody) eraBody.textContent = item.summary;

    zoneBtns.forEach((z) => {
      const k = z.dataset.s3Zone;
      z.classList.toggle("is-lit", item.activeZones.includes(k));
      z.classList.toggle("is-selected", k === focusedZone);
    });

    const zData = BURCH_ZONES[focusedZone];
    if (zoneInfo && zData) {
      const activeHere = item.activeZones.includes(focusedZone);
      zoneInfo.innerHTML = `<strong>${zData.label}</strong>：${zData.role}${activeHere ? "（当前范例正重点激活这一画外方位）" : "（当前范例未主攻此方位，点选「1969 伯奇」可看六向全开）"}`;
    }
  }

  milestoneBtns.forEach((b) => {
    b.addEventListener("click", () => {
      activeEra = b.dataset.s3Era;
      const item = HISTORY_ITEMS.find((h) => h.id === activeEra);
      if (item && item.activeZones.length) focusedZone = item.activeZones[0];
      render();
    });
  });

  zoneBtns.forEach((z) => {
    z.addEventListener("click", () => {
      focusedZone = z.dataset.s3Zone;
      render();
    });
  });

  render();
}

// ---------- 04 节：同景五式转换台 ----------
export function mountSection04() {
  const btns = [...document.querySelectorAll("[data-s4-mode]")];
  const arts = [...document.querySelectorAll("[data-s4-art]")];
  const titleEl = document.getElementById("s4-detail-title");
  const ruleEl = document.getElementById("s4-detail-rule");
  const descEl = document.getElementById("s4-detail-desc");
  const linkEl = document.getElementById("s4-detail-link");
  if (!btns.length) return;

  function select(id) {
    const m = SIBLING_MODES.find((x) => x.id === id) || SIBLING_MODES[3];
    btns.forEach((b) => b.classList.toggle("is-active", b.dataset.s4Mode === m.id));
    arts.forEach((a) => { a.style.display = a.dataset.s4Art === m.id ? "" : "none"; });
    if (titleEl) titleEl.textContent = `${m.id} ${m.name}`;
    if (ruleEl) ruleEl.textContent = m.rule;
    if (descEl) descEl.textContent = m.desc;
    if (linkEl) {
      if (m.isCurrent) {
        linkEl.textContent = "你正在这一页";
        linkEl.removeAttribute("href");
        linkEl.classList.add("is-current");
      } else {
        linkEl.textContent = `去 ${m.id} ${m.name} 互动页 →`;
        linkEl.setAttribute("href", m.url);
        linkEl.classList.remove("is-current");
      }
    }
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.s4Mode)));
  select("324");
}

// ---------- 05 节：六大实战场景裁决板 ----------
export function mountSection05() {
  const grid = document.getElementById("s5-grid");
  const scoreEl = document.getElementById("s5-score");
  if (!grid) return;

  const answers = new Map();
  grid.innerHTML = "";

  const updateScore = () => {
    if (!scoreEl) return;
    let right = 0;
    for (const [id, choice] of answers) {
      const item = SCENARIOS.find((s) => s.id === id);
      if (item && item.fit === choice) right++;
    }
    scoreEl.textContent = `已裁决 ${answers.size} / ${SCENARIOS.length} 案 · 判准 ${right} 案`;
  };

  SCENARIOS.forEach((s) => {
    const card = document.createElement("article");
    card.className = "s5-card";
    card.innerHTML = `
      <div class="s5-card-head">
        <h3>${s.title}</h3>
        <span class="s5-status" data-status>待判断</span>
      </div>
      <p class="s5-brief">${s.brief}</p>
      <div class="s5-actions">
        <button type="button" class="s5-btn" data-pick="yes">适合截景</button>
        <button type="button" class="s5-btn" data-pick="no">必须全貌</button>
      </div>
      <p class="s5-feedback" hidden></p>
    `;

    const status = card.querySelector("[data-status]");
    const fb = card.querySelector(".s5-feedback");
    const yesBtn = card.querySelector('[data-pick="yes"]');
    const noBtn = card.querySelector('[data-pick="no"]');

    const choose = (val) => {
      answers.set(s.id, val);
      const ok = val === s.fit;
      yesBtn.classList.toggle("is-picked", val === true);
      noBtn.classList.toggle("is-picked", val === false);
      card.classList.toggle("is-correct", ok);
      card.classList.toggle("is-wrong", !ok);
      status.textContent = ok ? (s.fit ? "判准 · 宜截景" : "判准 · 须全貌") : (s.fit ? "其实宜截景" : "其实须全貌");
      fb.hidden = false;
      fb.textContent = s.reason;
      updateScore();
    };

    yesBtn.addEventListener("click", () => choose(true));
    noBtn.addEventListener("click", () => choose(false));
    grid.appendChild(card);
  });

  updateScore();
}

// ---------- 06 节：小练习（四张仅差裁切位置与深度的陶艺展海报） ----------
export function mountSection06() {
  const grid = document.getElementById("quiz-grid");
  const feedback = document.getElementById("quiz-feedback");
  const resetBtn = document.getElementById("quiz-reset");
  if (!grid || !feedback) return;

  let picked = null;

  function buildPosterSvg(opt) {
    // viewBox 0 0 180 240（3:4 竖版陶艺展海报），四张唯一变量只有 cx, cy, scale
    const w = 180, h = 240;
    const cx = opt.cx * w;
    const cy = opt.cy * h;
    const outerR = 0.45 * opt.scale * h * 0.68;
    const coreX = cx + 0.045 * opt.scale * h * 0.68;
    const coreY = cy + 0.02 * opt.scale * h * 0.68;
    const coreR = 0.16 * opt.scale * h * 0.68;
    const clipId = `quiz-clip-${opt.id}`;

    return `
      <svg class="quiz-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${opt.label} 大漆器物展海报构图示意">
        <defs><clipPath id="${clipId}"><rect x="0" y="0" width="${w}" height="${h}"/></clipPath></defs>
        <rect x="0" y="0" width="${w}" height="${h}" fill="#F4410E"/>
        <g clip-path="url(#${clipId})">
          <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${outerR.toFixed(1)}" fill="#F5E8D6"/>
          <circle cx="${coreX.toFixed(1)}" cy="${coreY.toFixed(1)}" r="${coreR.toFixed(1)}" fill="#161616"/>
        </g>
        <rect x="10" y="10" width="84" height="36" fill="#161616"/>
        <text x="16" y="26" fill="#F5E8D6" font-size="12.5" font-weight="900" font-family="Noto Sans SC, sans-serif">大漆器物展</text>
        <text x="16" y="39" fill="#FF6B3D" font-size="7" font-weight="600" font-family="JetBrains Mono, monospace" letter-spacing="0.6">LACQUER 2026</text>
        <rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" fill="none" stroke="rgba(22,22,22,0.5)" stroke-width="1.5"/>
      </svg>
    `;
  }

  function render() {
    grid.innerHTML = "";
    QUIZ_OPTIONS.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-card";
      btn.dataset.quizOpt = opt.id;
      if (picked) {
        if (opt.correct) btn.classList.add("is-correct");
        else if (picked === opt.id) btn.classList.add("is-wrong");
      }
      // 选项标签保持严格中性（绝不透露好坏）
      btn.innerHTML = `
        <div class="quiz-poster-wrap">${buildPosterSvg(opt)}</div>
        <div class="quiz-card-foot">
          <span class="quiz-letter">${opt.label}</span>
          <span class="quiz-neutral-meta">${picked ? opt.meta : "点击选择"}</span>
        </div>
      `;
      btn.addEventListener("click", () => {
        picked = opt.id;
        render();
      });
      grid.appendChild(btn);
    });

    if (!picked) {
      feedback.hidden = true;
      if (resetBtn) resetBtn.hidden = true;
      return;
    }

    const chosen = QUIZ_OPTIONS.find((o) => o.id === picked);
    const right = QUIZ_OPTIONS.find((o) => o.correct);
    feedback.hidden = false;
    if (resetBtn) resetBtn.hidden = false;
    feedback.className = `quiz-feedback ${chosen.correct ? "is-correct" : "is-wrong"}`;
    feedback.innerHTML = `
      <p class="quiz-fb-head">${chosen.correct ? "选对了 · " : `选了 ${chosen.label} · `}${chosen.verdict}</p>
      <p class="quiz-fb-body">${chosen.detail}</p>
      ${!chosen.correct ? `<p class="quiz-fb-right"><strong>为什么选 ${right.label}：</strong>${right.detail}</p>` : ""}
    `;
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      picked = null;
      render();
    });
  }

  render();
}

// ---------- 07 节：原海报缩放/拖动灯箱（Esc 关，draggable="false"） ----------
export function mountPosterLightbox() {
  const thumb = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const dlg = document.getElementById("poster-lightbox");
  const stage = document.getElementById("lb-stage");
  const lbImg = document.getElementById("lb-img");
  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const resetBtn = document.getElementById("lb-reset");
  const scaleOut = document.getElementById("lb-scale");
  if (!thumb || !dlg || !lbImg) return;

  let zoom = 1;
  let tx = 0;
  let ty = 0;

  const apply = () => {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    if (scaleOut) scaleOut.textContent = `${Math.round(zoom * 100)}%`;
  };

  const open = () => {
    lbImg.src = thumb.src; // 只内联一次，绝不重复打包
    zoom = 1;
    tx = 0;
    ty = 0;
    apply();
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  };

  const close = () => {
    if (typeof dlg.close === "function" && dlg.open) dlg.close();
    else dlg.removeAttribute("open");
  };

  thumb.addEventListener("click", open);
  if (openBtn) openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);

  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dlg.open) {
      e.preventDefault();
      close();
    }
  });

  if (zoomInBtn) zoomInBtn.addEventListener("click", () => { zoom = Math.min(3.5, +(zoom + 0.35).toFixed(2)); apply(); });
  if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => { zoom = Math.max(0.75, +(zoom - 0.35).toFixed(2)); if (zoom <= 1) { tx = 0; ty = 0; } apply(); });
  if (resetBtn) resetBtn.addEventListener("click", () => { zoom = 1; tx = 0; ty = 0; apply(); });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    zoom = Math.max(0.75, Math.min(3.5, +(zoom + delta).toFixed(2)));
    if (zoom <= 1) { tx = 0; ty = 0; }
    apply();
  }, { passive: false });

  let pan = null;
  stage.addEventListener("pointerdown", (e) => {
    pan = { x: e.clientX - tx, y: e.clientY - ty };
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!pan) return;
    tx = e.clientX - pan.x;
    ty = e.clientY - pan.y;
    apply();
  });
  stage.addEventListener("pointerup", () => { pan = null; });
  stage.addEventListener("pointercancel", () => { pan = null; });
}

// 251 比例框 · 单真源几何与状态核算引擎
// 主画布、三卡联排、原海报三要点实况灯、NOTE 诊单、四格读数与实时 CSS 代码全部只读这份核算结果。

import { SCENES } from "./artwork.js";

export const RATIO_MIN = 0.55;
export const RATIO_MAX = 2.40;

// 严格按宽高比由窄到宽排列（正文中也会对照海报原排序温和勘误）
export const PRESETS = [
  { id: "9:16", label: "9:16", w: 9, h: 16, ratio: 9 / 16, zh: "竖屏", en: "Vertical", sceneHint: "短视频 · 手机全屏海报" },
  { id: "1:1", label: "1:1", w: 1, h: 1, ratio: 1, zh: "正方形", en: "Square", sceneHint: "社交头像 · 方形封面" },
  { id: "4:3", label: "4:3", w: 4, h: 3, ratio: 4 / 3, zh: "标准屏", en: "Standard", sceneHint: "课堂演示 · 文章配图 · 印刷排版", posterPick: true },
  { id: "3:2", label: "3:2", w: 3, h: 2, ratio: 3 / 2, zh: "摄影常用", en: "Photo", sceneHint: "全画幅摄影 · 画册展签" },
  { id: "16:9", label: "16:9", w: 16, h: 9, ratio: 16 / 9, zh: "宽屏", en: "Widescreen", sceneHint: "视频封面 · 电脑屏幕" },
];

export const FOCUS_PRESETS = {
  center: { id: "center", label: "居中 50% 50%", short: "居中", x: 0.5, y: 0.5, css: "50% 50%" },
  top: { id: "top", label: "偏上 50% 18%", short: "偏上", x: 0.5, y: 0.18, css: "50% 18%" },
  sun: { id: "sun", label: "右上落日 74% 25%", short: "右上", x: 0.74, y: 0.25, css: "74% 25%" },
  bottom: { id: "bottom", label: "偏下 50% 84%", short: "偏下", x: 0.5, y: 0.84, css: "50% 84%" },
  corner: { id: "corner", label: "偏左下 8% 92%", short: "偏角", x: 0.08, y: 0.92, css: "8% 92%" },
};

// 下方同源三卡联排对照槽：三张固有比例各异的素材（竖 3:4、原海报 4:3、宽 16:9）
export const TRIO_CARDS = [
  { id: "c1", scene: "silhouette", title: "人物侧影", naturalRatio: 3 / 4, natLabel: "3:4" },
  { id: "c2", scene: "sunset", title: "霞山主图", naturalRatio: 4 / 3, natLabel: "4:3" },
  { id: "c3", scene: "arch", title: "拱窗器物", naturalRatio: 16 / 9, natLabel: "16:9" },
];

// 开场默认进入复合错态（非答案！）：未启用统一比例框 + 2.35:1 极扁裂条 + fill 拉伸压扁 + 偏角焦心
export function createInitialState() {
  return {
    ratio: 2.35,
    enabled: false,
    fit: "fill", // "fill" | "cover" | "contain"
    focusKey: "corner",
    scene: "sunset",
    highlightPillar: null, // null | "crop" | "media" | "order"
    clsRunning: false,
    clsProgress: 1, // 0..1，1 表示已加载完成
    clsTriggeredOnce: false,
  };
}

export function clampRatio(r) {
  return Math.max(RATIO_MIN, Math.min(RATIO_MAX, r));
}

// 靠近常见整数比例时温和识别标签与可选磁吸
export function snapRatio(raw, threshold = 0.032) {
  const r = clampRatio(raw);
  for (const p of PRESETS) {
    if (Math.abs(r - p.ratio) <= threshold) return p.ratio;
  }
  return Math.round(r * 100) / 100;
}

export function formatRatio(r) {
  for (const p of PRESETS) {
    if (Math.abs(r - p.ratio) < 0.025) return p.label;
  }
  if (r < 0.98) {
    const inv = (1 / r).toFixed(2).replace(/\.00$/, "");
    return `1:${inv}`;
  }
  return `${r.toFixed(2).replace(/\.00$/, "")}:1`;
}

export function formatCssRatio(r) {
  for (const p of PRESETS) {
    if (Math.abs(r - p.ratio) < 0.025) return `${p.w} / ${p.h}`;
  }
  return `${r.toFixed(2)} / 1`;
}

// 严格按浏览器 CSS object-fit + object-position 算法计算素材在框内的实绘矩形
export function mapMediaRect(frameW, frameH, natRatio, fit, fx, fy) {
  const frameRatio = frameW / Math.max(1, frameH);
  if (fit === "fill") {
    return { x: 0, y: 0, w: frameW, h: frameH };
  }
  if (fit === "cover") {
    if (frameRatio >= natRatio) {
      const w = frameW;
      const h = frameW / natRatio;
      return { x: 0, y: (frameH - h) * fy, w, h };
    }
    const h = frameH;
    const w = frameH * natRatio;
    return { x: (frameW - w) * fx, y: 0, w, h };
  }
  // contain
  if (frameRatio >= natRatio) {
    const h = frameH;
    const w = frameH * natRatio;
    return { x: (frameW - w) * fx, y: 0, w, h };
  }
  const w = frameW;
  const h = frameW / natRatio;
  return { x: 0, y: (frameH - h) * fy, w, h };
}

function rectIntersectionArea(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  if (x1 <= x0 || y1 <= y0) return 0;
  return (x1 - x0) * (y1 - y0);
}

// 依据当前画幅给出气质三词与适用场景
function describeRatioCharacter(r) {
  if (r < 0.72) return { words: "修长 · 纵深 · 竖屏", kind: "竖屏专幅解", use: "短视频封面 · 移动全屏海报" };
  if (r < 0.88) return { words: "挺拔 · 优雅 · 人像", kind: "竖幅肖像解", use: "竖版人物特写 · 信息流长图" };
  if (r < 1.15) return { words: "方正 · 稳重 · 均权", kind: "1:1 方阵解", use: "社交头像 · 方形封面" };
  if (r < 1.42) return { words: "平衡 · 经典 · 通用", kind: "4:3 经典平衡解", use: "课堂演示 · 文章配图 · 印刷排版" };
  if (r < 1.63) return { words: "自然 · 舒展 · 纪实", kind: "3:2 摄影自然解", use: "35mm 摄影画册 · 展签图录" };
  if (r < 1.95) return { words: "开阔 · 叙事 · 宽屏", kind: "16:9 宽屏影院解", use: "视频封面 · 电脑屏幕" };
  return { words: "极宽 · 横带 · 压迫", kind: "超宽条幅", use: "仅限全景横幅，普通素材极易裁失" };
}

// 核心单真源核算：传入状态，产出全部读数、几何比例、三卡高度差、CLS 位移、三要点状态、主诊单与活体 CSS
export function evaluate(state) {
  const scene = SCENES[state.scene] || SCENES.sunset;
  const focus = FOCUS_PRESETS[state.focusKey] || FOCUS_PRESETS.center;
  const ratio = clampRatio(state.ratio);
  const natRatio = scene.naturalRatio;

  // 在规范化的虚拟坐标（框高 300px 为基准，面积折算）里算主框映射
  const refArea = 320 * 240;
  const frameW = Math.sqrt(refArea * ratio);
  const frameH = Math.sqrt(refArea / ratio);
  const media = mapMediaRect(frameW, frameH, natRatio, state.fit, focus.x, focus.y);

  const frameArea = frameW * frameH;
  const mediaArea = media.w * media.h;

  // 1. 纵横畸变率（仅 fill 且框比 != 原图比时出现）
  const distortion = state.fit === "fill" ? Math.max(ratio / natRatio, natRatio / ratio) : 1;

  // 2. 画面裁失率（cover 溢出被裁去的面积占比）
  const cropLoss = state.fit === "cover" ? Math.max(0, 1 - frameArea / mediaArea) : 0;

  // 3. 空边占比（contain 未填满画框的留白/黑边占比）
  const emptyRatio = state.fit === "contain" ? Math.max(0, 1 - mediaArea / frameArea) : 0;

  // 4. 核心主体可见率（把 subjectBox 映射到实绘媒体坐标，再与主框求交）
  const sb = scene.subjectBox;
  const subjRect = {
    x: media.x + sb.x * media.w,
    y: media.y + sb.y * media.h,
    w: sb.w * media.w,
    h: sb.h * media.h,
  };
  const frameRect = { x: 0, y: 0, w: frameW, h: frameH };
  const inter = rectIntersectionArea(subjRect, frameRect);
  const subjArea = Math.max(1e-6, subjRect.w * subjRect.h);
  const subjectVisible = Math.max(0, Math.min(1, inter / subjArea));

  // 判断切掉的是哪一边（用于画布高亮切口提示）
  const cutSides = {
    left: subjRect.x < -1,
    right: subjRect.x + subjRect.w > frameW + 1,
    top: subjRect.y < -1,
    bottom: subjRect.y + subjRect.h > frameH + 1,
  };

  // 5. 同源三卡联排（模拟 3 列等宽 cardW = 160px 卡片墙）
  const cardW = 160;
  const trioHeights = TRIO_CARDS.map((c) => {
    const r = state.enabled ? ratio : c.naturalRatio;
    return Math.round(cardW / r);
  });
  const maxCardH = Math.max(...trioHeights);
  const minCardH = Math.min(...trioHeights);
  const deltaH = maxCardH - minCardH;

  // 6. 慢网未占位时的 CLS 垂直位移（以 240px 宽卡片为例）
  const clsShiftPx = state.enabled ? 0 : Math.round(240 / natRatio);

  // 各项硬判阈值
  const hasDistortion = distortion > 1.12;
  const hasNoFrame = !state.enabled;
  const hasSubjectCut = state.fit === "cover" && subjectVisible < 0.86;
  const hasHeavyCrop = state.fit === "cover" && cropLoss > 0.46;
  const hasHeavyEmpty = state.fit === "contain" && emptyRatio > 0.24;
  const hasExtremeBar = ratio > 2.12 || (ratio < 0.68 && natRatio > 1.05);

  const issues = [];
  if (hasDistortion) issues.push("distortion");
  if (hasNoFrame) issues.push("noframe");
  if (hasSubjectCut) issues.push("subjectcut");
  if (hasHeavyCrop) issues.push("heavycrop");
  if (hasHeavyEmpty) issues.push("heavyempty");
  if (!hasHeavyCrop && !hasHeavyEmpty && !hasDistortion && hasExtremeBar) issues.push("extreme");

  const ok = issues.length === 0;
  const char = describeRatioCharacter(ratio);
  const ratioLabel = formatRatio(ratio);

  // 原海报三要点实时灯
  const pillars = {
    crop: {
      title: "统一裁切",
      ok: !hasDistortion && !hasSubjectCut && !hasHeavyCrop && !hasHeavyEmpty,
      badge: hasDistortion
        ? `畸变 ${distortion.toFixed(2)}×`
        : hasSubjectCut
          ? `主体残 ${Math.round(subjectVisible * 100)}%`
          : hasHeavyCrop
            ? `裁失 ${Math.round(cropLoss * 100)}%`
            : hasHeavyEmpty
              ? `空边 ${Math.round(emptyRatio * 100)}%`
              : state.fit === "contain"
                ? `完整 · 空边 ${Math.round(emptyRatio * 100)}%`
                : `无畸变 · 裁 ${Math.round(cropLoss * 100)}%`,
    },
    media: {
      title: "媒体适配",
      ok: !hasNoFrame && !hasExtremeBar && !hasDistortion,
      badge: hasNoFrame
        ? `跳屏 +${clsShiftPx}px`
        : hasDistortion
          ? "fill 硬拉"
          : hasExtremeBar
            ? `画幅过${ratio > 2 ? "扁" : "窄"}`
            : `稳占 ${ratioLabel}`,
    },
    order: {
      title: "视觉秩序",
      ok: deltaH === 0 && !hasDistortion && !hasHeavyEmpty,
      badge: deltaH > 0 ? `参差 ${deltaH}px` : hasHeavyEmpty ? "空边破齐" : "三卡齐平 ΔH 0",
    },
  };

  // 单真源白话主诊单 + 单步修复动作
  let stamp = "";
  let headline = "";
  let why = "";
  let fixHint = "";
  let fixLabel = "";
  let fixAction = null;

  if (hasDistortion) {
    const dir = ratio > natRatio ? "压扁拉宽" : "挤瘦拉长";
    stamp = `形变警报 · ${distortion.toFixed(2)}×`;
    headline = `用 fill 硬塞进 ${ratioLabel}，${scene.subjectName}被${dir} ${distortion.toFixed(2)} 倍`;
    why = `原图固有比例是 ${scene.naturalLabel}，强行用 object-fit: fill 贴合 ${ratioLabel} 后，画面里原本端正的圆形立刻变形。比例框要裁切或留边，绝不扭曲像素比例。`;
    fixHint = "先把填充方式改用 object-fit: cover，让画面按原比例放大填满画框。";
    fixLabel = "改用 cover 去形变";
    fixAction = { type: "fit", value: "cover" };
  } else if (hasNoFrame) {
    stamp = `骨架缺失 · 参差 ${deltaH}px`;
    headline = `未锁定统一比例框，三卡底边高低参差 ${deltaH}px`;
    why = `画布底栏三张混源素材（3:4、4:3、16:9）按原图高度自由生长，底沿像锯齿一样错落；慢网下载前框高为 0，出图瞬间还会把正文向下踹开 ${clsShiftPx}px（触发高 CLS 跳屏）。`;
    fixHint = "开启「统一比例框」，用 CSS aspect-ratio 先把容器骨架立住。";
    fixLabel = "开启统一比例框";
    fixAction = { type: "enable", value: true };
  } else if (hasSubjectCut) {
    const missing = Math.round((1 - subjectVisible) * 100);
    stamp = `焦心失守 · 切掉 ${missing}%`;
    headline = `${scene.subjectName}被框边切掉 ${missing}%，只剩 ${Math.round(subjectVisible * 100)}% 留在框里`;
    why = `当前取景重心落在「${focus.short}」（${focus.css}），加上框比 ${ratioLabel} 与原图 ${scene.naturalLabel} 存在落差，关键主体被推出了裁切安全区。`;
    const recommendedFocus = state.scene === "silhouette" ? "top" : state.scene === "sunset" && ratio < 1 ? "sun" : "center";
    fixHint = ratio > 2.05 || ratio < 0.72
      ? "把画布旁的红点滑尺拉回 1:1–16:9 温和区间，并回正取景重心。"
      : `把取景焦心调回「${FOCUS_PRESETS[recommendedFocus].short}」，把主体稳稳请回画框里。`;
    fixLabel = ratio > 2.05 || ratio < 0.72 ? "校准比例与焦心" : "校准取景焦心";
    fixAction = ratio > 2.05 || ratio < 0.72
      ? { type: "rescue", ratio: natRatio < 1 ? 1 : 4 / 3, focusKey: recommendedFocus }
      : { type: "focus", value: recommendedFocus };
  } else if (hasHeavyCrop) {
    const lost = Math.round(cropLoss * 100);
    const kind = ratio > natRatio ? "过扁" : "过窄";
    stamp = `裁切过度 · 失画 ${lost}%`;
    headline = `画幅 ${ratioLabel} 相对原图 ${kind}，足足裁掉 ${lost}% 的画面`;
    why = `把 ${scene.naturalLabel} 原图塞进 ${ratioLabel} 的极${kind === "过扁" ? "扁" : "窄"}容器并铺满，将近一半景物被迫藏在框外，叙事信息严重受损。`;
    const nextR = natRatio < 1 ? 1 : 4 / 3;
    fixHint = `左右拖动主画布或红点滑尺，把画幅收回到 ${formatRatio(nextR)} 等更贴近素材的档位。`;
    fixLabel = `调至 ${formatRatio(nextR)} 平衡画幅`;
    fixAction = { type: "ratio", value: nextR };
  } else if (hasHeavyEmpty) {
    const emp = Math.round(emptyRatio * 100);
    stamp = `空边过宽 · 闲置 ${emp}%`;
    headline = `contain 留下 ${emp}% 空白边带，画廊秩序感被切碎`;
    why = `object-fit: contain 虽然保住了全图，但 ${ratioLabel} 框与 ${scene.naturalLabel} 原图形状相差太远，大片空边让卡片看起来像没填满的补丁。`;
    fixHint = "改用 object-fit: cover 满框装裱，或把框比拉近原图比例。";
    fixLabel = "改用 cover 满框装裱";
    fixAction = { type: "fit", value: "cover" };
  } else if (hasExtremeBar) {
    stamp = `比例越界 · ${ratioLabel}`;
    headline = `${ratioLabel} 画幅过于极端，常规图文卡片难以承载`;
    why = "超扁裂条或极窄竖条只适合特定横幅/竖屏流，混入普通列表会让主体压抑、周边图文难以配平。";
    fixHint = "把画幅拉回 1:1、4:3、3:2 或 16:9 经典区间。";
    fixLabel = "回到 4:3 经典推荐";
    fixAction = { type: "ratio", value: 4 / 3 };
  } else {
    stamp = `秩序成立 · ${char.kind}`;
    headline = `${ratioLabel} 比例框稳固成立：三卡齐平、零形变、零跳屏`;
    why = `${char.use}。先用 aspect-ratio: ${formatCssRatio(ratio)} 钉牢容器骨架，再用 ${state.fit} 配合焦心 ${focus.css} 装填，${scene.subjectName}完整保留（${Math.round(subjectVisible * 100)}%），三张混源卡片底边差高归零。`;
    fixHint = "你也可以继续拖动滑尺试探其他合法比例（1:1 / 4:3 / 3:2 / 16:9），或切换人像/拱窗素材考验跨幅适配。";
    fixLabel = "";
    fixAction = null;
  }

  // 实时生成活体 CSS（与当前状态 100% 同步）
  const cssRatioStr = formatCssRatio(ratio);
  const cssLines = state.enabled
    ? [
        `.ratio-frame {`,
        `  aspect-ratio: ${cssRatioStr};`,
        `  overflow: hidden;`,
        `}`,
        `.ratio-frame > img {`,
        `  width: 100%; height: 100%;`,
        `  object-fit: ${state.fit};`,
        `  object-position: ${focus.css};`,
        `}`,
      ]
    : [
        `/* 未启用比例框：高度随原图波动 */`,
        `.media-box {`,
        `  height: auto; /* 易参差与 CLS 跳屏 */`,
        `}`,
        `.media-box > img {`,
        `  width: 100%;`,
        `  object-fit: ${state.fit}; /* ${hasDistortion ? "强行拉伸畸变" : "依赖原图高"} */`,
        `}`,
      ];

  return {
    scene,
    focus,
    ratio,
    ratioLabel,
    cssRatioStr,
    natRatio,
    frameW,
    frameH,
    media,
    distortion,
    cropLoss,
    emptyRatio,
    subjectVisible,
    cutSides,
    trioHeights,
    deltaH,
    clsShiftPx,
    ok,
    issues,
    char,
    pillars,
    stamp,
    headline,
    why,
    fixHint,
    fixLabel,
    fixAction,
    cssText: cssLines.join("\n"),
    metrics: [
      { label: "形变畸变", value: `${distortion.toFixed(2)}×`, bad: hasDistortion },
      {
        label: state.fit === "contain" ? "空边占比" : "画面裁失",
        value: `${Math.round((state.fit === "contain" ? emptyRatio : cropLoss) * 100)}%`,
        bad: hasHeavyCrop || hasHeavyEmpty,
      },
      { label: "主体完整", value: `${Math.round(subjectVisible * 100)}%`, bad: hasSubjectCut },
      { label: "三卡差高", value: `${deltaH}px`, bad: deltaH > 0 },
    ],
  };
}

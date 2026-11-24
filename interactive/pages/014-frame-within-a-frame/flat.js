// 2D SVG 绘制引擎：既用于 WebGL 关闭时的开场降级舞台，也用于 01–07 节的所有互动插图。
// 所有人物一律用背影/侧影剪影，绝不画五官细节。
import { BONSAI_SIZE, bonsaiURL } from "./bonsai.js";
import { PALETTE, projectLayers } from "./model.js";

const NS = "http://www.w3.org/2000/svg";

export function svgEl(w, h) {
  const el = document.createElementNS(NS, "svg");
  el.setAttribute("viewBox", `0 0 ${w} ${h}`);
  el.setAttribute("role", "img");
  return el;
}

// 绘一株简笔梅花盆景（在海报尚未加载或极简示意时作为保底，海报加载后可叠加真盆景）
function fallbackBonsai(cx, cy, s = 1) {
  return `<g transform="translate(${cx} ${cy}) scale(${s})">
    <rect x="-24" y="18" width="48" height="4" fill="#d9c6bc"/>
    <path d="M-13 18 L-9 9 H9 L13 18 Z" fill="#3a2320"/>
    <path d="M0 9 C-2 -1 12 -6 5 -16 C0 -23 -10 -20 -17 -26" fill="none" stroke="#452722" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M4 -12 C14 -16 20 -13 24 -18" fill="none" stroke="#452722" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="-16" cy="-26" r="7" fill="#df889b" opacity="0.9"/>
    <circle cx="-5" cy="-24" r="6" fill="#e9a1b0" opacity="0.9"/>
    <circle cx="8" cy="-22" r="8" fill="#d77389" opacity="0.92"/>
    <circle cx="20" cy="-18" r="6.5" fill="#e494a4" opacity="0.9"/>
    <circle cx="-22" cy="-19" r="5" fill="#d46e84" opacity="0.88"/>
    <circle cx="15" cy="-11" r="4.5" fill="#ecacb8" opacity="0.85"/>
  </g>`;
}

// 简笔中式花格窗棂（放在窗口顶部，呼应 014 原海报）
function latticeSVG(x, y, w, h, color) {
  const lh = h * 0.24;
  return `<g stroke="${color}" stroke-width="1.35" fill="none">
    <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" stroke-width="2.6"/>
    <line x1="${x.toFixed(1)}" y1="${(y + lh).toFixed(1)}" x2="${(x + w).toFixed(1)}" y2="${(y + lh).toFixed(1)}"/>
    <path d="M${(x + w * 0.14).toFixed(1)} ${y.toFixed(1)} V${(y + lh).toFixed(1)} M${(x + w * 0.34).toFixed(1)} ${y.toFixed(1)} V${(y + lh * 0.65).toFixed(1)} H${(x + w * 0.66).toFixed(1)} V${y.toFixed(1)} M${(x + w * 0.86).toFixed(1)} ${y.toFixed(1)} V${(y + lh).toFixed(1)}"/>
    <path d="M${(x + w * 0.06).toFixed(1)} ${(y + lh * 0.5).toFixed(1)} H${(x + w * 0.26).toFixed(1)} V${(y + lh).toFixed(1)} M${(x + w * 0.74).toFixed(1)} ${(y + lh).toFixed(1)} V${(y + lh * 0.5).toFixed(1)} H${(x + w * 0.94).toFixed(1)}"/>
    <path d="M${(x + w * 0.44).toFixed(1)} ${(y + lh * 0.3).toFixed(1)} H${(x + w * 0.56).toFixed(1)} V${(y + lh).toFixed(1)}"/>
  </g>`;
}

// 开场舞台的 2D SVG 降级版（和 3D 共用同一份 state 与视差模型）
export function heroFlatSVG(state) {
  const W = 400;
  const H = 500;
  const p = projectLayers(state);
  const src = bonsaiURL();
  const blurAttr = state.softFocus ? ' filter="url(#fg-blur)"' : "";
  const dark = state.darkRim || p.sc.darkFrame;

  // 背景庭院与盆景位置
  const bgW = W * 0.78 * p.bgScale;
  const bgH = bgW * (BONSAI_SIZE.h / BONSAI_SIZE.w);
  const bgX = p.subjectPos.u * W - bgW / 2;
  const bgY = p.subjectPos.v * H - bgH * 0.48;

  // 中景花窗开口
  const iw = p.iw * W;
  const ih = p.ih * H;
  const ix = p.midCenter.u * W - iw / 2;
  const iy = p.midCenter.v * H - ih / 2;

  // 前景外框开口
  const ow = p.ow * W;
  const oh = p.oh * H;
  const ox = p.outerCenter.u * W - ow / 2;
  const oy = p.outerCenter.v * H - oh / 2;

  // 庭院底层（暖日粉墙 + 盆景照片）
  const courtyard = `
    <rect x="0" y="0" width="${W}" height="${H}" fill="#f5e6df"/>
    <rect x="0" y="0" width="${W}" height="${H * 0.32}" fill="#f9efe9"/>
    ${
      src
        ? `<image href="${src}" x="${bgX.toFixed(1)}" y="${bgY.toFixed(1)}" width="${bgW.toFixed(1)}" height="${bgH.toFixed(1)}" preserveAspectRatio="xMidYMid slice"/>`
        : fallbackBonsai(p.subjectPos.u * W, p.subjectPos.v * H + 10, 2.2 * p.bgScale)
    }`;

  // 中景墙 + 镂空花格窗
  const midWallColor = dark ? "#4a2a28" : "#ab736e";
  const midWall = p.sc.partial
    ? `<g opacity="0.92">
         <rect x="${(ix - 18).toFixed(1)}" y="${(iy - 16).toFixed(1)}" width="${(iw + 36).toFixed(1)}" height="16" fill="#5e3936"/>
         ${latticeSVG(ix, iy, iw, ih, "#422521")}
       </g>`
    : `<g>
         <path fill="${midWallColor}" fill-rule="evenodd" d="M-80 -80 H${W + 80} V${H + 80} H-80 Z M${ix.toFixed(1)} ${iy.toFixed(1)} H${(ix + iw).toFixed(1)} V${(iy + ih).toFixed(1)} H${ix.toFixed(1)} Z"/>
         <rect x="0" y="${(iy + ih + 24).toFixed(1)}" width="${W}" height="140" fill="${dark ? "#2c1716" : "#caa29b"}" opacity="0.45"/>
         ${latticeSVG(ix, iy, iw, ih, "#341c19")}
       </g>`;

  // 前景层：根据 scene 绘制拱门 / 暗门廊 / 竹枝半框
  let fg = "";
  if (state.scene === "garden") {
    const r = ow / 2;
    const archTopY = oy + r;
    const wallCol = dark ? "#3b1f1f" : "#c58f89";
    const bevelCol = dark ? "#533130" : "#e5cbc4";
    const archPath = `M${ox.toFixed(1)} ${(H + 40).toFixed(1)} V${archTopY.toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(ox + ow).toFixed(1)} ${archTopY.toFixed(1)} V${(H + 40).toFixed(1)} Z`;
    fg = `<g${blurAttr}>
      <path fill="${wallCol}" fill-rule="evenodd" d="M-90 -90 H${W + 90} V${H + 90} H-90 Z ${archPath}"/>
      <path fill="none" stroke="${bevelCol}" stroke-width="10" d="M${(ox + 5).toFixed(1)} ${(H + 20).toFixed(1)} V${archTopY.toFixed(1)} A${(r - 5).toFixed(1)} ${(r - 5).toFixed(1)} 0 0 1 ${(ox + ow - 5).toFixed(1)} ${archTopY.toFixed(1)} V${(H + 20).toFixed(1)}"/>
      <g fill="#2b1715" opacity="${dark ? 0.92 : 0.78}">
        <path d="M-10 ${H} Q18 ${H - 118} 54 ${H - 22} L62 ${H} Z"/>
        <path d="M16 ${H - 108} Q26 ${H - 260} 58 ${H - 372}" fill="none" stroke="#311a18" stroke-width="3.2"/>
        <path d="M24 ${H - 238} Q68 ${H - 270} 92 ${H - 252} M36 ${H - 308} Q82 ${H - 332} 106 ${H - 318} M16 ${H - 342} Q58 ${H - 362} 86 ${H - 350}" fill="none" stroke="#311a18" stroke-width="2.2"/>
        <ellipse cx="78" cy="${H - 264}" rx="15" ry="4" transform="rotate(-18 78 ${H - 264})"/>
        <ellipse cx="94" cy="${H - 324}" rx="16" ry="4" transform="rotate(-14 94 ${H - 324})"/>
        <ellipse cx="66" cy="${H - 354}" rx="14" ry="3.8" transform="rotate(-22 66 ${H - 354})"/>
        <ellipse cx="52" cy="${H - 216}" rx="14" ry="3.8" transform="rotate(18 52 ${H - 216})"/>
      </g>
    </g>`;
  } else if (state.scene === "doorway") {
    const wallCol = "#1f1211";
    const doorCol = dark ? "#2a1715" : "#442724";
    const doorW = ow * 0.24;
    fg = `<g${blurAttr}>
      <path fill="${wallCol}" fill-rule="evenodd" d="M-90 -90 H${W + 90} V${H + 90} H-90 Z M${ox.toFixed(1)} ${oy.toFixed(1)} H${(ox + ow).toFixed(1)} V${(H + 20).toFixed(1)} H${ox.toFixed(1)} Z"/>
      <rect x="${ox.toFixed(1)}" y="${oy.toFixed(1)}" width="12" height="${(H - oy + 20).toFixed(1)}" fill="${doorCol}"/>
      <rect x="${(ox + ow - 12).toFixed(1)}" y="${oy.toFixed(1)}" width="12" height="${(H - oy + 20).toFixed(1)}" fill="${doorCol}"/>
      <polygon points="${(ox + ow).toFixed(1)},${oy.toFixed(1)} ${(ox + ow - doorW).toFixed(1)},${(oy + 18).toFixed(1)} ${(ox + ow - doorW).toFixed(1)},${(H + 10).toFixed(1)} ${(ox + ow).toFixed(1)},${(H + 20).toFixed(1)}" fill="${doorCol}" opacity="0.92"/>
      <line x1="${ox.toFixed(1)}" y1="${oy.toFixed(1)}" x2="${(ox + ow).toFixed(1)}" y2="${oy.toFixed(1)}" stroke="#6c453f" stroke-width="4"/>
    </g>`;
  } else {
    // 竹枝半框：左上伸出垂枝，右侧暗廊柱与假山石，下缘敞开
    const sx = p.outerCenter.u * W - W * 0.5;
    const sy = p.outerCenter.v * H - H * 0.55;
    const leafCol = dark ? "#1f1312" : "#3a2522";
    const pillarCol = dark ? "#281715" : "#754744";
    fg = `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})"${blurAttr}>
      <rect x="${W - 46}" y="-60" width="96" height="${H + 120}" fill="${pillarCol}"/>
      <path d="M-40 -30 Q80 28 190 54 Q110 72 15 110 L-40 160 Z" fill="${leafCol}" opacity="0.9"/>
      <path d="M-20 40 C65 70 120 120 156 172" fill="none" stroke="${leafCol}" stroke-width="5" stroke-linecap="round"/>
      <path d="M68 62 C110 38 158 34 218 50" fill="none" stroke="${leafCol}" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="136" cy="96" rx="28" ry="8" transform="rotate(24 136 96)" fill="${leafCol}"/>
      <ellipse cx="176" cy="54" rx="26" ry="7" transform="rotate(-12 176 54)" fill="${leafCol}"/>
      <ellipse cx="96" cy="128" rx="26" ry="7" transform="rotate(36 96 128)" fill="${leafCol}"/>
      <ellipse cx="52" cy="156" rx="24" ry="7" transform="rotate(42 52 156)" fill="${leafCol}"/>
      <path d="M-40 ${H + 30} Q18 ${H - 120} 86 ${H - 36} Q116 ${H + 8} 134 ${H + 30} Z" fill="${dark ? "#211312" : "#4c322f"}"/>
    </g>`;
  }

  return `<defs>
    <filter id="fg-blur"><feGaussianBlur stdDeviation="3.8"/></filter>
  </defs>
  ${courtyard}
  ${midWall}
  ${fg}`;
}

// 01 节：复刻海报左下角「内外关系示意」可交互解剖图
export function anatomySVG(activeLayer) {
  const hi = (i) => (activeLayer < 0 ? 1 : activeLayer === i ? 1 : 0.28);
  const stroke = (i) => (activeLayer === i ? PALETTE.plum : "none");
  return `
  <rect x="0" y="0" width="220" height="240" fill="${PALETTE.cream}"/>
  <g opacity="${hi(0)}" style="transition:opacity 0.25s">
    <path d="M32 222 V92 A78 78 0 0 1 188 92 V222 Z" fill="${PALETTE.arch}" stroke="${stroke(0)}" stroke-width="3"/>
  </g>
  <g opacity="${hi(1)}" style="transition:opacity 0.25s">
    <rect x="56" y="76" width="108" height="146" fill="${PALETTE.clay}" stroke="#fcf7f3" stroke-width="4"/>
    ${activeLayer === 1 ? `<rect x="56" y="76" width="108" height="146" fill="none" stroke="${PALETTE.plum}" stroke-width="3"/>` : ""}
    <rect x="70" y="90" width="80" height="118" fill="${PALETTE.paper}"/>
  </g>
  <g opacity="${hi(2)}" style="transition:opacity 0.25s">
    <circle cx="110" cy="148" r="24" fill="${PALETTE.plum}"/>
    ${activeLayer === 2 ? `<circle cx="110" cy="148" r="30" fill="none" stroke="${PALETTE.plum}" stroke-width="2" stroke-dasharray="4 3"/>` : ""}
  </g>
  <g stroke="${PALETTE.ink}" stroke-width="1" stroke-dasharray="2.5 2.5" opacity="0.45">
    <line x1="158" y1="42" x2="212" y2="42"/>
    <line x1="164" y1="106" x2="212" y2="106"/>
    <line x1="134" y1="148" x2="212" y2="148"/>
  </g>`;
}

// 02 节：六种真实世界的「现成框」（含完整框与半框）
export function frameTypeSVG(kind, partial) {
  const W = 280;
  const H = 200;
  // 统一背景和被框主体（远处的红梅或背影人物剪影，绝不画五官）
  const sky = `<rect width="${W}" height="${H}" fill="#f7ebe3"/>
    <rect y="142" width="${W}" height="58" fill="#e5cfc4"/>`;
  // 远处的安静主体：一个面朝远方的背影旅人或庭院花树
  const subject =
    kind === "crowd" || kind === "tunnel" || kind === "mirror"
      ? `<g transform="translate(142 138)">
           <circle cx="0" cy="-32" r="8.5" fill="${PALETTE.plum}"/>
           <path d="M-13 6 C-12 -14 -7 -21 0 -21 C7 -21 12 -14 13 6 Z" fill="${PALETTE.plumDeep}"/>
         </g>`
      : `<g transform="translate(142 142)">
           <rect x="-12" y="-6" width="24" height="8" fill="#462825"/>
           <path d="M0 -6 C-3 -22 10 -28 2 -40 C-5 -48 -14 -45 -20 -52" fill="none" stroke="#462825" stroke-width="3" stroke-linecap="round"/>
           <circle cx="-18" cy="-52" r="8" fill="#d86f86"/>
           <circle cx="-2" cy="-47" r="9" fill="${PALETTE.plum}"/>
           <circle cx="14" cy="-40" r="7.5" fill="#df889b"/>
         </g>`;

  let frame = "";
  if (kind === "arch") {
    frame = partial
      ? `<path fill="${PALETTE.clay}" d="M0 0 H210 Q140 6 120 60 L0 60 Z M0 0 H54 V200 H0 Z"/>`
      : `<path fill="${PALETTE.clay}" fill-rule="evenodd" d="M0 0 H280 V200 H0 Z M72 200 V92 A68 68 0 0 1 208 92 V200 Z"/>`;
  } else if (kind === "window") {
    frame = partial
      ? `<path fill="#5d3834" d="M0 0 H280 V28 H0 Z M0 0 H46 V200 H0 Z"/><line x1="46" y1="28" x2="280" y2="28" stroke="#c8a89d" stroke-width="2"/>`
      : `<path fill="#5d3834" fill-rule="evenodd" d="M0 0 H280 V200 H0 Z M58 28 H222 V172 H58 Z"/><line x1="140" y1="28" x2="140" y2="54" stroke="#5d3834" stroke-width="4"/><line x1="58" y1="54" x2="222" y2="54" stroke="#5d3834" stroke-width="4"/>`;
  } else if (kind === "branch") {
    frame = partial
      ? `<g fill="#382320">
           <path d="M0 0 H150 Q92 38 48 92 L0 120 Z" opacity="0.9"/>
           <path d="M18 20 Q110 30 180 18" fill="none" stroke="#382320" stroke-width="4"/>
           <ellipse cx="144" cy="24" rx="22" ry="6" transform="rotate(-8 144 24)"/>
           <ellipse cx="88" cy="54" rx="20" ry="6" transform="rotate(24 88 54)"/>
           <ellipse cx="42" cy="96" rx="18" ry="6" transform="rotate(42 42 96)"/>
         </g>`
      : `<g fill="#382320">
           <path d="M0 0 H280 V26 Q210 52 178 24 Q112 56 64 28 L0 88 Z"/>
           <path d="M0 200 V110 Q48 146 84 180 L110 200 Z"/>
           <path d="M280 200 V95 Q232 142 198 178 L175 200 Z"/>
         </g>`;
  } else if (kind === "mirror") {
    // 镜面反射：暗车内或桌面背景，亮镜框里装进远处人物
    frame = partial
      ? `<rect width="280" height="200" fill="#3a2523" opacity="0.88"/>
         <path d="M74 28 H280 V168 H74 Q58 168 58 150 V46 Q58 28 74 28 Z" fill="#f7ebe3"/>
         ${subject}
         <path d="M74 28 H280 M74 168 H280 M58 46 V150" fill="none" stroke="#c7a296" stroke-width="5"/>`
      : `<rect width="280" height="200" fill="#3a2523" opacity="0.88"/>
         <ellipse cx="142" cy="100" rx="64" ry="74" fill="#f7ebe3" stroke="#c7a296" stroke-width="6"/>
         ${subject}
         <line x1="96" y1="54" x2="118" y2="38" stroke="#ffffff" stroke-width="2.5" opacity="0.65"/>`;
    return frame;
  } else if (kind === "tunnel") {
    frame = partial
      ? `<path fill="#221312" d="M0 0 H280 V200 H226 V92 A86 78 0 0 0 54 92 V200 H0 Z" opacity="0.92"/>`
      : `<path fill="#221312" fill-rule="evenodd" d="M0 0 H280 V200 H0 Z M76 178 V94 A64 64 0 0 1 204 94 V178 Z"/>
         <path fill="none" stroke="#49302e" stroke-width="3" d="M56 196 V94 A84 84 0 0 1 224 94 V196"/>`;
  } else {
    // 人群肩缝：左右两侧近景模糊的暗色人群肩背剪影（无五官），中间缝隙露主角
    frame = partial
      ? `<g fill="#36201e" opacity="0.92">
           <circle cx="38" cy="76" r="24"/><path d="M-12 200 C-6 118 18 106 44 106 C76 106 96 128 100 200 Z"/>
         </g>`
      : `<g fill="#36201e" opacity="0.92">
           <circle cx="42" cy="74" r="24"/><path d="M-12 200 C-6 116 18 104 44 104 C76 104 96 128 102 200 Z"/>
           <circle cx="238" cy="78" r="26"/><path d="M180 200 C186 124 206 108 238 108 C266 108 288 124 294 200 Z"/>
         </g>`;
  }

  return `${sky}${subject}${frame}`;
}

// 03 节：框在讲故事——同一个庭院背影人，换不同的外框和里外光比
export function storySVG(mood, invertLight) {
  const W = 320;
  const H = 210;
  const outsideBg = invertLight ? "#362222" : "#f7eae0";
  const outsideFloor = invertLight ? "#281818" : "#e3cbc0";
  const personCol = invertLight ? "#e6b8ad" : "#8d3048";
  const fgCol = invertLight ? "#d7bab2" : "#241312";
  const fgEdge = invertLight ? "#f4e6de" : "#4a2c29";

  // 同一位站在庭院中的剪影人物（背影，无五官）
  const person = `
    <rect width="${W}" height="${H}" fill="${outsideBg}"/>
    <rect y="146" width="${W}" height="64" fill="${outsideFloor}"/>
    <circle cx="216" cy="56" r="18" fill="${invertLight ? "#7a5854" : "#fff7ee"}" opacity="0.7"/>
    <g transform="translate(160 150)">
      <ellipse cx="0" cy="4" rx="18" ry="4" fill="#000" opacity="0.12"/>
      <circle cx="0" cy="-42" r="9.5" fill="${personCol}"/>
      <path d="M-15 2 C-14 -20 -8 -30 0 -30 C8 -30 14 -20 15 2 Z" fill="${personCol}"/>
    </g>`;

  let fg = "";
  if (mood === "home") {
    // 敞开的家门：宽阔温暖，门框方正，里外连通
    fg = `<path fill="${fgCol}" fill-rule="evenodd" d="M0 0 H320 V210 H0 Z M86 22 H234 V210 H86 Z"/>
      <rect x="86" y="22" width="148" height="6" fill="${fgEdge}"/>
      <polygon points="86,188 124,166 196,166 234,188 234,210 86,210" fill="${outsideBg}" opacity="0.22"/>`;
  } else if (mood === "peek") {
    // 半掩门缝：极窄的竖向缝隙，强烈的窥视感与距离感
    fg = `<rect x="0" y="0" width="122" height="210" fill="${fgCol}"/>
      <rect x="198" y="0" width="122" height="210" fill="${fgCol}"/>
      <rect x="122" y="0" width="6" height="210" fill="${fgEdge}"/>
      <rect x="192" y="0" width="6" height="210" fill="${fgEdge}"/>`;
  } else if (mood === "window") {
    // 隔着窗棂与雨滴玻璃：观察与思念的隔离感
    fg = `<path fill="${fgCol}" fill-rule="evenodd" d="M0 0 H320 V210 H0 Z M54 24 H266 V178 H54 Z"/>
      <line x1="160" y1="24" x2="160" y2="178" stroke="${fgCol}" stroke-width="5"/>
      <line x1="54" y1="102" x2="266" y2="102" stroke="${fgCol}" stroke-width="5"/>
      <g stroke="#fff" stroke-width="1.3" opacity="0.45">
        <line x1="78" y1="42" x2="72" y2="66"/><line x1="106" y1="54" x2="100" y2="78"/>
        <line x1="226" y1="38" x2="220" y2="62"/><line x1="242" y1="118" x2="236" y2="142"/>
      </g>`;
  } else {
    // 廊柱与门槛：远望的仪式感
    fg = `<path fill="${fgCol}" fill-rule="evenodd" d="M0 0 H320 V210 H0 Z M72 192 V98 A88 76 0 0 1 248 98 V192 Z"/>
      <rect x="0" y="192" width="320" height="18" fill="${fgEdge}"/>`;
  }

  return `${person}${fg}`;
}

// 04 节：景深虚化 & 外框明暗交互图
export function dofSVG(blurAmt, rimLight) {
  const W = 320;
  const H = 220;
  const src = bonsaiURL();
  // rimLight: 0 = 暗框 (#271514), 100 = 亮花框 (#ecd8d0)
  const t = rimLight / 100;
  const r = Math.round(39 + t * (236 - 39));
  const g = Math.round(21 + t * (212 - 21));
  const b = Math.round(20 + t * (202 - 20));
  const fgCol = `rgb(${r},${g},${b})`;
  const patternOp = (0.12 + t * 0.45).toFixed(2);
  const std = (blurAmt * 0.08).toFixed(2);

  const bg = `<rect width="${W}" height="${H}" fill="#f7ebe3"/>
    ${
      src
        ? `<image href="${src}" x="88" y="34" width="144" height="162" preserveAspectRatio="xMidYMid slice"/>`
        : fallbackBonsai(160, 148, 1.45)
    }`;

  return `<defs>
    <filter id="dof-blur"><feGaussianBlur stdDeviation="${std}"/></filter>
    <pattern id="brick" width="22" height="12" patternUnits="userSpaceOnUse">
      <rect width="22" height="12" fill="none" stroke="#6f413d" stroke-width="1" opacity="${patternOp}"/>
      <line x1="11" y1="0" x2="11" y2="6" stroke="#6f413d" stroke-width="1" opacity="${patternOp}"/>
    </pattern>
  </defs>
  ${bg}
  <g filter="url(#dof-blur)">
    <path fill="${fgCol}" fill-rule="evenodd" d="M-20 -20 H340 V240 H-20 Z M88 220 V106 A72 72 0 0 1 232 106 V220 Z"/>
    <path fill="url(#brick)" fill-rule="evenodd" d="M-20 -20 H340 V240 H-20 Z M88 220 V106 A72 72 0 0 1 232 106 V220 Z"/>
  </g>`;
}

// 05 节：版式里的框（无框 / 双框留边 / 破框叠层 / 过度套框）
export function layoutCardSVG(mode) {
  const W = 320;
  const H = 220;
  const src = bonsaiURL();
  const img = (x, y, w, h) =>
    src
      ? `<image href="${src}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f4e4dc"/>${fallbackBonsai(x + w / 2, y + h * 0.65, w / 90)}`;

  if (mode === "none") {
    return `<rect width="${W}" height="${H}" fill="#f8f0ea"/>
      ${img(0, 0, 320, 220)}
      <rect x="0" y="156" width="320" height="64" fill="#2d1715" opacity="0.48"/>
      <text x="20" y="185" fill="#fff" font-size="16" font-weight="600">春庭花事</text>
      <text x="20" y="205" fill="#f3ded7" font-size="10">满版铺图，文字直接压在图像上</text>`;
  }
  if (mode === "double") {
    return `<rect width="${W}" height="${H}" fill="#e6d3c8"/>
      <rect x="16" y="14" width="288" height="192" fill="#fcf7f3" stroke="#b98a82" stroke-width="1"/>
      <rect x="30" y="28" width="136" height="164" fill="#d9bcb3"/>
      ${img(38, 36, 120, 148)}
      <rect x="184" y="42" width="38" height="4" fill="${PALETTE.plum}"/>
      <text x="184" y="76" fill="${PALETTE.ink}" font-size="17" font-weight="600">春庭花事</text>
      <text x="184" y="98" fill="${PALETTE.muted}" font-size="10">外留边定页幅</text>
      <text x="184" y="114" fill="${PALETTE.muted}" font-size="10">内色块托主图</text>
      <text x="184" y="130" fill="${PALETTE.muted}" font-size="10">视线先图后字</text>
      <rect x="184" y="162" width="84" height="22" fill="none" stroke="${PALETTE.plum}" stroke-width="1.2"/>
      <text x="202" y="177" fill="${PALETTE.plum}" font-size="10">查看展讯</text>`;
  }
  if (mode === "break") {
    return `<rect width="${W}" height="${H}" fill="#e6d3c8"/>
      <rect x="20" y="22" width="280" height="176" fill="#fcf7f3" stroke="#b98a82" stroke-width="1"/>
      <rect x="36" y="44" width="128" height="136" fill="${PALETTE.arch}"/>
      ${img(44, 14, 126, 158)}
      <rect x="44" y="14" width="126" height="158" fill="none" stroke="#fcf7f3" stroke-width="3"/>
      <text x="188" y="84" fill="${PALETTE.ink}" font-size="17" font-weight="600">春庭花事</text>
      <text x="188" y="106" fill="${PALETTE.muted}" font-size="10">主图向上探出内框</text>
      <text x="188" y="122" fill="${PALETTE.muted}" font-size="10">秩序仍在，多了活气</text>
      <circle cx="192" cy="54" r="5" fill="${PALETTE.plum}"/>`;
  }
  // over: 过度套框
  return `<rect width="${W}" height="${H}" fill="#b9847e"/>
    <rect x="12" y="10" width="296" height="200" fill="#d9bcb3" stroke="#38201c" stroke-width="2"/>
    <rect x="26" y="22" width="268" height="176" fill="#f8f0ea" stroke="#8d3048" stroke-width="2"/>
    <rect x="40" y="34" width="240" height="152" fill="#e6d3c8" stroke="#38201c" stroke-width="1.5"/>
    <rect x="54" y="46" width="102" height="128" fill="#fcf7f3" stroke="#8d3048" stroke-width="1.5"/>
    ${img(64, 56, 82, 108)}
    <rect x="166" y="46" width="100" height="128" fill="#fcf7f3" stroke="#38201c" stroke-width="1.5"/>
    <rect x="174" y="56" width="84" height="52" fill="#efe1d8" stroke="#8d3048" stroke-width="1"/>
    <text x="184" y="86" fill="${PALETTE.ink}" font-size="13">春庭花事</text>
    <rect x="174" y="118" width="84" height="44" fill="#efe1d8" stroke="#8d3048" stroke-width="1"/>
    <text x="180" y="144" fill="${PALETTE.muted}" font-size="9">框比内容还多</text>`;
}

// 07 节：小练习四选一（A/B/C/D）
export function quizSVG(key) {
  const W = 200;
  const H = 240;
  const person = (x, y, s = 1, col = PALETTE.plum) => `<g transform="translate(${x} ${y}) scale(${s})">
    <circle cx="0" cy="-34" r="8" fill="${col}"/>
    <path d="M-12 4 C-11 -16 -6 -24 0 -24 C6 -24 11 -16 12 4 Z" fill="${col}"/>
  </g>`;

  const courtyard = `<rect width="${W}" height="${H}" fill="#f7ebe3"/>
    <rect y="168" width="${W}" height="72" fill="#e5cfc4"/>`;

  if (key === "A") {
    // 亮花前景框 + 窗棂横切人物脖子
    return `<defs><pattern id="qa" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 7 H14 M7 0 V14" stroke="#8d3048" stroke-width="1.2" opacity="0.45"/></pattern></defs>
      ${courtyard}
      ${person(102, 166, 1.05, "#8d3048")}
      <path fill="#f2d5cf" fill-rule="evenodd" d="M0 0 H200 V240 H0 Z M44 46 H156 V196 H44 Z"/>
      <path fill="url(#qa)" fill-rule="evenodd" d="M0 0 H200 V240 H0 Z M44 46 H156 V196 H44 Z"/>
      <line x1="44" y1="138" x2="156" y2="138" stroke="#6b2236" stroke-width="4.5"/>`;
  }
  if (key === "B") {
    // 正确答案：柔和微暗拱门半围合，人物落在明亮内框偏中、留有呼吸
    return `<defs><filter id="qb-blur"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
      ${courtyard}
      <circle cx="136" cy="86" r="14" fill="#fff8f0" opacity="0.8"/>
      ${person(96, 170, 1.12, PALETTE.plumDeep)}
      <g filter="url(#qb-blur)">
        <path fill="#3a211e" fill-rule="evenodd" d="M-10 -10 H210 V250 H-10 Z M44 240 V106 A56 56 0 0 1 156 106 V240 Z" opacity="0.92"/>
      </g>`;
  }
  if (key === "C") {
    // 套框过厚，主体缩成小点
    return `${courtyard}
      ${person(100, 146, 0.45, PALETTE.plumDeep)}
      <path fill="#2d1715" fill-rule="evenodd" d="M0 0 H200 V240 H0 Z M26 30 H174 V210 H26 Z"/>
      <path fill="#7b4c49" fill-rule="evenodd" d="M26 30 H174 V210 H26 Z M50 56 H150 V184 H50 Z"/>
      <path fill="#3a211e" fill-rule="evenodd" d="M50 56 H150 V184 H50 Z M72 82 H128 V158 H72 Z"/>`;
  }
  // D: 站位偏歪，拱门边缘硬切主体一半
  return `${courtyard}
    ${person(54, 170, 1.08, PALETTE.plumDeep)}
    <path fill="#3a211e" fill-rule="evenodd" d="M0 0 H200 V240 H0 Z M54 240 V104 A58 58 0 0 1 170 104 V240 Z"/>`;
}

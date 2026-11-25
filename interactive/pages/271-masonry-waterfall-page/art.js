// 271 瀑布流页面：原海报同源手工艺暖色调矢量插画与图标（零外部请求、任意 DPR 锐利）
// 严格遵循不画人脸五官原则：沙漠旅人仅为远景背影剪影。

export const CARD_ICONS = {
  "dot-terra": `<svg viewBox="0 0 18 18" class="c-ico" aria-hidden="true"><circle cx="9" cy="9" r="5.5" fill="#CE5D2B"/></svg>`,
  "dot-olive": `<svg viewBox="0 0 18 18" class="c-ico" aria-hidden="true"><circle cx="9" cy="9" r="5.5" fill="#6B6942"/></svg>`,
  bookmark: `<svg viewBox="0 0 18 22" class="c-ico" aria-hidden="true"><path d="M3 2h12v18l-6-4.5L3 20Z" fill="#F9EDDA"/></svg>`,
  lens: `<svg viewBox="0 0 22 22" class="c-ico" aria-hidden="true"><circle cx="11" cy="11" r="8.5" fill="none" stroke="#F9EDDA" stroke-width="1.6"/><circle cx="11" cy="11" r="2.2" fill="#F9EDDA"/><path d="M11 4.5v2.2M11 15.3v2.2M4.5 11h2.2M15.3 11h2.2" stroke="#F9EDDA" stroke-width="1.4"/></svg>`,
  peak: `<svg viewBox="0 0 24 18" class="c-ico" aria-hidden="true"><path d="M1 16L9 3l5 7 3-4 6 10Z" fill="#F9EDDA"/></svg>`,
  quote: `<svg viewBox="0 0 32 24" class="c-ico c-ico-quote" aria-hidden="true"><path d="M2 15c0-6 4-11 10-13l1.6 3C10 6.5 8.5 9 8.4 11H13v11H2V15Zm16 0c0-6 4-11 10-13l1.6 3C26 6.5 24.5 9 24.4 11H29v11H18V15Z" fill="#CE5D2B"/></svg>`,
  play: `<svg viewBox="0 0 18 18" class="c-ico" aria-hidden="true"><path d="M4 2.5L15.5 9 4 15.5Z" fill="#F9EDDA"/></svg>`,
  bag: `<svg viewBox="0 0 20 22" class="c-ico" aria-hidden="true"><path d="M6 7V5a4 4 0 0 1 8 0v2" fill="none" stroke="#CE5D2B" stroke-width="2"/><rect x="3" y="7" width="14" height="12.5" rx="2" fill="#CE5D2B"/></svg>`,
};

export function cardArtSvg(key) {
  switch (key) {
    case "desert":
      // 暖赤沙丘与蜿蜒足迹、远景背影旅人（致敬原海报「自然之旅」）
      return `<svg viewBox="0 0 240 330" preserveAspectRatio="xMidYMid slice" class="c-art" aria-hidden="true">
        <defs>
          <linearGradient id="g-sky-271" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E7C192"/><stop offset="100%" stop-color="#D48445"/></linearGradient>
          <linearGradient id="g-dune1-271" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#C96426"/><stop offset="100%" stop-color="#7B3510"/></linearGradient>
          <linearGradient id="g-dune2-271" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#DC7D39"/><stop offset="100%" stop-color="#9A4517"/></linearGradient>
        </defs>
        <rect width="240" height="330" fill="url(#g-sky-271)"/>
        <path d="M0 112 Q78 60 164 106 T240 94 L240 330 L0 330Z" fill="url(#g-dune1-271)"/>
        <path d="M0 174 Q64 128 134 166 Q188 196 240 156 L240 330 L0 330Z" fill="url(#g-dune2-271)"/>
        <path d="M0 244 Q110 212 240 246 L240 330 L0 330Z" fill="#BA571F"/>
        <g fill="#5B2408" opacity="0.58">
          <ellipse cx="118" cy="316" rx="5" ry="2.2"/><ellipse cx="131" cy="303" rx="4.6" ry="2"/>
          <ellipse cx="122" cy="290" rx="4.2" ry="1.8"/><ellipse cx="134" cy="278" rx="3.8" ry="1.7"/>
          <ellipse cx="127" cy="266" rx="3.4" ry="1.5"/><ellipse cx="135" cy="255" rx="3" ry="1.4"/>
          <ellipse cx="128" cy="244" rx="2.6" ry="1.2"/><ellipse cx="133" cy="233" rx="2.3" ry="1.1"/>
          <ellipse cx="126" cy="222" rx="2" ry="1"/><ellipse cx="129" cy="212" rx="1.8" ry="0.9"/>
        </g>
        <g transform="translate(124,182)" fill="#29150A">
          <circle cx="0" cy="-12" r="3.4"/>
          <path d="M-4 -7 C-4 -8 4 -8 4 -7 L5 5 L2 5 L1.5 16 L-1.5 16 L-2 5 L-5 5Z"/>
          <path d="M-2 16 L6 23 L14 23 L1 16Z" fill="#5D260A" opacity="0.4"/>
        </g>
      </svg>`;

    case "bauhaus":
      // 焙陶×橄榄×深棕几何拼贴（致敬原海报「设计灵感」）
      return `<svg viewBox="0 0 220 260" preserveAspectRatio="xMidYMid slice" class="c-art" aria-hidden="true">
        <rect width="220" height="260" fill="#F2E4CE"/>
        <rect x="0" y="0" width="110" height="164" fill="#68663F"/>
        <rect x="0" y="164" width="110" height="96" fill="#291E10"/>
        <circle cx="114" cy="96" r="56" fill="#CF5E2B"/>
        <path d="M126 260 A94 94 0 0 1 220 166 L220 260Z" fill="#68663F"/>
        <rect x="0" y="164" width="22" height="96" fill="#F2E4CE" opacity="0.9"/>
      </svg>`;

    case "leaves":
      // 暖砂墙面与斜阳枝叶投影（致敬原海报「生活记录」）
      return `<svg viewBox="0 0 240 220" preserveAspectRatio="xMidYMid slice" class="c-art" aria-hidden="true">
        <defs>
          <linearGradient id="g-plaster-271" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#D7BE9D"/><stop offset="55%" stop-color="#C9AC89"/><stop offset="100%" stop-color="#B99874"/></linearGradient>
        </defs>
        <rect width="240" height="220" fill="url(#g-plaster-271)"/>
        <polygon points="0,0 130,0 38,220 0,220" fill="#9E7E5D" opacity="0.45"/>
        <polygon points="150,0 240,0 240,145 104,220 68,220" fill="#EFE0C6" opacity="0.34"/>
        <g transform="translate(8,14)" opacity="0.32" fill="#5A452C">
          <path d="M24 0 Q96 80 184 184" fill="none" stroke="#5A452C" stroke-width="4"/>
          <ellipse cx="78" cy="52" rx="22" ry="11" transform="rotate(-24 78 52)"/>
          <ellipse cx="112" cy="108" rx="26" ry="12" transform="rotate(20 112 108)"/>
          <ellipse cx="152" cy="140" rx="20" ry="10" transform="rotate(-32 152 140)"/>
        </g>
        <g fill="#4F5432">
          <path d="M12 6 Q88 86 176 196" fill="none" stroke="#4F5432" stroke-width="3.5"/>
          <ellipse cx="52" cy="40" rx="24" ry="11" transform="rotate(-34 52 40)"/>
          <ellipse cx="86" cy="54" rx="20" ry="9" transform="rotate(14 86 54)" fill="#656A40"/>
          <ellipse cx="96" cy="96" rx="26" ry="12" transform="rotate(-18 96 96)"/>
          <ellipse cx="134" cy="118" rx="22" ry="10" transform="rotate(24 134 118)" fill="#6B7046"/>
          <ellipse cx="144" cy="160" rx="24" ry="11" transform="rotate(-26 144 160)"/>
          <ellipse cx="176" cy="178" rx="18" ry="9" transform="rotate(18 176 178)" fill="#787A4F"/>
        </g>
      </svg>`;

    case "stairs":
      // 赤陶泥砖阶梯与拱门深影（致敬原海报「摄影作品」，特意拉长构成经典超长竖图）
      return `<svg viewBox="0 0 220 560" preserveAspectRatio="xMidYMid slice" class="c-art" aria-hidden="true">
        <defs>
          <linearGradient id="g-clay-271" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#D47E52"/><stop offset="100%" stop-color="#9A4824"/></linearGradient>
        </defs>
        <rect width="220" height="560" fill="url(#g-clay-271)"/>
        <rect x="0" y="0" width="220" height="195" fill="#B85F34"/>
        <path d="M40 195 V74 A34 34 0 0 1 108 74 V195Z" fill="#321409"/>
        <path d="M40 195 V74 A34 34 0 0 1 74 40 V195Z" fill="#52210E" opacity="0.55"/>
        <polygon points="108,150 220,90 220,270 108,330" fill="#CE764B"/>
        <path d="M126 390 V252 A38 38 0 0 1 202 252 V390Z" fill="#2A1007"/>
        <g fill="#E1996E">
          <rect x="14" y="210" width="96" height="16"/><rect x="8" y="246" width="102" height="16"/>
          <rect x="0" y="282" width="110" height="16"/><rect x="0" y="318" width="114" height="18"/>
          <rect x="0" y="356" width="118" height="18"/><rect x="0" y="396" width="136" height="20"/>
          <rect x="0" y="438" width="176" height="22"/><rect x="0" y="482" width="220" height="24"/>
        </g>
        <g fill="#8F4322">
          <rect x="14" y="226" width="96" height="20"/><rect x="8" y="262" width="102" height="20"/>
          <rect x="0" y="298" width="110" height="20"/><rect x="0" y="336" width="114" height="20"/>
          <rect x="0" y="374" width="118" height="22"/><rect x="0" y="416" width="136" height="22"/>
          <rect x="0" y="460" width="176" height="22"/><rect x="0" y="506" width="220" height="54"/>
        </g>
        <polygon points="108,210 124,202 124,394 108,396" fill="#713117" opacity="0.72"/>
      </svg>`;

    case "sea":
      // 落日海面金辉波纹（致敬原海报「视频精选」）
      return `<svg viewBox="0 0 260 190" preserveAspectRatio="xMidYMid slice" class="c-art" aria-hidden="true">
        <defs>
          <linearGradient id="g-sea-271" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3C2A17"/><stop offset="48%" stop-color="#694827"/><stop offset="100%" stop-color="#22170C"/></linearGradient>
        </defs>
        <rect width="260" height="190" fill="url(#g-sea-271)"/>
        <ellipse cx="130" cy="72" rx="92" ry="38" fill="#E3B16E" opacity="0.28"/>
        <g stroke="#F2D19D" stroke-linecap="round" opacity="0.72">
          <path d="M52 54H208" stroke-width="3"/><path d="M26 70H234" stroke-width="4.5"/>
          <path d="M68 86H196" stroke-width="3.5"/><path d="M18 104H242" stroke-width="5"/>
          <path d="M48 122H212" stroke-width="3"/><path d="M74 140H188" stroke-width="2.6"/>
          <path d="M98 158H166" stroke-width="2"/>
        </g>
      </svg>`;

    case "canyon":
      // 异步追加卡：超长峡谷地貌长卷
      return `<svg viewBox="0 0 220 520" preserveAspectRatio="xMidYMid slice" class="c-art" aria-hidden="true">
        <rect width="220" height="520" fill="#E8C99D"/>
        <path d="M0 70 L74 132 L54 248 L88 380 L40 520 L0 520Z" fill="#B75126"/>
        <path d="M220 40 L142 124 L164 252 L124 396 L176 520 L220 520Z" fill="#76351A"/>
        <path d="M74 132 L114 218 L88 380 L124 396 L164 252 L142 124Z" fill="#D4844E" opacity="0.5"/>
        <circle cx="110" cy="48" r="22" fill="#F9EDDA" opacity="0.88"/>
      </svg>`;

    case "coast":
      // 异步追加卡：宽幅海岸晨雾
      return `<svg viewBox="0 0 280 170" preserveAspectRatio="xMidYMid slice" class="c-art" aria-hidden="true">
        <rect width="280" height="170" fill="#DCE0D0"/>
        <rect y="94" width="280" height="76" fill="#5D644B"/>
        <path d="M0 94 Q70 72 150 88 T280 82 L280 98 L0 98Z" fill="#8B8C68"/>
        <circle cx="212" cy="44" r="18" fill="#E88B53" opacity="0.85"/>
        <path d="M24 122H128M156 138H248M66 152H184" stroke="#F4E7CF" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
      </svg>`;

    case "pottery":
      // 异步追加卡：素坯陶艺器物
      return `<svg viewBox="0 0 220 250" preserveAspectRatio="xMidYMid slice" class="c-art" aria-hidden="true">
        <rect width="220" height="250" fill="#F2E4CE"/>
        <rect y="182" width="220" height="68" fill="#DFC8A6"/>
        <path d="M78 72 H142 L134 94 C156 112 162 154 140 186 H80 C58 154 64 112 86 94 Z" fill="#6A6842"/>
        <ellipse cx="110" cy="72" rx="32" ry="7" fill="#46452A"/>
        <path d="M90 124 Q110 132 132 122" fill="none" stroke="#F2E4CE" stroke-width="2.4" opacity="0.7"/>
      </svg>`;

    default:
      return "";
  }
}

export const PILLAR_ICONS = {
  stagger: `<svg viewBox="0 0 56 48" class="p-ico" aria-hidden="true">
    <rect x="20" y="4" width="16" height="7" rx="1.5" fill="#E86A2E"/>
    <rect x="10" y="15" width="32" height="7" rx="1.5" fill="#E86A2E"/>
    <rect x="4" y="26" width="38" height="7" rx="1.5" fill="#E86A2E"/>
    <rect x="4" y="37" width="46" height="7" rx="1.5" fill="#E86A2E"/>
  </svg>`,
  browse: `<svg viewBox="0 0 56 48" class="p-ico" aria-hidden="true">
    <path d="M4 24 C13 10 43 10 52 24 C43 38 13 38 4 24Z" fill="none" stroke="#6B6942" stroke-width="3.2"/>
    <circle cx="28" cy="24" r="6.5" fill="#6B6942"/>
  </svg>`,
  flexible: `<svg viewBox="0 0 56 48" class="p-ico" aria-hidden="true">
    <path d="M6 12 Q17 4 28 12 T50 12" fill="none" stroke="#E86A2E" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M6 24 Q17 16 28 24 T50 24" fill="none" stroke="#E86A2E" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M6 36 Q17 28 28 36 T50 36" fill="none" stroke="#E86A2E" stroke-width="3.4" stroke-linecap="round"/>
  </svg>`,
  rich: `<svg viewBox="0 0 56 48" class="p-ico" aria-hidden="true">
    <rect x="12" y="4" width="13" height="11" rx="2.5" fill="#6B6942"/>
    <rect x="31" y="4" width="13" height="11" rx="2.5" fill="#6B6942"/>
    <rect x="12" y="19" width="13" height="11" rx="2.5" fill="#6B6942"/>
    <rect x="31" y="19" width="13" height="11" rx="2.5" fill="#6B6942"/>
    <rect x="12" y="34" width="13" height="11" rx="2.5" fill="#6B6942"/>
    <rect x="31" y="34" width="13" height="11" rx="2.5" fill="#6B6942"/>
  </svg>`,
};

// Fraunces 没有 φ 和 √，退到 Noto Serif SC 以后又细又小，跟旁边的数字不是一套。
// 这里按 Fraunces 的尺寸（数字高 0.715em、x 高 0.482em、常规体竖笔约 0.095em）画这两个字形，
// 用 CSS mask 盖在原来的字上：字还在（能选中、能复制、读屏照读），只是看见的是画出来的形状。
// 字形框宽 0.62em、高 1.243em，基线在离顶 0.983em 处（上下留白和 Fraunces 行高 1.3 时一样，flex 居中也对得齐）。
export const BOX = { w: 620, h: 1243, base: 983 };

// 竖笔上下出头带小衬线；圆圈左右粗、上下细
export const PHI_D =
  "M25 742A285 257 0 1 1 595 742A285 257 0 1 1 25 742ZM120 742A190 224 0 1 0 500 742A190 224 0 1 0 120 742Z" +
  "M263 268H357V1223H263ZM215 268H405V297H215ZM215 1194H405V1223H215Z";
// 根号：短挑、粗的下笔、细的上笔，最后一笔接上横线；横线在基线上方 0.78–0.82em，和 .rad 的上边框接成一条
export const SQRT_D = "M30 715L30 685L135 635L210 635L301 1018L589 163L620 163L620 203L611 203L316 1080L270 1080L143 661Z";

const url = (d) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOX.w} ${BOX.h}"><path d="${d}"/></svg>`)}")`;

export function initGlyphs() {
  const root = document.documentElement;
  root.style.setProperty("--glyph-phi", url(PHI_D));
  root.style.setProperty("--glyph-sqrt", url(SQRT_D));
  root.classList.add("glyphs");
}

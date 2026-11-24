// 语言表：只在这里写一次（I18N.md），页面、atlas.js、检查脚本都从这里取。
//   code  译文文件名（src/i18n/ui/<code>.json、src/i18n/content/<code>.json）
//   path  网址里的那一段；简体中文是源语言，在根上，没有这一段
//   lang  写进 <html lang> 和 hreflang
//   dir   文字方向
//   name  这种语言自己的叫法（语言菜单、横幅里用）
//   cc    CC BY 4.0 授权页的语言（creativecommons.org/licenses/by/4.0/deed.<cc>）
//   base  这个语言的首页地址（由 path 算出来）
export const LOCALES = [
  { code: "zh", path: "", lang: "zh-CN", dir: "ltr", name: "简体中文", cc: "zh-hans" },
  { code: "zh-Hant", path: "zh-hant", lang: "zh-Hant", dir: "ltr", name: "繁體中文", cc: "zh-hant" },
  { code: "en", path: "en", lang: "en", dir: "ltr", name: "English", cc: "en" },
  { code: "ja", path: "ja", lang: "ja", dir: "ltr", name: "日本語", cc: "ja" },
  { code: "ko", path: "ko", lang: "ko", dir: "ltr", name: "한국어", cc: "ko" },
  { code: "es", path: "es", lang: "es", dir: "ltr", name: "Español", cc: "es" },
  { code: "fr", path: "fr", lang: "fr", dir: "ltr", name: "Français", cc: "fr" },
  { code: "de", path: "de", lang: "de", dir: "ltr", name: "Deutsch", cc: "de" },
  { code: "pt", path: "pt", lang: "pt", dir: "ltr", name: "Português", cc: "pt" },
  { code: "ru", path: "ru", lang: "ru", dir: "ltr", name: "Русский", cc: "ru" },
  { code: "ar", path: "ar", lang: "ar", dir: "rtl", name: "العربية", cc: "ar" },
].map((l) => ({ ...l, base: l.path ? `/${l.path}/` : "/" }));

export const SOURCE = LOCALES[0];

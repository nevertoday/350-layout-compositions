import { existsSync, renameSync, rmdirSync } from "node:fs";
import { defineConfig } from "astro/config";
import { LOCALES } from "./src/i18n/locales.js";

// 350 种排版的网站：纯静态，部署在 https://layout.xiaoxiaodong.ai（Workers 静态资源，见 wrangler.jsonc）。
// 界面用 xxd-ui-kit（public/xxd/ 里的一份，pnpm xxd sync 更新）；数据只从 src/data/atlas.js 来。
// 每种语言一套页面（src/i18n/locales.js）。404 页由 [...lang]/404.astro 生成，Astro 把它写成 <语言>/404/index.html，
// 构建完挪成 <语言>/404.html（简体中文是根上的 404.html）：Workers 静态资源对找不到的地址回最近的 404.html。
const localeNotFound = {
  name: "xxd-locale-404",
  hooks: {
    "astro:build:done": ({ dir }) => {
      for (const l of LOCALES) {
        const at = (p) => new URL(l.base.slice(1) + p, dir);
        if (!existsSync(at("404/index.html"))) continue;
        renameSync(at("404/index.html"), at("404.html"));
        rmdirSync(at("404/"));
      }
    },
  },
};

export default defineConfig({
  site: "https://layout.xiaoxiaodong.ai",
  trailingSlash: "always",
  build: { format: "directory" },
  devToolbar: { enabled: false },
  integrations: [localeNotFound],
});

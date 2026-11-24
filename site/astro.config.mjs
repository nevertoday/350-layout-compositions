import { defineConfig } from "astro/config";

// 350 种排版的网站：纯静态，部署在 https://layout.xiaoxiaodong.ai（Workers 静态资源，见 wrangler.jsonc）。
// 界面用 xxd-ui-kit（public/xxd/ 里的一份，pnpm xxd sync 更新）；数据只从 src/data/atlas.js 来。
export default defineConfig({
  site: "https://layout.xiaoxiaodong.ai",
  trailingSlash: "always",
  build: { format: "directory" },
  devToolbar: { enabled: false },
});

// 起一页的骨架：node new.mjs 001 [slug]
// 标题取自 ../site/src/data/poster-text.json（海报上的字），slug 默认由英文标题来。已经有这一页就什么都不做。
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PAGES, ROOT } from "./build.mjs";

const [id, slugArg] = process.argv.slice(2);
if (!/^\d{3}$/.test(id || "")) throw new Error("用法：npm run new -- 001 [slug]");
const existing = existsSync(PAGES) && readdirSync(PAGES).find((d) => d.startsWith(`${id}-`));
if (existing) {
  console.log(`已经有 pages/${existing}/`);
  process.exit(0);
}
const text = JSON.parse(readFileSync(join(ROOT, "../site/src/data/poster-text.json"), "utf8"))[id];
if (!text) throw new Error(`poster-text.json 里没有 ${id}`);
const slug = slugArg || text.title_en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const dir = join(PAGES, `${id}-${slug}`);
mkdirSync(dir, { recursive: true });

const files = {
  "page.json": `${JSON.stringify({ id, title: text.title, title_en: text.title_en, fonts: [{ name: "noto-serif-sc", weights: [400, 900] }, { name: "inter", weights: [400, 600] }], poster: true }, null, 2)}\n`,
  "index.html": `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${text.title} · ${text.title_en}</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<main>
  <h1>${text.title}</h1>
  <p lang="en">${text.title_en}</p>
  <div id="stage"></div>
  <img id="poster" src="poster.webp" width="1086" height="1448" alt="${text.title}海报">
</main>
<script type="module" src="main.js"></script>
</body>
</html>
`,
  "style.css": `* { box-sizing: border-box; }
body { margin: 0; font-family: "Noto Serif SC", serif; }
[lang="en"] { font-family: "Inter", sans-serif; }
img { max-width: 100%; height: auto; }
#stage { aspect-ratio: 4 / 3; }
`,
  "main.js": `import * as THREE from "three";
import { loop, pixelRatio, webgl } from "../../lib/stage.js";

const stage = document.getElementById("stage");
if (webgl()) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(pixelRatio());
  stage.append(renderer.domElement);
  // ...
  loop(stage, (t, dt) => {
    // renderer.render(scene, camera);
  });
} else {
  // 静态的替代画面
}
`,
};
for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
console.log(`pages/${id}-${slug}/  ${text.title}（海报上的全部字在 site/src/data/poster-text.json 的 "${id}"）`);

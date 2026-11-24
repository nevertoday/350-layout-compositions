// 从 git 里的原图（v2/images/*.png，稀疏检出时不在工作区，但 blob 都在本地）生成网站用的 WebP：
//   public/t/<key>.webp  缩略图，480 宽      public/p/<key>.webp  大图，原尺寸 1086 × 1448
// key 是编号（001），第二版是 001-2；哪些图、叫什么由 src/data/atlas.js 的 imageSources 决定。
// 可以反复跑：.build/images.json 记着每个输出是用哪张源图（sha256）、哪组参数做的，对得上就跳过；
// 先写临时文件再改名，跑到一半断了也不会留下半张图；目录里多出来的旧图会删掉。
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { join } from "node:path";
import { imageSources } from "../src/data/atlas.js";

const SITE = process.cwd();
const CWEBP = process.env.CWEBP || "/opt/homebrew/bin/cwebp";
const OUT = {
  t: { dir: join(SITE, "public/t"), args: ["-q", "80", "-sharp_yuv", "-resize", "480", "0"] },
  p: { dir: join(SITE, "public/p"), args: ["-q", "88", "-sharp_yuv"] },
};
const MANIFEST = join(SITE, ".build/images.json");
const recipe = (kind) => OUT[kind].args.join(" ");

mkdirSync(join(SITE, ".build"), { recursive: true });
for (const { dir } of Object.values(OUT)) mkdirSync(dir, { recursive: true });
let manifest = {};
try { manifest = JSON.parse(readFileSync(MANIFEST, "utf8")); } catch {}
const saveManifest = () => {
  writeFileSync(MANIFEST + ".tmp", JSON.stringify(manifest, null, 1));
  renameSync(MANIFEST + ".tmp", MANIFEST);
};

// 一个 git cat-file --batch 进程按顺序读 blob
const git = spawn("git", ["-C", join(SITE, ".."), "cat-file", "--batch"], { stdio: ["pipe", "pipe", "inherit"] });
let buf = Buffer.alloc(0);
const waiting = [];
git.stdout.on("data", (chunk) => {
  buf = Buffer.concat([buf, chunk]);
  while (waiting.length) {
    const nl = buf.indexOf(10);
    if (nl < 0) return;
    const header = buf.subarray(0, nl).toString().split(" ");
    if (header[1] === "missing") { buf = buf.subarray(nl + 1); waiting.shift().reject(new Error(`git 里没有 ${header[0]}`)); continue; }
    const size = Number(header[2]);
    if (buf.length < nl + 1 + size + 1) return;
    const data = buf.subarray(nl + 1, nl + 1 + size);
    buf = buf.subarray(nl + 1 + size + 1);
    waiting.shift().resolve(Buffer.from(data));
  }
});
const readBlob = (path) => new Promise((resolve, reject) => {
  waiting.push({ resolve, reject });
  git.stdin.write(`HEAD:${path}\n`);
});

const run = (args) => new Promise((resolve, reject) => {
  const p = spawn(CWEBP, args, { stdio: ["ignore", "ignore", "pipe"] });
  let err = "";
  p.stderr.on("data", (d) => { err += d; });
  p.on("error", reject);
  p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`cwebp ${code}: ${err.trim()}`))));
});

const tmp = join(tmpdir(), `xxd-layout-images-${process.pid}`);
mkdirSync(tmp, { recursive: true });
const want = new Set();
const jobs = [];
for (const src of imageSources) {
  const todo = [];
  for (const kind of Object.keys(OUT)) {
    const file = `${src.key}.webp`;
    want.add(`${kind}/${file}`);
    const stamp = `${src.sha256} ${recipe(kind)}`;
    if (manifest[`${kind}/${file}`] !== stamp || !existsSync(join(OUT[kind].dir, file))) todo.push({ kind, file, stamp });
  }
  if (todo.length) jobs.push({ src, todo });
}

let done = 0;
const convert = async ({ src, todo }) => {
  const png = await readBlob(src.src);
  const sha = createHash("sha256").update(png).digest("hex");
  if (sha !== src.sha256) throw new Error(`${src.src} 的 sha256 和目录不一致（git ${sha.slice(0, 8)}，目录 ${src.sha256.slice(0, 8)}）`);
  const input = join(tmp, `${src.key}.png`);
  writeFileSync(input, png);
  for (const { kind, file, stamp } of todo) {
    const final = join(OUT[kind].dir, file);
    const part = `${final}.${process.pid}.tmp`;
    await run(["-quiet", ...OUT[kind].args, input, "-o", part]);
    renameSync(part, final);
    manifest[`${kind}/${file}`] = stamp;
  }
  rmSync(input);
  if (++done % 25 === 0) { saveManifest(); console.log(`  ${done} / ${jobs.length}`); }
};

const lanes = Math.max(2, Math.min(6, Math.floor(availableParallelism() / 2)));
let next = 0;
try {
  await Promise.all(Array.from({ length: lanes }, async () => {
    while (next < jobs.length) await convert(jobs[next++]);
  }));
} finally {
  git.stdin.end();
  saveManifest();
  rmSync(tmp, { recursive: true, force: true });
}

// 收尾：目录里不该有的文件（旧编号、上次断掉留下的 .tmp）删掉
let removed = 0;
for (const kind of Object.keys(OUT)) {
  for (const f of readdirSync(OUT[kind].dir)) {
    if (!want.has(`${kind}/${f}`)) { rmSync(join(OUT[kind].dir, f)); delete manifest[`${kind}/${f}`]; removed++; }
  }
}
for (const k of Object.keys(manifest)) if (!want.has(k)) delete manifest[k];
saveManifest();

const size = (dir) => readdirSync(dir).reduce((n, f) => n + statSync(join(dir, f)).size, 0);
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
console.log(`图片：${imageSources.length} 张源图，这次转了 ${jobs.length} 张，跳过 ${imageSources.length - jobs.length} 张，删掉 ${removed} 个多余文件。` +
  ` public/t ${readdirSync(OUT.t.dir).length} 个 ${mb(size(OUT.t.dir))}，public/p ${readdirSync(OUT.p.dir).length} 个 ${mb(size(OUT.p.dir))}`);

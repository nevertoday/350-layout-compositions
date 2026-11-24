import { atlases } from "../data/atlas.js";
import { SOURCE } from "../i18n/locales.js";

const SITE = "https://layout.xiaoxiaodong.ai";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const built = atlases();
  const paths = ["", "about/", ...built[0].layouts.map((l) => `${l.id}/`)];
  const entries = [];
  for (const p of paths) {
    const alts = [
      ...built.map((a) => `    <xhtml:link rel="alternate" hreflang="${esc(a.locale.lang)}" href="${esc(SITE + a.locale.base + p)}" />`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(SITE + SOURCE.base + p)}" />`,
    ].join("\n");
    const prio = p === "" ? "1.0" : p === "about/" ? "0.7" : "0.8";
    for (const a of built) {
      entries.push(`  <url>\n    <loc>${esc(SITE + a.locale.base + p)}</loc>\n${alts}\n    <priority>${prio}</priority>\n  </url>`);
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

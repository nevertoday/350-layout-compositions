#!/usr/bin/env node

import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.GALLERY_PLAYWRIGHT_MODULE || "playwright");
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
await page.addInitScript(() => {
  Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async (text) => { window.__copiedText = text; } },
  });
  document.execCommand = (command) => {
    if (command !== "copy") return false;
    window.__copiedText = document.activeElement?.value || "";
    return true;
  };
});

await page.goto(pathToFileURL(path.join(repo, "index.html")).href);
await page.waitForSelector('.layout-card[data-id="350"]');
assert.equal(await page.locator(".layout-card").count(), 350, "all cards should render");
assert.equal(await page.locator('.layout-card[data-id="044"] h2').textContent(), "渐变组织");
assert.equal(await page.locator('.layout-card[data-id="236"] h2').textContent(), "页眉—主体—页脚");
assert.equal(await page.locator('.layout-card[data-id="322"] h2').textContent(), "直排中西文直立");

await page.locator('.layout-card[data-id="044"] .card-trigger').click();
await page.waitForSelector("#detailDialog[open]");
assert.equal(await page.locator("#detailTitle").textContent(), "渐变组织");
const visiblePrompt = (await page.locator("#detailPrompt").textContent()).trim();
assert.ok(visiblePrompt.startsWith("请以「渐变组织」为核心设计"));
await page.locator("#copyButton").click();
assert.equal(await page.locator("#copyButton span").textContent(), "已复制");
assert.equal(await page.evaluate(() => window.__copiedText), visiblePrompt, "copy must match visible prompt exactly");
await page.screenshot({ path: "/tmp/350-gallery-detail.png", fullPage: false });

await page.locator("#closeButton").click();
await page.waitForFunction(() => !document.querySelector("#detailDialog")?.open);
await page.locator("#searchInput").fill("页眉—主体—页脚");
await page.waitForTimeout(180);
assert.equal(await page.locator('.layout-card[data-id="236"]').count(), 1, "corrected titles must be searchable");

const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
assert.equal(hasOverflow, false, "desktop page should not overflow horizontally");
assert.deepEqual(pageErrors, [], `browser page errors: ${pageErrors.join("; ")}`);
console.log("browser gallery verified: render, corrected titles, prompt visibility, exact copy, search, no page errors");
await browser.close();

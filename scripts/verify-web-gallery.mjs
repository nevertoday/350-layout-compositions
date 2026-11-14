#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({ window: {} });

for (const file of ["web/catalog-data.js", "web/card-content.js"]) {
  vm.runInContext(fs.readFileSync(path.join(repo, file), "utf8"), context, { filename: file });
}

const catalog = context.window.LAYOUT_CATALOG;
const content = context.window.LAYOUT_CONTENT;
assert.equal(catalog.length, 350, "catalog must contain 350 cards");
assert.equal(Object.keys(content).length, 350, "content must contain 350 cards");

const sourceIds = new Set(catalog.map((item) => item.id));
assert.deepEqual(new Set(Object.keys(content)), sourceIds, "content ids must match image ids");

for (const item of catalog) {
  const card = content[item.id];
  for (const field of ["name", "category", "subcategory", "description", "prompt"]) {
    assert.equal(typeof card[field], "string", `${item.id} ${field} must be text`);
    assert.ok(card[field].trim(), `${item.id} ${field} must not be empty`);
  }
  assert.ok(card.prompt.includes(`「${card.name}」`), `${item.id} prompt must name its visible concept`);
  assert.ok(card.prompt.length >= 120, `${item.id} prompt is too short to be useful`);
}

const html = fs.readFileSync(path.join(repo, "index.html"), "utf8");
assert.ok(html.includes('id="detailPrompt"'), "detail view must visibly expose the copied prompt");
assert.ok(html.includes("web/card-content.js"), "corrected card content must load in the page");
assert.ok(html.indexOf("web/card-content.js") < html.indexOf("web/app.js"), "content must load before the app");

const uniqueConcepts = new Set(Object.values(content).map((item) => item.name));
console.log(`web gallery verified: cards=350 concepts=${uniqueConcepts.size} repeated_cards=${350 - uniqueConcepts.size}`);

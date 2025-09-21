#!/usr/bin/env node
// scripts/build-details.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const inPath  = resolve(process.cwd(), getArg("--in",  "details.json"));
const outPath = resolve(process.cwd(), getArg("--out", "details.js"));
const minify  = argv.includes("--minify") || process.env.MINIFY === "1";

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((acc, k) => {
      acc[k] = sortKeysDeep(value[k]);
      return acc;
    }, {});
  }
  return value;
}

function assertObject(obj, label) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error(`${label} must be a plain object`);
  }
}

function toBanner(obj) {
  const hash = crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex").slice(0, 16);
  const when = new Date().toISOString();
  return `/* Generated ${when} • sha256:${hash} */\n`;
}

async function main() {
  const raw = await readFile(inPath, "utf8");
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON in ${inPath}: ${e.message}`);
  }
  assertObject(json, "details.json");

  // Optional: shallow sanity check for a few entries (non-fatal)
  const firstKey = Object.keys(json)[0];
  if (!firstKey) console.warn("⚠ details.json appears empty.");
  else {
    const sample = json[firstKey];
    if (!sample.slug || !sample.name) {
      console.warn("⚠ entries should have 'slug' and 'name' fields.");
    }
  }

  const sorted = sortKeysDeep(json);
  const banner = toBanner(sorted);
  const payload = minify ? JSON.stringify(sorted) : JSON.stringify(sorted, null, 2);

  const js = `${banner}window.HEIC_DETAILS = ${payload};\n`;

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, js, "utf8");
  console.log(`✔ Wrote ${outPath} (${minify ? "minified" : "pretty"})`);
}

main().catch((err) => {
  console.error("❌ build-details failed:", err.message || err);
  process.exit(1);
});
// Generates effects_patch.generated.json by merging effect definitions
// from the files under "New folder" into a single overlay map.
// Keys are full slugs (e.g., 'items/foo'), values are arrays of effect entries.
// Run with: node scripts/generate_effects_patch.js

const fs = require('fs');
const path = require('path');

function safeRequire(p) {
  try { return require(p); } catch (e) { return null; }
}

function normalizeSlug(slug) {
  // Accept incoming slugs as-is; upstream engine maps aliases at runtime.
  return String(slug || '').trim();
}

function addEntry(patch, slug, effects) {
  if (!slug || !Array.isArray(effects)) return;
  const key = normalizeSlug(slug);
  if (!patch[key]) patch[key] = [];
  patch[key].push(...effects);
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const newFolder = path.join(repoRoot, 'New folder');

  const sources = [];
  const out = {};

  // 1) battle_start_code.js
  const bsPath = path.join(newFolder, 'battle_start_code.js');
  const bsMod = safeRequire(bsPath);
  if (bsMod && bsMod.battleStartEffects) {
    sources.push(path.relative(repoRoot, bsPath));
    for (const [slug, effects] of Object.entries(bsMod.battleStartEffects)) {
      addEntry(out, slug, effects);
    }
  }

  // 2) complete_effects_code.js (preferred), else ceffects_code.js
  let cPath = path.join(newFolder, 'complete_effects_code.js');
  let cMod = safeRequire(cPath);
  if (!cMod) {
    cPath = path.join(newFolder, 'ceffects_code.js');
    cMod = safeRequire(cPath);
  }
  if (cMod) {
    sources.push(path.relative(repoRoot, cPath));
    const groups = [
      ['battleStartEffects', (obj) => {
        if (!obj) return;
        if (Array.isArray(obj)) {
          for (const e of obj) addEntry(out, e.slug, e.effects);
        } else {
          for (const [slug, effects] of Object.entries(obj)) addEntry(out, slug, effects);
        }
      }],
      ['exposedEffects', (arr) => {
        if (!Array.isArray(arr)) return; 
        for (const e of arr) addEntry(out, e.slug, e.effects);
      }],
      ['woundedEffects', (arr) => {
        if (!Array.isArray(arr)) return; 
        for (const e of arr) addEntry(out, e.slug, e.effects);
      }],
    ];
    for (const [key, fn] of groups) fn(cMod[key]);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    sources,
    entries: out,
  };

  const outPath = path.join(repoRoot, 'effects_patch.generated.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log('Wrote', path.relative(repoRoot, outPath), 'with', Object.keys(out).length, 'slugs.');
}

if (require.main === module) {
  main();
}

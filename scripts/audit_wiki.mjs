#!/usr/bin/env node
/*
  Audit and align compendium data with offline wiki_dump.

  - Extracts canonical items from region pages (Swampland/Woodland items)
  - Extracts item-tag membership from tag pages
  - Compares stats/effect/tags with details.json
  - Writes:
      wiki_extracted_items.json, wiki_extracted_tags.json, audit_wiki_report.json
  - Updates:
      - stats_overrides.json (fills/updates base stats using wiki values)
      - details.json (adds missing tags from the wiki’s item-tag pages, fills
        missing/placeholder effect text only)
*/

import fs from 'fs';
import path from 'path';
import url from 'url';
import { load as cheerioLoad } from 'cheerio';

// Lazy HTML parsing without external deps: rely on simple string ops + minimal regex.
// (Avoid adding dependencies unless necessary for portability.)

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');

const ARGS = new Set(process.argv.slice(2));
const APPLY = ARGS.has('--apply');

const WIKI_DIR = path.join(PROJECT, 'wiki_dump');
const DETAILS_PATH = path.join(PROJECT, 'details.json');
const OVERRIDES_PATH = path.join(PROJECT, 'stats_overrides.json');
const EXTRACTED_ITEMS_PATH = path.join(PROJECT, 'wiki_extracted_items.json');
const EXTRACTED_TAGS_PATH = path.join(PROJECT, 'wiki_extracted_tags.json');
const REPORT_PATH = path.join(PROJECT, 'audit_wiki_report.json');

// Expand to full set of item tags from Tags page
const UI_ITEM_TAGS = new Set([
  'Tome', 'Bomb', 'Symphony', 'Food', 'Jewelry', 'Ring', 'Stone', 'Water',
  'Wood', 'Rune', 'Potion', 'Crone', 'Rose', 'Mythic', 'Sanguine', 'Unique',
  'Forge Upgrades', 'Edge' // allow either label
]);

function readText(p) {
  let s = fs.readFileSync(p, 'utf8');
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1); // strip BOM
  return s;
}
function writeJSON(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2)); }

function listWikiFiles() {
  const files = fs.readdirSync(WIKI_DIR);
  const regionItems = files.filter(f => / items - He is Coming Official Wiki\.htm$/i.test(f));
  const tagPages = files.filter(f => / - He is Coming Official Wiki\.htm$/i.test(f) && !/items?sets|Main Page|Tags/i.test(f));
  const cauldron = files.find(f => /^Cauldron - He is Coming Official Wiki\.htm$/i.test(f));
  return { regionItems, tagPages, cauldron };
}

function stripHtml(html) {
  // Convert breaks to spaces, remove tags, decode common entities
  let txt = html
    .replace(/<\s*br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#160;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  // Collapse whitespace
  txt = txt.replace(/[ \t\r\n]+/g, ' ').trim();
  return txt;
}

function parseStatsCell(cellHtml) {
  const iconToStat = {
    'Icon_attack.png': 'attack',
    'Icon_speed.png': 'speed',
    'Icon_health.png': 'health',
    'Icon_armor.png': 'armor'
  };
  const stats = { attack: 0, speed: 0, health: 0, armor: 0 };
  // String-scan approach: for each <img ... Icon_*.png>, find the first number that appears
  // after the end of the <img> tag, skipping over any closing tags like </a></span>.
  const html = cellHtml;
  const imgRegex = /<img[^>]+src=\"[^\"]*\/(Icon_[a-z]+\.png)\"[^>]*>/gi;
  let m;
  while ((m = imgRegex.exec(html)) !== null) {
    const icon = m[1];
    const statKey = iconToStat[icon];
    if (!statKey) continue;
    let pos = imgRegex.lastIndex; // position just after the img tag
    // Skip any immediate closing tags and whitespace
    while (pos < html.length) {
      if (html[pos] === '<') {
        const close = html.indexOf('>', pos);
        if (close === -1) break;
        pos = close + 1;
        continue;
      }
      if (/\s/.test(html[pos])) { pos++; continue; }
      break;
    }
    const rest = html.slice(pos);
    const num = rest.match(/-?\d+/);
    if (num) {
      const val = parseInt(num[0], 10);
      if (!Number.isNaN(val)) stats[statKey] = val;
    }
  }
  return stats;
}

function parseRegionItems(fileName) {
  const html = readText(path.join(WIKI_DIR, fileName));
  // Extract the main sortable table rows
  // Find all <table class="wikitable ..."> and parse rows with headers
  const tables = [...html.matchAll(/<table[^>]*class=\"[^\"]*wikitable[^\"]*\"[^>]*>([\s\S]*?)<\/table>/gi)];
  const items = [];
  for (const t of tables) {
    const tableHtml = t[1];
    // Identify header columns
    const headerMatch = tableHtml.match(/<thead>[\s\S]*?<tr>([\s\S]*?)<\/tr>[\s\S]*?<\/thead>/i);
    if (!headerMatch) continue;
    const ths = [...headerMatch[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map(h => stripHtml(h[1]).toLowerCase());
    const colIndex = {
      item: ths.findIndex(h => h.includes('item') || h.includes('weapon')),
      rarity: ths.findIndex(h => h.includes('rarity')),
      stats: ths.findIndex(h => h.includes('stats')),
      effect: ths.findIndex(h => h.includes('effect')),
      region: ths.findIndex(h => h.includes('region'))
    };
    if (colIndex.item === -1 || colIndex.stats === -1 || colIndex.effect === -1) continue;

    // Parse rows
    const tbody = tableHtml.match(/<tbody>([\s\S]*?)<\/tbody>/i);
    if (!tbody) continue;
    const rows = [...tbody[1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)];
    for (const r of rows) {
      const rowHtml = r[1];
      const tds = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(x => x[1]);
      if (tds.length < 3) continue;
      const nameCell = tds[colIndex.item];
      const statsCell = tds[colIndex.stats];
      const effectCell = tds[colIndex.effect];
      const rarityCell = colIndex.rarity !== -1 ? tds[colIndex.rarity] : '';
      const regionCell = colIndex.region !== -1 ? tds[colIndex.region] : '';

      // Item name: prefer <a> text if present
      let name = '';
      const a = nameCell.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
      name = stripHtml(a ? a[1] : nameCell);
      if (!name) continue;

      const stats = parseStatsCell(statsCell);
      const effect = stripHtml(effectCell);
      const rarity = stripHtml(rarityCell);
      const region = stripHtml(regionCell);

      items.push({ name, stats, effect, rarity, region });
    }
  }
  return items;
}

// Simpler parser that assumes standard column order: Name, Rarity, Stats, Effect, Region
function parseRegionItemsSimple(fileName) {
  const html = readText(path.join(WIKI_DIR, fileName));
  const $ = cheerioLoad(html);
  const items = [];
  const hasStatIcon = (h) => /Icon_(attack|speed|health|armor)\.png/i.test(h);
  $('table.wikitable').each((_, table) => {
    $(table).find('tbody > tr').each((__, tr) => {
      const tds = $(tr).find('td');
      if (tds.length < 3) return;
      const cells = tds.toArray().map(td => $.html(td));
      const texts = tds.toArray().map(td => $(td).text().replace(/\s+/g, ' ').trim());

      // Name
      const nameCellIdx = 0;
      const nameCell = $(tds[nameCellIdx]);
      const name = (nameCell.find('a').first().text() || nameCell.text()).trim();
      if (!name) return;

      // Stats cell: first cell containing stat icon
      const statsIdx = cells.findIndex(hasStatIcon);
      if (statsIdx === -1) return; // row without stats
      const stats = parseStatsCell(cells[statsIdx]);

      // Effect cell: prefer a cell (not name or stats) that looks like an effect description
      let effectIdx = -1;
      for (let i = 0; i < cells.length; i++) {
        if (i === nameCellIdx || i === statsIdx) continue;
        if (hasStatIcon(cells[i])) continue;
        const t = texts[i];
        if (/(Battle|Turn|First|On hit|Exposed|Wounded|Whenever|Countdown|Every other turn|While|If)/i.test(t)) {
          effectIdx = i; break;
        }
      }
      if (effectIdx === -1) {
        // fallback: the cell immediately after the stats cell
        effectIdx = Math.min(statsIdx + 1, cells.length - 1);
      }
      const effect = texts[effectIdx] || '';

      // Rarity/Region are optional depending on table type
      const rarity = (texts[1] && !hasStatIcon(cells[1]) && effectIdx !== 1) ? texts[1] : '';
      const region = '';

      items.push({ name, stats, effect, rarity, region });
    });
  });
  return items;
}

function parseTagPage(fileName) {
  const html = readText(path.join(WIKI_DIR, fileName));
  const $ = cheerioLoad(html);
  const items = new Set();
  $('table.wikitable').each((_, table) => {
    $(table).find('tbody > tr').each((__, tr) => {
      const first = $(tr).find('td').first();
      if (!first || first.length === 0) return;
      const name = (first.find('a').first().text() || first.text()).trim();
      if (name) items.add(name);
    });
  });
  return [...items];
}

function normalizeName(s) { return s.replace(/\s+/g, ' ').trim(); }

function main() {
  console.log('Scanning wiki_dump for items and tags...');
  const { regionItems, tagPages, cauldron } = listWikiFiles();

  // 1) Extract items from region pages
  const wikiItems = {};
  for (const f of regionItems) {
    try {
      const entries = parseRegionItemsSimple(f);
      for (const it of entries) {
        const key = normalizeName(it.name);
        // Prefer first occurrence; later pages can’t clobber unless better filled
        if (!wikiItems[key]) wikiItems[key] = it;
      }
      console.log(`Parsed ${entries.length} items from ${f}`);
    } catch (e) {
      console.warn(`Failed parsing ${f}:`, e.message);
    }
  }
  // 1a) Pull additional item stats/effects from Cauldron page (combined itemsets)
  if (cauldron) {
    try {
      const extra = parseRegionItemsSimple(cauldron);
      for (const it of extra) {
        const key = normalizeName(it.name);
        if (!wikiItems[key]) wikiItems[key] = it;
      }
      console.log(`Parsed ${extra.length} items from ${cauldron}`);
    } catch (e) {
      console.warn(`Failed parsing ${cauldron}:`, e.message);
    }
  }

  writeJSON(EXTRACTED_ITEMS_PATH, wikiItems);

  // 2) Extract item-tag membership from tag pages
  const wikiTagsByItem = {}; // name -> Set of tags
  for (const f of tagPages) {
    const tagName = f.replace(/ - He is Coming Official Wiki\.htm$/i, '').trim();
    // Only include item tags we expose in the UI (others won’t be facet-filtered)
    if (!UI_ITEM_TAGS.has(tagName)) continue;
    try {
      const names = parseTagPage(f);
      for (const n of names) {
        const k = normalizeName(n);
        if (!wikiTagsByItem[k]) wikiTagsByItem[k] = new Set();
        wikiTagsByItem[k].add(tagName);
      }
      console.log(`Parsed tag ${tagName}: ${names.length} items`);
    } catch (e) {
      console.warn(`Failed parsing tag page ${f}:`, e.message);
    }
  }

  // Convert sets to arrays for serialization
  const wikiTagsByItemJson = Object.fromEntries(
    Object.entries(wikiTagsByItem).map(([k, v]) => [k, [...v]])
  );
  writeJSON(EXTRACTED_TAGS_PATH, wikiTagsByItemJson);

  // 3) Compare with details.json
  const details = JSON.parse(readText(DETAILS_PATH));
  let overrides = fs.existsSync(OVERRIDES_PATH)
    ? JSON.parse(readText(OVERRIDES_PATH))
    : {};

  const propList = Object.entries(details);
  const nameToKey = new Map();
  for (const [key, val] of propList) {
    if (!val || !val.name) continue;
    nameToKey.set(normalizeName(val.name), key);
  }

  const report = {
    summary: { itemsTotal: propList.length, wikiItems: Object.keys(wikiItems).length },
    mismatches: []
  };

  let overrideChanges = 0;
  let tagChanges = 0;
  let effectChanges = 0;

  function ensureOverride(key, statKey, val) {
    if (!overrides[key]) overrides[key] = {};
    if (overrides[key][statKey] !== val) {
      overrides[key][statKey] = val;
      overrideChanges++;
    }
  }

  for (const [key, val] of propList) {
    if (!val || !val.name) continue;
    const nm = normalizeName(val.name);
    const wiki = wikiItems[nm];
    if (!wiki) continue;

    // Compare stats
    const currentStats = val.stats || { attack: 0, speed: 0, health: 0, armor: 0 };
    const desiredStats = wiki.stats || {};
    const statMismatch = {};
    for (const s of ['attack', 'speed', 'health', 'armor']) {
      const cur = currentStats[s] ?? 0;
      const doc = desiredStats[s] ?? 0;
      if (cur !== doc) {
        statMismatch[s] = { current: cur, wiki: doc };
        // Write to overrides so compiled_details.json will reflect wiki stats
        if (doc !== undefined && doc !== null) ensureOverride(key, s, doc);
      }
    }

    // Tags: compute desired set from wiki tags
    const existingTags = new Set(Array.isArray(val.tags) ? val.tags : []);
    const wikiTagSet = new Set(wikiTagsByItem[nm] || []);
    // Only UI-recognized item tags
    const desiredTags = new Set([...existingTags, ...wikiTagSet]);
    const added = [...desiredTags].filter(t => !existingTags.has(t));
    if (added.length > 0) {
      // Apply to details.json model in-memory
      val.tags = [...desiredTags].sort();
      tagChanges++;
    }

    // Effect text: only fill when placeholder/missing
    const effectText = typeof val.effect === 'string' ? val.effect.trim() : '';
    const wikiEffect = (wiki.effect || '').trim();
    if ((!effectText || effectText === '-' || effectText.toLowerCase() === 'tbd') && wikiEffect) {
      val.effect = wikiEffect;
      effectChanges++;
    }

    // Record in report if anything changed
    if (Object.keys(statMismatch).length || added.length > 0 || (!effectText && wikiEffect)) {
      report.mismatches.push({
        name: nm,
        key,
        stats: statMismatch,
        tags_added: added,
        effect_filled: (!effectText && wikiEffect) ? wikiEffect : undefined
      });
    }
  }

  // Cleanup: remove overrides for keys that don't exist in details
  const validKeys = new Set(Object.keys(details));
  let removedOverrides = 0;
  for (const k of Object.keys(overrides)) {
    if (!validKeys.has(k)) { delete overrides[k]; removedOverrides++; }
  }

  // Write outputs
  writeJSON(REPORT_PATH, {
    ...report,
    changes: { overrideChanges, tagChanges, effectChanges, removedOverrides },
  });

  console.log(`\nAudit complete.`);
  console.log(`- Items parsed from wiki: ${Object.keys(wikiItems).length}`);
  console.log(`- Overrides to write: ${overrideChanges}`);
  console.log(`- Items with tag additions: ${tagChanges}`);
  console.log(`- Items with effect filled: ${effectChanges}`);

  if (APPLY) {
    // Persist overrides and updated details
    writeJSON(OVERRIDES_PATH, overrides);
    writeJSON(DETAILS_PATH, details);
    console.log(`\nApplied changes:`);
    console.log(`- Updated ${path.basename(OVERRIDES_PATH)}`);
    console.log(`- Updated ${path.basename(DETAILS_PATH)}`);
  } else {
    console.log(`\nDry run only. Re-run with --apply or via npm run audit:wiki to save changes.`);
  }
}

main();

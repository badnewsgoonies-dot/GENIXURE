#!/usr/bin/env node
import fs from 'fs';
import { load as cheerioLoad } from 'cheerio';

function readJSON(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJSON(p, obj){ fs.writeFileSync(p, JSON.stringify(obj, null, 2)); }
const norm = s => (s||'').toLowerCase().replace(/\s+/g,' ').trim();
const slugify = s => (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
const toTitleSlug = s => slugify(s).split('_').map(w=>w? w[0].toUpperCase()+w.slice(1):w).join('_');

function parseStatsCell(cellHtml) {
  const iconToStat = {
    'Icon_attack.png': 'attack',
    'Icon_speed.png': 'speed',
    'Icon_health.png': 'health',
    'Icon_armor.png': 'armor'
  };
  const stats = { attack: 0, speed: 0, health: 0, armor: 0 };
  const html = cellHtml;
  const imgRegex = /<img[^>]+src=\"[^\"]*\/(Icon_[a-z]+\.png)\"[^>]*>/gi;
  let m;
  while ((m = imgRegex.exec(html)) !== null) {
    const statKey = iconToStat[m[1]];
    if (!statKey) continue;
    let pos = imgRegex.lastIndex;
    while (pos < html.length) {
      if (html[pos] === '<') { const close = html.indexOf('>', pos); if (close === -1) break; pos = close + 1; continue; }
      if (/\s/.test(html[pos])) { pos++; continue; }
      break;
    }
    const rest = html.slice(pos);
    const num = rest.match(/-?\d+/);
    if (num) { const val = parseInt(num[0], 10); if (!Number.isNaN(val)) stats[statKey] = val; }
  }
  return stats;
}

async function fetchItem(titleSlug){
  const url = `https://wiki.hoodedhorse.com/He_is_Coming/${encodeURI(titleSlug)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerioLoad(html);
  let name = ($('#firstHeading').text() || '').trim();
  if (!name) { const title = ($('title').text() || '').trim(); name = title.replace(/\s*-\s*He is Coming Official Wiki\s*$/i, '').trim(); }
  if (!name) return null;
  const iconSel = 'img[src*="Icon_attack.png"], img[src*="Icon_speed.png"], img[src*="Icon_health.png"], img[src*="Icon_armor.png"]';
  let stats = { attack:0, speed:0, health:0, armor:0 };
  const cand = $(iconSel).first();
  if (cand && cand.length){ const td = cand.closest('td'); const block = td && td.length ? $.html(td) : $.html(cand.parent()); if (block) stats = parseStatsCell(block); }
  else { stats = parseStatsCell(html); }
  if (!Object.values(stats).some(v => (v||0)!==0)) return null;
  return { name, stats };
}

async function main(){
  const details = readJSON('details.json');
  const overrides = fs.existsSync('stats_overrides.json') ? readJSON('stats_overrides.json') : {};
  const wiki = fs.existsSync('wiki_extracted_items.json') ? readJSON('wiki_extracted_items.json') : {};
  const wikiByName = new Map(Object.keys(wiki).map(n=>[norm(n), wiki[n]]));
  let updated = 0, fetched = 0;

  for (const [key, val] of Object.entries(details)){
    if (val.bucket !== 'items' && val.bucket !== 'weapons') continue;
    if (wikiByName.has(norm(val.name))) continue;
    const cands = Array.from(new Set([ toTitleSlug(val.name), toTitleSlug(val.slug||'') ])).filter(Boolean);
    let entry=null;
    for (const c of cands){ try { entry = await fetchItem(c); } catch(_){} if(entry) break; }
    if (!entry) continue;
    wiki[entry.name] = { name: entry.name, stats: entry.stats, effect: wiki[entry.name]?.effect || '' };
    overrides[key] = { attack: entry.stats.attack||0, armor: entry.stats.armor||0, health: entry.stats.health||0, speed: entry.stats.speed||0 };
    updated++; fetched++;
    if (fetched % 10 === 0) console.log(`...fetched ${fetched}`);
  }

  if (updated){
    writeJSON('wiki_extracted_items.json', wiki);
    writeJSON('stats_overrides.json', overrides);
    console.log(`Updated overrides for ${updated} items`);
  } else {
    console.log('No new items fetched.');
  }
}

main().catch(e=>{ console.error('fetch_missing_from_wiki failed:', e.message||e); process.exit(1); });


#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { load as cheerioLoad } from 'cheerio';

const WIKI_DIR = 'wiki_dump';
const DETAILS = 'details.json';

const regionFiles = [
  'Woodland items - He is Coming Official Wiki.htm',
  'Swampland items - He is Coming Official Wiki.htm'
].filter(f => fs.existsSync(path.join(WIKI_DIR, f)));

function read(p){ return fs.readFileSync(p,'utf8'); }
function norm(s){ return (s||'').replace(/\s+/g,' ').replace(/[\u00A0]/g,' ').trim(); }
function capFirst(s){ return s ? s[0].toUpperCase()+s.slice(1) : s; }
function normalizeEffect(e){
  let t = norm(e);
  // strip replacement characters and odd quotes artifacts
  t = t.replace(/[�\uFFFD]/g,'').replace(/\s+"\s*/g,'"');
  t = t.replace(/First Turn/gi, 'First turn')
       .replace(/Battle Start/gi, 'Battle start')
       .replace(/On Hit/gi, 'On hit')
       .replace(/Every other turn/gi, 'Every other turn');
  // compress the long gold/diamond formatting
  t = t.replace(/at Gold\s*:\s*(\d+).*?at Diamond\s*:\s*(\d+)/i, '(Gold $1, Diamond $2)');
  return t;
}

function parseRegionEffects(file){
  const html = read(path.join(WIKI_DIR,file));
  const $ = cheerioLoad(html);
  const map = new Map();
  $('table.wikitable tbody tr').each((_, tr)=>{
    const tds = $(tr).find('td');
    if (tds.length < 5) return;
    const name = norm($(tds[0]).find('a').first().text() || $(tds[0]).text());
    const effectCell = $(tds[3]);
    const effect = normalizeEffect(effectCell.text());
    if (name && effect && effect !== '-' && !/^Woodland|Swampland$/i.test(effect)){
      map.set(name, effect);
    }
  });
  return map;
}

function mergeMaps(...maps){
  const out = new Map();
  for (const m of maps){ m.forEach((v,k)=> out.set(k,v)); }
  return out;
}

async function main(){
  const maps = regionFiles.map(parseRegionEffects);
  const effects = mergeMaps(...maps);
  const details = JSON.parse(read(DETAILS));
  let updated = 0;
  const bad = [];
  for (const [key, val] of Object.entries(details)){
    if (!val || !val.name) continue;
    const eff = norm(val.effect);
    const fromMap = effects.get(val.name);
    if (fromMap && eff !== fromMap) {
      val.effect = fromMap;
      details[key] = val;
      updated++;
    } else if (!fromMap && /Hooded Horse Wikis|Woodland|Swampland|^-$|^$/i.test(eff || '')) {
      bad.push({key, name: val.name});
    }
  }
  if (updated){ fs.writeFileSync(DETAILS, JSON.stringify(details,null,2)); }
  fs.mkdirSync('reports', {recursive:true});
  fs.writeFileSync('reports/fix_effects_from_regions_report.json', JSON.stringify({updated, unresolved: bad.length, unresolvedSample: bad.slice(0,30)}, null, 2));
  console.log(`Region effects applied: ${updated}, unresolved: ${bad.length}`);
}

main().catch(e=>{ console.error('fix_effects_from_regions failed:', e); process.exit(1); });

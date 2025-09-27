#!/usr/bin/env node
import fs from 'fs';
import { load as cheerioLoad } from 'cheerio';

const DETAILS = 'details.json';

const norm = s => (s||'').trim();
const slugify = s => (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
const toTitleSlug = s => slugify(s).split('_').map(w=>w? w[0].toUpperCase()+w.slice(1):w).join('_');

function readJSON(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJSON(p, obj){ fs.writeFileSync(p, JSON.stringify(obj, null, 2)); }

async function fetchHtml(url){
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

function extractEffectFromHtml(html){
  const $ = cheerioLoad(html);
  // 1) Infobox: row labeled Effect
  let effect = '';
  $('table.infobox tr').each((_, tr)=>{
    const th = $(tr).find('th').first().text().trim().toLowerCase();
    if (/^effect$/.test(th)){
      const td = $(tr).find('td').first();
      effect = td.text().replace(/\s+/g,' ').trim();
    }
  });
  if (effect && !/Hooded Horse|Wikis/i.test(effect)) return effect;
  // 2) First paragraph after infobox that looks descriptive
  const paras = $('p').map((_,p)=>$(p).text().replace(/\s+/g,' ').trim()).get();
  const cand = paras.find(t => /Battle|Turn|On hit|Wounded|Exposed|Gain|Lose|Restore|Deal|Armor|Health|Speed/i.test(t) && t.length>10 && !/Hooded Horse|Wikis/i.test(t));
  if (cand) return cand;
  // 3) Fallback: first non-empty paragraph
  const fallback = paras.find(t=>t.length>0 && !/Hooded Horse|Wikis/i.test(t));
  return fallback || '';
}

async function main(){
  const details = readJSON(DETAILS);
  let updated = 0; const failures = [];
  for (const [key, val] of Object.entries(details)){
    if (!val || !val.name) continue;
    // candidates: placeholder effect values
    const eff = norm(val.effect);
    if (eff && eff !== '-' && !/^woodland$/i.test(eff) && !/^swampland$/i.test(eff)) continue;
    const slugTitle = toTitleSlug(val.name);
    const url = `https://wiki.hoodedhorse.com/He_is_Coming/${encodeURI(slugTitle)}`;
    try {
      const html = await fetchHtml(url);
      const effect = extractEffectFromHtml(html);
      if (effect) {
        val.effect = effect;
        details[key] = val;
        updated++;
        console.log(`Updated: ${val.name} -> ${effect}`);
      } else {
        failures.push({key, name: val.name, reason: 'no effect parsed'});
      }
    } catch (e) {
      failures.push({key, name: val.name, reason: e.message});
    }
  }
  if (updated>0){ writeJSON(DETAILS, details); }
  fs.mkdirSync('reports', {recursive:true});
  fs.writeFileSync('reports/fill_effects_from_wiki_report.json', JSON.stringify({updated, failuresCount: failures.length, failures}, null, 2));
  console.log(`Done. Updated ${updated}. Failures ${failures.length}.`);
}

main().catch(e=>{ console.error('fill_effects_from_wiki failed:', e); process.exit(1); });

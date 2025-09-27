#!/usr/bin/env node
import fs from 'fs';

function readJSON(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function normName(s){ return (s||'').replace(/\s+/g,' ').trim().toLowerCase(); }
function slugify(s){ return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,''); }

const details = readJSON('details.json');
const wiki = readJSON('wiki_extracted_items.json');

const wikiByName = new Map(Object.entries(wiki).map(([n,v])=>[normName(n), v]));
const wikiBySlug = new Map(Object.values(wiki).map(v=>[slugify(v.name), v]));

let total=0, matched=0, unmatched=[];
for (const [key, val] of Object.entries(details)){
  total++;
  const nm = normName(val?.name);
  let w = wikiByName.get(nm);
  if (!w) {
    w = wikiBySlug.get(slugify(val?.name)) || wikiBySlug.get(slugify(val?.slug));
  }
  if (w) matched++; else unmatched.push({key, name: val?.name});
}

console.log(JSON.stringify({total, matched, unmatchedCount: unmatched.length}, null, 2));
console.log('Sample unmatched:', unmatched.slice(0,30));


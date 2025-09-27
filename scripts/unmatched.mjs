#!/usr/bin/env node
import fs from 'fs';

const details = JSON.parse(fs.readFileSync('details.json','utf8'));
const wiki = JSON.parse(fs.readFileSync('wiki_extracted_items.json','utf8'));

const norm = s => (s||'').toLowerCase().replace(/\s+/g,' ').trim();
const slug = s => (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');

const wikiByName = new Map(Object.keys(wiki).map(n => [norm(n), wiki[n]]));
const wikiBySlug = new Map(Object.values(wiki).map(v => [slug(v.name), v]));

const unmatched = [];
for (const [k,v] of Object.entries(details)){
  let m = wikiByName.get(norm(v?.name));
  if (!m) m = wikiBySlug.get(slug(v?.name)) || wikiBySlug.get(slug(v?.slug));
  if (!m) unmatched.push({ key: k, bucket: v.bucket });
}
const counts = unmatched.reduce((a,x)=>{ a[x.bucket]=(a[x.bucket]||0)+1; return a; },{});
console.log(JSON.stringify({ total: Object.keys(details).length, unmatched: unmatched.length, counts }, null, 2));
console.log('Sample:', unmatched.slice(0,30));


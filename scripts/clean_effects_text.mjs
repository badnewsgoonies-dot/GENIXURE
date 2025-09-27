#!/usr/bin/env node
import fs from 'fs';

const DETAILS = 'details.json';

function norm(s){ return (s||'').replace(/\s+/g,' ').trim(); }

function cleanEffect(e){
  if (!e) return e;
  let t = e.replace(/[�\uFFFD]/g,'').replace(/\?�\"?/g,'');
  t = t.replace(/\"/g, '');
  t = t.replace(/\s*\(\s*/g,' (').replace(/\s*\)\s*/g, ') ');
  t = t.replace(/\s+,\s*/g, ', ');
  t = t.replace(/\s+"\s*/g, '"');
  t = norm(t).replace(/\)\s+$/,' )');
  return t;
}

function main(){
  const details = JSON.parse(fs.readFileSync(DETAILS,'utf8'));
  let updated = 0;
  for (const [k,v] of Object.entries(details)){
    if (v && typeof v.effect === 'string'){
      const cleaned = cleanEffect(v.effect);
      if (cleaned !== v.effect){ v.effect = cleaned; updated++; }
    }
  }
  if (updated){ fs.writeFileSync(DETAILS, JSON.stringify(details,null,2)); }
  console.log('Cleaned effects:', updated);
}

main();

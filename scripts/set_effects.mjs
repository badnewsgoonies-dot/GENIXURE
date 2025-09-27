#!/usr/bin/env node
import fs from 'fs';

const DETAILS = 'details.json';
const details = JSON.parse(fs.readFileSync(DETAILS,'utf8'));

let updated = 0;

function setEffect(key, text){
  if (details[key]){
    details[key].effect = text;
    updated++;
  }
}

// Fix known bad placeholder strings
for (const [k,v] of Object.entries(details)){
  if (v && typeof v.effect === 'string' && /Hooded Horse|Wikis/i.test(v.effect)){
    v.effect = '-';
    updated++;
  }
}

// Targeted correction for Cracked Whetstone
setEffect('items/cracked_whetstone', 'First turn: Temporarily gain 2 attack (Gold 4, Diamond 8)');

fs.writeFileSync(DETAILS, JSON.stringify(details,null,2));
console.log('Effects updated:', updated);


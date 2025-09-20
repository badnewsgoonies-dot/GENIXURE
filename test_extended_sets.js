#!/usr/bin/env node

const { simulate } = require('./heic_sim.js');

console.log('=== Extended Basilisk Test (Ensuring Hits) ===');
const basiliskExtended = simulate(
  {
    name: 'Basilisk Fighter',
    weapon: 'weapons/basilisk_fang',
    items: ['items/basilisk_scale'],
    stats: { atk: 5 }  // Give more attack to ensure hits
  },
  {
    name: 'Basic Fighter',
    stats: { hp: 20 }  // Give more HP so battle lasts longer
  },
  { seed: 789, maxTurns: 10, includeSummary: false }
);
console.log('Basilisk Extended Battle Log:');
basiliskExtended.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
console.log('');

console.log('=== Weaver Test (Low HP to trigger healing) ===');
const weaverExtended = simulate(
  {
    name: 'Weaver Fighter',
    items: ['items/weaver_armor', 'items/weaver_shield'],
    stats: { hp: 5 }  // Lower HP so healing is more visible
  },
  {
    name: 'Basic Fighter'
  },
  { seed: 456, maxTurns: 5, includeSummary: false }
);
console.log('Weaver Extended Battle Log:');
weaverExtended.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
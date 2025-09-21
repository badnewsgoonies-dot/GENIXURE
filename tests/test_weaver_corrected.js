#!/usr/bin/env node

const { simulate } = require('./heic_sim.js');

console.log('=== Testing Weaver Medallion Set (Corrected) ===');
const weaverResult = simulate(
  {
    name: 'Weaver Fighter',
    items: ['items/weaver_armor', 'items/weaver_shield'],
    stats: { hp: 10 }
  },
  {
    name: 'Basic Fighter'
  },
  { seed: 123, maxTurns: 2, includeSummary: false }
);

console.log('Weaver Medallion Battle Log (should show +5 max health on battle start):');
weaverResult.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
console.log('');
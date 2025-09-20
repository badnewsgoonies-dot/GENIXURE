#!/usr/bin/env node

const { simulate } = require('./heic_sim.js');

console.log('Testing Set Bonuses Implementation...\n');

// Test 1: Iron Chain Set (Chainmail Sword + Chainmail Armor)
console.log('=== Test 1: Iron Chain Set ===');
const ironChainResult = simulate(
  {
    name: 'Iron Chain Fighter',
    weapon: 'weapons/chainmail_sword',
    items: ['items/chainmail_armor']
  },
  {
    name: 'Basic Fighter',
    items: []
  },
  { seed: 123, maxTurns: 1, includeSummary: false }
);
console.log('Iron Chain Battle Log (should show +5 armor on battle start):');
ironChainResult.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
console.log('');

// Test 2: Highborn Set (3 Ring items)
console.log('=== Test 2: Highborn Set ===');
const highbornResult = simulate(
  {
    name: 'Highborn Fighter', 
    items: ['items/bloodstone_ring', 'items/ruby_ring', 'items/sapphire_ring']
  },
  {
    name: 'Basic Fighter',
    items: []
  },
  { seed: 123, maxTurns: 1, includeSummary: false }
);
console.log('Highborn Battle Log (should show Highborn activation):');
highbornResult.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
console.log('');

// Test 3: Ironstone Arrowhead Set (Ironstone Spear + Ironstone Sandals)
console.log('=== Test 3: Ironstone Arrowhead Set ===');
const ironstoneResult = simulate(
  {
    name: 'Ironstone Fighter',
    weapon: 'weapons/ironstone_spear',
    items: ['items/ironstone_sandals']
  },
  {
    name: 'Basic Fighter',
    items: []
  },
  { seed: 123, maxTurns: 5, includeSummary: false }
);
console.log('Ironstone Arrowhead Battle Log (should show +1 armor on hit):');
ironstoneResult.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
console.log('');

// Test 4: Basilisk's Gaze Set (Basilisk Fang + Basilisk Scale)
console.log('=== Test 4: Basilisk\'s Gaze Set ===');
const basiliskResult = simulate(
  {
    name: 'Basilisk Fighter',
    weapon: 'weapons/basilisk_fang',
    items: ['items/basilisk_scale']
  },
  {
    name: 'Basic Fighter',
    items: []
  },
  { seed: 123, maxTurns: 5, includeSummary: false }
);
console.log('Basilisk\'s Gaze Battle Log (should show poison on hit):');
basiliskResult.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
console.log('');

// Test 5: Check active sets detection
console.log('=== Test 5: Active Sets Detection ===');
const { Fighter } = require('./heic_sim.js');
const fighterWithSets = new Fighter({
  name: 'Set Fighter',
  weapon: 'weapons/chainmail_sword',
  items: ['items/chainmail_armor', 'items/bloodstone_ring', 'items/ruby_ring', 'items/sapphire_ring']
});

console.log('Fighter active sets:', fighterWithSets.activeSets?.map(s => s.name) || 'None detected');
console.log('Set effect slugs:', fighterWithSets.setEffectSlugs || 'None');
console.log('');

// Test 6: Weaver Medallion Set (Weaver Armor + Weaver Shield)
console.log('=== Test 6: Weaver Medallion Set ===');
const weaverResult = simulate(
  {
    name: 'Weaver Fighter',
    items: ['items/weaver_armor', 'items/weaver_shield']
  },
  {
    name: 'Basic Fighter',
    items: []
  },
  { seed: 123, maxTurns: 1, includeSummary: false }
);
console.log('Weaver Medallion Battle Log (should restore 5 health on battle start):');
weaverResult.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
console.log('');

console.log('Set bonus testing complete! Check the logs above to verify set effects are activating.');
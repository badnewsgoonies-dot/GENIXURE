#!/usr/bin/env node

const { simulate } = require('./heic_sim.js');

console.log('=== Test Direct Poison Effect ===');

// Let's simulate a direct fight to see if onHit events are firing for sets
const poisonTest = simulate(
  {
    name: 'Test Fighter',
    weapon: 'weapons/basilisk_fang',
    items: ['items/basilisk_scale'],
    stats: { atk: 3 }
  },
  {
    name: 'Target',
    stats: { hp: 15, armor: 0 }
  },
  { seed: 123, maxTurns: 5, includeSummary: false }
);

console.log('Direct poison test log:');
poisonTest.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
console.log('');

// Check if the add_status action is working by testing an item that definitely uses it
console.log('=== Test Existing add_status Effect ===');

const acidTest = simulate(
  {
    name: 'Acid Fighter',
    items: ['items/acid_mutation']  // This should have add_status for acid
  },
  {
    name: 'Target'
  },
  { seed: 123, maxTurns: 2, includeSummary: false }
);

console.log('Acid mutation test log:');
acidTest.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
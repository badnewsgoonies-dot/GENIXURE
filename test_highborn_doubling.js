#!/usr/bin/env node

const { simulate } = require('./heic_sim.js');

console.log('=== Testing Highborn Ring Doubling ===');

// Test with Highborn set (3 rings)
const highbornTest = simulate(
  {
    name: 'Highborn Fighter',
    items: ['items/bloodstone_ring', 'items/ruby_ring', 'items/sapphire_ring']
  },
  {
    name: 'Basic Fighter',
    stats: { hp: 20 }
  },
  { seed: 123, maxTurns: 3, includeSummary: false }
);

console.log('Highborn Test (should show doubled ring effects):');
highbornTest.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
console.log('');

// Test without Highborn for comparison
const normalTest = simulate(
  {
    name: 'Normal Fighter',
    items: ['items/bloodstone_ring'] // Just one ring, no set
  },
  {
    name: 'Basic Fighter',
    stats: { hp: 20 }
  },
  { seed: 123, maxTurns: 3, includeSummary: false }
);

console.log('Normal Test (for comparison, single ring effect):');
normalTest.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
console.log('');
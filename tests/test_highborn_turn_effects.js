#!/usr/bin/env node

const { simulate } = require('./heic_sim.js');

console.log('=== Testing Highborn Ring Doubling with Turn Effects ===');

// Test with Highborn set using rings with turnStart effects
const highbornTest = simulate(
  {
    name: 'Highborn Fighter',
    items: ['items/citrine_earring', 'items/ruby_ring', 'items/sapphire_ring'] // Mix of rings
  },
  {
    name: 'Basic Fighter',
    stats: { hp: 20 }
  },
  { seed: 123, maxTurns: 4, includeSummary: false }
);

console.log('Highborn Test (should show doubled turnStart effects for citrine earring):');
highbornTest.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
console.log('');

// Test without Highborn for comparison
const normalTest = simulate(
  {
    name: 'Normal Fighter',
    items: ['items/citrine_earring'] // Just the earring
  },
  {
    name: 'Basic Fighter',
    stats: { hp: 20 }
  },
  { seed: 123, maxTurns: 4, includeSummary: false }
);

console.log('Normal Test (should show single turnStart effect):');
normalTest.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
console.log('');
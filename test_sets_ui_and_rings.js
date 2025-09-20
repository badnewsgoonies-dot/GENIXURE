#!/usr/bin/env node

const { simulate } = require('./heic_sim.js');

console.log('=== Testing Set Bonuses in Summary and Highborn Ring Effects ===');

// Test 1: Check if sets show up in summary
console.log('--- Test 1: Sets in Summary ---');
const summaryTest = simulate(
  {
    name: 'Test Fighter',
    weapon: 'weapons/chainmail_sword',
    items: ['items/chainmail_armor', 'items/bloodstone_ring', 'items/ruby_ring', 'items/sapphire_ring']
  },
  {
    name: 'Basic Fighter',
    items: []
  },
  { seed: 123, maxTurns: 1, includeSummary: true }
);

console.log('Active sets in summary:');
console.log('Player sets:', summaryTest.summary?.left?.activeSets?.map(s => s.name) || 'None');
console.log('Opponent sets:', summaryTest.summary?.right?.activeSets?.map(s => s.name) || 'None');
console.log('');

// Test 2: Test Highborn ring doubling
console.log('--- Test 2: Highborn Ring Effects ---');
const highbornTest = simulate(
  {
    name: 'Highborn Fighter',
    items: ['items/bloodstone_ring', 'items/ruby_ring', 'items/sapphire_ring'],
    stats: { hp: 10 }
  },
  {
    name: 'Basic Fighter',
    stats: { hp: 15 }
  },
  { seed: 456, maxTurns: 3, includeSummary: true }
);

console.log('Highborn Battle Log (should show ring effects triggering twice):');
highbornTest.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
console.log('');

console.log('Expected: Ring effects should trigger twice due to Highborn set.');
console.log('Player final HP should show multiple ring effect triggers.');
console.log(`Player final HP: ${highbornTest.summary?.left?.hpRemaining || 'Unknown'}`);
console.log(`Player active sets: ${highbornTest.summary?.left?.activeSets?.map(s => s.name).join(', ') || 'None'}`);
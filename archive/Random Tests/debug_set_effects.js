#!/usr/bin/env node

const fs = require('fs');

// Load details.json to check our set entries
const details = JSON.parse(fs.readFileSync('details.json', 'utf8'));

console.log('=== Checking Set Effect Definitions ===');

// Check if our set effects exist in details.json
console.log('sets/basilisk_gaze exists:', !!details['sets/basilisk_gaze']);
if (details['sets/basilisk_gaze']) {
  console.log('Basilisk set effect:', JSON.stringify(details['sets/basilisk_gaze'], null, 2));
}

console.log('');
console.log('sets/iron_chain exists:', !!details['sets/iron_chain']);
if (details['sets/iron_chain']) {
  console.log('Iron Chain set effect:', JSON.stringify(details['sets/iron_chain'], null, 2));
}

console.log('');

// Test the simulator with debugging
const { simulate, Fighter } = require('./heic_sim.js');

// Create a fighter and inspect its set detection
const testFighter = new Fighter({
  name: 'Debug Fighter',
  weapon: 'weapons/basilisk_fang',
  items: ['items/basilisk_scale']
});

console.log('=== Fighter Set Detection Debug ===');
console.log('Active sets detected:', testFighter.activeSets);
console.log('Set effect slugs:', testFighter.setEffectSlugs);
console.log('All items being processed:', [testFighter.weapon, testFighter.weaponEdge, ...testFighter.items, ...testFighter.setEffectSlugs]);

// Check if set effects can be found in HEIC_DETAILS
const DETAILS_SOURCE = global.HEIC_DETAILS || require('./details.json');
console.log('Can find basilisk set in DETAILS_SOURCE:', !!DETAILS_SOURCE['sets/basilisk_gaze']);

if (DETAILS_SOURCE['sets/basilisk_gaze']) {
  console.log('Basilisk set details from DETAILS_SOURCE:', JSON.stringify(DETAILS_SOURCE['sets/basilisk_gaze'], null, 2));
}
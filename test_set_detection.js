#!/usr/bin/env node

const { Fighter } = require('./heic_sim.js');

console.log('Testing Set Detection...\n');

// Test Basilisk set detection
console.log('=== Basilisk Set Detection Test ===');
const basiliskFighter = new Fighter({
  name: 'Basilisk Fighter',
  weapon: 'weapons/basilisk_fang',
  items: ['items/basilisk_scale']
});

console.log('Active sets:', basiliskFighter.activeSets?.map(s => s.name) || 'None');
console.log('Set effect slugs:', basiliskFighter.setEffectSlugs || 'None');
console.log('');

// Test Weaver set detection  
console.log('=== Weaver Set Detection Test ===');
const weaverFighter = new Fighter({
  name: 'Weaver Fighter',
  items: ['items/weaver_armor', 'items/weaver_shield']
});

console.log('Active sets:', weaverFighter.activeSets?.map(s => s.name) || 'None');
console.log('Set effect slugs:', weaverFighter.setEffectSlugs || 'None');
console.log('');

// Test Highborn set detection
console.log('=== Highborn Set Detection Test ===');
const highbornFighter = new Fighter({
  name: 'Highborn Fighter',
  items: ['items/bloodstone_ring', 'items/ruby_ring', 'items/sapphire_ring']
});

console.log('Active sets:', highbornFighter.activeSets?.map(s => s.name) || 'None');
console.log('Set effect slugs:', highbornFighter.setEffectSlugs || 'None');
console.log('');

// Test all slugs being checked
console.log('=== Item Slug Check ===');
const testFighter = new Fighter({
  weapon: 'weapons/basilisk_fang',
  items: ['items/basilisk_scale']
});

const allSlugs = [testFighter.weapon, testFighter.weaponEdge, ...testFighter.items].filter(Boolean);
console.log('All slugs being checked:', allSlugs);

// Test requirement checking
const { computeActive } = require('./heic_sim.js');
console.log('Computed active sets:', computeActive(allSlugs));
const { simulate, Fighter } = require('./heic_sim.js');

console.log('🔍 Simple Riptide→Wounded test with exact HP control');

// Test: Fighter starts with 1 base HP
// With bloody_steak: 1 + 5 = 6 HP total  
// Wounded threshold: Math.floor(6/2) = 3 HP
// After taking explosive_fish damage (2) + riptide (1) = 3 HP remaining → should trigger wounded
const L = { items: ['items/explosive_fish'] };
const R = { 
  stats: { hp: 1, armor: 0, atk: 0, speed: 1 },
  items: ['items/bloody_steak'] // Clear wounded effect
};

const result = simulate(L, R, { 
  maxTurns: 3, 
  includeSummary: false,
  seed: 123
});

console.log('\nBattle log:');
result.log.forEach((entry, index) => {
  console.log(`${index + 1}. ${entry}`);
});

console.log('\n📊 HP Analysis:');
console.log('- Fighter R base: 1 HP + 5 (bloody_steak) = 6 HP total');
console.log('- Wounded threshold: Math.floor(6/2) = 3 HP');
console.log('- After explosive_fish (2) + riptide (1) = 3 HP should trigger wounded');

// Look for wounded triggers
const wounded = result.log.filter(entry => 
  entry.toLowerCase().includes('wounded') ||
  entry.includes('Restore') ||
  entry.includes('gain') && entry.includes('Armor')
);

console.log(`\n🎯 Wounded effects: ${wounded.length}`);
wounded.forEach((entry, index) => {
  console.log(`${index + 1}. ${entry}`);
});
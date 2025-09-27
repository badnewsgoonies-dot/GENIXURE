const { simulate } = require('./heic_sim.js');

console.log('🔍 Testing HP tracking bug...\n');

// Simple test: Left fighter (player) should take damage from right fighter (opponent) 
const result = simulate(
  { stats: { hp: 10, atk: 0, armor: 0, speed: 1 } },  // Player (L): slow, weak
  { stats: { hp: 10, atk: 5, armor: 0, speed: 2 } },  // Opponent (R): fast, strong
  { maxTurns: 5 }
);

console.log('Battle Result:', result.result);
console.log('\nBattle Log:');
result.log.forEach((line, i) => {
  console.log(`${i+1}. ${line}`);
});

console.log('\n🔍 Analysis:');
console.log('- Right fighter should go first (speed 2 > 1)');
console.log('- Right fighter should deal 5 damage to left fighter');  
console.log('- Left fighter HP should go 10 → 5');
console.log('- But the log might show incorrect HP values!');
const { simulate } = require('./heic_sim.js');

console.log('🔧 Testing critical HP/damage tracking fixes...\n');

// Test 1: Basic damage application
console.log('=== TEST 1: Basic Damage ===');
const result1 = simulate(
  { stats: { hp: 10, atk: 5, armor: 0, speed: 2 } },
  { stats: { hp: 10, atk: 0, armor: 0, speed: 1 } },
  { maxTurns: 3 }
);

console.log('Battle Log:');
result1.log.slice(0, 5).forEach((line, i) => {
  console.log(`${i+1}. ${line}`);
});

// Test 2: lose_hp action specifically
console.log('\n=== TEST 2: lose_hp Action Test ===');
// This would test if items with lose_hp effects are working
const result2 = simulate(
  { stats: { hp: 20, atk: 0, armor: 5, speed: 1 } },
  { stats: { hp: 10, atk: 0, armor: 0, speed: 2 } },
  { maxTurns: 3 }
);

console.log('Look for health loss effects in this battle:');
result2.log.forEach((line, i) => {
  if (line.includes('loses') && line.includes('health')) {
    console.log(`${i+1}. ${line}`);
  }
});

console.log('\n🎯 Key fixes applied:');
console.log('✅ Fixed lose_hp: self.health → self.hp');
console.log('✅ Fixed convert_enemy_health_to_armor: other.health → other.hp');  
console.log('✅ Fixed double_attack: self.attack → self.atk');
console.log('✅ Fixed condition checks: other.attack → other.atk');
console.log('✅ Fixed negative attack checks: self.attack → self.atk');

console.log('\n🔍 Testing damage tracking specifically...');
// Create a simple test where we know damage should be applied
const result3 = simulate(
  { stats: { hp: 100, atk: 10, armor: 0, speed: 10 } },
  { stats: { hp: 100, atk: 10, armor: 0, speed: 1 } },
  { maxTurns: 2 }
);

console.log('\nExpected: Fast player hits slow opponent for 10 damage');
console.log('Actual battle:');
result3.log.slice(0, 6).forEach((line, i) => {
  console.log(`${i+1}. ${line}`);
});
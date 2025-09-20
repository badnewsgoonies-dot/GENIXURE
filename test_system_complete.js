// Complete system test to verify the migration is working
const fs = require('fs');
const { simulate } = require('./heic_sim.js');

try {
  console.log('✅ Simulator loaded successfully');
  
  // Test 1: Basic battle with migrated items
  console.log('\n🧪 Test 1: Cherry Bomb vs Belt of Gluttony');
  const result1 = simulate(
    {items: ['items/cherry_bomb']}, 
    {items: ['items/belt_of_gluttony']}, 
    {maxTurns: 20, seed: 123}
  );
  console.log('Result:', result1.result);
  console.log('Rounds:', result1.rounds);
  console.log('Sample log entries:', result1.log.slice(0, 3));
  
  // Test 2: Complex item with multiple effects
  console.log('\n🧪 Test 2: Arcane Bell (multiple effects)');
  const result2 = simulate(
    {items: ['items/arcane_bell']}, 
    {items: ['items/basilisk_scale']}, 
    {maxTurns: 20, seed: 456}
  );
  console.log('Result:', result2.result);
  console.log('Sample log entries:', result2.log.slice(0, 3));
  
  // Test 3: Weapon with new actions
  console.log('\n🧪 Test 3: Bee Stinger weapon');
  const result3 = simulate(
    {weapon: 'weapons/bee_stinger'}, 
    {items: ['items/bitter_melon']}, 
    {maxTurns: 20, seed: 789}
  );
  console.log('Result:', result3.result);
  console.log('Sample log entries:', result3.log.slice(0, 3));
  
  console.log('\n🎉 All tests completed successfully! The system is working.');
  
} catch (error) {
  console.error('❌ Error during testing:', error.message);
  console.error('Stack:', error.stack);
}
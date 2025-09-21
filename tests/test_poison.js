// Simple test for serpent_mask poison application
const { simulate } = require('./heic_sim.js');

console.log('🔍 Testing Serpent Mask Poison Application\n');

try {
  const L = { 
    items: ['items/serpent_mask'], 
    atk: 5  // Use atk to match Fighter constructor
  };
  const R = { 
    items: [],
    hp: 20
  };
  
  const result = simulate(L, R, { maxTurns: 3, seed: 123 });
  console.log('Battle log:');
  result.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
  
  // Look for poison application and damage
  const poisonLines = result.log.filter(line => line.toLowerCase().includes('poison'));
  console.log('\nPoison-related lines:', poisonLines);
  
} catch (e) {
  console.log('❌ Test failed:', e.message);
  console.log(e.stack);
}
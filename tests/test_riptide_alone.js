// Test riptide alone to see the error
const { simulate } = require('./heic_sim.js');

console.log('🔍 Testing Riptide alone\n');

try {
  // Use explosive_fish to give enemy riptide 
  const L = { items: ['items/explosive_fish'] }; // Gives enemy 1 riptide at battle start
  const R = { items: [], hp: 20 }; // High HP to cross 50% threshold
  
  const result = simulate(L, R, { maxTurns: 3, seed: 456 });
  console.log('Battle log:');
  result.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
  
} catch (e) {
  console.log('❌ Test failed:', e.message);
  console.log('Full stack trace:');
  console.log(e.stack);
}
// Simple debug test to understand what's happening with our trigger fixes
const { simulate } = require('./heic_sim.js');

// Test with manual status application to see if our trigger logic works
console.log('🔍 Debug Test: Manual Status Application\n');

// First, let's test if the trigger firing code works at all
console.log('=== Testing Exposed trigger manually ===');

try {
  // Simple test: one fighter strikes the other to get them exposed, then apply acid
  const L = { 
    items: [],
    hp: 10, armor: 10, attack: 10, speed: 2  // High attack to break enemy armor
  };
  const R = { 
    items: [],
    hp: 10, armor: 3, attack: 1, speed: 1   // Has armor to lose
  };
  
  const result = simulate(L, R, { maxTurns: 3, seed: 123 });
  console.log('Battle log:');
  result.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
  
  console.log('\nLooking for exposed triggers...');
  const exposedLines = result.log.filter(line => line.toLowerCase().includes('exposed'));
  console.log('Exposed lines found:', exposedLines);
  
} catch (e) {
  console.log('❌ Manual test failed:', e.message);
  console.log(e.stack);
}

console.log('\n=== Testing basic acid application ===');

try {
  // Test if acid is being applied and processed correctly
  const L = { 
    items: ['items/rusty_ring'],  // Should give enemy 1 acid
    hp: 10, armor: 0, attack: 0, speed: 1   // No attack to avoid confusing regular damage
  };
  const R = { 
    items: ['items/blastcap_armor'], // Has Exposed trigger: Take 5 damage  
    hp: 15, armor: 1, attack: 1, speed: 2   // Only 1+8=9 armor, acid will bring it down
  };
  
  const result = simulate(L, R, { maxTurns: 8, seed: 456 });
  console.log('Battle log:');
  result.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
  
  console.log('\nLooking for status effects...');
  const statusLines = result.log.filter(line => 
    line.toLowerCase().includes('acid') || 
    line.toLowerCase().includes('poison') || 
    line.toLowerCase().includes('armor')
  );
  console.log('Status effect lines:', statusLines);
  
} catch (e) {
  console.log('❌ Acid test failed:', e.message);
  console.log(e.stack);
}
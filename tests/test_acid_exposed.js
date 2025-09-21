const { simulate, Fighter } = require('./heic_sim.js');

console.log('🔍 Testing Acid→Exposed with no combat interference');

// Test: Fighter starts with exactly 1 armor, so acid will make them exposed
const L = { items: ['items/rusty_ring'] }; // Gives enemy 1 acid at battle start
const R = { 
  stats: { hp: 20, armor: 1, atk: 0, speed: 10 }, // High speed to avoid getting hit, 1 armor to be exposed by acid
  items: ['items/impressive_physique'] // Has "Exposed: Stun the enemy for 1 turn" - clear visible effect
};

const result = simulate(L, R, { 
  maxTurns: 6, 
  includeSummary: false,
  seed: 123
});

console.log('\nBattle log:');
result.log.forEach((entry, index) => {
  console.log(`${index + 1}. ${entry}`);
});

console.log('\n📊 Analysis:');
console.log('- Fighter R starts with 1 armor');
console.log('- Acid should reduce armor by 1 at turn start');
console.log('- When armor reaches 0, should trigger Exposed');
console.log('- Impressive Physique "Exposed: Stun the enemy for 1 turn" should fire');

// Look for exposed triggers
const exposed = result.log.filter(entry => 
  (entry.toLowerCase().includes('exposed') || 
   entry.includes('stun') ||
   entry.includes('impressive_physique')) &&
  !entry.includes('loses') // Exclude acid damage messages
);

console.log(`\n🎯 Exposed effects: ${exposed.length}`);
exposed.forEach((entry, index) => {
  console.log(`${index + 1}. ${entry}`);
});
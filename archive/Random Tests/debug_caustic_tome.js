const { simulate } = require('./heic_sim.js');

console.log('🧪 Debugging Caustic Tome specifically...');

// Test Caustic Tome
const result = simulate(
  { items: ['items/caustic_tome'] },
  { items: [] },
  { seed: 123, maxTurns: 50, includeSummary: false }
);

console.log('\n📊 Battle Result:', result.result, 'in', result.rounds, 'rounds');
console.log('\n📜 Full Battle Log:');
result.log.forEach((line, i) => {
  console.log(`${String(i + 1).padStart(2, '0')}. ${line}`);
});

// Check if Caustic Tome action exists in simulator
const fs = require('fs');
const simCode = fs.readFileSync('./heic_sim.js', 'utf8');
console.log('\n🔍 Does countdown_tome_caustic exist in simulator?', simCode.includes('countdown_tome_caustic'));
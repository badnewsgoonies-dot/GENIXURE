const { simulate } = require('./heic_sim.js');

console.log('🧪 Testing Caustic Tome with a fighter that has speed...');

// Test with a speed item
const result = simulate(
  { items: ['items/caustic_tome', 'items/boots_of_sloth'] },  // boots_of_sloth has 10 speed
  { items: [] },
  { seed: 123, maxTurns: 20, includeSummary: false }
);

console.log('\n📊 Battle Result:', result.result, 'in', result.rounds, 'rounds');
console.log('\n📜 Battle Log (looking for acid effects):');
result.log.forEach((line, i) => {
  if (line.includes('acid') || line.includes('Caustic') || line.includes('speed') || line.includes('Turn 15') || line.includes('Turn 16')) {
    console.log(`${String(i + 1).padStart(2, '0')}. ${line}`);
  }
});

// Let's also test the basic countdown on turn 15
console.log('\n🔍 Full log around turn 15-16:');
const relevantLines = result.log.filter((line, i) => 
  line.includes('Turn 14') || line.includes('Turn 15') || line.includes('Turn 16') || 
  line.includes('acid') || line.includes('Caustic')
);
relevantLines.forEach((line, i) => console.log(`${line}`));
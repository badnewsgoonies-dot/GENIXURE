const { simulate, Fighter } = require('./heic_sim.js');

console.log('🔍 Debug: Riptide→Wounded trigger with detailed analysis');

// Create a fighter with 6 HP
const L = { items: ['items/explosive_fish'] };
const R = { 
  stats: { hp: 6, armor: 0, atk: 0, speed: 1 },
  items: ['items/blackbriar_rose'] // This should have wounded trigger effects
};

const result = simulate(L, R, { 
  maxTurns: 5, 
  includeSummary: false,
  seed: 456
});

console.log('\nBattle log:');
result.log.forEach((entry, index) => {
  console.log(`${index + 1}. ${entry}`);
});

// Analyze HP progression
console.log('\n📊 HP Analysis:');
console.log('- Fighter R starts with 6 HP');
console.log('- Should be wounded at 3 HP or less (50% of 6)');

const hpEntries = result.log.filter(entry => entry.includes('OpponentHP:'));
hpEntries.forEach((entry, index) => {
  const match = entry.match(/OpponentHP: (\d+)/);
  if (match) {
    const hp = parseInt(match[1]);
    console.log(`- Turn ${index + 1}: HP = ${hp} ${hp <= 3 ? '← SHOULD TRIGGER WOUNDED!' : ''}`);
  }
});

// Check for wounded-related log entries
const woundedEntries = result.log.filter(entry => 
  entry.toLowerCase().includes('wounded') || entry.includes('onWounded')
);

console.log(`\n🎯 Wounded-related entries: ${woundedEntries.length}`);
woundedEntries.forEach((entry, index) => {
  console.log(`${index + 1}. ${entry}`);
});

// Check if blackbriar_rose has effects that should trigger
console.log('\n🌹 Checking if fighter has wounded-triggerable items...');
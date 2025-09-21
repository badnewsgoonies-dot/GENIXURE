const { simulate, Fighter } = require('./heic_sim.js');

console.log('🔍 Testing Riptide→Wounded trigger');

// Create a custom fighter with low health to ensure Wounded triggers
const playerBuild = {
  customStats: { health: 10, attack: 5, armor: 0, speed: 1 }
};
const opponentBuild = {
  items: ['items/explosive_fish'], // Gives Riptide on hit
  customStats: { health: 20, attack: 3, armor: 0, speed: 1 }
};

const result = simulate(playerBuild, opponentBuild, { 
  maxTurns: 10, 
  includeSummary: false,
  seed: 123
});

console.log('\nBattle log:');
result.log.forEach((entry, index) => {
  console.log(`${index + 1}. ${entry}`);
});

// Check if Wounded trigger fired
const woundedTriggers = result.log.filter(entry => 
  entry.toLowerCase().includes('wounded') && 
  !entry.includes('suffers') // Exclude riptide damage messages
);

console.log(`\n🎯 Wounded triggers found: ${woundedTriggers.length}`);
woundedTriggers.forEach((trigger, index) => {
  console.log(`${index + 1}. ${trigger}`);
});

if (woundedTriggers.length > 0) {
  console.log('✅ Riptide→Wounded trigger is working!');
} else {
  console.log('❌ Riptide→Wounded trigger did not fire');
  
  // Debug: Show riptide damage entries
  const riptideDamage = result.log.filter(entry => 
    entry.includes('riptide damage') || entry.includes('suffers')
  );
  console.log('\n🐟 Riptide damage entries:');
  riptideDamage.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry}`);
  });
}
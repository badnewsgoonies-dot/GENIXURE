const { simulate, Fighter } = require('./heic_sim.js');

console.log('🔍 Testing Riptide→Wounded trigger (ensure wounded happens)');

// Create a fighter with 6 HP so that 1 riptide damage at turn end will make them wounded (3 HP = 50% of 6)
const playerBuild = {
  customStats: { health: 6, attack: 1, armor: 0, speed: 2 }
};
const opponentBuild = {
  items: ['items/explosive_fish'], // Gives Riptide on hit  
  customStats: { health: 20, attack: 1, armor: 0, speed: 1 }
};

const result = simulate(playerBuild, opponentBuild, { 
  maxTurns: 5, 
  includeSummary: false,
  seed: 123
});

console.log('\nBattle log:');
result.log.forEach((entry, index) => {
  console.log(`${index + 1}. ${entry}`);
});

// Check if Wounded trigger fired
const woundedTriggers = result.log.filter(entry => 
  (entry.toLowerCase().includes('wounded') || entry.includes('onWounded')) && 
  !entry.includes('suffers') // Exclude riptide damage messages
);

console.log(`\n🎯 Wounded triggers found: ${woundedTriggers.length}`);
woundedTriggers.forEach((trigger, index) => {
  console.log(`${index + 1}. ${trigger}`);
});

// Check for riptide damage specifically 
const riptideDamage = result.log.filter(entry => 
  entry.includes('riptide damage') 
);

console.log(`\n🐟 Riptide damage entries: ${riptideDamage.length}`);
riptideDamage.forEach((entry, index) => {
  console.log(`${index + 1}. ${entry}`);
});

if (woundedTriggers.length > 0) {
  console.log('✅ Riptide→Wounded trigger is working!');
} else {
  console.log('❌ Riptide→Wounded trigger did not fire');
}

// Let's also check if the player actually got riptide
const riptideGain = result.log.filter(entry => 
  entry.includes('gains') && entry.includes('riptide')
);

console.log(`\n💧 Riptide gained: ${riptideGain.length}`);
riptideGain.forEach((entry, index) => {
  console.log(`${index + 1}. ${entry}`);
});
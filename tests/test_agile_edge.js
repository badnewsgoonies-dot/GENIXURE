// Focused test for Agile Edge functionality
const fs = require('fs');

// Load details.json to simulate browser environment
global.HEIC_DETAILS = JSON.parse(fs.readFileSync('./details.json', 'utf8'));
global.window = { HEIC_DETAILS: global.HEIC_DETAILS };

const { simulate, Fighter } = require('./heic_sim');

console.log("Testing Agile Edge specifically...");

const fighter = new Fighter({
  name: 'EdgeTester',
  stats: { hp: 20, atk: 3, armor: 2 },
  weaponEdge: 'upgrades/agile_edge'
});

const enemy = new Fighter({ 
  name: 'Enemy', 
  stats: { hp: 15, atk: 2, armor: 1 }
});

console.log("Fighter before battle:");
console.log(`  Weapon Edge: ${fighter.weaponEdge}`);
console.log(`  Extra Strikes: ${fighter.extraStrikes}`);

const result = simulate(fighter, enemy, { maxTurns: 3 });

console.log("\nBattle result:", result.result);
console.log("Battle log:");
result.log.forEach((entry, i) => console.log(`  ${i}: ${entry}`));

console.log("\nThis should show the agile edge giving extra strikes at battle start.");
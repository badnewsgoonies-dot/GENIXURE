// Test specific battle scenarios to compare with the game
const { simulate } = require('./heic_sim.js');

console.log("🎮 Testing common battle scenarios to compare with game...\n");

// Test 1: Simple weapon battle
console.log("=== TEST 1: Basic weapon battle ===");
const result1 = simulate(
  { items: [], weapon: 'weapons/sword' },
  { items: [], weapon: 'weapons/dagger' },
  { seed: 123, maxTurns: 20 }
);
console.log(`Result: ${result1.result}, Rounds: ${result1.rounds}`);
console.log("Battle log:");
result1.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));

console.log("\n" + "=".repeat(50) + "\n");

// Test 2: Battle with status effects
console.log("=== TEST 2: Battle with poison/status effects ===");
const result2 = simulate(
  { items: ['items/toxic_flask'] },
  { items: ['items/bloody_steak'] },
  { seed: 456, maxTurns: 20 }
);
console.log(`Result: ${result2.result}, Rounds: ${result2.rounds}`);
console.log("Battle log:");
result2.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));
// Debug weapon loading and basic battle mechanics
const { simulate } = require('./heic_sim.js');

console.log("🔍 Debugging weapon loading and battle mechanics...\n");

// Test with items we know exist
console.log("=== TEST: Known items battle ===");
const result = simulate(
  { items: ['items/cherry_bomb'] },
  { items: ['items/belt_of_gluttony'] },
  { seed: 123, maxTurns: 10 }
);
console.log(`Result: ${result.result}, Rounds: ${result.rounds}`);
console.log("Battle log:");
result.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));

console.log("\n" + "=".repeat(50) + "\n");

// Test attack/speed stats
console.log("=== TEST: Fighter stats ===");
const testResult = simulate(
  { items: ['items/cherry_bomb'] },
  { items: [] },
  { seed: 123, maxTurns: 5, includeSummary: true }
);
console.log("Summary:", testResult.summary);
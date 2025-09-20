// Test battles with correct base stats (0 atk, 0 spd)
const { simulate } = require('./heic_sim.js');

console.log("🎯 Testing with correct base stats (0 atk, 0 speed)...\n");

// Test 1: Empty builds (should be draws with no action)
console.log("=== TEST 1: Empty builds ===");
const result1 = simulate(
  { items: [] },
  { items: [] },
  { seed: 123, maxTurns: 5, includeSummary: true }
);
console.log(`Result: ${result1.result} (${result1.rounds} rounds)`);
console.log("Summary - Left strikes:", `${result1.summary.left.strikesLanded}/${result1.summary.left.strikesAttempted}`);
console.log("Summary - Right strikes:", `${result1.summary.right.strikesLanded}/${result1.summary.right.strikesAttempted}`);

// Test 2: Builds with items that provide stats
console.log("\n=== TEST 2: Builds with attack items ===");
const result2 = simulate(
  { items: ['items/bee_stinger'] }, // This should provide attack: 3
  { items: ['items/belt_of_gluttony'] }, // This provides health
  { seed: 123, maxTurns: 10, includeSummary: true }
);
console.log(`Result: ${result2.result} (${result2.rounds} rounds)`);
console.log("Summary - Left strikes:", `${result2.summary.left.strikesLanded}/${result2.summary.left.strikesAttempted}`);
console.log("Summary - Right strikes:", `${result2.summary.right.strikesLanded}/${result2.summary.right.strikesAttempted}`);

console.log("\nKey battle events:");
result2.log.filter(line => line.includes('hits') || line.includes('gains')).slice(0, 5).forEach((line, i) => {
  console.log(`  ${i + 1}. ${line}`);
});

// Test 3: Build with weapons
console.log("\n=== TEST 3: Build with weapons (if they provide stats) ===");
const result3 = simulate(
  { weapon: 'weapons/bee_stinger', items: [] },
  { items: [] },
  { seed: 123, maxTurns: 10, includeSummary: true }
);
console.log(`Result: ${result3.result} (${result3.rounds} rounds)`);
console.log("Summary - Left strikes:", `${result3.summary.left.strikesLanded}/${result3.summary.left.strikesAttempted}`);
console.log("Summary - Right strikes:", `${result3.summary.right.strikesLanded}/${result3.summary.right.strikesAttempted}`);
// Test to find what base stats fighters should have
const { simulate } = require('./heic_sim.js');

console.log("🔍 Testing base fighter stats...\n");

// Test with empty builds
const result = simulate(
  { items: [], weapon: null },
  { items: [], weapon: null },
  { seed: 123, maxTurns: 5, includeSummary: true }
);

console.log("Empty build battle result:");
console.log(`Result: ${result.result}, Rounds: ${result.rounds}`);
console.log("\nSummary:");
console.log("Left fighter:", result.summary.left);
console.log("Right fighter:", result.summary.right);

console.log("\nBattle log:");
result.log.slice(0, 10).forEach((line, i) => console.log(`${i + 1}. ${line}`));
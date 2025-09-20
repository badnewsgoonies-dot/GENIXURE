// Debug item stat loading
const { simulate } = require('./heic_sim.js');

console.log("🔍 Debugging item stat loading...\n");

// Test fighter creation and stat loading
const fs = require('fs');
const DETAILS = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

console.log("=== Item: bee_stinger stats ===");
const beeStinger = DETAILS['items/bee_stinger'];
console.log("Bee stinger data:", JSON.stringify(beeStinger.stats, null, 2));

console.log("\n=== Creating fighter with bee_stinger ===");

// Simulate a basic battle but with debug logging
const result = simulate(
  { items: ['items/bee_stinger'] }, 
  { items: [] },
  { seed: 123, maxTurns: 3, includeSummary: true }
);

console.log("Battle summary:");
console.log("Left fighter final stats:");
console.log("  HP:", result.summary.left.hpRemaining, "/ max");
console.log("  Strikes:", `${result.summary.left.strikesLanded}/${result.summary.left.strikesAttempted}`);

console.log("\nFull battle log:");
result.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));
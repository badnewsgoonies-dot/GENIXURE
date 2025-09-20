const { simulate } = require('./heic_sim.js');

console.log("Testing Highborn doubling with Thorn Ring (Battle Start effects):\n");

// Thorn Ring: Battle Start: Take 5 damage and gain 10 thorns
// With Highborn active, this should double: Take 10 damage and gain 20 thorns

const test1 = simulate(
    {
        name: "Highborn Fighter",
        items: [
            'items/thorn_ring',     // Battle Start: Take 5 damage and gain 10 thorns
            'items/citrine_ring',   // Battle Start: Gain 1 gold
            'items/gold_ring'       // Battle Start: Gain +1 Gold
        ]
    },
    { name: "Basic Fighter", items: [] },
    { includeSummary: true, seed: 12345, maxTurns: 10 }
);

console.log("=== Test 1: Highborn Fighter with Thorn Ring (should double effects) ===");
console.log("Expected: Should take 10 damage (2x5) and gain 20 thorns (2x10)");
console.log("\nBattle Log:");
test1.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));

console.log("\n" + "=".repeat(80) + "\n");

// Compare with non-Highborn fighter
const test2 = simulate(
    {
        name: "Regular Fighter",
        items: [
            'items/thorn_ring'       // Only 1 ring - no Highborn
        ]
    },
    { name: "Basic Fighter", items: [] },
    { includeSummary: true, seed: 12345, maxTurns: 10 }
);

console.log("=== Test 2: Regular Fighter with Thorn Ring (normal effect) ===");
console.log("Expected: Should take 5 damage and gain 10 thorns");
console.log("\nBattle Log:");
test2.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));

console.log("\n=== Summary ===");
console.log("Test 1 (Highborn) Result:", test1.result, `(${test1.rounds} rounds)`);
console.log("Test 2 (Regular) Result:", test2.result, `(${test2.rounds} rounds)`);

if (test1.summary) {
    console.log("\nHighborn Fighter Sets:", test1.summary.leftSets);
}
if (test2.summary) {
    console.log("Regular Fighter Sets:", test2.summary.leftSets);
}
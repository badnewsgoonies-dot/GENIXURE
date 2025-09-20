const { simulate } = require('./heic_sim.js');

console.log("Testing Highborn doubling with actual Ring items:\n");

// Test 1: Fighter with 3 Ring items (should activate Highborn)
const test1 = simulate(
    {
        name: "Highborn Fighter",
        items: [
            'items/bloodstone_ring',    // Ring tag - Battle Start: Gain 5 max health and restore 5 health
            'items/citrine_ring',       // Ring tag - Battle Start: Gain 1 gold
            'items/ruby_ring'           // Ring tag - Turn Start: Gain 1 attack
        ]
    },
    { name: "Basic Fighter", items: [] },
    { includeSummary: true, seed: 12345, maxTurns: 5 }
);

console.log("=== Test 1: Fighter with 3 Ring items ===");
console.log("Expected: Highborn set activates, ring effects should be doubled");
console.log("\nBattle Log:");
test1.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));
console.log(`\nResult: ${test1.result} (${test1.rounds} rounds)`);
console.log("\nSet Information from Summary:");
if (test1.summary && test1.summary.leftSets) {
    console.log("Left Fighter Sets:", test1.summary.leftSets);
}
if (test1.summary && test1.summary.rightSets) {
    console.log("Right Fighter Sets:", test1.summary.rightSets);
}

console.log("\n" + "=".repeat(80) + "\n");

// Test 2: Same fighter but without enough Ring items to activate Highborn
const test2 = simulate(
    {
        name: "Non-Highborn Fighter",
        items: [
            'items/bloodstone_ring',    // Ring tag
            'items/citrine_ring'        // Ring tag (only 2 rings, need 3 for Highborn)
        ]
    },
    { name: "Basic Fighter", items: [] },
    { includeSummary: true, seed: 12345, maxTurns: 5 }
);

console.log("=== Test 2: Fighter with only 2 Ring items ===");
console.log("Expected: Highborn set does NOT activate, ring effects normal");
console.log("\nBattle Log:");
test2.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));
console.log(`\nResult: ${test2.result} (${test2.rounds} rounds)`);
console.log("\nSet Information from Summary:");
if (test2.summary && test2.summary.leftSets) {
    console.log("Left Fighter Sets:", test2.summary.leftSets);
}
if (test2.summary && test2.summary.rightSets) {
    console.log("Right Fighter Sets:", test2.summary.rightSets);
}
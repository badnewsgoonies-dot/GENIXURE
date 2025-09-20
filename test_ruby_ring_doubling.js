const { simulate } = require('./heic_sim.js');

console.log("Testing Highborn doubling with Ruby Ring (turn-based effect):\n");

// Ruby Ring has: "Turn Start: +1 Attack (Gold: +2, Diamond: +3)"
// With Highborn active, this should double

const test1 = simulate(
    {
        name: "Highborn Fighter",
        items: [
            'items/ruby_ring',      // Turn Start: +1 Attack
            'items/citrine_ring',   // Battle Start: Gain 1 gold
            'items/gold_ring'       // Need 3 rings to activate Highborn
        ]
    },
    { name: "Basic Fighter", items: [] },
    { includeSummary: true, seed: 12345, maxTurns: 10 }
);

console.log("=== Test 1: Highborn Fighter with Ruby Ring (should double attack gain) ===");
console.log("Expected: Turn Start should give +2 attack (doubled from +1)");
console.log("\nBattle Log:");
test1.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));

console.log("\n" + "=".repeat(80) + "\n");

// Compare with non-Highborn fighter
const test2 = simulate(
    {
        name: "Regular Fighter",
        items: [
            'items/ruby_ring'       // Only 1 ring - no Highborn
        ]
    },
    { name: "Basic Fighter", items: [] },
    { includeSummary: true, seed: 12345, maxTurns: 10 }
);

console.log("=== Test 2: Regular Fighter with Ruby Ring (normal effect) ===");
console.log("Expected: Turn Start should give +1 attack (normal)");
console.log("\nBattle Log:");
test2.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));

// Let's also check the final stats
console.log("\n=== Final Stats Comparison ===");
console.log("Test 1 Result:", test1.result, `(${test1.rounds} rounds)`);
console.log("Test 2 Result:", test2.result, `(${test2.rounds} rounds)`);

if (test1.summary) {
    console.log("\nHighborn Fighter Summary:");
    console.log("Sets:", test1.summary.leftSets);
}

if (test2.summary) {
    console.log("\nRegular Fighter Summary:");
    console.log("Sets:", test2.summary.leftSets);
}
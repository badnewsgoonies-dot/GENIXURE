const { simulate } = require('./heic_sim.js');

console.log("Testing Highborn doubling with detailed logging:\n");

// Test with Bloodstone Ring which has clear effects in the new format
const test1 = simulate(
    {
        name: "Highborn Fighter", 
        items: [
            'items/bloodstone_ring',  // Battle Start: Gain 5 max health and restore 5 health  
            'items/citrine_ring',     // Battle Start: Gain 1 gold
            'items/gold_ring'         // Battle Start: Gain +1 Gold
        ]
    },
    { name: "Basic Fighter", items: [] },
    { includeSummary: false, seed: 42, maxTurns: 3 }
);

console.log("=== Highborn Fighter with Bloodstone Ring ===");
console.log("Expected: Should double the health gain effects");
console.log("\nBattle Log:");
test1.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));

console.log("\n" + "=".repeat(80) + "\n");

// Compare with regular fighter
const test2 = simulate(
    {
        name: "Regular Fighter",
        items: ['items/bloodstone_ring']  // Only 1 ring - no Highborn
    },
    { name: "Basic Fighter", items: [] },
    { includeSummary: false, seed: 42, maxTurns: 3 }
);

console.log("=== Regular Fighter with Bloodstone Ring ==="); 
console.log("Expected: Should have normal health gain effects");
console.log("\nBattle Log:");
test2.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));

console.log("\n=== Comparison ===");
console.log(`Highborn Fighter starting HP: Look for messages about gaining max health`);
console.log(`Regular Fighter starting HP: Should have different values if doubling works`);
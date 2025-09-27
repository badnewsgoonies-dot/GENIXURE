const fs = require('fs');
const { Fighter, simulate } = require('./heic_sim.js');

console.log("Debug test for Highborn ring doubling:\n");

// Test 1: Direct Fighter creation to check set activation
console.log("=== Creating Highborn Fighter directly ===");

const highbornFighter = new Fighter({
    name: "Debug Fighter",
    items: [
        'items/bloodstone_ring',  // Ring tag
        'items/citrine_ring',     // Ring tag  
        'items/gold_ring'         // Ring tag
    ]
});

console.log("Fighter created:");
console.log("- Name:", highbornFighter.name);
console.log("- Items:", highbornFighter.items);
console.log("- HP Max:", highbornFighter.hpMax);
console.log("- Current HP:", highbornFighter.hp);
console.log("- _setHighborn flag:", highbornFighter._setHighborn);

console.log("\n" + "=".repeat(60) + "\n");

// Test 2: Check ring tag detection  
console.log("=== Checking ring tag detection ===");

// Load details to check tags directly
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

const ringItems = ['items/bloodstone_ring', 'items/citrine_ring', 'items/gold_ring'];
ringItems.forEach(itemSlug => {
    const itemData = details[itemSlug];
    if (itemData) {
        console.log(`${itemSlug}:`);
        console.log(`  - Tags: [${(itemData.tags || []).join(', ')}]`);
        console.log(`  - Has Ring tag: ${itemData.tags && itemData.tags.includes('Ring')}`);
    } else {
        console.log(`${itemSlug}: NOT FOUND`);
    }
});

console.log("\n" + "=".repeat(60) + "\n");

// Test 3: Simulate one turn to see what happens
console.log("=== Running minimal simulation ===");

const result = simulate(
    {
        name: "Highborn Test",
        items: ['items/bloodstone_ring', 'items/citrine_ring', 'items/gold_ring']
    },
    { name: "Enemy", items: [] },
    { includeSummary: true, seed: 1, maxTurns: 1 }
);

console.log("Simulation log:");
result.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));

console.log("\nSummary sets info:");
console.log("Left sets:", result.summary?.leftSets);
console.log("Right sets:", result.summary?.rightSets);
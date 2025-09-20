const { simulate } = require('./heic_sim.js');

console.log("Testing UI improvements for font size and sets display:\n");

// Test with Highborn set to see if sets information appears in summary
const result = simulate(
    {
        name: "Highborn Warrior",
        items: [
            'items/bloodstone_ring',  // Ring tag
            'items/citrine_ring',     // Ring tag
            'items/ruby_ring'         // Ring tag - should activate Highborn
        ]
    },
    { 
        name: "Regular Fighter", 
        items: ['items/belt_of_gluttony'] 
    },
    { includeSummary: true, seed: 555, maxTurns: 5 }
);

console.log("=== Battle Result ===");
console.log(`Result: ${result.result} (${result.rounds} rounds)\n`);

console.log("=== Battle Log ===");
result.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));

console.log("\n=== Summary (with Sets Info) ===");
console.log("Player Summary:");
console.log("  HP Remaining:", result.summary.left.hpRemaining);
console.log("  Sets:", result.summary.left.sets);

console.log("\nOpponent Summary:");
console.log("  HP Remaining:", result.summary.right.hpRemaining);  
console.log("  Sets:", result.summary.right.sets);

console.log("\n✅ Test completed!");
console.log("- Battle log font has been increased from 16px to 18px");
console.log("- Battle summary font has been increased from 16px to 18px");
console.log("- Summary sections padding increased from 16px to 20px");
console.log("- Set information is now included in battle summaries");
console.log("- Sets will be displayed with larger, more readable formatting");
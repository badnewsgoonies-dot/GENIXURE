// Debug test for newly migrated items
const fs = require('fs');
const path = require('path');

// Load the simulation module and data
const simPath = path.join(__dirname, 'heic_sim.js');
const simCode = fs.readFileSync(simPath, 'utf8');
const detailsPath = path.join(__dirname, 'details.js');
const detailsCode = fs.readFileSync(detailsPath, 'utf8');

global.window = global;
eval(detailsCode);
eval(simCode);

console.log("Debug testing newly migrated items...");

// Check if the effects are properly loaded
console.log("\n=== Checking loaded effects ===");
console.log("Cherry Blade effects:", JSON.stringify(window.HEIC_DETAILS['weapons/cherry_blade']?.effects, null, 2));
console.log("Arcane Shield effects:", JSON.stringify(window.HEIC_DETAILS['items/arcane_shield']?.effects, null, 2));
console.log("Granite Thorns effects:", JSON.stringify(window.HEIC_DETAILS['items/granite_thorns']?.effects, null, 2));

// Test simple battleStart event
console.log("\n=== Test: Simple battleStart event ===");
const left = {
    name: 'Test Fighter',
    stats: { hp: 20, atk: 3, armor: 0, speed: 3 },
    weapon: 'weapons/cherry_blade',
    items: []
};

// Give exposed status
left.statuses = { exposed: 1 };

const right = {
    name: 'Target',
    stats: { hp: 15, atk: 2, armor: 0, speed: 1 },
    items: []
};

console.log("Before battle - Left speed:", left.speed);
console.log("Before battle - Left exposed:", left.statuses?.exposed);

const result = global.HeICSim.simulate(left, right, { maxTurns: 3 });
console.log("Full battle log:");
result.log.forEach((entry, i) => {
    if (i < 10) console.log(`  ${i}: ${entry}`);
});
// Test script for newly migrated items
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

console.log("Testing newly migrated items...");

// Test 1: Cherry Blade - should damage if exposed and reduce speed
console.log("\n=== Test 1: Cherry Blade (exposed damage + speed reduction) ===");
const left1 = {
    name: 'Cherry Fighter',
    stats: { hp: 20, atk: 3, armor: 0, speed: 3 },
    weapon: 'weapons/cherry_blade',
    items: []
};

// Give the cherry fighter exposed status to test the damage
left1.statuses = { exposed: 1 };

const right1 = {
    name: 'Target',
    stats: { hp: 15, atk: 2, armor: 0, speed: 1 },
    items: []
};

const result1 = global.HeICSim.simulate(left1, right1, { maxTurns: 8 });
console.log(`Result: ${result1.result} after ${result1.rounds} rounds`);
console.log("Look for exposed damage and speed reduction:");
const cherryLogs = result1.log.filter(entry => 
    entry.includes('damage') || entry.includes('speed') || entry.includes('Cherry')
);
cherryLogs.slice(0, 5).forEach(entry => console.log("  " + entry));

// Test 2: Arcane Shield - should gain armor on countdown trigger
console.log("\n=== Test 2: Arcane Shield (armor on countdown) ===");
const left2 = {
    name: 'Shield Fighter',
    stats: { hp: 25, atk: 2, armor: 0, speed: 1 },
    items: ['items/arcane_shield', 'items/holy_tome'] // Tome provides countdown
};

const right2 = {
    name: 'Enemy',
    stats: { hp: 25, atk: 2, armor: 0, speed: 1 },
    items: []
};

const result2 = global.HeICSim.simulate(left2, right2, { maxTurns: 15 });
console.log(`Result: ${result2.result} after ${result2.rounds} rounds`);
console.log("Look for countdown triggers and armor gains:");
const shieldLogs = result2.log.filter(entry => 
    entry.includes('armor') || entry.includes('countdown') || entry.includes('Shield')
);
shieldLogs.slice(0, 8).forEach(entry => console.log("  " + entry));

// Test 3: Granite Thorns - should preserve thorns for first 3 strikes
console.log("\n=== Test 3: Granite Thorns (thorns preservation) ===");
const left3 = {
    name: 'Granite Fighter',
    stats: { hp: 25, atk: 2, armor: 0, speed: 1 },
    items: ['items/granite_thorns']
};

left3.statuses = { thorns: 5 }; // Start with some thorns

const right3 = {
    name: 'Striker',
    stats: { hp: 25, atk: 3, armor: 0, speed: 2 }, // Faster, will hit first
    items: []
};

const result3 = global.HeICSim.simulate(left3, right3, { maxTurns: 10 });
console.log(`Result: ${result3.result} after ${result3.rounds} rounds`);
console.log("Look for thorns preservation flag setting:");
const thornsLogs = result3.log.filter(entry => 
    entry.includes('thorns') || entry.includes('preserve') || entry.includes('Granite')
);
thornsLogs.slice(0, 5).forEach(entry => console.log("  " + entry));

console.log("\n🎉 All newly migrated item tests completed!");
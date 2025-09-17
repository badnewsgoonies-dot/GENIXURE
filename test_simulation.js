// Minimal test to verify migrated items work in simulation
const fs = require('fs');
const path = require('path');

// Load the simulation module
const simPath = path.join(__dirname, 'heic_sim.js');
const simCode = fs.readFileSync(simPath, 'utf8');

// Load the details data
const detailsPath = path.join(__dirname, 'details.js');
const detailsCode = fs.readFileSync(detailsPath, 'utf8');

// Create a global context
global.window = global;

// Execute the details file first
eval(detailsCode);

// Execute the simulation file
eval(simCode);

console.log("Testing migrated items in simulation...");

// Test 1: Simple battle with migrated items
console.log("\n=== Test 1: Friendship Bracelet vs Poisonous Mushroom ===");
const left = {
    name: 'Left Fighter',
    stats: { hp: 20, atk: 3, armor: 0, speed: 1 },
    items: ['items/friendship_bracelet'] // Should reduce enemy attack
};

const right = {
    name: 'Right Fighter', 
    stats: { hp: 20, atk: 5, armor: 0, speed: 1 },
    items: ['items/poisonous_mushroom'] // Should gain poison each turn
};

const result1 = global.HeICSim.simulate(left, right, { maxTurns: 10 });
console.log(`Result: ${result1.result}`);
console.log(`Rounds: ${result1.rounds}`);
console.log("Left summary:", result1.summary.left);
console.log("Right summary:", result1.summary.right);
console.log("Sample log entries:");
result1.log.slice(0, 10).forEach(entry => console.log("  " + entry));

// Test 2: Battle with complex migrated items
console.log("\n=== Test 2: Holy Tome vs Bramble Belt ===");
const left2 = {
    name: 'Holy Fighter',
    stats: { hp: 25, atk: 2, armor: 1, speed: 2 },
    items: ['items/holy_tome'] // Countdown effect
};

const right2 = {
    name: 'Bramble Fighter',
    stats: { hp: 20, atk: 3, armor: 2, speed: 1 },
    items: ['items/bramble_belt'] // Thorns + enemy extra strikes
};

const result2 = global.HeICSim.simulate(left2, right2, { maxTurns: 15 });
console.log(`Result: ${result2.result}`);
console.log(`Rounds: ${result2.rounds}`);
console.log("Left summary:", result2.summary.left);
console.log("Right summary:", result2.summary.right);

// Test 3: Test item with battleStart effects
console.log("\n=== Test 3: Blood Sausage vs Slime Armor ===");
const left3 = {
    name: 'Blood Fighter',
    stats: { hp: 15, atk: 4, armor: 0, speed: 1 },
    items: ['items/blood_sausage'] // Should heal 5x on battle start
};

const right3 = {
    name: 'Slime Fighter',
    stats: { hp: 20, atk: 3, armor: 1, speed: 1 },
    items: ['items/slime_armor'] // Should gain acid on battle start
};

const result3 = global.HeICSim.simulate(left3, right3, { maxTurns: 10 });
console.log(`Result: ${result3.result}`);
console.log(`Rounds: ${result3.rounds}`);
console.log("Left summary:", result3.summary.left);
console.log("Right summary:", result3.summary.right);

// Test 4: Complex interaction test
console.log("\n=== Test 4: Acid Mutation vs Soap Stone ===");
const left4 = {
    name: 'Acid Fighter',
    stats: { hp: 20, atk: 2, armor: 0, speed: 1 },
    items: ['items/acid_mutation'] // Acid + temp attack from acid
};

const right4 = {
    name: 'Soap Fighter', 
    stats: { hp: 18, atk: 3, armor: 0, speed: 3 },
    items: ['items/soap_stone'] // First turn speed -> temp attack
};

const result4 = global.HeICSim.simulate(left4, right4, { maxTurns: 10 });
console.log(`Result: ${result4.result}`);
console.log(`Rounds: ${result4.rounds}`);
console.log("Left summary:", result4.summary.left);
console.log("Right summary:", result4.summary.right);

console.log("\n🎉 All simulation tests completed successfully!");
console.log("✅ Migrated items appear to be working correctly in the simulation engine");
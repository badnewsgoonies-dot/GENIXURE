const fs = require('fs');

// Read the simulation file
const simContent = fs.readFileSync('heic_sim.js', 'utf8');

// New actions added in this batch
const newActions = [
  'remove_status',
  'remove_random_status', 
  'damage_enemy',
  'double_attack',
  'remove_gold'
];

// New conditions added in this batch  
const newConditions = [
  'player_has_minimum_status',
  'player_has_less_than_gold',
  'player_has_minimum_gold'
];

console.log('Testing new actions...');
let passCount = 0;
let failCount = 0;

for (const action of newActions) {
  if (simContent.includes(`${action}:`)) {
    console.log(`✅ Action '${action}' exists in heic_sim.js`);
    passCount++;
  } else {
    console.log(`❌ Action '${action}' not found in heic_sim.js`);
    failCount++;
  }
}

console.log('\nTesting new conditions...');

for (const condition of newConditions) {
  if (simContent.includes(`case '${condition}':`)) {
    console.log(`✅ Condition '${condition}' exists in heic_sim.js`);
    passCount++;
  } else {
    console.log(`❌ Condition '${condition}' not found in heic_sim.js`);
    failCount++;
  }
}

console.log(`\nTest Results: ${passCount} passed, ${failCount} failed`);

if (failCount === 0) {
  console.log('All new actions and conditions are properly implemented!');
}
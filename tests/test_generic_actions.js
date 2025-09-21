const fs = require('fs');

console.log('=== Testing Generic Action Definitions ===');

// Load the simulator file content
const simContent = fs.readFileSync('heic_sim.js', 'utf8');

// Test that all new generic actions are defined
const requiredActions = [
  'gain_stat:',
  'lose_stat:',
  'gain_status:',
  'convert_stat_to_status:',
  'convert_status_to_stat:',
  'give_enemy_status_equal_to_stat:'
];

console.log('\n--- Checking Generic Action Definitions ---');
let allFound = true;
for (const action of requiredActions) {
  if (simContent.includes(action)) {
    console.log('✅', action.replace(':', ''), 'is defined');
  } else {
    console.log('❌', action.replace(':', ''), 'is NOT defined');
    allFound = false;
  }
}

// Test that legacy actions are still there with comments
const legacyActions = [
  'add_armor:',
  'add_attack:',
  'add_speed:',
  'gain_thorns:',
  'gain_poison:',
  'convert_armor_to_thorns:',
  'convert_acid_to_attack:',
  'give_enemy_acid_equal_to_speed:'
];

console.log('\n--- Checking Legacy Actions (backward compatibility) ---');
for (const action of legacyActions) {
  if (simContent.includes(action)) {
    console.log('✅', action.replace(':', ''), 'is still defined');
  } else {
    console.log('❌', action.replace(':', ''), 'is MISSING');
    allFound = false;
  }
}

// Check that LEGACY comments were added
const legacyComments = simContent.match(/\/\/ LEGACY.*use.*instead/gi) || [];
console.log(`\n--- Legacy Action Comments ---`);
console.log(`Found ${legacyComments.length} legacy action comments`);

if (allFound) {
  console.log('\n✅ All action definitions found successfully!');
  console.log('✅ Backward compatibility maintained!');
  console.log('✅ Generic actions ready for use!');
} else {
  console.log('\n❌ Some actions are missing!');
  process.exit(1);
}

// Show example usage patterns
console.log('\n--- Example Usage Patterns ---');
console.log('Old way: { "action": "add_armor", "value": 3 }');
console.log('New way: { "action": "gain_stat", "stat": "armor", "value": 3 }');
console.log('');
console.log('Old way: { "action": "gain_thorns", "value": 2 }');
console.log('New way: { "action": "gain_status", "status": "thorns", "value": 2 }');
console.log('');
console.log('Old way: { "action": "convert_armor_to_thorns", "value": 1 }');
console.log('New way: { "action": "convert_stat_to_status", "fromStat": "armor", "toStatus": "thorns", "value": 1, "multiplier": 2 }');
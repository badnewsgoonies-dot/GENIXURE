// Test the Turn Start effects in a simulation
const fs = require('fs');

console.log('=== Testing Turn Start Effects in Simulation ===\n');

// Load and parse details
const details = JSON.parse(fs.readFileSync('details.json', 'utf8'));

// Test Arcane Wand
console.log('--- Testing Arcane Wand ---');
const arcaneWandData = details['weapons/arcane_wand'];
console.log('✅ Arcane Wand effect data:', JSON.stringify(arcaneWandData.effects, null, 2));

console.log('\n--- Testing Bubblegloop Staff ---');
const staffData = details['weapons/bubblegloop_staff'];
console.log('✅ Bubblegloop Staff effect data:', JSON.stringify(staffData.effects, null, 2));

console.log('\n--- Testing Lightning Rod ---');
const rodData = details['weapons/lightning_rod'];
console.log('✅ Lightning Rod effect data:', JSON.stringify(rodData.effects, null, 2));

console.log('\n--- Testing Lightning Whip ---');
const whipData = details['weapons/lightning_whip'];
console.log('✅ Lightning Whip effect data:', JSON.stringify(whipData.effects, null, 2));

// Check if heic_sim.js contains the required action functions
console.log('\n--- Checking Simulator Actions ---');
const simCode = fs.readFileSync('heic_sim.js', 'utf8');

const requiredActions = [
  'deal_damage_per_tome',
  'spend_speed', 
  'give_enemy_status',
  'add_attack',
  'gain_strikes'
];

requiredActions.forEach(action => {
  if (simCode.includes(`${action}:`)) {
    console.log(`✅ ${action} action found in simulator`);
  } else {
    console.log(`❌ ${action} action NOT found in simulator`);
  }
});

// Check trigger support
console.log('\n--- Checking Trigger Support ---');
const requiredTriggers = ['turn_start', 'turnStart', 'strike_skipped'];

requiredTriggers.forEach(trigger => {
  if (simCode.includes(trigger)) {
    console.log(`✅ ${trigger} trigger found in simulator`);
  } else {
    console.log(`❌ ${trigger} trigger NOT found in simulator`);
  }
});

console.log('\n=== Test Complete ===');
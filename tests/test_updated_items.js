const fs = require('fs');

console.log('=== Testing Updated Items with New Generic Actions ===');

// Load the data
const data = JSON.parse(fs.readFileSync('details.json', 'utf8'));

// Test some of the items we updated
const testItems = [
  'items/bramble_buckler', // convert_stat_to_status 
  'items/elderwood_necklace', // multiple gain_stat
  'items/acidic_witherleaf', // give_enemy_status_equal_to_stat
  'items/horned_helmet', // gain_status
  'items/slime_booster' // convert_status_to_stat
];

console.log('\n--- Testing Converted Items ---');
for (const itemKey of testItems) {
  const item = data[itemKey];
  if (item && item.effects) {
    console.log(`\n✅ ${item.name}:`);
    console.log(`   Effect: ${item.effect}`);
    console.log('   Actions:');
    for (const effect of item.effects) {
      if (effect.action === 'gain_stat') {
        console.log(`   - gain_stat: ${effect.stat} +${effect.value}`);
      } else if (effect.action === 'gain_status') {
        console.log(`   - gain_status: ${effect.status} +${effect.value}`);
      } else if (effect.action === 'convert_stat_to_status') {
        console.log(`   - convert_stat_to_status: ${effect.fromStat} -> ${effect.toStatus} (x${effect.multiplier})`);
      } else if (effect.action === 'convert_status_to_stat') {
        console.log(`   - convert_status_to_stat: ${effect.fromStatus} -> ${effect.toStat} (x${effect.multiplier})`);
      } else if (effect.action === 'give_enemy_status_equal_to_stat') {
        console.log(`   - give_enemy_status_equal_to_stat: ${effect.status} = ${effect.stat}`);
      } else {
        console.log(`   - ${effect.action}: ${JSON.stringify(effect)}`);
      }
    }
  }
}

// Check how many items are now using new generic actions
console.log('\n--- Generic Action Usage Summary ---');
let genericActionCount = 0;
let totalActionCount = 0;
const actionCounts = {};

for (const [key, item] of Object.entries(data)) {
  if (item.effects) {
    for (const effect of item.effects) {
      totalActionCount++;
      actionCounts[effect.action] = (actionCounts[effect.action] || 0) + 1;
      
      if (['gain_stat', 'lose_stat', 'gain_status', 'convert_stat_to_status', 'convert_status_to_stat', 'give_enemy_status_equal_to_stat'].includes(effect.action)) {
        genericActionCount++;
      }
    }
  }
}

console.log(`Generic actions: ${genericActionCount}/${totalActionCount} (${Math.round(genericActionCount/totalActionCount*100)}%)`);

console.log('\nTop action types:');
const sortedActions = Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
for (const [action, count] of sortedActions) {
  const isGeneric = ['gain_stat', 'lose_stat', 'gain_status', 'convert_stat_to_status', 'convert_status_to_stat', 'give_enemy_status_equal_to_stat'].includes(action);
  const marker = isGeneric ? '🎯' : '  ';
  console.log(`${marker} ${action}: ${count}`);
}

console.log('\n✅ Validation complete!');
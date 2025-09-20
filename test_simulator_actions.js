// Test the simulator with items that use our newly added action types
const fs = require('fs');

// Load details to test specific items
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

// Simulate loading the EFFECT_ACTIONS by reading the updated simulator file
const simCode = fs.readFileSync('./heic_sim.js', 'utf8');

// Extract EFFECT_ACTIONS from the code (simple regex to find action names)
const actionMatches = simCode.match(/(\w+):\s*\(\{\s*self,\s*log/g) || [];
const supportedActions = new Set();
actionMatches.forEach(match => {
  const actionName = match.split(':')[0].trim();
  supportedActions.add(actionName);
});

console.log(`Found ${supportedActions.size} supported action types in simulator`);

// Test a few items that had "Unknown action" issues  
const testItems = [
  'items/acid_mutation',        // Uses add_status
  'items/arcane_bell',         // Uses gain_armor  
  'items/basilisk_scale',      // Uses gain_attack_equal_to_speed
  'items/bee_stinger',         // Uses add_status_to_enemy
  'items/bitter_melon',        // Uses heal_to_full
  'items/blood_chain',         // Uses convert_health_to_armor
  'items/cherry_bomb',         // Uses deal_damage_multiple_times
  'items/cold_resistance'      // Uses remove_status
];

console.log('🧪 Testing Simulator with Previously Problematic Items');
console.log('=' * 60);

testItems.forEach(itemKey => {
  const item = details[itemKey];
  if (!item) {
    console.log(`❌ Item ${itemKey} not found in details.json`);
    return;
  }
  
  console.log(`\n🔍 Testing: ${item.name}`);
  
  if (item.effects && Array.isArray(item.effects)) {
    item.effects.forEach((effect, index) => {
      console.log(`  Effect ${index + 1}: ${effect.trigger}`);
      if (effect.actions && Array.isArray(effect.actions)) {
        effect.actions.forEach((action, actionIndex) => {
          const actionType = action.type;
          console.log(`    Action ${actionIndex + 1}: ${actionType} ${action.value ? `(${action.value})` : ''}`);
          
          // Check if this action is defined in our simulator
          if (supportedActions.has(actionType)) {
            console.log(`    ✅ Action '${actionType}' is supported`);
          } else {
            console.log(`    ❌ Action '${actionType}' NOT SUPPORTED`);
          }
        });
      }
    });
  } else {
    console.log('  No effects found');
  }
});

console.log('\n📊 Summary');
console.log('If all actions show ✅ supported, then the "Unknown action" errors should be resolved!');
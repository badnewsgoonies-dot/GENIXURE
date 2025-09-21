const fs = require('fs');

// Load the simulator code
const simCode = fs.readFileSync('./heic_sim.js', 'utf8');

// Load our list of expected action types
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

// Collect all action types used in our migrated effects
const actionTypes = new Set();
for (const [key, item] of Object.entries(details)) {
  if (item.effects && Array.isArray(item.effects)) {
    item.effects.forEach(effect => {
      if (effect.actions && Array.isArray(effect.actions)) {
        effect.actions.forEach(action => {
          if (action.type) {
            actionTypes.add(action.type);
          }
        });
      }
    });
  }
}

console.log(`📋 Found ${actionTypes.size} unique action types in migrated effects`);

// Check each action type in the simulator
const sortedTypes = Array.from(actionTypes).sort();
const supported = [];
const missing = [];

sortedTypes.forEach(actionType => {
  // Check if this action type is defined in the simulator
  const regex = new RegExp(`\\b${actionType}\\s*:\\s*\\(`, 'g');
  if (regex.test(simCode)) {
    supported.push(actionType);
  } else {
    missing.push(actionType);
  }
});

console.log(`\n✅ Supported: ${supported.length} action types`);
console.log(`❌ Missing: ${missing.length} action types`);

if (missing.length > 0) {
  console.log('\n❌ Missing Action Types:');
  missing.forEach(action => console.log(`  - ${action}`));
} else {
  console.log('\n🎉 All action types are supported in the simulator!');
  console.log('The "Unknown action: undefined" errors should be completely resolved.');
}

// Test a few specific problematic items
console.log('\n🧪 Testing Key Items:');
const keyItems = [
  'items/cherry_bomb',
  'items/basilisk_scale', 
  'items/arcane_bell',
  'items/bitter_melon'
];

keyItems.forEach(itemKey => {
  const item = details[itemKey];
  if (item && item.effects) {
    console.log(`\n🔍 ${item.name}:`);
    item.effects.forEach((effect, i) => {
      if (effect.actions) {
        effect.actions.forEach((action, j) => {
          const isSupported = supported.includes(action.type);
          console.log(`  Effect ${i+1} Action ${j+1}: ${action.type} ${isSupported ? '✅' : '❌'}`);
        });
      }
    });
  }
});
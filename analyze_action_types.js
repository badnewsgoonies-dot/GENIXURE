const fs = require('fs');

// Load the details.json file to analyze what action types we use
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

console.log("📊 All Action Types Used in Migrated Effects:");
console.log("=" * 50);

const sortedTypes = Array.from(actionTypes).sort();
sortedTypes.forEach((type, index) => {
  console.log(`${index + 1}. ${type}`);
});

console.log(`\n📈 Total unique action types: ${sortedTypes.length}`);

// Group by common patterns
const categories = {
  gain: sortedTypes.filter(t => t.includes('gain') || t.includes('Gain')),
  give: sortedTypes.filter(t => t.includes('give') || t.includes('Give')),  
  add: sortedTypes.filter(t => t.includes('add') || t.includes('Add')),
  reduce: sortedTypes.filter(t => t.includes('reduce') || t.includes('Reduce')),
  heal: sortedTypes.filter(t => t.includes('heal') || t.includes('Heal')),
  status: sortedTypes.filter(t => t.includes('Status')),
  enemy: sortedTypes.filter(t => t.includes('Enemy')),
  attack: sortedTypes.filter(t => t.includes('attack') || t.includes('Attack')),
  custom: sortedTypes.filter(t => t.includes('custom') || t.includes('Custom')),
  special: sortedTypes.filter(t => 
    !t.includes('gain') && !t.includes('give') && !t.includes('add') && 
    !t.includes('reduce') && !t.includes('heal') && !t.includes('Status') &&
    !t.includes('Enemy') && !t.includes('attack') && !t.includes('custom')
  )
};

console.log(`\n📋 Categories:`);
for (const [cat, types] of Object.entries(categories)) {
  if (types.length > 0) {
    console.log(`${cat}: ${types.length} types`);
    types.forEach(t => console.log(`  - ${t}`));
  }
}
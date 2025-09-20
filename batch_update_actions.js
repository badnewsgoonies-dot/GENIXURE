const fs = require('fs');

console.log('=== Batch updating remaining old actions ===');

// Read the current file
let content = fs.readFileSync('details.json', 'utf8');
let data = JSON.parse(content);

const replacements = [
  // Simple add_armor -> gain_stat with stat="armor"
  { old: '"action": "add_armor"', new: '"action": "gain_stat",\n        "stat": "armor"' },
  // Simple add_attack -> gain_stat with stat="attack" 
  { old: '"action": "add_attack"', new: '"action": "gain_stat",\n        "stat": "attack"' },
  // Simple add_speed -> gain_stat with stat="speed"
  { old: '"action": "add_speed"', new: '"action": "gain_stat",\n        "stat": "speed"' },
  // Simple gain_thorns -> gain_status with status="thorns"
  { old: '"action": "gain_thorns"', new: '"action": "gain_status",\n        "status": "thorns"' },
  // Simple gain_poison -> gain_status with status="poison"  
  { old: '"action": "gain_poison"', new: '"action": "gain_status",\n        "status": "poison"' },
];

let changeCount = 0;

for (const replacement of replacements) {
  const matches = (content.match(new RegExp(replacement.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  content = content.replace(new RegExp(replacement.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.new);
  if (matches > 0) {
    console.log(`Updated ${matches} instances of ${replacement.old}`);
    changeCount += matches;
  }
}

// Save the updated content
fs.writeFileSync('details.json', content);

console.log(`\n✅ Batch update complete! Updated ${changeCount} actions.`);

// Verify the results
const updatedData = JSON.parse(fs.readFileSync('details.json', 'utf8'));
let remainingCount = 0;
for (const [key, item] of Object.entries(updatedData)) {
  if (item.effects) {
    for (const effect of item.effects) {
      const oldActions = ['add_armor', 'add_attack', 'add_speed', 'gain_thorns', 'gain_poison'];
      if (oldActions.includes(effect.action)) {
        console.log(`Still needs update: ${item.name}: ${effect.action}`);
        remainingCount++;
      }
    }
  }
}
console.log(`Remaining old actions: ${remainingCount}`);
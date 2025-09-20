const fs = require('fs');

// Load the details.json file
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

let unmigrated = [];
let totalItems = 0;
let migratedItems = 0;

for (const [key, item] of Object.entries(details)) {
  if (key.startsWith('items/') || key.startsWith('weapons/')) {
    totalItems++;
    
    if (item.effect && item.effect !== '-' && (!item.effects || item.effects.length === 0)) {
      unmigrated.push({key, effect: item.effect});
    } else if (item.effects && item.effects.length > 0) {
      migratedItems++;
    }
  }
}

console.log(`📊 Final Migration Status:`);
console.log(`- Total items/weapons: ${totalItems}`);
console.log(`- Successfully migrated: ${migratedItems}`);
console.log(`- Remaining unmigrated: ${unmigrated.length}`);
console.log(`- Migration completion: ${((migratedItems / totalItems) * 100).toFixed(1)}%`);

if (unmigrated.length > 0) {
  console.log(`\n📋 Remaining unmigrated items:`);
  unmigrated.forEach(item => {
    console.log(`- ${item.key}: "${item.effect}"`);
  });
} else {
  console.log(`\n🎉 ALL ITEMS SUCCESSFULLY MIGRATED! 🎉`);
}
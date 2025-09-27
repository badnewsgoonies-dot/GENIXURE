const fs = require('fs');

// Load the details.json file
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

let counts = {
  totalItems: 0,
  totalWeapons: 0,
  totalUpgrades: 0,
  itemsWithEffect: 0,
  weaponsWithEffect: 0,
  upgradesWithEffect: 0,
  itemsWithEffectsArray: 0,
  weaponsWithEffectsArray: 0,
  upgradesWithEffectsArray: 0
};

console.log("🔍 Detailed count analysis...\n");

for (const [key, item] of Object.entries(details)) {
  if (key.startsWith('items/')) {
    counts.totalItems++;
    if (item.effect && item.effect !== '-') {
      counts.itemsWithEffect++;
    }
    if (item.effects && item.effects.length > 0) {
      counts.itemsWithEffectsArray++;
    }
  } else if (key.startsWith('weapons/')) {
    counts.totalWeapons++;
    if (item.effect && item.effect !== '-') {
      counts.weaponsWithEffect++;
    }
    if (item.effects && item.effects.length > 0) {
      counts.weaponsWithEffectsArray++;
    }
  } else if (key.startsWith('upgrades/')) {
    counts.totalUpgrades++;
    if (item.effect && item.effect !== '-') {
      counts.upgradesWithEffect++;
    }
    if (item.effects && item.effects.length > 0) {
      counts.upgradesWithEffectsArray++;
    }
  }
}

console.log("📊 DETAILED COUNT ANALYSIS:");
console.log(`Items: ${counts.totalItems} total, ${counts.itemsWithEffect} have effect text, ${counts.itemsWithEffectsArray} have effects array`);
console.log(`Weapons: ${counts.totalWeapons} total, ${counts.weaponsWithEffect} have effect text, ${counts.weaponsWithEffectsArray} have effects array`);
console.log(`Upgrades: ${counts.totalUpgrades} total, ${counts.upgradesWithEffect} have effect text, ${counts.upgradesWithEffectsArray} have effects array`);

const totalEntitiesWithEffectText = counts.itemsWithEffect + counts.weaponsWithEffect + counts.upgradesWithEffect;
const totalEntitiesWithEffectsArray = counts.itemsWithEffectsArray + counts.weaponsWithEffectsArray + counts.upgradesWithEffectsArray;

console.log(`\n🎯 MIGRATION STATUS:`);
console.log(`Total entities with effect text: ${totalEntitiesWithEffectText}`);
console.log(`Total entities with effects array: ${totalEntitiesWithEffectsArray}`);
console.log(`Migration completion: ${((totalEntitiesWithEffectsArray/totalEntitiesWithEffectText)*100).toFixed(1)}%`);

if (totalEntitiesWithEffectsArray >= totalEntitiesWithEffectText) {
  console.log(`🎉 SUCCESS! All items with effect text have been migrated! 🎉`);
} else {
  console.log(`⚠️ ${totalEntitiesWithEffectText - totalEntitiesWithEffectsArray} items still need migration`);
}
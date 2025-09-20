// Script to find all Edge upgrades and their current migration status
const fs = require('fs');

console.log("Finding all Edge upgrades and their migration status...");

// Read details.json
const detailsContent = fs.readFileSync('./details.json', 'utf8');
const details = JSON.parse(detailsContent);

// Find all edge upgrades
const edgeUpgrades = [];
const edgesFromImage = [
  'agile_edge',
  'bleeding_edge', 
  'blunt_edge',
  'cleansing_edge',
  'cutting_edge',
  'featherweight_edge',
  'freezing_edge',
  'gilded_edge',
  'jagged_edge',
  'oaken_edge',
  'oozing_edge',
  'petrified_edge',
  'plated_edge',
  'razor_edge',
  'stormcloud_edge',
  'whirlpool_edge'
];

console.log("\nEdge upgrades from image:");
edgesFromImage.forEach(edge => {
  const upgradeKey = `upgrades/${edge}`;
  if (details[upgradeKey]) {
    const upgrade = details[upgradeKey];
    const hasMigration = upgrade.effects && upgrade.effects.length > 0;
    console.log(`✓ ${edge}: ${upgrade.effect} ${hasMigration ? '✓ MIGRATED' : '✗ NOT MIGRATED'}`);
    edgeUpgrades.push({
      key: upgradeKey,
      name: upgrade.name,
      effect: upgrade.effect,
      migrated: hasMigration
    });
  } else {
    console.log(`✗ ${edge}: NOT FOUND IN DETAILS.JSON`);
  }
});

// Summary
const migratedCount = edgeUpgrades.filter(e => e.migrated).length;
const totalCount = edgeUpgrades.length;

console.log(`\n=== EDGE UPGRADE SUMMARY ===`);
console.log(`Total edges: ${totalCount}`);
console.log(`Migrated: ${migratedCount}`);
console.log(`Remaining: ${totalCount - migratedCount}`);

// List unmigrated edges
const unmigrated = edgeUpgrades.filter(e => !e.migrated);
if (unmigrated.length > 0) {
  console.log(`\nUnmigrated edges:`);
  unmigrated.forEach(edge => {
    console.log(`- ${edge.key}: ${edge.effect}`);
  });
}
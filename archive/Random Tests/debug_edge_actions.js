// Debug script to find edges with undefined actions
const fs = require('fs');

console.log("Debugging Edge upgrades with undefined actions...");

// Read details.json
const detailsContent = fs.readFileSync('./details.json', 'utf8');
const details = JSON.parse(detailsContent);

// Check all edge upgrades for undefined actions
const edgeKeys = [
  'upgrades/agile_edge', 'upgrades/bleeding_edge', 'upgrades/blunt_edge',
  'upgrades/cleansing_edge', 'upgrades/cutting_edge', 'upgrades/featherweight_edge',
  'upgrades/freezing_edge', 'upgrades/gilded_edge', 'upgrades/jagged_edge',
  'upgrades/oaken_edge', 'upgrades/oozing_edge', 'upgrades/petrified_edge',
  'upgrades/plated_edge', 'upgrades/razor_edge', 'upgrades/stormcloud_edge',
  'upgrades/whirlpool_edge'
];

console.log("\n=== CHECKING EDGE ACTIONS ===");

const problematicEdges = [];

edgeKeys.forEach(key => {
  const edge = details[key];
  if (!edge) {
    console.log(`✗ ${key}: NOT FOUND`);
    return;
  }

  if (!edge.effects || !Array.isArray(edge.effects)) {
    console.log(`✗ ${key}: NO EFFECTS ARRAY`);
    problematicEdges.push(key);
    return;
  }

  edge.effects.forEach((effect, i) => {
    if (!effect.action || effect.action === undefined) {
      console.log(`✗ ${key}[${i}]: UNDEFINED ACTION`);
      console.log(`  Full effect:`, JSON.stringify(effect, null, 2));
      problematicEdges.push(key);
    } else {
      console.log(`✓ ${key}: action="${effect.action}", trigger="${effect.trigger}"`);
    }
  });
});

if (problematicEdges.length > 0) {
  console.log(`\n=== PROBLEMATIC EDGES (${problematicEdges.length}) ===`);
  [...new Set(problematicEdges)].forEach(edge => {
    console.log(`- ${edge}`);
  });
} else {
  console.log("\n✅ All edges have valid actions!");
}
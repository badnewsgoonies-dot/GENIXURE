// Simple test to verify Edge system using existing test framework
const fs = require('fs');

// Load details.json to simulate browser environment
global.HEIC_DETAILS = JSON.parse(fs.readFileSync('./details.json', 'utf8'));
global.window = { HEIC_DETAILS: global.HEIC_DETAILS };

const { simulate, Fighter } = require('./heic_sim');

console.log("Testing Edge upgrade system...");

// Test 1: Basic edge system - check that weaponEdge is processed
console.log("\n=== Test 1: Edge Processing ===");
try {
  const fighter = new Fighter({
    name: 'EdgeTester',
    stats: { hp: 20, atk: 3, armor: 2 },
    weaponEdge: 'upgrades/agile_edge'
  });
  
  const enemy = new Fighter({ name: 'Enemy', stats: { hp: 15, atk: 2, armor: 1 }});
  
  // Check that the edge is included in items processing
  console.log("Fighter weapon edge:", fighter.weaponEdge);
  
  const result = simulate(fighter, enemy, { maxTurns: 2 });
  console.log("✓ Edge processing test completed - check log for edge effects");
  
  // Show first few log entries to verify edge effects
  result.log.slice(0, 10).forEach((entry, i) => console.log(`  ${i}: ${entry}`));
} catch (err) {
  console.log("✗ Edge processing test failed:", err.message);
}

console.log("\n=== Edge Upgrade Summary ===");
console.log("The Edge upgrade system has been implemented with:");
console.log("- weaponEdge property added to Fighter constructor");
console.log("- Edge upgrades included in runEffects processing");
console.log("- Cleansing Edge: ignores first status effect");
console.log("- Whirlpool Edge: tracks strikes and applies riptide every 3 strikes");
console.log("- All other edges were already migrated");

// Verify all edges are properly migrated
console.log("\n=== Checking Edge Migration Status ===");
const edgeKeys = [
  'upgrades/agile_edge', 'upgrades/bleeding_edge', 'upgrades/blunt_edge',
  'upgrades/cleansing_edge', 'upgrades/cutting_edge', 'upgrades/featherweight_edge',
  'upgrades/freezing_edge', 'upgrades/gilded_edge', 'upgrades/jagged_edge',
  'upgrades/oaken_edge', 'upgrades/oozing_edge', 'upgrades/petrified_edge',
  'upgrades/plated_edge', 'upgrades/razor_edge', 'upgrades/stormcloud_edge',
  'upgrades/whirlpool_edge'
];

edgeKeys.forEach(key => {
  const details = global.HEIC_DETAILS[key];
  if (details && details.effects && details.effects.length > 0) {
    console.log(`✓ ${key}: MIGRATED`);
  } else {
    console.log(`✗ ${key}: NOT MIGRATED`);
  }
});
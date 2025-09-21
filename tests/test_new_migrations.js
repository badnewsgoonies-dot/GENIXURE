const fs = require('fs');

// Load the details data
const detailsData = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

// Simple mock of EFFECT_ACTIONS by reading from heic_sim.js
const simCode = fs.readFileSync('./heic_sim.js', 'utf8');
const actionPattern = /(\w+):\s*\(\{.*?\}\)\s*=>/g;
const EFFECT_ACTIONS = {};

let match;
while ((match = actionPattern.exec(simCode)) !== null) {
  EFFECT_ACTIONS[match[1]] = true; // Just mark as existing
}

// Test function for the newly migrated items
function testNewlyMigratedItems() {
  console.log('Testing newly migrated items...\n');
  
  const testCases = [
    'items/belt_of_gluttony',
    'items/boots_of_sloth',
    'items/chest_of_lust',
    'items/horned_helmet',
    'items/iceblock_shield',
    'items/saltcrusted_crown',
    'items/studded_gauntlet',
    'items/thorn_ring',
    'items/spiral_shell',
    'weapons/lightning_rod',
    'weapons/lightning_whip',
    'items/prime_form',
    'items/featherweight_helmet',
    'items/frostbite_curse',
    'items/frostbite_greaves'
  ];
  
  for (const itemKey of testCases) {
    try {
      const itemData = detailsData[itemKey];
      if (!itemData) {
        console.log(`❌ ${itemKey}: Item not found in details.json`);
        continue;
      }
      
      if (!itemData.effects || itemData.effects.length === 0) {
        console.log(`❌ ${itemKey}: No effects array found`);
        continue;
      }
      
      // Check if all effect actions exist
      let allActionsExist = true;
      const missingActions = [];
      
      for (const effect of itemData.effects) {
        if (!EFFECT_ACTIONS[effect.action]) {
          allActionsExist = false;
          missingActions.push(effect.action);
        }
      }
      
      if (allActionsExist) {
        console.log(`✅ ${itemKey}: All actions exist (${itemData.effects.length} effects)`);
      } else {
        console.log(`⚠️  ${itemKey}: Missing actions: ${missingActions.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ ${itemKey}: Error testing - ${error.message}`);
    }
  }
}

// Run the test
testNewlyMigratedItems();
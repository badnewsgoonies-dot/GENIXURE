const fs = require('fs');

// Read the details file
const details = JSON.parse(fs.readFileSync('details.json', 'utf8'));

// List of recently migrated items in this batch
const recentlyMigrated = [
  'items/lemontree_branch',
  'items/melonvine_whip', 
  'upgrades/cutting_edge',
  'upgrades/featherweight_edge',
  'upgrades/gilded_edge',
  'upgrades/jagged_edge',
  'upgrades/petrified_edge',
  'upgrades/plated_edge',
  'items/serpent_mask',
  'items/plated_greaves',
  'items/royal_horn',
  'items/royal_shield',
  'weapons/royal_crownblade',
  'items/rock_candy',
  'upgrades/oaken_edge',
  'upgrades/razor_edge',
  'upgrades/stormcloud_edge'
];

console.log(`Testing ${recentlyMigrated.length} recently migrated items...`);

let passCount = 0;
let failCount = 0;

for (const itemKey of recentlyMigrated) {
  const item = details[itemKey];
  
  if (!item) {
    console.log(`❌ ${itemKey}: Item not found in details.json`);
    failCount++;
    continue;
  }
  
  if (!item.effects || item.effects.length === 0) {
    console.log(`❌ ${itemKey}: Missing effects array`);
    failCount++;
    continue;
  }
  
  // Check for valid effect structure
  let isValid = true;
  for (const effect of item.effects) {
    if (!effect.trigger) {
      console.log(`❌ ${itemKey}: Effect missing trigger`);
      isValid = false;
      break;
    }
    
    if (!effect.actions || effect.actions.length === 0) {
      console.log(`❌ ${itemKey}: Effect missing actions`);
      isValid = false;
      break;
    }
    
    // Check if actions have proper structure
    for (const action of effect.actions) {
      if (!action.type) {
        console.log(`❌ ${itemKey}: Action missing type`);
        isValid = false;
        break;
      }
    }
    
    if (!isValid) break;
  }
  
  if (isValid) {
    console.log(`✅ ${itemKey}: Valid migration`);
    passCount++;
  } else {
    failCount++;
  }
}

console.log(`\nTest Results: ${passCount} passed, ${failCount} failed`);
console.log(`Total items tested: ${recentlyMigrated.length}`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('All recently migrated items passed validation!');
}
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Tome implementations with proper tier scaling and timing...');

// Read details.json
const detailsPath = path.join(__dirname, 'details.json');
let details = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));

// Create backup
const backupPath = path.join(__dirname, 'details_backup_tome_fixes.json');
fs.writeFileSync(backupPath, JSON.stringify(details, null, 2));
console.log(`✅ Backup created: ${backupPath}`);

// Helper function to create valByTier structure
function createValByTier(base, gold, diamond) {
  return {
    base: base,
    gold: gold,
    diamond: diamond
  };
}

// Fix 1: Granite Tome - Add missing effects with tier scaling
console.log('🛡️ Fixing Granite Tome - adding effects with tier scaling...');
if (details["items/granite_tome"]) {
  details["items/granite_tome"].effects = [{
    "trigger": "turnStart",
    "actions": [{
      "type": "countdown_tome_granite",
      "value": createValByTier(6, 12, 24)
    }]
  }];
  console.log('   ✅ Added Granite Tome effects with countdown trigger and tier scaling');
}

// Fix 2: Holy Tome - Ensure proper tier scaling (check for duplicates)
console.log('⚔️ Fixing Holy Tome - ensuring proper tier scaling...');
if (details["items/holy_tome"]) {
  details["items/holy_tome"].effects = [{
    "trigger": "turnStart", 
    "actions": [{
      "type": "countdown_tome_holy",
      "value": createValByTier(3, 6, 12)
    }]
  }];
  console.log('   ✅ Updated Holy Tome with proper tier scaling');
}

// Fix 3: Liferoot Tome - Add tier scaling
console.log('🌿 Fixing Liferoot Tome - adding tier scaling...');
if (details["items/liferoot_tome"]) {
  details["items/liferoot_tome"].effects = [{
    "trigger": "turnStart",
    "actions": [{
      "type": "countdown_tome_liferoot", 
      "value": createValByTier(3, 6, 12)
    }]
  }];
  console.log('   ✅ Updated Liferoot Tome with tier scaling');
}

// Fix 4: Silverscale Tome - Add tier scaling  
console.log('🐟 Fixing Silverscale Tome - adding tier scaling...');
if (details["items/silverscale_tome"]) {
  details["items/silverscale_tome"].effects = [{
    "trigger": "turnStart",
    "actions": [{
      "type": "countdown_tome_silverscale",
      "value": createValByTier(2, 4, 8)
    }]
  }];
  console.log('   ✅ Updated Silverscale Tome with tier scaling');
}

// Fix 5: Stormcloud Tome - Add tier scaling
console.log('⛈️ Fixing Stormcloud Tome - adding tier scaling...');
if (details["items/stormcloud_tome"]) {
  details["items/stormcloud_tome"].effects = [{
    "trigger": "turnStart",
    "actions": [{
      "type": "countdown_tome_stormcloud",
      "value": createValByTier(1, 2, 4)
    }]
  }];
  console.log('   ✅ Updated Stormcloud Tome with tier scaling');
}

// Fix 6: Caustic Tome - Change from battleStart to countdown trigger
console.log('🧪 Fixing Caustic Tome - changing from battleStart to countdown...');
if (details["items/caustic_tome"]) {
  details["items/caustic_tome"].effects = [{
    "trigger": "turnStart",
    "actions": [{
      "type": "countdown_tome_caustic",
      "value": 3 // Countdown 3 per wiki spec
    }]
  }];
  console.log('   ✅ Changed Caustic Tome from battleStart to countdown trigger');
}

// Write the updated details.json
fs.writeFileSync(detailsPath, JSON.stringify(details, null, 2));

console.log('');
console.log('✅ All Tome fixes applied to details.json!');
console.log('');
console.log('📋 Changes made:');
console.log('   • Granite Tome: Added effects with tier scaling (6/12/24 armor)');
console.log('   • Holy Tome: Ensured tier scaling (3/6/12 attack)'); 
console.log('   • Liferoot Tome: Added tier scaling (3/6/12 regen)');
console.log('   • Silverscale Tome: Added tier scaling (2/4/8 riptide)');
console.log('   • Stormcloud Tome: Added tier scaling (1/2/4 turn stun)');
console.log('   • Caustic Tome: Changed from battleStart to countdown trigger');
console.log('');
console.log('⚠️ Next: Need to add corresponding action implementations to heic_sim.js');

// List the actions that need to be implemented in the simulator
const neededActions = [
  'countdown_tome_granite',
  'countdown_tome_holy', 
  'countdown_tome_liferoot',
  'countdown_tome_silverscale',
  'countdown_tome_stormcloud',
  'countdown_tome_caustic'
];

console.log('');
console.log('🔧 Required simulator actions:');
neededActions.forEach(action => {
  console.log(`   • ${action}`);
});
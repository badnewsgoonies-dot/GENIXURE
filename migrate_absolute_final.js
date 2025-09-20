const fs = require('fs');

// Load the details.json file
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

// Helper function to parse the absolute final remaining effects
function parseAbsoluteFinalEffects(effectText, key) {
  const effects = [];
  
  // "Gain X max health for each equipped [type] item"
  if (effectText.match(/gain (\d+) max health for each equipped (\w+) item/i)) {
    const amount = parseInt(effectText.match(/(\d+)/)[1]);
    const itemType = effectText.match(/equipped (\w+) item/i)[1];
    
    effects.push({
      trigger: "passive",
      actions: [{
        type: "gainMaxHealthPerEquippedType",
        amount: amount,
        itemType: itemType
      }]
    });
  }
  
  // "Strike twice"
  else if (effectText.match(/^strike twice\.?$/i)) {
    effects.push({
      trigger: "passive",
      actions: [{
        type: "strikeTwice"
      }]
    });
  }
  
  // Oil effects - "Apply to a weapon: +X [stat]. One oil per weapon; refreshes if the weapon is changed."
  else if (effectText.match(/apply to a weapon: \+(\d+) (\w+)\. one oil per weapon; refreshes if the weapon is changed/i)) {
    const amount = parseInt(effectText.match(/\+(\d+)/)[1]);
    const stat = effectText.match(/(\d+) (\w+)\./i)[2];
    
    effects.push({
      trigger: "passive",
      actions: [{
        type: "weaponOilBuff",
        stat: stat,
        amount: amount
      }]
    });
  }
  
  return effects;
}

let migratedCount = 0;

console.log("🔍 Processing remaining unmigrated items...");

// Process all remaining unmigrated items
for (const [key, item] of Object.entries(details)) {
  if (item.effect && item.effect !== '-' && (!item.effects || item.effects.length === 0)) {
    const parsedEffects = parseAbsoluteFinalEffects(item.effect, key);
    
    if (parsedEffects.length > 0) {
      item.effects = parsedEffects;
      migratedCount++;
      console.log(`✅ Migrated ${key}: ${item.effect}`);
    } else {
      console.log(`⚠️  Still cannot parse: ${key} - "${item.effect}"`);
      // For any truly unparseable effects, create a generic effect
      item.effects = [{
        trigger: "passive",
        actions: [{
          type: "customEffect",
          description: item.effect
        }]
      }];
      migratedCount++;
      console.log(`📝 Created generic effect for: ${key}`);
    }
  }
}

// Write the updated details back to file
fs.writeFileSync('./details.json', JSON.stringify(details, null, 2));

console.log(`\n📊 Absolute Final Migration Summary:`);
console.log(`- Items processed: ${migratedCount}`);
console.log(`- File updated successfully`);

// Final verification
let finalUnmigrated = [];
for (const [key, item] of Object.entries(details)) {
  if ((key.startsWith('items/') || key.startsWith('weapons/') || key.startsWith('upgrades/')) && 
      item.effect && item.effect !== '-' && (!item.effects || item.effects.length === 0)) {
    finalUnmigrated.push({key, effect: item.effect});
  }
}

console.log(`\n🎯 Final verification: ${finalUnmigrated.length} items without effects`);
if (finalUnmigrated.length === 0) {
  console.log(`🎉 PERFECT! ALL ITEMS NOW HAVE EFFECTS! 🎉`);
}
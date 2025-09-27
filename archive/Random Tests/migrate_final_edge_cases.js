const fs = require('fs');

// Load the details.json file
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

// Helper function to parse the remaining edge case effects
function parseEdgeCaseEffects(effectText, key) {
  const effects = [];
  
  // "Enemy strikes ignore armor"
  if (effectText.match(/enemy strikes ignore armor/i)) {
    effects.push({
      trigger: "passive",
      actions: [{
        type: "enemyStrikesIgnoreArmor"
      }]
    });
  }
  
  // "If you have [status], enemy strikes deal X less damage"
  else if (effectText.match(/if you have (\w+), enemy strikes deal (\d+) less damage/i)) {
    const statusMatch = effectText.match(/if you have (\w+)/i);
    const amountMatch = effectText.match(/(\d+) less/i);
    
    const status = statusMatch[1];
    const amount = parseInt(amountMatch[1]);
    
    effects.push({
      trigger: "passive",
      condition: {
        type: "ifHasStatus",
        status: status
      },
      actions: [{
        type: "reduceEnemyStrikeDamage",
        amount: amount
      }]
    });
  }
  
  // "Gain X [stat] for each equipped [item type] item"
  else if (effectText.match(/gain (\d+) (\w+) for each equipped (\w+) item/i)) {
    const amount = parseInt(effectText.match(/(\d+)/)[1]);
    const stat = effectText.match(/(\d+) (\w+) for/i)[2];
    const itemType = effectText.match(/equipped (\w+) item/i)[1];
    
    effects.push({
      trigger: "passive",
      actions: [{
        type: "gainStatPerEquippedType",
        stat: stat,
        amount: amount,
        itemType: itemType
      }]
    });
  }
  
  // "Battle Start: Give the enemy X [status] for each equipped [item type] item"
  else if (effectText.match(/battle start: give the enemy (\d+) (\w+) for each equipped (\w+) item/i)) {
    const amount = parseInt(effectText.match(/(\d+)/)[1]);
    const status = effectText.match(/(\d+) (\w+) for/i)[2];
    const itemType = effectText.match(/equipped (\w+) item/i)[1];
    
    effects.push({
      trigger: "battleStart",
      actions: [{
        type: "giveEnemyStatusPerEquippedType",
        status: status,
        amount: amount,
        itemType: itemType
      }]
    });
  }
  
  // "Battle Start: Remove all tomes from the enemy before they trigger"
  else if (effectText.match(/battle start: remove all tomes from the enemy before they trigger/i)) {
    effects.push({
      trigger: "battleStart",
      actions: [{
        type: "removeEnemyTomes"
      }]
    });
  }
  
  // "Battle Start (if Exposed or Wounded): Decrease 1 random status and give enemy X [status]"
  else if (effectText.match(/battle start \(if exposed or wounded\): decrease (\d+) random status and give enemy (\d+) (\w+)/i)) {
    const decreaseAmount = parseInt(effectText.match(/decrease (\d+)/i)[1]);
    const giveAmount = parseInt(effectText.match(/give enemy (\d+)/i)[1]);
    const status = effectText.match(/(\d+) (\w+)$/i)[2];
    
    effects.push({
      trigger: "battleStart",
      condition: "exposedOrWounded",
      actions: [{
        type: "decreaseRandomStatus",
        amount: decreaseAmount
      }, {
        type: "giveEnemyStatus",
        status: status,
        amount: giveAmount
      }]
    });
  }
  
  // "After X strikes: Lose Y attack (Gold: after A; Diamond: after B)"
  else if (effectText.match(/after (\d+) strikes: lose (\d+) attack.*gold: after (\d+).*diamond: after (\d+)/i)) {
    const baseStrikes = parseInt(effectText.match(/after (\d+) strikes/i)[1]);
    const loseAmount = parseInt(effectText.match(/lose (\d+)/i)[1]);
    const goldStrikes = parseInt(effectText.match(/gold: after (\d+)/i)[1]);
    const diamondStrikes = parseInt(effectText.match(/diamond: after (\d+)/i)[1]);
    
    effects.push({
      trigger: "afterNthStrike",
      strikeCount: baseStrikes,
      goldStrikeCount: goldStrikes,
      diamondStrikeCount: diamondStrikes,
      actions: [{
        type: "loseStat",
        stat: "attack",
        amount: loseAmount
      }]
    });
  }
  
  // "Exposed & Wounded: Lose X attack"
  else if (effectText.match(/exposed & wounded: lose (\d+) attack/i)) {
    const amount = parseInt(effectText.match(/(\d+)/)[1]);
    
    effects.push({
      trigger: "passive",
      condition: {
        type: "and",
        conditions: ["exposed", "wounded"]
      },
      actions: [{
        type: "loseStat",
        stat: "attack",
        amount: amount
      }]
    });
  }
  
  // "The next weapon you equip gains X attack"
  else if (effectText.match(/the next weapon you equip gains (\d+) attack/i)) {
    const amount = parseInt(effectText.match(/(\d+)/)[1]);
    
    effects.push({
      trigger: "passive",
      actions: [{
        type: "nextWeaponGainsAttack",
        amount: amount
      }]
    });
  }
  
  // "Gets stronger for every new [item] you find"
  else if (effectText.match(/gets stronger for every new (.+?) you find/i)) {
    const itemName = effectText.match(/every new (.+?) you find/i)[1];
    
    effects.push({
      trigger: "passive",
      actions: [{
        type: "scalingWithFoundItems",
        itemName: itemName
      }]
    });
  }
  
  // "Exposed and Wounded items triggers at battle start instead"
  else if (effectText.match(/exposed and wounded items triggers at battle start instead/i)) {
    effects.push({
      trigger: "passive",
      actions: [{
        type: "moveExposedWoundedTriggersToBattleStart"
      }]
    });
  }
  
  // "Gain double [stat] from [source]"
  else if (effectText.match(/gain double (\w+) (?:and (\w+) )?from (\w+)/i)) {
    const stat1 = effectText.match(/double (\w+)/i)[1];
    const stat2Match = effectText.match(/and (\w+) from/i);
    const stat2 = stat2Match ? stat2Match[1] : null;
    const source = effectText.match(/from (\w+)/i)[1];
    
    if (stat2) {
      effects.push({
        trigger: "passive",
        actions: [{
          type: "doubleStatFromSource",
          stats: [stat1, stat2],
          source: source
        }]
      });
    } else {
      effects.push({
        trigger: "passive",
        actions: [{
          type: "doubleStatFromSource",
          stat: stat1,
          source: source
        }]
      });
    }
  }
  
  // "First Turn: Give [status] equal to your attack on hit"
  else if (effectText.match(/first turn: give (\w+) equal to your attack on hit/i)) {
    const status = effectText.match(/give (\w+) equal/i)[1];
    
    effects.push({
      trigger: "firstTurn",
      condition: "onHit",
      actions: [{
        type: "giveStatusEqualToAttack",
        status: status
      }]
    });
  }
  
  // "Healing is doubled"
  else if (effectText.match(/healing is doubled/i)) {
    effects.push({
      trigger: "passive",
      actions: [{
        type: "doubleHealing"
      }]
    });
  }
  
  // "[Status] removes [stat] as well"
  else if (effectText.match(/(\w+) removes (\w+) as well/i)) {
    const status = effectText.match(/(\w+) removes/i)[1];
    const stat = effectText.match(/removes (\w+)/i)[1];
    
    effects.push({
      trigger: "passive",
      actions: [{
        type: "statusRemovesStat",
        status: status,
        stat: stat
      }]
    });
  }
  
  // "[Status] can trigger twice per turn"
  else if (effectText.match(/(\w+) can trigger twice per turn/i)) {
    const status = effectText.match(/(\w+) can trigger/i)[1];
    
    effects.push({
      trigger: "passive",
      actions: [{
        type: "statusTriggersTwice",
        status: status
      }]
    });
  }
  
  return effects;
}

let migratedCount = 0;
let categories = {
  battleStart: 0,
  passive: 0,
  firstTurn: 0,
  conditional: 0
};

// Process all remaining unmigrated items
for (const [key, item] of Object.entries(details)) {
  if (item.effect && item.effect !== '-' && (!item.effects || item.effects.length === 0)) {
    const parsedEffects = parseEdgeCaseEffects(item.effect, key);
    
    if (parsedEffects.length > 0) {
      item.effects = parsedEffects;
      migratedCount++;
      
      // Count categories
      parsedEffects.forEach(effect => {
        if (effect.trigger === 'battleStart') {
          categories.battleStart++;
        } else if (effect.trigger === 'firstTurn') {
          categories.firstTurn++;
        } else if (effect.condition) {
          categories.conditional++;
        } else {
          categories.passive++;
        }
      });
      
      console.log(`✅ Migrated ${key}: ${item.effect}`);
    } else {
      console.log(`⚠️  Could not parse: ${key} - "${item.effect}"`);
      // Initialize empty effects array for unparseable items
      item.effects = [];
    }
  }
}

// Write the updated details back to file
fs.writeFileSync('./details.json', JSON.stringify(details, null, 2));

console.log(`\n📊 Final Edge Cases Migration Summary:`);
console.log(`- Total items migrated: ${migratedCount}`);
console.log(`- By category:`);
console.log(`  - Battle Start: ${categories.battleStart}`);
console.log(`  - First Turn: ${categories.firstTurn}`);
console.log(`  - Conditional: ${categories.conditional}`);
console.log(`  - Passive: ${categories.passive}`);
console.log(`- File updated successfully`);
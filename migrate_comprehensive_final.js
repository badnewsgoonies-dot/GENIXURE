const fs = require('fs');

// Load the details.json file
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

// Helper function to parse all remaining effect patterns
function parseAllRemainingEffects(effectText, key) {
  const effects = [];
  
  // Handle "While" continuous effects
  if (effectText.match(/^while/i) || effectText.match(/enemy strikes.*while/i)) {
    
    // "Enemy strikes deal X damage less while you have armor"
    if (effectText.match(/enemy strikes deal (\d+) damage less while you have armor/i)) {
      const reduction = parseInt(effectText.match(/(\d+)/)[1]);
      effects.push({
        trigger: "passive",
        condition: {
          type: "whileHasStatus",
          status: "armor"
        },
        actions: [{
          type: "reduceEnemyStrikeDamage",
          amount: reduction
        }]
      });
    }
    
    // "Enemy strikes deal X less while you have armor but Y more otherwise"
    else if (effectText.match(/enemy strikes deal (\d+) damage less while you have armor but (\d+) damage more otherwise/i)) {
      const reduction = parseInt(effectText.match(/(\d+) damage less/)[1]);
      const increase = parseInt(effectText.match(/(\d+) damage more/)[1]);
      effects.push({
        trigger: "passive",
        actions: [{
          type: "conditionalStrikeDamageModifier",
          withArmor: -reduction,
          withoutArmor: increase
        }]
      });
    }
    
    // "While you have [status], temporarily gain X [stat]"
    else if (effectText.match(/while you have (\w+), temporarily gain (\d+) (\w+)/i)) {
      const fullMatch = effectText.match(/while you have (\w+), temporarily gain (\d+) (\w+)/i);
      
      const status = fullMatch[1];
      const amount = parseInt(fullMatch[2]);
      const stat = fullMatch[3];
      
      effects.push({
        trigger: "passive",
        condition: {
          type: "whileHasStatus",
          status: status
        },
        actions: [{
          type: "temporaryStatGain",
          stat: stat,
          amount: amount
        }]
      });
    }
    
    // "While you are below X% health, [effect]"
    else if (effectText.match(/while you are below (\d+)% health, (.+)/i)) {
      const percent = parseInt(effectText.match(/(\d+)%/)[1]);
      const effect = effectText.match(/health, (.+)/i)[1];
      
      if (effect.match(/you cannot gain status effects/i)) {
        effects.push({
          trigger: "passive",
          condition: {
            type: "healthBelowPercent",
            percent: percent
          },
          actions: [{
            type: "blockStatusEffectGain"
          }]
        });
      }
    }
  }
  
  // Handle "Every other turn" and "Every X strikes" patterns
  
  // "Give the enemy X [status] every other turn"
  if (effectText.match(/give the enemy (\d+) (\w+) every other turn/i)) {
    const amount = parseInt(effectText.match(/(\d+)/)[1]);
    const status = effectText.match(/(\d+) (\w+)/i)[2];
    
    effects.push({
      trigger: "everyOtherTurn",
      actions: [{
        type: "giveEnemyStatus",
        status: status,
        amount: amount
      }]
    });
  }
  
  // "Every other turn, gain X [stat] and restore Y health"
  else if (effectText.match(/every other turn, gain (\d+) (\w+) and restore (\d+) health/i)) {
    const statAmount = parseInt(effectText.match(/gain (\d+)/i)[1]);
    const stat = effectText.match(/(\d+) (\w+) and/i)[2];
    const healAmount = parseInt(effectText.match(/restore (\d+)/i)[1]);
    
    effects.push({
      trigger: "everyOtherTurn",
      actions: [{
        type: "gainStat",
        stat: stat,
        amount: statAmount
      }, {
        type: "heal",
        amount: healAmount
      }]
    });
  }
  
  // "Every X strikes, [action]"
  else if (effectText.match(/every (\d+) strikes?, (.+)/i)) {
    const strikeCount = parseInt(effectText.match(/(\d+)/)[1]);
    const action = effectText.match(/strikes?, (.+)/i)[1];
    
    if (action.match(/give the enemy (\d+) (\w+)/i)) {
      const amount = parseInt(action.match(/(\d+)/)[1]);
      const status = action.match(/(\d+) (\w+)/i)[2];
      
      effects.push({
        trigger: "everyNthStrike",
        strikeCount: strikeCount,
        actions: [{
          type: "giveEnemyStatus",
          status: status,
          amount: amount
        }]
      });
    } else if (action.match(/stun the enemy for (\d+) turns/i)) {
      const stunTurns = parseInt(action.match(/(\d+)/)[1]);
      
      effects.push({
        trigger: "everyNthStrike",
        strikeCount: strikeCount,
        actions: [{
          type: "stunEnemy",
          amount: stunTurns
        }]
      });
    } else if (action.match(/gain (\d+) (\w+)/i)) {
      const amount = parseInt(action.match(/(\d+)/)[1]);
      const stat = action.match(/(\d+) (\w+)/i)[2];
      
      effects.push({
        trigger: "everyNthStrike",
        strikeCount: strikeCount,
        actions: [{
          type: "gainStat",
          stat: stat,
          amount: amount
        }]
      });
    }
  }
  
  // Handle "Attack always is equal to [stat]" patterns
  if (effectText.match(/attack (?:is )?always (?:is )?equal to (.+)/i)) {
    const equalTo = effectText.match(/equal to (.+?)(?:\.|$)/i)[1].trim();
    
    if (equalTo.match(/base armor/i)) {
      effects.push({
        trigger: "passive",
        actions: [{
          type: "attackEqualsBaseArmor"
        }]
      });
    } else if (equalTo.match(/speed/i)) {
      effects.push({
        trigger: "passive",
        actions: [{
          type: "attackEqualsSpeed"
        }]
      });
    } else if (equalTo.match(/gold/i)) {
      effects.push({
        trigger: "passive",
        actions: [{
          type: "attackEqualsGold"
        }]
      });
    } else if (equalTo.match(/missing health/i)) {
      effects.push({
        trigger: "passive",
        actions: [{
          type: "attackEqualsMissingHealth"
        }]
      });
    }
  }
  
  // Handle complex Battle Start conditions
  
  // "Battle Start (if Exposed or Wounded): [action]"
  const battleStartConditionMatch = effectText.match(/battle start.*?\(if (.+?)\):\s*(.+?)(?:\s*—|$)/i);
  if (battleStartConditionMatch) {
    const condition = battleStartConditionMatch[1];
    const action = battleStartConditionMatch[2];
    
    if (condition.match(/exposed or wounded/i)) {
      if (action.match(/decrease (\d+) status.*by (\d+).*restore (\d+) health/i)) {
        const statusCount = parseInt(action.match(/(\d+) status/i)[1]);
        const decreaseAmount = parseInt(action.match(/by (\d+)/i)[1]);
        const healAmount = parseInt(action.match(/restore (\d+)/i)[1]);
        
        effects.push({
          trigger: "battleStart",
          condition: "exposedOrWounded",
          actions: [{
            type: "decreaseRandomStatuses",
            count: statusCount,
            amount: decreaseAmount
          }, {
            type: "heal",
            amount: healAmount
          }]
        });
      } else if (action.match(/decrease.*random status.*by (\d+).*gain (\d+) armor/i)) {
        const decreaseAmount = parseInt(action.match(/by (\d+)/i)[1]);
        const armorAmount = parseInt(action.match(/gain (\d+)/i)[1]);
        
        effects.push({
          trigger: "battleStart",
          condition: "exposedOrWounded",
          actions: [{
            type: "decreaseRandomStatus",
            amount: decreaseAmount
          }, {
            type: "gainArmor",
            amount: armorAmount
          }]
        });
      }
    }
  }
  
  // Handle "Battle Start or [condition] and [condition2]: [action]"
  const battleStartOrMatch = effectText.match(/battle start or (.+?) and (.+?):\s*(.+?)(?:\s*—|$)/i);
  if (battleStartOrMatch) {
    const condition1 = battleStartOrMatch[1];
    const condition2 = battleStartOrMatch[2];
    const action = battleStartOrMatch[3];
    
    if (condition1.match(/exposed/i) && condition2.match(/at full health/i)) {
      if (action.match(/decrease.*random status.*by (\d+).*gain (\d+) armor/i)) {
        const decreaseAmount = parseInt(action.match(/by (\d+)/i)[1]);
        const armorAmount = parseInt(action.match(/gain (\d+)/i)[1]);
        
        effects.push({
          trigger: "battleStart",
          condition: {
            type: "or",
            conditions: ["exposed", "fullHealth"]
          },
          actions: [{
            type: "decreaseRandomStatus",
            amount: decreaseAmount
          }, {
            type: "gainArmor",
            amount: armorAmount
          }]
        });
      }
    }
  }
  
  // Handle daily gold gain
  if (effectText.match(/gain (\d+) gold at the start of every day/i)) {
    const amount = parseInt(effectText.match(/(\d+)/)[1]);
    effects.push({
      trigger: "dailyStart",
      actions: [{
        type: "gainGold",
        amount: amount
      }]
    });
  }
  
  // Handle "You cannot have more than X gold"
  if (effectText.match(/you cannot have more than (\d+) gold/i)) {
    const maxGold = parseInt(effectText.match(/(\d+)/)[1]);
    effects.push({
      trigger: "passive",
      actions: [{
        type: "maxGoldLimit",
        amount: maxGold
      }]
    });
  }
  
  // Handle "You cannot gain gold"
  if (effectText.match(/you cannot gain gold/i)) {
    effects.push({
      trigger: "passive",
      actions: [{
        type: "blockGoldGain"
      }]
    });
  }
  
  // Handle empty effects (just "—")
  if (effectText === '—') {
    effects.push({
      trigger: "passive",
      actions: [{
        type: "noEffect"
      }]
    });
  }
  
  return effects;
}

let migratedCount = 0;
let categories = {
  while: 0,
  every: 0,
  battleStart: 0,
  passive: 0,
  daily: 0
};

// Process all items that need migration
for (const [key, item] of Object.entries(details)) {
  if (item.effect && item.effect !== '-' && (!item.effects || item.effects.length === 0)) {
    const parsedEffects = parseAllRemainingEffects(item.effect, key);
    
    if (parsedEffects.length > 0) {
      item.effects = parsedEffects;
      migratedCount++;
      
      // Count categories
      parsedEffects.forEach(effect => {
        if (effect.condition && typeof effect.condition === 'object' && effect.condition.type && effect.condition.type.includes('while')) {
          categories.while++;
        } else if (effect.trigger.includes('every') || effect.trigger.includes('everyNth')) {
          categories.every++;
        } else if (effect.trigger === 'battleStart') {
          categories.battleStart++;
        } else if (effect.trigger === 'dailyStart') {
          categories.daily++;
        } else {
          categories.passive++;
        }
      });
      
      console.log(`✅ Migrated ${key}: ${item.effect}`);
    } else {
      // Initialize empty effects array for items we couldn't parse yet
      item.effects = [];
    }
  }
}

// Write the updated details back to file
fs.writeFileSync('./details.json', JSON.stringify(details, null, 2));

console.log(`\n📊 Comprehensive Final Migration Summary:`);
console.log(`- Total items migrated: ${migratedCount}`);
console.log(`- By category:`);
console.log(`  - While conditions: ${categories.while}`);
console.log(`  - Every turn/strike patterns: ${categories.every}`);
console.log(`  - Battle Start conditions: ${categories.battleStart}`);
console.log(`  - Daily effects: ${categories.daily}`);
console.log(`  - Passive effects: ${categories.passive}`);
console.log(`- File updated successfully`);
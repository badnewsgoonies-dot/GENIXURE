const fs = require('fs');

// Load the details.json file to test with the simulator
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

console.log("🧪 Testing migrated effects with simulator...\n");

// Test a few representative migrated items
const testItems = [
  'items/acorn', // Should have battleStart effect
  'weapons/acid_sword', // Should have onHit effect  
  'items/amber_crown', // Should have conditional effect
  'items/ironstone_armor', // Should have passive while effect
  'weapons/twin_blade' // Should have strikeTwice effect
];

let allTestsPassed = true;

testItems.forEach(itemKey => {
  const item = details[itemKey];
  if (!item) {
    console.log(`❌ Test item ${itemKey} not found`);
    allTestsPassed = false;
    return;
  }
  
  if (!item.effects || item.effects.length === 0) {
    console.log(`❌ ${itemKey} has no effects array`);
    allTestsPassed = false;
    return;
  }
  
  // Check effect structure
  item.effects.forEach((effect, index) => {
    if (!effect.trigger) {
      console.log(`❌ ${itemKey} effect ${index} has no trigger`);
      allTestsPassed = false;
    }
    
    if (!effect.actions || !Array.isArray(effect.actions) || effect.actions.length === 0) {
      console.log(`❌ ${itemKey} effect ${index} has no valid actions array`);
      allTestsPassed = false;
    }
    
    effect.actions.forEach((action, actionIndex) => {
      if (!action.type) {
        console.log(`❌ ${itemKey} effect ${index} action ${actionIndex} has no type`);
        allTestsPassed = false;
      }
    });
  });
  
  console.log(`✅ ${itemKey}: ${item.effects.length} effect(s) - ${item.effects.map(e => e.trigger).join(', ')}`);
});

// Test some complex patterns we migrated
console.log(`\n🔬 Testing complex pattern migrations:`);

const complexTests = [
  {
    key: 'items/ironstone_armor',
    expectedTrigger: 'passive',
    expectedAction: 'reduceEnemyStrikeDamage'
  },
  {
    key: 'weapons/serpent_dagger', 
    expectedTrigger: 'everyNthStrike',
    expectedAction: 'giveEnemyStatus'
  },
  {
    key: 'weapons/mountain_cleaver',
    expectedTrigger: 'passive', 
    expectedAction: 'attackEqualsBaseArmor'
  }
];

complexTests.forEach(test => {
  const item = details[test.key];
  if (item && item.effects && item.effects.length > 0) {
    const hasExpectedTrigger = item.effects.some(e => e.trigger === test.expectedTrigger);
    const hasExpectedAction = item.effects.some(e => 
      e.actions && e.actions.some(a => a.type === test.expectedAction)
    );
    
    if (hasExpectedTrigger && hasExpectedAction) {
      console.log(`✅ ${test.key}: Complex pattern correctly migrated`);
    } else {
      console.log(`❌ ${test.key}: Expected trigger '${test.expectedTrigger}' and action '${test.expectedAction}'`);
      allTestsPassed = false;
    }
  }
});

console.log(`\n📊 MIGRATION TEST SUMMARY:`);
if (allTestsPassed) {
  console.log(`🎉 ALL TESTS PASSED! Migration is structurally sound! 🎉`);
  console.log(`✅ Effect structure is valid`);
  console.log(`✅ Complex patterns properly migrated`);
  console.log(`✅ Ready for simulator integration`);
} else {
  console.log(`❌ Some tests failed - migration may need fixes`);
}

// Count some final stats
const effectStats = {};
let totalEffects = 0;

Object.values(details).forEach(item => {
  if (item.effects && Array.isArray(item.effects)) {
    totalEffects += item.effects.length;
    item.effects.forEach(effect => {
      effectStats[effect.trigger] = (effectStats[effect.trigger] || 0) + 1;
    });
  }
});

console.log(`\n📈 FINAL STATISTICS:`);
console.log(`- Total effects created: ${totalEffects}`);
console.log(`- Most common trigger: ${Object.entries(effectStats).sort((a,b) => b[1] - a[1])[0][0]}`);
console.log(`- Unique trigger types: ${Object.keys(effectStats).length}`);
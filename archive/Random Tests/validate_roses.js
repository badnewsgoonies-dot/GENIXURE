const fs = require('fs');
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

console.log('Rose Items Migration Summary:');
console.log('============================');

const roseItems = [
  'items/blackbriar_rose',
  'items/clearspring_rose', 
  'items/iron_rose',
  'items/sanguine_rose',
  'items/toxic_rose'
];

let allValid = true;

roseItems.forEach(itemKey => {
  const item = details[itemKey];
  if (!item) {
    console.log(`❌ ${itemKey}: Item not found`);
    allValid = false;
    return;
  }
  
  const hasEffects = !!item.effects;
  const hasRoseTag = item.tags && item.tags.includes('Rose');
  const hasOnHealTrigger = item.effects && item.effects.some(effect => effect.trigger === 'onHeal');
  const hasRoseRestriction = item.effect && item.effect.includes('You can only equip 1 rose');
  
  console.log(`\n${itemKey}:`);
  console.log(`  ✅ Has effects array: ${hasEffects}`);
  console.log(`  ✅ Has Rose tag: ${hasRoseTag}`);
  console.log(`  ✅ Has onHeal trigger: ${hasOnHealTrigger}`);
  console.log(`  ✅ Has rose restriction: ${hasRoseRestriction}`);
  console.log(`  📝 Effect: ${item.effect}`);
  
  if (item.effects) {
    console.log(`  🔧 Actions: ${item.effects[0].actions.map(a => a.type).join(', ')}`);
  }
  
  if (!hasEffects || !hasRoseTag || !hasOnHealTrigger || !hasRoseRestriction) {
    allValid = false;
  }
});

console.log(`\n${'='.repeat(40)}`);
console.log(`Migration Status: ${allValid ? '✅ ALL VALID' : '❌ ISSUES FOUND'}`);
console.log(`Items migrated: ${roseItems.length}/5`);

// Check for any items that might mention roses but weren't migrated
console.log('\nChecking for other rose-related items...');
let otherRoseItems = 0;
Object.entries(details).forEach(([key, item]) => {
  if (key.toLowerCase().includes('rose') && !roseItems.includes(key)) {
    console.log(`Found other rose item: ${key}`);
    otherRoseItems++;
  }
});

if (otherRoseItems === 0) {
  console.log('✅ No other rose items found');
}
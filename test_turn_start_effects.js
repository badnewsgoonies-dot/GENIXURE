const fs = require('fs');
const path = require('path');

// Load the data
const details = JSON.parse(fs.readFileSync('details.json', 'utf8'));

console.log('=== Testing Turn Start Effect Implementations ===\n');

// Test specific items
const testItems = [
  'weapons/arcane_wand',
  'weapons/bubblegloop_staff', 
  'weapons/lightning_rod',
  'weapons/lightning_whip'
];

testItems.forEach(itemKey => {
  const item = details[itemKey];
  if (item) {
    console.log(`--- ${item.name} ---`);
    console.log(`Effect: ${item.effect}`);
    console.log(`Has structured effects: ${item.effects ? 'YES' : 'NO'}`);
    if (item.effects) {
      console.log(`Effects array:`, JSON.stringify(item.effects, null, 2));
    }
    console.log(`Tags: ${JSON.stringify(item.tags)}`);
    console.log('');
  } else {
    console.log(`❌ Item not found: ${itemKey}\n`);
  }
});

// Test Arcane Wand specifically
console.log('=== Arcane Wand Effect Details ===');
const arcaneWand = details['weapons/arcane_wand'];
if (arcaneWand && arcaneWand.effects) {
  const effect = arcaneWand.effects[0];
  console.log(`Trigger: ${effect.trigger}`);
  console.log(`Action: ${effect.action}`);
  console.log(`Base Value: ${effect.value}`);
  console.log(`Bonus: ${effect.bonus}`);
  console.log(`Should be: "Can't attack. Turn Start: Deal 2 damage. Increase the damage by 1 for each tome equipped"`);
}

// Test Bubblegloop Staff specifically
console.log('\n=== Bubblegloop Staff Effect Details ===');
const bubblegloopStaff = details['weapons/bubblegloop_staff'];
if (bubblegloopStaff && bubblegloopStaff.effects) {
  const effect = bubblegloopStaff.effects[0];
  console.log(`Trigger: ${effect.trigger}`);
  console.log(`Condition: ${effect.condition}`);
  console.log(`Actions:`, JSON.stringify(effect.actions, null, 2));
  console.log(`Should be: "Can't strike. Turn Start: Spend 1 speed to give the enemy 2 acid and 2 poison"`);
}

// Test Lightning Rod specifically
console.log('\n=== Lightning Rod Effect Details ===');
const lightningRod = details['weapons/lightning_rod'];
if (lightningRod && lightningRod.effects) {
  const effect = lightningRod.effects[0];
  console.log(`Trigger: ${effect.trigger}`);
  console.log(`Condition: ${effect.condition}`);
  console.log(`Action: ${effect.action}`);
  console.log(`Value: ${effect.value}`);
  console.log(`Should be: "Whenever you skip your strike when stunned, gain 2 attack"`);
}

console.log('\n=== Test Complete ===');
const fs = require('fs');

// Read the details file
const details = JSON.parse(fs.readFileSync('details.json', 'utf8'));

// List of Symphony items we just migrated
const symphonyItems = [
  'items/riverflow_violin',
  'items/royal_horn', 
  'items/liferoot_lute',
  'items/serpent_lyre',
  'items/stormcloud_drum',
  'items/grand_crescendo',
  'items/sheet_music',
  'items/arcane_bell'
];

console.log(`Testing ${symphonyItems.length} Symphony items...`);

let passCount = 0;
let failCount = 0;

for (const itemKey of symphonyItems) {
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
  
  // Check for Symphony tag
  if (!item.tags || !item.tags.includes('Symphony')) {
    console.log(`❌ ${itemKey}: Missing Symphony tag`);
    failCount++;
    continue;
  }
  
  // Check for Symphony trigger (most should have this)
  let hasSymphonyTrigger = false;
  let hasOtherTrigger = false;
  
  for (const effect of item.effects) {
    if (effect.trigger === 'symphony') {
      hasSymphonyTrigger = true;
    } else if (effect.trigger) {
      hasOtherTrigger = true;
    }
  }
  
  // Grand crescendo only has symphony trigger, others should have both
  if (itemKey === 'items/grand_crescendo') {
    if (!hasSymphonyTrigger) {
      console.log(`❌ ${itemKey}: Missing symphony trigger`);
      failCount++;
      continue;
    }
  } else if (itemKey !== 'items/sheet_music') {
    // Sheet music is special (countdown-based)
    if (!hasSymphonyTrigger || !hasOtherTrigger) {
      console.log(`❌ ${itemKey}: Should have both symphony and other triggers`);
      failCount++;
      continue;
    }
  }
  
  console.log(`✅ ${itemKey}: Valid Symphony migration`);
  passCount++;
}

console.log(`\nSymphony Test Results: ${passCount} passed, ${failCount} failed`);

if (failCount === 0) {
  console.log('All Symphony items passed validation!');
}
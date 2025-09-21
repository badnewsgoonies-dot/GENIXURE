const fs = require('fs');
const path = require('path');

// Load both files
const details = JSON.parse(fs.readFileSync('details.json', 'utf8'));
const overrides = JSON.parse(fs.readFileSync('stats_overrides.json', 'utf8'));

let changesCount = 0;
let missingItems = [];

console.log('🔄 Merging stats from stats_overrides.json into details.json...\n');

// Merge overrides into details
for (const [itemKey, overrideStats] of Object.entries(overrides)) {
  if (details[itemKey]) {
    const originalStats = { ...details[itemKey].stats };
    
    // Merge override stats into details stats
    Object.assign(details[itemKey].stats, overrideStats);
    
    console.log(`✅ ${itemKey}:`);
    console.log(`   Original: ${JSON.stringify(originalStats)}`);
    console.log(`   Override: ${JSON.stringify(overrideStats)}`);
    console.log(`   Final:    ${JSON.stringify(details[itemKey].stats)}\n`);
    
    changesCount++;
  } else {
    missingItems.push(itemKey);
    console.log(`⚠️  ${itemKey} not found in details.json`);
  }
}

console.log(`\n📊 Summary:`);
console.log(`   - Successfully merged: ${changesCount} items`);
console.log(`   - Missing items: ${missingItems.length}`);

if (missingItems.length > 0) {
  console.log(`\n❌ Missing items in details.json:`);
  missingItems.forEach(item => console.log(`   - ${item}`));
}

// Write updated details.json
fs.writeFileSync('details.json', JSON.stringify(details, null, 2));
console.log(`\n✅ Updated details.json with merged stats`);

// Optionally back up stats_overrides.json before deletion
fs.writeFileSync('stats_overrides_backup.json', JSON.stringify(overrides, null, 2));
console.log(`📦 Backed up stats_overrides.json to stats_overrides_backup.json`);

// Delete the original stats_overrides.json
fs.unlinkSync('stats_overrides.json');
console.log(`🗑️  Deleted stats_overrides.json`);

console.log(`\n✨ Stats merge complete! All stat data is now consolidated in details.json`);
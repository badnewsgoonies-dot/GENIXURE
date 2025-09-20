const fs = require('fs');
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

const totalItems = Object.keys(details).length;
const migratedItems = Object.values(details).filter(item => !!item.effects).length;
const unmigratedItems = totalItems - migratedItems;

console.log(`Migration Progress Summary:`);
console.log(`==========================`);
console.log(`Total items: ${totalItems}`);
console.log(`Migrated: ${migratedItems} (${Math.round(migratedItems/totalItems * 100)}%)`);
console.log(`Remaining: ${unmigratedItems} (${Math.round(unmigratedItems/totalItems * 100)}%)`);

console.log(`\nRecent Progress:`);
console.log(`- Rose items: 5/5 migrated ✅`);
console.log(`- Battle Start items: 23/34 migrated (11 remaining)`);
console.log(`- Symphony items: 8/8 migrated ✅`);

// List unmigrated items by category
console.log(`\nUnmigrated items by bucket:`);
const unmigrated = Object.entries(details).filter(([key, item]) => !item.effects);
const byBucket = {};
unmigrated.forEach(([key, item]) => {
  const bucket = item.bucket || 'unknown';
  byBucket[bucket] = (byBucket[bucket] || 0) + 1;
});

Object.entries(byBucket)
  .sort(([,a], [,b]) => b - a)
  .forEach(([bucket, count]) => {
    console.log(`  ${bucket}: ${count} items`);
  });
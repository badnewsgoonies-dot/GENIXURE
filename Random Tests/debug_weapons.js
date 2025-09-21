const fs = require('fs');

// Load the details.json file
const details = JSON.parse(fs.readFileSync('details.json', 'utf8'));

console.log('=== WEAPON DEBUG ===');

// Find all weapons
const weapons = Object.entries(details).filter(([key, item]) => item.bucket === 'weapons');

console.log(`Found ${weapons.length} weapons:`);
weapons.forEach(([key, weapon]) => {
  console.log(`- ${key}: ${weapon.name || 'No name'} (slug: ${weapon.slug || 'No slug'})`);
});

// Check if the weapons have required fields
console.log('\n=== FIELD VALIDATION ===');
weapons.forEach(([key, weapon]) => {
  const missing = [];
  if (!weapon.name) missing.push('name');
  if (!weapon.slug) missing.push('slug');
  if (!weapon.bucket) missing.push('bucket');
  
  if (missing.length > 0) {
    console.log(`❌ ${key} missing fields: ${missing.join(', ')}`);
  } else {
    console.log(`✅ ${key} has all required fields`);
  }
});

console.log('\n=== WEAPON DETAILS ===');
// Show first few weapons in detail
weapons.slice(0, 3).forEach(([key, weapon]) => {
  console.log(`\n${key}:`);
  console.log(`  Name: ${weapon.name}`);
  console.log(`  Slug: ${weapon.slug}`);
  console.log(`  Bucket: ${weapon.bucket}`);
  console.log(`  Stats: ${JSON.stringify(weapon.stats || {})}`);
  console.log(`  Effect: ${weapon.effect || 'No effect'}`);
});
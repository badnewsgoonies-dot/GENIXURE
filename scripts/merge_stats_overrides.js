const fs = require('fs');
const path = require('path');

// Load both files - make paths relative to project root
const projectRoot = path.resolve(__dirname, '..');
const detailsPath = path.join(projectRoot, 'details.json');
const overridesPath = path.join(projectRoot, 'stats_overrides.json');
const compiledPath = path.join(projectRoot, 'compiled_details.json');

console.log('🔄 Building compiled details.json from base + overrides...\n');

// Load base details (keep this file pure/untouched)
const baseDetails = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));

// Load stat overrides
let overrides = {};
if (fs.existsSync(overridesPath)) {
  overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
} else {
  console.log('⚠️  No stats_overrides.json found - using base details only');
}

// Create merged result (don't mutate original)
const compiled = JSON.parse(JSON.stringify(baseDetails)); // deep clone

let changesCount = 0;
let missingItems = [];

// Apply overrides to compiled version
for (const [itemKey, overrideStats] of Object.entries(overrides)) {
  if (compiled[itemKey]) {
    const originalStats = { ...compiled[itemKey].stats };
    
    // Merge override stats into compiled stats
    Object.assign(compiled[itemKey].stats, overrideStats);
    
    console.log(`✅ ${itemKey}:`);
    console.log(`   Original: ${JSON.stringify(originalStats)}`);
    console.log(`   Override: ${JSON.stringify(overrideStats)}`);
    console.log(`   Final:    ${JSON.stringify(compiled[itemKey].stats)}\n`);
    
    changesCount++;
  } else {
    missingItems.push(itemKey);
    console.log(`⚠️  ${itemKey} not found in details.json`);
  }
}

console.log(`\n📊 Build Summary:`);
console.log(`   - Base items: ${Object.keys(baseDetails).length}`);
console.log(`   - Stat overrides applied: ${changesCount} items`);
console.log(`   - Missing items: ${missingItems.length}`);

if (missingItems.length > 0) {
  console.log(`\n❌ Missing items in details.json:`);
  missingItems.forEach(item => console.log(`   - ${item}`));
}

// Write compiled output (preserving original files)
fs.writeFileSync(compiledPath, JSON.stringify(compiled, null, 2));
console.log(`\n✅ Wrote compiled_details.json`);

console.log(`\n✨ Build complete! Use compiled_details.json in your application.`);
console.log(`📁 Files:`);
console.log(`   - details.json (base data, unchanged)`);
console.log(`   - stats_overrides.json (customizations, unchanged)`);
console.log(`   - compiled_details.json (merged result for production)`);;
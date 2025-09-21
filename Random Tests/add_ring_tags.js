const fs = require('fs');

// Load the data
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

console.log("Finding all ring items and adding 'Ring' tag:");

let changes = [];

// Items that should have the "Ring" tag based on their names
const ringItems = [
    'items/bloodstone_ring',
    'items/citrine_ring',
    'items/citrine_ring_gold',
    'items/emerald_ring',
    'items/emerald_ring_gold',
    'items/obsidian_ring',
    'items/obsidian_ring_gold',
    'items/pyrite_ring',
    'items/pyrite_ring_gold',
    'items/ruby_ring',
    'items/ruby_ring_gold',
    'items/sapphire_ring',
    'items/sapphire_ring_gold'
];

// Also check for items with "ring" in their key
for (const [key, item] of Object.entries(details)) {
    if (key.includes('ring') && !ringItems.includes(key)) {
        // Only add if it actually looks like a ring item (not clearspring items)
        if (!key.includes('clearspring') && !key.includes('earring')) {
            ringItems.push(key);
        }
    }
}

console.log(`\nProcessing ${ringItems.length} potential ring items:\n`);

ringItems.forEach(key => {
    if (details[key]) {
        const item = details[key];
        console.log(`${key}:`);
        console.log(`  Name: ${item.name}`);
        console.log(`  Current tags: [${(item.tags || []).join(', ')}]`);
        
        // Ensure tags array exists and add "Ring" if not present
        if (!item.tags) {
            item.tags = [];
        }
        
        if (!item.tags.includes('Ring')) {
            item.tags.push('Ring');
            changes.push(key);
            console.log(`  ✓ Added 'Ring' tag`);
        } else {
            console.log(`  - Already has 'Ring' tag`);
        }
        console.log(`  New tags: [${item.tags.join(', ')}]`);
        console.log('');
    } else {
        console.log(`${key}: NOT FOUND`);
    }
});

if (changes.length > 0) {
    // Write back the updated data
    fs.writeFileSync('./details.json', JSON.stringify(details, null, 2));
    console.log(`\n✅ Updated ${changes.length} items with 'Ring' tag:`);
    changes.forEach(key => console.log(`  - ${key}`));
    console.log(`\nSaved changes to details.json`);
} else {
    console.log(`\n⚠️ No changes needed - all ring items already have 'Ring' tag`);
}
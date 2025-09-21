const fs = require('fs');

// Load the data
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

console.log("Finding all items with 'Ring' tag:");

let ringItems = [];

for (const [key, item] of Object.entries(details)) {
    if (item.tags && item.tags.includes('Ring')) {
        ringItems.push({
            key: key,
            name: item.name,
            slug: item.slug,
            tags: item.tags,
            effect: item.effect || 'No effect description',
            effects: item.effects || []
        });
    }
}

console.log(`\nFound ${ringItems.length} items with 'Ring' tag:\n`);

ringItems.forEach(item => {
    console.log(`${item.key}:`);
    console.log(`  Name: ${item.name}`);
    console.log(`  Tags: [${item.tags.join(', ')}]`);
    console.log(`  Effect: ${item.effect}`);
    console.log(`  Has effects array: ${item.effects.length > 0 ? 'Yes (' + item.effects.length + ')' : 'No'}`);
    console.log('');
});

if (ringItems.length === 0) {
    console.log("No items found with 'Ring' tag!");
    console.log("\nLet's check some items with 'ring' in their name or slug:");
    
    let possibleRings = [];
    for (const [key, item] of Object.entries(details)) {
        if (key.includes('ring') || (item.name && item.name.toLowerCase().includes('ring'))) {
            possibleRings.push({
                key: key,
                name: item.name,
                tags: item.tags || [],
                effect: item.effect || 'No effect description'
            });
        }
    }
    
    console.log(`\nFound ${possibleRings.length} items with 'ring' in name/key:\n`);
    
    possibleRings.slice(0, 10).forEach(item => {
        console.log(`${item.key}:`);
        console.log(`  Name: ${item.name}`);
        console.log(`  Tags: [${item.tags.join(', ')}]`);
        console.log(`  Effect: ${item.effect}`);
        console.log('');
    });
}
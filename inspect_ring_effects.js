const fs = require('fs');

// Load the data
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

console.log("Finding Ring items with turn-based effects:\n");

for (const [key, item] of Object.entries(details)) {
    if (item.tags && item.tags.includes('Ring')) {
        console.log(`${key}:`);
        console.log(`  Name: ${item.name}`);
        console.log(`  Effect: ${item.effect || 'No effect description'}`);
        console.log(`  Effects array: ${JSON.stringify(item.effects, null, 2)}`);
        console.log('');
    }
}
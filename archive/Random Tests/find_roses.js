const fs = require('fs');
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

console.log('Rose items found:');
Object.entries(details).forEach(([key, item]) => {
  if (item.effect && item.effect.toLowerCase().includes('you can only equip 1 rose')) {
    const hasMigration = !!item.effects;
    const hasRoseTag = item.tags && item.tags.includes('Rose');
    console.log(`${key}: migrated=${hasMigration}, roseTag=${hasRoseTag}`);
    if (!hasMigration) {
      console.log(`  Effect: ${item.effect}`);
    }
  }
});

console.log('\nItems with Rose in name but no effects:');
Object.entries(details).forEach(([key, item]) => {
  if (key.includes('rose') && !item.effects) {
    console.log(`${key}: ${item.effect || 'No effect'}`);
  }
});
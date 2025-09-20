const fs = require('fs');

const details = JSON.parse(fs.readFileSync('details.json', 'utf8'));

const items = Object.keys(details)
  .filter(key => key.startsWith('items/'))
  .map(key => ({key, item: details[key]}))
  .filter(item => item.item.effect && !item.item.effects);

console.log('Items with simple "Turn Start: Deal X damage" effects:');
const turnStartDeal = items.filter(item => 
  item.item.effect.includes('Turn Start: Deal') && 
  !item.item.effect.includes('if') &&
  !item.item.effect.includes('per') &&
  !item.item.effect.includes('each') &&
  !item.item.effect.includes('for')
);
turnStartDeal.forEach(item => {
  console.log(`${item.key}: ${item.item.effect}`);
});

console.log('\nItems with simple "Turn Start: Gain X" effects:');
const turnStartGain = items.filter(item => 
  item.item.effect.includes('Turn Start: Gain') && 
  !item.item.effect.includes('if') &&
  !item.item.effect.includes('per') &&
  !item.item.effect.includes('each') &&
  !item.item.effect.includes('for')
);
turnStartGain.forEach(item => {
  console.log(`${item.key}: ${item.item.effect}`);
});

console.log('\nItems with simple "Turn Start: Lose X" effects:');
const turnStartLose = items.filter(item => 
  item.item.effect.includes('Turn Start: Lose') && 
  !item.item.effect.includes('if') &&
  !item.item.effect.includes('per') &&
  !item.item.effect.includes('each') &&
  !item.item.effect.includes('for')
);
turnStartLose.forEach(item => {
  console.log(`${item.key}: ${item.item.effect}`);
});

console.log('\n--- Total unmigrated items:', items.length);
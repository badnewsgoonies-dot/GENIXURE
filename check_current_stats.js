const fs = require('fs');

// Load current details.json
const details = JSON.parse(fs.readFileSync('details.json', 'utf8'));

console.log('📊 Current stats in details.json:\n');

const itemsToCheck = [
  'items/sapphire_crown',
  'items/shield_of_the_hero', 
  'items/sanguine_rose',
  'items/emerald_crown'
];

itemsToCheck.forEach(item => {
  if (details[item] && details[item].stats) {
    console.log(`${item}:`);
    console.log(`  ${JSON.stringify(details[item].stats)}`);
    console.log('');
  }
});

console.log('🤔 Based on your feedback, which stats are wrong?');
console.log('Please let me know what the correct stats should be for each item.');
const fs = require('fs');
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

const unmigrated = Object.entries(details).filter(([key, item]) => 
  !item.effects && item.effect && item.effect.toLowerCase().includes('battle start')
).map(([key, item]) => ({ key, effect: item.effect }));

console.log(`Found ${unmigrated.length} remaining Battle Start items:`);
unmigrated.forEach((item, i) => console.log(`${i+1}. ${item.key}: ${item.effect}`));
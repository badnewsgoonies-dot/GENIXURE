// Debug item/weapon stat loading with correct items
const { simulate } = require('./heic_sim.js');

console.log("🔍 Debugging item/weapon stat loading...\n");

const fs = require('fs');
const DETAILS = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

console.log("=== Weapon: bee_stinger stats ===");
const beeStinger = DETAILS['weapons/bee_stinger'];
console.log("Bee stinger weapon data:", JSON.stringify(beeStinger.stats, null, 2));

// Find an actual item with attack stats
console.log("\n=== Finding items with attack stats ===");
const itemsWithAttack = Object.keys(DETAILS).filter(key => {
  const item = DETAILS[key];
  return key.startsWith('items/') && item.stats && item.stats.attack > 0;
}).slice(0, 3);

console.log("Items with attack stats:", itemsWithAttack);
itemsWithAttack.forEach(key => {
  const item = DETAILS[key];
  console.log(`  ${key}: attack=${item.stats.attack}, name="${item.name}"`);
});

// Test with a weapon that has attack stats
console.log("\n=== Testing with bee_stinger weapon ===");
const result1 = simulate(
  { weapon: 'weapons/bee_stinger', items: [] }, 
  { items: [] },
  { seed: 123, maxTurns: 5, includeSummary: true }
);

console.log(`Result: ${result1.result} (${result1.rounds} rounds)`);
console.log("Left strikes:", `${result1.summary.left.strikesLanded}/${result1.summary.left.strikesAttempted}`);
console.log("Right strikes:", `${result1.summary.right.strikesLanded}/${result1.summary.right.strikesAttempted}`);

// Test with an item that has attack (if any exist)
if (itemsWithAttack.length > 0) {
  console.log(`\n=== Testing with attack item: ${itemsWithAttack[0]} ===`);
  const result2 = simulate(
    { items: [itemsWithAttack[0]] }, 
    { items: [] },
    { seed: 123, maxTurns: 5, includeSummary: true }
  );
  
  console.log(`Result: ${result2.result} (${result2.rounds} rounds)`);
  console.log("Left strikes:", `${result2.summary.left.strikesLanded}/${result2.summary.left.strikesAttempted}`);
  console.log("Right strikes:", `${result2.summary.right.strikesLanded}/${result2.summary.right.strikesAttempted}`);
  
  console.log("\nBattle log:");
  result2.log.slice(0, 10).forEach((line, i) => console.log(`${i + 1}. ${line}`));
}
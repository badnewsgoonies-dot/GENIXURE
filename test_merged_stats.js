const { simulate, Fighter } = require('./heic_sim.js');

console.log('🧪 Testing merged stats from details.json...\n');

// Test some items that had stats in the overrides file
const testItems = [
  'items/sapphire_crown',     // Should have: armor: 5, health: -2, speed: 3
  'items/shield_of_the_hero', // Should have: speed: -3
  'items/sanguine_rose',      // Should have: attack: 3, health: 4, speed: 3
  'items/emerald_crown',      // Should have: attack: -1, health: 8
];

testItems.forEach(item => {
  console.log(`\n=== Testing ${item} ===`);
  
  // Create fighters with and without the item
  const fighterWithItem = new Fighter({
    name: 'WithItem',
    items: [item]
  });
  
  const fighterWithoutItem = new Fighter({
    name: 'WithoutItem',
    items: []
  });
  
  console.log('Fighter without item:', {
    hp: fighterWithoutItem.hp,
    atk: fighterWithoutItem.atk,
    armor: fighterWithoutItem.armor,
    speed: fighterWithoutItem.speed
  });
  
  console.log('Fighter with item:   ', {
    hp: fighterWithItem.hp,
    atk: fighterWithItem.atk,
    armor: fighterWithItem.armor,
    speed: fighterWithItem.speed
  });
  
  const statDiff = {
    hp: fighterWithItem.hp - fighterWithoutItem.hp,
    atk: fighterWithItem.atk - fighterWithoutItem.atk,
    armor: fighterWithItem.armor - fighterWithoutItem.armor,
    speed: fighterWithItem.speed - fighterWithoutItem.speed
  };
  
  console.log('Stat difference:     ', statDiff);
  
  // Load details to check expected stats
  const details = global.HEIC_DETAILS[item];
  if (details && details.stats) {
    console.log('Expected from item:  ', details.stats);
  }
});

console.log('\n=== Testing a simple battle ===');

// Test a battle with items that have stats
const result = simulate(
  { 
    name: 'Player',
    items: ['items/sapphire_crown', 'items/sanguine_rose'] 
  },
  { 
    name: 'Enemy',
    items: ['items/shield_of_the_hero'] 
  },
  { maxTurns: 10, includeSummary: false }
);

console.log(`Battle result: ${result.result} in ${result.rounds} rounds`);
console.log('Final log entries:');
result.log.slice(-3).forEach(entry => console.log(`  ${entry}`));

console.log('\n✅ Stats merge test complete!');
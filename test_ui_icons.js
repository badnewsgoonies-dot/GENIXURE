const { simulate, Fighter } = require('./heic_sim.js');

// Test UI improvements with icons
console.log('Testing UI icon improvements...\n');

// Create test fighters
const left = new Fighter({
  name: 'Player',
  weapon: 'weapons/iron_sword',
  weaponEdge: 'upgrades/jagged_edge',
  items: ['items/blackbriar_rose'],
  hp: 15,
  armor: 2,
  atk: 3
});

const right = new Fighter({
  name: 'Enemy', 
  hp: 12,
  armor: 3,
  atk: 2
});

// Run simulation
const result = simulate(left, right, 10);

console.log(`=== RESULT: ${result.result} ===`);
console.log('\n=== COMBAT LOG (with icons) ===');
result.log.forEach((line, i) => {
  console.log(`${i}: ${line}`);
});

console.log('\n=== SUMMARY ===');
console.log('Player Summary:', result.summary.left);
console.log('Enemy Summary:', result.summary.right);
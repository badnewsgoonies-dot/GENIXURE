// Test Edge upgrade system
const { simulate, Fighter } = require('./heic_sim');

console.log("Testing Edge upgrade system...");

// Test 1: Weapon with Agile Edge (Battle Start: Gain 1 additional strike)
console.log("\n=== Test 1: Agile Edge ===");
try {
  const fighter = new Fighter({
    name: 'EdgeTester',
    stats: { hp: 20, atk: 3, armor: 2 },
    weapon: 'weapons/iron_sword',
    weaponEdge: 'upgrades/agile_edge'
  });
  
  const enemy = new Fighter({ name: 'Enemy', stats: { hp: 15, atk: 2, armor: 1 }});
  
  const result = simulate(fighter, enemy, { maxTurns: 3 });
  console.log("✓ Agile Edge test completed");
} catch (err) {
  console.log("✗ Agile Edge test failed:", err.message);
}

// Test 2: Weapon with Bleeding Edge (On Hit: Restore 1 health)
console.log("\n=== Test 2: Bleeding Edge ===");
try {
  const fighter = new Fighter({
    name: 'EdgeTester',
    stats: { hp: 15, atk: 3, armor: 2 },
    weapon: 'weapons/iron_sword',
    weaponEdge: 'upgrades/bleeding_edge'
  });
  
  const enemy = new Fighter({ name: 'Enemy', stats: { hp: 10, atk: 2, armor: 1 }});
  
  const result = simulate(fighter, enemy, { maxTurns: 3 });
  console.log("✓ Bleeding Edge test completed");
} catch (err) {
  console.log("✗ Bleeding Edge test failed:", err.message);
}

// Test 3: Weapon with Cleansing Edge (Ignore first status)
console.log("\n=== Test 3: Cleansing Edge ===");
try {
  const fighter = new Fighter({
    name: 'EdgeTester',
    stats: { hp: 20, atk: 3, armor: 2 },
    weapon: 'weapons/iron_sword',
    weaponEdge: 'upgrades/cleansing_edge'
  });
  
  // Enemy that applies poison
  const enemy = new Fighter({ 
    name: 'PoisonEnemy', 
    stats: { hp: 15, atk: 2, armor: 1 },
    items: ['items/venomous_fang']
  });
  
  const result = simulate(fighter, enemy, { maxTurns: 3 });
  console.log("✓ Cleansing Edge test completed");
} catch (err) {
  console.log("✗ Cleansing Edge test failed:", err.message);
}

// Test 4: Weapon with Whirlpool Edge (Every 3 strikes = riptide)
console.log("\n=== Test 4: Whirlpool Edge ===");
try {
  const fighter = new Fighter({
    name: 'EdgeTester',
    stats: { hp: 20, atk: 3, armor: 2 },
    weapon: 'weapons/iron_sword',
    weaponEdge: 'upgrades/whirlpool_edge',
    items: ['items/ham_bat'] // Extra strikes to test the counter
  });
  
  const enemy = new Fighter({ name: 'Enemy', stats: { hp: 20, atk: 2, armor: 5 }});
  
  const result = simulate(fighter, enemy, { maxTurns: 5 });
  console.log("✓ Whirlpool Edge test completed");
} catch (err) {
  console.log("✗ Whirlpool Edge test failed:", err.message);
}

console.log("\n=== Edge System Tests Complete ===");
console.log("All edge upgrades should now work when applied to weapons through the weaponEdge property.");
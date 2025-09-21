// Test script to verify migrated items are working correctly
console.log("Testing migrated items...");

// Test 1: Citrine Earring - should gain speed every other turn
console.log("\n=== Testing Citrine Earring ===");
const fighter1 = new Fighter({ name: 'TestFighter1', hp: 20, armor: 0, speed: 1 });
fighter1.items = ['items/citrine_earring'];
fighter1.flags = { turnCount: 0 };

console.log(`Initial speed: ${fighter1.speed}`);
// Simulate turn starts
for (let turn = 0; turn < 5; turn++) {
  fighter1.flags.turnCount = turn;
  const enemy = new Fighter({ name: 'Enemy', hp: 20 });
  runEffects('turnStart', fighter1, enemy, (msg) => console.log(msg));
  console.log(`Turn ${turn}: Speed = ${fighter1.speed}`);
}

// Test 2: Corroded Bone - should convert enemy health to armor
console.log("\n=== Testing Corroded Bone ===");
const fighter2 = new Fighter({ name: 'TestFighter2', hp: 20, armor: 0, speed: 0 });
const enemy2 = new Fighter({ name: 'Enemy', hp: 20, armor: 0, speed: 0 });
fighter2.items = ['items/corroded_bone'];

console.log(`Before battle - Fighter armor: ${fighter2.armor}, Enemy health: ${enemy2.health}`);
runEffects('battleStart', fighter2, enemy2, (msg) => console.log(msg));
console.log(`After battleStart - Fighter armor: ${fighter2.armor}, Enemy health: ${enemy2.health}`);

// Test 3: Crimson Fang - should lose health and gain extra strikes if at full health
console.log("\n=== Testing Crimson Fang ===");
const fighter3 = new Fighter({ name: 'TestFighter3', hp: 20, armor: 0, speed: 0 });
fighter3.hpMax = 20;
const enemy3 = new Fighter({ name: 'Enemy', hp: 20, armor: 0, speed: 0 });
fighter3.items = ['items/crimson_fang'];

console.log(`Before battle - Fighter health: ${fighter3.health}/${fighter3.hpMax}, Extra strikes: ${fighter3.extraStrikes || 0}`);
runEffects('battleStart', fighter3, enemy3, (msg) => console.log(msg));
console.log(`After battleStart - Fighter health: ${fighter3.health}/${fighter3.hpMax}, Extra strikes: ${fighter3.extraStrikes || 0}`);

// Test 4: Clearspring Cloak - should remove statuses and gain armor when exposed
console.log("\n=== Testing Clearspring Cloak ===");
const fighter4 = new Fighter({ name: 'TestFighter4', hp: 20, armor: 0, speed: 0 });
const enemy4 = new Fighter({ name: 'Enemy', hp: 20, armor: 0, speed: 0 });
fighter4.items = ['items/clearspring_cloak'];
fighter4.statuses.poison = 3;
fighter4.statuses.acid = 2;

console.log(`Before exposed - Fighter armor: ${fighter4.armor}, Poison: ${fighter4.statuses.poison}, Acid: ${fighter4.statuses.acid}`);
runEffects('onExposed', fighter4, enemy4, (msg) => console.log(msg));
console.log(`After exposed - Fighter armor: ${fighter4.armor}, Poison: ${fighter4.statuses.poison}, Acid: ${fighter4.statuses.acid}`);

console.log("\nTest completed!");
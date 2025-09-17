// Test script to verify recently migrated items are working correctly
console.log("Testing recently migrated items...");

// Mock the Fighter class and related functions if not available
if (typeof Fighter === 'undefined') {
    console.log("Fighter class not found - this test needs to run in the browser context");
    console.log("Please open the browser console and load this script there");
}

// Test helper function
function createTestFighter(name, hp = 20, armor = 0, speed = 0, items = []) {
    const fighter = new Fighter({ name, hp, armor, speed });
    fighter.items = items;
    fighter.hpMax = hp;
    fighter.baseArmor = armor;
    return fighter;
}

function runTest(testName, testFn) {
    console.log(`\n=== ${testName} ===`);
    try {
        testFn();
        console.log(`✅ ${testName} completed`);
    } catch (error) {
        console.error(`❌ ${testName} failed:`, error);
    }
}

// Test 1: Blood Sausage - should heal 5 times on battle start
runTest("Blood Sausage - Heal Loop", () => {
    const fighter = createTestFighter('TestFighter', 15, 0, 0, ['items/blood_sausage']);
    const enemy = createTestFighter('Enemy', 20);
    
    console.log(`Initial health: ${fighter.hp}/${fighter.hpMax}`);
    runEffects('battleStart', fighter, enemy, (msg) => console.log(msg));
    console.log(`Final health: ${fighter.hp}/${fighter.hpMax}`);
    
    if (fighter.hp !== Math.min(20, 15 + 5)) {
        throw new Error(`Expected health to be ${Math.min(20, 15 + 5)}, got ${fighter.hp}`);
    }
});

// Test 2: Friendship Bracelet - should reduce enemy attack on battle start
runTest("Friendship Bracelet - Reduce Enemy Attack", () => {
    const fighter = createTestFighter('TestFighter', 20, 0, 0, ['items/friendship_bracelet']);
    const enemy = createTestFighter('Enemy', 20, 0, 0);
    enemy.atk = 5;
    
    console.log(`Enemy initial attack: ${enemy.atk}`);
    runEffects('battleStart', fighter, enemy, (msg) => console.log(msg));
    console.log(`Enemy final attack: ${enemy.atk}`);
    
    if (enemy.atk !== 4) {
        throw new Error(`Expected enemy attack to be 4, got ${enemy.atk}`);
    }
});

// Test 3: Poisonous Mushroom - should gain poison on turn start
runTest("Poisonous Mushroom - Gain Poison", () => {
    const fighter = createTestFighter('TestFighter', 20, 0, 0, ['items/poisonous_mushroom']);
    const enemy = createTestFighter('Enemy', 20);
    
    console.log(`Initial poison: ${fighter.statuses.poison}`);
    runEffects('turnStart', fighter, enemy, (msg) => console.log(msg));
    console.log(`Final poison: ${fighter.statuses.poison}`);
    
    if (fighter.statuses.poison !== 1) {
        throw new Error(`Expected poison to be 1, got ${fighter.statuses.poison}`);
    }
});

// Test 4: Soap Stone - should spend speed for temp attack on first turn
runTest("Soap Stone - First Turn Speed to Attack", () => {
    const fighter = createTestFighter('TestFighter', 20, 0, 5, ['items/soap_stone']);
    const enemy = createTestFighter('Enemy', 20);
    fighter.flags.firstTurn = true;
    
    console.log(`Initial speed: ${fighter.speed}, tempAtk: ${fighter.tempAtk || 0}`);
    runEffects('turnStart', fighter, enemy, (msg) => console.log(msg));
    console.log(`Final speed: ${fighter.speed}, tempAtk: ${fighter.tempAtk || 0}`);
    
    if (fighter.speed !== 3 || fighter.tempAtk !== 4) {
        throw new Error(`Expected speed 3 and tempAtk 4, got speed ${fighter.speed} and tempAtk ${fighter.tempAtk}`);
    }
});

// Test 5: Bramble Belt - should gain thorns and give enemy extra strikes
runTest("Bramble Belt - Thorns and Enemy Extra Strikes", () => {
    const fighter = createTestFighter('TestFighter', 20, 0, 0, ['items/bramble_belt']);
    const enemy = createTestFighter('Enemy', 20);
    
    console.log(`Initial thorns: ${fighter.statuses.thorns}, enemy extraStrikes: ${enemy.extraStrikes || 0}`);
    runEffects('battleStart', fighter, enemy, (msg) => console.log(msg));
    console.log(`Final thorns: ${fighter.statuses.thorns}, enemy extraStrikes: ${enemy.extraStrikes || 0}`);
    
    if (fighter.statuses.thorns !== 1 || enemy.extraStrikes !== 1) {
        throw new Error(`Expected thorns 1 and enemy extraStrikes 1, got thorns ${fighter.statuses.thorns} and extraStrikes ${enemy.extraStrikes}`);
    }
});

// Test 6: Acidic Witherleaf - should give enemy acid equal to speed
runTest("Acidic Witherleaf - Give Enemy Acid Equal to Speed", () => {
    const fighter = createTestFighter('TestFighter', 20, 0, 3, ['items/acidic_witherleaf']);
    const enemy = createTestFighter('Enemy', 20);
    
    console.log(`Fighter speed: ${fighter.speed}, enemy initial acid: ${enemy.statuses.acid}`);
    runEffects('battleStart', fighter, enemy, (msg) => console.log(msg));
    console.log(`Enemy final acid: ${enemy.statuses.acid}`);
    
    if (enemy.statuses.acid !== 3) {
        throw new Error(`Expected enemy acid to be 3, got ${enemy.statuses.acid}`);
    }
});

// Test 7: Slime Booster - should convert acid to attack
runTest("Slime Booster - Convert Acid to Attack", () => {
    const fighter = createTestFighter('TestFighter', 20, 0, 0, ['items/slime_booster']);
    const enemy = createTestFighter('Enemy', 20);
    fighter.statuses.acid = 2;
    
    console.log(`Initial acid: ${fighter.statuses.acid}, tempAtk: ${fighter.tempAtk || 0}`);
    runEffects('battleStart', fighter, enemy, (msg) => console.log(msg));
    console.log(`Final acid: ${fighter.statuses.acid}, tempAtk: ${fighter.tempAtk || 0}`);
    
    if (fighter.statuses.acid !== 1 || fighter.tempAtk !== 2) {
        throw new Error(`Expected acid 1 and tempAtk 2, got acid ${fighter.statuses.acid} and tempAtk ${fighter.tempAtk}`);
    }
});

// Test 8: Holy Tome - should register countdown
runTest("Holy Tome - Register Countdown", () => {
    const fighter = createTestFighter('TestFighter', 20, 0, 0, ['items/holy_tome']);
    const enemy = createTestFighter('Enemy', 20);
    
    console.log(`Initial countdowns: ${fighter.countdowns?.length || 0}`);
    runEffects('battleStart', fighter, enemy, (msg) => console.log(msg));
    console.log(`Final countdowns: ${fighter.countdowns?.length || 0}`);
    
    if (!fighter.countdowns || fighter.countdowns.length !== 1) {
        throw new Error(`Expected 1 countdown, got ${fighter.countdowns?.length || 0}`);
    }
    
    const countdown = fighter.countdowns[0];
    if (countdown.turnsLeft !== 6 || countdown.name !== 'Holy Tome') {
        throw new Error(`Expected countdown with 6 turns and name 'Holy Tome', got ${countdown.turnsLeft} turns and name '${countdown.name}'`);
    }
});

// Test 9: Acid Mutation - should gain acid and temp attack from acid
runTest("Acid Mutation - Acid and Temp Attack", () => {
    const fighter = createTestFighter('TestFighter', 20, 0, 0, ['items/acid_mutation']);
    const enemy = createTestFighter('Enemy', 20);
    
    // Battle start should give acid
    console.log(`Initial acid: ${fighter.statuses.acid}`);
    runEffects('battleStart', fighter, enemy, (msg) => console.log(msg));
    console.log(`After battleStart acid: ${fighter.statuses.acid}`);
    
    // Turn start should convert acid to temp attack
    console.log(`Before turnStart tempAtk: ${fighter.tempAtk || 0}`);
    runEffects('turnStart', fighter, enemy, (msg) => console.log(msg));
    console.log(`After turnStart tempAtk: ${fighter.tempAtk || 0}`);
    
    if (fighter.statuses.acid !== 1 || fighter.tempAtk !== 1) {
        throw new Error(`Expected acid 1 and tempAtk 1, got acid ${fighter.statuses.acid} and tempAtk ${fighter.tempAtk}`);
    }
});

// Test 10: Earrings of Respite - should heal on even turns
runTest("Earrings of Respite - Even Turn Healing", () => {
    const fighter = createTestFighter('TestFighter', 15, 0, 0, ['items/earrings_of_respite']);
    const enemy = createTestFighter('Enemy', 20);
    
    // Test odd turn (turn 1) - should not heal
    fighter.turnCount = 1;
    fighter.flags.turnCount = 1;
    const healthBefore = fighter.hp;
    console.log(`Turn 1 (odd) - Initial health: ${fighter.hp}`);
    runEffects('turnEnd', fighter, enemy, (msg) => console.log(msg));
    console.log(`Turn 1 - Final health: ${fighter.hp}`);
    
    // Test even turn (turn 2) - should heal
    fighter.turnCount = 2;
    fighter.flags.turnCount = 2;
    console.log(`Turn 2 (even) - Initial health: ${fighter.hp}`);
    runEffects('turnEnd', fighter, enemy, (msg) => console.log(msg));
    console.log(`Turn 2 - Final health: ${fighter.hp}`);
    
    if (fighter.hp <= healthBefore) {
        throw new Error(`Expected health to increase on even turn`);
    }
});

console.log("\n🎉 All migrated item tests completed!");
console.log("Open browser console at http://localhost:5500 and paste this script to run tests in full environment");
const { simulate } = require('./heic_sim.js');

console.log("Comprehensive Highborn Ring Doubling Test:\n");

console.log("=== Test 1: Highborn with multiple ring effects ===");

const highbornTest = simulate(
    {
        name: "Highborn Master",
        items: [
            'items/bloodstone_ring',  // Battle Start: Gain 5 max health and restore 5 health (should double to 10+10)
            'items/citrine_ring',     // Battle Start: Gain 1 gold (should double to 2)
            'items/emerald_ring'      // Battle Start: Restore 3 Health (should double to 6)
        ]
    },
    { name: "Test Dummy", items: [] },
    { includeSummary: true, seed: 777, maxTurns: 2 }
);

console.log("Highborn Master Battle Log:");
highbornTest.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));
console.log(`Result: ${highbornTest.result} (${highbornTest.rounds} rounds)`);

console.log("\n" + "=".repeat(80) + "\n");

console.log("=== Test 2: Same rings without Highborn (only 2 rings) ===");

const normalTest = simulate(
    {
        name: "Normal Fighter",
        items: [
            'items/bloodstone_ring',  // Battle Start: Gain 5 max health and restore 5 health
            'items/emerald_ring'      // Battle Start: Restore 3 Health (only 2 rings = no Highborn)
        ]
    },
    { name: "Test Dummy", items: [] },
    { includeSummary: true, seed: 777, maxTurns: 2 }
);

console.log("Normal Fighter Battle Log:");
normalTest.log.forEach((line, i) => console.log(`${i + 1}. ${line}`));
console.log(`Result: ${normalTest.result} (${normalTest.rounds} rounds)`);

console.log("\n" + "=".repeat(80) + "\n");

console.log("=== Health Comparison ===");
// Extract starting HP from the first turn message
const highbornHP = highbornTest.log.find(line => line.includes('-- Turn 1 --'))?.match(/PlayerHP: (\d+)/)?.[1];
const normalHP = normalTest.log.find(line => line.includes('-- Turn 1 --'))?.match(/PlayerHP: (\d+)/)?.[1];

console.log(`Highborn Master starting HP: ${highbornHP || 'Unknown'}`);
console.log(`Normal Fighter starting HP: ${normalHP || 'Unknown'}`);

if (highbornHP && normalHP) {
    const difference = parseInt(highbornHP) - parseInt(normalHP);
    console.log(`Difference: ${difference} HP`);
    console.log(`Expected difference: ~13 HP (doubled Bloodstone Ring: +10 max health, doubled Emerald Ring: +6 healing, minus Normal Fighter's +8 total)`);
    console.log(`Doubling is ${difference > 10 ? 'WORKING ✅' : 'NOT WORKING ❌'}`);
}

console.log("\n=== Set Activation Messages ===");
const highbornSetMsg = highbornTest.log.find(line => line.includes('Highborn'));
const normalSetMsg = normalTest.log.find(line => line.includes('Highborn'));

console.log(`Highborn Fighter: ${highbornSetMsg ? '✅ Set activated' : '❌ No set activation'}`);
console.log(`Normal Fighter: ${normalSetMsg ? '❌ Unexpected set activation' : '✅ No set activation (correct)'}`);

console.log("\nTest Summary:");
console.log("- Highborn set should activate with 3+ Ring items");
console.log("- Ring effects should trigger twice when Highborn is active");
console.log("- Set activation should happen BEFORE item effects");
console.log("- Non-Highborn fighters should have normal (non-doubled) effects");
// Test the fix for Exposed and Wounded triggers from non-strike damage sources
const { simulate } = require('./heic_sim.js');

console.log('🧪 Testing Exposed and Wounded triggers from non-strike sources...\n');

// Test 1: Acid causes Exposed trigger
console.log('=== TEST 1: Acid → Exposed trigger ===');
try {
  // Use rusty_ring to give enemy acid, enemy has armor to lose and an Exposed effect
  const L = { items: ['items/rusty_ring'], atk: 0 }; // Gives enemy 1 acid, no attack to avoid regular damage
  const R = { 
    stats: { hp: 20, armor: 1, atk: 0, speed: 10 }, // 1 armor so acid triggers exposed quickly
    items: ['items/impressive_physique'] // "Exposed: Stun the enemy for 1 turn" - clear visible effect
  };
  
  const result = simulate(L, R, { maxTurns: 5, seed: 42 });
  console.log('Battle log:');
  result.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
  
  // Look for the Exposed effect (impressive_physique stuns the enemy when exposed)
  const exposedTriggered = result.log.some(line => 
    line.includes('stunned') || line.includes('impressive_physique')
  );
  console.log(`✓ Exposed triggered by Acid: ${exposedTriggered ? 'YES' : 'NO'}`);
  
} catch (e) {
  console.log('❌ Test 1 failed:', e.message);
}

console.log('\n=== TEST 2: Poison → Wounded trigger ===');
try {
  // Use serpent_mask to give enemy poison (equal to attack), add Wounded effect item
  const L = { items: ['items/serpent_mask'], atk: 8 }; // Gives enemy poison equal to attack
  const R = { items: ['items/blackbriar_rose'], hp: 20 }; // High HP to cross 50% threshold, add Wounded item
  
  const result = simulate(L, R, { maxTurns: 5, seed: 123 });
  console.log('Battle log:');
  result.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
  
  // Look for Wounded effects or HP crossing threshold
  const woundedTriggered = result.log.some(line => 
    line.toLowerCase().includes('wounded') || 
    (line.includes('suffers') && line.includes('poison'))
  );
  console.log(`✓ Wounded triggered by Poison: ${woundedTriggered ? 'YES' : 'NO'}`);
  
} catch (e) {
  console.log('❌ Test 2 failed:', e.message);
}

console.log('\n=== TEST 3: Riptide → Wounded trigger (at Turn End) ===');
try {
  // Use explosive_fish to give enemy riptide 
  const L = { items: ['items/explosive_fish'] }; // Gives enemy 1 riptide at battle start
  const R = { 
    stats: { hp: 1, armor: 0, atk: 0, speed: 1 },
    items: ['items/bloody_steak'] // Has "When Wounded: Restore 10 health and gain 5 Armor"
  };
  
  const result = simulate(L, R, { maxTurns: 8, seed: 456 });
  console.log('Battle log:');
  result.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
  
  const woundedTriggered = result.log.some(line => 
    line.includes('heals') || line.includes('gains') && line.includes('armor') && line.includes('bloody_steak')
  );
  const riptideAtTurnEnd = result.log.some(line => line.includes('suffers') && line.includes('riptide damage'));
  console.log(`✓ Wounded triggered by Riptide: ${woundedTriggered ? 'YES' : 'NO'}`);
  console.log(`✓ Riptide processed at turn end: ${riptideAtTurnEnd ? 'YES' : 'NO'}`);
  
} catch (e) {
  console.log('❌ Test 3 failed:', e.message);
}

console.log('\n=== TEST 4: Verify Exposed only triggers once ===');
try {
  // Test that Exposed doesn't re-trigger if armor is already 0
  const L = { items: ['items/rusty_ring'] }; // Gives enemy acid 
  const R = { 
    stats: { hp: 20, armor: 1, atk: 0, speed: 10 }, // 1 armor so exposed triggers once
    items: ['items/impressive_physique'] // "Exposed: Stun the enemy for 1 turn"
  };
  
  const result = simulate(L, R, { maxTurns: 6, seed: 789 });
  console.log('Battle log:');
  result.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
  
  const exposedCount = result.log.filter(line => 
    line.includes('stunned') || line.includes('impressive_physique')
  ).length;
  console.log(`✓ Exposed triggered count: ${exposedCount} (should be 1)`);
  
} catch (e) {
  console.log('❌ Test 4 failed:', e.message);
}

console.log('\n🎯 Tests completed!');
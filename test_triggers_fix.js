// Test the fix for Exposed and Wounded triggers from non-strike damage sources
const { simulate } = require('./heic_sim.js');

console.log('🧪 Testing Exposed and Wounded triggers from non-strike sources...\n');

// Test 1: Acid causes Exposed trigger
console.log('=== TEST 1: Acid → Exposed trigger ===');
try {
  // Create a fighter with armor who will get acid and lose all armor to trigger Exposed
  const L = { 
    items: [], 
    stats: { armor: 2, attack: 1, health: 10, speed: 1 }
  };
  const R = { 
    items: [], 
    stats: { armor: 0, attack: 0, health: 10, speed: 2 },
    // Give R an item that applies acid at battle start
    effects: [{
      trigger: 'battleStart',
      actions: [{ type: 'give_enemy_status', status: 'acid', value: 3 }]
    }]
  };

  const result = simulate(L, R, { maxTurns: 5, seed: 42 });
  console.log('Battle log:');
  result.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
  
  const exposedTriggered = result.log.some(line => line.includes('Exposed') || line.includes('exposed'));
  console.log(`✓ Exposed triggered by Acid: ${exposedTriggered ? 'YES' : 'NO'}`);
  
} catch (e) {
  console.log('❌ Test 1 failed:', e.message);
}

console.log('\n=== TEST 2: Poison → Wounded trigger ===');
try {
  // Create a fighter with high HP who will get poisoned and cross 50% HP to trigger Wounded
  const L = { 
    items: [], 
    stats: { armor: 0, attack: 1, health: 20, speed: 1 }
  };
  const R = { 
    items: [], 
    stats: { armor: 0, attack: 0, health: 10, speed: 2 },
    // Give R an item that applies high poison at battle start
    effects: [{
      trigger: 'battleStart',
      actions: [{ type: 'give_enemy_status', status: 'poison', value: 15 }]
    }]
  };

  const result = simulate(L, R, { maxTurns: 5, seed: 123 });
  console.log('Battle log:');
  result.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
  
  const woundedTriggered = result.log.some(line => line.includes('Wounded') || line.includes('wounded'));
  console.log(`✓ Wounded triggered by Poison: ${woundedTriggered ? 'YES' : 'NO'}`);
  
} catch (e) {
  console.log('❌ Test 2 failed:', e.message);
}

console.log('\n=== TEST 3: Riptide → Wounded trigger (at Turn End) ===');
try {
  // Create a fighter with high HP who will get riptide and cross 50% HP to trigger Wounded
  const L = { 
    items: [], 
    stats: { armor: 0, attack: 1, health: 20, speed: 1 }
  };
  const R = { 
    items: [], 
    stats: { armor: 0, attack: 0, health: 10, speed: 2 },
    // Give R an item that applies high riptide at battle start
    effects: [{
      trigger: 'battleStart',
      actions: [{ type: 'give_enemy_status', status: 'riptide', value: 15 }]
    }]
  };

  const result = simulate(L, R, { maxTurns: 5, seed: 456 });
  console.log('Battle log:');
  result.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
  
  const woundedTriggered = result.log.some(line => line.includes('Wounded') || line.includes('wounded'));
  const riptideAtTurnEnd = result.log.some(line => line.includes('riptide') && line.includes('Turn'));
  console.log(`✓ Wounded triggered by Riptide: ${woundedTriggered ? 'YES' : 'NO'}`);
  console.log(`✓ Riptide processed at turn end: ${riptideAtTurnEnd ? 'YES' : 'NO'}`);
  
} catch (e) {
  console.log('❌ Test 3 failed:', e.message);
}

console.log('\n=== TEST 4: Verify Exposed only triggers once ===');
try {
  // Test that Exposed doesn't re-trigger if armor is already 0
  const L = { 
    items: [], 
    stats: { armor: 1, attack: 1, health: 10, speed: 1 }
  };
  const R = { 
    items: [], 
    stats: { armor: 0, attack: 0, health: 10, speed: 2 },
    // Give R an item that applies acid multiple times
    effects: [
      {
        trigger: 'battleStart',
        actions: [{ type: 'give_enemy_status', status: 'acid', value: 5 }]
      },
      {
        trigger: 'turnStart',
        actions: [{ type: 'give_enemy_status', status: 'acid', value: 2 }]
      }
    ]
  };

  const result = simulate(L, R, { maxTurns: 5, seed: 789 });
  console.log('Battle log:');
  result.log.forEach((line, i) => console.log(`${i+1}. ${line}`));
  
  const exposedCount = result.log.filter(line => line.includes('Exposed') || line.includes('exposed')).length;
  console.log(`✓ Exposed triggered count: ${exposedCount} (should be 1)`);
  
} catch (e) {
  console.log('❌ Test 4 failed:', e.message);
}

console.log('\n🎯 Tests completed!');
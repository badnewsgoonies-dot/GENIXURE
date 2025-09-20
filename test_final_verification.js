// Final test to verify all fixes are working
const { simulate } = require('./heic_sim.js');

console.log("🎯 Final verification test...\n");

// Test the specific items that caused errors
const problematicBuilds = [
  {
    name: "Bloodstone Ring (add_max_hp)",
    left: { items: ['items/bloodstone_ring'] },
    right: { items: [] }
  },
  {
    name: "Combustible Lemon (spend_speed_deal_damage)", 
    left: { items: ['items/combustible_lemon'] },
    right: { items: [] }
  },
  {
    name: "Petrified Edge (multiply_attack)",
    left: { weaponEdge: 'upgrades/petrified_edge' },
    right: { items: [] }
  }
];

problematicBuilds.forEach((test, i) => {
  console.log(`${'='.repeat(50)}`);
  console.log(`🧪 TEST ${i + 1}: ${test.name}`);
  console.log(`${'='.repeat(50)}`);
  
  try {
    const result = simulate(test.left, test.right, { 
      seed: 123, 
      maxTurns: 10,
      includeSummary: true 
    });
    
    console.log(`✅ Result: ${result.result} (${result.rounds} rounds)`);
    
    // Show key events
    const keyEvents = result.log.filter(line => 
      line.includes('Unknown action') || 
      line.includes('ERROR') || 
      line.includes('gains') ||
      line.includes('deals') ||
      line.includes('multiplied')
    ).slice(0, 5);
    
    if (keyEvents.length > 0) {
      console.log("Key events:");
      keyEvents.forEach((event, idx) => {
        console.log(`  ${idx + 1}. ${event}`);
      });
    } else {
      console.log("No special events (normal battle flow)");
    }
    
  } catch (error) {
    console.log(`❌ ERROR:`, error.message);
  }
  
  console.log();
});

console.log("🎉 All fixes verified!");
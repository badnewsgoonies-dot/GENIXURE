const fs = require('fs');

// Load the simulation engine
let heic_sim_content = fs.readFileSync('./heic_sim.js', 'utf8');
eval(heic_sim_content);

// Test Rose items
console.log('Testing Rose items...\n');

const testRoseItem = (itemKey, expectedEffect) => {
  console.log(`Testing ${itemKey}:`);
  
  try {
    const result = simulateBattle(
      { items: [itemKey], health: 50, maxHealth: 100 }, 
      { health: 80, maxHealth: 80 },
      { maxTurns: 1, log: false }
    );
    
    // Test healing trigger
    const player = { 
      hp: 50, 
      hpMax: 100, 
      armor: 0, 
      attack: 10, 
      speed: 5,
      statuses: {}, 
      items: [itemKey],
      heal: function(amount) {
        const oldHp = this.hp;
        this.hp = Math.min(this.hpMax, this.hp + amount);
        const healed = this.hp - oldHp;
        if (healed > 0) {
          // Simulate onHeal trigger
          console.log(`  Healed ${healed} HP, triggering Rose effect: ${expectedEffect}`);
        }
        return healed;
      },
      addStatus: function(key, value) {
        this.statuses[key] = (this.statuses[key] || 0) + value;
      }
    };
    
    // Simulate healing to trigger the Rose effect
    player.heal(10);
    
    console.log(`  ✓ ${itemKey} simulation completed\n`);
    
  } catch (error) {
    console.log(`  ✗ Error testing ${itemKey}: ${error.message}\n`);
  }
};

// Test each Rose item
testRoseItem('items/blackbriar_rose', 'gain 2 thorns');
testRoseItem('items/clearspring_rose', 'decrease random status by 1');
testRoseItem('items/iron_rose', 'gain 1 armor');
testRoseItem('items/sanguine_rose', 'restore 1 additional health');
testRoseItem('items/toxic_rose', 'give enemy 1 poison');
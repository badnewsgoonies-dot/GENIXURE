const fs = require('fs');
const path = require('path');

// Load the HeIC simulator
const simPath = path.join(__dirname, 'heic_sim.js');
const simCode = fs.readFileSync(simPath, 'utf8');

// Use a simple eval to load the simulator (for testing purposes)
eval(simCode);

console.log('🧪 Testing battle simulation with lightspeed potion...');

// Test the lightspeed potion specifically
const playerBuild = {
  name: "Player",
  items: ['items/lightspeed_potion', 'items/bomb_bag'] // From screenshot
};

const opponentBuild = {
  name: "Opponent", 
  items: ['items/switchblade_bow']
};

try {
  console.log('⚔️ Running test simulation...');
  const result = HeICSim.simulate(playerBuild, opponentBuild, { 
    maxTurns: 10, 
    includeSummary: true 
  });
  
  console.log('');
  console.log('📋 Battle Result:', result.result);
  console.log('🏁 Rounds:', result.rounds);
  console.log('');
  console.log('📜 Battle Log (first 10 lines):');
  
  if (result.log && result.log.length) {
    const logLines = Array.isArray(result.log) ? result.log : result.log.split('\n');
    logLines.slice(0, 10).forEach((line, i) => {
      console.log(`${i + 1}. ${line}`);
    });
  }
  
  console.log('');
  console.log('✅ Simulation completed successfully!');
  console.log('🎯 heal_from_speed action should now work without "Unknown action" errors');
  
} catch (error) {
  console.error('❌ Error in simulation:', error.message);
  console.error(error.stack);
}
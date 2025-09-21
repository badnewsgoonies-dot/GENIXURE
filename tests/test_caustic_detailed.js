const HeICSim = require('./heic_sim.js');

console.log('🧪 Testing Caustic Tome with speed specifically...');

// Test with speed
const result = HeICSim.simulate(
  { items: ['items/caustic_tome', 'items/boots_of_sloth'] },  // 10 speed
  { items: [] },
  { seed: 123, maxTurns: 50, includeSummary: false }
);

console.log('\n📊 Result:', result.result, 'in', result.rounds, 'rounds');

// Look specifically for countdown setup and acid effects
let foundCountdown = false;
let foundAcid = false;
let countdownTurns = [];
let acidTurns = [];

result.log.forEach((line, i) => {
  if (line.includes('countdown') || line.includes('Countdown')) {
    foundCountdown = true;
    countdownTurns.push(i + 1);
    console.log(`📅 Turn ${i + 1}: ${line}`);
  }
  if (line.includes('acid') || line.includes('Acid')) {
    foundAcid = true;
    acidTurns.push(i + 1);
    console.log(`🧪 Turn ${i + 1}: ${line}`);
  }
  if (line.includes('Caustic')) {
    console.log(`⚗️ Turn ${i + 1}: ${line}`);
  }
  // Show turns around 15 and 30 (when effects should trigger)
  if (line.includes('-- Turn 14 --') || line.includes('-- Turn 15 --') || 
      line.includes('-- Turn 16 --') || line.includes('-- Turn 30 --') ||
      line.includes('-- Turn 31 --')) {
    console.log(`⏰ ${line}`);
  }
});

console.log(`\n📋 Summary:`);
console.log(`🕒 Countdown setup found: ${foundCountdown}`);
console.log(`🧪 Acid effects found: ${foundAcid}`);
console.log(`📅 Countdown turns: ${countdownTurns}`);
console.log(`🧪 Acid turns: ${acidTurns}`);
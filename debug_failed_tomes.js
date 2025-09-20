const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging failed tomes (Holy Tome & Caustic Tome)...');

// Load the HeIC simulator
const simPath = path.join(__dirname, 'heic_sim.js');
const simCode = fs.readFileSync(simPath, 'utf8');
eval(simCode);

// Test Holy Tome specifically
console.log('\n1️⃣ Holy Tome Debug:');
const holyTest = HeICSim.simulate(
  { name: "Player", items: ['items/holy_tome'] }, 
  { name: "Opponent", items: ['items/belt_of_gluttony'] },
  { maxTurns: 15, seed: 999 }
);

const holyLog = Array.isArray(holyTest.log) ? holyTest.log.join('\n') : holyTest.log;
console.log('📜 Full battle log:');
const holyLogLines = Array.isArray(holyTest.log) ? holyTest.log : holyTest.log.split('\n');
holyLogLines.forEach((line, i) => {
  console.log(`${String(i+1).padStart(2, '0')}. ${line}`);
});

// Check for unknown actions
const unknownActions = holyLog.match(/Unknown action[^\\n]*/g) || [];
if (unknownActions.length > 0) {
  console.log('\n❌ Unknown actions found:');
  unknownActions.forEach(action => console.log(`   ${action}`));
}

// Test Caustic Tome specifically  
console.log('\n\n2️⃣ Caustic Tome Debug:');
const causticTest = HeICSim.simulate(
  { name: "Player", items: ['items/caustic_tome'] }, 
  { name: "Opponent", items: ['items/belt_of_gluttony'] },
  { maxTurns: 15, seed: 888 }
);

const causticLog = Array.isArray(causticTest.log) ? causticTest.log.join('\n') : causticTest.log;
console.log('📜 Full battle log:');
const causticLogLines = Array.isArray(causticTest.log) ? causticTest.log : causticTest.log.split('\n');
causticLogLines.forEach((line, i) => {
  console.log(`${String(i+1).padStart(2, '0')}. ${line}`);
});

// Check for unknown actions
const causticUnknownActions = causticLog.match(/Unknown action[^\\n]*/g) || [];
if (causticUnknownActions.length > 0) {
  console.log('\n❌ Unknown actions found:');
  causticUnknownActions.forEach(action => console.log(`   ${action}`));
}

console.log('\n🔍 Analysis complete - checking details.json for these items...');
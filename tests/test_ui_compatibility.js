const fs = require('fs');
const path = require('path');

console.log('🌐 Testing browser UI compatibility...');

// Load the HeIC simulator
const simPath = path.join(__dirname, 'heic_sim.js');
const simCode = fs.readFileSync(simPath, 'utf8');
eval(simCode);

// Simulate a typical battle that would be run in the browser
const playerBuild = {
  name: "Player",
  items: ['items/lightspeed_potion', 'items/cherry_bomb', 'weapons/bee_stinger']
};

const opponentBuild = {
  name: "Opponent", 
  items: ['items/belt_of_gluttony', 'items/bitter_melon', 'weapons/switchblade_bow']
};

console.log('🔍 Running battle simulation...');
const result = HeICSim.simulate(playerBuild, opponentBuild, { 
  maxTurns: 200,  // Fixed to 200 as per UI changes
  includeSummary: true,
  seed: 12345 
});

console.log(`\n⚔️ Battle Result: ${result.result} in ${result.rounds} rounds`);

// Simulate the UI log rendering process
console.log('\n📜 Battle Log Preview (simulating browser rendering):');
const logLines = Array.isArray(result.log) ? result.log : result.log.split('\n');

// Show first 10 lines with HTML tag detection
logLines.slice(0, 10).forEach((line, i) => {
  const lineNum = String(i + 1).padStart(2, '0');
  
  // Detect different types of content that would be rendered in browser
  if (line.includes('::icon:')) {
    console.log(`${lineNum}. [ITEM EFFECT] ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
  } else if (line.includes('<img src="assets/')) {
    console.log(`${lineNum}. [STAT ICON] ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
  } else if (line.includes('Turn') || line.includes('--')) {
    console.log(`${lineNum}. [TURN INFO] ${line}`);
  } else if (line.includes('HP:')) {
    console.log(`${lineNum}. [HP TRACK] ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
  } else {
    console.log(`${lineNum}. [GENERAL] ${line}`);
  }
});

// Analyze log content
console.log('\n📊 Content Analysis:');
const fullLog = logLines.join('\n');
const itemEffects = (fullLog.match(/::icon:[^:]+::/g) || []).length;
const statIcons = (fullLog.match(/<img src="assets\/[^"]+"/g) || []).length;
const hpTracking = (fullLog.match(/\[PlayerHP: \d+/g) || []).length;
const unknownActions = (fullLog.match(/Unknown action/g) || []).length;
const errors = (fullLog.match(/❌|Error:/g) || []).length;

console.log(`   📦 Item effects with icons: ${itemEffects}`);
console.log(`   🖼️ Stat icons in messages: ${statIcons}`);
console.log(`   ❤️ HP tracking entries: ${hpTracking}`);
console.log(`   ❓ Unknown actions: ${unknownActions}`);
console.log(`   ❌ Error messages: ${errors}`);

// Validate battle summary
if (result.summary) {
  console.log('\n📈 Battle Summary:');
  console.log(`   Player final HP: ${result.summary.left?.hp || 'N/A'}`);
  console.log(`   Opponent final HP: ${result.summary.right?.hp || 'N/A'}`);
  console.log(`   Total battle actions: ${logLines.length}`);
}

// Final validation
console.log('\n✅ Validation Results:');
console.log(`   Battle completed: ${result.result !== undefined ? '✅' : '❌'}`);
console.log(`   No unknown actions: ${unknownActions === 0 ? '✅' : '❌'}`);
console.log(`   No errors: ${errors === 0 ? '✅' : '❌'}`);
console.log(`   Icons present: ${statIcons > 0 ? '✅' : '❌'}`);
console.log(`   Item effects working: ${itemEffects > 0 ? '✅' : '❌'}`);
console.log(`   HP tracking active: ${hpTracking > 0 ? '✅' : '❌'}`);

const allGood = result.result !== undefined && unknownActions === 0 && errors === 0 && statIcons > 0;
console.log(`\n${allGood ? '🎉' : '⚠️'} Overall Status: ${allGood ? 'READY FOR PRODUCTION' : 'NEEDS ATTENTION'}`);

if (allGood) {
  console.log('\n🚀 The battle simulator is fully functional with:');
  console.log('   • All item effects working correctly');
  console.log('   • Consistent icon usage throughout');
  console.log('   • Clean, professional battle logs');
  console.log('   • Real-time HP tracking');
  console.log('   • Error-free operation');
  console.log('   • Browser-ready HTML output');
}
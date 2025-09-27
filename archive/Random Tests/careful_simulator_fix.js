const fs = require('fs');
const path = require('path');

console.log('🔧 Carefully fixing simulator issues...');

// Read the heic_sim.js file
const simPath = path.join(__dirname, 'heic_sim.js');
let simContent = fs.readFileSync(simPath, 'utf8');

console.log('🖼️ Replacing emojis with HTML img tags...');

// Replace all emoji instances in the simulator with proper HTML img tags
const replacements = [
  { emoji: '🛡️', icon: 'armor.png' },
  { emoji: '⚔️', icon: 'attack.png' },
  { emoji: '🏃‍♂️➡️🛡️', icon: 'speed.png' }, // Special case for plated edge
  { emoji: '🏁', icon: 'health.png' }
];

replacements.forEach(({ emoji, icon }) => {
  const imgTag = `<img src="assets/${icon}" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;">`;
  // Use global replacement to catch all instances
  const count = (simContent.match(new RegExp(emoji.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&'), 'g')) || []).length;
  simContent = simContent.split(emoji).join(imgTag);
  console.log(`   ✅ Replaced ${count} instances of ${emoji} with ${icon}`);
});

console.log('➕ Adding heal_from_speed action...');

// Find a good place to add the heal_from_speed action
// Look for an existing action to add it after
const searchFor = 'heal_percentage:';
const searchIndex = simContent.indexOf(searchFor);

if (searchIndex !== -1) {
  // Find the end of the heal_percentage action (look for the closing },)
  let pos = searchIndex;
  let braceCount = 0;
  let foundStart = false;
  
  while (pos < simContent.length) {
    const char = simContent[pos];
    if (char === '{') {
      foundStart = true;
      braceCount++;
    } else if (char === '}' && foundStart) {
      braceCount--;
      if (braceCount === 0) {
        // Found the end of the action
        pos++; // Move past the }
        if (simContent[pos] === ',') pos++; // Move past the comma
        if (simContent[pos] === '\\n') pos++; // Move past newline
        break;
      }
    }
    pos++;
  }
  
  // Insert the new action at this position
  const newAction = `  heal_from_speed: ({ self, other, log, value }) => {
    const healAmount = self.speed || 0;
    if (healAmount > 0) {
      self.hp = Math.min(self.maxHp || self.hp + healAmount, (self.hp || 0) + healAmount);
      log(\`<img src="assets/health.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> \${self.name} restores \${healAmount} health from speed\`);
    }
  },
`;
  
  simContent = simContent.slice(0, pos) + newAction + simContent.slice(pos);
  console.log('   ✅ Added heal_from_speed action after heal_percentage');
} else {
  console.log('   ⚠️ Could not find heal_percentage to insert after');
}

// Write the updated simulator
fs.writeFileSync(simPath, simContent);

// Now fix the index.html final battle message
console.log('🏁 Fixing final battle result message in index.html...');

const indexPath = path.join(__dirname, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Fix the final battle result message
const oldBattleEnd = 'uiLog(`🏁 BATTLE ENDED: ${res.result} in ${res.rounds} rounds!`);';
const newBattleEnd = 'uiLog(`<img src="assets/health.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> BATTLE ENDED: ${res.result} in ${res.rounds} rounds!`);';

if (indexContent.includes(oldBattleEnd)) {
  indexContent = indexContent.replace(oldBattleEnd, newBattleEnd);
  console.log('   ✅ Fixed final battle result message');
} else {
  console.log('   ⚠️ Could not find final battle result message to fix');
}

// Write the updated index.html
fs.writeFileSync(indexPath, indexContent);

console.log('');
console.log('✅ Careful fixes applied successfully!');
console.log('');
console.log('📋 Changes made:');
console.log('   • Replaced all emoji icons in simulator with HTML img tags');
console.log('   • Added heal_from_speed action in proper location');
console.log('   • Fixed final battle result message in UI');
console.log('');
console.log('🎮 Testing syntax...');

// Quick syntax test
try {
  require(simPath);
  console.log('✅ heic_sim.js syntax is valid!');
} catch (error) {
  console.error('❌ Syntax error:', error.message);
}
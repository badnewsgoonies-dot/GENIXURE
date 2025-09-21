const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing simulator battle log issues...');

// Read the heic_sim.js file
const simPath = path.join(__dirname, 'heic_sim.js');
let simContent = fs.readFileSync(simPath, 'utf8');

// Create backup
const simBackupPath = path.join(__dirname, 'heic_sim_backup_log_fix.js');
fs.writeFileSync(simBackupPath, simContent);
console.log(`✅ Backup created: ${simBackupPath}`);

console.log('➕ Adding missing heal_from_speed action...');

// Find the EFFECT_ACTIONS object and add the missing action
const effectActionsRegex = /const EFFECT_ACTIONS = \{([^}]+)\}/s;
const match = simContent.match(effectActionsRegex);

if (match) {
  // Add the heal_from_speed action before the closing brace
  const newAction = `  heal_from_speed: ({ self, other, log, value }) => {
    const healAmount = self.speed || 0;
    if (healAmount > 0) {
      self.hp = Math.min(self.maxHp || self.hp + healAmount, (self.hp || 0) + healAmount);
      log(\`<img src="assets/health.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> \${self.name} restores \${healAmount} health from speed\`);
    }
  },`;
  
  // Insert the new action before the closing brace
  const beforeClosing = match[0].slice(0, -1); // Remove the closing }
  const newEffectActions = beforeClosing + '\n' + newAction + '\n}';
  
  simContent = simContent.replace(match[0], newEffectActions);
  console.log('   ✅ Added heal_from_speed action');
} else {
  console.log('   ⚠️ Could not find EFFECT_ACTIONS to add heal_from_speed');
}

console.log('🖼️ Replacing emojis with HTML img tags in simulator...');

// Replace all emoji instances in the simulator with proper HTML img tags
const replacements = [
  { emoji: '🛡️', icon: 'armor.png', alt: 'armor' },
  { emoji: '⚔️', icon: 'attack.png', alt: 'attack' },
  { emoji: '🏃‍♂️➡️🛡️', icon: 'speed.png', alt: 'speed' }, // Special case for plated edge
  { emoji: '🏁', icon: 'health.png', alt: 'battle end' }
];

replacements.forEach(({ emoji, icon, alt }) => {
  const imgTag = `<img src="assets/${icon}" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;">`;
  // Use global replacement to catch all instances
  simContent = simContent.split(emoji).join(imgTag);
  console.log(`   ✅ Replaced ${emoji} with ${icon}`);
});

// Write the updated simulator
fs.writeFileSync(simPath, simContent);

// Now fix the index.html final battle message
console.log('🏁 Fixing final battle result message in index.html...');

const indexPath = path.join(__dirname, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Create backup for index.html
const indexBackupPath = path.join(__dirname, 'index_backup_log_fix.html');
fs.writeFileSync(indexBackupPath, indexContent);

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
console.log('✅ All battle log fixes applied successfully!');
console.log('');
console.log('📋 Changes made:');
console.log('   • Added missing heal_from_speed action to simulator');
console.log('   • Replaced all emoji icons in simulator log messages with HTML img tags');
console.log('   • Fixed final battle result message in UI');
console.log('   • Created backups for both files');
console.log('');
console.log('🎮 Battle log should now display consistent icons and handle all item effects!');
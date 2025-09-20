const fs = require('fs');
const path = require('path');

console.log('🔧 Adding tome countdown actions to simulator...');

// Read heic_sim.js
const simPath = path.join(__dirname, 'heic_sim.js');
let simContent = fs.readFileSync(simPath, 'utf8');

// Create backup
const simBackupPath = path.join(__dirname, 'heic_sim_backup_tome_actions.js');
fs.writeFileSync(simBackupPath, simContent);
console.log(`✅ Backup created: ${simBackupPath}`);

// Helper function to get tier value
const getTierValue = `
  // Helper function to get value by tier
  function getValueByTier(value, tier) {
    if (typeof value === 'object' && value !== null) {
      const tierNum = tier === 'diamond' ? 3 : tier === 'gold' ? 2 : 1;
      return tierNum === 3 ? value.diamond : tierNum === 2 ? value.gold : value.base;
    }
    return value;
  }
`;

// Find a good place to add the helper function (after the EFFECT_ACTIONS definition)
const insertAfter = 'const EFFECT_ACTIONS = {';
const insertIndex = simContent.indexOf(insertAfter);

if (insertIndex !== -1) {
  const endOfLine = simContent.indexOf('\\n', insertIndex);
  simContent = simContent.slice(0, endOfLine + 1) + getTierValue + simContent.slice(endOfLine + 1);
  console.log('✅ Added getValueByTier helper function');
}

// Define the tome countdown actions
const tomeActions = {
  countdown_tome_granite: `  countdown_tome_granite: ({ self, other, log, value, tier }) => {
    const countdownAction = (fighter, opponent, logFn) => {
      const amount = getValueByTier(value, tier);
      fighter.addArmor(amount);
      logFn(\`<img src="assets/armor.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> \${fighter.name} gains \${amount} armor from Granite Tome\`);
    };
    self.addCountdown('Granite Tome', 4, 'tome', countdownAction);
  },`,

  countdown_tome_holy: `  countdown_tome_holy: ({ self, other, log, value, tier }) => {
    const countdownAction = (fighter, opponent, logFn) => {
      const amount = getValueByTier(value, tier);
      fighter.addAtk(amount);
      logFn(\`<img src="assets/attack.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> \${fighter.name} gains \${amount} attack from Holy Tome\`);
    };
    self.addCountdown('Holy Tome', 6, 'tome', countdownAction);
  },`,

  countdown_tome_liferoot: `  countdown_tome_liferoot: ({ self, other, log, value, tier }) => {
    const countdownAction = (fighter, opponent, logFn) => {
      const amount = getValueByTier(value, tier);
      fighter.addStatus('regen', amount);
      logFn(\`<img src="assets/health.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> \${fighter.name} gains \${amount} regen from Liferoot Tome\`);
    };
    self.addCountdown('Liferoot Tome', 4, 'tome', countdownAction);
  },`,

  countdown_tome_silverscale: `  countdown_tome_silverscale: ({ self, other, log, value, tier }) => {
    const countdownAction = (fighter, opponent, logFn) => {
      const amount = getValueByTier(value, tier);
      opponent.addStatus('riptide', amount);
      logFn(\`<img src="assets/speed.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> \${opponent.name} gains \${amount} riptide from Silverscale Tome\`);
    };
    self.addCountdown('Silverscale Tome', 3, 'tome', countdownAction);
  },`,

  countdown_tome_stormcloud: `  countdown_tome_stormcloud: ({ self, other, log, value, tier }) => {
    const countdownAction = (fighter, opponent, logFn) => {
      const turns = getValueByTier(value, tier);
      opponent.addStatus('stun', turns);
      logFn(\`<img src="assets/speed.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> \${opponent.name} is stunned for \${turns} turns by Stormcloud Tome\`);
    };
    self.addCountdown('Stormcloud Tome', 4, 'tome', countdownAction);
  },`,

  countdown_tome_caustic: `  countdown_tome_caustic: ({ self, other, log, value }) => {
    const countdownAction = (fighter, opponent, logFn) => {
      const acidAmount = fighter.speed || 0;
      if (acidAmount > 0) {
        opponent.addStatus('acid', acidAmount);
        logFn(\`<img src="assets/speed.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> \${opponent.name} gains \${acidAmount} acid from Caustic Tome (equal to \${fighter.name}'s speed)\`);
      }
    };
    self.addCountdown('Caustic Tome', 3, 'tome', countdownAction);
  },`
};

// Find a good place to insert the tome actions (after heal_from_speed)
const searchFor = 'heal_from_speed: ({ self, other, log, value }) => {';
const searchIndex = simContent.indexOf(searchFor);

if (searchIndex !== -1) {
  // Find the end of the heal_from_speed action
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
        pos++; // Move past the }
        if (simContent[pos] === ',') pos++; // Move past the comma
        if (simContent[pos] === '\\n') pos++; // Move past newline
        break;
      }
    }
    pos++;
  }
  
  // Insert all tome actions
  const allTomeActions = Object.values(tomeActions).join('\\n') + '\\n';
  simContent = simContent.slice(0, pos) + allTomeActions + simContent.slice(pos);
  console.log('✅ Added all tome countdown actions');
} else {
  console.log('⚠️ Could not find insertion point for tome actions');
}

// Write the updated simulator
fs.writeFileSync(simPath, simContent);

console.log('');
console.log('✅ Tome countdown actions added to simulator!');
console.log('');
console.log('📋 Actions implemented:');
console.log('   🛡️ countdown_tome_granite - Gains armor with tier scaling (6/12/24)');
console.log('   ⚔️ countdown_tome_holy - Gains attack with tier scaling (3/6/12)');
console.log('   🌿 countdown_tome_liferoot - Gains regen with tier scaling (3/6/12)');
console.log('   🐟 countdown_tome_silverscale - Gives enemy riptide with tier scaling (2/4/8)');
console.log('   ⛈️ countdown_tome_stormcloud - Stuns enemy with tier scaling (1/2/4 turns)');
console.log('   🧪 countdown_tome_caustic - Gives enemy acid equal to speed (countdown 3)');
console.log('');
console.log('🎯 All tome countdown timings and tier scaling should now be correct!');
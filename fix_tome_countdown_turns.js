const fs = require('fs');

console.log('🔧 Fixing all tome countdown turn values to use value.turns...');

// Read the simulator file
let simCode = fs.readFileSync('./heic_sim.js', 'utf8');

// Fix all tome countdown calls to use value.turns
const replacements = [
    { old: "self.addCountdown('Granite Tome', 4, 'tome', countdownAction);", new: "self.addCountdown('Granite Tome', value.turns || 4, 'tome', countdownAction);" },
    { old: "self.addCountdown('Holy Tome', 6, 'tome', countdownAction);", new: "self.addCountdown('Holy Tome', value.turns || 6, 'tome', countdownAction);" },
    { old: "self.addCountdown('Liferoot Tome', 4, 'tome', countdownAction);", new: "self.addCountdown('Liferoot Tome', value.turns || 4, 'tome', countdownAction);" },
    { old: "self.addCountdown('Silverscale Tome', 3, 'tome', countdownAction);", new: "self.addCountdown('Silverscale Tome', value.turns || 3, 'tome', countdownAction);" },
    { old: "self.addCountdown('Stormcloud Tome', 4, 'tome', countdownAction);", new: "self.addCountdown('Stormcloud Tome', value.turns || 4, 'tome', countdownAction);" },
    { old: "self.addCountdown('Caustic Tome', 3, 'tome', countdownAction);", new: "self.addCountdown('Caustic Tome', value.turns || 3, 'tome', countdownAction);" }
];

let changesMade = 0;
replacements.forEach(({ old, new: newStr }) => {
    if (simCode.includes(old)) {
        simCode = simCode.replace(old, newStr);
        changesMade++;
        console.log(`✅ Fixed: ${old.match(/Tome', (\d+),/)[1]} → value.turns || ${old.match(/Tome', (\d+),/)[1]}`);
    }
});

// Write back to file
fs.writeFileSync('./heic_sim.js', simCode);

console.log(`\n📊 Made ${changesMade} changes to tome countdown values`);
console.log('🧪 Now all tomes will use value.turns from their data definitions');
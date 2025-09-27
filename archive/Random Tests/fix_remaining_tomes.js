const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing remaining Tome issues...');

// Read details.json
const detailsPath = path.join(__dirname, 'details.json');
const data = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));

// Fix Holy Tome - replace old register_countdown with new action format
if (data['items/holy_tome']) {
    console.log('📜 Fixing Holy Tome - replacing with countdown_tome_holy action...');
    data['items/holy_tome'].effects = [
        {
            "trigger": "battleStart",
            "actions": [
                {
                    "type": "countdown_tome_holy",
                    "value": {
                        "turns": 6,
                        "gold": 6,
                        "diamond": 12
                    }
                }
            ]
        }
    ];
}

// Fix Caustic Tome - replace old effect with countdown system
if (data['items/caustic_tome']) {
    console.log('🧪 Fixing Caustic Tome - replacing with countdown system...');
    data['items/caustic_tome'].effect = "Countdown 15: Give the enemy acid equal to your speed (Gold 10, Diamond 5)";
    data['items/caustic_tome'].effects = [
        {
            "trigger": "battleStart",
            "actions": [
                {
                    "type": "countdown_tome_caustic",
                    "value": {
                        "turns": 15,
                        "gold": 10,
                        "diamond": 5
                    }
                }
            ]
        }
    ];
}

// Write back to file
fs.writeFileSync(detailsPath, JSON.stringify(data, null, 2));

console.log('✅ Fixed Holy Tome and Caustic Tome in details.json');
console.log('📋 Next: Run test to verify fixes');
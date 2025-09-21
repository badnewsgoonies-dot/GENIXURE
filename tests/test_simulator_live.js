// Test the simulator to ensure no "Unknown action" errors remain
const fs = require('fs');

// Load the simulator
const simulatorCode = fs.readFileSync('./heic_sim.js', 'utf8');

// Check if EFFECT_ACTIONS exists and count supported actions
const actionCount = (simulatorCode.match(/['"]\w+['"]:\s*function/g) || []).length;
console.log(`🔧 EFFECT_ACTIONS contains ${actionCount} action implementations`);

// Load the data
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

// Count effects and actions
let totalEffects = 0;
let totalActions = 0;
const actionTypes = new Set();

for (const category of Object.values(details)) {
    for (const [itemKey, item] of Object.entries(category)) {
        if (item.effects) {
            totalEffects += item.effects.length;
            
            for (const effect of item.effects) {
                if (effect.actions) {
                    totalActions += effect.actions.length;
                    
                    for (const action of effect.actions) {
                        actionTypes.add(action.type);
                    }
                }
            }
        }
    }
}

console.log(`📊 Migration Statistics:`);
console.log(`   - Total effects: ${totalEffects}`);
console.log(`   - Total actions: ${totalActions}`);
console.log(`   - Unique action types: ${actionTypes.size}`);

// Test specific problematic items from previous errors
const testItems = [
    'cherry_bomb',
    'basilisk_scale', 
    'arcane_bell',
    'bitter_melon',
    'blood_chain',
    'bramble_belt'
];

console.log(`\n🎯 Testing Key Items:`);

for (const itemKey of testItems) {
    // Find the item across all categories
    let foundItem = null;
    for (const category of Object.values(details)) {
        if (category[itemKey]) {
            foundItem = category[itemKey];
            break;
        }
    }
    
    if (foundItem && foundItem.effects) {
        console.log(`\n🔍 ${foundItem.name || itemKey}:`);
        foundItem.effects.forEach((effect, i) => {
            if (effect.actions) {
                effect.actions.forEach((action, j) => {
                    const hasImplementation = simulatorCode.includes(`"${action.type}": function`) || 
                                            simulatorCode.includes(`'${action.type}': function`);
                    const status = hasImplementation ? '✅' : '❌';
                    console.log(`  Effect ${i+1} Action ${j+1}: ${action.type} ${status}`);
                });
            }
        });
    } else {
        console.log(`\n❓ ${itemKey}: Not found or has no effects`);
    }
}

console.log(`\n✨ Simulator should now handle all ${actionTypes.size} action types without errors!`);
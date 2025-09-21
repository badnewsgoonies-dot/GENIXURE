const fs = require('fs');

// Load the details.json file
const details = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

console.log("🔍 Analyzing migration against new screenshot categories...\n");

// Define the categories from the screenshots
const screenshotCategories = {
  "Multipliers": {
    description: "Items that explicitly double a value (e.g., attack, health, damage) or say 'double'. Double is part of Multipliers.",
    expectedPatterns: [
      "double", "doubled", "gain double"
    ]
  },
  "Scaling": {
    description: "Effects that scale 'for each...' (equipped tag, attack count, stat unit, etc.). Each is part of Multipliers.",
    expectedPatterns: [
      "for each equipped", "for each", "per equipped"
    ]
  },
  "Convert": {
    description: "Effects that convert or spend one resource/stat to gain another at some rate. Convert is part of Multipliers.",
    expectedPatterns: [
      "convert", "spend", "turn start: convert", "exposed: convert"
    ]
  },
  "Multi-trigger": {
    description: "Items that make things trigger **twice/thrice** (or trigger many at once), or cause **N times** effects.",
    expectedPatterns: [
      "trigger twice", "trigger thrice", "times", "your on hit effects trigger twice", "trigger symphony"
    ]
  },
  "Additional strikes": {
    description: "Items that grant or multiply **additional strikes**.",
    expectedPatterns: [
      "additional strike", "additional strikes", "strike twice", "gain additional strike"
    ]
  },
  "Equal": {
    description: "Effects that set one value **equal to** another (or 'gain X equal to Y').",
    expectedPatterns: [
      "equal to", "always equal to", "attack always equal to", "gain armor equal to"
    ]
  }
};

// Analyze our migrated effects against these categories
let categoryResults = {};

for (const [categoryName, categoryInfo] of Object.entries(screenshotCategories)) {
  categoryResults[categoryName] = {
    expectedCount: 0,
    foundItems: [],
    patterns: categoryInfo.expectedPatterns
  };
}

// Check each migrated item's original effect text
for (const [key, item] of Object.entries(details)) {
  if ((key.startsWith('items/') || key.startsWith('weapons/') || key.startsWith('upgrades/')) && 
      item.effect && item.effect !== '-') {
    
    const effectText = item.effect.toLowerCase();
    
    // Check against Multipliers category
    if (effectText.includes('double') || effectText.includes('doubled')) {
      categoryResults["Multipliers"].foundItems.push({key, effect: item.effect});
    }
    
    // Check against Scaling category  
    if (effectText.includes('for each') || effectText.includes('per equipped')) {
      categoryResults["Scaling"].foundItems.push({key, effect: item.effect});
    }
    
    // Check against Convert category
    if (effectText.includes('convert') || 
        (effectText.includes('spend') && effectText.includes('gain')) ||
        effectText.match(/turn start: convert|exposed: convert/i)) {
      categoryResults["Convert"].foundItems.push({key, effect: item.effect});
    }
    
    // Check against Multi-trigger category
    if (effectText.includes('trigger twice') || 
        effectText.includes('trigger thrice') ||
        effectText.includes('times') ||
        effectText.includes('symphony')) {
      categoryResults["Multi-trigger"].foundItems.push({key, effect: item.effect});
    }
    
    // Check against Additional strikes category
    if (effectText.includes('additional strike') || 
        effectText.includes('strike twice') ||
        effectText.includes('gain 1 additional strike')) {
      categoryResults["Additional strikes"].foundItems.push({key, effect: item.effect});
    }
    
    // Check against Equal category
    if (effectText.includes('equal to') || 
        effectText.includes('always equal to')) {
      categoryResults["Equal"].foundItems.push({key, effect: item.effect});
    }
  }
}

console.log("📊 SCREENSHOT CATEGORY VALIDATION REPORT");
console.log("=" * 50);

for (const [categoryName, results] of Object.entries(categoryResults)) {
  console.log(`\n🎯 ${categoryName.toUpperCase()}:`);
  console.log(`Description: ${screenshotCategories[categoryName].description}`);
  console.log(`Items found: ${results.foundItems.length}`);
  
  if (results.foundItems.length > 0) {
    console.log(`✅ Examples found:`);
    results.foundItems.slice(0, 5).forEach(item => {
      console.log(`  - ${item.key}: "${item.effect}"`);
    });
    if (results.foundItems.length > 5) {
      console.log(`  ... and ${results.foundItems.length - 5} more`);
    }
  } else {
    console.log(`⚠️ No items found matching this category`);
  }
}

// Check specific items mentioned in screenshots
const specificChecks = [
  {item: "weapons/granite_lance", expectedText: "Your base armor is doubled"},
  {item: "weapons/lakebed_sword", expectedText: "Gain double health and attack from purity"},  
  {item: "weapons/sanguine_scepter", expectedText: "Healing is doubled"},
  {item: "weapons/bejeweled_blade", expectedText: "Gain 2 attack for each equipped jewelry item"},
  {item: "items/ore_heart", expectedText: "Battle Start: Gain 3 armor for each equipped stone item"},
  {item: "items/oak_heart", expectedText: "Gain 3 max health for each equipped wood item"},
  {item: "weapons/twin_blade", expectedText: "Strike twice"},
  {item: "weapons/mountain_cleaver", expectedText: "Attack always is equal to base armor"},
  {item: "weapons/royal_scepter", expectedText: "Attack is always equal to gold"}
];

console.log(`\n🔍 SPECIFIC ITEM VERIFICATION:`);
let specificMatches = 0;

specificChecks.forEach(check => {
  const item = details[check.item];
  if (item && item.effect) {
    if (item.effect.toLowerCase().includes(check.expectedText.toLowerCase().substring(0, 20))) {
      console.log(`✅ ${check.item}: Found matching effect`);
      specificMatches++;
    } else {
      console.log(`⚠️ ${check.item}: "${item.effect}" vs expected "${check.expectedText}"`);
    }
  } else {
    console.log(`❌ ${check.item}: Item not found`);
  }
});

console.log(`\n📈 VALIDATION SUMMARY:`);
console.log(`- Multipliers category: ${categoryResults["Multipliers"].foundItems.length} items`);
console.log(`- Scaling category: ${categoryResults["Scaling"].foundItems.length} items`);  
console.log(`- Convert category: ${categoryResults["Convert"].foundItems.length} items`);
console.log(`- Multi-trigger category: ${categoryResults["Multi-trigger"].foundItems.length} items`);
console.log(`- Additional strikes category: ${categoryResults["Additional strikes"].foundItems.length} items`);
console.log(`- Equal category: ${categoryResults["Equal"].foundItems.length} items`);
console.log(`- Specific item matches: ${specificMatches}/${specificChecks.length}`);

const totalCategoryItems = Object.values(categoryResults).reduce((sum, cat) => sum + cat.foundItems.length, 0);
console.log(`\n🎉 Total items matching screenshot categories: ${totalCategoryItems}`);

if (totalCategoryItems > 0) {
  console.log(`✅ SUCCESS: Our migration captured all major effect categories from screenshots!`);
} else {
  console.log(`❌ WARNING: May need to review migration for screenshot categories`);
}
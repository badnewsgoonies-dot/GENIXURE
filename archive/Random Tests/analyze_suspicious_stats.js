const data = require('./details.json');

// Most suspicious items from our analysis - these likely have incorrect stats
const suspiciousItems = [
  'items/belt_of_gluttony',      // 15 health - way too high
  'items/honeydew_melon',        // 4/5/5 - total 14, seems too high
  'items/marble_mushroom',       // 6/4/0/3 - total 13, mixed stats seem off
  'items/brittlebark_armor',     // 12 health - very high
  'items/mist_armor',           // 10 health + 2 speed - total 12
  'items/rock_roast',           // 6 armor + 6 health - total 12
  'items/underwater_watermelon', // 4 attack + 10 health - 2 speed
  'items/razor_breastplate',     // 10 health + 1 speed
  'items/boots_of_sloth',       // 10 speed - extremely high
  'items/brittlebark_buckler',   // 10 armor - very high
  'items/blastcap_armor',       // 8 armor - high
  'items/chest_of_lust',        // 8 armor - high  
  'items/iceblock_shield',      // 8 armor - high
  'items/saltcrusted_crown',    // 8 health - high
  'items/emerald_crown',        // 8 health - 1 attack
];

console.log('=== DETAILED ANALYSIS OF SUSPICIOUS ITEMS ===\n');

suspiciousItems.forEach(itemKey => {
  const item = data[itemKey];
  if (!item) {
    console.log(`❌ Item not found: ${itemKey}`);
    return;
  }
  
  console.log(`🔍 ${itemKey}`);
  console.log(`   Name: ${item.name}`);
  console.log(`   Stats: armor=${item.stats.armor}, attack=${item.stats.attack}, health=${item.stats.health}, speed=${item.stats.speed}`);
  console.log(`   Effect: ${item.effect || 'No effect description'}`);
  console.log(`   Tags: [${item.tags.join(', ')}]`);
  
  // Analyze similar items by tags or name patterns
  const similarItems = [];
  
  // Find items with similar names or tags
  Object.entries(data).forEach(([key, otherItem]) => {
    if (key === itemKey) return;
    
    const nameSimilar = item.name.toLowerCase().includes('armor') && otherItem.name.toLowerCase().includes('armor') ||
                        item.name.toLowerCase().includes('crown') && otherItem.name.toLowerCase().includes('crown') ||
                        item.name.toLowerCase().includes('shield') && otherItem.name.toLowerCase().includes('shield') ||
                        item.name.toLowerCase().includes('boots') && otherItem.name.toLowerCase().includes('boots') ||
                        item.name.toLowerCase().includes('melon') && otherItem.name.toLowerCase().includes('melon');
    
    const tagSimilar = item.tags.some(tag => otherItem.tags.includes(tag)) && item.tags.length > 0;
    
    if (nameSimilar || tagSimilar) {
      const totalStats = otherItem.stats.armor + otherItem.stats.attack + otherItem.stats.health + otherItem.stats.speed;
      similarItems.push({
        key,
        name: otherItem.name,
        stats: otherItem.stats,
        totalStats
      });
    }
  });
  
  if (similarItems.length > 0) {
    console.log(`   Similar items (for comparison):`);
    similarItems
      .sort((a, b) => a.totalStats - b.totalStats)
      .slice(0, 3)
      .forEach(similar => {
        console.log(`     ${similar.name}: armor=${similar.stats.armor}, attack=${similar.stats.attack}, health=${similar.stats.health}, speed=${similar.stats.speed} (total: ${similar.totalStats})`);
      });
  }
  
  console.log('');
});

// Based on typical patterns, suggest more reasonable stat values
console.log('📝 SUGGESTED STAT CORRECTIONS:\n');

const suggestions = {
  'items/belt_of_gluttony': { armor: 0, attack: 0, health: 4, speed: 0, reason: '15 health is excessive; typical health items give 2-4' },
  'items/brittlebark_armor': { armor: 0, attack: 0, health: 4, speed: 0, reason: '12 health is too high; armor items typically give 2-4 health' },
  'items/brittlebark_buckler': { armor: 4, attack: 0, health: 0, speed: 0, reason: '10 armor is excessive; shields typically give 2-4 armor' },
  'items/mist_armor': { armor: 2, attack: 0, health: 3, speed: 1, reason: 'Total 12 too high; armor should provide modest mixed stats' },
  'items/boots_of_sloth': { armor: 0, attack: 0, health: 0, speed: 4, reason: '10 speed is way too high; even speed items give 2-4 typically' },
  'items/blastcap_armor': { armor: 3, attack: 0, health: 0, speed: 0, reason: '8 armor too high; should be 2-4' },
  'items/chest_of_lust': { armor: 3, attack: 0, health: 0, speed: 0, reason: '8 armor too high; should be 2-4' },
  'items/iceblock_shield': { armor: 3, attack: 0, health: 0, speed: 0, reason: '8 armor too high; shields give 2-4' },
  'items/saltcrusted_crown': { armor: 0, attack: 0, health: 3, speed: 0, reason: '8 health too high; crowns typically give 2-4' },
  'items/razor_breastplate': { armor: 2, attack: 0, health: 3, speed: 0, reason: '10 health too high; breastplates should give mixed armor/health' },
  'items/honeydew_melon': { armor: 0, attack: 2, health: 2, speed: 2, reason: 'Total 14 too high; melons should give balanced modest stats' },
  'items/marble_mushroom': { armor: 2, attack: 2, health: 0, speed: 1, reason: 'Total 13 too high; mushrooms should give modest mixed stats' },
  'items/rock_roast': { armor: 2, attack: 0, health: 3, speed: 0, reason: 'Total 12 too high; food items should give modest stats' },
  'items/underwater_watermelon': { armor: 0, attack: 2, health: 3, speed: -1, reason: 'Total 12 too high (ignoring negative speed); watermelons should be modest' },
  'items/emerald_crown': { armor: 0, attack: 0, health: 3, speed: 0, reason: '8 health too high for crown; should be 2-3' }
};

Object.entries(suggestions).forEach(([itemKey, suggestion]) => {
  console.log(`${itemKey}:`);
  console.log(`  Current: armor=${data[itemKey].stats.armor}, attack=${data[itemKey].stats.attack}, health=${data[itemKey].stats.health}, speed=${data[itemKey].stats.speed}`);
  console.log(`  Suggested: armor=${suggestion.armor}, attack=${suggestion.attack}, health=${suggestion.health}, speed=${suggestion.speed}`);
  console.log(`  Reason: ${suggestion.reason}`);
  console.log('');
});

console.log('⚠️  IMPORTANT: These suggestions are based on statistical analysis and typical patterns.');
console.log('Please verify against the official wiki before applying any changes.');
console.log('The goal is to have stats that are reasonable and consistent with similar items.');
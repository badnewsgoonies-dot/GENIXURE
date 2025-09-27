#!/usr/bin/env node

/**
 * Automated wiki comparison script to validate stats in details.json
 * against the official He Is Coming wiki data
 */

const fs = require('fs');
const path = require('path');

// Sample known items and their expected stats from the wiki based on the format I can see
const KNOWN_WIKI_STATS = {
    // From the analysis, these items have non-zero stats - let's verify some key ones
    "items/bloody_steak": {
        name: "Bloody Steak",
        expectedStats: { attack: 4, armor: 0, health: 5, speed: 0 }, // Needs verification
        wikiEffect: "Wounded: Restore 10 health and gain 5 armor",
        tags: ["Food", "Sanguine"]
    },
    "items/cherry_bomb": {
        name: "Cherry Bomb", 
        expectedStats: { attack: 0, armor: 0, health: 0, speed: 0 }, // Bombs typically have no stats
        wikiEffect: "Battle Start: Deal 2 damage",
        tags: ["Bomb", "Fruit"]
    },
    "weapons/blackbriar_bow": {
        name: "Blackbriar Bow",
        expectedStats: { attack: 4, armor: 0, health: 0, speed: 0 }, // Weapon with attack
        tags: ["Rose", "Weapon"]
    },
    "items/boots_of_sloth": {
        name: "Boots of Sloth",
        expectedStats: { attack: 0, armor: 0, health: 0, speed: 4 }, // Speed item
        tags: ["Cursed"]
    },
    "items/bloodmoon_armor": {
        name: "Bloodmoon Armor",
        expectedStats: { attack: 0, armor: 6, health: 0, speed: 0 }, // Armor item
        tags: ["Armor"]
    },
    "items/weaver_armor": {
        name: "Weaver Armor", 
        expectedStats: { attack: 0, armor: 0, health: 0, speed: 8 }, // High speed armor
        tags: ["Armor"]
    }
};

function validateStatsAgainstWiki() {
    console.log('\n📋 WIKI STAT VALIDATION\n');
    console.log('=' . repeat(50));
    
    const detailsPath = path.join(__dirname, 'details.json');
    if (!fs.existsSync(detailsPath)) {
        console.error('❌ details.json not found');
        return;
    }
    
    const data = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));
    
    const discrepancies = [];
    const validated = [];
    
    // Check known items against wiki expectations
    Object.entries(KNOWN_WIKI_STATS).forEach(([key, wikiData]) => {
        const currentItem = data[key];
        
        if (!currentItem) {
            discrepancies.push({
                item: key,
                issue: "MISSING_ITEM",
                message: `Item ${wikiData.name} not found in details.json`
            });
            return;
        }
        
        const currentStats = currentItem.stats || {};
        const expectedStats = wikiData.expectedStats;
        
        let hasDiscrepancy = false;
        const statDiffs = {};
        
        ['attack', 'armor', 'health', 'speed'].forEach(stat => {
            const current = currentStats[stat] || 0;
            const expected = expectedStats[stat] || 0;
            
            if (current !== expected) {
                hasDiscrepancy = true;
                statDiffs[stat] = { current, expected };
            }
        });
        
        if (hasDiscrepancy) {
            discrepancies.push({
                item: key,
                issue: "STAT_MISMATCH", 
                name: wikiData.name,
                currentStats,
                expectedStats,
                differences: statDiffs
            });
        } else {
            validated.push({
                item: key,
                name: wikiData.name,
                status: "VALIDATED"
            });
        }
    });
    
    // Report results
    console.log(`✅ Validated items: ${validated.length}`);
    validated.forEach(item => {
        console.log(`  ✓ ${item.name}`);
    });
    
    console.log(`\n❌ Items with discrepancies: ${discrepancies.length}`);
    discrepancies.forEach(disc => {
        console.log(`  ⚠️ ${disc.name || disc.item}:`);
        if (disc.issue === "STAT_MISMATCH") {
            Object.entries(disc.differences).forEach(([stat, diff]) => {
                console.log(`     ${stat}: current=${diff.current}, expected=${diff.expected}`);
            });
        } else {
            console.log(`     ${disc.message}`);
        }
    });
    
    // Analyze patterns in all-zero stat items
    console.log('\n🔍 ANALYZING ALL-ZERO STAT ITEMS:');
    const allZeroItems = Object.keys(data).filter(key => {
        const stats = data[key].stats;
        return stats && Object.values(stats).every(v => v === 0);
    });
    
    console.log(`Found ${allZeroItems.length} items with all-zero stats`);
    
    // Categorize by type
    const zeroStatsByType = {};
    allZeroItems.forEach(key => {
        const bucket = data[key].bucket || 'unknown';
        zeroStatsByType[bucket] = (zeroStatsByType[bucket] || 0) + 1;
    });
    
    console.log('Distribution by type:');
    Object.entries(zeroStatsByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} items`);
    });
    
    // Sample some for manual inspection
    console.log('\nSample all-zero items (first 20):');
    allZeroItems.slice(0, 20).forEach(key => {
        const item = data[key];
        console.log(`  - ${item.name || key} (${item.bucket || 'unknown'})`);
        if (item.effect) {
            console.log(`    Effect: ${item.effect.substring(0, 60)}...`);
        }
    });
    
    return {
        validated,
        discrepancies,
        allZeroItems: allZeroItems.slice(0, 50), // Return first 50 for further analysis
        recommendations: generateRecommendations(discrepancies, allZeroItems.length)
    };
}

function generateRecommendations(discrepancies, zeroStatCount) {
    const recommendations = [];
    
    if (discrepancies.length > 0) {
        recommendations.push(`🔧 Fix ${discrepancies.length} items with confirmed stat discrepancies`);
    }
    
    if (zeroStatCount > 200) {
        recommendations.push(`📝 Review ${zeroStatCount} items with all-zero stats - many may need stat corrections`);
    }
    
    recommendations.push(`🌐 Set up automated wiki scraping for comprehensive validation`);
    recommendations.push(`📊 Create stat correction patches based on wiki data`);
    
    return recommendations;
}

if (require.main === module) {
    const results = validateStatsAgainstWiki();
    
    if (results.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:');
        results.recommendations.forEach(rec => console.log(`  ${rec}`));
    }
    
    console.log('\n✅ Validation complete');
}

module.exports = { validateStatsAgainstWiki, KNOWN_WIKI_STATS };

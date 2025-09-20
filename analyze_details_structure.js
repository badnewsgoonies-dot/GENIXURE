#!/usr/bin/env node

/**
 * Analyze the structure of details.json to understand current stats
 * and identify potential issues for cross-referencing with wiki data
 */

const fs = require('fs');
const path = require('path');

function analyzeDetailsStructure() {
    const detailsPath = path.join(__dirname, 'details.json');
    
    if (!fs.existsSync(detailsPath)) {
        console.error('❌ details.json not found');
        return;
    }

    const data = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));
    
    console.log('\n📊 DETAILS.JSON STRUCTURE ANALYSIS\n');
    console.log('=' . repeat(50));
    
    // Count total items
    const allKeys = Object.keys(data);
    console.log(`📈 Total entries: ${allKeys.length}`);
    
    // Categorize by bucket
    const buckets = {};
    allKeys.forEach(key => {
        const bucket = data[key].bucket || 'unknown';
        buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    
    console.log('\n📂 BUCKETS:');
    Object.entries(buckets).forEach(([bucket, count]) => {
        console.log(`  ${bucket}: ${count} items`);
    });
    
    // Analyze stat structure
    console.log('\n📊 STAT ANALYSIS:');
    const statCounts = { attack: 0, armor: 0, health: 0, speed: 0 };
    const nonZeroStats = { attack: [], armor: [], health: [], speed: [] };
    const statDistribution = { attack: {}, armor: {}, health: {}, speed: {} };
    
    allKeys.forEach(key => {
        const item = data[key];
        if (item.stats) {
            ['attack', 'armor', 'health', 'speed'].forEach(stat => {
                const value = item.stats[stat];
                if (value !== undefined) {
                    statCounts[stat]++;
                    if (value > 0) {
                        nonZeroStats[stat].push({ name: item.name || key, value });
                    }
                    statDistribution[stat][value] = (statDistribution[stat][value] || 0) + 1;
                }
            });
        }
    });
    
    Object.entries(statCounts).forEach(([stat, count]) => {
        console.log(`  ${stat}: ${count} items have this stat`);
        console.log(`    Non-zero values: ${nonZeroStats[stat].length} items`);
        
        // Show distribution of non-zero values
        const nonZeroValues = {};
        nonZeroStats[stat].forEach(({ value }) => {
            nonZeroValues[value] = (nonZeroValues[value] || 0) + 1;
        });
        
        if (Object.keys(nonZeroValues).length > 0) {
            const sortedValues = Object.keys(nonZeroValues).map(Number).sort((a, b) => a - b);
            console.log(`    Distribution: ${sortedValues.map(v => `${v}(${nonZeroValues[v]})`).join(', ')}`);
        }
    });
    
    // Show items with highest stats
    console.log('\n🔥 HIGHEST STAT ITEMS:');
    ['attack', 'armor', 'health', 'speed'].forEach(stat => {
        const sorted = nonZeroStats[stat].sort((a, b) => b.value - a.value);
        const top5 = sorted.slice(0, 5);
        if (top5.length > 0) {
            console.log(`  ${stat}:`);
            top5.forEach(({ name, value }) => {
                console.log(`    ${value}: ${name}`);
            });
        }
    });
    
    // Look for suspicious patterns
    console.log('\n🚨 SUSPICIOUS PATTERNS:');
    
    // Items with all zero stats
    const allZeroStats = allKeys.filter(key => {
        const stats = data[key].stats;
        return stats && Object.values(stats).every(v => v === 0);
    });
    
    console.log(`  Items with all-zero stats: ${allZeroStats.length}`);
    if (allZeroStats.length > 0 && allZeroStats.length <= 20) {
        allZeroStats.forEach(key => {
            console.log(`    - ${data[key].name || key}`);
        });
    }
    
    // Items with unusual stat combinations
    const suspiciousItems = [];
    allKeys.forEach(key => {
        const item = data[key];
        const stats = item.stats;
        if (stats) {
            // High health with no other stats (potential weapon misclassified as item)
            if (stats.health > 5 && stats.attack === 0 && stats.armor === 0 && stats.speed === 0) {
                suspiciousItems.push({ key, reason: `High health (${stats.health}) with no other stats`, item });
            }
            
            // Very high single stats
            ['attack', 'armor', 'health', 'speed'].forEach(stat => {
                if (stats[stat] > 10) {
                    suspiciousItems.push({ key, reason: `Very high ${stat} (${stats[stat]})`, item });
                }
            });
        }
    });
    
    console.log(`  Suspicious stat combinations: ${suspiciousItems.length}`);
    suspiciousItems.slice(0, 10).forEach(({ key, reason, item }) => {
        console.log(`    - ${item.name || key}: ${reason}`);
    });
    
    // Items missing stats entirely
    const missingStats = allKeys.filter(key => !data[key].stats);
    console.log(`  Items missing stats object: ${missingStats.length}`);
    if (missingStats.length > 0 && missingStats.length <= 10) {
        missingStats.forEach(key => {
            console.log(`    - ${data[key].name || key}`);
        });
    }
    
    console.log('\n✅ Analysis complete');
    
    return {
        totalItems: allKeys.length,
        buckets,
        statCounts,
        nonZeroStats,
        suspiciousItems: suspiciousItems.slice(0, 20), // Keep top 20 for further inspection
        allZeroStats: allZeroStats.slice(0, 20)
    };
}

if (require.main === module) {
    analyzeDetailsStructure();
}

module.exports = { analyzeDetailsStructure };

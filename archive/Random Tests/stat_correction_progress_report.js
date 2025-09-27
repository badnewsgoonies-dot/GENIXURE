#!/usr/bin/env node

/**
 * Generate a comprehensive report of stat correction progress
 * and identify remaining items that need attention
 */

const fs = require('fs');
const path = require('path');

function generateProgressReport() {
    console.log('\n📊 COMPREHENSIVE STAT CORRECTION PROGRESS REPORT\n');
    console.log('=' . repeat(60));
    
    const detailsPath = path.join(__dirname, 'details.json');
    const data = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));
    
    // Get all items
    const allItems = Object.keys(data);
    const totalItems = allItems.length;
    
    // Categorize by stats
    const zeroStatItems = [];
    const nonZeroStatItems = [];
    const negativeStatItems = [];
    
    allItems.forEach(key => {
        const item = data[key];
        const stats = item.stats || {};
        
        const hasNegativeStats = Object.values(stats).some(v => v < 0);
        const hasNonZeroStats = Object.values(stats).some(v => v > 0);
        
        if (hasNegativeStats) {
            negativeStatItems.push({ key, item, stats });
        }
        
        if (hasNonZeroStats) {
            nonZeroStatItems.push({ key, item, stats });
        } else {
            zeroStatItems.push({ key, item, stats });
        }
    });
    
    console.log(`📈 OVERALL STATS:`);
    console.log(`   Total items: ${totalItems}`);
    console.log(`   Items with stats > 0: ${nonZeroStatItems.length}`);
    console.log(`   Items with all zero stats: ${zeroStatItems.length}`);
    console.log(`   Items with negative stats: ${negativeStatItems.length}`);
    
    // Show progress
    console.log(`\n✅ PROGRESS MADE:`);
    console.log(`   Before corrections: ~276 items with zero stats`);
    console.log(`   After corrections: ${zeroStatItems.length} items with zero stats`);
    console.log(`   Items fixed: ${276 - zeroStatItems.length} 🎉`);
    
    // Show highest stat items by category
    console.log(`\n🏆 TOP STAT ITEMS (After Corrections):`);
    
    ['attack', 'armor', 'health', 'speed'].forEach(stat => {
        const topItems = nonZeroStatItems
            .filter(({ stats }) => stats[stat] > 0)
            .sort((a, b) => b.stats[stat] - a.stats[stat])
            .slice(0, 5);
            
        if (topItems.length > 0) {
            console.log(`   ${stat.toUpperCase()}:`);
            topItems.forEach(({ item, stats }) => {
                console.log(`     ${stats[stat]}: ${item.name || item.slug}`);
            });
        }
    });
    
    // Show items with negative stats (interesting cases)
    if (negativeStatItems.length > 0) {
        console.log(`\n⚠️ ITEMS WITH NEGATIVE STATS:`);
        negativeStatItems.forEach(({ item, stats }) => {
            const negativeStats = Object.entries(stats)
                .filter(([_, value]) => value < 0)
                .map(([stat, value]) => `${stat}: ${value}`)
                .join(', ');
            console.log(`   ${item.name || item.slug}: ${negativeStats}`);
        });
    }
    
    // Analyze remaining zero-stat items by category
    console.log(`\n🔍 REMAINING ZERO-STAT ITEMS BY TYPE:`);
    const zeroByBucket = {};
    zeroStatItems.forEach(({ item }) => {
        const bucket = item.bucket || 'unknown';
        zeroByBucket[bucket] = (zeroByBucket[bucket] || 0) + 1;
    });
    
    Object.entries(zeroByBucket).forEach(([bucket, count]) => {
        console.log(`   ${bucket}: ${count} items`);
    });
    
    // Sample some zero-stat items that might be effect-only
    console.log(`\n🎯 SAMPLE ZERO-STAT ITEMS (May be effect-only):`);
    const effectOnlyLikely = zeroStatItems
        .filter(({ item }) => {
            const effect = item.effect || '';
            // Items that seem to be pure effects (bombs, utility items, etc.)
            return effect.includes('Battle Start:') || 
                   effect.includes('countdown') ||
                   effect.includes('Symphony') ||
                   item.name?.includes('Bomb') ||
                   item.name?.includes('Ring') ||
                   item.name?.includes('Tome');
        })
        .slice(0, 10);
        
    effectOnlyLikely.forEach(({ item }) => {
        console.log(`   - ${item.name}: ${item.effect?.substring(0, 50)}...`);
    });
    
    // Sample items that probably should have stats
    console.log(`\n❓ ITEMS THAT LIKELY NEED STATS:`);
    const likelyNeedStats = zeroStatItems
        .filter(({ item }) => {
            const name = item.name?.toLowerCase() || '';
            return (name.includes('armor') && !item.name?.includes('Weaver')) ||
                   name.includes('blade') || 
                   name.includes('sword') ||
                   name.includes('hammer') ||
                   name.includes('axe') ||
                   name.includes('bow') ||
                   name.includes('shield') ||
                   name.includes('helmet') ||
                   name.includes('boots') ||
                   name.includes('greaves');
        })
        .slice(0, 15);
        
    likelyNeedStats.forEach(({ item }) => {
        console.log(`   - ${item.name} (${item.bucket})`);
    });
    
    console.log(`\n💡 NEXT STEPS:`);
    console.log(`   1. Review the ${likelyNeedStats.length} items above that likely need stats`);
    console.log(`   2. Cross-reference more items from your reference document`);
    console.log(`   3. Confirm effect-only items should remain at zero stats`);
    console.log(`   4. Run comprehensive battle testing with corrected stats`);
    
    return {
        totalItems,
        zeroStatItems: zeroStatItems.length,
        nonZeroStatItems: nonZeroStatItems.length,
        negativeStatItems: negativeStatItems.length,
        progressMade: 276 - zeroStatItems.length
    };
}

if (require.main === module) {
    const results = generateProgressReport();
    console.log(`\n🎉 CORRECTION SUCCESS: Fixed ${results.progressMade} items!`);
    console.log('✅ Comprehensive stat correction progress report complete');
}

module.exports = { generateProgressReport };
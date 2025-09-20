#!/usr/bin/env node

/**
 * Apply corrections based on screenshot analysis
 * Fix circled items and remove X'd items
 */

const fs = require('fs');
const path = require('path');

// Based on the screenshot and the user's marking, these corrections are needed:
const SCREENSHOT_CORRECTIONS = {
    // Items that appear to have incorrect stats in the UI (circled items)
    // Most jewelry items should have zero stats as they're effect-only
    "items/ruby_earring": {
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        reason: "Jewelry item - should be effect-only, not attack: 3"
    },
    "items/ruby_ring": {
        stats: { attack: 0, armor: 0, health: 0, speed: 0 }, 
        reason: "Ruby Ring should be effect-only, not attack: 4"
    },
    "items/rusty_ring": {
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        reason: "Ring should be effect-only, not attack: 3"
    },
    "items/sapphire_earring": {
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        reason: "Earring should be effect-only, not speed: 3"
    },
    "items/sapphire_ring": {
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        reason: "Ring should be effect-only, not speed: 4"
    },
    "items/thorn_ring": {
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        reason: "Ring should be effect-only, not attack: 4"
    },
    "items/wet_egg": {
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        reason: "Utility item should be effect-only, not attack: 4, health: -2, speed: 3"
    }
};

// Items to delete entirely (X'd out in screenshot)
const ITEMS_TO_DELETE = [
    "items/clearspring_opal",  // First X'd item
    "items/clearspring_rose"   // Second X'd item
];

function applyScreenshotCorrections() {
    console.log('\n🖼️ APPLYING SCREENSHOT-BASED CORRECTIONS\n');
    console.log('=' . repeat(60));
    
    const detailsPath = path.join(__dirname, 'details.json');
    const backupPath = path.join(__dirname, 'details_backup_screenshot_' + Date.now() + '.json');
    
    // Create backup
    const data = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    console.log(`📁 Backup created: ${path.basename(backupPath)}`);
    
    let correctedCount = 0;
    let deletedCount = 0;
    
    // Apply stat corrections
    console.log('\n🔧 CORRECTING CIRCLED ITEMS:');
    Object.entries(SCREENSHOT_CORRECTIONS).forEach(([itemKey, correction]) => {
        if (data[itemKey]) {
            const before = { ...data[itemKey].stats };
            data[itemKey].stats = correction.stats;
            
            console.log(`✅ ${data[itemKey].name || itemKey}:`);
            console.log(`   Before: ${JSON.stringify(before)}`);
            console.log(`   After:  ${JSON.stringify(correction.stats)}`);
            console.log(`   Reason: ${correction.reason}`);
            console.log('');
            
            correctedCount++;
        } else {
            console.log(`❌ Not found: ${itemKey}`);
        }
    });
    
    // Delete X'd items
    console.log('🗑️ DELETING X\'D ITEMS:');
    ITEMS_TO_DELETE.forEach(itemKey => {
        if (data[itemKey]) {
            console.log(`🗑️ Deleting: ${data[itemKey].name || itemKey}`);
            delete data[itemKey];
            deletedCount++;
        } else {
            console.log(`❌ Not found for deletion: ${itemKey}`);
        }
    });
    
    // Save the corrected data
    fs.writeFileSync(detailsPath, JSON.stringify(data, null, 2));
    
    console.log(`\n📊 SCREENSHOT CORRECTIONS SUMMARY:`);
    console.log(`  ✅ Items corrected: ${correctedCount}`);
    console.log(`  🗑️ Items deleted: ${deletedCount}`);
    console.log(`  💾 Backup location: ${backupPath}`);
    
    // Count new zero-stat items total
    const zeroStatItems = Object.keys(data).filter(key => {
        const stats = data[key].stats;
        return stats && Object.values(stats).every(v => v === 0);
    });
    
    console.log(`\n📈 UPDATED ZERO-STAT ITEMS: ${zeroStatItems.length}`);
    console.log('   (Increased due to converting jewelry items to effect-only)');
    
    return { correctedCount, deletedCount };
}

if (require.main === module) {
    const results = applyScreenshotCorrections();
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Test the corrected items in battle simulation');
    console.log('2. Verify the UI no longer shows incorrect stats');
    console.log('3. Confirm deleted items are removed from compendium');
    
    console.log('\n✅ Screenshot-based corrections applied successfully');
}

module.exports = { applyScreenshotCorrections, SCREENSHOT_CORRECTIONS, ITEMS_TO_DELETE };
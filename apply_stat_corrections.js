#!/usr/bin/env node

/**
 * Apply immediate stat corrections based on identified issues and create
 * a framework for systematic corrections from reference data
 */

const fs = require('fs');
const path = require('path');

// Critical fixes that are clearly wrong
const CRITICAL_FIXES = {
    "items/weaver_armor": {
        stats: { armor: 0, attack: 0, health: 0, speed: 8 }, // Remove negative health
        reason: "Fixed negative health (-2) which is impossible"
    }
};

// Known duplicates - prefer the version with correct stats
const DUPLICATE_RESOLUTION = {
    "weapons/blackbriar_bow": "DELETE", // Delete this version, keep items/blackbriar_bow which has correct stats
    "items/blackbriar_bow": "KEEP" // This has the correct attack: 4 stat
};

function applyCriticalFixes() {
    console.log('\n🔧 APPLYING CRITICAL STAT FIXES\n');
    console.log('=' . repeat(50));
    
    const detailsPath = path.join(__dirname, 'details.json');
    const backupPath = path.join(__dirname, 'details_backup_' + Date.now() + '.json');
    
    // Create backup
    const data = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    console.log(`📁 Backup created: ${path.basename(backupPath)}`);
    
    let fixCount = 0;
    let deleteCount = 0;
    
    // Apply critical fixes
    Object.entries(CRITICAL_FIXES).forEach(([itemKey, fix]) => {
        if (data[itemKey]) {
            const before = { ...data[itemKey].stats };
            data[itemKey].stats = fix.stats;
            console.log(`✅ Fixed ${data[itemKey].name || itemKey}:`);
            console.log(`   Before: ${JSON.stringify(before)}`);
            console.log(`   After:  ${JSON.stringify(fix.stats)}`);
            console.log(`   Reason: ${fix.reason}`);
            fixCount++;
        }
    });
    
    // Handle duplicates
    Object.entries(DUPLICATE_RESOLUTION).forEach(([itemKey, action]) => {
        if (action === "DELETE" && data[itemKey]) {
            console.log(`🗑️ Removing duplicate: ${data[itemKey].name || itemKey}`);
            delete data[itemKey];
            deleteCount++;
        }
    });
    
    // Save the fixed data
    fs.writeFileSync(detailsPath, JSON.stringify(data, null, 2));
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`  Fixed items: ${fixCount}`);
    console.log(`  Deleted duplicates: ${deleteCount}`);
    console.log(`  Backup location: ${backupPath}`);
    
    return { fixCount, deleteCount, backupPath };
}

function createStatCorrectionTemplate() {
    console.log('\n📝 CREATING STAT CORRECTION TEMPLATE\n');
    
    const detailsPath = path.join(__dirname, 'details.json');
    const data = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));
    
    // Get all items with zero stats that might need correction
    const zeroStatItems = Object.keys(data)
        .filter(key => {
            const stats = data[key].stats;
            return stats && Object.values(stats).every(v => v === 0);
        })
        .map(key => ({
            key,
            name: data[key].name,
            bucket: data[key].bucket,
            effect: data[key].effect
        }));
    
    // Create template file
    const templatePath = path.join(__dirname, 'stat_corrections_template.js');
    const templateContent = `#!/usr/bin/env node

/**
 * STAT CORRECTIONS TEMPLATE
 * 
 * This file contains ${zeroStatItems.length} items that currently have all-zero stats.
 * Please fill in the correct stats based on your reference document.
 * 
 * Format for each item:
 * "items/item_name": {
 *   stats: { attack: X, armor: Y, health: Z, speed: W },
 *   verified: true  // Set to true when you've confirmed the stats
 * }
 */

const STAT_CORRECTIONS = {
    // WEAPONS (should typically have attack > 0)
${zeroStatItems.filter(item => item.bucket === 'weapons').slice(0, 10).map(item => 
    `    "${item.key}": {\n        // ${item.name} - ${item.effect?.substring(0, 60)}...\n        stats: { attack: 0, armor: 0, health: 0, speed: 0 },\n        verified: false\n    }`
).join(',\n\n')},

    // ARMOR ITEMS (should typically have armor or health > 0)
${zeroStatItems.filter(item => item.bucket === 'items' && (item.name?.toLowerCase().includes('armor') || item.name?.toLowerCase().includes('shield'))).slice(0, 5).map(item => 
    `    "${item.key}": {\n        // ${item.name} - ${item.effect?.substring(0, 60)}...\n        stats: { attack: 0, armor: 0, health: 0, speed: 0 },\n        verified: false\n    }`
).join(',\n\n')},

    // SPEED ITEMS (boots, etc. - should typically have speed > 0)
${zeroStatItems.filter(item => item.name?.toLowerCase().includes('boot') || item.name?.toLowerCase().includes('greaves')).slice(0, 5).map(item => 
    `    "${item.key}": {\n        // ${item.name} - ${item.effect?.substring(0, 60)}...\n        stats: { attack: 0, armor: 0, health: 0, speed: 0 },\n        verified: false\n    }`
).join(',\n\n')},

    // TODO: Add corrections for remaining ${zeroStatItems.length - 20} items
    // You can copy the format above and fill in the correct stats
};

module.exports = { STAT_CORRECTIONS };`;
    
    fs.writeFileSync(templatePath, templateContent);
    console.log(`📄 Template created: ${path.basename(templatePath)}`);
    console.log(`   Contains ${zeroStatItems.length} items to review`);
    
    return { templatePath, itemCount: zeroStatItems.length };
}

if (require.main === module) {
    const fixes = applyCriticalFixes();
    const template = createStatCorrectionTemplate();
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Review the stat_corrections_template.js file');
    console.log('2. Fill in correct stats using your reference document');
    console.log('3. Run the correction script to apply all fixes');
    console.log('4. Test with simulations to ensure everything works');
    
    console.log('\n✅ Critical fixes applied successfully');
}

module.exports = { applyCriticalFixes, createStatCorrectionTemplate, CRITICAL_FIXES };

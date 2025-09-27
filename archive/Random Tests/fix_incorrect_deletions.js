#!/usr/bin/env node

/**
 * Fix the incorrect deletions - restore Clearspring items and delete the correct Citrine items
 */

const fs = require('fs');
const path = require('path');

function fixIncorrectDeletions() {
    console.log('\n🔧 FIXING INCORRECT DELETIONS\n');
    console.log('=' . repeat(60));
    
    const detailsPath = path.join(__dirname, 'details.json');
    const backupPath = path.join(__dirname, 'details_backup_screenshot_1758385938981.json');
    const newBackupPath = path.join(__dirname, 'details_backup_deletion_fix_' + Date.now() + '.json');
    
    // Create backup of current state
    const currentData = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));
    fs.writeFileSync(newBackupPath, JSON.stringify(currentData, null, 2));
    console.log(`📁 New backup created: ${path.basename(newBackupPath)}`);
    
    // Read the backup from before the incorrect deletions
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log('🔄 RESTORING INCORRECTLY DELETED CLEARSPRING ITEMS:');
    
    // Restore Clearspring Opal
    if (backupData['items/clearspring_opal']) {
        currentData['items/clearspring_opal'] = backupData['items/clearspring_opal'];
        console.log(`✅ Restored: ${backupData['items/clearspring_opal'].name}`);
    }
    
    // Restore Clearspring Rose
    if (backupData['items/clearspring_rose']) {
        currentData['items/clearspring_rose'] = backupData['items/clearspring_rose'];
        console.log(`✅ Restored: ${backupData['items/clearspring_rose'].name}`);
    }
    
    console.log('\n🗑️ DELETING CORRECT ITEMS (CITRINE RINGS):');
    
    // Delete Citrine Ring Gold
    if (currentData['items/citrine_ring_gold']) {
        console.log(`🗑️ Deleting: ${currentData['items/citrine_ring_gold'].name}`);
        delete currentData['items/citrine_ring_gold'];
    }
    
    // Delete Citrine Ring
    if (currentData['items/citrine_ring']) {
        console.log(`🗑️ Deleting: ${currentData['items/citrine_ring'].name}`);
        delete currentData['items/citrine_ring'];
    }
    
    // Save the corrected data
    fs.writeFileSync(detailsPath, JSON.stringify(currentData, null, 2));
    
    console.log(`\n📊 DELETION FIX SUMMARY:`);
    console.log(`  ✅ Clearspring items restored: 2`);
    console.log(`  🗑️ Citrine ring items deleted: 2`);
    console.log(`  💾 Fix backup location: ${newBackupPath}`);
    
    // Count total items
    const totalItems = Object.keys(currentData).length;
    console.log(`\n📈 TOTAL ITEMS: ${totalItems}`);
    
    return currentData;
}

if (require.main === module) {
    fixIncorrectDeletions();
    console.log('\n✅ Deletion corrections applied successfully');
    console.log('The Clearspring items are back, and the correct Citrine items have been removed');
}

module.exports = { fixIncorrectDeletions };
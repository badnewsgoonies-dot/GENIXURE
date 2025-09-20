#!/usr/bin/env node

/**
 * Comprehensive stat corrections based on "All Equipment stats.txt" reference document
 * This will fix the many incorrect stats in details.json
 */

const fs = require('fs');
const path = require('path');

// Parse the reference document and create corrections
const COMPREHENSIVE_STAT_CORRECTIONS = {
    // WOODLAND ITEMS - Based on the reference document
    
    // Weapons with Attack stats
    "weapons/bearclaw_blade": {
        stats: { attack: 0, armor: 0, health: 5, speed: 0 }, // Attack equals missing health (special case)
        reason: "Attack: (equals missing health), Health: 5"
    },
    "weapons/bejeweled_blade": {
        stats: { attack: 1, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 1"
    },
    "weapons/blackbriar_blade": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/brittlebark_club": {
        stats: { attack: 7, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 7"
    },
    "weapons/brittlebark_bow": {
        stats: { attack: 4, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 4"
    },
    "weapons/explosive_sword": {
        stats: { attack: 3, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 3"
    },
    "weapons/featherweight_blade": {
        stats: { attack: 2, armor: 0, health: 0, speed: 2 },
        reason: "Attack: 2, Speed: 2"
    },
    "weapons/frostbite_dagger": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/gemstone_scepter": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/granite_hammer": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/granite_lance": {
        stats: { attack: 2, armor: 1, health: 0, speed: 0 },
        reason: "Attack: 2, Armor: 1"
    },
    "weapons/grindstone_club": {
        stats: { attack: 1, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 1"
    },
    "weapons/heart_drinker": {
        stats: { attack: 1, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 1"
    },
    "weapons/hidden_dagger": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/icicle_spear": {
        stats: { attack: 3, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 3"
    },
    "weapons/ironstone_bow": {
        stats: { attack: 6, armor: 0, health: 0, speed: 1 },
        reason: "Attack: 6, Speed: 1"
    },
    "weapons/ironstone_greatsword": {
        stats: { attack: 4, armor: 0, health: 0, speed: -2 },
        reason: "Attack: 4, Speed: -2"
    },
    "weapons/lifeblood_spear": {
        stats: { attack: 1, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 1"
    },
    "weapons/lifesteal_scythe": {
        stats: { attack: 1, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 1"
    },
    "weapons/royal_crownblade": {
        stats: { attack: 4, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 4"
    },
    "weapons/royal_scepter": {
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 0"
    },
    "weapons/stoneslab_sword": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/swiftstrike_bow": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/swiftstrike_rapier": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/sword_of_the_hero": {
        stats: { attack: 3, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 3"
    },
    "weapons/twin_blade": {
        stats: { attack: 1, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 1"
    },
    "weapons/woodcutters_axe": {
        stats: { attack: 1, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 1"
    },

    // Armor Items
    "items/blastcap_armor": {
        stats: { attack: 0, armor: 8, health: 0, speed: 0 },
        reason: "Armor: 8"
    },
    "items/bramble_buckler": {
        stats: { attack: 0, armor: 2, health: 0, speed: 0 },
        reason: "Armor: 2"
    },
    "items/brittlebark_buckler": {
        stats: { attack: 0, armor: 10, health: 0, speed: 0 },
        reason: "Armor: 10"
    },
    "items/double_plated_armor": {
        stats: { attack: 0, armor: 2, health: 0, speed: -2 },
        reason: "Armor: 2, Speed: -2"
    },
    "items/frostbite_armor": {
        stats: { attack: 0, armor: 2, health: 0, speed: 0 },
        reason: "Armor: 2"
    },
    "items/horned_helmet": {
        stats: { attack: 0, armor: 2, health: 0, speed: 0 },
        reason: "Armor: 2"
    },
    "items/iceblock_shield": {
        stats: { attack: 0, armor: 8, health: 0, speed: 0 },
        reason: "Armor: 8"
    },
    "items/ironstone_bracelet": {
        stats: { attack: 0, armor: 2, health: 0, speed: -1 },
        reason: "Armor: 2, Speed: -1"
    },
    "items/leather_vest": {
        stats: { attack: 0, armor: 2, health: 0, speed: 1 },
        reason: "Armor: 2, Speed: 1"
    },
    "items/redwood_helmet": {
        stats: { attack: 0, armor: 1, health: 1, speed: 0 },
        reason: "Health: 1, Armor: 1"
    },
    "items/royal_helmet": {
        stats: { attack: 0, armor: 1, health: 0, speed: 0 },
        reason: "Armor: 1"
    },
    "items/shield_of_the_hero": {
        stats: { attack: 0, armor: 3, health: 0, speed: 0 },
        reason: "Armor: 3"
    },

    // Health Items
    "items/blood_sausage": {
        stats: { attack: 0, armor: 0, health: 5, speed: 0 },
        reason: "Health: 5"
    },
    "items/bramble_vest": {
        stats: { attack: 0, armor: 0, health: 3, speed: 0 },
        reason: "Health: 3"
    },
    "items/brittlebark_armor": {
        stats: { attack: 0, armor: 0, health: 12, speed: 0 },
        reason: "Health: 12"
    },
    "items/emerald_crown": {
        stats: { attack: -1, armor: 0, health: 8, speed: 0 },
        reason: "Attack: -1, Health: 8"
    },
    "items/explosive_roast": {
        stats: { attack: 0, armor: 0, health: 5, speed: 0 },
        reason: "Health: 5"
    },
    "items/leather_glove": {
        stats: { attack: 0, armor: 0, health: 3, speed: 1 },
        reason: "Health: 3, Speed: 1"
    },
    "items/redwood_cloak": {
        stats: { attack: 0, armor: 0, health: 2, speed: 0 },
        reason: "Health: 2"
    },
    "items/roasted_chestnut": {
        stats: { attack: 0, armor: 0, health: 5, speed: 0 },
        reason: "Health: 5"
    },
    "items/rock_roast": {
        stats: { attack: 0, armor: 0, health: 6, speed: 6 },
        reason: "Health: 6, Armor: 6 (note: document shows both)"
    },

    // Speed Items
    "items/boots_of_the_hero": {
        stats: { attack: 0, armor: 0, health: 0, speed: 2 },
        reason: "Speed: 2"
    },
    "items/ironstone_sandals": {
        stats: { attack: 0, armor: 0, health: 0, speed: -1 },
        reason: "Speed: -1"
    },
    "items/ruby_crown": {
        stats: { attack: 1, armor: 0, health: 0, speed: -1 },
        reason: "Attack: 1, Speed: -1"
    },
    "items/saffron_feather": {
        stats: { attack: 0, armor: 0, health: 0, speed: 1 },
        reason: "Speed: 1"
    },
    "items/swiftstrike_cloak": {
        stats: { attack: 0, armor: 0, health: 0, speed: 1 },
        reason: "Speed: 1"
    },

    // Multi-stat Items
    "items/elderwood_necklace": {
        stats: { attack: 1, armor: 1, health: 0, speed: 1 },
        reason: "Attack: 1, Armor: 1, Speed: 1"
    },
    "weapons/elderwood_staff": {
        stats: { attack: 1, armor: 1, health: 0, speed: 1 },
        reason: "Attack: 1, Armor: 1, Speed: 1"
    },

    // SWAMPLAND ITEMS
    "weapons/ancient_warhammer": {
        stats: { attack: 5, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 5"
    },
    "weapons/arcane_wand": {
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 0"
    },
    "weapons/basilisk_fang": {
        stats: { attack: 3, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 3"
    },
    "weapons/bloodlords_axe": {
        stats: { attack: 4, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 4"
    },
    "weapons/bubblegloop_staff": {
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 0"
    },
    "weapons/champions_blade": {
        stats: { attack: 6, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 6"
    },
    "weapons/chainmail_sword": {
        stats: { attack: 2, armor: 2, health: 0, speed: 0 },
        reason: "Attack: 2, Armor: 2"
    },
    "weapons/cleaver_of_wrath": {
        stats: { attack: 10, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 10"
    },
    "weapons/dashmasters_dagger": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/fungal_rapier": {
        stats: { attack: 3, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 3"
    },
    "weapons/forge_hammer": {
        stats: { attack: 4, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 4"
    },
    "weapons/gale_staff": {
        stats: { attack: 2, armor: 0, health: 0, speed: 6 },
        reason: "Attack: 2, Speed: 6"
    },
    "weapons/granite_axe": {
        stats: { attack: 4, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 4"
    },
    "weapons/grilling_skewer": {
        stats: { attack: 1, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 1"
    },
    "weapons/holy_shield": {
        stats: { attack: -1, armor: 6, health: 0, speed: -1 },
        reason: "Attack: -1, Armor: 6, Speed: -1"
    },
    "weapons/holy_tome": {
        stats: { attack: -1, armor: 0, health: 0, speed: 0 },
        reason: "Attack: -1"
    },
    "weapons/ironstone_spear": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/kings_blade": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/knights_blade": {
        stats: { attack: 4, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 4"
    },
    "weapons/leather_whip": {
        stats: { attack: 4, armor: 0, health: 5, speed: 0 },
        reason: "Attack: 4, Health: 5"
    },
    "weapons/liferoot_hammer": {
        stats: { attack: 3, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 3"
    },
    "weapons/liferoot_staff": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/lightning_elixir": {
        stats: { attack: 3, armor: 0, health: 0, speed: 4 },
        reason: "Attack: 3, Speed: 4"
    },
    "weapons/lightning_rod": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/lightning_whip": {
        stats: { attack: 3, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 3"
    },
    "weapons/melting_iceblade": {
        stats: { attack: 8, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 8"
    },
    "weapons/moonlight_cleaver": {
        stats: { attack: 3, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 3"
    },
    "weapons/pacifist_staff": {
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 0"
    },
    "weapons/purelake_staff": {
        stats: { attack: 1, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 1"
    },
    "weapons/riverflow_rapier": {
        stats: { attack: 3, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 3"
    },
    "weapons/rusty_sword": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/sanguine_scepter": {
        stats: { attack: 1, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 1"
    },
    "weapons/serpent_dagger": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/silverscale_dagger": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/silverscale_trident": {
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 0"
    },
    "weapons/slime_sword": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/squires_blade": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/stormcloud_spear": {
        stats: { attack: 2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 2"
    },
    "weapons/tempest_blade": {
        stats: { attack: 0, armor: 0, health: 0, speed: 2 }, // Attack equals Speed (special case)
        reason: "Attack: (equals Speed), Speed: 2"
    },
    "weapons/thunderbound_sabre": {
        stats: { attack: 6, armor: 0, health: 0, speed: 0 },
        reason: "Attack: 6"
    },
    "weapons/wave_breaker": {
        stats: { attack: -2, armor: 0, health: 0, speed: 0 },
        reason: "Attack: -2"
    },

    // Swampland Armor Items
    "items/champions_armor": {
        stats: { attack: 0, armor: 6, health: 0, speed: 0 },
        reason: "Armor: 6"
    },
    "items/knights_armor": {
        stats: { attack: 0, armor: 4, health: 0, speed: 0 },
        reason: "Armor: 4"
    },
    "items/purelake_helmet": {
        stats: { attack: 0, armor: 2, health: 0, speed: 0 },
        reason: "Armor: 2"
    },

    // Swampland Health Items
    "items/liferoot_gauntlet": {
        stats: { attack: 0, armor: 0, health: 3, speed: 0 },
        reason: "Health: 3"
    },

    // Swampland Speed Items
    "items/sour_lemon": {
        stats: { attack: 0, armor: 0, health: 0, speed: 3 },
        reason: "Speed: 3"
    }
};

function applyComprehensiveCorrections() {
    console.log('\n🔧 APPLYING COMPREHENSIVE STAT CORRECTIONS FROM REFERENCE DOCUMENT\n');
    console.log('=' . repeat(70));
    
    const detailsPath = path.join(__dirname, 'details.json');
    const backupPath = path.join(__dirname, 'details_backup_comprehensive_' + Date.now() + '.json');
    
    // Create backup
    const data = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    console.log(`📁 Backup created: ${path.basename(backupPath)}`);
    
    let correctedCount = 0;
    let notFoundCount = 0;
    const correctionLog = [];
    
    // Apply corrections
    Object.entries(COMPREHENSIVE_STAT_CORRECTIONS).forEach(([itemKey, correction]) => {
        if (data[itemKey]) {
            const before = { ...data[itemKey].stats };
            data[itemKey].stats = correction.stats;
            
            console.log(`✅ ${data[itemKey].name || itemKey}:`);
            console.log(`   Before: ${JSON.stringify(before)}`);
            console.log(`   After:  ${JSON.stringify(correction.stats)}`);
            console.log(`   Source: ${correction.reason}`);
            console.log('');
            
            correctionLog.push({
                item: itemKey,
                name: data[itemKey].name,
                before,
                after: correction.stats,
                reason: correction.reason
            });
            
            correctedCount++;
        } else {
            console.log(`❌ Not found: ${itemKey}`);
            notFoundCount++;
        }
    });
    
    // Save the corrected data
    fs.writeFileSync(detailsPath, JSON.stringify(data, null, 2));
    
    // Save correction log
    const logPath = path.join(__dirname, 'stat_corrections_log.json');
    fs.writeFileSync(logPath, JSON.stringify(correctionLog, null, 2));
    
    console.log(`\n📊 COMPREHENSIVE CORRECTION SUMMARY:`);
    console.log(`  ✅ Items corrected: ${correctedCount}`);
    console.log(`  ❌ Items not found: ${notFoundCount}`);
    console.log(`  📄 Correction log: ${path.basename(logPath)}`);
    console.log(`  💾 Backup location: ${backupPath}`);
    
    // Count remaining zero-stat items
    const remainingZeroStats = Object.keys(data).filter(key => {
        const stats = data[key].stats;
        return stats && Object.values(stats).every(v => v === 0);
    });
    
    console.log(`\n📈 REMAINING ZERO-STAT ITEMS: ${remainingZeroStats.length}`);
    console.log('   (Down from ~276 before corrections)');
    
    return { correctedCount, notFoundCount, remainingZeroStats: remainingZeroStats.length };
}

if (require.main === module) {
    const results = applyComprehensiveCorrections();
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Run validation script to verify corrections');
    console.log('2. Test with battle simulations');
    console.log('3. Review remaining zero-stat items if any');
    
    console.log('\n✅ Comprehensive stat corrections applied successfully');
}

module.exports = { applyComprehensiveCorrections, COMPREHENSIVE_STAT_CORRECTIONS };
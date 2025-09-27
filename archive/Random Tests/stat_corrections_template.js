#!/usr/bin/env node

/**
 * STAT CORRECTIONS TEMPLATE
 * 
 * This file contains 276 items that currently have all-zero stats.
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
    "items/rocksalt_sword": {
        // Rocksalt Sword - Turn Start: if health is full, gain 1 extra Strike...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "items/silverscale_swordfish": {
        // Silverscale Swordfish - Battle Start: Gain 1 extra Strike; first turn on hit give 1 ...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "weapons/ancient_warhammer": {
        // Ancient Warhammer - On Hit: Remove all of the enemy's armor...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "weapons/arcane_wand": {
        // Arcane Wand - Can't attack. Turn Start: Deal 2 damage. Increase the damage...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "weapons/banish_hammer": {
        // Banish Hammer - Battle Start: Remove all tomes from the enemy before they tr...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "weapons/basilisk_fang": {
        // Basilisk Fang - On Hit: Decrease your poison by 2 and give it to the enemy...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "weapons/battle_axe": {
        // Battle Axe - While the enemy has armor double your attack...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "weapons/bearclaw_blade": {
        // Bearclaw Blade - Attack is always equal to missing health...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "weapons/bejeweled_blade": {
        // Bejeweled Blade - Gain 2 attack for each equipped jewelry item...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "weapons/blackbriar_blade": {
        // Blackbriar Blade - Whenever you would gain thorns, gain 1 attack instead...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    // ARMOR ITEMS (should typically have armor or health > 0)
    "items/arcane_shield": {
        // Arcane Shield - Whenever a countdown effect triggers, gain 3 armor...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "items/chainmail_armor": {
        // Chainmail Armor - Wounded: Regain your base armor...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "items/cracked_bouldershield": {
        // Cracked Bouldershield - Exposed: Gain 7 armor...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "items/featherweight_armor": {
        // Featherweight Armor - Whenever you gain speed, also gain an equal amount of armor...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "items/frostbite_armor": {
        // Frostbite Armor - The enemy's first strike deals double damage, afterwards the...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    // SPEED ITEMS (boots, etc. - should typically have speed > 0)
    "items/assault_greaves": {
        // Assault Greaves - Whenever you take damage, deal 1 damage...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "items/briar_greaves": {
        // Briar Greaves - On Hit: If you have thorns, gain 1 armor....
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "items/champion_s_greaves": {
        // Champion's Greaves - -...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "items/featherweight_greaves": {
        // Featherweight Greaves - Turn Start: If you have 0 speed, gain 1 speed...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    "items/frostbite_greaves": {
        // Frostbite Greaves - Whenever you lose speed, give the enemy 1 freeze...
        stats: { attack: 0, armor: 0, health: 0, speed: 0 },
        verified: false
    },

    // TODO: Add corrections for remaining 256 items
    // You can copy the format above and fill in the correct stats
};

module.exports = { STAT_CORRECTIONS };
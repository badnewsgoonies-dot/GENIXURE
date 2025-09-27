/*
 * This file provides the full code needed to implement the remaining Battle Start effects
 * described in the game’s wiki. It includes new engine actions for `heic_sim.js` and
 * JSON snippets to insert into `details.json` for each item or weapon.  Comments
 * are provided for context.  These definitions assume the rest of the engine and data
 * structures follow the conventions of the existing codebase.
 */

/***************************
 * Engine: New Actions
 *
 * Insert these functions into the EFFECT_ACTIONS object in heic_sim.js.
 ***************************/

// Drain HP from the opponent and heal yourself by the same amount
life_drain: ({ self, other, log, value }) => {
  const dmg = value || 1;
  other.takeDamage(dmg);
  const healed = self.heal(dmg);
  log(`${other.name} loses ${dmg} HP, ${self.name} restores ${healed} HP`);
},

// For each negative point of a base stat (e.g., negative base attack), give the enemy a status
add_status_to_enemy_per_negative_base_stat: ({ self, other, log, value }) => {
  const { stat, status, perValue } = value;
  const baseVal = self.baseStats?.[stat] || 0;
  if (baseVal < 0) {
    const amount = Math.abs(baseVal) * (perValue || 1);
    other.addStatus(status, amount);
    log(`${other.name} gains ${amount} ${status} (per negative ${stat})`);
  }
},

// Reduce enemy’s stat and add it to the player
steal_stat: ({ self, other, log, value }) => {
  const { stat, amount } = value;
  const stealAmt = Math.min(amount, other[stat] || 0);
  if (stealAmt > 0) {
    other[stat] -= stealAmt;
    self[stat] += stealAmt;
    log(`${self.name} steals ${stealAmt} ${stat} from ${other.name}`);
  }
},

// Gain armor equal to your current HP
gain_armor_equal_to_current_hp: ({ self, log }) => {
  const amt = self.hp || 0;
  if (amt > 0) {
    self.addArmor(amt);
    log(`${self.name} gains ${amt} armor (equal to current HP)`);
  }
},

// Steal half of the enemy’s current HP and convert it into armor
convert_enemy_half_hp_to_armor: ({ self, other, log }) => {
  const stolen = Math.floor(other.hp / 2);
  other.hp -= stolen;
  self.addArmor(stolen);
  log(`${self.name} steals ${stolen} HP from ${other.name} and gains that much armor`);
},

// Restore HP equal to a stat (e.g., speed)
restore_health_equal_to_stat: ({ self, log, stat }) => {
  const value = self[stat] || 0;
  if (value > 0) {
    const healed = self.heal(value);
    log(`${self.name} restores ${healed} health (equal to ${stat})`);
  }
},

// Convert one status stack into attack points
convert_status_to_attack: ({ self, log, value }) => {
  const { from, amountPerStack, stacksToUse } = value;
  const use = Math.min(stacksToUse || 1, self.statuses[from] || 0);
  if (use > 0) {
    self.addStatus(from, -use);
    const gained = use * (amountPerStack || 2);
    self.addAtk(gained);
    log(`${self.name} converts ${use} ${from} into ${gained} attack`);
  }
},

// Give the enemy extra strikes at battle start
add_strikes_to_enemy: ({ other, log, value }) => {
  const amt = value || 1;
  other.strikes = (other.strikes || 0) + amt;
  log(`${other.name} gains ${amt} additional strikes`);
},

// Increase damage of the next bomb thrown
increase_next_bomb_damage: ({ self, log, value }) => {
  self.flags.nextBombBonus = (self.flags.nextBombBonus || 0) + (value || 3);
  log(`${self.name}'s next bomb will deal an extra ${value} damage`);
},

// Transfer a random status (e.g. freeze, poison) from player to enemy
transfer_random_status: ({ self, other, log, value }) => {
  const keys = Object.keys(self.statuses).filter(k => self.statuses[k] > 0);
  if (keys.length > 0) {
    const idx = Math.floor(Math.random() * keys.length);
    const status = keys[idx];
    const amount = (typeof value?.amount === 'object') ? 1 : (value?.amount || 1);
    const transfer = Math.min(amount, self.statuses[status]);
    self.addStatus(status, -transfer);
    other.addStatus(status, transfer);
    log(`${self.name} transfers ${transfer} ${status} to ${other.name}`);
  }
},

/***************************
 * Data: Effect definitions for missing Battle Start items/weapons.
 *
 * Each entry should be merged into the corresponding item/weapon in details.json
 * under its `effects` array.
 ***************************/
const battleStartEffects = {
  // Weapons
  'weapons/bloodlords_axe': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'life_drain', value: 5 } ]
    }
  ],
  'weapons/dashmasters_dagger': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'add_strikes_equal_to_speed' } ]
    }
  ],
  'weapons/frozen_iceblade': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'add_status', status: 'freeze', value: { base: 3, gold: 6, diamond: 12 } } ]
    }
  ],
  'weapons/fungal_rapier': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'add_status', status: 'poison', value: 1 } ]
    }
  ],
  'weapons/grilling_skewer': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'add_strikes', value: 1 } ]
    }
  ],
  'weapons/ring_blades': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'steal_stat', value: { stat: 'attack', amount: 1 } } ]
    }
  ],
  'weapons/slime_sword': [
    {
      trigger: 'battleStart',
      actions: [
        { type: 'add_status', status: 'acid', value: 3 },
        { type: 'add_status_to_enemy', status: 'acid', value: 3 }
      ]
    }
  ],
  'weapons/wave_breaker': [
    {
      trigger: 'battleStart',
      actions: [
        {
          type: 'add_status_to_enemy_per_negative_base_stat',
          value: { stat: 'attack', status: 'riptide', perValue: 2 }
        }
      ]
    }
  ],

  // Standard items
  'items/basilisk_scale': [
    {
      trigger: 'battleStart',
      actions: [
        { type: 'gain_stat', stat: 'armor', value: 5 },
        { type: 'add_status', status: 'poison', value: 5 }
      ]
    }
  ],
  'items/bramble_belt': [
    {
      trigger: 'battleStart',
      actions: [
        { type: 'add_status', status: 'thorns', value: 1 },
        { type: 'add_strikes_to_enemy', value: 1 }
      ]
    }
  ],
  'items/clearspring_feather': [
    {
      trigger: 'battleStart',
      actions: [
        { type: 'transfer_random_status', value: { amount: { base: 1, gold: 2, diamond: 4 } } }
      ]
    }
  ],
  'items/corroded_bone': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'convert_enemy_half_hp_to_armor' } ]
    }
  ],
  'items/crimson_fang': [
    {
      trigger: 'battleStart',
      conditions: [ { type: 'hp_equal_max' } ],
      actions: [
        { type: 'deal_damage', target: 'self', value: 5 },
        { type: 'add_strikes', value: 2 }
      ]
    }
  ],
  // Featherweight Helmet is already implemented.
  'items/frostbite_gauntlet': [
    {
      trigger: 'battleStart',
      actions: [
        { type: 'add_status_to_enemy', status: 'freeze', value: { base: 1, gold: 2, diamond: 4 } }
      ]
    }
  ],
  'items/lifeblood_armor': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'convert_health_to_armor', value: 0.5 } ]
    }
  ],
  'items/lightspeed_potion': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'restore_health_equal_to_stat', stat: 'speed' } ]
    }
  ],
  // Ore Heart handled elsewhere.
  'items/rusty_ring': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'add_status_to_enemy', status: 'acid', value: { base: 1, gold: 2, diamond: 4 } } ]
    }
  ],
  'items/saltcrusted_crown': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'add_status', status: 'riptide', value: 1 } ]
    }
  ],
  'items/sapphire_ring': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'steal_stat', value: { stat: 'attack', amount: { base: 2, gold: 4, diamond: 8 } } } ]
    }
  ],
  'items/slime_armor': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'add_status', status: 'acid', value: { base: 1, gold: 2, diamond: 4 } } ]
    }
  ],
  'items/slime_booster': [
    {
      trigger: 'battleStart',
      actions: [
        { type: 'convert_status_to_attack', value: { from: 'acid', stacksToUse: { base: 1, gold: 2, diamond: 3 }, amountPerStack: { base: 2, gold: 4, diamond: 6 } } }
      ]
    }
  ],
  'items/sour_lemon': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'add_status', status: 'acid', value: { base: 1, gold: 2, diamond: 4 } } ]
    }
  ],
  'items/stormcloud_armor': [
    {
      trigger: 'battleStart',
      conditions: [ { type: 'speed_greater_than_armor' } ],
      actions: [ { type: 'stun_enemy_for_turns', value: { base: 2, gold: 3, diamond: 4 } } ]
    }
  ],
  'items/weaver_armor': [
    {
      trigger: 'battleStart',
      conditions: [ { type: 'base_stat_zero', stat: 'armor' } ],
      actions: [ { type: 'gain_armor_equal_to_current_hp' } ]
    }
  ],
  'items/weaver_shield': [
    {
      trigger: 'battleStart',
      conditions: [ { type: 'base_stat_zero', stat: 'armor' } ],
      actions: [ { type: 'gain_stat', stat: 'armor', value: { base: 4, gold: 8, diamond: 16 } } ]
    }
  ],
  'items/swiftstrike_belt': [
    {
      trigger: 'battleStart',
      actions: [
        { type: 'deal_damage', target: 'self', value: { base: 3, gold: 4, diamond: 5 } },
        { type: 'add_strikes', value: { base: 1, gold: 2, diamond: 3 } }
      ]
    }
  ],
  'items/thorn_ring': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'deal_damage', target: 'self', value: 5 }, { type: 'add_status', status: 'thorns', value: 10 } ]
    }
  ],
  'items/kindling_bomb': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'deal_damage', value: 1 }, { type: 'increase_next_bomb_damage', value: 3 } ]
    }
  ],
  'items/friendship_bracelet': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'steal_stat', value: { stat: 'attack', amount: 1 } } ]
    }
  ],

  // Cauldron items
  'items/melon_bomb': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'decrease_random_status', value: 1 }, { type: 'deal_damage', value: 1 } ]
    }
  ],
  'items/cherry_blade': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'deal_damage', value: 4 } ]
    }
  ],
  'items/explosive_roast': [
    {
      trigger: 'battleStart',
      actions: [ { type: 'deal_damage', value: 1 }, { type: 'deal_damage', value: 1 }, { type: 'deal_damage', value: 1 } ]
    }
  ]
};

module.exports = { battleStartEffects };

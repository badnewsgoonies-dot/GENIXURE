/*
 * Complete effect implementation for He Is Coming items with Battle Start,
 * Exposed and Wounded triggers.  This module defines helper actions used
 * by the data‑driven engine and provides effect definitions for all
 * remaining items that were missing implementations in the original
 * codebase.  Each effect uses the same schema as existing entries in
 * details.js: a trigger (e.g. "battleStart", "onExposed", "onWounded"),
 * optional conditions, and a sequence of actions with parameters.  The
 * action handlers are designed to slot into the global EFFECT_ACTIONS
 * dictionary within heic_sim.js.  Conditions are evaluated by the
 * engine’s existing condition system (e.g. hp_equal_max, min_armor,
 * speed_greater_than_armor, player_has_status, etc.).
 */

/**
 * Helper action implementations.  These functions are intended to be
 * merged into the engine’s EFFECT_ACTIONS object so the simulation
 * runtime can invoke them.  They operate on `self` (the acting unit),
 * `other` (the opposing unit) and `log` (a function for logging text to
 * the event log).  Some actions use a `value` payload to carry
 * additional parameters or scaling tiers (base/gold/diamond).  The
 * existing engine already defines many helpers such as add_status,
 * remove_status, gain_stat, steal_speed, etc.  The actions below
 * complement those built‑ins with behaviour specific to the remaining
 * items listed on the He Is Coming wiki.
 */

const CustomEffectActions = {
  /**
   * Drain life from the enemy equal to `value`.  Damage is dealt
   * directly to the opponent’s HP and the acting unit heals for the
   * same amount.  If the value is not specified, a default of 1 is
   * used.  This action powers Bloodlord’s Axe at battle start.
   */
  life_drain({ self, other, log, value }) {
    const dmg = typeof value === 'number' ? value : 1;
    const healed = self.heal(dmg);
    other.takeDamage(dmg);
    log(`${self.name} drains ${dmg} health from ${other.name}`);
    if (healed < dmg) {
      log(`${self.name} heals ${healed} HP (capped at max)`);
    }
  },

  /**
   * For each negative point of a specified base stat, apply a status to
   * the enemy.  `stat` is the name of the base stat to check
   * (typically "attack"), `status` is the status to apply (e.g.
   * "riptide"), and `perValue` is the number of stacks per point.
   */
  add_status_to_enemy_per_negative_base_stat({ self, other, log, value }) {
    const statName = value?.stat || 'attack';
    const status = value?.status || 'riptide';
    const per = value?.perValue || 1;
    const baseVal = self.baseStats?.[statName] || 0;
    if (baseVal < 0) {
      const total = Math.abs(baseVal) * per;
      other.addStatus(status, total);
      log(`${other.name} gains ${total} ${status} (per negative ${statName})`);
    }
  },

  /**
   * Steal a fixed amount of a stat from the enemy.  The enemy loses
   * up to `amount` points of `stat`, and the acting unit gains the
   * same amount.  If the enemy has less than `amount`, only the
   * available portion is stolen.
   */
  steal_stat({ self, other, log, value }) {
    const statName = value?.stat || 'attack';
    const amount = typeof value?.amount === 'number' ? value.amount : 1;
    const stealAmt = Math.min(amount, other[statName] || 0);
    if (stealAmt > 0) {
      other[statName] -= stealAmt;
      self[statName] = (self[statName] || 0) + stealAmt;
      log(`${self.name} steals ${stealAmt} ${statName} from ${other.name}`);
    }
  },

  /**
   * Gain armor equal to the actor’s current HP.  Used by Weaver
   * Armor when the wearer starts the battle with zero base armor.
   */
  gain_armor_equal_to_current_hp({ self, log }) {
    const amt = self.hp || 0;
    if (amt > 0) {
      self.addArmor(amt);
      log(`${self.name} gains ${amt} armor (equal to current HP)`);
    }
  },

  /**
   * Convert half of the enemy’s current HP into armor for the actor.
   * The enemy loses the converted amount and the actor gains the same
   * amount of armor.  Used by Corroded Bone.
   */
  convert_enemy_half_hp_to_armor({ self, other, log }) {
    const stolen = Math.floor(other.hp / 2);
    if (stolen > 0) {
      other.takeDamage(stolen);
      self.addArmor(stolen);
      log(`${self.name} converts ${stolen} of ${other.name}'s HP into armor`);
    }
  },

  /**
   * Restore health equal to one of the actor’s stats.  The `stat` field
   * specifies which stat to read (e.g. "speed").  If that stat is
   * negative or zero, no healing occurs.
   */
  restore_health_equal_to_stat({ self, log, stat }) {
    const value = self[stat] || 0;
    if (value > 0) {
      const healed = self.heal(value);
      log(`${self.name} restores ${healed} health (equal to ${stat})`);
    }
  },

  /**
   * Convert a number of status stacks into attack.  `from` names the
   * status to consume, `amountPerStack` is the attack gained per
   * stack, and `stacksToUse` is the number of stacks to convert.  If
   * the actor has fewer than `stacksToUse` stacks, all available
   * stacks are used.  This action is used by Slime Booster.
   */
  convert_status_to_attack({ self, log, value }) {
    const from = value?.from || 'acid';
    // Determine stacks to use (base/gold/diamond) if provided as an object
    const stacksField = value?.stacksToUse;
    let stacks = 1;
    if (typeof stacksField === 'number') {
      stacks = stacksField;
    } else if (stacksField && typeof stacksField === 'object') {
      const tier = self.tier || 0;
      // tier: 0=base,1=gold,2=diamond
      if (tier === 2 && typeof stacksField.diamond === 'number') {
        stacks = stacksField.diamond;
      } else if (tier === 1 && typeof stacksField.gold === 'number') {
        stacks = stacksField.gold;
      } else if (typeof stacksField.base === 'number') {
        stacks = stacksField.base;
      }
    }
    const perField = value?.amountPerStack;
    let per = 2;
    if (typeof perField === 'number') {
      per = perField;
    } else if (perField && typeof perField === 'object') {
      const tier = self.tier || 0;
      if (tier === 2 && typeof perField.diamond === 'number') {
        per = perField.diamond;
      } else if (tier === 1 && typeof perField.gold === 'number') {
        per = perField.gold;
      } else if (typeof perField.base === 'number') {
        per = perField.base;
      }
    }
    const available = self.statuses[from] || 0;
    const toUse = Math.min(stacks, available);
    if (toUse > 0) {
      self.addStatus(from, -toUse);
      const gained = toUse * per;
      self.addAtk(gained);
      log(`${self.name} converts ${toUse} ${from} into ${gained} attack`);
    }
  },

  /**
   * Add a fixed number of extra strikes to the enemy.  This increases
   * the number of times the enemy will strike during their next action.
   */
  add_strikes_to_enemy({ other, log, value }) {
    const amt = typeof value === 'number' ? value : 1;
    other.strikes = (other.strikes || 0) + amt;
    log(`${other.name} gains ${amt} extra strike${amt === 1 ? '' : 's'}`);
  },

  /**
   * Increase the damage of the next bomb thrown by the actor.  This
   * sets a temporary flag which the bomb system can read to apply
   * additional damage.  The flag persists until the next bomb is
   * detonated.
   */
  increase_next_bomb_damage({ self, log, value }) {
    const bonus = typeof value === 'number' ? value : 3;
    self.flags = self.flags || {};
    self.flags.nextBombBonus = (self.flags.nextBombBonus || 0) + bonus;
    log(`${self.name}'s next bomb will deal +${bonus} damage`);
  },

  /**
   * Transfer a random status from the actor to the enemy.  `value` may
   * specify an `amount` object containing tiered values (base/gold/
   * diamond).  By default 1 stack is transferred.  This action powers
   * Clearspring Feather.
   */
  transfer_random_status({ self, other, log, value }) {
    const keys = Object.keys(self.statuses).filter(k => self.statuses[k] > 0);
    if (keys.length === 0) return;
    const idx = Math.floor(Math.random() * keys.length);
    const status = keys[idx];
    // Determine how many stacks to transfer
    let amount = 1;
    const amountField = value?.amount;
    if (typeof amountField === 'number') {
      amount = amountField;
    } else if (amountField && typeof amountField === 'object') {
      const tier = self.tier || 0;
      if (tier === 2 && typeof amountField.diamond === 'number') {
        amount = amountField.diamond;
      } else if (tier === 1 && typeof amountField.gold === 'number') {
        amount = amountField.gold;
      } else if (typeof amountField.base === 'number') {
        amount = amountField.base;
      }
    }
    const available = self.statuses[status] || 0;
    const transfer = Math.min(amount, available);
    if (transfer > 0) {
      self.addStatus(status, -transfer);
      other.addStatus(status, transfer);
      log(`${self.name} transfers ${transfer} ${status} to ${other.name}`);
    }
  },

  /**
   * Gain thorns equal to the enemy’s current attack.  Used by Razor
   * Breastplate when the owner becomes Wounded.
   */
  gain_thorns_equal_to_enemy_attack({ self, other, log }) {
    const amt = other.atk || 0;
    if (amt > 0) {
      self.addStatus('thorns', amt);
      log(`${self.name} gains ${amt} thorns (equal to enemy attack)`);
    }
  },

  /**
   * Gain armor equal to the amount of health lost (maxHP - current HP).
   * Used by Slime Potion on Wounded.  This does not heal HP, it
   * simply adds the missing HP as armor.
   */
  gain_armor_equal_to_lost_health({ self, log }) {
    const lost = Math.max(0, (self.maxHp || 0) - (self.hp || 0));
    if (lost > 0) {
      self.addArmor(lost);
      log(`${self.name} gains ${lost} armor (equal to lost health)`);
    }
  },

  /**
   * Gain gold.  Many Wounded items award raw gold instead of stats.
   * The amount can be tiered (base/gold/diamond).  The player's gold
   * pool is updated accordingly.
   */
  gain_gold({ self, log, value }) {
    // Determine amount by tier
    let amount = 0;
    if (typeof value === 'number') {
      amount = value;
    } else if (value && typeof value === 'object') {
      const tier = self.tier || 0;
      if (tier === 2 && typeof value.diamond === 'number') {
        amount = value.diamond;
      } else if (tier === 1 && typeof value.gold === 'number') {
        amount = value.gold;
      } else if (typeof value.base === 'number') {
        amount = value.base;
      }
    }
    if (amount > 0) {
      self.gold = (self.gold || 0) + amount;
      log(`${self.name} gains ${amount} gold`);
    }
  },

  /**
   * Trigger all Wounded effects immediately.  A helper used by
   * Blood Chain to retrigger all onWounded effects when the enemy
   * becomes wounded for the first time.  The `runEffects` method on
   * the actor should handle dispatching each effect with a retrigger
   * flag, avoiding infinite loops.
   */
  trigger_all_wounded_items({ self, log }) {
    if (typeof self.runEffects === 'function') {
      self.runEffects('onWounded', { retrigger: true });
      log(`${self.name} re-triggers all Wounded effects`);
    }
  },

  /**
   * Retrigger the last onWounded effect that was triggered.  Used by
   * Blood Rune.  This expects the actor to store the last triggered
   * item ID (self.lastWoundedItem) when the engine processes an
   * onWounded effect.
   */
  retrigger_last_wounded_item({ self, log }) {
    const last = self.lastWoundedItem;
    if (last && typeof self.runEffects === 'function') {
      self.runEffects('onWounded', { onlyItem: last, retrigger: true });
      log(`${self.name} re-triggers the last Wounded effect`);
    }
  },

  /**
   * Retrigger a random battleStart effect.  Used by Echo Rune.
   * Expects `effectsLog` on the actor to contain entries with
   * { trigger: 'battleStart', itemId }.  Picks one at random and
   * re-runs that effect.
   */
  retrigger_random_battle_start_item({ self, log }) {
    if (!Array.isArray(self.effectsLog)) return;
    const candidates = self.effectsLog.filter(e => e.trigger === 'battleStart');
    if (candidates.length === 0) return;
    const randomEntry = candidates[Math.floor(Math.random() * candidates.length)];
    if (randomEntry && typeof self.runEffects === 'function') {
      self.runEffects('battleStart', { onlyItem: randomEntry.itemId, retrigger: true });
      log(`${self.name} re-triggers a random battle-start effect`);
    }
  },

  /**
   * Convert all stacks of one status into another status.  Used by
   * Blood Orange to turn acid into regeneration.  Removes all stacks
   * of `from` and adds the same number of stacks to `to`.
   */
  convert_status({ self, log, value }) {
    const from = value?.from;
    const to = value?.to;
    if (!from || !to) return;
    const amt = self.statuses[from] || 0;
    if (amt > 0) {
      self.addStatus(from, -amt);
      self.addStatus(to, amt);
      log(`${self.name} converts ${amt} ${from} into ${amt} ${to}`);
    }
  },

  /**
   * Trigger Exposed and Wounded items at battle start, then disable
   * further onExposed/onWounded triggers.  Used by King’s Blade.
   */
  trigger_exposed_and_wounded_at_battle_start({ self, log }) {
    if (typeof self.runEffects === 'function') {
      self.runEffects('onExposed', { retrigger: true });
      self.runEffects('onWounded', { retrigger: true });
      self.flags = self.flags || {};
      self.flags.skipExposedAndWounded = true;
      log(`${self.name} triggers all Exposed and Wounded items at battle start`);
    }
  },

  /**
   * Prepare to strike repeatedly until the enemy becomes wounded.  This
   * sets a flag on the actor, which the engine’s turn loop should
   * check at the beginning of each of the actor’s turns.  While the
   * flag is set, the actor will continue to strike until the enemy
   * gains the Wounded status.  Used by Broken Winebottle.
   */
  strike_until_enemy_wounded({ self, other, log }) {
    self.flags = self.flags || {};
    self.flags.strikeUntilEnemyWounded = true;
    log(`${self.name} will keep striking until ${other.name} is wounded`);
  }
};

/**
 * Effect definitions for items with battleStart, onExposed and onWounded
 * triggers.  These arrays contain objects keyed by `slug` with an
 * `effects` array.  Each effect entry specifies its trigger and the
 * actions to perform.  Conditions follow the existing condition
 * syntax from details.js, allowing checks on current HP, statuses,
 * base stats, etc.  Values may be simple numbers or objects with
 * `base`, `gold` and `diamond` fields for tiered scaling.
 */

const battleStartEffects = [
  // Weapons
  {
    slug: 'weapons/bloodlords_axe',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'life_drain', value: 5 } ] }
    ]
  },
  {
    slug: 'weapons/dashmaster_s_dagger',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'add_strikes_equal_to_speed' } ] }
    ]
  },
  {
    slug: 'weapons/frozen_iceblade',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'add_status', status: 'freeze', value: { base: 3, gold: 6, diamond: 12 } } ] }
    ]
  },
  {
    slug: 'weapons/fungal_rapier',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'add_status', status: 'poison', value: 1 } ] }
    ]
  },
  {
    slug: 'weapons/grilling_skewer',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'add_strikes', value: 1 } ] }
    ]
  },
  {
    slug: 'weapons/ring_blades',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'steal_stat', value: { stat: 'attack', amount: 1 } } ] }
    ]
  },
  {
    slug: 'weapons/slime_sword',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'add_status', status: 'acid', value: 3 }, { type: 'add_status_to_enemy', status: 'acid', value: 3 } ] }
    ]
  },
  {
    slug: 'weapons/wave_breaker',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'add_status_to_enemy_per_negative_base_stat', value: { stat: 'attack', status: 'riptide', perValue: 2 } } ] }
    ]
  },
  // Standard items
  {
    slug: 'items/basilisk_scale',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'gain_stat', stat: 'armor', value: 5 }, { type: 'add_status', status: 'poison', value: 5 } ] }
    ]
  },
  {
    slug: 'items/bramble_belt',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'add_status', status: 'thorns', value: 1 }, { type: 'add_strikes_to_enemy', value: 1 } ] }
    ]
  },
  {
    slug: 'items/clearspring_feather',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'transfer_random_status', value: { amount: { base: 1, gold: 2, diamond: 4 } } } ] }
    ]
  },
  {
    slug: 'items/corroded_bone',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'convert_enemy_half_hp_to_armor' } ] }
    ]
  },
  {
    slug: 'items/crimson_fang',
    effects: [
      { trigger: 'battleStart', conditions: [ { type: 'hp_equal_max' } ], actions: [ { type: 'deal_damage', target: 'self', value: 5 }, { type: 'add_strikes', value: 2 } ] }
    ]
  },
  {
    slug: 'items/frostbite_gauntlet',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'add_status_to_enemy', status: 'freeze', value: { base: 1, gold: 2, diamond: 4 } } ] }
    ]
  },
  {
    slug: 'items/lifeblood_armor',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'convert_health_to_armor', value: 0.5 } ] }
    ]
  },
  {
    slug: 'items/lightspeed_potion',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'restore_health_equal_to_stat', stat: 'speed' } ] }
    ]
  },
  {
    slug: 'items/slime_armor',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'add_status', status: 'acid', value: { base: 1, gold: 2, diamond: 4 } } ] }
    ]
  },
  {
    slug: 'items/stormcloud_armor',
    effects: [
      { trigger: 'battleStart', conditions: [ { type: 'speed_greater_than_armor' } ], actions: [ { type: 'stun_enemy_for_turns', value: { base: 2, gold: 3, diamond: 4 } } ] }
    ]
  },
  {
    slug: 'items/weaver_armor',
    effects: [
      { trigger: 'battleStart', conditions: [ { type: 'base_stat_zero', stat: 'armor' } ], actions: [ { type: 'gain_armor_equal_to_current_hp' } ] }
    ]
  },
  {
    slug: 'items/rusty_ring',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'add_status_to_enemy', status: 'acid', value: { base: 1, gold: 2, diamond: 4 } } ] }
    ]
  },
  {
    slug: 'items/saltcrusted_crown',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'add_status', status: 'riptide', value: 1 } ] }
    ]
  },
  {
    slug: 'items/sapphire_ring',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'steal_stat', value: { stat: 'attack', amount: { base: 2, gold: 4, diamond: 8 } } } ] }
    ]
  },
  {
    slug: 'items/slime_booster',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'convert_status_to_attack', value: { from: 'acid', stacksToUse: { base: 1, gold: 2, diamond: 3 }, amountPerStack: { base: 2, gold: 4, diamond: 6 } } } ] }
    ]
  },
  {
    slug: 'items/sour_lemon',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'add_status', status: 'acid', value: { base: 1, gold: 2, diamond: 4 } } ] }
    ]
  },
  {
    slug: 'items/swiftstrike_belt',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'deal_damage', target: 'self', value: { base: 3, gold: 4, diamond: 5 } }, { type: 'add_strikes', value: { base: 1, gold: 2, diamond: 3 } } ] }
    ]
  },
  {
    slug: 'items/thorn_ring',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'deal_damage', target: 'self', value: 5 }, { type: 'add_status', status: 'thorns', value: 10 } ] }
    ]
  },
  {
    slug: 'items/weaver_shield',
    effects: [
      { trigger: 'battleStart', conditions: [ { type: 'base_stat_zero', stat: 'armor' } ], actions: [ { type: 'gain_stat', stat: 'armor', value: { base: 4, gold: 8, diamond: 16 } } ] }
    ]
  },
  {
    slug: 'items/kindling_bomb',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'deal_damage', value: 1 }, { type: 'increase_next_bomb_damage', value: 3 } ] }
    ]
  },
  {
    slug: 'items/friendship_bracelet',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'steal_stat', value: { stat: 'attack', amount: 1 } } ] }
    ]
  },
  // Cauldron items
  {
    slug: 'items/melon_bomb',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'decrease_random_status', value: 1 }, { type: 'deal_damage', value: 1 } ] }
    ]
  },
  {
    slug: 'items/cherry_blade',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'deal_damage', value: 4 } ] }
    ]
  },
  {
    slug: 'items/explosive_roast',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'deal_damage', value: 1 }, { type: 'deal_damage', value: 1 }, { type: 'deal_damage', value: 1 } ] }
    ]
  }
];

const exposedEffects = [
  // Exposed items (helmet, shields, food etc.)
  {
    slug: 'items/redwood_helmet',
    effects: [
      { trigger: 'onExposed', actions: [ { type: 'restore_health', value: { base: 3, gold: 6, diamond: 12 } } ] }
    ]
  },
  {
    slug: 'items/cracked_bouldershield',
    effects: [
      { trigger: 'onExposed', actions: [ { type: 'gain_stat', stat: 'armor', value: { base: 7, gold: 14, diamond: 28 } } ] }
    ]
  },
  {
    slug: 'items/royal_helmet',
    effects: [
      { trigger: 'onExposed', conditions: [ { type: 'min_gold', value: 21 } ], actions: [ { type: 'gain_stat', stat: 'armor', value: { base: 10, gold: 20, diamond: 30 } } ] }
    ]
  },
  {
    slug: 'items/leather_waterskin',
    effects: [
      { trigger: 'onExposed', actions: [ { type: 'gain_status_per_tagged_item', value: { tag: 'Water', status: 'purity', base: 2, gold: 4, diamond: 6 } } ] }
    ]
  },
  {
    slug: 'items/twisted_root',
    effects: [
      { trigger: 'onExposed', actions: [ { type: 'gain_status_per_tagged_item', value: { tag: 'Wood', status: 'regeneration', base: 1, gold: 2, diamond: 4 } } ] }
    ]
  },
  {
    slug: 'items/purelake_armor',
    effects: [
      { trigger: 'onExposed', conditions: [ { type: 'player_has_status', status: 'purity', min: 1 } ], actions: [ { type: 'remove_status', status: 'purity', value: 1 }, { type: 'gain_stat', stat: 'armor', value: { base: 5, gold: 10, diamond: 20 } } ] }
    ]
  },
  {
    slug: 'items/riverflow_violin',
    effects: [
      { trigger: 'onExposed', actions: [ { type: 'gain_stat', stat: 'armor', value: { base: 4, gold: 8, diamond: 16 } } ] }
    ]
  },
  {
    slug: 'items/silverscale_fish',
    effects: [
      { trigger: 'onExposed', actions: [ { type: 'add_status_to_enemy', status: 'riptide', value: { base: 1, gold: 2, diamond: 4 } } ] }
    ]
  },
  // Weapons that respond to Exposed
  {
    slug: 'weapons/marble_sword',
    effects: [
      { trigger: 'onExposed', actions: [ { type: 'gain_stat', stat: 'attack', value: 3 } ] }
    ]
  },
  {
    slug: 'weapons/chainmail_sword',
    effects: [
      { trigger: 'onExposed', actions: [ { type: 'gain_stat_equal_to_base_stat', stat: 'armor' } ] }
    ]
  },
  {
    slug: 'weapons/brittlebark_club',
    effects: [
      { trigger: 'onExposed', conditions: [ { type: 'player_has_status', status: 'wounded', min: 1 } ], actions: [ { type: 'gain_stat', stat: 'attack', value: -2 } ] }
    ]
  },
  {
    slug: 'items/marshlight_lantern',
    effects: [
      { trigger: 'onExposed', actions: [ { type: 'deal_damage', target: 'self', value: 3 }, { type: 'gain_stat', stat: 'armor', value: 8 } ] }
    ]
  },
  {
    slug: 'items/melon_bomb_exposed',
    // Note: melon_bomb already has battleStart; this entry handles onExposed when Exposed and Wounded conditions apply
    effects: [
      { trigger: 'onExposed', conditions: [ { type: 'player_has_status', status: 'wounded', min: 1 } ], actions: [ { type: 'decrease_random_status', value: 1 }, { type: 'deal_damage', value: 1 } ] }
    ]
  },
  {
    slug: 'items/cherry_blade_exposed',
    effects: [
      { trigger: 'onExposed', actions: [ { type: 'deal_damage', value: 4 } ] }
    ]
  },
  {
    slug: 'items/underwater_watermelon',
    effects: [
      { trigger: 'onExposed', conditions: [ { type: 'player_has_status', status: 'wounded', min: 1 } ], actions: [ { type: 'decrease_random_status', value: 1 }, { type: 'add_status_to_enemy', status: 'riptide', value: 1 } ] }
    ]
  },
  {
    slug: 'items/melon_lemonade',
    effects: [
      { trigger: 'onExposed', conditions: [ { type: 'player_has_status', status: 'wounded', min: 1 } ], actions: [ { type: 'clear_status', status: 'acid' } ] }
    ]
  },
  {
    slug: 'items/horned_melon',
    effects: [
      { trigger: 'onExposed', conditions: [ { type: 'player_has_status', status: 'wounded', min: 1 } ], actions: [ { type: 'decrease_random_status', value: 1 }, { type: 'decrease_random_status', value: 1 }, { type: 'gain_stat', stat: 'thorns', value: 2 } ] }
    ]
  },
  {
    slug: 'items/mineral_water',
    effects: [
      { trigger: 'onExposed', conditions: [ { type: 'hp_equal_max' } ], actions: [ { type: 'decrease_random_status', value: 2 }, { type: 'gain_stat', stat: 'armor', value: 5 } ] }
    ]
  },
  {
    slug: 'items/shark_roast',
    effects: [
      { trigger: 'onExposed', actions: [ { type: 'add_status_to_enemy', status: 'riptide', value: 2 } ] }
    ]
  },
  {
    slug: 'items/marbled_stonefish',
    effects: [
      { trigger: 'onExposed', conditions: [ { type: 'hp_equal_max' } ], actions: [ { type: 'gain_stat', stat: 'armor', value: 5 }, { type: 'add_status_to_enemy', status: 'riptide', value: 1 } ] }
    ]
  },
  {
    slug: 'items/honey_caviar',
    effects: [
      { trigger: 'onExposed', actions: [ { type: 'add_status_to_enemy', status: 'riptide', value: 10 } ] }
    ]
  }
];

const woundedEffects = [
  // Wounded weapons
  {
    slug: 'weapons/bloodmoon_dagger',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'gain_stat', stat: 'attack', value: 5 }, { type: 'deal_damage', target: 'self', value: 2 } ] }
    ]
  },
  {
    slug: 'weapons/liferoot_staff',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'gain_status', status: 'regeneration', base: 3, gold: 6, diamond: 12 } ] }
    ]
  },
  {
    slug: 'items/vampiric_wine',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'restore_health', value: { base: 4, gold: 8, diamond: 16 } } ] }
    ]
  },
  {
    slug: 'items/blood_chain',
    effects: [
      { trigger: 'onEnemyWounded', conditions: [ { type: 'first_time_enemy_wounded' } ], actions: [ { type: 'trigger_all_wounded_items' } ] }
    ]
  },
  {
    slug: 'items/swiftstrike_gauntlet',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'add_strikes', value: 2 } ] }
    ]
  },
  {
    slug: 'items/chainmail_armor',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'gain_stat_equal_to_base_stat', stat: 'armor' } ] }
    ]
  },
  {
    slug: 'items/razor_breastplate',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'gain_thorns_equal_to_enemy_attack' } ] }
    ]
  },
  {
    slug: 'items/slime_potion',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'gain_armor_equal_to_lost_health' }, { type: 'add_status', status: 'acid', value: 5 } ] }
    ]
  },
  {
    slug: 'items/thunder_cloud',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'stun_enemy_for_turns', value: { base: 3, gold: 4, diamond: 5 } } ] }
    ]
  },
  {
    slug: 'items/petrifying_flask',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'gain_stat', stat: 'armor', value: { base: 10, gold: 20, diamond: 40 } }, { type: 'stun_self_for_turns', value: { base: 2, gold: 4, diamond: 8 } } ] }
    ]
  },
  {
    slug: 'items/royal_horn',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'gain_gold', value: { base: 2, gold: 3, diamond: 4 } } ] }
    ]
  },
  {
    slug: 'items/liferoot_lute',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'gain_status', status: 'regeneration', base: 3, gold: 6, diamond: 12 } ] }
    ]
  },
  {
    slug: 'items/stormcloud_drum',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'stun_enemy_for_turns', value: { base: 1, gold: 2, diamond: 3 } } ] }
    ]
  },
  {
    slug: 'items/blood_rune',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'retrigger_last_wounded_item' } ] }
    ]
  },
  {
    slug: 'items/echo_rune',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'retrigger_random_battle_start_item' } ] }
    ]
  },
  // Cauldron Wounded items
  {
    slug: 'items/cherry_cocktail',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'deal_damage', value: 3 }, { type: 'restore_health', value: 3 } ] },
      { trigger: 'onWounded', actions: [ { type: 'deal_damage', value: 3 }, { type: 'restore_health', value: 3 } ] }
    ]
  },
  {
    slug: 'items/deepsea_wine',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'add_status_to_enemy', status: 'riptide', value: 1 } ] },
      { trigger: 'onRiptideTrigger', actions: [ { type: 'restore_health', value: 3 } ] }
    ]
  },
  {
    slug: 'items/bloody_steak',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'restore_health', value: 10 }, { type: 'gain_stat', stat: 'armor', value: 5 } ] }
    ]
  },
  {
    slug: 'items/blood_sausage',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'restore_health', value: 1 }, { type: 'restore_health', value: 1 }, { type: 'restore_health', value: 1 }, { type: 'restore_health', value: 1 }, { type: 'restore_health', value: 1 } ] }
    ]
  },
  {
    slug: 'items/spiked_wine',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'restore_health', value: 5 }, { type: 'add_status', status: 'thorns', value: 5 } ] }
    ]
  },
  {
    slug: 'items/sweet_wine',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'restore_health', value: 30 } ] }
    ]
  },
  {
    slug: 'items/melon_wine',
    effects: [
      { trigger: 'battleStart', conditions: [ { type: 'player_has_status', status: 'exposed', min: 1 }, { type: 'player_has_status', status: 'wounded', min: 1 } ], actions: [ { type: 'decrease_random_status', value: 1 }, { type: 'restore_health', value: 3 } ] },
      { trigger: 'onWounded', conditions: [ { type: 'player_has_status', status: 'exposed', min: 1 } ], actions: [ { type: 'decrease_random_status', value: 1 }, { type: 'restore_health', value: 3 } ] }
    ]
  },
  {
    slug: 'items/blood_orange',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'add_status', status: 'acid', value: 3 } ] },
      { trigger: 'onWounded', actions: [ { type: 'convert_status', value: { from: 'acid', to: 'regeneration' } } ] }
    ]
  },
  {
    slug: 'items/kings_blade',
    effects: [
      { trigger: 'battleStart', actions: [ { type: 'trigger_exposed_and_wounded_at_battle_start' } ] }
    ]
  },
  {
    slug: 'items/broken_winebottle',
    effects: [
      { trigger: 'onWounded', actions: [ { type: 'strike_until_enemy_wounded' } ] }
    ]
  }
];

// Export helpers and definitions so they can be consumed by tests or integrated
module.exports = {
  CustomEffectActions,
  battleStartEffects,
  exposedEffects,
  woundedEffects
};
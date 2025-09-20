;(function(global){
  // Data loaded from the HTML page
  const ITEM_TAGS = {};

  // --- Data-Driven Effect Engine ---
  // This object contains all action handlers that can be called from item effects
  const EFFECT_ACTIONS = {

    // ===== COUNTDOWN & AMPLIFICATION ACTIONS =====
    amplify_tome_countdown: ({ self, other, log, countdown }) => {
      try {
        const items = self.items || [];
        const tomeCount = items.filter(s => {
          const tags = (s.tags || []).concat(ITEM_TAGS[s] || []);
          return tags.includes('Tome');
        }).length;

        if (tomeCount === 1 && countdown && typeof countdown.action === 'function') {
          // Already fired once from the normal system; fire two more times
          countdown.action(self, other, log, countdown);
          countdown.action(self, other, log, countdown);
          log(`${self.name}'s Arcane Lens amplifies the tome.`);
          return true;
        }
      } catch(e) { 
        console.error('Error in amplify_tome_countdown', e);
      }
      return false;
    },

    // ===== BASIC STAT MODIFICATION ACTIONS =====
    gain_stat: ({ self, stat, value, log }) => {
      if (!stat) {
        console.warn(`gain_stat called with undefined stat`);
        return;
      }
      switch (stat) {
        case 'armor': 
          self.addArmor(value); 
          if (log) log(`${self.name} gains ${value} ${stat}`);
          break;
        case 'attack': 
          self.addAtk(value); 
          if (log) log(`${self.name} gains ${value} ${stat}`);
          break;
        case 'temp_attack': 
          self.addTempAtk(value); 
          if (log) log(`${self.name} gains ${value} ${stat}`);
          break;
        case 'speed': 
          const oldSpeed = self.speed || 0;
          self.speed = oldSpeed + value;
          runEffects('onGainSpeed', self, null, log, { amount: value, delta: value });
          if (log) log(`${self.name} gains ${value} ${stat}`);
          break;
        case 'health': 
          self.heal(value); 
          if (log) log(`${self.name} gains ${value} health`);
          break;
        case 'gold': 
          self.addGold(value); 
          if (log) log(`${self.name} gains ${value} gold`);
          break;
        default: 
          console.warn(`Unknown stat: ${stat}`);
      }
    },
    lose_stat: ({ self, stat, value, log }) => {
      switch (stat) {
        case 'armor': self.armor = Math.max(0, self.armor - value); break;
        case 'attack': self.atk = Math.max(0, self.atk - value); break;
        case 'speed': self.speed = Math.max(0, self.speed - value); break;
        case 'health': self.hp = Math.max(0, self.hp - value); break;
        default: 
          console.warn(`Unknown stat: ${stat}`);
      }
      if (log) log(`${self.name} loses ${value} ${stat}`);
    },
    gain_status: ({ self, status, value, log }) => {
      self.addStatus(status, value);
      if (log) log(`${self.name} gains ${value} ${status}`);
    },

    // ===== DIRECT STAT HELPERS =====
    add_gold: ({ self, value }) => self.addGold(value),
    add_armor: ({ self, value }) => self.addArmor(value),
    add_attack: ({ self, value }) => self.addAtk(value),
    add_temp_attack: ({ self, value }) => self.addTempAtk(value),
    register_countdown: ({ self, log, value }) => {
      // Register countdown actions for data-driven effects
      const name = value?.name || 'Effect';
      const turns = value?.turns || 6;
      const tag = value?.tag || 'Effect';
      const tier = value?.tier || 1;
      const action = value?.action || 'add_attack';
      
      // Create a function that will be called when countdown completes
      const countdownAction = (owner, enemy, logger) => {
        if (action === 'add_attack') {
          const amount = tier === 3 ? 12 : tier === 2 ? 6 : 3;
          owner.addAtk(amount);
          if (logger) logger(`${owner.name} gains ${amount} attack (${name} complete)`);
        } else if (action === 'trigger_symphony') {
          const amount = value?.amount || 1;
          if (logger) logger(`${name} triggers Symphony ${amount} time(s)!`);
          for (let i = 0; i < amount; i++) {
            runEffects('symphony', owner, enemy, logger);
          }
        }
        // Add more countdown actions as needed
      };
      
      self.addCountdown(name, turns, tag, countdownAction);
      if (log) log(`${self.name} starts a countdown effect (${turns} turns)`);
    },

    // ===== STAT & STATUS INTERACTION ACTIONS =====
    add_temp_attack_from_status: ({ self, key }) => {
      const statusValue = self.statuses[key] || 0;
      if (statusValue > 0) self.addTempAtk(statusValue);
    },
    add_status_to_enemy_from_stat: ({ self, other, key, stat }) => {
      // Map stat names to fighter property names
      const statMap = {
        'attack': 'atk',
        'health': 'hp',
        'armor': 'armor',
        'speed': 'speed'
      };
      const fighterStat = statMap[stat] || stat;
      const statValue = self[fighterStat] || 0;
      if (statValue > 0) {
        other.addStatus(key, statValue);
      }
    },
    add_extra_strikes_to_enemy: ({ other, value }) => {
      other.extraStrikes = (other.extraStrikes || 0) + value;
    },
    convert_stat_to_status: ({ self, log, fromStat, toStatus, value, multiplier }) => {
      const mult = multiplier || 1;
      let fromValue, maxConvert;
      
      switch (fromStat) {
        case 'armor': fromValue = self.armor; break;
        case 'attack': fromValue = self.atk; break;
        case 'speed': fromValue = self.speed; break;
        case 'health': fromValue = self.hp; break;
        default: 
          console.warn(`Unknown stat: ${fromStat}`);
          return;
      }
      
      maxConvert = Math.min(fromValue, value || 1);
      if (maxConvert > 0) {
        // Reduce the stat
        switch (fromStat) {
          case 'armor': self.armor -= maxConvert; break;
          case 'attack': self.atk -= maxConvert; break;
          case 'speed': self.speed -= maxConvert; break;
          case 'health': self.hp -= maxConvert; break;
        }
        
        // Add the status
        const statusAmount = maxConvert * mult;
        self.addStatus(toStatus, statusAmount);
        if (log) log(`${self.name} converts ${maxConvert} ${fromStat} to ${statusAmount} ${toStatus}`);
      }
    },
    convert_status_to_stat: ({ self, log, fromStatus, toStat, value, multiplier }) => {
      const mult = multiplier || 1;
      const statusValue = self.statuses[fromStatus] || 0;
      const convertAmount = Math.min(statusValue, value || 1);
      
      if (convertAmount > 0) {
        self.statuses[fromStatus] -= convertAmount;
        const statAmount = convertAmount * mult;
        
        switch (toStat) {
          case 'armor': self.addArmor(statAmount); break;
          case 'attack': self.addAtk(statAmount); break;
          case 'speed': self.speed += statAmount; break;
          case 'health': self.heal(statAmount); break;
          default: 
            console.warn(`Unknown stat: ${toStat}`);
        }
        
        if (log) log(`${self.name} converts ${convertAmount} ${fromStatus} to ${statAmount} ${toStat}`);
      }
    },
    give_enemy_status_equal_to_stat: ({ self, other, log, status, stat }) => {
      let statValue;
      switch (stat) {
        case 'armor': statValue = self.armor; break;
        case 'attack': statValue = self.atk; break;
        case 'speed': statValue = self.speed; break;
        case 'health': statValue = self.hp; break;
        default: 
          console.warn(`Unknown stat: ${stat}`);
          return;
      }
      
      if (statValue > 0) {
        other.addStatus(status, statValue);
        if (log) log(`${other.name} gains ${statValue} ${status}`);
      }
    },
    convert_armor_to_thorns: ({ self, log, value }) => {
      const converted = Math.min(self.armor, value);
      if (converted > 0) {
        self.armor -= converted;
        self.addStatus('thorns', converted * 2); // Convert 1 armor to 2 thorns
        log(`${self.name} converts ${converted} armor to ${converted * 2} thorns`);
      }
    },
    convert_random_status_to_poison: ({ self, log, value }) => {
      const convertible = Object.keys(self.statuses || {}).filter(k => k !== 'poison' && (self.statuses[k] || 0) > 0);
      if (convertible.length > 0) {
        const keyToConvert = convertible[Math.floor(Math.random() * convertible.length)];
        const convertAmount = Math.min(value || 1, self.statuses[keyToConvert]);
        self.statuses[keyToConvert] = (self.statuses[keyToConvert] || 0) - convertAmount;
        self.addStatus('poison', convertAmount);
        log(`${self.name} converts ${convertAmount} ${keyToConvert} into ${convertAmount} poison`);
      }
    },
    decrease_all_statuses: ({ self, log, value }) => {
      const amount = value || 1;
      for (const k of Object.keys(self.statuses || {})) {
        if (self.statuses[k] && self.statuses[k] > 0) {
          const decrease = Math.min(amount, self.statuses[k]);
          self.statuses[k] -= decrease;
          if (decrease > 0) log(`${self.name} decreases ${k} by ${decrease}`);
        }
      }
    },
    decrease_random_status: ({ self, log, value }) => {
      const amount = value || 1;
      const keys = Object.keys(self.statuses || {}).filter(k => (self.statuses[k] || 0) > 0);
      if (keys.length > 0) {
        const key = keys[Math.floor(Math.random() * keys.length)];
        const decrease = Math.min(amount, self.statuses[key]);
        self.statuses[key] -= decrease;
        if (decrease > 0) log(`${self.name} decreases ${key} by ${decrease}`);
      }
    },
    add_extra_strikes: ({ self, log, value }) => {
      const strikes = value || 1;
      self.extraStrikes = (self.extraStrikes || 0) + strikes;
      log(`${self.name} gains ${strikes} extra strike${strikes > 1 ? 's' : ''} this turn`);
    },
    cleanse_status_effects: ({ self, log, value }) => {
      const amount = value || 1;
      const statusesToCleanse = Object.keys(self.statuses || {}).filter(k => (self.statuses[k] || 0) > 0);
      let cleansed = 0;
      for (const status of statusesToCleanse) {
        if (cleansed >= amount) break;
        const reduction = Math.min(self.statuses[status], amount - cleansed);
        self.statuses[status] -= reduction;
        cleansed += reduction;
        if (reduction > 0) log(`${self.name} cleanses ${reduction} ${status}`);
      }
    },
    double_status: ({ self, other, log, value }) => {
      const status = value.status || value;
      const target = value.target === 'enemy' ? other : self;
      const current = target.statuses[status] || 0;
      if (current > 0) {
        target.addStatus(status, current);
        log(`${target.name}'s ${status} is doubled`);
      }
    },
    apply_status_based_on_armor: ({ self, other, log, value }) => {
      const threshold = value.threshold || 0;
      const status = value.status;
      const amount = value.amount || 1;
      if (other.armor <= threshold) {
        other.addStatus(status, amount);
        log(`${other.name} gains ${amount} ${status} (armor <= ${threshold})`);
      }
    },
    gain_temp_stats: ({ self, log, value }) => {
      ['attack', 'health', 'armor', 'speed'].forEach(stat => {
        if (value[stat]) {
          const tempKey = `temp${stat.charAt(0).toUpperCase() + stat.slice(1)}`;
          self[tempKey] = (self[tempKey] || 0) + value[stat];
          log(`${self.name} gains ${value[stat]} temporary ${stat}`);
        }
      });
    },
    register_countdown: ({ self, log, value }) => {
      // Register a countdown for data-driven effects
      const name = value?.name || 'Effect';
      const turns = value?.turns || 6;
      const tag = value?.tag || 'Effect';
      const tier = value?.tier || 1;
      const action = value?.action || 'add_attack';
      
      // Create a function that will be called when countdown completes
      const countdownAction = (owner, enemy, logger) => {
        if (action === 'add_attack') {
          const amount = tier === 3 ? (value?.diamond || 12) : tier === 2 ? (value?.gold || 6) : (value?.base || 3);
          owner.addAtk(amount);
          if (logger) logger(`${owner.name} gains ${amount} attack (${name || 'Countdown'} complete)`);
        }
        // Add more countdown actions as needed
      };
      
      self.addCountdown(name, turns, tag, countdownAction);
      if (log) log(`${self.name} starts a countdown effect (${turns} turns)`);
    },
    set_one_time_flag: ({ self, value, key }) => {
      self.flags[key || value] = true;
    },
    add_status_on_enemy_gain_status: ({ self, other, log, value, key }) => {
      // This is a complex trigger that needs special handling in the onGainStatus event
      if (!self.flags[`${key}_triggered`]) {
        other.addStatus(value.status, value.amount);
        self.flags[`${key}_triggered`] = true;
        log(`${other.name} gains ${value.amount} additional ${value.status} (${self.name})`);
      }
    },
    reduce_damage_if_condition: ({ self, log, value }) => {
      // Sets a flag for damage reduction; checked during strike processing
      if (value.reduction) {
        self.flags.damageReduction = (self.flags.damageReduction || 0) + value.reduction;
        log(`${self.name} reduces incoming damage by ${value.reduction}`);
      }
    },
    heal_if_condition: ({ self, log, value }) => {
      const healed = self.heal(value);
      if (healed > 0) log(`${self.name} restores ${healed} health`);
    },
      heal_loop: ({ self, log, value, count }) => {
        const healAmount = value || 1;
        const healCount = count || 5;
        for (let i = 0; i < healCount; i++) {
          const healed = self.heal(healAmount);
          if (healed > 0) log(`${self.name} restores ${healed} health (tick ${i+1}/${healCount})`);
        }
      },
    set_enraged_flag: ({ self, log }) => {
      self.flags.winebottleEnraged = true;
      log(`${self.name} becomes enraged`);
    },
    enraged_extra_strikes: ({ self, log, value }) => {
      if (self.flags.winebottleEnraged) {
        const strikes = value || 10;
        self.addExtraStrikes(strikes);
        self.flags.winebottleEnraged = false; // Consumed
        log(`${self.name} enters a rage, gaining ${strikes} extra strikes`);
      }
    },
    // Speed modification with trigger event
    add_speed: ({ self, other, log, value }) => { 
      const oldSpeed = self.speed || 0;
      self.speed = oldSpeed + value; 
      // Trigger onGainSpeed event for items that react to speed changes
      runEffects('onGainSpeed', self, other, log, { amount: value, delta: value });
    },
    add_extra_strikes: ({ self, value }) => self.addExtraStrikes(value),
    deal_damage: ({ self, other, value, target }) => {
      const dmg = value || 1;
      if (target === 'self') {
        // Apply damage to self, respecting armor
        const toArmor = Math.min(self.armor, dmg);
        self.armor -= toArmor;
        const toHp = dmg - toArmor;
        if (toHp > 0) {
          self.hp = Math.max(0, self.hp - toHp);
        }
      } else {
        self.damageOther(dmg, other);
      }
    },
    heal: ({ self, value }) => self.heal(value),
    heal_from_speed: ({ self, other, log, value }) => {
      const healAmount = self.speed || 0;
      if (healAmount > 0) {
        self.hp = Math.min(self.maxHp || self.hp + healAmount, (self.hp || 0) + healAmount);
        log(`<img src="assets/health.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> ${self.name} restores ${healAmount} health from speed`);
      }
    },

    // Helper function to get value by tier
    getValueByTier: function(value, tier) {
      if (typeof value === 'object' && value !== null) {
        const tierNum = tier === 'diamond' ? 3 : tier === 'gold' ? 2 : 1;
        return tierNum === 3 ? value.diamond : tierNum === 2 ? value.gold : value.base;
      }
      return value;
    },

    // Tome countdown actions
    countdown_tome_granite: ({ self, other, log, value, tier }) => {
      const countdownAction = (fighter, opponent, logFn) => {
        const amount = EFFECT_ACTIONS.getValueByTier(value, tier);
        fighter.addArmor(amount);
        logFn(`<img src="assets/armor.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> ${fighter.name} gains ${amount} armor from Granite Tome`);
      };
      self.addCountdown('Granite Tome', value.turns || 4, 'tome', countdownAction);
    },

    countdown_tome_holy: ({ self, other, log, value, tier }) => {
      const countdownAction = (fighter, opponent, logFn) => {
        const amount = EFFECT_ACTIONS.getValueByTier(value, tier);
        fighter.addAtk(amount);
        logFn(`<img src="assets/attack.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> ${fighter.name} gains ${amount} attack from Holy Tome`);
      };
      self.addCountdown('Holy Tome', value.turns || 6, 'tome', countdownAction);
    },

    countdown_tome_liferoot: ({ self, other, log, value, tier }) => {
      const countdownAction = (fighter, opponent, logFn) => {
        const amount = EFFECT_ACTIONS.getValueByTier(value, tier);
        fighter.addStatus('regen', amount);
        logFn(`<img src="assets/health.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> ${fighter.name} gains ${amount} regen from Liferoot Tome`);
      };
      self.addCountdown('Liferoot Tome', value.turns || 4, 'tome', countdownAction);
    },

    countdown_tome_silverscale: ({ self, other, log, value, tier }) => {
      const countdownAction = (fighter, opponent, logFn) => {
        const amount = EFFECT_ACTIONS.getValueByTier(value, tier);
        opponent.addStatus('riptide', amount);
        logFn(`<img src="assets/speed.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> ${opponent.name} gains ${amount} riptide from Silverscale Tome`);
      };
      self.addCountdown('Silverscale Tome', value.turns || 3, 'tome', countdownAction);
    },

    countdown_tome_stormcloud: ({ self, other, log, value, tier }) => {
      const countdownAction = (fighter, opponent, logFn) => {
        const turns = EFFECT_ACTIONS.getValueByTier(value, tier);
        opponent.addStatus('stun', turns);
        logFn(`<img src="assets/speed.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> ${opponent.name} is stunned for ${turns} turns by Stormcloud Tome`);
      };
      self.addCountdown('Stormcloud Tome', value.turns || 4, 'tome', countdownAction);
    },

    countdown_tome_caustic: ({ self, other, log, value }) => {
      const countdownAction = (fighter, opponent, logFn) => {
        const acidAmount = fighter.speed || 0;
        if (acidAmount > 0) {
          opponent.addStatus('acid', acidAmount);
          logFn(`<img src="assets/speed.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> ${opponent.name} gains ${acidAmount} acid from Caustic Tome (equal to ${fighter.name}'s speed)`);
        }
      };
      self.addCountdown('Caustic Tome', value.turns || 3, 'tome', countdownAction);
    },

    countdown_sheet_music: ({ self, other, log, value }) => {
      const countdownAction = (fighter, opponent, logFn) => {
        logFn(`${fighter.name} plays the Sheet Music!`);
        // Trigger Symphony multiple times
        const symphonyTriggers = value?.symphony_triggers || 3;
        for (let i = 0; i < symphonyTriggers; i++) {
          runEffects('symphony', fighter, opponent, logFn);
        }
        // Re-schedule for the next countdown
        fighter.addCountdown('Sheet Music', value?.turns || 6, 'Instrument', countdownAction);
      };
      self.addCountdown('Sheet Music', value?.turns || 6, 'Instrument', countdownAction);
      log(`${self.name} prepares the Sheet Music countdown.`);
    },

    set_flag: ({ self, key, value }) => {
      self.flags[key] = value;
    },
    steal_attack: ({ self, other, log, value }) => {
      const steal = Math.min(value || 1, other.atk || 0);
      if (steal > 0) {
        other.atk -= steal;
        self.addAtk(steal);
        if (log) log(`${self.name} steals ${steal} attack from ${other.name}`);
      }
    },
    deal_self_damage: ({ self, log, value }) => {
      if (self.hp > 0) {
        const damage = Math.min(value || 1, self.hp);
        self.hp -= damage;
        if (log) log(`${self.name} takes ${damage} damage`);
      }
    },
    decrease_random_statuses_and_gain_thorns: ({ self, log, value }) => {
      const amount = value || 2;
      const keys = Object.keys(self.statuses || {}).filter(k => (self.statuses[k] || 0) > 0);
      let totalDecreased = 0;
      
      for (let i = 0; i < amount && keys.length > 0; i++) {
        const idx = Math.floor(Math.random() * keys.length);
        const key = keys[idx];
        const decrease = Math.min(1, self.statuses[key]);
        self.statuses[key] -= decrease;
        totalDecreased += decrease;
        if (decrease > 0 && log) log(`${self.name} decreases ${key} by ${decrease}`);
        keys.splice(idx, 1);
      }
      
      if (totalDecreased > 0) {
        self.addStatus('thorns', totalDecreased);
        if (log) log(`${self.name} gains ${totalDecreased} thorns`);
      }
    },
    deal_damage_and_heal: ({ self, other, log, value }) => {
      const damage = value || 3;
      const healAmount = value || 3;
      self.damageOther(damage, other);
      const healed = self.heal(healAmount);
      if (log) log(`${self.name} deals ${damage} damage and restores ${healed} health`);
    },
    decrease_all_countdowns: ({ self, log, value }) => {
      const amount = value || 1;
      if (typeof self.decAllCountdowns === 'function') {
        self.decAllCountdowns(amount);
        if (log) log(`${self.name} decreases all countdowns by ${amount}`);
      }
    },
    halve_all_countdowns: ({ self, log }) => {
      if (typeof self.halveCountdowns === 'function') {
        self.halveCountdowns();
        if (log) log(`${self.name} halves all countdowns`);
      }
    },
    // Convert acid status to attack stat
    convert_acid_to_attack: ({ self, log, value }) => {
      if ((self.statuses.acid || 0) > 0) {
        self.statuses.acid -= 1;
        const attackGain = value || 2;
        self.addAtk(attackGain);
        if (log) log(`${self.name} converts 1 acid into ${attackGain} attack`);
      }
    },
    // Apply acid status based on speed stat
    give_enemy_acid_equal_to_speed: ({ self, other, log }) => {
      if (self.speed > 0) {
        other.addStatus('acid', self.speed);
        if (log) log(`${other.name} gains ${self.speed} acid`);
      }
    },
    invert_speed: ({ self, log }) => {
      self.speed = (self.speed || 0) * -1;
      if (log) log(`${self.name} inverts its speed.`);
    },
    remove_all_status_and_gain_armor: ({ self, log }) => {
      let removedCount = 0;
      if (self.statuses) {
        for (const key in self.statuses) {
          if (self.statuses[key] > 0) {
            removedCount += self.statuses[key];
            self.statuses[key] = 0;
          }
        }
      }
      if (removedCount > 0) {
        self.armor += removedCount;
        if (log) log(`${self.name} removes all status effects and gains ${removedCount} armor.`);
      }
    },
    transfer_random_status_to_enemy: ({ self, other, value, log, tier }) => {
      if (!self.statuses) return;
      const keys = Object.keys(self.statuses).filter(k => (self.statuses[k] || 0) > 0);
      if (keys.length > 0) {
        const key = keys[Math.floor(Math.random() * keys.length)];
        const amount = typeof value === 'object' ? getValueByTier(value, tier) : value;
        const transfer = Math.min(self.statuses[key], amount);
        self.statuses[key] -= transfer;
        other.addStatus(key, transfer);
        if (log) log(`${self.name} transfers ${transfer} ${key} to ${other.name}.`);
      }
    },
    spend_speed_decrease_random_status: ({ self, log }) => {
      if (!self.statuses || self.speed <= 0) return;
      const keys = Object.keys(self.statuses).filter(k => (self.statuses[k] || 0) > 0);
      if (keys.length > 0) {
        self.speed -= 1;
        const key = keys[Math.floor(Math.random() * keys.length)];
        self.statuses[key] = Math.max(0, (self.statuses[key] || 0) - 1);
        if (log) log(`${self.name} spends 1 speed to decrease ${key} by 1.`);
      }
    },
    regain_base_armor: ({ self, log }) => {
      if (self.baseArmor > 0) {
        self.armor += self.baseArmor;
        if (log) log(`${self.name} regains ${self.baseArmor} base armor.`);
      }
    },
    convert_enemy_health_to_armor: ({ self, other, value, log }) => {
      const converted = Math.floor(other.hp * value);
      if (converted > 0) {
        other.hp -= converted;
        self.armor += converted;
        if (log) log(`${self.name} converts ${converted} enemy health into armor.`);
      }
    },
    lose_hp: ({ self, value, log }) => {
      self.hp = Math.max(0, self.hp - value);
      if (log) log(`${self.name} loses ${value} health.`);
    },
    give_status_deal_damage_per_stack: ({ self, other, log, value }) => {
      const status = value.status;
      const amount = value.amount || 1;
      const damagePerStack = value.damagePerStack || 1;
      
      other.addStatus(status, amount);
      const totalStacks = other.statuses[status] || 0;
      const damage = totalStacks * damagePerStack;
      
      if (damage > 0) {
        self.damageOther(damage, other);
        log(`${other.name} gains ${amount} ${status} and takes ${damage} damage (${damagePerStack} per stack).`);
      } else {
        log(`${other.name} gains ${amount} ${status}.`);
      }
    },
    add_status: ({ self, key, value }) => self.addStatus(key, value),
      add_status_tiered: ({ self, log, key, baseTier, goldTier, diamondTier, tier }) => {
        const amount = tier === 3 ? diamondTier : tier === 2 ? goldTier : baseTier;
        self.addStatus(key, amount);
        log(`✨ ${self.name} gains ${amount} ${key}`);
      },
    add_status_to_enemy: ({ other, key, value }) => other.addStatus(key, value),
      add_status_to_enemy_tiered: ({ other, log, key, baseTier, goldTier, diamondTier, tier }) => {
        // Convert tier string to number: 'base'=1, 'gold'=2, 'diamond'=3
        const tierNum = tier === 'diamond' ? 3 : tier === 'gold' ? 2 : 1;
        const amount = tierNum === 3 ? diamondTier : tierNum === 2 ? goldTier : baseTier;
        other.addStatus(key, amount);
        log(`💀 ${other.name} gains ${amount} ${key}`);
      },
    remove_status: ({ self, key, value }) => {
      const currentAmount = self.statuses[key] || 0;
      if (currentAmount > 0) {
        const toRemove = Math.min(value || 1, currentAmount);
        self.addStatus(key, -toRemove);
        return toRemove;
      }
      return 0;
    },
    remove_all_status: ({ self, key, log }) => {
      const currentAmount = self.statuses[key] || 0;
      if (currentAmount > 0) {
        self.addStatus(key, -currentAmount);
        if (log) log(`${self.name} removes all ${key} (${currentAmount})`);
        return currentAmount;
      }
      return 0;
    },
    remove_random_status: ({ self, value }) => {
      const statusKeys = Object.keys(self.statuses).filter(k => self.statuses[k] > 0);
      if (statusKeys.length > 0) {
        const randomKey = statusKeys[Math.floor(Math.random() * statusKeys.length)];
        const currentAmount = self.statuses[randomKey];
        const toRemove = Math.min(value || 1, currentAmount);
        self.addStatus(randomKey, -toRemove);
        return { key: randomKey, amount: toRemove };
      }
      return null;
    },
    damage_enemy: ({ other, value, log }) => {
      if (other && typeof other.takeDamage === 'function') {
        other.takeDamage(value || 1);
        if (log) log(`Direct damage: ${other.name} takes ${value || 1} damage`);
      }
    },
    double_attack: ({ self, log }) => {
      self.atk = Math.max(0, self.atk * 2);
      if (log) log(`${self.name}'s attack is doubled`);
    },
    multiply_attack: ({ self, log, value }) => {
      const multiplier = value || 2;
      self.atk = Math.max(0, self.atk * multiplier);
      if (log) log(`${self.name}'s attack is multiplied by ${multiplier}`);
    },
    add_max_health: ({ self, value, log }) => {
      const amount = value || 1;
      self.hpMax += amount;
      self.hp += amount; // Also restore the health gained
      if (log) log(`${self.name} gains ${amount} max health`);
    },
    convert_health_to_armor: ({ self, percentage, log }) => {
      const healthToConvert = Math.floor(self.hp * percentage);
      if (healthToConvert > 0) {
        self.hp -= healthToConvert;
        self.armor += healthToConvert;
        if (log) log(`${self.name} converts ${healthToConvert} health to armor`);
      }
    },
    deal_damage_to_enemy: ({ self, other, value, log }) => {
      const damage = value || 1;
      other.hp -= damage;
      if (log) log(`${other.name} takes ${damage} damage`);
    },
    restore_health: ({ self, value, log }) => {
      const amount = value || 1;
      const actualRestore = Math.min(amount, self.hpMax - self.hp);
      self.hp += actualRestore;
      if (log) log(`${self.name} restores ${actualRestore} health`);
    },
    set_armor: ({ self, value, log }) => {
      self.armor = value || 0;
      if (log) log(`${self.name}'s armor is set to ${self.armor}`);
    },
    conditional_damage_to_enemy: ({ self, other, baseDamage, doubleIfNoArmor, log }) => {
      let damage = baseDamage || 1;
      if (doubleIfNoArmor && other.armor === 0) {
        damage *= 2;
      }
      other.hp -= damage;
      if (log) log(`${other.name} takes ${damage} damage${doubleIfNoArmor && other.armor === 0 ? ' (doubled for no armor)' : ''}`);
    },
    add_strikes: ({ self, value, log }) => {
      const strikes = value || 1;
      self.additionalStrikes = (self.additionalStrikes || 0) + strikes;
      if (log) log(`${self.name} gains ${strikes} additional strikes`);
    },
    add_strikes_equal_to_speed: ({ self, log }) => {
      const strikes = self.speed;
      self.additionalStrikes = (self.additionalStrikes || 0) + strikes;
      if (log) log(`${self.name} gains ${strikes} additional strikes (equal to speed)`);
    },
    transfer_all_statuses_to_enemy: ({ self, other, log }) => {
      const statuses = Object.keys(self.statuses || {});
      let transferred = 0;
      statuses.forEach(status => {
        if (self.statuses[status] > 0) {
          other.statuses[status] = (other.statuses[status] || 0) + self.statuses[status];
          self.statuses[status] = 0;
          transferred++;
        }
      });
      if (log) log(`${self.name} transfers all status effects to ${other.name}`);
    },
    increase_next_bomb_damage: ({ self, value, log }) => {
      const increase = value || 1;
      self.nextBombDamageBonus = (self.nextBombDamageBonus || 0) + increase;
      if (log) log(`Next bomb damage increased by ${increase}`);
    },
    riptide_per_negative_attack: ({ self, other, multiplier, log }) => {
      const negativeAttack = Math.max(0, -self.atk); // Only count negative attack
      const riptideAmount = negativeAttack * (multiplier || 1);
      if (riptideAmount > 0) {
        other.statuses.riptide = (other.statuses.riptide || 0) + riptideAmount;
        if (log) log(`${other.name} gains ${riptideAmount} riptide (${negativeAttack} negative attack × ${multiplier})`);
      }
    },
    remove_gold: ({ self, value }) => {
      const currentGold = self.gold || 0;
      if (currentGold > 0) {
        const toRemove = Math.min(value || 1, currentGold);
        self.addGold(-toRemove);
        return toRemove;
      }
      return 0;
    },
    trigger_symphony: ({ self, other, log, value }) => {
      // Trigger Symphony actions from all equipped instruments
      const repeatCount = value || 1;
      log(`Symphony triggered ${repeatCount} time(s)!`);
      
      for (let i = 0; i < repeatCount; i++) {
        runEffects('symphony', self, other, log);
      }
    },
      reduce_enemy_attack: ({ self, other, log, value }) => {
        const reduction = value || 1;
        const before = other.atk || 0;
        if (before > 0) {
          other.atk = Math.max(0, before - reduction);
          log(`${other.name} loses ${reduction} attack`);
        }
      },
    
    // COMPLEX/CUSTOM ACTIONS
    // These can be added for effects that are too complex for simple key-value pairs.
    // Example: 'action': 'custom_brittlebark_buckler'
      leather_belt_boost: ({ self, log, tier }) => {
        const base = self.baseArmor || 0;
        if (base === 0) {
          const old = self.hpMax || 0;
          const factor = tier === 3 ? 8 : tier === 2 ? 4 : 2; // Diamond: x8, Gold: x4, Base: x2
          const newMax = Math.max(old, old * factor);
          const extra = newMax - old;
          self.hpMax = newMax;
          // Do not auto-heal; keep current hp where it is
          if (extra > 0) log(`${self.name}'s max health increases by ${extra} (Leather Belt${tier ? ` tier ${tier}` : ''})`);
        }
      },
        spend_speed_gain_temp_attack: ({ self, log, value }) => {
          const maxSpend = value?.maxSpend || 2;
          const attackGain = value?.attackGain || 4;
          const spent = Math.min(maxSpend, self.speed || 0);
          if (spent > 0) {
            self.speed = (self.speed || 0) - spent;
            log(`${self.name} spends ${spent} speed`);
            self.addTempAtk(attackGain);
          }
        },
          muscle_potion_strike_counter: ({ self, log, baseTier, goldTier, diamondTier, tier }) => {
            self._mpStrikes = (self._mpStrikes || 0) + 1;
            if (self._mpStrikes % 3 === 0) {
              const inc = tier === 3 ? diamondTier : tier === 2 ? goldTier : baseTier;
              self.addAtk(inc);
              log(`${self.name} gains ${inc} attack (every 3rd strike)`);
            }
          },
            plated_shield_double: ({ self, log, amount }) => {
              if (!self._platedUsed && amount > 0) {
                self.armor = (self.armor || 0) + amount;
                self._platedUsed = true;
                log(`${self.name} doubles armor gain (+${amount})`);
              }
            },
              armor_equal_to_health: ({ self, log }) => {
                if ((self.baseArmor || 0) === 0) {
                  const gain = self.hp || 0;
                  if (gain > 0) {
                    self.addArmor(gain);
                    log(`${self.name} gains ${gain} armor (equal to current health)`);
                  }
                }
              },
                convert_acid_to_attack: ({ self, log, value }) => {
                  const attackGain = value || 2;
                  if ((self.statuses?.acid || 0) > 0) {
                    self.statuses.acid = (self.statuses.acid || 0) - 1;
                    self.addTempAtk(attackGain);
                    log(`${self.name} converts 1 acid into ${attackGain} attack`);
                  }
                },
                  damage_and_thorns_loop: ({ self, other, log, count, damage, thorns }) => {
                    const loops = count || 2;
                    const dmg = damage || 1;
                    const thornGain = thorns || 1;
                    for (let i = 0; i < loops; i++) {
                      other.hp = Math.max(0, (other.hp || 0) - dmg);
                      self.addStatus('thorns', thornGain);
                      log(`${self.name} deals ${dmg} damage and gains ${thornGain} thorns`);
                    }
                  },
    // EXTENDED ACTION HANDLERS
    multiply_enemy_attack: ({ other, log, value }) => {
      const factor = value || 2;
      other.atk = (other.atk || 0) * factor;
      log(`${other.name}'s attack multiplied by ${factor}`);
    },
    add_armor_to_enemy: ({ other, value, log }) => {
      other.addArmor(value);
      log(`${other.name} gains ${value} armor`);
    },
    stun_enemy_for_turns: ({ other, log, value }) => {
      other.addStatus('stun', value || 1);
      log(`${other.name} is stunned for ${value || 1} turn${value > 1 ? 's' : ''}`);
    },
    stun_self_for_turns: ({ self, log, value }) => {
      self.addStatus('stun', value || 1);
      log(`${self.name} is stunned for ${value || 1} turn${value > 1 ? 's' : ''}`);
    },
    deal_damage_multiple_times: ({ self, other, log, value }) => {
      const damage = value?.damage || 1;
      const times = value?.times || 3;
      for (let i = 0; i < times; i++) {
        other.hp = Math.max(0, (other.hp || 0) - damage);
        log(`${self.name} deals ${damage} damage (${i+1}/${times})`);
      }
    },
    set_double_attack_on_full_health: ({ self, log }) => {
      // Sets a flag for conditional double attack
      self.flags.doubleAttackOnFullHealth = true;
      log(`${self.name} gains double attack when at full health`);
    },
    heal_to_full_if_no_base_armor: ({ self, log }) => {
      if ((self.baseArmor || 0) === 0) {
        const healed = self.heal(self.hpMax - self.hp);
        if (healed > 0) log(`${self.name} restores health to full (${healed} healed)`);
      }
    },
    spend_speed_to_deal_damage: ({ self, other, log, value }) => {
      const speedCost = value?.speedCost || 1;
      const damage = value?.damage || 2;
      if (self.speed >= speedCost) {
        self.speed -= speedCost;
        other.hp = Math.max(0, (other.hp || 0) - damage);
        log(`${self.name} spends ${speedCost} speed to deal ${damage} damage`);
      }
    },
    petrified_edge_stun_self: ({ self, log }) => {
      self.addStatus('stun', 1);
      log(`🗿 ${self.name}'s petrified edge stuns self for 1 turn`);
    },
    plated_edge_speed_to_armor: ({ self, log }) => {
      if (self.getStatus('speed') >= 1) {
        self.removeStatus('speed', 1);
        self.armor += 3;
        log(`<img src="assets/speed.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;">➡️<img src="assets/armor.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> ${self.name}'s plated edge converts 1 speed to 3 armor`);
      }
    },
    jagged_edge_thorns_damage: ({ self, log }) => {
      self.addStatus('thorns', 2);
      self.hp = Math.max(1, self.hp - 1);
      log(`🗡️ ${self.name}'s jagged edge gains 2 thorns and takes 1 damage`);
    },
    gilded_edge_gold: ({ self, log }) => {
      if ((self.gold || 0) < 10) {
        self.gold = (self.gold || 0) + 1;
        log(`💰 ${self.name}'s gilded edge gains 1 gold`);
      }
    },
    featherweight_edge_convert: ({ self, log }) => {
      if (self.speed >= 1) {
        self.speed -= 1;
        self.tempAtk += 1;
        log(`🪶 ${self.name}'s featherweight edge converts 1 speed to 1 attack`);
      }
    },
    whirlpool_edge_strikes: ({ self, other, log, value }) => {
      // Track strikes for whirlpool edge (every 3 strikes = riptide)
      self.whirlpoolStrikes = (self.whirlpoolStrikes || 0) + 1;
      if (self.whirlpoolStrikes >= 3) {
        self.whirlpoolStrikes = 0;
        other.addStatus('riptide', 1);
        log(`🌊 ${self.name}'s whirlpool edge gives ${other.name} 1 riptide (3 strikes)`);
      }
    },
    gain_strikes: ({ self, log, value }) => {
      self.flags.additionalStrikes = (self.flags.additionalStrikes || 0) + (value || 1);
      log(`${self.name} gains ${value || 1} additional strike${value > 1 ? 's' : ''}`);
    },
    spend_armor_for_speed_and_attack: ({ self, log, value }) => {
      const armorCost = value?.armorCost || 2;
      const speedGain = value?.speedGain || 3;
      const attackGain = value?.attackGain || 1;
      if (self.armor >= armorCost) {
        self.armor -= armorCost;
        self.speed += speedGain;
        self.atk += attackGain;
        log(`${self.name} spends ${armorCost} armor to gain ${speedGain} speed and ${attackGain} attack`);
      }
    },
    give_self_and_enemy_status: ({ self, other, log, value }) => {
      const status = value?.status || 'freeze';
      const amount = value?.amount || 1;
      self.addStatus(status, amount);
      other.addStatus(status, amount);
      log(`${self.name} gives ${amount} ${status} to self and enemy`);
    },
    disable_striking: ({ self, log }) => {
      self.flags.cannotStrike = true;
      log(`${self.name} cannot strike`);
    },
    gain_thorns_equal_to_attack: ({ self, log }) => {
      const thornsGain = self.atk || 0;
      if (thornsGain > 0) {
        self.addStatus('thorns', thornsGain);
        log(`${self.name} gains ${thornsGain} thorns`);
      }
    },
    gain_thorns_per_armor_lost: ({ self, log, value, armorLost }) => {
      const multiplier = value || 1;
      const thornsGain = (armorLost || 0) * multiplier;
      if (thornsGain > 0) {
        self.addStatus('thorns', thornsGain);
        log(`${self.name} gains ${thornsGain} thorns (${multiplier} per armor lost)`);
      }
    },
    // Simple status and stat modification actions
    gain_thorns: ({ self, log, value }) => {
      const amount = value || 1;
      self.addStatus('thorns', amount);
      log(`🌹 ${self.name} gains ${amount} thorns`);
    },
    gain_armor: ({ self, log, value }) => {
      const amount = value || 1;
      self.addArmor(amount);
      log(`<img src="assets/armor.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> ${self.name} gains ${amount} armor`);
    },
    lose_speed: ({ self, log, value }) => {
      const amount = value || 1;
      self.speed = Math.max(0, self.speed - amount);
      log(`${self.name} loses ${amount} speed`);
    },
    heal_self: ({ self, log, value }) => {
      const amount = value || 1;
      const healed = self.heal(amount);
      if (healed > 0) log(`💚 ${self.name} restores ${healed} health`);
    },
    heal_to_full: ({ self, log }) => {
      const healed = self.heal(self.hpMax - self.hp);
      if (healed > 0) log(`${self.name} restores to full health`);
    },
    set_health_to: ({ self, log, value }) => {
      const targetHealth = value || 1;
      if (self.hp > targetHealth) {
        const lost = self.hp - targetHealth;
        self.hp = targetHealth;
        log(`${self.name} loses ${lost} health`);
      } else if (self.hp < targetHealth) {
        const gained = self.heal(targetHealth - self.hp);
        if (gained > 0) log(`${self.name} gains ${gained} health`);
      }
    },
    add_max_hp: ({ self, log, value }) => {
      const amount = value || 1;
      self.hp += amount;
      self.hpMax += amount;
      log(`${self.name} gains ${amount} max health`);
    },
    
    add_max_hp_from_base_armor: ({ self, other, log, value }) => {
      const baseArmor = 0; // Base armor is 0 according to the game rules
      const amount = baseArmor;
      if (amount > 0) {
        self.hp += amount;
        self.hpMax += amount;
        log(`${self.name} gains ${amount} max health from base armor`);
      } else {
        log(`${self.name} would gain max health from base armor (but base armor is ${baseArmor})`);
      }
    },
    remove_enemy_armor: ({ self, other, log }) => {
      const removed = other.armor;
      if (removed > 0) {
        other.armor = 0;
        log(`${self.name} removes all ${removed} of ${other.name}'s armor`);
      }
    },
    give_enemy_armor: ({ self, other, log, value }) => {
      const amount = value || 1;
      other.armor += amount;
      log(`${self.name} gives ${other.name} ${amount} armor`);
    },
    gain_attack_equal_to_speed: ({ self, log }) => {
      const speedGain = self.speed || 0;
      if (speedGain > 0) {
        self.atk += speedGain;
        log(`${self.name} gains ${speedGain} attack equal to speed`);
      }
    },
    transfer_status_to_enemy: ({ self, other, log, value }) => {
      const status = value?.status || 'poison';
      const amount = value?.amount || 1;
      const currentAmount = self.statuses[status] || 0;
      const actualTransfer = Math.min(amount, currentAmount);
      if (actualTransfer > 0) {
        self.statuses[status] -= actualTransfer;
        other.addStatus(status, actualTransfer);
        log(`${self.name} transfers ${actualTransfer} ${status} to ${other.name}`);
      }
    },
    set_max_health_to_enemy: ({ self, other, log }) => {
      if (self.hpMax < other.hpMax) {
        self.hpMax = other.hpMax;
        log(`${self.name} sets max health to ${other.hpMax}`);
      }
    },
    gain_armor_equal_to_lost_health: ({ self, log }) => {
      const lostHealth = self.hpMax - self.hp;
      if (lostHealth > 0) {
        self.addArmor(lostHealth);
        log(`${self.name} gains ${lostHealth} armor (equal to lost health)`);
      }
    },
    gain_armor_per_tagged_item: ({ self, log, value }) => {
      const tag = value?.tag || 'Stone';
      const armorPerItem = value?.armor_per_item || 3;
      // This will need to be implemented by the simulation engine
      // as it needs access to the item tagging system
      const stoneItems = self.countItemsByTag(tag);
      const armorGain = stoneItems * armorPerItem;
      if (armorGain > 0) {
        self.addArmor(armorGain);
        log(`${self.name} gains ${armorGain} armor (${armorPerItem} per ${tag} item)`);
      }
    },
    take_damage: ({ self, log, value }) => {
      const amount = value || 1;
      const damaged = self.damage(amount);
      if (damaged > 0) log(`${self.name} takes ${damaged} damage`);
    },
    steal_armor: ({ self, other, log, value }) => {
      const amount = value || 1;
      const stolen = Math.min(amount, other.armor);
      if (stolen > 0) {
        other.armor = Math.max(0, other.armor - stolen);
        self.addArmor(stolen);
        log(`${self.name} steals ${stolen} armor from ${other.name}`);
      }
    },
    // Apply poison status to self
    gain_poison: ({ self, log, value }) => {
      const amount = value || 1;
      self.addStatus('poison', amount);
      log(`${self.name} gains ${amount} poison`);
    },
    add_armor_from_enemy_armor: ({ self, other, log, value }) => {
      const multiplier = value || 1;
      const enemyArmor = other.armor || 0;
      const armorGain = enemyArmor * multiplier;
      if (armorGain > 0) {
        self.addArmor(armorGain);
        log(`${self.name} gains ${armorGain} armor (from enemy's ${enemyArmor} armor)`);
      }
    },
    deal_damage_per_tome: ({ self, other, log, value, bonus }) => {
      const baseDamage = value || 2;
      const bonusPerTome = bonus || 1;
      
      // Count tome items
      const items = self.items || [];
      const DETAILS_SOURCE = global.HEIC_DETAILS || (typeof window !== 'undefined' ? window.HEIC_DETAILS : undefined);
      const tomeCount = items.filter(item => {
        const itemData = DETAILS_SOURCE?.[item] || {};
        const tags = itemData.tags || [];
        return tags.includes('Tome');
      }).length;
      
      const totalDamage = baseDamage + (tomeCount * bonusPerTome);
      other.hp = Math.max(0, (other.hp || 0) - totalDamage);
      log(`🔥 ${self.name} deals ${totalDamage} damage (${baseDamage} base + ${tomeCount} tomes × ${bonusPerTome})`);
    },
    spend_speed: ({ self, log, value }) => {
      const amount = value || 1;
      if (self.speed >= amount) {
        self.speed -= amount;
        log(`⚡ ${self.name} spends ${amount} speed`);
        return true;
      }
      log(`⚡ ${self.name} doesn't have enough speed to spend ${amount}`);
      return false;
    },
    give_enemy_status: ({ self, other, log, status, value }) => {
      const amount = value || 1;
      const statusType = status || 'poison';
      other.addStatus(statusType, amount);
      log(`🧪 ${self.name} gives ${other.name} ${amount} ${statusType}`);
    },
    // BOMB-SPECIFIC ACTIONS
    retrigger_random_bomb: ({ self, other, log }) => {
      // Find all bomb items in inventory
      const DETAILS_SOURCE = global.HEIC_DETAILS || (typeof window !== 'undefined' ? window.HEIC_DETAILS : undefined);
      const bombItems = self.items.filter(item => {
        const itemData = DETAILS_SOURCE?.[item] || {};
        const tags = (itemData.tags || []).concat(ITEM_TAGS[item] || []);
        return tags.includes('Bomb') || (itemData.name && itemData.name.toLowerCase().includes('bomb'));
      });
      
      if (bombItems.length > 0) {
        const randomBomb = bombItems[Math.floor(Math.random() * bombItems.length)];
        log(`${self.name} retriggers ${randomBomb}!`);
        // Trigger item effects
        runEffects('battleStart', self, other, log, { sourceItem: randomBomb });
      } else {
        log(`${self.name} tries to retrigger a bomb, but has no bombs!`);
      }
    },
    trigger_bomb_multiple_times: ({ self, other, log, value }) => {
      const times = value?.times || 2;
      log(`${self.name} triggers bomb effects ${times} times!`);
      for (let i = 0; i < times; i++) {
        // Trigger all bomb actions multiple times
        runEffects('bombTrigger', self, other, log, { iteration: i + 1 });
      }
    },
    increase_bomb_damage: ({ self, log, value }) => {
      const amount = value || 1;
      // Set a flag that other bomb damage calculations can check
      self.flags.bombDamageBonus = (self.flags.bombDamageBonus || 0) + amount;
      log(`${self.name}'s bomb damage increased by ${amount} permanently`);
    },
    increase_next_bomb_damage: ({ self, log, value }) => {
      const amount = value || 1;
      // Set a flag for the next bomb only
      self.flags.nextBombDamageBonus = (self.flags.nextBombDamageBonus || 0) + amount;
      log(`${self.name}'s next bomb damage increased by ${amount}`);
    },
    spend_speed: ({ self, log, value }) => {
      const speedCost = value || 1;
      if (self.speed >= speedCost) {
        self.speed -= speedCost;
        log(`${self.name} spends ${speedCost} speed`);
        return true;
      } else {
        log(`${self.name} doesn't have enough speed to spend ${speedCost}`);
        return false;
      }
    },
    decrease_random_status: ({ self, other, log, value }) => {
      const amount = value || 1;
      const target = other || self;
      const statuses = Object.keys(target.statuses).filter(key => target.statuses[key] > 0);
      
      if (statuses.length > 0) {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const removed = Math.min(target.statuses[randomStatus], amount);
        target.statuses[randomStatus] -= removed;
        if (target.statuses[randomStatus] <= 0) {
          delete target.statuses[randomStatus];
        }
        log(`${target.name} loses ${removed} ${randomStatus}`);
        return { status: randomStatus, amount: removed };
      } else {
        log(`${target.name} has no status to decrease`);
        return null;
      }
    },
    deal_damage_when_status_decreased: ({ self, other, log, value }) => {
      const damage = value || 1;
      // This would be triggered when decrease_random_status runs
      other.hp = Math.max(0, (other.hp || 0) - damage);
      log(`${self.name} deals ${damage} damage when status decreased`);
    },
    deal_damage_to_enemy: ({ self, other, log, value }) => {
      const damage = value || 1;
      other.hp = Math.max(0, (other.hp || 0) - damage);
      log(`${self.name} deals ${damage} damage to ${other.name}`);
    },
    
    // ADDITIONAL ACTION HANDLERS
    gain_attack: ({ self, log, value }) => {
      const amount = value || 1;
      self.addAtk(amount);
      log(`<img src="assets/attack.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> ${self.name} gains ${amount} attack`);
    },
    gain_speed: ({ self, log, value }) => {
      const amount = value || 1;
      const oldSpeed = self.speed || 0;
      self.speed = oldSpeed + amount;
      runEffects('onGainSpeed', self, null, log, { amount: amount, delta: amount });
      log(`⚡ ${self.name} gains ${amount} speed`);
    },
    spend_speed_deal_damage: ({ self, other, log, value }) => {
      const speedCost = value?.speedCost || 1;
      const damage = value?.damage || 1;
      if (self.speed >= speedCost) {
        self.speed -= speedCost;
        other.hp = Math.max(0, (other.hp || 0) - damage);
        log(`${self.name} spends ${speedCost} speed to deal ${damage} damage`);
      }
    },
    gain_temp_attack: ({ self, log, value }) => {
      const amount = value || 1;
      self.addTempAtk(amount);
      log(`<img src="assets/attack.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> ${self.name} gains ${amount} temporary attack`);
    },
    increment_counter: ({ self, log, value }) => {
      const counterName = value?.name || 'counter';
      const amount = value?.amount || 1;
      if (!self.counters) self.counters = {};
      self.counters[counterName] = (self.counters[counterName] || 0) + amount;
      log(`🔢 ${self.name} increments ${counterName} by ${amount} (now ${self.counters[counterName]})`);
    },
    stun_enemy: ({ self, other, log, value }) => {
      const amount = value || 1;
      other.addStatus('stun', amount);
      log(`💫 ${self.name} stuns ${other.name} for ${amount} turn(s)`);
    },

    // ===== SET BONUS ACTIONS =====
    gain_highborn_flag: ({ self, log }) => {
      self._setHighborn = true;
      log(`🏆 ${self.name} activates Highborn (ring items trigger twice).`);
    },

    heal_if_attack_equals_1: ({ self, log }) => {
      if ((self.atk || 0) === 1) {
        const healed = self.heal(1);
        if (healed > 0) {
          log(`💚 ${self.name} restores ${healed} health (Sanguine Gemstone set).`);
        }
      }
    },

    reduce_countdowns: ({ self, log, value }) => {
      const amount = value || 1;
      if (typeof self.decAllCountdowns === 'function') {
        self.decAllCountdowns(amount);
        log(`⏱️ ${self.name} reduces countdowns by ${amount} (Glasses of the Hero set).`);
      }
    },

    first_turn_extra_strike: ({ self, log }) => {
      if (self.flags && self.flags.firstTurn) {
        self.addExtraStrikes(1);
        log(`<img src="assets/attack.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> ${self.name} gains +1 extra strike on first turn (Bloodmoon Strike set).`);
      }
    },

    gain_gold: ({ self, log, value }) => {
      const amount = value || 1;
      if (typeof self.addGold === 'function') {
        const gained = self.addGold(amount);
        if (gained > 0) {
          log(`💰 ${self.name} gains ${gained} gold.`);
        }
      }
    },
  };

  function checkCondition(condition, { self, other, log, key, isNew }) {
    if (!condition) return true; // No condition means always run

    switch (condition.type) {
      case 'has_armor':
        return self.armor > 0;
      case 'no_armor':
        return self.armor === 0;
      case 'is_full_health':
        return self.hp === self.hpMax;
      case 'is_not_full_health':
        return self.hp < self.hpMax;
      case 'is_first_turn':
        return self.flags.firstTurn;
      case 'flag':
        return self.flags[condition.flag] === condition.value;
      case 'has_flag':
        return self.flags[condition.key] === true;
      case 'has_status':
        return (self.statuses[condition.key] || 0) > 0;
      case 'is_status':
        return key === condition.key; // Used with onGainStatus trigger
      case 'status_key':
        return key === condition.value; // Used with onGainStatus trigger
      case 'status_is_new':
        return isNew === true; // Used with onGainStatus trigger
      case 'is_exposed_or_wounded':
        return (self.statuses.exposed || 0) > 0 || (self.statuses.wounded || 0) > 0;
      case 'exposed_and_wounded':
        return (self.statuses.exposed || 0) > 0 && (self.statuses.wounded || 0) > 0;
      case 'is_even_turn':
        return (self.flags.turnCount || 0) % 2 === 0;
      case 'is_odd_turn':
        return (self.flags.turnCount || 0) % 2 === 1;
      case 'has_poison':
        return (self.statuses.poison || 0) > 0;
      case 'has_thorns':
        return (self.statuses.thorns || 0) > 0;
      case 'has_freeze':
        return (self.statuses.freeze || 0) > 0;
      case 'has_stun':
        return (self.statuses.stun || 0) > 0;
      case 'has_temp_health':
        return (self.tempHealth || 0) > 0;
      case 'has_any_status':
        const statusesToCheck = effect.value?.statuses || ['poison', 'acid', 'freeze', 'stun'];
        return statusesToCheck.some(status => (self.statuses?.[status] || 0) > 0);
      case 'enemy_has_poison':
        return (other.statuses.poison || 0) > 0;
      case 'enemy_has_freeze':
        return (other.statuses.freeze || 0) > 0;
      case 'enemy_has_stun':
        return (other.statuses.stun || 0) > 0;
      case 'enemy_has_no_poison':
        return (other.statuses.poison || 0) === 0;
      case 'enemy_has_no_freeze':
        return (other.statuses.freeze || 0) === 0;
      case 'enemy_has_no_stun':
        return (other.statuses.stun || 0) === 0;
      case 'has_flag':
        return !!self.flags[condition.key];
      case 'enemy_has_flag':
        return !!other.flags[condition.key];
      case 'has_status_effects':
        const keys = Object.keys(self.statuses || {}).filter(k => (self.statuses[k] || 0) > 0);
        return keys.length > 0;
      case 'has_no_speed':
        return (self.speed || 0) === 0;
      case 'has_speed':
        return (self.speed || 0) > 0;
      case 'enemy_has_higher_stats':
        if (condition.any) {
          return other.atk > self.atk || other.armor > self.armor || other.speed > self.speed;
        }
        return other.atk > self.atk && other.armor > self.armor && other.speed > self.speed;
      case 'speed_equals_attack':
        return self.speed === self.atk;
      case 'player_speed_higher_than_enemy':
        return self.speed > other.speed;
      case 'player_speed_higher_than_armor':
        return self.speed > self.armor;
      case 'is_exposed_and_full_health':
        return (self.statuses.exposed || 0) > 0 && self.hp === self.hpMax;
      case 'min_speed':
        return (self.speed || 0) >= (condition.value || 1);
      case 'min_armor':
        return (self.armor || 0) >= (condition.value || 1);
      case 'enemy_has_no_armor':
        return other.armor === 0;
      case 'speed_greater_than_enemy':
        return (self.speed || 0) > (other.speed || 0);
      case 'speed_less_than_enemy':
        return (self.speed || 0) < (other.speed || 0);
      case 'self_stunned':
        return (self.statuses.stun || 0) > 0;
      case 'enemy_stunned':
        return (other.statuses.stun || 0) > 0;
      case 'self_full_health':
        return self.hp === self.hpMax;
      case 'health_below_percent':
        const percent = condition.value || 50;
        return self.hp < (self.hpMax * percent / 100);
      case 'health_equals':
        return self.hp === condition.value;
      case 'self_max_health_less_than_enemy':
        return self.hpMax < other.hpMax;
      case 'player_has_minimum_status':
        return (self.statuses[condition.status] || 0) >= (condition.amount || 1);
      case 'player_has_less_than_gold':
        return (self.gold || 0) < (condition.amount || 10);
      case 'player_has_minimum_gold':
        return (self.gold || 0) >= (condition.amount || 1);
      case 'has_no_base_armor':
        return (self.baseArmor || 0) === 0;
      // Add more condition types here as needed
      default:
        log(`Unknown condition type: ${condition.type}`);
        return false;
    }
  }

  function runEffects(event, self, other, baseLog, extra = {}) {
    attachHelpers(self, other, baseLog);
    attachHelpers(other, self, baseLog);

    const withSource = (slug, fn) => {
      const prev = CURRENT_SOURCE_SLUG;
      CURRENT_SOURCE_SLUG = slug;
      try { return fn(); } finally { CURRENT_SOURCE_SLUG = prev; }
    };
    
    const log = (m) => baseLog(CURRENT_SOURCE_SLUG ? `::icon:${CURRENT_SOURCE_SLUG}:: ${m}` : m);

    // Process items in battle order: weapon first, then weaponEdge, then items 1→12
    // Ensures Battle Start effects activate in correct slot order per battle logic
    let allItems = [];
    
    // For battleStart specifically, process set effects FIRST so they can modify behavior (e.g., Highborn ring doubling)
    if (event === 'battleStart' && self.setEffectSlugs && self.setEffectSlugs.length > 0) {
      allItems.push(...self.setEffectSlugs);
    }
    
    // Then process normal items in slot order
    allItems.push(...[self.weapon, self.weaponEdge, ...self.items].filter(Boolean));
    
    // Add set effects for non-battleStart events (maintain original behavior)
    if (event !== 'battleStart' && self.setEffectSlugs && self.setEffectSlugs.length > 0) {
      allItems.push(...self.setEffectSlugs);
    }

    for (const itemOrSlug of allItems) {
      const slug = (typeof itemOrSlug === 'string') ? itemOrSlug : (itemOrSlug.slug || itemOrSlug.key);
      if (!slug) continue;

      const details = (global.HEIC_DETAILS || window.HEIC_DETAILS || {})[slug];
      if (!details || !Array.isArray(details.effects)) continue;

      // For Symphony events, only process items that have Symphony effects or tags
      if (event === 'symphony') {
        const isSymphonyItem = (details.effect && details.effect.includes('Symphony')) ||
                               (details.tags && details.tags.includes('Symphony')) ||
                               (details.tags && details.tags.includes('symphony'));
        if (!isSymphonyItem) continue;
      }

      const tier = (typeof itemOrSlug === 'object' && itemOrSlug.tier) ? itemOrSlug.tier : 'base';
      const sourceItem = (typeof itemOrSlug === 'object') ? itemOrSlug : { slug };
      
      const effectCtx = { self, other, log, tier, sourceItem, ...extra };

      // Check if this is a Ring item and Highborn is active
      const isRingItem = (details.tags && details.tags.includes('Ring')) || 
                        getTagsFor(slug).includes('Ring');
      const shouldDouble = self._setHighborn && isRingItem;

      for (const effect of details.effects) {
        // Map simulator event names to our trigger names
        const eventToTriggerMap = {
          'battleStart': 'battleStart',
          'turnStart': 'turnStart',
          'onHit': 'hit',
          'onWounded': 'wounded',
          'onExposed': 'exposed',
          'onDamaged': 'damaged',
          'onKill': 'kill',
          'afterStrike': 'afterStrike',
          'onHeal': 'heal',
          'onGainArmor': 'gainArmor',
          'onGainSpeed': 'gainSpeed',
          'onGainStatus': 'gainStatus',
          'onPoisonTick': 'poisonTick',
          'strikeSkipped': 'strikeSkipped',
          'bombTrigger': 'bombTrigger',
          'postCountdownTrigger': 'postCountdownTrigger',
          'symphony': 'symphony'
        };
        
        const mappedTrigger = eventToTriggerMap[event] || event;
        const triggerMatches = effect.trigger === mappedTrigger;

        if (!triggerMatches) continue;

        // Handle current and legacy trigger formats
        if (effect && !Array.isArray(effect.actions) && effect.action) {
          if (checkCondition(effect.if, effectCtx)) {
            const actionFn = EFFECT_ACTIONS[effect.action];
            if (typeof actionFn === 'function') {
              withSource(slug, () => {
                // Resolve value based on tier, if applicable
                let value = effect.value;
                if (tier === 'gold' && effect.value_gold !== undefined) value = effect.value_gold;
                if (tier === 'diamond' && effect.value_diamond !== undefined) value = effect.value_diamond;

                // Handle repeat functionality (including Highborn ring doubling)
                let repeatCount = effect.repeat || 1;
                if (shouldDouble) repeatCount *= 2;
                
                for (let i = 0; i < repeatCount; i++) {
                  actionFn({ 
                    ...effectCtx, 
                    value, 
                    key: effect.key, 
                    stat: effect.stat, 
                    status: effect.status,
                    baseTier: effect.baseTier,
                    goldTier: effect.goldTier, 
                    diamondTier: effect.diamondTier
                  });
                }
                
                // Handle then actions if present
                if (Array.isArray(effect.then)) {
                  for (const thenEffect of effect.then) {
                    const thenActionFn = EFFECT_ACTIONS[thenEffect.action];
                    if (typeof thenActionFn === 'function') {
                      let thenValue = thenEffect.value;
                      thenActionFn({ 
                        ...effectCtx, 
                        value: thenValue, 
                        key: thenEffect.key,
                        stat: thenEffect.stat,
                        status: thenEffect.status
                      });
                    }
                  }
                }
              });
            } else {
              log(`Unknown action: ${effect.action} (item: ${slug}, trigger: ${effect.trigger || effect.event})`);
            }
          }
        }

        // Handle new event/actions format  
        if (effect && triggerMatches && Array.isArray(effect.actions)) {
          // Check conditions first
          let conditionsMet = true;
          if (Array.isArray(effect.conditions)) {
            conditionsMet = effect.conditions.every(condition => checkCondition(condition, effectCtx));
          } else if (effect.condition) {
            // Handle single condition string
            conditionsMet = checkCondition({ type: effect.condition }, effectCtx);
          } else if (effect.if) {
            // Handle condition formats (current and backward compatibility)
            conditionsMet = checkCondition(effect.if, effectCtx);
          }

          if (conditionsMet && Array.isArray(effect.actions)) {
            withSource(slug, () => {
              // Determine how many times to run the actions (Highborn ring doubling)
              const executionCount = shouldDouble ? 2 : 1;
              
              for (let exec = 0; exec < executionCount; exec++) {
                for (const action of effect.actions) {
                  const actionFn = EFFECT_ACTIONS[action.type];
                  if (typeof actionFn === 'function') {
                    // Handle tiered values
                    let value = action.value;
                    if (Array.isArray(action.by_tier) && action.by_tier.length >= 3) {
                      const tierValues = action.by_tier;
                      if (tier === 'base') value = tierValues[0];
                      else if (tier === 'gold') value = tierValues[1];
                      else if (tier === 'diamond') value = tierValues[2];
                    }

                    actionFn({ ...effectCtx, ...action, value });
                  } else {
                    log(`Unknown action type: ${action.type}`);
                  }
                }
              }
            });
          }
        }
      }
    }
  }
  // --- End of Effect Engine ---

  // --- Set Logic ---
  function getTagsFor(slug) {
    let tags = [];
    try {
      const DETAILS_SOURCE = global.HEIC_DETAILS || (typeof window !== 'undefined' ? window.HEIC_DETAILS : undefined);
      const d = (DETAILS_SOURCE && DETAILS_SOURCE[slug]) || null;
      if (d && Array.isArray(d.tags)) {
        tags = [...d.tags]; // Start with existing tags from data
      }
    } catch (_) {}
    
    // Add pattern-based tags
    if (/tome/i.test(slug) && !tags.includes('Tome')) tags.push('Tome');
    if (/(ring|earring|crown|gemstone|necklace|amulet|pendant|bracelet|talisman|diadem|circlet|band)/i.test(slug) && !tags.includes('Jewelry')) tags.push('Jewelry');
    if ((/ring_/i.test(slug) || /_ring$/i.test(slug)) && !tags.includes('Ring')) tags.push('Ring');
    if (/earring/i.test(slug) && !tags.includes('Earring')) tags.push('Earring');
    if (/bracelet/i.test(slug) && !tags.includes('Bracelet')) tags.push('Bracelet');
    if (/(stone|granite|marble|ore|rock|jade|quartz|sapphire|ruby|citrine|opal|gem|gemstone)/i.test(slug) && !tags.includes('Stone')) tags.push('Stone');
    return tags;
  }

  function normalizeSlug(x) {
    if (!x) return '';
    if (typeof x === 'string') return x;
    if (x.bucket && x.slug) return `${x.bucket}/${x.slug}`;
    if (x.slug) return String(x.slug);
    return String(x);
  }

  function countByTag(slugs, tag) {
    let n = 0;
    for (const s of slugs) {
      const t = getTagsFor(s);
      if (t && t.indexOf(tag) !== -1) n++;
    }
    return n;
  }

  function reqSatisfied(req, slugs) {
    if (!req) return false;
    if (req.kind === 'slugs') {
      const have = new Set(slugs);
      return (req.all || []).every(s => have.has(s));
    }
    if (req.kind === 'tag-count') {
      const c = countByTag(slugs.filter(s => /^items\//.test(s)), req.tag);
      return c >= (req.count || 0);
    }
    return false;
  }

  const SETS = [
    { key:'highborn', name:'Highborn', desc:'Ring items trigger twice',
      reqs:[{ kind:'tag-count', tag:'Ring', count:3 }], effectSlug:'sets/highborn' },
    { key:'iron_chain', name:'Iron Chain', desc:'Battle Start: Gain 5 armor',
      reqs:[{ kind:'slugs', all:['weapons/chainmail_sword','items/chainmail_armor'] }], effectSlug:'sets/iron_chain' },
    { key:'ironstone_arrowhead', name:'Ironstone Arrowhead', desc:'On Hit: Gain 1 armor',
      reqs:[{ kind:'slugs', all:['weapons/ironstone_spear','items/ironstone_sandals'] }], effectSlug:'sets/ironstone_arrowhead' },
    { key:'sanguine_gemstone', name:'Sanguine Gemstone', desc:'If ATK is 1, heal 1 on hit',
      reqs:[{ kind:'slugs', all:['weapons/sanguine_scepter','items/ruby_gemstone'] }], effectSlug:'sets/sanguine_gemstone' },
    { key:'glasses_of_the_hero', name:'Glasses of the Hero', desc:'On Hit: Reduce countdowns by 1',
      reqs:[{ kind:'slugs', all:['items/tome_of_the_hero','items/hero_s_crossguard'] }], effectSlug:'sets/glasses_of_the_hero' },
    { key:'weaver_medallion', name:'Weaver Medallion', desc:'Battle Start: Restore 5 health',
      reqs:[{ kind:'slugs', all:['items/weaver_armor','items/weaver_shield'] }], effectSlug:'sets/weaver_medallion' },
    { key:'basilisk_gaze', name:"Basilisk's Gaze", desc:'On Hit: Give the enemy 1 poison',
      reqs:[{ kind:'slugs', all:['weapons/basilisk_fang','items/basilisk_scale'] }], effectSlug:'sets/basilisk_gaze' },
    { key:'bloodmoon_strike', name:'Bloodmoon Strike', desc:'First turn: +1 extra strike',
      reqs:[{ kind:'slugs', all:['weapons/bloodmoon_dagger','items/bloodmoon_armor'] }], effectSlug:'sets/bloodmoon_strike' },
    { key:'bloodstone_pendant', name:'Bloodstone Pendant', desc:'On Heal: Gain 1 gold',
      reqs:[{ kind:'slugs', all:['items/bloodstone_ring','items/elderwood_necklace'] }], effectSlug:'sets/bloodstone_pendant' },
    { key:'briar_greaves', name:'Briar Greaves', desc:'On Gain Armor: Gain 1 thorns',
      reqs:[{ kind:'slugs', all:['items/briar_greaves','items/blackbriar_rose'] }], effectSlug:'sets/briar_greaves' },
    { key:'brittlebark_blessing', name:'Brittlebark Blessing', desc:'Battle Start: Gain 1 armor and 1 thorns',
      reqs:[{ kind:'slugs', all:['items/brittlebark_helm','items/brittlebark_bow'] }], effectSlug:'sets/brittlebark_blessing' },
    { key:'ironbark_shield', name:'Ironbark Shield', desc:'On Gain Armor: Gain 1 thorns',
      reqs:[{ kind:'slugs', all:['items/ironbark_shield','items/ironbark_brace'] }], effectSlug:'sets/ironbark_shield' },
    { key:'ironstone_ore', name:'Ironstone Ore', desc:'Turn Start: Convert 1 armor → 2 thorns',
      reqs:[{ kind:'slugs', all:['items/ironstone_ore','items/ironstone_helm'] }], effectSlug:'sets/ironstone_ore' },
    { key:'liquid_metal', name:'Liquid Metal', desc:'On Gain Armor: Gain 1 thorns',
      reqs:[{ kind:'slugs', all:['items/liquid_metal','items/liquid_core'] }], effectSlug:'sets/liquid_metal' },
    { key:'saffron_talon', name:'Saffron Talon', desc:'On Hit: Gain 1 thorns',
      reqs:[{ kind:'slugs', all:['items/saffron_talon','items/saffron_gloves'] }], effectSlug:'sets/saffron_talon' }
  ];

  function computeActive(slugs) {
    const list = [];
    try {
      const setSlugs = slugs.map(normalizeSlug).filter(Boolean);
      for (const def of SETS) {
        if ((def.reqs || []).every(r => reqSatisfied(r, setSlugs))) list.push(def);
      }
    } catch (_) {}
    return list;
  }

  function computeActiveEffectSlugs(slugs) {
    return computeActive(slugs).map(d => d.effectSlug);
  }
  // --- End of Set Logic ---

  class Fighter {
    constructor(raw={}){
      const stats = raw.stats || raw;
      this.name = raw.name || 'Fighter';
      this.hp = stats.hp ?? 10;
      this.hpMax = this.hp;
      this.atk = stats.atk ?? 0;  // Base attack of 0 (correct game stats)
      this.armor = stats.armor ?? 0;
      this.baseArmor = this.armor;
      this.speed = stats.speed ?? 0;  // Base speed of 0 (correct game stats)
      this.weapon = raw.weaponSlug || raw.weapon || null;
      this.weaponEdge = raw.weaponEdge || null; // Support for weapon edge upgrade
      this.items = raw.itemSlugs || raw.items || [];
      this.statuses = Object.assign({
        poison:0, acid:0, riptide:0, freeze:0, stun:0,
        thorns:0, regen:0, purity:0
      }, raw.statuses || {});

      // Populate item tags for use in effect conditions and apply item stats
      const DETAILS_SOURCE = global.HEIC_DETAILS || (typeof window !== 'undefined' ? window.HEIC_DETAILS : undefined);
      if (DETAILS_SOURCE) {
        // Apply weapon stats
        if (this.weapon && DETAILS_SOURCE[this.weapon]) {
          const weaponData = DETAILS_SOURCE[this.weapon];
          if (weaponData.stats) {
            const stats = weaponData.stats;
            this.hp += (stats.health || 0);
            this.hpMax += (stats.health || 0);
            this.atk += (stats.attack || 0);
            this.armor += (stats.armor || 0);
            this.baseArmor += (stats.armor || 0);
            this.speed += (stats.speed || 0);
          }
        }
        
        this.items.forEach(item => {
          if (DETAILS_SOURCE[item]) {
            // Store tags
            if (DETAILS_SOURCE[item].tags) {
              ITEM_TAGS[item] = DETAILS_SOURCE[item].tags;
            }
            
            // Apply item stats
            if (DETAILS_SOURCE[item].stats) {
              const stats = DETAILS_SOURCE[item].stats;
              this.hp += (stats.health || 0);
              this.hpMax += (stats.health || 0);
              this.atk += (stats.attack || 0);
              this.armor += (stats.armor || 0);
              this.baseArmor += (stats.armor || 0);
              this.speed += (stats.speed || 0);
            }
          }
        });
      }

      // Detect active sets and add their effect slugs
      this.activeSets = [];
      this.setEffectSlugs = [];
      if (DETAILS_SOURCE) {
        const allSlugs = [this.weapon, this.weaponEdge, ...this.items].filter(Boolean);
        this.activeSets = computeActive(allSlugs);
        this.setEffectSlugs = this.activeSets.map(set => set.effectSlug);
      }

      this.flags = { firstTurn: true };

      this.tempAtk = 0;
      this.extraStrikes = 0;
      this.strikeFactor = 1;
      this.cannotStrike = false;
      this.skipTurn = false;
      this._exposedCount = 0;
      this._exposedLimit = 1;
      this.woundedDone = false;
      this.struckThisTurn = false;
      this.healedThisTurn = 0;
      this.s = this.statuses; // compatibility alias
      this.status = this.statuses;
      this.turnCount = 0;

      this._summary = {
        strikesAttempted: 0,
        strikesLanded: 0,
        hpDamageDealt: 0,
        armorDestroyedDealt: 0,
        bombHpDealt: 0,
        statusesGained: Object.create(null),
        goldGained: 0
      };

      this.countdowns = [];
      this._preserveThorns = 0;
    }
    resetTurn(){
      this.tempAtk = 0;
      this.extraStrikes = 0;
      this.skipTurn = false;
      this.struckThisTurn = false;
      this.healedThisTurn = 0;
    }
    
    // Countdown system
    addCountdown(name, turns, tag, action) {
      if (!this.countdowns) this.countdowns = [];
      this.countdowns.push({
        name,
        turnsLeft: turns,
        tag,
        action,
        triggered: false
      });
    }
    
    processCountdowns(other, log) {
      if (!this.countdowns || !Array.isArray(this.countdowns)) return;
      
      // Decrement all countdowns
      this.countdowns.forEach(cd => {
        cd.turnsLeft = Math.max(0, cd.turnsLeft - 1);
      });
      
      // Trigger any countdowns that reached 0
      const triggeredCountdowns = this.countdowns.filter(cd => cd.turnsLeft === 0 && !cd.triggered);
      triggeredCountdowns.forEach(cd => {
        cd.triggered = true;
        if (typeof cd.action === 'function') {
          try {
            cd.action(this, other, log);
            // Run postCountdownTrigger effects to allow items like Arcane Lens to interact
            runEffects('postCountdownTrigger', this, other, log, { countdown: cd });
          } catch (err) {
            if (log) log(`Error in countdown: ${err.message}`);
          }
        }
      });
      
      // Remove triggered countdowns
      this.countdowns = this.countdowns.filter(cd => !cd.triggered);
    }
  }

  function attachHelpers(self, other, log){
    if (!self || self.helpersAttached) return;
    self.helpersAttached = true;

    self.addAtk = n => { self.atk += n; };
    self.addTempAtk = n => { self.tempAtk += n; };
    self.addArmor = n => {
      const before = self.armor|0;
      self.armor = before + (n|0);
      const gained = Math.max(0, self.armor - before);
      if (gained > 0) {
        runEffects('onGainArmor', self, other, log, { amount: gained });
      }
    };
    self.addExtraStrikes = n => { self.extraStrikes = (self.extraStrikes || 0) + n; };
    self.addGold = n => {
      if (!n) return 0;
      const before = self.gold || 0;
      const after = Math.min(10, before + Math.max(0, n));
      self.gold = after;
      const gained = after - before;
      if (gained > 0 && self._summary) self._summary.goldGained += gained;
      return gained;
    };

    self.addStatus = (k, n) => {
      // Check for cleansing edge - ignore first status effect
      if (n > 0 && self.flags.cleansingEdge) {
        self.flags.cleansingEdge = false;
        log(`${self.name}'s Cleansing Edge ignores ${n} ${k}`);
        return;
      }
      
      const prev = self.statuses[k] || 0;
      const next = Math.max(0, prev + n);
      self.statuses[k] = next;
      const delta = next - prev;
      if (delta > 0 && self._summary) {
        self._summary.statusesGained[k] = (self._summary.statusesGained[k] || 0) + delta;
      }
      const isNew = prev === 0 && next > 0;
      if (n > 0) {
        runEffects('onGainStatus', self, other, log, { key: k, isNew, amount: n, delta });
      }
    };

    self.heal = n => {
      const healed = Math.min(n, self.hpMax - self.hp);
      if(healed>0){
        self.hp += healed;
        self.healedThisTurn += healed;
        log(`${self.name} heals ${healed}`);
        runEffects('onHeal', self, other, log, { amount: healed });
      }
      return healed;
    };
    
    self.countItemsByTag = tag => {
      let count = 0;
      // Count items with the specified tag
      if (self.items && Array.isArray(self.items)) {
        self.items.forEach(item => {
          if (ITEM_TAGS[item] && ITEM_TAGS[item].includes(tag)) {
            count++;
          }
        });
      }
      // Also check weapon if it has the tag
      if (self.weapon && ITEM_TAGS[self.weapon] && ITEM_TAGS[self.weapon].includes(tag)) {
        count++;
      }
      return count;
    };
    self.damageOther = (n, target) => {
      const res = applyDamage(self, target, n, log);
      if(res.exposedNow) runEffects('onExposed', target, self, log);
      if(res.woundedNow) runEffects('onWounded', target, self, log);
      return res;
    };
  }

// Current actor for attribution during hooks
let CURRENT_SOURCE_SLUG = null;

  function applyDamage(src, dst, amount, log){
    amount = Math.floor(Math.max(0, amount));
    let toArmor = Math.min(dst.armor, amount);
    dst.armor -= toArmor;
    amount -= toArmor;
    let toHp = amount;
    dst.hp -= toHp;
    if(dst.hp < 0) dst.hp = 0;
    dst.struckThisTurn = true;
    if(toArmor>0) log(`<img src="assets/armor.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> ${src.name} destroys ${toArmor} armor`);
    if(toHp>0) log(`<img src="assets/attack.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> ${src.name} hits ${dst.name} for ${toHp}`);
    if (src && src._summary) {
      if (toArmor > 0) src._summary.armorDestroyedDealt += toArmor;
      if (toHp > 0) src._summary.hpDamageDealt += toHp;
    }
    runEffects('onDamaged', dst, src, log, { armorLost: toArmor, hpLost: toHp });
    
    // Check for death and trigger onKill effects
    if (dst.hp <= 0 && toHp > 0) {
      runEffects('onKill', src, dst, log);
    }
    
    const exposedNow = dst.armor === 0 && (toArmor+toHp>0) && dst._exposedCount < dst._exposedLimit;
    if(exposedNow) dst._exposedCount++;
    const woundedNow = !dst.woundedDone && dst.hp <= Math.floor(dst.hpMax/2);
    if(woundedNow) dst.woundedDone = true;
    return { toArmor, toHp, exposedNow, woundedNow };
  }

  function strike(att, def, log){
    if (att && att._summary) att._summary.strikesAttempted += 1;
    if (att.statuses.stun > 0) {
      att.statuses.stun--;
      log(`${att.name} is stunned and misses the strike`);
      // Trigger strike_skipped event for stunned players
      runEffects('strikeSkipped', att, def, log, { reason: 'stunned' });
      return;
    }
    let dmg = Math.max(0, att.atk + att.tempAtk);
    const armorBefore = def.armor;
    if (att.statuses && att.statuses.freeze > 0) {
        // Check for Cold Resistance via a flag set by an effect
        if (!att.flags.coldResistance) {
            dmg = Math.floor(dmg / 2);
        } else {
            dmg = dmg * 2;
        }
    }
    
    const res = applyDamage(att, def, dmg, log);
    if (att && att._summary && (res.toArmor + res.toHp) > 0) att._summary.strikesLanded += 1;
    
    runEffects('onHit', att, def, log);
    
    // Re-check for exposed/wounded after onHit effects
    let exposedFired = !!res.exposedNow;
    let woundedFired = !!res.woundedNow;
    if (!exposedFired && armorBefore > 0 && def.armor === 0 && def._exposedCount < (def._exposedLimit||1)) {
      def._exposedCount++;
      log(`🛡️ ${def.name} is now exposed!`);
      runEffects('exposed', def, att, log);
      exposedFired = true;
    }
    if (!woundedFired && !def.woundedDone && def.hp <= Math.floor(def.hpMax/2)) {
      def.woundedDone = true;
      log(`🩸 ${def.name} is now wounded!`);
      runEffects('wounded', def, att, log);
      woundedFired = true;
    }

    runEffects('afterStrike', att, def, log);

    if (def.statuses.thorns > 0) {
      let thornsDmg = def.statuses.thorns;
      // Check for Cactus Cap effect
      if (def.armor === 0 && (att.items.includes('items/cactus_cap') || att.weapon === 'items/cactus_cap')) {
        thornsDmg *= 2;
      }
      applyDamage(def, att, thornsDmg, log);
    }
  }

  function turnStartTicks(a, other, log){
    a.resetTurn();
    
    // Process any active countdowns
    if (typeof a.processCountdowns === 'function') {
      a.processCountdowns(other, log);
    }
    
    if (a.statuses.acid > 0) {
      const armorWas = a.armor;
      const lost = Math.min(a.armor, a.statuses.acid);
      a.armor -= lost;
      if (lost > 0) log(`${a.name} loses ${lost} armor due to Acid`);
      
      // Check if Acid caused Exposed trigger (armor went from >0 to 0)
      if (armorWas > 0 && a.armor === 0 && a._exposedCount < (a._exposedLimit||1)) {
        a._exposedCount++;
        runEffects('onExposed', a, other, log);
      }
    }
    if (a.statuses.poison > 0) {
      if (a.armor === 0) {
        a.hp -= a.statuses.poison;
        if (a.hp < 0) a.hp = 0;
        log(`${a.name} suffers ${a.statuses.poison} poison damage`);
        runEffects('onPoisonTick', a, other, log, { amount: a.statuses.poison });
        
        // Check if Poison caused Wounded trigger (HP crossed 50% threshold)
        if (!a.woundedDone && a.hp <= Math.floor(a.hpMax/2)) {
          a.woundedDone = true;
          runEffects('onWounded', a, other, log);
        }
      }
      a.statuses.poison--;
    }
  }

  function turnEndTicks(a, other, log){
    if (a.statuses.regen > 0) {
      const heal = Math.min(a.statuses.regen, a.hpMax - a.hp);
      if (heal > 0) a.heal(heal); // Use heal helper to trigger onHeal effects
      a.statuses.regen--;
    }
    if (a.struckThisTurn && a.statuses.thorns > 0) {
      if ((a._preserveThorns|0) > 0) {
        a._preserveThorns -= 1;
        log(`${a.name} preserves thorns (${a._preserveThorns} left)`);
      } else {
        a.statuses.thorns = 0;
      }
    }
    if (a.statuses.freeze > 0) a.statuses.freeze--;
    
    // Process Riptide at turn end (per wiki rules)
    if (a.statuses.riptide > 0) {
      // Riptide deals damage directly (bypasses armor like poison)
      a.hp -= a.statuses.riptide;
      if (a.hp < 0) a.hp = 0;
      log(`${a.name} suffers ${a.statuses.riptide} riptide damage`);
      
      // Check if Riptide caused Wounded trigger (HP crossed 50% threshold)
      if (!a.woundedDone && a.hp <= Math.floor(a.hpMax/2)) {
        a.woundedDone = true;
        runEffects('onWounded', a, other, log);
      }
      
      a.statuses.riptide--;
    }
  }

  function pickOrder(l, r){
    return l.speed >= r.speed ? [l, r] : [r, l];
  }

  function simulate(Lraw, Rraw, opts={}){
    const maxTurns = opts.maxTurns || opts.max_turns || 100;
    const includeSummary = opts.includeSummary !== false; // Default to true, can be disabled with opts.includeSummary = false

    const logArr = [];
    const L = new Fighter(Lraw);
    const R = new Fighter(Rraw);

    // Create enhanced logging function that includes HP information
    const logWithHP = (message) => {
      const hpInfo = ` [PlayerHP: ${L.hp} | OpponentHP: ${R.hp}]`;
      logArr.push(message + hpInfo);
    };

    runEffects('preBattle', L, R, logWithHP);
    runEffects('preBattle', R, L, logWithHP);
    
    // Battle Start Phase: Items activate in slot order (weapon first, then items 1→12)
    runEffects('battleStart', L, R, logWithHP);
    runEffects('battleStart', R, L, logWithHP);

    let [actor, target] = pickOrder(L, R);
    let round = 0;
    while(round < maxTurns && L.hp>0 && R.hp>0){
      round++;
      actor.turnCount = (actor.turnCount || 0) + 1;
      actor.flags.turnCount = actor.turnCount;
      logWithHP(`-- Turn ${round} -- ${actor.name}`);
      
      turnStartTicks(actor, target, logWithHP);
      runEffects('turnStart', actor, target, logWithHP);
      
      let strikes = 1 + (actor.extraStrikes || 0);
      if (actor.cannotStrike || actor.skipTurn) strikes = 0;
      strikes = Math.max(0, Math.floor(strikes * (actor.strikeFactor || 1)));

      while(strikes-- > 0 && actor.hp>0 && target.hp>0){
        strike(actor, target, logWithHP);
      }
      
      turnEndTicks(actor, target, logWithHP);
      runEffects('turnEnd', actor, target, logWithHP);

      actor.flags.firstTurn = false;
      [actor, target] = [target, actor];
    }
    const result = L.hp<=0 && R.hp<=0 ? 'Draw' : L.hp<=0 ? 'Victory' : R.hp<=0 ? 'Defeat' : 'Draw';
    
    const baseResult = { result, rounds: round, log: logArr };
    
    if (includeSummary) {
      const summarize = (x) => {
        // Get active sets information
        const activeSets = [];
        if (x.setEffectSlugs && x.setEffectSlugs.length > 0) {
          for (const setSlug of x.setEffectSlugs) {
            // Find the set definition from SETS array
            for (const setDef of SETS) {
              if (setDef.effectSlug === setSlug) {
                activeSets.push({
                  name: setDef.name,
                  desc: setDef.desc,
                  key: setDef.key
                });
                break;
              }
            }
          }
        }
        
        return {
          name: x.name,
          hpRemaining: x.hp,
          armorRemaining: x.armor,
          strikesAttempted: x._summary.strikesAttempted,
          strikesLanded: x._summary.strikesLanded,
          hpDamageDealt: x._summary.hpDamageDealt,
          armorDestroyedDealt: x._summary.armorDestroyedDealt,
          bombHpDealt: x._summary.bombHpDealt || 0,
          statusesGained: x._summary.statusesGained,
          statusesInflicted: x._summary.statusesInflicted || {},
          gold: x.gold || 0,
          sets: activeSets
        };
      };
      baseResult.summary = { left: summarize(L), right: summarize(R) };
    }
    
    return baseResult;
  }

  // Load data when running in Node.js
  if(typeof module !== "undefined" && module.exports) {
    // Load details.json when in Node.js environment
    try {
      const fs = require('fs');
      const path = require('path');
      const detailsPath = path.join(__dirname, 'details.json');
      if (fs.existsSync(detailsPath)) {
        global.HEIC_DETAILS = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));
      }
    } catch (err) {
      console.warn('Could not load details.json:', err.message);
    }
    module.exports = { simulate, Fighter, getTagsFor, computeActive, computeActiveEffectSlugs };
  }
  global.HeICSim = { simulate };
})(typeof window !== 'undefined' ? window : globalThis);
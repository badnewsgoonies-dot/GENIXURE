;(function(global){
  // Data loaded from the HTML page
  const ITEM_TAGS = {};

  // --- Data-Driven Effect Engine ---
  const EFFECT_ACTIONS = {
    // GENERIC ACTIONS
    // COUNTDOWN EFFECTS
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
    add_gold: ({ self, value }) => self.addGold(value),
    add_armor: ({ self, value }) => self.addArmor(value),
    add_attack: ({ self, value }) => self.addAtk(value),
    add_temp_attack: ({ self, value }) => self.addTempAtk(value),
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
          const amount = tier === 3 ? 12 : tier === 2 ? 6 : 3;
          owner.addAtk(amount);
          if (logger) logger(`${owner.name} gains ${amount} attack (${name} complete)`);
        }
        // Add more countdown actions as needed
      };
      
      self.addCountdown(name, turns, tag, countdownAction);
      if (log) log(`${self.name} starts a countdown effect (${turns} turns)`);
    },
    add_temp_attack_from_status: ({ self, key }) => {
      const statusValue = self.statuses[key] || 0;
      if (statusValue > 0) self.addTempAtk(statusValue);
    },
    add_status_to_enemy_from_stat: ({ self, other, key, stat }) => {
      const statValue = self[stat] || 0;
      if (statValue > 0) other.addStatus(key, statValue);
    },
    add_extra_strikes_to_enemy: ({ other, value }) => {
      other.extraStrikes = (other.extraStrikes || 0) + value;
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
    convert_acid_to_attack: ({ self, log, value }) => {
      if ((self.statuses.acid || 0) > 0) {
        self.statuses.acid -= 1;
        const attackGain = value || 2;
        self.addAtk(attackGain);
        if (log) log(`${self.name} converts 1 acid into ${attackGain} attack`);
      }
    },
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
      const converted = Math.floor(other.health * value);
      if (converted > 0) {
        other.health -= converted;
        self.armor += converted;
        if (log) log(`${self.name} converts ${converted} enemy health into armor.`);
      }
    },
    lose_hp: ({ self, value, log }) => {
      self.health = Math.max(0, self.health - value);
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
        self.damageOther(damage);
        log(`${other.name} gains ${amount} ${status} and takes ${damage} damage (${damagePerStack} per stack).`);
      } else {
        log(`${other.name} gains ${amount} ${status}.`);
      }
    },
    add_status: ({ self, key, value }) => self.addStatus(key, value),
      add_status_tiered: ({ self, log, key, baseTier, goldTier, diamondTier, tier }) => {
        const amount = tier === 3 ? diamondTier : tier === 2 ? goldTier : baseTier;
        self.addStatus(key, amount);
        log(`${self.name} gains ${amount} ${key}`);
      },
    add_status_to_enemy: ({ other, key, value }) => other.addStatus(key, value),
      add_status_to_enemy_tiered: ({ other, log, key, baseTier, goldTier, diamondTier, tier }) => {
        const amount = tier === 3 ? diamondTier : tier === 2 ? goldTier : baseTier;
        other.addStatus(key, amount);
        log(`${other.name} gains ${amount} ${key}`);
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
    // NEW ACTIONS for pending migrations
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
    gain_attack: ({ self, log, value }) => {
      self.atk += value || 1;
      log(`${self.name} gains ${value || 1} attack`);
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
    gain_thorns: ({ self, log, value }) => {
      const amount = value || 1;
      self.addStatus('thorns', amount);
      log(`${self.name} gains ${amount} thorns`);
    },
    gain_armor: ({ self, log, value }) => {
      const amount = value || 1;
      self.addArmor(amount);
      log(`${self.name} gains ${amount} armor`);
    },
    lose_speed: ({ self, log, value }) => {
      const amount = value || 1;
      self.speed = Math.max(0, self.speed - amount);
      log(`${self.name} loses ${amount} speed`);
    },
    heal_self: ({ self, log, value }) => {
      const amount = value || 1;
      const healed = self.heal(amount);
      if (healed > 0) log(`${self.name} restores ${healed} health`);
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
    gain_poison: ({ self, log, value }) => {
      const amount = value || 1;
      self.addStatus('poison', amount);
      log(`${self.name} gains ${amount} poison`);
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
      case 'min_speed':
        return (self.speed || 0) >= (condition.value || 1);
      case 'min_armor':
        return (self.armor || 0) >= (condition.value || 1);
      case 'enemy_has_no_armor':
        return other.armor === 0;
      case 'self_stunned':
        return (self.statuses.stun || 0) > 0;
      case 'enemy_stunned':
        return (other.statuses.stun || 0) > 0;
      case 'self_full_health':
        return self.hp === self.hpMax;
      case 'health_equals':
        return self.hp === condition.value;
      case 'self_max_health_less_than_enemy':
        return self.hpMax < other.hpMax;
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

    const allItems = [self.weapon, ...self.items].filter(Boolean);

    for (const itemOrSlug of allItems) {
      const slug = (typeof itemOrSlug === 'string') ? itemOrSlug : (itemOrSlug.slug || itemOrSlug.key);
      if (!slug) continue;

      const details = (window.HEIC_DETAILS || {})[slug];
      if (!details || !Array.isArray(details.effects)) continue;

      const tier = (typeof itemOrSlug === 'object' && itemOrSlug.tier) ? itemOrSlug.tier : 'base';
      const sourceItem = (typeof itemOrSlug === 'object') ? itemOrSlug : { slug };
      
      const effectCtx = { self, other, log, tier, sourceItem, ...extra };

      for (const effect of details.effects) {
        // Handle old trigger format
        if (effect && effect.trigger === event) {
          if (checkCondition(effect.if, effectCtx)) {
            const actionFn = EFFECT_ACTIONS[effect.action];
            if (typeof actionFn === 'function') {
              withSource(slug, () => {
                // Resolve value based on tier, if applicable
                let value = effect.value;
                if (tier === 'gold' && effect.value_gold !== undefined) value = effect.value_gold;
                if (tier === 'diamond' && effect.value_diamond !== undefined) value = effect.value_diamond;

                // Handle repeat functionality
                const repeatCount = effect.repeat || 1;
                for (let i = 0; i < repeatCount; i++) {
                  actionFn({ ...effectCtx, value, key: effect.key });
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
                        key: thenEffect.key 
                      });
                    }
                  }
                }
              });
            } else {
              log(`Unknown action: ${effect.action}`);
            }
          }
        }

        // Handle new event/actions format
        if (effect && effect.event === event) {
          // Check conditions first
          let conditionsMet = true;
          if (Array.isArray(effect.conditions)) {
            conditionsMet = effect.conditions.every(condition => checkCondition(condition, effectCtx));
          }

          if (conditionsMet && Array.isArray(effect.actions)) {
            withSource(slug, () => {
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
            });
          }
        }
      }
    }
  }
  // --- End of Effect Engine ---


  class Fighter {
    constructor(raw={}){
      const stats = raw.stats || raw;
      this.name = raw.name || 'Fighter';
      this.hp = stats.hp ?? 10;
      this.hpMax = this.hp;
      this.atk = stats.atk ?? 0;
      this.armor = stats.armor ?? 0;
      this.baseArmor = this.armor;
      this.speed = stats.speed ?? 0;
      this.weapon = raw.weaponSlug || raw.weapon || null;
      this.items = raw.itemSlugs || raw.items || [];
      this.statuses = Object.assign({
        poison:0, acid:0, riptide:0, freeze:0, stun:0,
        thorns:0, regen:0, purity:0
      }, raw.statuses || {});

      // Populate item tags for use in effect conditions
      if (typeof DETAILS !== 'undefined') {
        this.items.forEach(item => {
          if (DETAILS[item] && DETAILS[item].tags) {
            ITEM_TAGS[item] = DETAILS[item].tags;
          }
        });
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
    if (self.helpersAttached) return;
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
    if(toArmor>0) log(`${src.name} destroys ${toArmor} armor`);
    if(toHp>0) log(`${src.name} hits ${dst.name} for ${toHp}`);
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
      runEffects('onExposed', def, att, log);
      exposedFired = true;
    }
    if (!woundedFired && !def.woundedDone && def.hp <= Math.floor(def.hpMax/2)) {
      def.woundedDone = true;
      runEffects('onWounded', def, att, log);
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
      const lost = Math.min(a.armor, a.statuses.acid);
      a.armor -= lost;
      if (lost > 0) log(`${a.name} loses ${lost} armor due to Acid`);
    }
    if (a.statuses.poison > 0) {
      if (a.armor === 0) {
        a.hp -= a.statuses.poison;
        if (a.hp < 0) a.hp = 0;
        log(`${a.name} suffers ${a.statuses.poison} poison damage`);
        runEffects('onPoisonTick', a, other, log, { amount: a.statuses.poison });
      }
      a.statuses.poison--;
    }
    if (a.statuses.riptide > 0) {
      // Riptide deals damage directly (bypasses armor like poison)
      a.hp -= a.statuses.riptide;
      if (a.hp < 0) a.hp = 0;
      log(`${a.name} suffers ${a.statuses.riptide} riptide damage`);
      a.statuses.riptide--;
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
  }

  function pickOrder(l, r){
    return l.speed >= r.speed ? [l, r] : [r, l];
  }

  function simulate(Lraw, Rraw, opts={}){
    const maxTurns = opts.maxTurns || opts.max_turns || 100;

    const logArr = [];
    const L = new Fighter(Lraw);
    const R = new Fighter(Rraw);

    runEffects('preBattle', L, R, m=>logArr.push(m));
    runEffects('preBattle', R, L, m=>logArr.push(m));
    
    runEffects('battleStart', L, R, m=>logArr.push(m));
    runEffects('battleStart', R, L, m=>logArr.push(m));

    let [actor, target] = pickOrder(L, R);
    let round = 0;
    while(round < maxTurns && L.hp>0 && R.hp>0){
      round++;
      actor.turnCount = (actor.turnCount || 0) + 1;
      actor.flags.turnCount = actor.turnCount;
      logArr.push(`-- Turn ${round} -- ${actor.name}`);
      
      turnStartTicks(actor, target, m=>logArr.push(m));
      runEffects('turnStart', actor, target, m=>logArr.push(m));
      
      let strikes = 1 + (actor.extraStrikes || 0);
      if (actor.cannotStrike || actor.skipTurn) strikes = 0;
      strikes = Math.max(0, Math.floor(strikes * (actor.strikeFactor || 1)));

      while(strikes-- > 0 && actor.hp>0 && target.hp>0){
        strike(actor, target, m=>logArr.push(m));
      }
      
      turnEndTicks(actor, target, m=>logArr.push(m));
      runEffects('turnEnd', actor, target, m=>logArr.push(m));

      actor.flags.firstTurn = false;
      [actor, target] = [target, actor];
    }
    const result = L.hp<=0 && R.hp<=0 ? 'Draw' : L.hp<=0 ? 'RightWin' : R.hp<=0 ? 'LeftWin' : 'Draw';
    const summarize = (x) => ({
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
      gold: x.gold || 0
    });
    return { result, rounds: round, log: logArr, summary: { left: summarize(L), right: summarize(R) } };
  }

  if(typeof module !== "undefined" && module.exports) module.exports = { simulate };
  global.HeICSim = { simulate };
})(typeof window !== 'undefined' ? window : globalThis);
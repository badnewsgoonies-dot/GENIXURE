;(function(global){
  // Data loaded from the HTML page
  const ITEM_TAGS = {};

  // --- Data-Driven Effect Engine ---
  const EFFECT_ACTIONS = {
    // === Original Actions (preserved) ===
    gainStat: ({ self, log, value, stat }) => {
      if (stat && value) {
        if (stat === 'armor') {
          self.addArmor(value);
          log(`${self.name} gains ${value} armor`);
        } else if (stat === 'atk') {
          self.addAttack(value);
          log(`${self.name} gains ${value} attack`);
        } else if (stat === 'hp') {
          self.heal(value);
          log(`${self.name} gains ${value} health`);
        } else if (stat === 'speed') {
          self.speed = (self.speed || 0) + value;
          log(`${self.name} gains ${value} speed`);
        }
      }
    },
    gainStatus: ({ self, log, value, status }) => {
      if (status && value) {
        self.addStatus(status, value);
        log(`${self.name} gains ${value} ${status}`);
      }
    },
    giveEnemyStatus: ({ other, log, value, status }) => {
      if (status && value) {
        other.addStatus(status, value);
        log(`${other.name} gains ${value} ${status}`);
      }
    },
    heal: ({ self, log, value }) => {
      const healed = self.heal(value || 1);
      if (healed > 0) log(`${self.name} heals ${healed} health`);
    },
    dealDamage: ({ self, other, log, value }) => {
      const damage = value || 1;
      other.hp = Math.max(0, (other.hp || 0) - damage);
      log(`${self.name} deals ${damage} damage`);
    },
    loseStat: ({ self, log, value, stat }) => {
      if (stat && value) {
        if (stat === 'armor') {
          self.armor = Math.max(0, (self.armor || 0) - value);
          log(`${self.name} loses ${value} armor`);
        } else if (stat === 'atk') {
          self.tempAtk = Math.max(0, (self.tempAtk || 0) - value);
          log(`${self.name} loses ${value} attack`);
        } else if (stat === 'speed') {
          self.speed = Math.max(0, (self.speed || 0) - value);
          log(`${self.name} loses ${value} speed`);
        }
      }
    },

    // === Add Actions ===
    add_armor: ({ self, log, value }) => {
      self.addArmor(value || 1);
      log(`${self.name} gains ${value || 1} armor`);
    },
    add_attack: ({ self, log, value }) => {
      self.addAttack(value || 1);
      log(`${self.name} gains ${value || 1} attack`);
    },
    add_extra_strikes: ({ self, log, value }) => {
      self.flags.extraStrikes = (self.flags.extraStrikes || 0) + (value || 1);
      log(`${self.name} gains ${value || 1} extra strike${(value || 1) > 1 ? 's' : ''}`);
    },
    add_gold: ({ self, log, value }) => {
      self.gold = (self.gold || 0) + (value || 1);
      log(`${self.name} gains ${value || 1} gold`);
    },
    add_max_health: ({ self, log, value }) => {
      self.hpMax += (value || 1);
      log(`${self.name} gains ${value || 1} max health`);
    },
    add_speed: ({ self, log, value }) => {
      self.speed = (self.speed || 0) + (value || 1);
      log(`${self.name} gains ${value || 1} speed`);
    },
    add_status: ({ self, log, value, status }) => {
      if (status) {
        self.addStatus(status, value || 1);
        log(`${self.name} gains ${value || 1} ${status}`);
      }
    },
    add_status_to_enemy: ({ other, log, value, status }) => {
      if (status) {
        other.addStatus(status, value || 1);
        log(`${other.name} gains ${value || 1} ${status}`);
      }
    },
    add_status_to_enemy_from_stat: ({ self, other, log, stat, status }) => {
      if (stat && status) {
        const amount = self.getStat ? self.getStat(stat) : (self[stat] || 0);
        if (amount > 0) {
          other.addStatus(status, amount);
          log(`${other.name} gains ${amount} ${status} (from ${self.name}'s ${stat})`);
        }
      }
    },
    add_strikes: ({ self, log, value }) => {
      self.flags.additionalStrikes = (self.flags.additionalStrikes || 0) + (value || 1);
      log(`${self.name} gains ${value || 1} additional strike${(value || 1) > 1 ? 's' : ''}`);
    },
    add_strikes_equal_to_speed: ({ self, log }) => {
      const strikes = self.speed || 0;
      if (strikes > 0) {
        self.flags.additionalStrikes = (self.flags.additionalStrikes || 0) + strikes;
        log(`${self.name} gains ${strikes} additional strikes equal to speed`);
      }
    },

    // === Gain Actions ===
    gainArmor: ({ self, log, value }) => {
      self.addArmor(value || 1);
      log(`${self.name} gains ${value || 1} armor`);
    },
    gainAttack: ({ self, log, value }) => {
      self.addAttack(value || 1);
      log(`${self.name} gains ${value || 1} attack`);
    },
    gainGold: ({ self, log, value }) => {
      self.gold = (self.gold || 0) + (value || 1);
      log(`${self.name} gains ${value || 1} gold`);
    },
    gain_armor: ({ self, log, value }) => {
      self.addArmor(value || 1);
      log(`${self.name} gains ${value || 1} armor`);
    },
    gain_attack: ({ self, log, value }) => {
      self.addAttack(value || 1);
      log(`${self.name} gains ${value || 1} attack`);
    },
    gain_attack_equal_to_speed: ({ self, log }) => {
      const attack = self.speed || 0;
      if (attack > 0) {
        self.addAttack(attack);
        log(`${self.name} gains ${attack} attack equal to speed`);
      }
    },
    gain_speed: ({ self, log, value }) => {
      self.speed = (self.speed || 0) + (value || 1);
      log(`${self.name} gains ${value || 1} speed`);
    },
    gain_stat: ({ self, log, value, stat }) => {
      if (stat === 'armor') {
        self.addArmor(value || 1);
        log(`${self.name} gains ${value || 1} armor`);
      } else if (stat === 'attack') {
        self.addAttack(value || 1);
        log(`${self.name} gains ${value || 1} attack`);
      } else if (stat === 'speed') {
        self.speed = (self.speed || 0) + (value || 1);
        log(`${self.name} gains ${value || 1} speed`);
      }
    },
    gain_temp_attack: ({ self, log, value }) => {
      self.tempAtk = (self.tempAtk || 0) + (value || 1);
      log(`${self.name} gains ${value || 1} temporary attack`);
    },
    gain_strikes: ({ self, log, value }) => {
      self.flags.additionalStrikes = (self.flags.additionalStrikes || 0) + (value || 1);
      log(`${self.name} gains ${value || 1} additional strike${(value || 1) > 1 ? 's' : ''}`);
    },

    // === Damage Actions ===
    damage_enemy: ({ other, log, value }) => {
      const damage = value || 1;
      other.hp = Math.max(0, (other.hp || 0) - damage);
      log(`${other.name} takes ${damage} damage`);
    },
    dealBonusDamage: ({ self, other, log, value }) => {
      const bonus = value || 1;
      other.hp = Math.max(0, (other.hp || 0) - bonus);
      log(`${self.name} deals ${bonus} bonus damage`);
    },
    deal_damage_multiple_times: ({ self, other, log, value }) => {
      const damage = value?.damage || 1;
      const times = value?.times || 3;
      for (let i = 0; i < times; i++) {
        other.hp = Math.max(0, (other.hp || 0) - damage);
        log(`${self.name} deals ${damage} damage (${i+1}/${times})`);
      }
    },
    deal_damage_to_enemy: ({ self, other, log, value }) => {
      const damage = value || 1;
      other.hp = Math.max(0, (other.hp || 0) - damage);
      log(`${self.name} deals ${damage} damage to ${other.name}`);
    },
    deal_damage_when_status_decreased: ({ self, other, log, value }) => {
      const damage = value || 1;
      other.hp = Math.max(0, (other.hp || 0) - damage);
      log(`${self.name} deals ${damage} damage when status decreased`);
    },
    conditional_damage_to_enemy: ({ self, other, log, value, condition }) => {
      // Check condition if provided
      if (condition && typeof checkCondition === 'function' && !checkCondition(condition, { self, other, log })) return;
      const damage = value || 1;
      other.hp = Math.max(0, (other.hp || 0) - damage);
      log(`${self.name} deals ${damage} conditional damage to ${other.name}`);
    },
    take_damage: ({ self, log, value }) => {
      const damage = value || 1;
      self.hp = Math.max(0, self.hp - damage);
      log(`${self.name} takes ${damage} damage`);
    },

    // === Heal Actions ===
    heal_to_full: ({ self, log }) => {
      const healed = self.heal(self.hpMax - self.hp);
      if (healed > 0) log(`${self.name} heals to full (${healed} healed)`);
    },
    healToFull: ({ self, log }) => {
      const healed = self.heal(self.hpMax - self.hp);
      if (healed > 0) log(`${self.name} heals to full (${healed} healed)`);
    },
    healOrArmor: ({ self, log, value }) => {
      const amount = value || 1;
      if (self.hp < self.hpMax) {
        const healed = self.heal(amount);
        if (healed > 0) log(`${self.name} heals ${healed}`);
      } else {
        self.addArmor(amount);
        log(`${self.name} gains ${amount} armor`);
      }
    },
    healEqualToThornsLost: ({ self, log, value }) => {
      const thornsLost = value || 0;
      if (thornsLost > 0) {
        const healed = self.heal(thornsLost);
        if (healed > 0) log(`${self.name} heals ${healed} equal to thorns lost`);
      }
    },
    restore_health: ({ self, log, value }) => {
      const healed = self.heal(value || 1);
      if (healed > 0) log(`${self.name} restores ${healed} health`);
    },

    // === Status Management Actions ===
    remove_status: ({ self, log, value, status }) => {
      if (status) {
        const removed = self.removeStatus ? self.removeStatus(status, value || 1) : 0;
        if (removed > 0) log(`${self.name} loses ${removed} ${status}`);
      }
    },
    remove_all_status: ({ self, log }) => {
      const statuses = Object.keys(self.statuses || {});
      statuses.forEach(status => {
        self.statuses[status] = 0;
      });
      if (statuses.length > 0) log(`${self.name} loses all status effects`);
    },
    remove_all_status_and_gain_armor: ({ self, log }) => {
      const statuses = Object.keys(self.statuses || {});
      let totalArmor = 0;
      statuses.forEach(status => {
        totalArmor += self.statuses[status] || 0;
        self.statuses[status] = 0;
      });
      if (totalArmor > 0) {
        self.addArmor(totalArmor);
        log(`${self.name} loses all status effects and gains ${totalArmor} armor`);
      }
    },
    remove_random_status: ({ self, log }) => {
      const statuses = Object.keys(self.statuses || {}).filter(s => (self.statuses[s] || 0) > 0);
      if (statuses.length > 0) {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const removed = self.removeStatus ? self.removeStatus(randomStatus, 1) : 0;
        if (removed > 0) log(`${self.name} loses 1 ${randomStatus}`);
      }
    },
    decrease_random_status: ({ self, log }) => {
      const statuses = Object.keys(self.statuses || {}).filter(s => (self.statuses[s] || 0) > 0);
      if (statuses.length > 0) {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const removed = self.removeStatus ? self.removeStatus(randomStatus, 1) : 0;
        if (removed > 0) log(`${self.name} decreases 1 ${randomStatus}`);
      }
    },
    decreaseRandomStatus: ({ self, log }) => {
      const statuses = Object.keys(self.statuses || {}).filter(s => (self.statuses[s] || 0) > 0);
      if (statuses.length > 0) {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const removed = self.removeStatus ? self.removeStatus(randomStatus, 1) : 0;
        if (removed > 0) log(`${self.name} decreases 1 ${randomStatus}`);
      }
    },
    decreaseRandomStatuses: ({ self, log, value }) => {
      const count = value || 1;
      for (let i = 0; i < count; i++) {
        const statuses = Object.keys(self.statuses || {}).filter(s => (self.statuses[s] || 0) > 0);
        if (statuses.length > 0) {
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          const removed = self.removeStatus ? self.removeStatus(randomStatus, 1) : 0;
          if (removed > 0) log(`${self.name} decreases 1 ${randomStatus} (${i+1}/${count})`);
        }
      }
    },
    decrease_all_statuses: ({ self, log }) => {
      const statuses = Object.keys(self.statuses || {});
      let decreased = false;
      statuses.forEach(status => {
        if ((self.statuses[status] || 0) > 0) {
          self.statuses[status] = Math.max(0, self.statuses[status] - 1);
          decreased = true;
        }
      });
      if (decreased) log(`${self.name} decreases all status effects by 1`);
    },
    decrease_all_countdowns: ({ self, log }) => {
      const statuses = Object.keys(self.statuses || {});
      let decreased = false;
      statuses.forEach(status => {
        if ((self.statuses[status] || 0) > 0) {
          self.statuses[status] = Math.max(0, self.statuses[status] - 1);
          decreased = true;
        }
      });
      if (decreased) log(`${self.name} decreases all countdowns by 1`);
    },

    // === Enemy Actions ===
    remove_enemy_armor: ({ other, log, value }) => {
      const removed = Math.min(other.armor || 0, value || 1);
      other.armor = Math.max(0, (other.armor || 0) - removed);
      if (removed > 0) log(`${other.name} loses ${removed} armor`);
    },
    give_enemy_armor: ({ other, log, value }) => {
      other.addArmor(value || 1);
      log(`${other.name} gains ${value || 1} armor`);
    },
    stun_enemy: ({ other, log, value }) => {
      other.addStatus('stun', value || 1);
      log(`${other.name} is stunned for ${value || 1} turn${(value || 1) > 1 ? 's' : ''}`);
    },
    stunEnemy: ({ other, log, value }) => {
      other.addStatus('stun', value || 1);
      log(`${other.name} is stunned for ${value || 1} turn${(value || 1) > 1 ? 's' : ''}`);
    },
    stunSelf: ({ self, log, value }) => {
      self.addStatus('stun', value || 1);
      log(`${self.name} is stunned for ${value || 1} turn${(value || 1) > 1 ? 's' : ''}`);
    },
    stun_self: ({ self, log, value }) => {
      self.addStatus('stun', value || 1);
      log(`${self.name} is stunned for ${value || 1} turn${(value || 1) > 1 ? 's' : ''}`);
    },
    stealEnemySpeed: ({ self, other, log, value }) => {
      const speedToSteal = Math.min(other.speed || 0, value || 1);
      if (speedToSteal > 0) {
        other.speed = (other.speed || 0) - speedToSteal;
        self.speed = (self.speed || 0) + speedToSteal;
        log(`${self.name} steals ${speedToSteal} speed from ${other.name}`);
      }
    },

    // === Set/Modify Actions ===
    set_armor: ({ self, log, value }) => {
      self.armor = value || 0;
      log(`${self.name}'s armor is set to ${value || 0}`);
    },
    set_health_to: ({ self, log, value }) => {
      self.hp = Math.max(1, value || 1);
      log(`${self.name}'s health is set to ${value || 1}`);
    },
    set_flag: ({ self, log, flag, value }) => {
      if (flag) {
        self.flags = self.flags || {};
        self.flags[flag] = value !== undefined ? value : true;
        log(`${self.name} sets ${flag} flag to ${value !== undefined ? value : true}`);
      }
    },

    // === Convert Actions ===
    convert_health_to_armor: ({ self, log, value }) => {
      const healthToConvert = Math.min(self.hp - 1, value || 1);
      if (healthToConvert > 0) {
        self.hp -= healthToConvert;
        self.addArmor(healthToConvert);
        log(`${self.name} converts ${healthToConvert} health to armor`);
      }
    },
    convert_enemy_health_to_armor: ({ self, other, log, value }) => {
      const healthToConvert = Math.min(other.hp, value || 1);
      if (healthToConvert > 0) {
        other.hp = Math.max(0, other.hp - healthToConvert);
        self.addArmor(healthToConvert);
        log(`${self.name} converts ${healthToConvert} of ${other.name}'s health to armor`);
      }
    },
    convert_random_status_to_poison: ({ self, log }) => {
      const statuses = Object.keys(self.statuses || {}).filter(s => s !== 'poison' && (self.statuses[s] || 0) > 0);
      if (statuses.length > 0) {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const amount = self.statuses[randomStatus] || 0;
        self.statuses[randomStatus] = 0;
        self.addStatus('poison', amount);
        log(`${self.name} converts ${amount} ${randomStatus} to poison`);
      }
    },

    // === Transfer Actions ===
    transfer_all_statuses_to_enemy: ({ self, other, log }) => {
      const statuses = Object.keys(self.statuses || {});
      let transferred = false;
      statuses.forEach(status => {
        const amount = self.statuses[status] || 0;
        if (amount > 0) {
          other.addStatus(status, amount);
          self.statuses[status] = 0;
          transferred = true;
        }
      });
      if (transferred) log(`${self.name} transfers all status effects to ${other.name}`);
    },
    transfer_random_status_to_enemy: ({ self, other, log }) => {
      const statuses = Object.keys(self.statuses || {}).filter(s => (self.statuses[s] || 0) > 0);
      if (statuses.length > 0) {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const amount = self.statuses[randomStatus] || 0;
        self.statuses[randomStatus] = 0;
        other.addStatus(randomStatus, amount);
        log(`${self.name} transfers ${amount} ${randomStatus} to ${other.name}`);
      }
    },

    // === Spend Actions ===
    spend_speed: ({ self, log, value }) => {
      const speedToSpend = Math.min(self.speed || 0, value || 1);
      if (speedToSpend > 0) {
        self.speed -= speedToSpend;
        log(`${self.name} spends ${speedToSpend} speed`);
      }
    },
    spend_speed_decrease_random_status: ({ self, log }) => {
      if ((self.speed || 0) > 0) {
        self.speed -= 1;
        const statuses = Object.keys(self.statuses || {}).filter(s => (self.statuses[s] || 0) > 0);
        if (statuses.length > 0) {
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          const removed = self.removeStatus ? self.removeStatus(randomStatus, 1) : 0;
          log(`${self.name} spends 1 speed to decrease ${removed} ${randomStatus}`);
        } else {
          log(`${self.name} spends 1 speed (no status to decrease)`);
        }
      }
    },
    spendStatus: ({ self, log, value, status }) => {
      if (status) {
        const spent = self.removeStatus ? self.removeStatus(status, value || 1) : 0;
        if (spent > 0) log(`${self.name} spends ${spent} ${status}`);
      }
    },

    // === Special Complex Actions ===
    custom: ({ self, other, log, value, customAction }) => {
      if (customAction && typeof customAction === 'function') {
        customAction({ self, other, log, value });
      } else {
        log(`${self.name} performs custom action`);
      }
    },
    
    noEffect: ({ self, log }) => {
      // Explicitly do nothing - useful for conditional effects that may not trigger
    },

    // === Lose/Remove Actions ===
    lose_hp: ({ self, log, value }) => {
      const damage = value || 1;
      self.hp = Math.max(1, self.hp - damage);
      log(`${self.name} loses ${damage} health`);
    },
    loseHealth: ({ self, log, value }) => {
      const damage = value || 1;
      self.hp = Math.max(1, self.hp - damage);
      log(`${self.name} loses ${damage} health`);
    },
    remove_gold: ({ self, log, value }) => {
      const goldToRemove = Math.min(self.gold || 0, value || 1);
      self.gold = Math.max(0, (self.gold || 0) - goldToRemove);
      if (goldToRemove > 0) log(`${self.name} loses ${goldToRemove} gold`);
    },

    // === Miscellaneous Actions ===
    upgrade: ({ self, log, value }) => {
      log(`${self.name} upgrades${value ? ` (${value})` : ''}`);
    },
    transform: ({ self, log, value }) => {
      log(`${self.name} transforms${value ? ` into ${value}` : ''}`);
    },
    hatchInto: ({ self, log, value }) => {
      log(`${self.name} hatches${value ? ` into ${value}` : ''}`);
    },

    // === Remaining Action Types ===
    alwaysHunted: ({ self, log }) => {
      self.flags = self.flags || {};
      self.flags.alwaysHunted = true;
      log(`${self.name} is always hunted`);
    },
    attackEqualsBaseArmor: ({ self, log }) => {
      self.tempAtk = self.baseArmor || 0;
      log(`${self.name}'s attack equals base armor (${self.baseArmor || 0})`);
    },
    attackEqualsGold: ({ self, log }) => {
      self.tempAtk = self.gold || 0;
      log(`${self.name}'s attack equals gold (${self.gold || 0})`);
    },
    attackEqualsMissingHealth: ({ self, log }) => {
      const missing = self.hpMax - self.hp;
      self.tempAtk = missing;
      log(`${self.name}'s attack equals missing health (${missing})`);
    },
    attackEqualsSpeed: ({ self, log }) => {
      self.tempAtk = self.speed || 0;
      log(`${self.name}'s attack equals speed (${self.speed || 0})`);
    },
    blockGoldGain: ({ self, log }) => {
      self.flags = self.flags || {};
      self.flags.blockGoldGain = true;
      log(`${self.name} blocks gold gain`);
    },
    blockStatusEffectGain: ({ self, log }) => {
      self.flags = self.flags || {};
      self.flags.blockStatusEffectGain = true;
      log(`${self.name} blocks status effect gain`);
    },
    cantStrike: ({ self, log }) => {
      self.flags = self.flags || {};
      self.flags.cantStrike = true;
      log(`${self.name} cannot strike`);
    },
    conditionalPurityToggle: ({ self, log, value }) => {
      self.flags = self.flags || {};
      self.flags.purityToggle = !self.flags.purityToggle;
      log(`${self.name} toggles purity condition`);
    },
    doubleAttack: ({ self, log }) => {
      self.tempAtk = (self.tempAtk || 0) * 2;
      log(`${self.name} doubles attack`);
    },
    doubleBaseArmor: ({ self, log }) => {
      self.baseArmor = (self.baseArmor || 0) * 2;
      log(`${self.name} doubles base armor`);
    },
    doubleHealing: ({ self, log }) => {
      self.flags = self.flags || {};
      self.flags.doubleHealing = true;
      log(`${self.name} gains double healing`);
    },
    doubleStatFromSource: ({ self, log, stat }) => {
      if (stat === 'attack') {
        self.tempAtk = (self.tempAtk || 0) * 2;
        log(`${self.name} doubles attack from source`);
      } else if (stat === 'armor') {
        self.armor = (self.armor || 0) * 2;
        log(`${self.name} doubles armor from source`);
      }
    },
    enemyFirstStrikeDoubleDamage: ({ other, log }) => {
      other.flags = other.flags || {};
      other.flags.firstStrikeDoubleDamage = true;
      log(`${other.name}'s first strike deals double damage`);
    },
    enemyStrikesIgnoreArmor: ({ other, log }) => {
      other.flags = other.flags || {};
      other.flags.strikesIgnoreArmor = true;
      log(`${other.name}'s strikes ignore armor`);
    },
    
    // === Simple stub implementations for remaining action types ===
    gainMaxHealthPerEquippedType: ({ self, log, value }) => {
      const healthGain = value || 1;
      self.hpMax += healthGain;
      log(`${self.name} gains ${healthGain} max health per equipped type`);
    },
    gainPermanentTurnStartThorn: ({ self, log, value }) => {
      self.flags = self.flags || {};
      self.flags.permanentTurnStartThorn = (self.flags.permanentTurnStartThorn || 0) + (value || 1);
      log(`${self.name} gains ${value || 1} permanent turn start thorn`);
    },
    gainStatPerEquippedType: ({ self, log, stat, value }) => {
      const statGain = value || 1;
      if (stat === 'armor') {
        self.addArmor(statGain);
      } else if (stat === 'attack') {
        self.addAttack(statGain);
      }
      log(`${self.name} gains ${statGain} ${stat} per equipped type`);
    },
    gainStatusPerTag: ({ self, log, status, value, tag }) => {
      const statusGain = value || 1;
      if (status) {
        self.addStatus(status, statusGain);
        log(`${self.name} gains ${statusGain} ${status} per ${tag || 'tag'}`);
      }
    },
    gainThornsEqualToAttack: ({ self, log }) => {
      const attack = (self.tempAtk || 0) + (self.atk || 0);
      if (attack > 0) {
        self.addStatus('thorns', attack);
        log(`${self.name} gains ${attack} thorns equal to attack`);
      }
    },
    giveEnemyStatusAfterFirstStrike: ({ other, log, status, value }) => {
      if (status) {
        other.flags = other.flags || {};
        other.flags.statusAfterFirstStrike = { status, value: value || 1 };
        log(`${other.name} will gain ${value || 1} ${status} after first strike`);
      }
    },
    giveEnemyStatusEqualToAttack: ({ self, other, log, status }) => {
      if (status) {
        const attack = (self.tempAtk || 0) + (self.atk || 0);
        if (attack > 0) {
          other.addStatus(status, attack);
          log(`${other.name} gains ${attack} ${status} equal to ${self.name}'s attack`);
        }
      }
    },
    giveEnemyStatusPerEquippedType: ({ other, log, status, value }) => {
      if (status) {
        const statusGain = value || 1;
        other.addStatus(status, statusGain);
        log(`${other.name} gains ${statusGain} ${status} per equipped type`);
      }
    },
    giveStatusEqualToAttack: ({ self, log, status }) => {
      if (status) {
        const attack = (self.tempAtk || 0) + (self.atk || 0);
        if (attack > 0) {
          self.addStatus(status, attack);
          log(`${self.name} gains ${attack} ${status} equal to attack`);
        }
      }
    },
    increase_next_bomb_damage: ({ self, log, value }) => {
      self.flags = self.flags || {};
      self.flags.nextBombDamageBonus = (self.flags.nextBombDamageBonus || 0) + (value || 1);
      log(`${self.name} increases next bomb damage by ${value || 1}`);
    },
    increment_counter: ({ self, log, counter, value }) => {
      if (counter) {
        self.counters = self.counters || {};
        self.counters[counter] = (self.counters[counter] || 0) + (value || 1);
        log(`${self.name} increments ${counter} by ${value || 1}`);
      }
    },
    inheritOnHitFromGemstones: ({ self, log }) => {
      self.flags = self.flags || {};
      self.flags.inheritOnHitFromGemstones = true;
      log(`${self.name} inherits on-hit effects from gemstones`);
    },
    invert_speed: ({ self, log }) => {
      self.speed = -(self.speed || 0);
      log(`${self.name} inverts speed to ${self.speed}`);
    },
    maxHealthAlwaysOne: ({ self, log }) => {
      self.hpMax = 1;
      self.hp = Math.min(self.hp, 1);
      log(`${self.name}'s max health is always 1`);
    },
    modifyTriggerCount: ({ self, log, value }) => {
      self.flags = self.flags || {};
      self.flags.triggerCountModifier = (self.flags.triggerCountModifier || 0) + (value || 1);
      log(`${self.name} modifies trigger count by ${value || 1}`);
    },
    moveExposedWoundedTriggersToBattleStart: ({ self, log }) => {
      self.flags = self.flags || {};
      self.flags.moveExposedWoundedTriggersToBattleStart = true;
      log(`${self.name} moves exposed wounded triggers to battle start`);
    },
    nextWeaponGainsAttack: ({ self, log, value }) => {
      self.flags = self.flags || {};
      self.flags.nextWeaponAttackBonus = (self.flags.nextWeaponAttackBonus || 0) + (value || 1);
      log(`${self.name}'s next weapon gains ${value || 1} attack`);
    },
    protectStatusFromStrikes: ({ self, log, status }) => {
      if (status) {
        self.flags = self.flags || {};
        self.flags.protectedStatuses = self.flags.protectedStatuses || [];
        self.flags.protectedStatuses.push(status);
        log(`${self.name} protects ${status} from strikes`);
      }
    },
    redirectDamageToEnemy: ({ self, other, log, value }) => {
      const damage = value || 1;
      other.hp = Math.max(0, (other.hp || 0) - damage);
      log(`${self.name} redirects ${damage} damage to ${other.name}`);
    },
    reduceEnemyStrikeDamage: ({ other, log, value }) => {
      other.flags = other.flags || {};
      other.flags.strikeDamageReduction = (other.flags.strikeDamageReduction || 0) + (value || 1);
      log(`${other.name}'s strike damage reduced by ${value || 1}`);
    },
    regain_base_armor: ({ self, log }) => {
      const baseArmor = self.baseArmor || 0;
      if (baseArmor > 0) {
        self.addArmor(baseArmor);
        log(`${self.name} regains ${baseArmor} base armor`);
      }
    },
    register_countdown: ({ self, log, value, countdown }) => {
      if (countdown) {
        self.countdowns = self.countdowns || {};
        self.countdowns[countdown] = value || 1;
        log(`${self.name} registers ${countdown} countdown for ${value || 1}`);
      }
    },
    removeEnemyTomes: ({ other, log }) => {
      other.flags = other.flags || {};
      other.flags.removedTomes = true;
      log(`${other.name} loses all tome effects`);
    },
    resetCountdown: ({ self, log, countdown, value }) => {
      if (countdown) {
        self.countdowns = self.countdowns || {};
        self.countdowns[countdown] = value || 0;
        log(`${self.name} resets ${countdown} countdown to ${value || 0}`);
      }
    },
    retriggerAllTomes: ({ self, log }) => {
      self.flags = self.flags || {};
      self.flags.retriggerAllTomes = true;
      log(`${self.name} retriggers all tome effects`);
    },
    retriggerLastWoundedItem: ({ self, log }) => {
      self.flags = self.flags || {};
      self.flags.retriggerLastWoundedItem = true;
      log(`${self.name} retriggers last wounded item`);
    },
    retrigger_random_bomb: ({ self, log }) => {
      self.flags = self.flags || {};
      self.flags.retriggerRandomBomb = true;
      log(`${self.name} retriggers random bomb`);
    },
    riptide_per_negative_attack: ({ self, other, log }) => {
      const attack = (self.tempAtk || 0) + (self.atk || 0);
      const negativeAttack = Math.abs(Math.min(0, attack));
      if (negativeAttack > 0) {
        other.addStatus('riptide', negativeAttack);
        log(`${other.name} gains ${negativeAttack} riptide per negative attack`);
      }
    },
    scalingWithFoundItems: ({ self, log, value }) => {
      const scaling = value || 1;
      log(`${self.name} scales by ${scaling} with found items`);
    },
    statsOnly: ({ self, log }) => {
      self.flags = self.flags || {};
      self.flags.statsOnly = true;
      log(`${self.name} provides stats only`);
    },
    statusRemovesStat: ({ self, log, status, stat, value }) => {
      const statusAmount = self.statuses && self.statuses[status] ? self.statuses[status] : 0;
      if (status && stat && statusAmount > 0) {
        const reduction = value || 1;
        if (stat === 'attack') {
          self.tempAtk = Math.max(0, (self.tempAtk || 0) - reduction);
          log(`${self.name}'s ${status} removes ${reduction} attack`);
        } else if (stat === 'armor') {
          self.armor = Math.max(0, (self.armor || 0) - reduction);
          log(`${self.name}'s ${status} removes ${reduction} armor`);
        }
      }
    },
    statusTriggersTwice: ({ self, log, status }) => {
      if (status) {
        self.flags = self.flags || {};
        self.flags.statusTriggersTwice = self.flags.statusTriggersTwice || [];
        self.flags.statusTriggersTwice.push(status);
        log(`${self.name}'s ${status} triggers twice`);
      }
    },
    strikeTwice: ({ self, log }) => {
      self.flags = self.flags || {};
      self.flags.strikeTwice = true;
      log(`${self.name} strikes twice`);
    },
    temporaryStatGain: ({ self, log, stat, value }) => {
      if (stat === 'attack') {
        self.tempAtk = (self.tempAtk || 0) + (value || 1);
        log(`${self.name} temporarily gains ${value || 1} attack`);
      } else if (stat === 'armor') {
        self.tempArmor = (self.tempArmor || 0) + (value || 1);
        log(`${self.name} temporarily gains ${value || 1} armor`);
      }
    },
    triggerAllWoundedItems: ({ self, log }) => {
      self.flags = self.flags || {};
      self.flags.triggerAllWoundedItems = true;
      log(`${self.name} triggers all wounded items`);
    },
    trigger_symphony: ({ self, log }) => {
      self.flags = self.flags || {};
      self.flags.triggerSymphony = true;
      log(`${self.name} triggers symphony`);
    },
    weaponOilBuff: ({ self, log, value }) => {
      self.flags = self.flags || {};
      self.flags.weaponOilBuff = (self.flags.weaponOilBuff || 0) + (value || 1);
      log(`${self.name} gains weapon oil buff (+${value || 1})`);
    }
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
      case 'enemy_has_higher_stats':
        if (condition.any) {
          return other.attack > self.attack || other.armor > self.armor || other.speed > self.speed;
        }
        return other.attack > self.attack && other.armor > self.armor && other.speed > self.speed;
      case 'speed_equals_attack':
        return self.speed === self.attack;
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

    const allItems = [self.weapon, self.weaponEdge, ...self.items].filter(Boolean);

    for (const itemOrSlug of allItems) {
      const slug = (typeof itemOrSlug === 'string') ? itemOrSlug : (itemOrSlug.slug || itemOrSlug.key);
      if (!slug) continue;

      const details = (window.HEIC_DETAILS || {})[slug];
      if (!details || !Array.isArray(details.effects)) continue;

      // For Symphony events, only process items that have Symphony in their effect description or tags
      if (event === 'symphony') {
        const isSymphonyItem = (details.effect && details.effect.includes('Symphony')) ||
                               (details.tags && details.tags.includes('Symphony')) ||
                               (details.tags && details.tags.includes('symphony'));
        if (!isSymphonyItem) continue;
      }

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
      this.weaponEdge = raw.weaponEdge || null; // Support for weapon edge upgrade
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
    if(toArmor>0) log(`🛡️ ${src.name} destroys ${toArmor} armor`);
    if(toHp>0) log(`⚔️ ${src.name} hits ${dst.name} for ${toHp}`);
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
      runEffects('strike_skipped', att, def, log, { reason: 'stunned' });
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
    const result = L.hp<=0 && R.hp<=0 ? 'Draw' : L.hp<=0 ? 'Victory' : R.hp<=0 ? 'Defeat' : 'Draw';
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

  if(typeof module !== "undefined" && module.exports) module.exports = { simulate, Fighter };
  global.HeICSim = { simulate };
})(typeof window !== 'undefined' ? window : globalThis);
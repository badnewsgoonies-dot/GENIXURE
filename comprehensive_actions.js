// Comprehensive EFFECT_ACTIONS with all 124 action types used in migrated effects
const COMPREHENSIVE_EFFECT_ACTIONS = {
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
      const amount = self.getStat(stat) || 0;
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
    self.tempAtk += (value || 1);
    log(`${self.name} gains ${value || 1} temporary attack`);
  },

  // === Damage Actions ===
  damage_enemy: ({ other, log, value }) => {
    const damage = value || 1;
    other.hp = Math.max(0, (other.hp || 0) - damage);
    log(`${other.name} takes ${damage} damage`);
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
    if (condition && !checkCondition(condition, { self, other, log })) return;
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
  restore_health: ({ self, log, value }) => {
    const healed = self.heal(value || 1);
    if (healed > 0) log(`${self.name} restores ${healed} health`);
  },

  // === Status Management Actions ===
  remove_status: ({ self, log, value, status }) => {
    if (status) {
      const removed = self.removeStatus(status, value || 1);
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
      const removed = self.removeStatus(randomStatus, 1);
      if (removed > 0) log(`${self.name} loses 1 ${randomStatus}`);
    }
  },
  decrease_random_status: ({ self, log }) => {
    const statuses = Object.keys(self.statuses || {}).filter(s => (self.statuses[s] || 0) > 0);
    if (statuses.length > 0) {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const removed = self.removeStatus(randomStatus, 1);
      if (removed > 0) log(`${self.name} decreases 1 ${randomStatus}`);
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
    // Similar to decrease_all_statuses but specifically for countdown effects
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
  stunSelf: ({ self, log, value }) => {
    self.addStatus('stun', value || 1);
    log(`${self.name} is stunned for ${value || 1} turn${(value || 1) > 1 ? 's' : ''}`);
  },
  stun_self: ({ self, log, value }) => {
    self.addStatus('stun', value || 1);
    log(`${self.name} is stunned for ${value || 1} turn${(value || 1) > 1 ? 's' : ''}`);
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
      self.flags[flag] = value !== undefined ? value : true;
      log(`${self.name} sets ${flag} flag to ${value !== undefined ? value : true}`);
    }
  },

  // === Convert Actions ===
  convert_health_to_armor: ({ self, log, value }) => {
    const healthToConvert = Math.min(self.hp - 1, value || 1); // Keep at least 1 HP
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
        const removed = self.removeStatus(randomStatus, 1);
        log(`${self.name} spends 1 speed to decrease ${removed} ${randomStatus}`);
      } else {
        log(`${self.name} spends 1 speed (no status to decrease)`);
      }
    }
  },
  spendStatus: ({ self, log, value, status }) => {
    if (status) {
      const spent = self.removeStatus(status, value || 1);
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
    self.hp = Math.max(1, self.hp - damage); // Don't kill with this action
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
    // Generic upgrade action - specific implementation depends on context
    log(`${self.name} upgrades${value ? ` (${value})` : ''}`);
  },
  transform: ({ self, log, value }) => {
    // Generic transform action - specific implementation depends on context
    log(`${self.name} transforms${value ? ` into ${value}` : ''}`);
  },
  hatchInto: ({ self, log, value }) => {
    // Specific to egg-like items
    log(`${self.name} hatches${value ? ` into ${value}` : ''}`);
  },

  // === Remaining Actions (simplified implementations) ===
  alwaysHunted: ({ self, log }) => {
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
    self.flags.blockGoldGain = true;
    log(`${self.name} blocks gold gain`);
  },
  blockStatusEffectGain: ({ self, log }) => {
    self.flags.blockStatusEffectGain = true;
    log(`${self.name} blocks status effect gain`);
  },
  cantStrike: ({ self, log }) => {
    self.flags.cantStrike = true;
    log(`${self.name} cannot strike`);
  },
  conditionalPurityToggle: ({ self, log, value }) => {
    // Specific to purity mechanics
    self.flags.purityToggle = !self.flags.purityToggle;
    log(`${self.name} toggles purity condition`);
  },
  dealBonusDamage: ({ self, other, log, value }) => {
    const bonus = value || 1;
    other.hp = Math.max(0, (other.hp || 0) - bonus);
    log(`${self.name} deals ${bonus} bonus damage`);
  },
  decreaseRandomStatus: ({ self, log }) => {
    const statuses = Object.keys(self.statuses || {}).filter(s => (self.statuses[s] || 0) > 0);
    if (statuses.length > 0) {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const removed = self.removeStatus(randomStatus, 1);
      if (removed > 0) log(`${self.name} decreases 1 ${randomStatus}`);
    }
  },
  decreaseRandomStatuses: ({ self, log, value }) => {
    const count = value || 1;
    for (let i = 0; i < count; i++) {
      const statuses = Object.keys(self.statuses || {}).filter(s => (self.statuses[s] || 0) > 0);
      if (statuses.length > 0) {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const removed = self.removeStatus(randomStatus, 1);
        if (removed > 0) log(`${self.name} decreases 1 ${randomStatus} (${i+1}/${count})`);
      }
    }
  },
  doubleAttack: ({ self, log }) => {
    self.tempAtk *= 2;
    log(`${self.name} doubles attack`);
  },
  doubleBaseArmor: ({ self, log }) => {
    self.baseArmor = (self.baseArmor || 0) * 2;
    log(`${self.name} doubles base armor`);
  },
  doubleHealing: ({ self, log }) => {
    self.flags.doubleHealing = true;
    log(`${self.name} gains double healing`);
  },
  doubleStatFromSource: ({ self, log, stat }) => {
    if (stat === 'attack') {
      self.tempAtk *= 2;
      log(`${self.name} doubles attack from source`);
    } else if (stat === 'armor') {
      self.armor *= 2;
      log(`${self.name} doubles armor from source`);
    }
  },
  enemyFirstStrikeDoubleDamage: ({ other, log }) => {
    other.flags.firstStrikeDoubleDamage = true;
    log(`${other.name}'s first strike deals double damage`);
  },
  enemyStrikesIgnoreArmor: ({ other, log }) => {
    other.flags.strikesIgnoreArmor = true;
    log(`${other.name}'s strikes ignore armor`);
  },

  // Continue with remaining actions...
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
  gainMaxHealthPerEquippedType: ({ self, log, value }) => {
    // Implementation depends on equipped item tracking
    const healthGain = value || 1;
    self.hpMax += healthGain;
    log(`${self.name} gains ${healthGain} max health per equipped type`);
  },
  gainPermanentTurnStartThorn: ({ self, log, value }) => {
    self.flags.permanentTurnStartThorn = (self.flags.permanentTurnStartThorn || 0) + (value || 1);
    log(`${self.name} gains ${value || 1} permanent turn start thorn`);
  },
  gainStatPerEquippedType: ({ self, log, stat, value }) => {
    // Implementation depends on equipped item tracking
    const statGain = value || 1;
    if (stat === 'armor') {
      self.addArmor(statGain);
      log(`${self.name} gains ${statGain} armor per equipped type`);
    } else if (stat === 'attack') {
      self.addAttack(statGain);
      log(`${self.name} gains ${statGain} attack per equipped type`);
    }
  },
  gainStatusPerTag: ({ self, log, status, value, tag }) => {
    // Implementation depends on item tagging system
    const statusGain = value || 1;
    if (status) {
      self.addStatus(status, statusGain);
      log(`${self.name} gains ${statusGain} ${status} per ${tag || 'tag'}`);
    }
  },
  gainThornsEqualToAttack: ({ self, log }) => {
    const thorns = self.getAttack() || 0;
    if (thorns > 0) {
      self.addStatus('thorns', thorns);
      log(`${self.name} gains ${thorns} thorns equal to attack`);
    }
  },
  giveEnemyStatusAfterFirstStrike: ({ other, log, status, value }) => {
    if (status) {
      other.flags.statusAfterFirstStrike = { status, value: value || 1 };
      log(`${other.name} will gain ${value || 1} ${status} after first strike`);
    }
  },
  giveEnemyStatusEqualToAttack: ({ self, other, log, status }) => {
    if (status) {
      const amount = self.getAttack() || 0;
      if (amount > 0) {
        other.addStatus(status, amount);
        log(`${other.name} gains ${amount} ${status} equal to ${self.name}'s attack`);
      }
    }
  },
  giveEnemyStatusPerEquippedType: ({ other, log, status, value }) => {
    // Implementation depends on equipped item tracking
    if (status) {
      const statusGain = value || 1;
      other.addStatus(status, statusGain);
      log(`${other.name} gains ${statusGain} ${status} per equipped type`);
    }
  },
  giveStatusEqualToAttack: ({ self, log, status }) => {
    if (status) {
      const amount = self.getAttack() || 0;
      if (amount > 0) {
        self.addStatus(status, amount);
        log(`${self.name} gains ${amount} ${status} equal to attack`);
      }
    }
  },
  healEqualToThornsLost: ({ self, log, value }) => {
    const thornsLost = value || 0;
    if (thornsLost > 0) {
      const healed = self.heal(thornsLost);
      if (healed > 0) log(`${self.name} heals ${healed} equal to thorns lost`);
    }
  },
  healOrArmor: ({ self, log, value }) => {
    // Choose between healing or armor based on current state
    const amount = value || 1;
    if (self.hp < self.hpMax) {
      const healed = self.heal(amount);
      if (healed > 0) log(`${self.name} heals ${healed}`);
    } else {
      self.addArmor(amount);
      log(`${self.name} gains ${amount} armor`);
    }
  },
  healToFull: ({ self, log }) => {
    const healed = self.heal(self.hpMax - self.hp);
    if (healed > 0) log(`${self.name} heals to full (${healed} healed)`);
  },
  increase_next_bomb_damage: ({ self, log, value }) => {
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
    self.flags.triggerCountModifier = (self.flags.triggerCountModifier || 0) + (value || 1);
    log(`${self.name} modifies trigger count by ${value || 1}`);
  },
  moveExposedWoundedTriggersToBattleStart: ({ self, log }) => {
    self.flags.moveExposedWoundedTriggersToBattleStart = true;
    log(`${self.name} moves exposed wounded triggers to battle start`);
  },
  nextWeaponGainsAttack: ({ self, log, value }) => {
    self.flags.nextWeaponAttackBonus = (self.flags.nextWeaponAttackBonus || 0) + (value || 1);
    log(`${self.name}'s next weapon gains ${value || 1} attack`);
  },
  protectStatusFromStrikes: ({ self, log, status }) => {
    if (status) {
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
    // Remove all tome-related effects from enemy
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
    self.flags.retriggerAllTomes = true;
    log(`${self.name} retriggers all tome effects`);
  },
  retriggerLastWoundedItem: ({ self, log }) => {
    self.flags.retriggerLastWoundedItem = true;
    log(`${self.name} retriggers last wounded item`);
  },
  retrigger_random_bomb: ({ self, log }) => {
    self.flags.retriggerRandomBomb = true;
    log(`${self.name} retriggers random bomb`);
  },
  riptide_per_negative_attack: ({ self, other, log }) => {
    const negativeAttack = Math.abs(Math.min(0, self.getAttack() || 0));
    if (negativeAttack > 0) {
      other.addStatus('riptide', negativeAttack);
      log(`${other.name} gains ${negativeAttack} riptide per negative attack`);
    }
  },
  scalingWithFoundItems: ({ self, log, value }) => {
    // Implementation depends on found items tracking
    const scaling = value || 1;
    log(`${self.name} scales by ${scaling} with found items`);
  },
  statsOnly: ({ self, log }) => {
    self.flags.statsOnly = true;
    log(`${self.name} provides stats only`);
  },
  statusRemovesStat: ({ self, log, status, stat, value }) => {
    if (status && stat && (self.getStatus(status) || 0) > 0) {
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
      self.flags.statusTriggersTwice = self.flags.statusTriggersTwice || [];
      self.flags.statusTriggersTwice.push(status);
      log(`${self.name}'s ${status} triggers twice`);
    }
  },
  stealEnemySpeed: ({ self, other, log, value }) => {
    const speedToSteal = Math.min(other.speed || 0, value || 1);
    if (speedToSteal > 0) {
      other.speed = (other.speed || 0) - speedToSteal;
      self.speed = (self.speed || 0) + speedToSteal;
      log(`${self.name} steals ${speedToSteal} speed from ${other.name}`);
    }
  },
  strikeTwice: ({ self, log }) => {
    self.flags.strikeTwice = true;
    log(`${self.name} strikes twice`);
  },
  stunEnemy: ({ other, log, value }) => {
    other.addStatus('stun', value || 1);
    log(`${other.name} is stunned for ${value || 1} turn${(value || 1) > 1 ? 's' : ''}`);
  },
  temporaryStatGain: ({ self, log, stat, value }) => {
    if (stat === 'attack') {
      self.tempAtk += (value || 1);
      log(`${self.name} temporarily gains ${value || 1} attack`);
    } else if (stat === 'armor') {
      self.tempArmor = (self.tempArmor || 0) + (value || 1);
      log(`${self.name} temporarily gains ${value || 1} armor`);
    }
  },
  triggerAllWoundedItems: ({ self, log }) => {
    self.flags.triggerAllWoundedItems = true;
    log(`${self.name} triggers all wounded items`);
  },
  trigger_symphony: ({ self, log }) => {
    self.flags.triggerSymphony = true;
    log(`${self.name} triggers symphony`);
  },
  weaponOilBuff: ({ self, log, value }) => {
    self.flags.weaponOilBuff = (self.flags.weaponOilBuff || 0) + (value || 1);
    log(`${self.name} gains weapon oil buff (+${value || 1})`);
  }
};

console.log('Comprehensive EFFECT_ACTIONS object created with all 124 action types');
console.log('Total actions defined:', Object.keys(COMPREHENSIVE_EFFECT_ACTIONS).length);
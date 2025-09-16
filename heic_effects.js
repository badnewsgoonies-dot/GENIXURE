// HeIC Simulation effect hooks
//
// This file defines behaviours for selected weapons and items. Each entry
// corresponds to a slug used in the DETAILS database. The handlers
// expose functions keyed by event phase: `battleStart`, `turnStart`,
// `onHit`, `turnEnd`, etc. The main simulation engine calls these
// handlers at the appropriate times via the `window.HeICSimHooks` object.

// Attach hooks into global namespace if not already present
(function(){
  if(typeof window === 'undefined') return;
  if(!window.HeICSimHooks) window.HeICSimHooks = {};
  const hooks = window.HeICSimHooks;
  // Helper: get tags for a slug from global details (if available); fallback to heuristics
  function getTagsFor(slug){
    try {
      const d = (window.HEIC_DETAILS && window.HEIC_DETAILS[slug]) || null;
      if (d && Array.isArray(d.tags)) return d.tags;
    } catch(_){}
    const tags = [];
    if (/tome/i.test(slug)) tags.push('Tome');
    if (/(ring|earring|crown|gemstone|necklace|amulet|pendant|bracelet|talisman|diadem|circlet|band)/i.test(slug)) tags.push('Jewelry');
    if (/ring_/i.test(slug) || /_ring$/i.test(slug)) tags.push('Ring');
    if (/earring/i.test(slug)) tags.push('Earring');
    if (/bracelet/i.test(slug)) tags.push('Bracelet');
    if (/(stone|granite|marble|ore|rock|jade|quartz|sapphire|ruby|citrine|opal|gem|gemstone)/i.test(slug)) tags.push('Stone');
    return tags;
  }
  function countByTag(self, tag){
    let n = 0;
    const arr = self.items || [];
    for (const s of arr) {
      const slug = (typeof s === 'string') ? s : (s && (s.slug || s.key || ''));
      const tags = getTagsFor(slug);
      if (tags && tags.indexOf(tag) !== -1) n++;
    }
    return n;
  }
  const isBombSlug = (slug) => /items\/(kindling_bomb|time_bomb|sugar_bomb|melon_bomb)\b/.test(slug);
  function valByTier(base, gold, diamond, tier){
    switch((tier||'base').toLowerCase()){
      case 'gold': return gold;
      case 'diamond': return diamond;
      default: return base;
    }
  }

  // Example hook implementations. Adjust numerical values to match
  // Blood Sausage: Heal 5 total at Battle Start, 1 HP at a time (rapid-tick)
  hooks['items/blood_sausage'] = {
    battleStart({ self, log }) {
      let ticks = 5;
      for (let i = 0; i < ticks; i++) {
        const healed = self.heal(1);
        if (healed > 0) log(`${self.name} restores 1 health (Blood Sausage tick ${i+1}/5).`);
      }
    }
  };

  // Global hooks for cross-entity logic
  hooks._global = hooks._global || {};
  // Cleansing Edge support (global intercept): ignore the first status you would gain if the edge is equipped
  if (!hooks._global.onGainStatus) hooks._global.onGainStatus = function(ctx){};
  (function(){
    const prev = hooks._global.onGainStatus;
    hooks._global.onGainStatus = function({ self, log, key, amount }){
      try { if (typeof prev === 'function') prev({ self, log, key, amount }); } catch(_){ }
      try {
        if (!self || !Array.isArray(self.items)) return;
        if (!self.items.includes('upgrades/cleansing_edge')) return;
        if (self._cleanseUsed) return;
        if ((amount|0) > 0) {
          self.statuses[key] = Math.max(0, (self.statuses[key]||0) - (amount|0));
          self._cleanseUsed = true;
          if (log) log(`${self.name} ignores ${amount} ${key} (Cleansing Edge).`);
        }
      } catch(_){}
    };
  })();
  // Blood Chain (item): first time the enemy becomes Wounded, trigger all of your Wounded items
  hooks._global.onWounded = ({ self, other, log, withActor, withSource }) => {
    // 'self' is the newly wounded entity; 'other' might have Blood Chain
    if (!other || !Array.isArray(other.items)) return;
    if (!other.items.includes('items/blood_chain')) return;
    if (other._bloodChainUsed) return;
    other._bloodChainUsed = true;
    const run = () => {
      for (const slug of other.items) {
        const h = hooks[slug];
        if (h && typeof h.onWounded === 'function') {
          try { h.onWounded({ self: other, other: self, log }); } catch (_) {}
        }
      }
    };
    if (typeof withActor === 'function') withActor(other, () => withSource('items/blood_chain', run)); else run();
    withSource('items/blood_chain', () => log(`${other.name}'s Blood Chain triggers all Wounded effects.`));
  };

  // Earrings of Respite: heal 2 HP every other turn (even-numbered turns)
  hooks['items/earrings_of_respite'] = {
    turnEnd({ self, log }) {
      if (self.turnCount % 2 === 0) {
        const healed = self.heal(2);
        if (healed > 0) log(`${self.name} restores ${healed} health (Earrings of Respite, even turn).`);
      }
    }
  };

  // Emerald Earring: Every other turn (even turns) restore 1/2/4 health by tier
  hooks['items/emerald_earring'] = {
    turnStart({ self, log, tier }) {
      if ((self.turnCount|0) % 2 === 0) {
        const healed = self.heal(valByTier(1,2,4,tier));
        if (healed > 0) log(`${self.name} restores ${healed} health (Emerald Earring).`);
      }
    }
  };

  // Poisonous Mushroom: Turn Start — gain 1 Poison
  hooks['items/poisonous_mushroom'] = {
    turnStart({ self, log }) {
      self.addStatus('poison', 1);
      log(`${self.name} gains 1 poison (Poisonous Mushroom).`);
    }
  };

  // Friendship Bracelet: Battle Start: The enemy loses 1 attack
  hooks['items/friendship_bracelet'] = {
    battleStart({ other, log }){
      const before = other.atk|0;
      if (before > 0) {
        other.atk = Math.max(0, before - 1);
        log(`${other.name} loses 1 attack (Friendship Bracelet).`);
      }
    }
  };

  // Leather Belt: If you have 0 base armor, double your max health (baseline)
  hooks['items/leather_belt'] = {
    battleStart({ self, log, tier }){
      const base = self.baseArmor|0;
      if (base === 0) {
        const old = self.hpMax|0;
        const factor = valByTier(2, 4, 8, tier);
        const newMax = Math.max(old, old * factor);
        const extra = newMax - old;
        self.hpMax = newMax;
        // Do not auto-heal; keep current hp where it is
        if (extra>0) log(`${self.name}'s max health increases by ${extra} (Leather Belt ${tier||'base'}).`);
      }
    }
  };

  // Sour Lemon: Battle Start: Gain 1 acid (tier scaling omitted)
  hooks['items/sour_lemon'] = {
    battleStart({ self, log, tier }){
      const n = valByTier(1,2,4,tier);
      self.addStatus('acid', n);
      log(`${self.name} gains ${n} acid (Sour Lemon ${tier||'base'}).`);
    }
  };

  // Soap Stone: First turn: Spend 2 speed to temporarily gain 4 attack
  hooks['items/soap_stone'] = {
    turnStart({ self, log }){
      if (self.flags.firstTurn) {
        const spent = Math.min(2, self.speed);
        self.speed -= spent;
        if (spent > 0) log(`${self.name} spends ${spent} speed (Soap Stone).`);
        self.addTempAtk(4);
      }
    }
  };

  // Muscle Potion: Every 3 strikes: Gain 1 attack
  hooks['items/muscle_potion'] = {
    afterStrike({ self, log, tier }){
      self._mpStrikes = (self._mpStrikes||0)+1;
      if (self._mpStrikes % 3 === 0) {
        const inc = valByTier(1,2,4,tier);
        self.addAtk(inc);
        log(`${self.name} gains ${inc} attack (Muscle Potion ${tier||'base'}).`);
      }
    }
  };

  // Plated Shield: The first time you gain armor, double it
  hooks['items/plated_shield'] = {
    onGainArmor({ self, log, amount }){
      if (!self._platedUsed && amount > 0) {
        self.armor += amount;
        self._platedUsed = true;
        log(`${self.name} doubles armor gain (+${amount}) (Plated Shield).`);
      }
    }
  };

  // Weaver Armor: If base armor is 0, gain armor equal to current health at battle start
  hooks['items/weaver_armor'] = {
    battleStart({ self, log }){
      if ((self.baseArmor|0) === 0) {
        const gain = self.hp|0;
        if (gain > 0) {
          self.addArmor(gain);
          log(`${self.name} gains ${gain} armor (Weaver Armor).`);
        }
      }
    }
  };

  // Rusty Ring: Battle Start: Give enemy 1 acid
  hooks['items/rusty_ring'] = {
    battleStart({ other, log, tier }){
      const n = valByTier(1,2,4,tier);
      other.addStatus('acid', n);
      log(`${other.name} gains ${n} acid (Rusty Ring ${tier||'base'}).`);
    }
  };

  // Holy Tome: Countdown 6: +3 Attack
  hooks['items/holy_tome'] = {
    battleStart({ self, log, tier }){
      // Register a countdown that gives +3 attack when it fires
      if (typeof self.addCountdown === 'function') {
        const t = tier;
        self.addCountdown('Holy Tome', 6, 'Tome', (owner) => {
          owner.addAtk(valByTier(3,6,12,t));
        });
        log(`${self.name} prepares a holy rite (Holy Tome).`);
      }
    }
  };

  // Arcane Lens: If exactly 1 tome equipped, its countdown triggers 3 times total
  hooks['items/arcane_lens'] = {
    postCountdownTrigger({ self, other, log, countdown }){
      try {
        const items = self.items || [];
        const tomeCount = items.filter(s => (getTagsFor(s)||[]).includes('Tome')).length;
        if (tomeCount === 1 && countdown && typeof countdown.action === 'function') {
          // Already fired once; fire two more times
          countdown.action(self, other, log, countdown);
          countdown.action(self, other, log, countdown);
          log(`${self.name}'s Arcane Lens amplifies the tome.`);
        }
      } catch(_){ }
    }
  };

  // Ring Blades (weapon): Battle Start: Steal 1 attack from the enemy
  hooks['weapons/ring_blades'] = {
    battleStart({ self, other, log }){
      const steal = Math.min(1, other.atk|0);
      if (steal > 0) {
        other.atk -= steal;
        self.addAtk(steal);
        log(`${self.name} steals ${steal} attack (Ring Blades).`);
      }
    }
  };
  // the official game where known. Only a handful of items are
  // implemented; unlisted slugs will have no special behaviour.

  // Bee Stinger (food weapon): first turn on hit, give enemy poison, acid and stun
  hooks['items/bee_stinger'] = {
    onHit({ self, other, log }){
      if(self.flags.firstTurn){
        other.addStatus('poison', 4);
        other.addStatus('acid', 3);
        other.addStatus('stun', 2);
        log(`${other.name} gains 4 poison, 3 acid and 2 stun (Bee Stinger).`);
      }
    }
  };

  // Viper Extract: first time the enemy gains poison, give +3 poison
  hooks['items/viper_extract'] = {
    battleStart({ self }){
      self._viperTriggered = false;
    },
    onGainStatus({ self, other, log, key, isNew }){
      if(key === 'poison' && isNew && !self._viperTriggered){
        other.addStatus('poison', 3);
        self._viperTriggered = true;
        log(`${other.name} gains +3 poison (Viper Extract).`);
      }
    }
  };

  // Boiled Ham: if battle start and the holder is exposed or wounded, reduce
  // all statuses by 1 and log each decrease
  hooks['items/boiled_ham'] = {
    battleStart({ self, log }){
      // Determine if exposed or wounded on start
      const exposed = self.status && self.status.exposed > 0;
      const wounded = self.status && self.status.wounded > 0;
      if(exposed || wounded){
        for(const k of Object.keys(self.s || {})){
          if(self.s[k] && self.s[k] > 0){
            self.s[k] -= 1;
            log(`${self.name} decreases ${k} by 1 (Boiled Ham).`);
          }
        }
      }
    }
  };

  // Bitter Melon: Turn Start: Convert 1 stack of another status into 1 Poison
  hooks['items/bitter_melon'] = {
    turnStart({ self, log }) {
      const convertible = Object.keys(self.s || {}).filter(k => k !== 'poison' && (self.s[k] || 0) > 0);
      if (convertible.length > 0) {
        const keyToConvert = convertible[Math.floor(Math.random() * convertible.length)];
        self.s[keyToConvert] = (self.s[keyToConvert] || 0) - 1;
        self.addStatus('poison', 1);
        log(`${self.name} converts 1 ${keyToConvert} into 1 poison (Bitter Melon).`);
      }
    }
  };

  // Swiftstrike Belt: turn start, self-damage and grant extra strikes
  hooks['items/swiftstrike_belt'] = {
    turnStart({ self, log }){
      // Deal 3 self-damage
      if(self.hp > 0){
        self.hp = Math.max(0, self.hp - 3);
        log(`${self.name} takes 3 damage (Swiftstrike Belt).`);
      }
      // Grant one extra strike this turn
      self.extraStrikes = (self.extraStrikes || 0) + 1;
    }
  };

  // Limestone Fruit: if not at max health at turn start, gain 2 acid
  hooks['items/limestone_fruit'] = {
    turnStart({ self, log }){
      const maxHP = self._startHP || self.hpMax || self.hp;
      if(self.hp < maxHP){
        self.s.acid = (self.s.acid || 0) + 2;
        log(`${self.name} gains 2 acid (Limestone Fruit).`);
      }
    }
  };

  // Horned Melon: battle start, exposed or wounded: decrease two random statuses and add thorns

  hooks['items/horned_melon'] = {
    battleStart({ self, log }){
      const keys = Object.keys(self.s || {}).filter(k => self.s[k] > 0);
      for(let i=0; i<2 && keys.length>0; i++){
        const idx = Math.floor(Math.random()*keys.length);
        const key = keys[idx];
        self.s[key] -= 1;
        log(`${self.name} decreases ${key} by 1 (Horned Melon).`);
        keys.splice(idx,1);
      }
      self.s.thorns = (self.s.thorns || 0) + 5;
      log(`${self.name} gains 5 thorns (Horned Melon).`);
    }
  };

  // Gold Ring: Battle Start: Gain +1 Gold
  hooks['items/gold_ring'] = {
    battleStart({ self, log }) {
      self.gold = (self.gold || 0) + 1;
      log(`${self.name} gains 1 gold (Gold Ring).`);
    }
  };

  // Slime Armor: Battle Start: Gain 1 acid
  hooks['items/slime_armor'] = {
    battleStart({ self, log }) {
      self.addStatus('acid', 1);
      log(`${self.name} gains 1 acid (Slime Armor).`);
    }
  };

  // Slime Booster: Battle Start: Convert 1 acid into 2 attack
  hooks['items/slime_booster'] = {
    battleStart({ self, log }) {
      if (self.s.acid > 0) {
        self.s.acid -= 1;
        self.addTempAtk(2);
        log(`${self.name} converts 1 acid into 2 attack (Slime Booster).`);
      }
    }
  };

  // Trail Mix: Battle Start: Deal 1 damage and gain 1 Thorns (repeat twice)
  hooks['items/trail_mix'] = {
    battleStart({ self, other, log }) {
      for (let i = 0; i < 2; i++) {
        other.hp = Math.max(0, other.hp - 1);
        self.addStatus('thorns', 1);
        log(`${self.name} deals 1 damage and gains 1 thorns (Trail Mix).`);
      }
    }
  };

    // Acidic Witherleaf: give enemy acid equal to your speed at battle start
    hooks['items/acidic_witherleaf'] = {
      battleStart({ self, other, log }){
        if(self.speed > 0){
          other.addStatus('acid', self.speed);
          log(`${other.name} gains ${self.speed} acid (Acidic Witherleaf).`);
        }
      }
    };

    // Bramble Belt: gain 1 thorns and give enemy 1 extra strike at battle start
    hooks['items/bramble_belt'] = {
      battleStart({ self, other, log }){
        self.addStatus('thorns', 1);
        other.extraStrikes = (other.extraStrikes || 0) + 1;
        log(`${self.name} gains 1 thorns and ${other.name} gains 1 extra strike (Bramble Belt).`);
      }
    };

    // Bramble Buckler: convert 1 armor to 2 thorns each turn start
    hooks['items/bramble_buckler'] = {
      turnStart({ self, log }){
        if(self.armor > 0){
          self.armor -= 1;
          self.addStatus('thorns', 2);
          log(`${self.name} converts 1 armor to 2 thorns (Bramble Buckler).`);
        }
      }
    };

    // Bramble Talisman: whenever thorns are gained, gain 1 armor
    hooks['items/bramble_talisman'] = {
      onGainStatus({ self, log, key }){
        if(key === 'thorns'){
          self.addArmor(1);
          log(`${self.name} gains 1 armor (Bramble Talisman).`);
        }
      }
    };

    // Acid Mutation: gain 1 acid at battle start and temp attack equal to acid
    hooks['items/acid_mutation'] = {
      battleStart({ self, log }){
        self.addStatus('acid', 1);
        log(`${self.name} gains 1 acid (Acid Mutation).`);
      },
      turnStart({ self }){
        if(self.s.acid > 0){
          self.addTempAtk(self.s.acid);
        }
      }
    };

    // Chainmail Cloak: if you have armor, restore 2 health each turn
    hooks['items/chainmail_cloak'] = {
      turnStart({ self, log }){
        if(self.armor > 0){
          const healed = self.heal(2);
          if(healed>0) log(`${self.name} restores ${healed} health (Chainmail Cloak).`);
        } else {
          // Helpful for debugging flow: indicates why Cloak didn't tick this turn
          log(`${self.name}'s Chainmail Cloak does not heal (no armor).`);
        }
      }
    };

    // Chainmail Armor: when wounded, regain base armor
    hooks['items/chainmail_armor'] = {
      battleStart({ self }){
        self._chainmailBaseArmor = self.armor;
      },
      onWounded({ self, log }){
        if(self._chainmailBaseArmor !== undefined){
          self.armor = self._chainmailBaseArmor;
          log(`${self.name} restores base armor (Chainmail Armor).`);
        }
      }
    };

    // Clearspring Duck: gain 1 armor and decrease a random status by 1 each turn
    hooks['items/clearspring_duck'] = {
      turnStart({ self, log }){
        self.addArmor(1);
        const keys = Object.keys(self.s).filter(k => self.s[k] > 0);
        if(keys.length>0){
          const key = keys[Math.floor(Math.random()*keys.length)];
          self.s[key] -= 1;
          log(`${self.name} decreases ${key} by 1 (Clearspring Duck).`);
        }
      }
    };

    // Clearspring Feather: give enemy a decreased status at battle start
    hooks['items/clearspring_feather'] = {
      battleStart({ self, other, log }){
        const keys = Object.keys(self.s).filter(k => self.s[k] > 0);
        if(keys.length>0){
          const key = keys[Math.floor(Math.random()*keys.length)];
          self.s[key] -= 1;
          other.addStatus(key, 1);
          log(`${self.name} transfers 1 ${key} to ${other.name} (Clearspring Feather).`);
        }
      }
    };

    // Clearspring Opal: spend 1 speed to reduce a random status
    hooks['items/clearspring_opal'] = {
      turnStart({ self, log }){
        const keys = Object.keys(self.s).filter(k => self.s[k] > 0);
        if(keys.length>0 && self.speed > 0){
          self.speed -= 1;
          const key = keys[Math.floor(Math.random()*keys.length)];
          self.s[key] -= 1;
          log(`${self.name} spends 1 speed to decrease ${key} by 1 (Clearspring Opal).`);
        }
      }
    };

    // Clearspring Watermelon: reduce a random status at start, when exposed or wounded
    hooks['items/clearspring_watermelon'] = {
      _reduce(self, log){
        const keys = Object.keys(self.s).filter(k => self.s[k] > 0);
        if(keys.length>0){
          const key = keys[Math.floor(Math.random()*keys.length)];
          self.s[key] -= 1;
          log(`${self.name} decreases ${key} by 1 (Clearspring Watermelon).`);
        }
      }
    };
    hooks['items/clearspring_watermelon'].battleStart = ({ self, log }) => {
      hooks['items/clearspring_watermelon']._reduce(self, log);
    };
    hooks['items/clearspring_watermelon'].onExposed = ({ self, log }) => {
      hooks['items/clearspring_watermelon']._reduce(self, log);
    };
    hooks['items/clearspring_watermelon'].onWounded = ({ self, log }) => {
      hooks['items/clearspring_watermelon']._reduce(self, log);
    };

    // Corroded Bone: convert half the enemy's health into your armor
    hooks['items/corroded_bone'] = {
      battleStart({ self, other, log }){
        const converted = Math.floor(other.hp / 2);
        if(converted>0){
          other.hp -= converted;
          self.addArmor(converted);
          log(`${self.name} converts ${converted} enemy health into armor (Corroded Bone).`);
        }
      }
    };

    // Cracked Bouldershield: when exposed, gain 7 armor
    hooks['items/cracked_bouldershield'] = {
      onExposed({ self, log }){
        self.addArmor(7);
        log(`${self.name} gains 7 armor (Cracked Bouldershield).`);
      }
    };

    // Cracked Whetstone: first turn, temporarily gain 2 attack
    hooks['items/cracked_whetstone'] = {
      turnStart({ self }){
        if(self.flags.firstTurn){
          self.addTempAtk(2);
        }
      }
    };

    // Bramble Vest: first time you lose thorns, heal equal to thorns lost
    hooks['items/bramble_vest'] = {
      turnEnd({ self, log }){
        if(!self._brambleVestUsed && self.struckThisTurn && self.s.thorns>0){
          const lost = self.s.thorns;
          self.heal(lost);
          self._brambleVestUsed = true;
          log(`${self.name} restores ${lost} health (Bramble Vest).`);
        }
      }
    };

    // Briar Greaves: on hit, if you have thorns gain 1 armor
    hooks['items/briar_greaves'] = {
      onHit({ self, log }){
        if(self.s.thorns>0){
          self.addArmor(1);
          log(`${self.name} gains 1 armor (Briar Greaves).`);
        }
      }
    };

    // Horned Helmet: battle start gain 1 thorns
    hooks['items/horned_helmet'] = {
      battleStart({ self, log }){
        self.addStatus('thorns', 1);
        log(`${self.name} gains 1 thorns (Horned Helmet).`);
      }
    };

    // Ice Spikes: if you have freeze, gain 5 thorns at turn start
    hooks['items/ice_spikes'] = {
      turnStart({ self, log }){
        if(self.s.freeze>0){
          self.addStatus('thorns', 5);
          log(`${self.name} gains 5 thorns (Ice Spikes).`);
        }
      }
    };

    // Explosive Fish: give enemy riptide and deal damage per stack
    hooks['items/explosive_fish'] = {
      battleStart({ self, other, log }){
        other.addStatus('riptide', 1);
        const dmg = other.s.riptide * 2;
        self.damageOther(dmg);
        log(`${other.name} takes ${dmg} damage (Explosive Fish).`);
      }
    };

    // Deathcap Bow: gain poison at start and extra strike while poisoned
    hooks['weapons/deathcap_bow'] = {
      battleStart({ self, log }){
        self.addStatus('poison', 3);
        log(`${self.name} gains 3 poison (Deathcap Bow).`);
      },
      turnStart({ self }){
        if(self.s.poison>0){
          self.extraStrikes = (self.extraStrikes || 0) + 1;
        }
      }
    };

    // Blackbriar Armor: whenever you take damage, gain 2 thorns
    hooks['items/blackbriar_armor'] = {
      onDamaged({ self, log, armorLost, hpLost }){
        if(armorLost>0 || hpLost>0){
          self.addStatus('thorns', 2);
          log(`${self.name} gains 2 thorns (Blackbriar Armor).`);
        }
      }
    };

    // Blackbriar Gauntlet: gain 2 thorns per armor lost to the enemy's first strike
    hooks['items/blackbriar_gauntlet'] = {
      battleStart({ self }){ self._bbgDone = false; },
      onDamaged({ self, log, armorLost }){
        if(!self._bbgDone){
          const th = armorLost * 2;
          if(th>0) {
            self.addStatus('thorns', th);
            log(`${self.name} gains ${th} thorns (Blackbriar Gauntlet).`);
          }
          self._bbgDone = true;
        }
      }
    };

    // Blackbriar Rose: whenever you heal, gain 2 thorns
    hooks['items/blackbriar_rose'] = {
      onHeal({ self, log, amount }){
        if(amount>0){
          self.addStatus('thorns', 2);
          log(`${self.name} gains 2 thorns (Blackbriar Rose).`);
        }
      }
    };

  // Brittlebark Armor: Whenever you take damage, take 1 additional damage.
  hooks['items/brittlebark_armor'] = {
    onDamaged({ self, log, armorLost, hpLost }) {
      // Check if any damage was taken and prevent infinite loops.
      if ((armorLost > 0 || hpLost > 0) && !self._brittlebarkProcessing) {
        self._brittlebarkProcessing = true;
        try {
          log(`${self.name} takes 1 additional damage (Brittlebark Armor).`);
          // Manually apply 1 damage, respecting armor, without re-triggering onDamaged.
          const toArmor = Math.min(self.armor, 1);
          self.armor -= toArmor;
          const toHp = 1 - toArmor;
          if (toHp > 0) {
            self.hp = Math.max(0, self.hp - toHp);
          }
        } finally {
          self._brittlebarkProcessing = false;
        }
      }
    }
  };

  // Brittlebark Buckler: Lose all your armor after your enemy's first strike.
  hooks['items/brittlebark_buckler'] = {
    battleStart({ self }) {
      self._brittlebarkBucklerTriggered = false;
    },
    onDamaged({ self, other, log, armorLost, hpLost }) {
      // This should only trigger on damage from the 'other' entity's strike phase
      if (other && other.isStriking && (armorLost > 0 || hpLost > 0) && !self._brittlebarkBucklerTriggered) {
        const lostArmor = self.armor;
        if (lostArmor > 0) {
          self.armor = 0;
          log(`${self.name} loses all ${lostArmor} armor (Brittlebark Buckler).`);
        }
        self._brittlebarkBucklerTriggered = true;
      }
    }
  };

  // Broken Winebottle: When Wounded: next turn keep striking enemy until they’re wounded
  hooks['items/broken_winebottle'] = {
    onWounded({ self, log }) {
      self._winebottleEnraged = true;
      log(`${self.name} becomes enraged (Broken Winebottle).`);
    },
    turnStart({ self, log }) {
      if (self._winebottleEnraged) {
        // Grant a large number of strikes to simulate "keep striking"
        self.addExtraStrikes(10); 
        log(`${self.name} enters a rage, gaining 10 extra strikes (Broken Winebottle).`);
        self._winebottleEnraged = false; // Effect is consumed
      }
    }
  };

  // Cactus Cap: If the enemy has no armor, thorns deal double damage
  hooks['items/cactus_cap'] = {
    // NOTE: This effect modifies global damage calculation and cannot be
    // implemented with a simple item hook. It requires changes to the core
    // simulation engine (heic_sim.js) where thorns damage is applied.
    // A placeholder is added to acknowledge the item.
  };

  // Caustic Tome: Battle Start: Give the enemy acid equal to your speed.
  hooks['items/caustic_tome'] = {
    battleStart({ self, other, log }) {
      if (self.speed > 0) {
        other.addStatus('acid', self.speed);
        log(`${other.name} gains ${self.speed} acid (Caustic Tome).`);
      }
    }
  };

  // Chainlink Medallion: Your On Hit effects trigger twice
  hooks['items/chainlink_medallion'] = {
    afterStrike({ self, other, log, withActor, withSource }) {
      if (self._chainlinkReplaying) return;
      self._chainlinkReplaying = true;
      try {
        // Replay weapon onHit
        if (self.weapon) {
          const wh = hooks[self.weapon];
          if (wh && typeof wh.onHit === 'function') withActor(self, () => withSource(self.weapon, () => wh.onHit({ self, other, log })));
        }
        // Replay items' onHit (excluding Medallion itself)
        for (const s of (self.items || [])) {
          if (s === 'items/chainlink_medallion') continue;
          const h = hooks[s];
          if (h && typeof h.onHit === 'function') withActor(self, () => withSource(s, () => h.onHit({ self, other, log })));
        }
        log(`${self.name}'s on-hit effects trigger twice (Chainlink Medallion).`);
      } finally {
        self._chainlinkReplaying = false;
      }
    }
  };

  // Chainmail Armor: Wounded: Regain your base armor
  hooks['items/chainmail_armor'] = {
    onWounded({ self, log }) {
      if (self.baseArmor > 0) {
        self.addArmor(self.baseArmor);
        log(`${self.name} regains ${self.baseArmor} base armor (Chainmail Armor).`);
      }
    }
  };

  // Chainmail Cloak: Turn Start: If you have armor, restore 2 health
  hooks['items/chainmail_cloak'] = {
    turnStart({ self, log }) {
      if (self.armor > 0) {
        const healed = self.heal(2);
        if (healed > 0) log(`${self.name} restores ${healed} health (Chainmail Cloak).`);
      }
    }
  };

  // Cherry Blade: Battle Start (if Exposed): Deal 4 damage
  hooks['weapons/cherry_blade'] = {
    battleStart({ self, other, log }) {
      if (self.s && self.s.exposed > 0) {
        self.damageOther(4);
        log(`${other.name} takes 4 damage (Cherry Blade).`);
      }
    }
  };

  // Blacksmith Bond: exposed can trigger one additional time
  hooks['items/blacksmith_bond'] = {
    battleStart({ self }){
      self._exposedLimit = (self._exposedLimit || 1) + 1;
    }
  };

  // Countdown-related items
  hooks['items/arcane_bell'] = {
    battleStart({ self, log }) {
      if (typeof self.decAllCountdowns === 'function') {
        self.decAllCountdowns(1);
        log(`${self.name} decreases all countdowns by 1 (Arcane Bell).`);
      }
    }
  };

  hooks['items/arcane_gauntlet'] = {
    battleStart({ self, log }) {
      if (typeof self.halveCountdowns === 'function') {
        self.halveCountdowns();
        log(`${self.name} halves all countdowns (Arcane Gauntlet).`);
      }
    }
  };

  hooks['items/arcane_cloak'] = {
    postCountdownTrigger({ self, countdown, log }) {
      // Re-add the countdown at its original length (post-trigger)
      if (countdown && typeof self.addCountdown === 'function') {
        const t = countdown.origTurns || countdown.turnsLeft || 1;
        self.addCountdown(countdown.name, t, countdown.tag, countdown.action);
        log(`${self.name} resets countdown '${countdown.name}' (Arcane Cloak).`);
      }
    }
  };

  // Arcane Lens does not grant armor itself (Arcane Shield handles +3 armor).
  // Lens duplicates countdown effects via postCountdownTrigger below.
  if (hooks['items/arcane_lens']) {
    delete hooks['items/arcane_lens'].onCountdownTrigger;
  }

  // Arcane Shield: gain 3 armor on any countdown trigger
  hooks['items/arcane_shield'] = {
    onCountdownTrigger({ self, log }) { self.addArmor(3); log(`${self.name} gains 3 armor (Arcane Shield).`); }
  };
  // Arcane Lens: when exactly one Tome is equipped, multiply the FIRST Tome trigger (x3) without duplicating resets
  hooks['items/arcane_lens'] = hooks['items/arcane_lens'] || {};
  if (!hooks['items/arcane_lens'].postCountdownTrigger) {
    hooks['items/arcane_lens'].postCountdownTrigger = ({ self, other, log, countdown }) => {
      try {
        const tomes = (self.items || []).filter(s => /tome/i.test(s));
        if (tomes.length === 1 && countdown && typeof countdown.action === 'function') {
          if (self._lensBurstConsumed) return; // only the first Tome trigger is amplified
          if (self._lensBurstActive) return; // guard recursion
          self._lensBurstActive = true;
          const saveAdd = self.addCountdown;
          // Suppress resets during multiplier replays
          self.addCountdown = function(){};
          try {
            countdown.action(self, other, log, countdown);
            countdown.action(self, other, log, countdown);
            log(`${self.name}'s Arcane Lens multiplies tome effect (x3).`);
            self._lensBurstConsumed = true;
          } finally {
            self.addCountdown = saveAdd;
            self._lensBurstActive = false;
          }
        }
      } catch(_){}
    };
  }

  // Granite Thorns: preserve thorns for the first 3 strikes received
  hooks['items/granite_thorns'] = {
    battleStart({ self, log }) {
      self._preserveThorns = 3;
      log(`${self.name} will preserve thorns for 3 strikes (Granite Thorns).`);
    }
  };

  // Granite Crown: increase Max HP by base Armor and heal up to that amount
  hooks['items/granite_crown'] = {
    battleStart({ self, log }) {
      const add = Math.max(0, self.baseArmor || 0);
      if (add > 0) {
        self.hpMax += add;
        const healed = self.heal(add);
        log(`${self.name} fortifies: Max HP +${add}, heals ${healed} (Granite Crown).`);
      }
    }
  };

  // Granite Cherry: if at full HP at Battle Start, do (+2 Armor, 2 damage) ×3
  hooks['items/granite_cherry'] = {
    battleStart({ self, other, log }) {
      if (self.hp === self.hpMax) {
        for (let i = 0; i < 3; i++) {
          self.addArmor(2);
          self.damageOther(2);
        }
        log(`${self.name} erupts: +6 armor, 6 damage total (Granite Cherry).`);
      }
    }
  };

  // Cherry Cocktail: At Battle Start and when Wounded: Deal 3 damage and restore 3 health
  hooks['items/cherry_cocktail'] = {
    _effect(self, other, log) {
      self.damageOther(3);
      const healed = self.heal(3);
      log(`${self.name} deals 3 damage and restores ${healed} health (Cherry Cocktail).`);
    }
  };
  hooks['items/cherry_cocktail'].battleStart = ({ self, other, log }) => {
    hooks['items/cherry_cocktail']._effect(self, other, log);
  };
  hooks['items/cherry_cocktail'].onWounded = ({ self, other, log }) => {
    hooks['items/cherry_cocktail']._effect(self, other, log);
  };

  // Citrine Crown: Battle Start: Gain 1 gold.
  hooks['items/citrine_crown'] = {
    battleStart({ self, log }) {
      self.gold = (self.gold || 0) + 1;
      log(`${self.name} gains 1 gold (Citrine Crown).`);
    }
  };

  // Citrine Earring: Every other turn: +1 Speed (Gold +2, Diamond +4)
  hooks['items/citrine_earring'] = {
    turnStart({ self, log, tier }) {
      if ((self.turnCount | 0) % 2 === 0) {
        const gain = valByTier(1, 2, 4, tier);
        self.speed += gain;
        log(`${self.name} gains ${gain} speed (Citrine Earring).`);
      }
    }
  };

  // Citrine Gemstone: Base Speed inverted
  hooks['items/citrine_gemstone'] = {
    battleStart({ self, log }) {
      self.speed = (self.speed || 0) * -1;
      log(`${self.name} inverts its speed (Citrine Gemstone).`);
    }
  };

  // Citrine Ring: Battle Start: Gain 1 gold.
  hooks['items/citrine_ring'] = {
    battleStart({ self, log }) {
      self.gold = (self.gold || 0) + 1;
      log(`${self.name} gains 1 gold (Citrine Ring).`);
    }
  };

  // Clearspring Cloak: Exposed: Remove all your status effects and gain 1 armor equal to stacks removed
  hooks['items/clearspring_cloak'] = {
    onExposed({ self, log }) {
      let removedCount = 0;
      for (const key in self.s) {
        if (self.s[key] > 0) {
          removedCount += self.s[key];
          self.s[key] = 0;
        }
      }
      if (removedCount > 0) {
        self.addArmor(removedCount);
        log(`${self.name} removes all status effects and gains ${removedCount} armor (Clearspring Cloak).`);
      }
    }
  };

  // Clearspring Rose: Whenever you restore health, decrease a random status effect by 1.
  hooks['items/clearspring_rose'] = {
    onHeal({ self, log, amount }) {
      if (amount > 0) {
        const convertible = Object.keys(self.s || {}).filter(k => (self.s[k] || 0) > 0);
        if (convertible.length > 0) {
          const keyToConvert = convertible[Math.floor(Math.random() * convertible.length)];
          self.s[keyToConvert] = (self.s[keyToConvert] || 0) - 1;
          log(`${self.name} decreases ${keyToConvert} by 1 (Clearspring Rose).`);
        }
      }
    }
  };

  // Cold Resistance: Freeze doubles your attack instead of halving it
  hooks['items/cold_resistance'] = {
    // NOTE: This requires a modification to the core engine's handling of 'freeze'.
    // A flag can be set here for the engine to check.
    battleStart({ self }) {
      self._coldResistance = true;
    }
  };

  // Combustible Lemon: Turn Start: Spend 1 Speed to deal 2 damage
  hooks['items/combustible_lemon'] = {
    turnStart({ self, log }) {
      if (self.speed >= 1) {
        self.speed -= 1;
        self.damageOther(2);
        log(`${self.name} spends 1 speed to deal 2 damage (Combustible Lemon).`);
      }
    }
  };

  // Crimson Cloak: Whenever you take damage, restore 1 health
  hooks['items/crimson_cloak'] = {
    onDamaged({ self, log, armorLost, hpLost }) {
      if (armorLost > 0 || hpLost > 0) {
        const healed = self.heal(1);
        if (healed > 0) log(`${self.name} restores ${healed} health (Crimson Cloak).`);
      }
    }
  };

  // Crimson Fang: Battle Start: If your health is full, lose 5 health and gain 2 additional strikes
  hooks['items/crimson_fang'] = {
    battleStart({ self, log }) {
      if (self.hp === self.hpMax) {
        self.hp = Math.max(0, self.hp - 5);
        self.addExtraStrikes(2);
        log(`${self.name} loses 5 health and gains 2 extra strikes (Crimson Fang).`);
      }
    }
  };

})();
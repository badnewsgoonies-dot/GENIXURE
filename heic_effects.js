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
  // NOTE: Many hooks have been migrated to the new data-driven system in details.json
  // Blood Sausage: MIGRATED - now uses data-driven effects
  // hooks['items/blood_sausage'] = { ... } // REMOVED - MIGRATED

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

  // Earrings of Respite: MIGRATED - now uses data-driven effects
  // hooks['items/earrings_of_respite'] = { ... } // REMOVED - MIGRATED

  // Emerald Earring: MIGRATED - now uses data-driven effects  
  // hooks['items/emerald_earring'] = { ... } // REMOVED - MIGRATED

  // Poisonous Mushroom: MIGRATED - now uses data-driven effects
  // hooks['items/poisonous_mushroom'] = { ... } // REMOVED - MIGRATED

  // Friendship Bracelet: MIGRATED - now uses data-driven effects
  // hooks['items/friendship_bracelet'] = { ... } // REMOVED - MIGRATED

  // Leather Belt: MIGRATED - now uses data-driven effects
  // hooks['items/leather_belt'] = { ... } // REMOVED - MIGRATED

  // Sour Lemon: MIGRATED - now uses data-driven effects  
  // hooks['items/sour_lemon'] = { ... } // REMOVED - MIGRATED

  // Soap Stone: MIGRATED - now uses data-driven effects
  // hooks['items/soap_stone'] = { ... } // REMOVED - MIGRATED

  // Muscle Potion: MIGRATED - now uses data-driven effects
  // hooks['items/muscle_potion'] = { ... } // REMOVED - MIGRATED

  // Plated Shield: MIGRATED - now uses data-driven effects
  // hooks['items/plated_shield'] = { ... } // REMOVED - MIGRATED

  // Weaver Armor: MIGRATED - now uses data-driven effects
  // hooks['items/weaver_armor'] = { ... } // REMOVED - MIGRATED

  // Rusty Ring: MIGRATED - now uses data-driven effects
  // hooks['items/rusty_ring'] = { ... } // REMOVED - MIGRATED

    // Holy Tome: MIGRATED - now uses data-driven effects
  // hooks['items/holy_tome'] = { ... } // REMOVED - MIGRATED

  // Arcane Lens: MIGRATED - now uses data-driven effects
  // hooks['items/arcane_lens'] = { ... } // REMOVED - MIGRATED

  // Ring Blades: MIGRATED - now uses data-driven effects
  // hooks['weapons/ring_blades'] = { ... } // REMOVED - MIGRATED

  // Bee Stinger: MIGRATED - now uses data-driven effects
  // hooks['items/bee_stinger'] = { ... } // REMOVED - MIGRATED

  // Viper Extract: MIGRATED - now uses data-driven effects
  // hooks['items/viper_extract'] = { ... } // REMOVED - MIGRATED

  // Boiled Ham: MIGRATED - now uses data-driven effects
  // hooks['items/boiled_ham'] = { ... } // REMOVED - MIGRATED

  // Bitter Melon: MIGRATED - now uses data-driven effects
  // hooks['items/bitter_melon'] = { ... } // REMOVED - MIGRATED

  // Swiftstrike Belt: MIGRATED - now uses data-driven effects
  // hooks['items/swiftstrike_belt'] = { ... } // REMOVED - MIGRATED

  // Arcane Lens: If exactly 1 tome equipped, its countdown triggers 3 times total
  // Items already migrated to data-driven system - legacy hooks removed:
  // arcane_lens, ring_blades, bee_stinger, viper_extract, boiled_ham  // Viper Extract: first time the enemy gains poison, give +3 poison
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

  // Items migrated to data-driven system:
  // bitter_melon, swiftstrike_belt, limestone_fruit, horned_melon, 
  // gold_ring, slime_armor, slime_booster, trail_mix, acidic_witherleaf

    // Items migrated to data-driven system:
    // bramble_belt, bramble_buckler, bramble_talisman, acid_mutation,
    // chainmail_cloak, chainmail_armor, clearspring_duck

    // Items migrated to data-driven system:
    // clearspring_feather, clearspring_opal, clearspring_watermelon, corroded_bone,
    // cracked_bouldershield, cracked_whetstone, bramble_vest, briar_greaves

    // Items migrated to data-driven system:
    // horned_helmet, ice_spikes, explosive_fish, deathcap_bow, blackbriar_armor,
    // blackbriar_gauntlet, blackbriar_rose

      // Items already migrated to data-driven system - legacy hooks removed:
    // brittlebark_armor, brittlebark_buckler, broken_winebottle, cactus_cap

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
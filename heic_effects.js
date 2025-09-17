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
  // arcane_lens, ring_blades, bee_stinger, viper_extract, boiled_ham 
  // MIGRATED ITEMS - legacy hooks removed:
  // viper_extract: MIGRATED - uses flag system for first poison tracking
  // boiled_ham: MIGRATED - uses is_exposed_or_wounded condition and decrease_all_statuses action
  // brittlebark_buckler: MIGRATED - uses lose_all_armor action with is_first_strike condition
  // broken_winebottle: MIGRATED - uses enraged flag system
  // cactus_cap: MIGRATED - uses doubleThornsOnNoArmor flag
  // caustic_tome: MIGRATED - uses give_enemy_acid_equal_to_speed action
  // chainmail_armor: MIGRATED - uses regain_base_armor action on onWounded
  // chainmail_cloak: MIGRATED - uses heal action with min_armor condition
  // weapons/cherry_blade: MIGRATED - uses exposed damage, speed reduction, and healing
  // items/arcane_shield: MIGRATED - uses add_armor_on_countdown action
  // items/granite_thorns: MIGRATED - uses preserve thorns flag
  // items/arcane_cloak: MIGRATED - uses reset_countdown_on_trigger action

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

  // MIGRATED ITEMS - legacy hooks removed:


  // Cactus Cap: If the enemy has no armor, thorns deal double damage

  // Caustic Tome: Battle Start: Give the enemy acid equal to your speed.

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

  // Chainmail Cloak: Turn Start: If you have armor, restore 2 health

  // Cherry Blade: Battle Start (if Exposed): Deal 4 damage

  // Blacksmith Bond: exposed can trigger one additional time

  // Countdown-related items



  // Arcane Lens does not grant armor itself (Arcane Shield handles +3 armor).
  // Lens duplicates countdown effects via postCountdownTrigger below.
  if (hooks['items/arcane_lens']) {
    delete hooks['items/arcane_lens'].onCountdownTrigger;
  }

  // Arcane Shield: gain 3 armor on any countdown trigger
  // Arcane Lens: when exactly one Tome is equipped, multiply the FIRST Tome trigger (x3) without duplicating resets
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

  // Granite Crown: increase Max HP by base Armor and heal up to that amount

  // Granite Cherry: if at full HP at Battle Start, do (+2 Armor, 2 damage) ×3

  // Cherry Cocktail: At Battle Start and when Wounded: Deal 3 damage and restore 3 health

  // Citrine Crown: Battle Start: Gain 1 gold.

  // Citrine Earring: Every other turn: +1 Speed (Gold +2, Diamond +4)

  // Citrine Gemstone: Base Speed inverted

  // Citrine Ring: Battle Start: Gain 1 gold.

  // Clearspring Cloak: Exposed: Remove all your status effects and gain 1 armor equal to stacks removed

  // Clearspring Rose: Whenever you restore health, decrease a random status effect by 1.

  // Cold Resistance: Freeze doubles your attack instead of halving it

  // Combustible Lemon: Turn Start: Spend 1 Speed to deal 2 damage

  // Crimson Cloak: Whenever you take damage, restore 1 health

  // Crimson Fang: Battle Start: If your health is full, lose 5 health and gain 2 additional strikes

})();
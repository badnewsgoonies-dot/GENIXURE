;(function(global){

  // --- Data-Driven Effect Engine ---
  const EFFECT_ACTIONS = {
    // GENERIC ACTIONS
    add_gold: ({ self, value }) => self.addGold(value),
    add_armor: ({ self, value }) => self.addArmor(value),
    add_attack: ({ self, value }) => self.addAtk(value),
    add_temp_attack: ({ self, value }) => self.addTempAtk(value),
    add_temp_attack_from_status: ({ self, key }) => {
      const statusValue = self.statuses[key] || 0;
      if (statusValue > 0) self.addTempAtk(statusValue);
    },
    add_status_to_enemy_from_stat: ({ self, other, key, stat }) => {
      const statValue = self[stat] || 0;
      if (statValue > 0) other.addStatus(key, statValue);
    },
    add_speed: ({ self, value }) => { self.speed = (self.speed || 0) + value; },
    add_extra_strikes: ({ self, value }) => self.addExtraStrikes(value),
    deal_damage: ({ self, other, value }) => self.damageOther(value, other),
    heal: ({ self, value }) => self.heal(value),
    add_status: ({ self, key, value }) => self.addStatus(key, value),
    add_status_to_enemy: ({ other, key, value }) => other.addStatus(key, value),
    
    // COMPLEX/CUSTOM ACTIONS
    // These can be added for effects that are too complex for simple key-value pairs.
    // Example: 'action': 'custom_brittlebark_buckler'
  };

  function checkCondition(condition, { self, other, log }) {
    if (!condition) return true; // No condition means always run

    switch (condition.type) {
      case 'has_armor':
        return self.armor > 0;
      case 'no_armor':
        return self.armor === 0;
      case 'is_full_health':
        return self.hp === self.hpMax;
      case 'is_first_turn':
        return self.flags.firstTurn;
      case 'has_status':
        return (self.statuses[condition.key] || 0) > 0;
      case 'enemy_has_no_armor':
        return other.armor === 0;
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

      const details = (global.HEIC_DETAILS || {})[slug];
      if (!details || !Array.isArray(details.effects)) continue;

      const tier = (typeof itemOrSlug === 'object' && itemOrSlug.tier) ? itemOrSlug.tier : 'base';
      const sourceItem = (typeof itemOrSlug === 'object') ? itemOrSlug : { slug };
      
      const effectCtx = { self, other, log, tier, sourceItem, ...extra };

      for (const effect of details.effects) {
        if (effect && effect.trigger === event) {
          if (checkCondition(effect.if, effectCtx)) {
            const actionFn = EFFECT_ACTIONS[effect.action];
            if (typeof actionFn === 'function') {
              withSource(slug, () => {
                // Resolve value based on tier, if applicable
                let value = effect.value;
                if (tier === 'gold' && effect.value_gold !== undefined) value = effect.value_gold;
                if (tier === 'diamond' && effect.value_diamond !== undefined) value = effect.value_diamond;

                actionFn({ ...effectCtx, value, key: effect.key });
              });
            } else {
              log(`Unknown action: ${effect.action}`);
            }
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
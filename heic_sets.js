// HeIC Set Bonuses — definitions + hook registrations
(function () {
  if (typeof window === 'undefined') return;
  const hooks = window.HeICSimHooks = window.HeICSimHooks || {};

  function getTagsFor(slug) {
    try {
      const d = (window.HEIC_DETAILS && window.HEIC_DETAILS[slug]) || null;
      if (d && Array.isArray(d.tags)) return d.tags;
    } catch (_) {}
    const tags = [];
    if (/tome/i.test(slug)) tags.push('Tome');
    if (/(ring|earring|crown|gemstone|necklace|amulet|pendant|bracelet|talisman|diadem|circlet|band)/i.test(slug)) tags.push('Jewelry');
    if (/ring_/i.test(slug) || /_ring$/i.test(slug)) tags.push('Ring');
    if (/earring/i.test(slug)) tags.push('Earring');
    if (/bracelet/i.test(slug)) tags.push('Bracelet');
    if (/(stone|granite|marble|ore|rock|jade|quartz|sapphire|ruby|citrine|opal|gem|gemstone)/i.test(slug)) tags.push('Stone');
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
      reqs:[{ kind:'slugs', all:['items/saffron_talon','items/saffron_gloves'] }], effectSlug:'sets/saffron_talon' },
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
  window.HeICSets = { definitions: SETS, computeActive, computeActiveEffectSlugs };

  hooks['sets/iron_chain'] = { battleStart({ self, log }) { self.addArmor(5); if (log) log(`${self.name} gains 5 armor (Iron Chain set).`);} };
  hooks['sets/ironstone_arrowhead'] = { onHit({ self, log }) { self.addArmor(1); if (log) log(`${self.name} gains 1 armor (Ironstone Arrowhead set).`);} };
  hooks['sets/sanguine_gemstone'] = { onHit({ self, log }) { const atk = self.atk|0; if (atk === 1) { const h = self.heal(1); if (h>0 && log) log(`${self.name} restores ${h} health (Sanguine Gemstone set).`);} } };
  hooks['sets/glasses_of_the_hero'] = { onHit({ self, log }) { if (typeof self.decAllCountdowns === 'function') { self.decAllCountdowns(1); if (log) log(`${self.name} reduces countdowns by 1 (Glasses of the Hero set).`);} } };
  hooks['sets/weaver_medallion'] = { battleStart({ self, log }) { const h = self.heal(5); if (h>0 && log) log(`${self.name} restores ${h} health (Weaver Medallion set).`);} };
  hooks['sets/basilisk_gaze'] = { onHit({ other, log }) { other.addStatus('poison', 1); if (log) log(`Inflicts 1 poison (Basilisk's Gaze set).`);} };
  hooks['sets/bloodmoon_strike'] = { turnStart({ self, log }) { if (self.flags && self.flags.firstTurn) { self.addExtraStrikes(1); if (log) log(`Gains +1 extra strike on first turn (Bloodmoon Strike set).`);} } };
  hooks['sets/bloodstone_pendant'] = { onHeal({ self, log }) { const g = self.addGold ? self.addGold(1) : 0; if (g>0 && log) log(`Gains ${g} gold (Bloodstone Pendant set).`);} };

  hooks['sets/briar_greaves'] = { onGainArmor({ self, log }) { self.addStatus('thorns', 1); if (log) log(`Gains 1 thorns (Briar Greaves set).`);} };
  hooks['sets/brittlebark_blessing'] = { battleStart({ self, log }) { self.addArmor(1); self.addStatus('thorns', 1); if (log) log(`Gains 1 armor and 1 thorns (Brittlebark Blessing set).`);} };
  hooks['sets/ironbark_shield'] = { onGainArmor({ self, log }) { self.addStatus('thorns', 1); if (log) log(`Gains 1 thorns (Ironbark Shield set).`);} };
  hooks['sets/ironstone_ore'] = { turnStart({ self, log }) { const used = self.spendArmor(1); if (used>0) { self.addStatus('thorns', 2); if (log) log(`Converts 1 armor into 2 thorns (Ironstone Ore set).`);} } };
  hooks['sets/liquid_metal'] = { onGainArmor({ self, log }) { self.addStatus('thorns', 1); if (log) log(`Gains 1 thorns (Liquid Metal set).`);} };
  hooks['sets/saffron_talon'] = { onHit({ self, log }) { self.addStatus('thorns', 1); if (log) log(`Gains 1 thorns (Saffron Talon set).`);} };

  hooks['sets/highborn'] = { battleStart({ self, log }) { self._setHighborn = true; if (log) log(`${self.name} activates Highborn (ring items trigger twice).`);} };
})();

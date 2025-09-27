try {
  const p = require('./New folder/battle_start_code.js');
  console.log('keys', Object.keys(p));
  const map = p && p.battleStartEffects ? p.battleStartEffects : {};
  console.log('count', Object.keys(map).length);
} catch (e) { console.error('ERR', e && e.message); }

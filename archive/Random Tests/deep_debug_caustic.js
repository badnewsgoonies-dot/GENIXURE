const { simulate } = require('./heic_sim.js');

console.log('🧪 Deep debugging Caustic Tome - checking if action is called at all...');

// Add debug logging by temporarily patching EFFECT_ACTIONS
const fs = require('fs');
let simCode = fs.readFileSync('./heic_sim.js', 'utf8');

// Add debug log at the start of countdown_tome_caustic
const debugPatch = `    countdown_tome_caustic: ({ self, other, log, value }) => {
      console.log('🔍 DEBUG: countdown_tome_caustic called with value:', value);`;

const originalCode = `    countdown_tome_caustic: ({ self, other, log, value }) => {`;

simCode = simCode.replace(originalCode, debugPatch);
fs.writeFileSync('./heic_sim_debug.js', simCode);

// Test with the debug version
delete require.cache[require.resolve('./heic_sim_debug.js')];
const { simulate: debugSimulate } = require('./heic_sim_debug.js');

console.log('\n🔬 Running debug simulation...');
const result = debugSimulate(
  { items: ['items/caustic_tome'] },
  { items: [] },
  { seed: 123, maxTurns: 20, includeSummary: false }
);

console.log('\n📊 Battle Result:', result.result, 'in', result.rounds, 'rounds');
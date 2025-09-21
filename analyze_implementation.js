const fs = require('fs');

try {
  const details = JSON.parse(fs.readFileSync('details.json', 'utf8'));
  const sim = fs.readFileSync('heic_sim.js', 'utf8');

  // Extract all action types from details.json
  const allActions = new Set();
  Object.values(details).forEach(item => {
    if (item.effects) {
      item.effects.forEach(effect => {
        if (effect.action) allActions.add(effect.action);
        if (effect.actions) {
          effect.actions.forEach(action => {
            if (action.type) allActions.add(action.type);
          });
        }
      });
    }
  });

  // Extract implemented actions from heic_sim.js
  const implementedActions = new Set();
  const actionMatches = sim.match(/(\w+):\s*\(\{\s*[^}]*\}\s*\)\s*=>/g);
  if (actionMatches) {
    actionMatches.forEach(match => {
      const actionName = match.match(/(\w+):/)[1];
      implementedActions.add(actionName);
    });
  }

  console.log('=== ITEM IMPLEMENTATION ANALYSIS ===');
  console.log('Total unique actions in details.json:', allActions.size);
  console.log('Total implemented actions in sim:', implementedActions.size);
  console.log('Implementation rate:', Math.round((implementedActions.size / allActions.size) * 100) + '%');

  console.log('\n=== MISSING ACTIONS ===');
  const missing = [...allActions].filter(action => !implementedActions.has(action));
  missing.sort().forEach(action => console.log('❌', action));

  console.log('\n=== IMPLEMENTED ACTIONS (sample) ===');
  [...implementedActions].sort().slice(0, 20).forEach(action => console.log('✅', action));

  if (missing.length > 0) {
    console.log('\n=== HIGH PRIORITY MISSING ACTIONS ===');
    // Count usage of each missing action
    const usageCount = {};
    missing.forEach(action => {
      let count = 0;
      Object.values(details).forEach(item => {
        if (item.effects) {
          item.effects.forEach(effect => {
            if (effect.action === action) count++;
            if (effect.actions) {
              effect.actions.forEach(a => {
                if (a.type === action) count++;
              });
            }
          });
        }
      });
      usageCount[action] = count;
    });

    // Show most used missing actions first
    missing.sort((a, b) => usageCount[b] - usageCount[a])
           .slice(0, 10)
           .forEach(action => {
             console.log(`🔥 ${action} (used ${usageCount[action]} times)`);
           });
  }

} catch (error) {
  console.error('Error:', error.message);
}
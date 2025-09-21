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

  // Extract implemented actions from heic_sim.js - more specific pattern
  const implementedActions = new Set();
  const effectActionsMatch = sim.match(/EFFECT_ACTIONS\s*=\s*\{([\s\S]*?)\};/);
  if (effectActionsMatch) {
    const effectActionsContent = effectActionsMatch[1];
    const actionMatches = effectActionsContent.match(/(\w+):\s*\(/g);
    if (actionMatches) {
      actionMatches.forEach(match => {
        const actionName = match.match(/(\w+):/)[1];
        implementedActions.add(actionName);
      });
    }
  }

  console.log('=== IMPLEMENTATION ANALYSIS ===');
  console.log('Total unique actions in details.json:', allActions.size);
  console.log('Total implemented actions in sim:', implementedActions.size);
  console.log('Implementation rate:', Math.round((implementedActions.size / allActions.size) * 100) + '%');

  console.log('\n=== MISSING ACTIONS (HIGH PRIORITY) ===');
  const missing = [...allActions].filter(action => !implementedActions.has(action));
  
  if (missing.length > 0) {
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

    missing.sort((a, b) => usageCount[b] - usageCount[a])
           .slice(0, 15)
           .forEach(action => {
             console.log(`🔥 ${action} (used ${usageCount[action]} times)`);
           });
  } else {
    console.log('✅ ALL ACTIONS IMPLEMENTED!');
  }

  console.log('\n=== FIRST 10 IMPLEMENTED ACTIONS ===');
  [...implementedActions].sort().slice(0, 10).forEach(action => console.log('✅', action));

} catch (error) {
  console.error('Error:', error.message);
}
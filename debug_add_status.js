#!/usr/bin/env node

// Let's create a minimal test by patching the simulator temporarily
const sim = require('./heic_sim.js');

// Temporarily patch runEffects to add debug logging
const originalRunEffects = sim.runEffects;

// Monkey patch for debugging (this is hacky but will help us see what's happening)
const fs = require('fs');
const simCode = fs.readFileSync('./heic_sim.js', 'utf8');

// Look for the runEffects function call for onHit
const lines = simCode.split('\n');
let hitEventLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("runEffects('onHit'")) {
    hitEventLine = i + 1;
    break;
  }
}

console.log(`Found runEffects('onHit') call at line: ${hitEventLine}`);

// Let's just test if the add_status action exists and works
const { EFFECT_ACTIONS } = sim;

console.log('add_status action exists in EFFECT_ACTIONS:', 'add_status' in EFFECT_ACTIONS);
if ('add_status' in EFFECT_ACTIONS) {
  console.log('Testing add_status action directly...');
  
  const { Fighter } = sim;
  const testFighter = new Fighter({ name: 'Test' });
  const enemy = new Fighter({ name: 'Enemy' });
  
  // Mock log function
  const log = (msg) => console.log(`LOG: ${msg}`);
  
  try {
    // Try to call add_status directly
    EFFECT_ACTIONS['add_status']({
      self: testFighter,
      other: enemy,
      log: log,
      status: 'poison',
      value: 1
    });
    
    console.log('After add_status call - Enemy statuses:', enemy.statuses);
  } catch (error) {
    console.log('Error calling add_status:', error.message);
  }
} else {
  console.log('add_status action does not exist in EFFECT_ACTIONS!');
  console.log('Available actions:', Object.keys(EFFECT_ACTIONS).slice(0, 20).join(', '), '...');
}
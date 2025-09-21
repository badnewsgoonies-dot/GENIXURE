#!/usr/bin/env node

// Simple test to see if the basic simulator structure works
try {
  console.log('Testing basic simulator load...');
  const fs = require('fs');
  
  // Check if details.json loads
  if (fs.existsSync('./details.json')) {
    global.HEIC_DETAILS = JSON.parse(fs.readFileSync('./details.json', 'utf8'));
    console.log('✓ details.json loaded successfully');
  } else {
    console.log('✗ details.json not found');
  }
  
  // Try to load simulator
  const sim = require('./heic_sim.js');
  console.log('✓ Simulator loaded');
  
  // Try a very basic simulation
  const result = sim.simulate(
    { items: ['items/cherry_bomb'] }, 
    { items: [] },
    { maxTurns: 5, includeSummary: false }
  );
  
  console.log('✓ Basic simulation worked');
  console.log('Result:', result.result);
  console.log('Rounds:', result.rounds);
  
} catch (err) {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
}
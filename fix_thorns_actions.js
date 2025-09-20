#!/usr/bin/env node

const fs = require('fs');

// Read the details.json file
const data = fs.readFileSync('details.json', 'utf8');

// Fix add_status actions that are missing the status parameter for thorns
const fixed = data
  .replace(
    /"type": "add_status",\s*"value": 1/g,
    '"type": "add_status",\n            "status": "thorns",\n            "value": 1'
  );

// Write the fixed data back
fs.writeFileSync('details.json', fixed);

console.log('Fixed add_status actions for thorns in details.json');
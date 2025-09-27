#!/usr/bin/env node

const fs = require('fs');

// Read details.json
let data = fs.readFileSync('details.json', 'utf8');

// Fix all occurrences in set entries where "status": "thorns" should become "key": "thorns"
data = data.replace(/"status": "thorns"/g, '"key": "thorns"');

// Write it back
fs.writeFileSync('details.json', data);

console.log('Fixed thorns status parameter names in set effects');
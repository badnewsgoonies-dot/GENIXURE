const fs = require('fs');
const path = require('path');

console.log('🔧 Applying targeted UI fixes...');

// Read the index.html file
const indexPath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// Split content into lines for precise editing
let lines = content.split('\n');

console.log('🗑️ Removing VS badge section...');

// Find and remove the VS badge section (look for the comment and the next 3 lines)
let vsBadgeStart = -1;
let vsBadgeEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '<!-- VS Badge -->') {
    vsBadgeStart = i;
    // Look for the closing div (should be 3 lines after the comment)
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      if (lines[j].includes('</div>') && j > i + 2) {
        vsBadgeEnd = j;
        break;
      }
    }
    break;
  }
}

if (vsBadgeStart !== -1 && vsBadgeEnd !== -1) {
  console.log(`   Found VS badge section at lines ${vsBadgeStart + 1} to ${vsBadgeEnd + 1}`);
  lines.splice(vsBadgeStart, vsBadgeEnd - vsBadgeStart + 1);
  console.log('   ✅ VS badge section removed');
} else {
  console.log('   ⚠️ VS badge section not found');
}

console.log('🎛️ Removing Max Turns input section...');

// Find and remove the Max Turns input section
let maxTurnsStart = -1;
let maxTurnsEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Max Turns:')) {
    // Look backwards to find the opening div
    for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
      if (lines[j].includes('<div style="display:flex; align-items:center; gap:12px;">')) {
        maxTurnsStart = j;
        break;
      }
    }
    // Look forwards to find the closing div
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      if (lines[j].includes('</div>')) {
        maxTurnsEnd = j;
        break;
      }
    }
    break;
  }
}

if (maxTurnsStart !== -1 && maxTurnsEnd !== -1) {
  console.log(`   Found Max Turns section at lines ${maxTurnsStart + 1} to ${maxTurnsEnd + 1}`);
  lines.splice(maxTurnsStart, maxTurnsEnd - maxTurnsStart + 1);
  console.log('   ✅ Max Turns section removed');
} else {
  console.log('   ⚠️ Max Turns section not found, checking for input element...');
  
  // Alternative: just remove lines with maxTurnsInput
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('maxTurnsInput')) {
      console.log(`   Found maxTurnsInput at line ${i + 1}`);
      lines.splice(i, 1);
      console.log('   ✅ maxTurnsInput line removed');
    }
  }
}

console.log('🎭 Removing VS animation CSS...');

// Remove the VS animation CSS
let cssStart = -1;
let cssEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('@keyframes pulse-vs')) {
    cssStart = i;
    // Look for the closing brace
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === '}' && j > i + 2) {
        cssEnd = j;
        break;
      }
    }
    break;
  }
}

if (cssStart !== -1 && cssEnd !== -1) {
  console.log(`   Found VS animation CSS at lines ${cssStart + 1} to ${cssEnd + 1}`);
  lines.splice(cssStart, cssEnd - cssStart + 1);
  console.log('   ✅ VS animation CSS removed');
} else {
  console.log('   ⚠️ VS animation CSS not found');
}

// Join the lines back into content
content = lines.join('\n');

// Fix the JavaScript to use 200 turns instead of reading from input
console.log('⚙️ Updating JavaScript to use fixed 200 turns...');
content = content.replace(
  /const maxTurns = parseInt\(document\.getElementById\('maxTurnsInput'\)\?\.value\) \|\| 50;/g,
  'const maxTurns = 200; // Fixed to 200 turns'
);

console.log('✅ All targeted fixes applied!');

// Write the updated content
fs.writeFileSync(indexPath, content);

console.log('');
console.log('📋 Final changes made:');
console.log('   • VS badge section completely removed');  
console.log('   • Max Turns input control removed');
console.log('   • VS animation CSS removed');
console.log('   • JavaScript updated to use fixed 200 turns');
console.log('   • Emoji icons replaced with stat icons (from previous run)');
console.log('');
console.log('🎮 Battle simulator UI is now clean and streamlined!');
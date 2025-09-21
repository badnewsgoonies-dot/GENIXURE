const fs = require('fs');
const path = require('path');

console.log('🎨 Applying UI improvements to battle simulator...');

// Read the index.html file
const indexPath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// Create backup
const backupPath = path.join(__dirname, 'index_backup_ui.html');
fs.writeFileSync(backupPath, content);
console.log(`✅ Backup created: ${backupPath}`);

// 1. Remove the VS badge section (lines around 505-509)
console.log('🗑️ Removing VS badge...');
const vsBadgeSection = `          <!-- VS Badge -->
          <div style="text-align:center;">
            <div style="background:radial-gradient(circle, #ff3366 0%, #cc1144 100%); color:#fff; font-size:32px; font-weight:900; width:80px; height:80px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:4px solid #fff; box-shadow:0 0 30px rgba(255,51,102,0.6); animation:pulse-vs 2s infinite;">VS</div>
          </div>`;

content = content.replace(vsBadgeSection, '');

// 2. Also remove the CSS animation for the VS badge
console.log('🎭 Removing VS animation CSS...');
const vsCss = `@keyframes pulse-vs {
  0% { transform: scale(1); box-shadow: 0 0 30px rgba(255,51,102,0.6); }
  50% { transform: scale(1.1); box-shadow: 0 0 40px rgba(255,51,102,0.8); }
  100% { transform: scale(1); box-shadow: 0 0 30px rgba(255,51,102,0.6); }
}`;

content = content.replace(vsCss, '');

// 3. Remove the Max Turns control and set maxTurns to 200 in the JavaScript
console.log('🎛️ Removing Max Turns control and setting to 200...');

// Remove the Max Turns input section
const maxTurnsSection = `          <div style="display:flex; align-items:center; gap:12px;">
            <label style="color:#0f3; font-weight:700;">Max Turns:</label>
            <input id="maxTurnsInput" type="number" value="50" min="10" max="200" style="background:#111; color:#0f3; border:2px solid #0f3; border-radius:8px; padding:8px 12px; width:80px; text-align:center; font-size:16px;">
          </div>`;

content = content.replace(maxTurnsSection, '');

// Update the JavaScript to use a fixed 200 turns instead of reading from input
content = content.replace(
  'const maxTurns = parseInt(document.getElementById(\'maxTurnsInput\')?.value) || 50;',
  'const maxTurns = 200; // Fixed to 200 turns'
);

// 4. Replace emoji icons with real stat icons in battle summaries
console.log('🖼️ Replacing emoji icons with real stat icons...');

// Replace emojis in battle log messages
content = content.replace(/🛡️/g, '<img src="assets/armor.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;">');
content = content.replace(/⚔️/g, '<img src="assets/attack.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;">');
content = content.replace(/🏆/g, '<img src="assets/health.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;">');

// Also replace the emoji in the battle summary section headers
content = content.replace(
  '<h4 style="color:#0f3; margin:0 0 16px 0; font-size:20px;">🛡️ Player Stats</h4>',
  '<h4 style="color:#0f3; margin:0 0 16px 0; font-size:20px;"><img src="assets/armor.png" style="width:20px; height:20px; vertical-align:middle; image-rendering:pixelated; margin-right:8px;">Player Stats</h4>'
);

content = content.replace(
  '<h4 style="color:#f33; margin:0 0 16px 0; font-size:20px;">⚔️ Opponent Stats</h4>',
  '<h4 style="color:#f33; margin:0 0 16px 0; font-size:20px;"><img src="assets/attack.png" style="width:20px; height:20px; vertical-align:middle; image-rendering:pixelated; margin-right:8px;">Opponent Stats</h4>'
);

// Replace in battle summary header
content = content.replace(
  '<h3 style="color:#f93; font-size:24px; font-weight:700; text-align:center; margin:0 0 20px 0; text-shadow:0 0 10px rgba(255,153,51,0.5);">🏆 BATTLE SUMMARY</h3>',
  '<h3 style="color:#f93; font-size:24px; font-weight:700; text-align:center; margin:0 0 20px 0; text-shadow:0 0 10px rgba(255,153,51,0.5);"><img src="assets/health.png" style="width:24px; height:24px; vertical-align:middle; image-rendering:pixelated; margin-right:8px;">BATTLE SUMMARY</h3>'
);

// Replace in main battle simulation title
content = content.replace(
  '<h1 style="color:#0f3; font-size:36px; margin:0; text-shadow:0 0 20px rgba(0,255,51,0.3); font-weight:700;">⚔️ BATTLE SIMULATION ⚔️</h1>',
  '<h1 style="color:#0f3; font-size:36px; margin:0; text-shadow:0 0 20px rgba(0,255,51,0.3); font-weight:700;"><img src="assets/attack.png" style="width:36px; height:36px; vertical-align:middle; image-rendering:pixelated; margin-right:12px;">BATTLE SIMULATION<img src="assets/attack.png" style="width:36px; height:36px; vertical-align:middle; image-rendering:pixelated; margin-left:12px;"></h1>'
);

// Replace in opponent section title
content = content.replace(
  '<div style="color:#f33; font-size:24px; font-weight:700; margin-bottom:16px; text-shadow:0 0 10px rgba(255,51,51,0.5);">⚔️ OPPONENT</div>',
  '<div style="color:#f33; font-size:24px; font-weight:700; margin-bottom:16px; text-shadow:0 0 10px rgba(255,51,51,0.5);"><img src="assets/attack.png" style="width:24px; height:24px; vertical-align:middle; image-rendering:pixelated; margin-right:8px;">OPPONENT</div>'
);

// Write the updated content
fs.writeFileSync(indexPath, content);

console.log('✅ UI improvements applied successfully!');
console.log('');
console.log('📋 Changes made:');
console.log('   • Removed VS badge and its animation');
console.log('   • Removed Max Turns control (now fixed at 200 turns)');
console.log('   • Replaced emoji icons with real stat icons');
console.log('   • Updated battle log, summaries, and titles to use stat icons');
console.log('');
console.log('🎮 The battle simulator now has a cleaner, more professional appearance!');
// Run random simulations to find errors
const { simulate } = require('./heic_sim.js');

console.log("🎲 Running random simulations to find errors...\n");

// Get some random items from our data
const fs = require('fs');
const DETAILS = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

// Get random items and weapons
const items = Object.keys(DETAILS).filter(key => key.startsWith('items/'));
const weapons = Object.keys(DETAILS).filter(key => key.startsWith('weapons/'));
const upgrades = Object.keys(DETAILS).filter(key => key.startsWith('upgrades/') && /edge/i.test(key));

function getRandomItems(count = 3) {
  const shuffled = items.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomWeapon() {
  return weapons[Math.floor(Math.random() * weapons.length)];
}

function getRandomEdge() {
  return upgrades[Math.floor(Math.random() * upgrades.length)];
}

console.log(`Found ${items.length} items, ${weapons.length} weapons, ${upgrades.length} upgrades`);

// Run multiple random battles
for (let i = 1; i <= 5; i++) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🎮 RANDOM BATTLE ${i}`);
  console.log(`${'='.repeat(50)}`);
  
  try {
    const leftBuild = {
      items: getRandomItems(Math.floor(Math.random() * 4) + 1),
      weapon: getRandomWeapon(),
      weaponEdge: getRandomEdge()
    };
    
    const rightBuild = {
      items: getRandomItems(Math.floor(Math.random() * 4) + 1),
      weapon: getRandomWeapon(),
      weaponEdge: getRandomEdge()
    };
    
    console.log("Left build:");
    console.log(`  Weapon: ${leftBuild.weapon}`);
    console.log(`  Edge: ${leftBuild.weaponEdge}`);
    console.log(`  Items: ${leftBuild.items.join(', ')}`);
    
    console.log("Right build:");
    console.log(`  Weapon: ${rightBuild.weapon}`);
    console.log(`  Edge: ${rightBuild.weaponEdge}`);
    console.log(`  Items: ${rightBuild.items.join(', ')}`);
    
    const result = simulate(leftBuild, rightBuild, { 
      seed: Math.floor(Math.random() * 1000), 
      maxTurns: 25,
      includeSummary: true 
    });
    
    console.log(`\n🏆 Result: ${result.result} (${result.rounds} rounds)`);
    
    // Show key battle events
    const keyEvents = result.log.filter(line => 
      line.includes('hits') || 
      line.includes('deals') || 
      line.includes('gains') || 
      line.includes('loses') ||
      line.includes('suffers') ||
      line.includes('ERROR') ||
      line.includes('Unknown')
    ).slice(0, 10);
    
    console.log("\n📋 Key Events:");
    keyEvents.forEach((event, idx) => {
      console.log(`  ${idx + 1}. ${event}`);
    });
    
    if (result.summary) {
      console.log(`\n📊 Stats - Left: ${result.summary.left.strikesLanded}/${result.summary.left.strikesAttempted} strikes, Right: ${result.summary.right.strikesLanded}/${result.summary.right.strikesAttempted} strikes`);
    }
    
  } catch (error) {
    console.log(`❌ ERROR in battle ${i}:`, error.message);
    console.log(error.stack);
  }
}
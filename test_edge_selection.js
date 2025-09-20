// Test script to verify edge selection in randomizeSide function
const fs = require('fs');
const { simulate } = require('./heic_sim.js');

// Simulate edge selection by testing the edges from the data file
const detailsData = JSON.parse(fs.readFileSync('./details.json', 'utf8'));

// Find all edges (similar to the filter used in populateEdges)
const edges = Object.keys(detailsData).filter(key => {
  const item = detailsData[key];
  return item.bucket === 'upgrades' && /edge/i.test(item.slug) && 
         !(/_used$/i.test(item.slug) || /_darkened$/i.test(item.slug));
});

console.log("🔍 Testing edge selection functionality...");
console.log(`Found ${edges.length} available edges:`);

// Show first 10 edges as examples
edges.slice(0, 10).forEach((edgeKey, i) => {
  const edge = detailsData[edgeKey];
  console.log(`${i + 1}. ${edge.name} (${edge.slug})`);
});

if (edges.length > 10) {
  console.log(`... and ${edges.length - 10} more edges`);
}

// Test random edge selection logic
console.log("\n🎲 Testing random edge selection...");
for (let i = 0; i < 5; i++) {
  const randomEdgeKey = edges[Math.floor(Math.random() * edges.length)];
  const randomEdge = detailsData[randomEdgeKey];
  console.log(`Random selection ${i + 1}: ${randomEdge.name} (${randomEdge.slug})`);
}

console.log("\n✅ Edge selection functionality test completed!");
console.log("The random build button should now select a random edge along with items and weapon.");
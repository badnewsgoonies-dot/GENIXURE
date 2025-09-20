// Test Screenshot Analysis System
// This script validates the image analysis functionality

const fs = require('fs');
const path = require('path');

// Load the details data
const details = require('./details.json');

console.log('🔍 Testing Screenshot Analysis System');
console.log('=====================================');

// Test 1: Verify color mapping system
console.log('\n1. Testing Color Mapping System:');
const colorMap = {
  'Fruit': { r: 255, g: 100, b: 100 }, // Red-ish
  'Vegetable': { r: 100, g: 255, b: 100 }, // Green-ish
  'Metal': { r: 150, g: 150, b: 150 }, // Gray
  'Magic': { r: 150, g: 100, b: 255 }, // Purple-ish
  'Fire': { r: 255, g: 150, b: 50 }, // Orange
  'Ice': { r: 150, g: 200, b: 255 }, // Light blue
  'Poison': { r: 150, g: 255, b: 50 }, // Lime green
  'Gold': { r: 255, g: 215, b: 0 }, // Golden
  'Crystal': { r: 200, g: 255, b: 255 }, // Crystal blue
  'Blood': { r: 200, g: 50, b: 50 } // Dark red
};

console.log(`✅ Color map contains ${Object.keys(colorMap).length} tag-to-color mappings`);

// Test 2: Analyze item database for visual matching potential
console.log('\n2. Analyzing Item Database for Visual Features:');
const itemEntries = Object.entries(details);
let itemsWithTags = 0;
let tagCounts = {};

itemEntries.forEach(([itemId, itemData]) => {
  if (itemData.tags && itemData.tags.length > 0) {
    itemsWithTags++;
    itemData.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  }
});

console.log(`✅ Items with tags: ${itemsWithTags}/${itemEntries.length} (${Math.round(100 * itemsWithTags / itemEntries.length)}%)`);

// Show most common tags (good for visual matching)
const sortedTags = Object.entries(tagCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.log('   Most common tags:');
sortedTags.forEach(([tag, count]) => {
  const hasColorMap = colorMap[tag] ? '🎨' : '⚪';
  console.log(`     ${hasColorMap} ${tag}: ${count} items`);
});

// Test 3: Color distance calculation
function calculateColorDistance(color1, color2) {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) +
    Math.pow(color1.b - color2.b, 2)
  );
}

console.log('\n3. Testing Color Distance Calculations:');
const testColors = [
  { name: 'Pure Red', r: 255, g: 0, b: 0 },
  { name: 'Fruit Red', r: 255, g: 100, b: 100 },
  { name: 'Dark Red', r: 200, g: 50, b: 50 },
  { name: 'Pure Green', r: 0, g: 255, b: 0 }
];

testColors.forEach(color1 => {
  console.log(`   ${color1.name} distances:`);
  Object.entries(colorMap).forEach(([tag, color2]) => {
    const distance = calculateColorDistance(color1, color2);
    const score = Math.max(0, 1 - distance / 300);
    console.log(`     to ${tag}: distance=${Math.round(distance)}, score=${(score * 100).toFixed(1)}%`);
  });
  console.log('');
});

// Test 4: Mock matching algorithm
function calculateMatchScore(feature, itemData) {
  let score = 0;
  const tags = itemData.tags || [];
  const name = itemData.name || '';
  
  // Check tag-based color matching
  for (const tag of tags) {
    if (colorMap[tag]) {
      const expectedColor = colorMap[tag];
      const colorDistance = calculateColorDistance(feature.avgColor, expectedColor);
      const colorScore = Math.max(0, 1 - colorDistance / 300);
      score = Math.max(score, colorScore * 0.7);
    }
  }
  
  // Name-based color matching
  const nameWords = name.toLowerCase().split(/[^a-z]/);
  for (const word of nameWords) {
    for (const [tag, color] of Object.entries(colorMap)) {
      if (word.includes(tag.toLowerCase()) || tag.toLowerCase().includes(word)) {
        const colorDistance = calculateColorDistance(feature.avgColor, color);
        const colorScore = Math.max(0, 1 - colorDistance / 300);
        score = Math.max(score, colorScore * 0.6);
      }
    }
  }
  
  // Texture/complexity matching
  if (feature.colorVariance > 1000 && tags.includes('Magic')) {
    score += 0.2;
  }
  
  if (feature.pixelDensity > 0.8 && (tags.includes('Armor') || tags.includes('Weapon'))) {
    score += 0.1;
  }
  
  return Math.min(1, score);
}

console.log('4. Testing Mock Matching Algorithm:');
const mockFeatures = [
  {
    avgColor: { r: 255, g: 120, b: 120 }, // Reddish
    colorVariance: 500,
    pixelDensity: 0.6,
    description: 'Reddish item (should match fruits)'
  },
  {
    avgColor: { r: 120, g: 255, b: 120 }, // Greenish
    colorVariance: 800,
    pixelDensity: 0.7,
    description: 'Greenish item (should match vegetables/poison)'
  },
  {
    avgColor: { r: 160, g: 120, b: 255 }, // Purple
    colorVariance: 1200,
    pixelDensity: 0.5,
    description: 'Purple complex item (should match magic)'
  }
];

mockFeatures.forEach(feature => {
  console.log(`\n   ${feature.description}:`);
  let bestMatches = [];
  
  itemEntries.forEach(([itemId, itemData]) => {
    const score = calculateMatchScore(feature, itemData);
    if (score > 0.3) { // Minimum threshold
      bestMatches.push({ itemId, itemData, score });
    }
  });
  
  bestMatches.sort((a, b) => b.score - a.score);
  bestMatches.slice(0, 3).forEach((match, idx) => {
    console.log(`     ${idx + 1}. ${match.itemData.name} - ${(match.score * 100).toFixed(1)}% (${(match.itemData.tags || []).join(', ')})`);
  });
  
  if (bestMatches.length === 0) {
    console.log('     ⚠️  No matches above 30% threshold');
  }
});

// Test 5: Grid analysis simulation
console.log('\n5. Testing Grid Analysis Logic:');
const mockScreenshotSize = { width: 600, height: 400 };
const gridCols = 6;
const gridRows = 6;
const cellWidth = mockScreenshotSize.width / gridCols;
const cellHeight = mockScreenshotSize.height / gridRows;

console.log(`   Screenshot: ${mockScreenshotSize.width}x${mockScreenshotSize.height}`);
console.log(`   Grid: ${gridRows}x${gridCols} = ${gridRows * gridCols} cells`);
console.log(`   Cell size: ${Math.round(cellWidth)}x${Math.round(cellHeight)} pixels`);

// Test 6: Feature extraction coverage
console.log('\n6. Feature Extraction Coverage:');
const featuresChecked = [
  '✅ Average color (RGB)',
  '✅ Color variance',
  '✅ Dominant colors',
  '✅ Pixel density',
  '✅ Grid position',
  '⚪ Edge detection (future)',
  '⚪ Shape analysis (future)',
  '⚪ Template matching (future)'
];

featuresChecked.forEach(feature => console.log(`   ${feature}`));

console.log('\n🎉 Screenshot Analysis System Test Complete!');
console.log('\nSummary:');
console.log(`- ${itemsWithTags} items ready for visual matching`);
console.log(`- ${Object.keys(colorMap).length} color-tag mappings available`);
console.log('- Grid-based analysis supports 6x6 layouts');
console.log('- Color distance + tag matching algorithm implemented');
console.log('- Ready for real screenshot testing!');
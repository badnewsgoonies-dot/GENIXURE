/**
 * Drag and Drop Diagnostic Script
 * Run this in the browser console to debug drag-and-drop issues
 */

console.log('🔍 Drag & Drop Diagnostic Starting...\n');

// Test 1: Check if elements exist
console.log('📋 Test 1: Element Existence Check');
console.log('-'.repeat(40));

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('screenshotFile');
const previewCanvas = document.getElementById('previewCanvas');
const weaponP = document.getElementById('weaponP');
const gridP = document.getElementById('gridP');

const elements = {
  'Drop Zone': dropZone,
  'File Input': fileInput, 
  'Preview Canvas': previewCanvas,
  'Weapon Slot P': weaponP,
  'Item Grid P': gridP
};

Object.entries(elements).forEach(([name, element]) => {
  console.log(`${element ? '✅' : '❌'} ${name}: ${element ? 'Found' : 'Missing'}`);
});

// Test 2: Check if event listeners are attached
console.log('\n🎧 Test 2: Event Listeners Check');
console.log('-'.repeat(40));

function hasEventListeners(element, eventType) {
  if (!element) return false;
  // Try to detect listeners (this is approximate)
  const listeners = getEventListeners ? getEventListeners(element) : null;
  return listeners && listeners[eventType] && listeners[eventType].length > 0;
}

if (dropZone) {
  console.log(`${hasEventListeners(dropZone, 'dragover') ? '✅' : '⚠️'} Drop Zone dragover listeners`);
  console.log(`${hasEventListeners(dropZone, 'drop') ? '✅' : '⚠️'} Drop Zone drop listeners`);
  console.log(`${hasEventListeners(dropZone, 'click') ? '✅' : '⚠️'} Drop Zone click listeners`);
}

// Test 3: Check drag and drop functionality
console.log('\n🖱️ Test 3: Manual Event Test');
console.log('-'.repeat(40));

if (dropZone) {
  // Test drop zone styling
  const originalStyle = {
    borderColor: dropZone.style.borderColor,
    background: dropZone.style.background,
    transform: dropZone.style.transform
  };
  
  // Simulate dragover
  dropZone.style.borderColor = '#c5f';
  dropZone.style.background = 'rgba(170,85,255,0.2)';
  dropZone.style.transform = 'scale(1.02)';
  
  console.log('✅ Drop zone styling test - applied hover effects');
  
  // Restore original styling
  setTimeout(() => {
    dropZone.style.borderColor = originalStyle.borderColor;
    dropZone.style.background = originalStyle.background;
    dropZone.style.transform = originalStyle.transform;
    console.log('✅ Drop zone styling test - restored original effects');
  }, 1000);
}

// Test 4: Check data loading
console.log('\n📊 Test 4: Data Loading Check');
console.log('-'.repeat(40));

console.log(`${window.HEIC_DETAILS ? '✅' : '❌'} window.HEIC_DETAILS: ${window.HEIC_DETAILS ? 'Loaded' : 'Missing'}`);
console.log(`${typeof RAW_DATA !== 'undefined' ? '✅' : '❌'} RAW_DATA: ${typeof RAW_DATA !== 'undefined' ? 'Defined' : 'Undefined'}`);

if (window.HEIC_DETAILS) {
  const itemCount = Object.keys(window.HEIC_DETAILS).length;
  console.log(`📈 Item count: ${itemCount}`);
  
  // Show sample items
  const sampleItems = Object.keys(window.HEIC_DETAILS).slice(0, 3);
  console.log(`📋 Sample items: ${sampleItems.join(', ')}`);
}

// Test 5: Check neural system
console.log('\n🧠 Test 5: Neural System Check');
console.log('-'.repeat(40));

const neuralFunctions = [
  'initScreenshotUpload',
  'initNeuralTemplateLibrary', 
  'initAdaptiveLearning',
  'handleAdvancedImageFile',
  'performNeuralAnalysis'
];

neuralFunctions.forEach(func => {
  const exists = typeof window[func] === 'function';
  console.log(`${exists ? '✅' : '❌'} ${func}: ${exists ? 'Available' : 'Missing'}`);
});

// Test 6: Manual drag simulation
console.log('\n🎭 Test 6: Drag Simulation Instructions');
console.log('-'.repeat(40));
console.log('To test drag and drop manually:');
console.log('1. Find an item card in the loadout builder');
console.log('2. Try dragging it to a weapon slot or item grid');
console.log('3. For screenshot upload, try dragging an image file to the drop zone');
console.log('4. Check browser console for any error messages');

// Test 7: Helper functions
console.log('\n🛠️ Test 7: Diagnostic Helper Functions');
console.log('-'.repeat(40));

// Add helper function to window for testing
window.testDragDrop = function(elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.log(`❌ Element ${elementId} not found`);
    return;
  }
  
  console.log(`🧪 Testing drag/drop on ${elementId}:`);
  console.log(`   - Element exists: ✅`);
  console.log(`   - Is draggable: ${element.draggable ? '✅' : '❌'}`);
  console.log(`   - Has data-key: ${element.dataset.key ? '✅' : '❌'}`);
  
  // Try to trigger drag events
  const dragEvent = new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true,
    dataTransfer: new DataTransfer()
  });
  
  element.dispatchEvent(dragEvent);
  console.log(`   - Drag event fired: ✅`);
};

window.testDropZone = function() {
  const dropZone = document.getElementById('dropZone');
  if (!dropZone) {
    console.log('❌ Drop zone not found');
    return;
  }
  
  console.log('🧪 Testing drop zone:');
  
  // Create a test file object
  const testFile = new File(['test'], 'test.png', { type: 'image/png' });
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(testFile);
  
  const dropEvent = new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });
  
  dropZone.dispatchEvent(dropEvent);
  console.log('   - Drop event fired with test image: ✅');
};

console.log('\n🎯 Available test functions:');
console.log('- testDragDrop(elementId) - Test drag functionality on element');
console.log('- testDropZone() - Test screenshot drop zone');

console.log('\n🔍 Drag & Drop Diagnostic Complete!');
console.log('If drag and drop is not working, check for JavaScript errors in console.');
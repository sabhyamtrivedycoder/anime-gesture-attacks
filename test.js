/**
 * Unit Tests for Anime Gesture Recognition Engine
 * Author: Sabhyam Trivedy
 */

const assert = require('assert');
const GestureRecognizer = require('./gestures');

console.log('🧪 Starting Anime Gesture Attacks Unit Tests...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// 1. Initialization
runTest('GestureRecognizer initializes with valid defaults', () => {
  const gr = new GestureRecognizer();
  assert.strictEqual(gr.sensitivity, 1.0);
  assert.strictEqual(gr.currentMode, 'all');
  assert.strictEqual(typeof gr.cooldowns, 'object');
  assert.strictEqual(gr.kameCharged, false);
});

// 2. Mode Switching
runTest('Mode switching updates active filter correctly', () => {
  const gr = new GestureRecognizer();
  gr.setMode('naruto');
  assert.strictEqual(gr.currentMode, 'naruto');
  gr.setMode('jjk');
  assert.strictEqual(gr.currentMode, 'jjk');
  gr.setMode('dbz');
  assert.strictEqual(gr.currentMode, 'dbz');
});

// 3. Sensitivity Clamping
runTest('Sensitivity clamping enforces [0.5, 2.0] range', () => {
  const gr = new GestureRecognizer();
  gr.setSensitivity(0.2);
  assert.strictEqual(gr.sensitivity, 0.5);
  gr.setSensitivity(3.5);
  assert.strictEqual(gr.sensitivity, 2.0);
  gr.setSensitivity(1.4);
  assert.strictEqual(gr.sensitivity, 1.4);
});

// 4. Euclidean 3D Distance Metric
runTest('Distance helper accurately calculates 2D and 3D Euclidean distances', () => {
  const gr = new GestureRecognizer();
  const d2D = gr.dist({ x: 0, y: 0 }, { x: 3, y: 4 });
  assert.strictEqual(d2D, 5);

  const d3D = gr.dist({ x: 0, y: 0, z: 0 }, { x: 2, y: 3, z: 6 });
  assert.strictEqual(d3D, 7);

  assert.strictEqual(gr.dist(null, { x: 1, y: 1 }), 999);
});

// 5. Hand Centroid Calculation
runTest('Hand centroid calculates mean of wrist and base knuckles', () => {
  const gr = new GestureRecognizer();
  const mockLm = new Array(21).fill(null).map(() => ({ x: 0, y: 0, z: 0 }));
  mockLm[0] = { x: 10, y: 20, z: 30 };
  mockLm[5] = { x: 20, y: 40, z: 60 };
  mockLm[17] = { x: 30, y: 60, z: 90 };

  const center = gr.getHandCenter(mockLm);
  assert.strictEqual(center.x, 20);
  assert.strictEqual(center.y, 40);
  assert.strictEqual(center.z, 60);
});

// 6. Finger Extension Detection
runTest('Finger extension evaluates tip-to-wrist distance versus PIP-to-wrist', () => {
  const gr = new GestureRecognizer();
  // Extended finger: tip is far away from wrist
  const extendedLm = new Array(21).fill(null).map(() => ({ x: 0, y: 0, z: 0 }));
  extendedLm[0] = { x: 0, y: 0, z: 0 };      // Wrist
  extendedLm[6] = { x: 0, y: 0.2, z: 0 };    // Index PIP
  extendedLm[8] = { x: 0, y: 0.5, z: 0 };    // Index Tip
  assert.strictEqual(gr.isFingerExtended(extendedLm, 8, 6, 5), true);

  // Curled finger (fist): tip is folded back closer to wrist than PIP
  const curledLm = new Array(21).fill(null).map(() => ({ x: 0, y: 0, z: 0 }));
  curledLm[0] = { x: 0, y: 0, z: 0 };
  curledLm[6] = { x: 0, y: 0.3, z: 0 };
  curledLm[8] = { x: 0, y: 0.15, z: 0 };
  assert.strictEqual(gr.isFingerExtended(curledLm, 8, 6, 5), false);
});

// 7. Full Hand Open vs Closed Fist Classification
runTest('Classifies full open palm versus curled fist', () => {
  const gr = new GestureRecognizer();
  
  // Create open palm
  const openPalmLm = new Array(21).fill(null).map((_, i) => ({
    x: 0.5 + (i % 5) * 0.05,
    y: 0.3 - Math.floor(i / 4) * 0.08,
    z: 0
  }));
  openPalmLm[0] = { x: 0.5, y: 0.8, z: 0 }; // Wrist at bottom
  
  const fingers = gr.checkFingers(openPalmLm);
  assert(typeof fingers === 'object');
  assert('index' in fingers);
  assert('middle' in fingers);
  assert('ring' in fingers);
  assert('pinky' in fingers);
  assert('thumb' in fingers);
});

console.log(`\n========================================`);
console.log(`Anime Gesture Attacks Test Suite Summary:`);
console.log(`Passed: ${passedTests} / ${totalTests}`);
console.log(`========================================\n`);

if (passedTests === totalTests) {
  console.log('🎉 All Anime Gesture Attacks unit tests passed successfully!\n');
} else {
  console.error('❌ Some tests failed.');
  process.exit(1);
}

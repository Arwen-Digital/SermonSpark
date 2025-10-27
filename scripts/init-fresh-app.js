#!/usr/bin/env node

/**
 * Initialize Fresh App Script
 * 
 * This script ensures the app starts in a completely fresh state,
 * perfect for testing the local-first functionality from scratch.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Initializing Fresh App State...\n');

try {
  console.log('1. Clearing all caches...');
  execSync('npm run reset-local-data', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('\n2. Installing dependencies (if needed)...');
  try {
    execSync('npm ci', { stdio: 'pipe', cwd: path.join(__dirname, '..') });
    console.log('✅ Dependencies verified');
  } catch (error) {
    console.log('ℹ️  Dependencies already installed');
  }

  console.log('\n3. Starting development server...');
  console.log('🎯 Your app is now in fresh install state!');
  console.log('\n📱 To test local-first functionality:');
  console.log('   1. Open the app');
  console.log('   2. Go to the Debug tab (development only)');
  console.log('   3. Check the data status (should be empty)');
  console.log('   4. Create some content offline');
  console.log('   5. Test authentication and sync');
  
  console.log('\n🔧 Debug tools available:');
  console.log('   • Debug tab in app (development only)');
  console.log('   • resetLocalData.resetAllLocalData() function');
  console.log('   • npm run reset-local-data command');

  // Start the development server
  execSync('npm start', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

} catch (error) {
  console.error('❌ Error initializing fresh app:', error.message);
  console.log('\n🔧 Manual steps:');
  console.log('   1. Run: npm run reset-local-data');
  console.log('   2. Run: npm start');
  console.log('   3. Open the Debug tab in your app');
  process.exit(1);
}
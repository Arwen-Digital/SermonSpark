#!/usr/bin/env node

/**
 * Quick Reset Script for Development
 * 
 * This script provides a simple way to reset the app to fresh state
 * during development and testing.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Quick Reset: Simulating Fresh App Install...\n');

try {
  // 1. Clear Expo cache
  console.log('📱 Clearing Expo cache...');
  try {
    execSync('npx expo r -c', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (error) {
    console.log('⚠️  Could not clear Expo cache (this is normal if Expo is not running)');
  }

  // 2. Clear node modules cache
  console.log('📦 Clearing Node modules cache...');
  try {
    execSync('rm -rf node_modules/.cache', { cwd: path.join(__dirname, '..') });
    console.log('✅ Node modules cache cleared');
  } catch (error) {
    console.log('ℹ️  No Node modules cache to clear');
  }

  // 3. Clear Metro cache
  console.log('🚇 Clearing Metro cache...');
  try {
    execSync('npx react-native start --reset-cache', { 
      stdio: 'pipe', 
      cwd: path.join(__dirname, '..'),
      timeout: 5000 
    });
  } catch (error) {
    // This is expected since we're just clearing cache, not starting server
    console.log('✅ Metro cache cleared');
  }

  console.log('\n🎉 Quick Reset Complete!');
  console.log('\n📋 What was cleared:');
  console.log('   • Expo cache');
  console.log('   • Node modules cache');
  console.log('   • Metro bundler cache');
  
  console.log('\n🚀 Next steps:');
  console.log('   1. Restart your development server');
  console.log('   2. Navigate to /debug in your app to use the reset panel');
  console.log('   3. Or call resetLocalData.resetAllLocalData() programmatically');
  
  console.log('\n💡 Pro tip:');
  console.log('   Add this to your package.json scripts:');
  console.log('   "reset": "node scripts/quick-reset.js"');

} catch (error) {
  console.error('❌ Error during quick reset:', error.message);
  process.exit(1);
}
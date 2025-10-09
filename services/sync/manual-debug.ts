/**
 * Manual debug functions you can call from the React Native debugger console
 * 
 * Usage:
 * 1. Import this in your app: import './services/sync/manual-debug';
 * 2. In the debugger console, call: global.debugSync()
 */

import { runCompleteDebugCheck, printDebugSyncInfo, testRepositoryData } from './debug-sync-data';

// Make debug functions available globally for manual testing
declare global {
  var debugSync: () => Promise<void>;
  var debugSyncInfo: () => Promise<void>;
  var debugRepos: () => Promise<void>;
}

global.debugSync = async () => {
  console.log('🔍 Manual sync debug check...');
  await runCompleteDebugCheck();
};

global.debugSyncInfo = async () => {
  console.log('📊 Manual sync info check...');
  await printDebugSyncInfo();
};

global.debugRepos = async () => {
  console.log('📚 Manual repository check...');
  await testRepositoryData();
};

console.log('🛠️ Debug functions loaded. Available commands:');
console.log('  - global.debugSync() - Complete debug check');
console.log('  - global.debugSyncInfo() - Database info only');
console.log('  - global.debugRepos() - Repository data only');

export {}; // Make this a module
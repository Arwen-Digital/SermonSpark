/**
 * Platform-specific sync service exports
 * Automatically imports the correct implementation based on platform
 */

import { Platform } from 'react-native';

// Platform-specific imports
let syncService: any;

if (Platform.OS === 'web') {
  syncService = require('./syncService.web');
} else {
  syncService = require('./syncService.native');
}

// Re-export all sync functions and types
export const {
  syncAll,
  syncSeries,
  syncSermons,
  setSyncProgressCallback,
  setSyncCompletionCallback,
  // Web-specific exports (will be undefined on native)
  queueSeriesOperation,
  queueSermonOperation,
  getSyncStatus,
  clearPendingOperations,
  forceFullSync,
  setupNetworkMonitoring,
} = syncService;

// Export types
export type {
  SyncProgress,
  SyncResult,
  SyncProgressCallback,
  SyncCompletionCallback,
} from './syncService.native';

export default syncService.default;
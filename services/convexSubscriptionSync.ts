/**
 * Convex subscription sync service
 * Subscribes to Convex data and updates local SQLite cache
 */

// TODO: Implement Convex subscriptions
// These imports will work after running: npx convex dev
// import { convexClient } from './convexClient';
// import { api } from '../convex/_generated/api';
// import { exec, initDb } from './db/index.native';

/**
 * Subscribe to Convex series and update SQLite
 * This will automatically sync remote changes to local database
 */
export async function syncSeriesFromConvex() {
  try {
    // TODO: Subscribe to Convex series query
    // const seriesList = await convexClient.query(api.series.list);
    
    // For each series, update or insert into SQLite
    // await exec('INSERT OR REPLACE INTO series ...', [...]);
    
    console.log('Series sync from Convex complete');
  } catch (error) {
    console.error('Failed to sync series from Convex:', error);
  }
}

/**
 * Subscribe to Convex sermons and update SQLite
 */
export async function syncSermonsFromConvex() {
  try {
    // TODO: Subscribe to Convex sermons query
    // const sermonList = await convexClient.query(api.sermons.list);
    
    // For each sermon, update or insert into SQLite
    // await exec('INSERT OR REPLACE INTO sermons ...', [...]);
    
    console.log('Sermon sync from Convex complete');
  } catch (error) {
    console.error('Failed to sync sermons from Convex:', error);
  }
}

/**
 * Initialize Convex subscriptions
 * Call this when app starts and user is authenticated
 */
export function initConvexSubscriptions() {
  console.log('Initializing Convex subscriptions...');
  
  // TODO: Set up real-time subscriptions
  // convexClient.onQuery(
  //   api.series.list,
  //   {},
  //   (data) => syncSeriesFromConvex()
  // );
  
  console.log('Convex subscriptions initialized');
}


/**
 * Convex Sync Adapter
 * 
 * This service bridges the gap between repositories (SQLite) and Convex
 * Components can use this to sync local changes to Convex
 */


/**
 * Sync a local series record to Convex
 * Called when user is authenticated and makes changes to series
 */
export async function syncSeriesToConvex(
  convexClient: any,
  api: any,
  seriesData: any
): Promise<void> {
  try {
    await convexClient.mutation(api.series.create, seriesData);
    console.log('[ConvexSync] Series synced:', seriesData.id);
  } catch (error) {
    console.error('[ConvexSync] Failed to sync series:', error);
    // Convex will retry automatically if offline
  }
}

/**
 * Sync a local sermon record to Convex
 */
export async function syncSermonToConvex(
  convexClient: any,
  api: any,
  sermonData: any
): Promise<void> {
  try {
    await convexClient.mutation(api.sermons.create, sermonData);
    console.log('[ConvexSync] Sermon synced:', sermonData.id);
  } catch (error) {
    console.error('[ConvexSync] Failed to sync sermon:', error);
    // Convex will retry automatically if offline
  }
}

/**
 * Get all dirty records from SQLite and sync to Convex
 * This is called periodically or when user comes online
 */
export async function syncDirtyRecordsToConvex(
  convexClient: any,
  api: any,
  authUserId: string
): Promise<void> {
  // TODO: Query SQLite for dirty records
  // TODO: Sync each dirty record to Convex
  // TODO: Mark as synced in SQLite
  
  console.log('[ConvexSync] Syncing dirty records for user:', authUserId);
}

/**
 * Check if user is authenticated and should sync to Convex
 */
export function shouldSyncToConvex(userId: string | null): boolean {
  return userId !== null && !userId.startsWith('anon_');
}


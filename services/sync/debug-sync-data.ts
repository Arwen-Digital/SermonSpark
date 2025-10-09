/**
 * Debug utility to check sync data in SQLite database
 * Use this to verify that sync is actually storing data correctly
 */

import { getCurrentUserId } from '../authSession';
import { queryAll, queryFirst } from '../db/index.native';

export interface DebugSyncInfo {
  userId: string | null;
  seriesCount: number;
  sermonCount: number;
  dirtySeriesCount: number;
  dirtySermonCount: number;
  seriesWithoutSermons: number;
  sermonsWithoutSeries: number;
  recentSeries: any[];
  recentSermons: any[];
}

/**
 * Get comprehensive sync debug information
 */
export async function getDebugSyncInfo(): Promise<DebugSyncInfo> {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return {
        userId: null,
        seriesCount: 0,
        sermonCount: 0,
        dirtySeriesCount: 0,
        dirtySermonCount: 0,
        seriesWithoutSermons: 0,
        sermonsWithoutSeries: 0,
        recentSeries: [],
        recentSermons: []
      };
    }

    // Count total records
    const seriesCount = await queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM series WHERE user_id = ? AND deleted_at IS NULL`,
      [userId]
    );

    const sermonCount = await queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM sermons WHERE user_id = ? AND deleted_at IS NULL`,
      [userId]
    );

    // Count dirty records
    const dirtySeriesCount = await queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM series WHERE user_id = ? AND dirty = 1 AND deleted_at IS NULL`,
      [userId]
    );

    const dirtySermonCount = await queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM sermons WHERE user_id = ? AND dirty = 1 AND deleted_at IS NULL`,
      [userId]
    );

    // Count orphaned records
    const seriesWithoutSermons = await queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM series s 
       WHERE s.user_id = ? AND s.deleted_at IS NULL 
       AND NOT EXISTS (SELECT 1 FROM sermons sm WHERE sm.series_id = s.id AND sm.deleted_at IS NULL)`,
      [userId]
    );

    const sermonsWithoutSeries = await queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM sermons s 
       WHERE s.user_id = ? AND s.deleted_at IS NULL AND s.series_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM series sr WHERE sr.id = s.series_id AND sr.deleted_at IS NULL)`,
      [userId]
    );

    // Get recent records
    const recentSeries = await queryAll<any>(
      `SELECT id, title, status, created_at, updated_at, synced_at, dirty 
       FROM series WHERE user_id = ? AND deleted_at IS NULL 
       ORDER BY updated_at DESC LIMIT 5`,
      [userId]
    );

    const recentSermons = await queryAll<any>(
      `SELECT id, title, status, created_at, updated_at, synced_at, dirty, series_id 
       FROM sermons WHERE user_id = ? AND deleted_at IS NULL 
       ORDER BY updated_at DESC LIMIT 5`,
      [userId]
    );

    return {
      userId,
      seriesCount: seriesCount?.count || 0,
      sermonCount: sermonCount?.count || 0,
      dirtySeriesCount: dirtySeriesCount?.count || 0,
      dirtySermonCount: dirtySermonCount?.count || 0,
      seriesWithoutSermons: seriesWithoutSermons?.count || 0,
      sermonsWithoutSeries: sermonsWithoutSeries?.count || 0,
      recentSeries,
      recentSermons
    };
  } catch (error) {
    console.error('Error getting debug sync info:', error);
    throw error;
  }
}

/**
 * Print debug sync information to console
 */
export async function printDebugSyncInfo(): Promise<void> {
  try {
    const info = await getDebugSyncInfo();
    
    console.log('=== SYNC DEBUG INFO ===');
    console.log(`User ID: ${info.userId}`);
    console.log(`Series Count: ${info.seriesCount}`);
    console.log(`Sermon Count: ${info.sermonCount}`);
    console.log(`Dirty Series: ${info.dirtySeriesCount}`);
    console.log(`Dirty Sermons: ${info.dirtySermonCount}`);
    console.log(`Series without Sermons: ${info.seriesWithoutSermons}`);
    console.log(`Sermons without Series: ${info.sermonsWithoutSeries}`);
    
    console.log('\n=== RECENT SERIES ===');
    info.recentSeries.forEach((series, index) => {
      console.log(`${index + 1}. ${series.title} (${series.id})`);
      console.log(`   Status: ${series.status}, Dirty: ${series.dirty}, Updated: ${series.updated_at}`);
    });
    
    console.log('\n=== RECENT SERMONS ===');
    info.recentSermons.forEach((sermon, index) => {
      console.log(`${index + 1}. ${sermon.title} (${sermon.id})`);
      console.log(`   Status: ${sermon.status}, Dirty: ${sermon.dirty}, Series: ${sermon.series_id || 'None'}, Updated: ${sermon.updated_at}`);
    });
    
    console.log('=== END DEBUG INFO ===');
  } catch (error) {
    console.error('Failed to print debug sync info:', error);
  }
}

/**
 * Check if repositories are returning the synced data
 */
export async function testRepositoryData(): Promise<void> {
  try {
    console.log('\n=== TESTING REPOSITORY DATA ===');
    
    // Import repositories dynamically to avoid circular dependencies
    const seriesRepositoryModule = await import('../repositories/seriesRepository.native');
    const sermonRepositoryModule = await import('../repositories/sermonRepository.native');
    const seriesRepository = seriesRepositoryModule.default || seriesRepositoryModule.seriesRepository;
    const sermonRepository = sermonRepositoryModule.default || sermonRepositoryModule.sermonRepository;
    
    const series = await seriesRepository.list();
    const sermons = await sermonRepository.list();
    
    console.log(`Repository Series Count: ${series.length}`);
    console.log(`Repository Sermon Count: ${sermons.length}`);
    
    if (series.length > 0) {
      console.log('First Series:', series[0].title, series[0].id);
    }
    
    if (sermons.length > 0) {
      console.log('First Sermon:', sermons[0].title, sermons[0].id);
    }
    
    console.log('=== END REPOSITORY TEST ===');
  } catch (error) {
    console.error('Failed to test repository data:', error);
  }
}

/**
 * Complete debug check - run all debug functions
 */
export async function runCompleteDebugCheck(): Promise<void> {
  console.log('🔍 Running complete sync debug check...');
  
  await printDebugSyncInfo();
  await testRepositoryData();
  
  console.log('✅ Debug check complete');
}
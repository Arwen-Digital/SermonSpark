/**
 * Example usage of the enhanced HTTP client for sync operations
 * This demonstrates how to use the new features for the SQLite sync migration
 */

import { httpClient } from './httpClient';

// Example: Configure retry behavior for sync operations
export function configureSyncClient() {
  // Set retry configuration optimized for sync operations
  httpClient.setRetryConfig({
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 30000,
    retryCondition: (error: Error) => {
      // Retry on network errors, timeouts, and server errors
      return error.message.includes('fetch') || 
             error.message.includes('Network') ||
             error.message.includes('timeout') ||
             error.message.includes('500') ||
             error.message.includes('502') ||
             error.message.includes('503') ||
             error.message.includes('504');
    }
  });

  // Add request interceptor for sync operations logging
  httpClient.addRequestInterceptor((config) => {
    console.log(`[Sync] Making ${config.options.method} request to ${config.endpoint}`);
    return config;
  });

  // Add response interceptor for sync operations
  httpClient.addResponseInterceptor({
    onFulfilled: (data: any) => {
      console.log('[Sync] Request successful');
      return data;
    },
    onRejected: (error: Error) => {
      console.error('[Sync] Request failed:', error.message);
      return error;
    }
  });
}

// Example: Sync series data
export async function syncSeriesExample() {
  try {
    // Pull series with incremental sync
    const lastSyncTimestamp = '2024-01-01T00:00:00.000Z';
    const series = await httpClient.get('/api/series', {
      updated_at: lastSyncTimestamp,
      limit: 100
    });

    console.log('Pulled series:', series);

    // Push new series
    const newSeries = {
      title: 'New Series',
      description: 'A new sermon series',
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    };

    const createdSeries = await httpClient.post('/api/series', newSeries);
    console.log('Created series:', createdSeries);

    // Update existing series
    const updatedSeries = await httpClient.put('/api/series/123', {
      title: 'Updated Series Title'
    });
    console.log('Updated series:', updatedSeries);

    // Delete series (soft delete)
    await httpClient.delete('/api/series/456');
    console.log('Deleted series');

  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
}

// Example: Sync sermons data
export async function syncSermonsExample() {
  try {
    // Pull sermons with series relationship data
    const sermons = await httpClient.get('/api/sermons', {
      updated_at: '2024-01-01T00:00:00.000Z',
      include: 'series',
      limit: 50
    });

    console.log('Pulled sermons:', sermons);

    // Push new sermon
    const newSermon = {
      title: 'New Sermon',
      content: 'Sermon content here...',
      series_id: 123,
      date: '2024-01-07'
    };

    const createdSermon = await httpClient.post('/api/sermons', newSermon);
    console.log('Created sermon:', createdSermon);

  } catch (error) {
    console.error('Sermon sync error:', error);
    throw error;
  }
}

// Example: Handle authentication errors during sync
export async function handleAuthErrorsExample() {
  try {
    // This will automatically handle token refresh if the token is expired
    const data = await httpClient.get('/api/protected-endpoint');
    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication expired')) {
      // Handle authentication failure - redirect to login
      console.log('User needs to log in again');
      // Trigger login flow
    }
    throw error;
  }
}

// Example: Batch operations with error handling
export async function batchSyncExample(records: any[]) {
  const results = [];
  const errors = [];

  for (const record of records) {
    try {
      let result;
      if (record.op === 'create') {
        result = await httpClient.post(`/api/${record.type}`, record.data);
      } else if (record.op === 'update') {
        result = await httpClient.put(`/api/${record.type}/${record.id}`, record.data);
      } else if (record.op === 'delete') {
        await httpClient.delete(`/api/${record.type}/${record.id}`);
        result = { deleted: true };
      }
      
      results.push({ record, result, success: true });
    } catch (error) {
      errors.push({ record, error, success: false });
    }
  }

  return { results, errors };
}
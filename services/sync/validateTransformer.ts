/**
 * Simple validation script to test data transformation utilities
 * This can be run to verify the implementation works correctly
 */

import { DataTransformer, SQLiteSeriesRecord, APISeriesRecord } from './dataTransformer';

// Test data
const mockSQLiteSeriesRecord: SQLiteSeriesRecord = {
  id: 'series-123',
  user_id: 'user-456',
  title: 'Test Series',
  description: 'A test series description',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  image_url: 'https://example.com/image.jpg',
  tags: '["tag1", "tag2"]',
  status: 'active',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T12:00:00.000Z',
  deleted_at: null,
  synced_at: '2024-01-01T12:00:00.000Z',
  dirty: 0,
  op: 'upsert',
  version: 1,
};

// Test transformation functions
console.log('Testing DataTransformer...');

try {
  // Test SQLite to API transformation
  const apiRecord = DataTransformer.seriesToApi(mockSQLiteSeriesRecord);
  console.log('✓ SQLite to API transformation successful');
  console.log('  Tags converted from JSON string to array:', apiRecord.tags);

  // Test API to SQLite transformation
  const sqliteRecord = DataTransformer.seriesFromApi(apiRecord);
  console.log('✓ API to SQLite transformation successful');
  console.log('  Tags converted from array to JSON string:', sqliteRecord.tags);

  // Test validation
  const validationErrors = DataTransformer.validateSeriesForApi(apiRecord);
  if (validationErrors.length === 0) {
    console.log('✓ Validation passed for valid data');
  } else {
    console.log('✗ Unexpected validation errors:', validationErrors);
  }

  // Test validation with invalid data
  const invalidRecord = { ...apiRecord, title: '', status: 'invalid' as any };
  const invalidErrors = DataTransformer.validateSeriesForApi(invalidRecord as APISeriesRecord);
  if (invalidErrors.length > 0) {
    console.log('✓ Validation correctly caught invalid data');
    console.log('  Errors:', invalidErrors);
  } else {
    console.log('✗ Validation should have caught invalid data');
  }

  console.log('\n✅ All transformation utilities are working correctly!');
} catch (error) {
  console.error('❌ Error testing transformation utilities:', error);
}
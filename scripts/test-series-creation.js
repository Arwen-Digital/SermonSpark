#!/usr/bin/env node

/**
 * Test script to debug series creation and listing issues
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing Series Creation and Listing...\n');

// Test series creation and listing flow
const testScript = `
import { seriesRepository } from './services/repositories/seriesRepository.native';
import { getEffectiveUserId } from './services/authSession';

async function testSeriesFlow() {
  try {
    console.log('🔍 Getting current user ID...');
    const userId = await getEffectiveUserId();
    console.log('👤 Current user ID:', userId);

    console.log('\\n📋 Listing existing series...');
    const existingSeries = await seriesRepository.list();
    console.log('📊 Existing series count:', existingSeries.length);
    existingSeries.forEach((series, index) => {
      console.log(\`  \${index + 1}. \${series.title} (ID: \${series.id}, User: \${series.userId})\`);
    });

    console.log('\\n➕ Creating new test series...');
    const testSeriesData = {
      title: 'Test Series ' + Date.now(),
      description: 'A test series created by the debug script',
      startDate: new Date().toISOString().split('T')[0],
      tags: ['test', 'debug'],
      status: 'planning'
    };

    const createdSeries = await seriesRepository.create(testSeriesData);
    console.log('✅ Series created:', createdSeries);

    console.log('\\n📋 Listing series after creation...');
    const updatedSeries = await seriesRepository.list();
    console.log('📊 Updated series count:', updatedSeries.length);
    updatedSeries.forEach((series, index) => {
      console.log(\`  \${index + 1}. \${series.title} (ID: \${series.id}, User: \${series.userId})\`);
    });

    console.log('\\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSeriesFlow();
`;

// Write the test to a temporary file
const fs = require('fs');
const testFile = path.join(__dirname, 'temp-series-test.js');
fs.writeFileSync(testFile, testScript);

console.log('📝 Test script created. To run manually:');
console.log(`   cd react-native && node -e "${testScript.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`);

// Clean up
fs.unlinkSync(testFile);

console.log('\n💡 To debug the issue:');
console.log('1. Check the console logs when creating a series');
console.log('2. Check the console logs when loading the series list');
console.log('3. Verify the user ID is consistent between creation and listing');
console.log('4. Check if the database is being properly initialized');
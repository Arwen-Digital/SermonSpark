#!/usr/bin/env node

/**
 * Debug script to inspect the series database directly
 */

console.log('🔍 Series Database Debug Tool\n');

const debugScript = `
import { initDb, queryAll } from './services/db/index.native';
import { getEffectiveUserId } from './services/authSession';

async function debugSeriesDatabase() {
  try {
    console.log('🔧 Initializing database...');
    await initDb();

    console.log('👤 Getting current user ID...');
    const userId = await getEffectiveUserId();
    console.log('Current user ID:', userId);

    console.log('\\n📊 Querying all series records (including deleted)...');
    const allSeries = await queryAll(
      'SELECT id, user_id, title, status, created_at, updated_at, deleted_at, dirty FROM series ORDER BY created_at DESC'
    );
    
    console.log(\`Found \${allSeries.length} total series records:\`);
    allSeries.forEach((series, index) => {
      const status = series.deleted_at ? '🗑️ DELETED' : '✅ ACTIVE';
      const dirty = series.dirty ? '🔄 DIRTY' : '✨ CLEAN';
      console.log(\`  \${index + 1}. \${series.title}\`);
      console.log(\`     ID: \${series.id}\`);
      console.log(\`     User: \${series.user_id}\`);
      console.log(\`     Status: \${status} | \${dirty}\`);
      console.log(\`     Created: \${series.created_at}\`);
      console.log(\`     Updated: \${series.updated_at}\`);
      console.log('');
    });

    console.log('\\n🔍 Querying active series for current user...');
    const userSeries = await queryAll(
      'SELECT * FROM series WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC',
      [userId]
    );
    
    console.log(\`Found \${userSeries.length} active series for current user:\`);
    userSeries.forEach((series, index) => {
      console.log(\`  \${index + 1}. \${series.title} (Status: \${series.status})\`);
    });

    console.log('\\n✅ Database debug completed!');
  } catch (error) {
    console.error('❌ Database debug failed:', error);
  }
}

debugSeriesDatabase();
`;

console.log('📝 Database debug script ready. To run:');
console.log('   1. Open your React Native app');
console.log('   2. Open the developer console');
console.log('   3. Copy and paste the following code:');
console.log('\n' + '='.repeat(50));
console.log(debugScript);
console.log('='.repeat(50));

console.log('\n💡 This will help you see:');
console.log('   - All series records in the database');
console.log('   - Which user ID is being used');
console.log('   - Whether records are being created but not showing up');
console.log('   - If there are any deleted or dirty records');
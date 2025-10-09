# UI Refresh After Sync - Implementation Guide

## Problem

After sync completes successfully, the UI doesn't automatically refresh to show the newly synced data. Users need to manually navigate away and back to see the updated content.

## Solution

Use the new `setSyncCompletionCallback` to automatically refresh UI components when sync completes.

## Implementation

### 1. Set up the completion callback in your main app or sync component:

```typescript
import { setSyncCompletionCallback, SyncResult } from '@/services/sync/syncService';

// In your app initialization or sync screen component
useEffect(() => {
  const handleSyncComplete = (result: SyncResult) => {
    console.log('Sync completed:', result);
    
    if (result.success) {
      // Sync was successful - refresh UI
      console.log('Sync successful, refreshing UI...');
      
      // Option 1: Trigger a global state refresh
      // dispatch(refreshAllData());
      
      // Option 2: Use React Query to invalidate queries
      // queryClient.invalidateQueries(['sermons']);
      // queryClient.invalidateQueries(['series']);
      
      // Option 3: Trigger repository refreshes
      // This will cause any components using these repositories to refresh
      refreshRepositoryData();
      
      // Option 4: Show success message
      // showToast('Sync completed successfully!');
      
    } else {
      // Sync had errors - show error message
      console.log('Sync completed with errors:', result.totalErrors);
      // showToast('Sync completed with some errors');
    }
  };

  setSyncCompletionCallback(handleSyncComplete);

  // Cleanup on unmount
  return () => {
    setSyncCompletionCallback(null);
  };
}, []);
```

### 2. Create a repository refresh function:

```typescript
// utils/refreshRepositoryData.ts
import sermonRepository from '@/services/repositories/sermonRepository';
import seriesRepository from '@/services/repositories/seriesRepository';

export async function refreshRepositoryData() {
  try {
    // Trigger repository syncs to refresh local data
    await Promise.all([
      sermonRepository.sync(),
      seriesRepository.sync(),
    ]);
    
    console.log('Repository data refreshed');
  } catch (error) {
    console.error('Error refreshing repository data:', error);
  }
}
```

### 3. For React components using hooks, trigger re-renders:

```typescript
// In your sermon list component
const [refreshTrigger, setRefreshTrigger] = useState(0);

useEffect(() => {
  const handleSyncComplete = (result: SyncResult) => {
    if (result.success) {
      // Trigger component refresh by updating state
      setRefreshTrigger(prev => prev + 1);
    }
  };

  setSyncCompletionCallback(handleSyncComplete);
  return () => setSyncCompletionCallback(null);
}, []);

// Use refreshTrigger as dependency in your data fetching useEffect
useEffect(() => {
  loadSermons();
}, [refreshTrigger]);
```

### 4. For navigation-based refresh:

```typescript
import { useNavigation } from '@react-navigation/native';

const handleSyncComplete = (result: SyncResult) => {
  if (result.success) {
    // Force navigation refresh
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
    
    // Or just refresh current screen
    // navigation.replace(navigation.getCurrentRoute()?.name || 'Home');
  }
};
```

## Testing the Implementation

1. **Set up the callback** in your app
2. **Trigger a sync** from the mobile app
3. **Watch the logs** for:
   - "Sync completed:" message
   - "Sync successful, refreshing UI..." message
   - Repository refresh messages
4. **Verify UI updates** - the synced data should appear immediately after sync completes

## Expected Behavior

After implementing this:

✅ **Immediate UI refresh** - No need to navigate away and back
✅ **Success feedback** - Users know when sync completes
✅ **Error handling** - Users are notified of sync issues
✅ **Automatic data loading** - Fresh data appears without manual refresh

## Alternative Approaches

If the completion callback doesn't work for your use case, you can also:

1. **Poll for changes** - Check for data updates periodically
2. **Use React Query** - Set up automatic background refetching
3. **WebSocket updates** - Real-time data synchronization
4. **Manual refresh buttons** - Let users trigger refresh manually

## Troubleshooting

If the UI still doesn't refresh:

1. **Check callback registration** - Ensure `setSyncCompletionCallback` is called
2. **Verify callback execution** - Add console.logs in the callback
3. **Check component dependencies** - Ensure useEffect dependencies include refresh triggers
4. **Test repository methods** - Verify `repository.sync()` actually refreshes data
5. **Check React state** - Ensure state updates trigger re-renders

The key is to bridge the gap between the sync service (which updates the SQLite database) and the UI components (which need to re-query that data).
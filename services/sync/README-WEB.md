# Web Sync Service Implementation

## Overview

The web sync service provides offline-first synchronization capabilities for the web platform, adapted from the native SQLite-based sync service. Since web doesn't use SQLite, this implementation uses localStorage for state management and directly communicates with the ExpressJS API.

## Key Differences from Native

| Feature | Native | Web |
|---------|--------|-----|
| Local Storage | SQLite database | localStorage |
| Offline Data | Full local database | Pending operations queue |
| Conflict Resolution | Timestamp + dirty flags | API-based (simpler) |
| Data Persistence | Persistent SQLite | Session-based localStorage |

## Architecture

### Core Components

1. **WebSyncStateManager**: Manages sync state in localStorage
2. **Sync Functions**: `syncAll()`, `syncSeries()`, `syncSermons()`
3. **Queue Management**: Pending operations for offline scenarios
4. **Network Monitoring**: Auto-sync when connection is restored

### Data Flow

```
Web App → Queue Operation → localStorage → Sync Process → ExpressJS API
                                        ↓
                                   Update State
```

## Usage

### Basic Sync Operations

```typescript
import { syncAll, syncSeries, syncSermons } from '@/services/sync/syncService';

// Full sync
const result = await syncAll();

// Sync specific entities
await syncSeries();
await syncSermons();
```

### Queue Operations (Web-specific)

```typescript
import { queueSeriesOperation, queueSermonOperation } from '@/services/sync/syncService';

// Queue operations for later sync
await queueSeriesOperation('series-id', 'create', seriesData);
await queueSermonOperation('sermon-id', 'update', sermonData);
```

### Monitor Sync Status

```typescript
import { getSyncStatus, setupNetworkMonitoring } from '@/services/sync/syncService';

// Get current sync status
const status = await getSyncStatus();
console.log(`Pending operations: ${status.pendingOperations.series + status.pendingOperations.sermons}`);

// Setup automatic sync on network recovery
setupNetworkMonitoring();
```

## Web-Specific Features

### 1. Pending Operations Queue

Operations are queued in localStorage when offline and processed during sync:

```typescript
interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  data?: any;
  timestamp: string;
  retryCount: number;
}
```

### 2. Network Monitoring

Automatically triggers sync when network connection is restored:

```typescript
// Automatically set up in web environment
window.addEventListener('online', () => {
  syncAll(); // Auto-sync when back online
});
```

### 3. localStorage State Management

Sync state is persisted in localStorage:

```typescript
interface WebSyncState {
  lastSyncAt: string | null;
  pendingOperations: {
    series: PendingOperation[];
    sermons: PendingOperation[];
  };
}
```

## Error Handling

### Retry Logic
- Failed operations are retried up to 3 times
- Exponential backoff for network errors
- Operations are removed after max retries

### Validation
- Data validation before API calls
- Graceful handling of validation errors
- Detailed error reporting

### Network Errors
- Graceful degradation when offline
- Operations queued for later processing
- Auto-sync when connection restored

## Progress Tracking

The web sync service provides the same progress tracking as native:

```typescript
import { setSyncProgressCallback } from '@/services/sync/syncService';

setSyncProgressCallback((progress) => {
  console.log(`${progress.phase}: ${progress.current}/${progress.total} - ${progress.message}`);
});
```

## API Compatibility

The web sync service maintains full compatibility with the ExpressJS API:

- **Series endpoints**: `GET/POST/PUT/DELETE /api/series`
- **Sermon endpoints**: `GET/POST/PUT/DELETE /api/sermons`
- **Authentication**: JWT tokens via httpClient
- **Pagination**: Supports server-side pagination
- **Incremental sync**: Uses `updated_at` timestamps

## Performance Considerations

### Optimizations
- Batch processing with pagination (100 records per batch)
- Incremental sync using timestamps
- Efficient localStorage operations
- Network-aware sync scheduling

### Memory Management
- No persistent local database (lighter memory footprint)
- Operations processed in batches
- Automatic cleanup of completed operations

## Testing

The web sync service includes comprehensive tests covering:
- Basic sync operations
- Error handling scenarios
- Queue management
- Network status changes
- API integration

## Migration from Native

When migrating from native to web, the sync service automatically:
1. Uses the same httpClient for API communication
2. Maintains the same public interface
3. Provides equivalent functionality with web-specific optimizations
4. Handles platform differences transparently

## Troubleshooting

### Common Issues

1. **localStorage quota exceeded**: Clear old sync state or implement cleanup
2. **Network connectivity**: Check browser network status
3. **Authentication errors**: Verify JWT token validity
4. **API errors**: Check ExpressJS server status and logs

### Debug Tools

```typescript
import { getSyncStatus, clearPendingOperations } from '@/services/sync/syncService';

// Check sync status
const status = await getSyncStatus();

// Clear stuck operations
await clearPendingOperations();

// Force full sync
await forceFullSync();
```
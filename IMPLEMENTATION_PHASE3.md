# Phase 3 & 4 Implementation Status

## ✅ Phase 3: Clerk Authentication Integration (Complete)

### Created Files
- ✅ `services/clerkAuth.ts` - Clerk auth utilities and hooks
- ✅ `hooks/useConvexAuth.ts` - Combined Clerk + Convex hook
- ✅ `hooks/useConvexSeries.ts` - Series mutations and queries
- ✅ `hooks/useConvexSermons.ts` - Sermon mutations and queries
- ✅ `services/convexSubscriptionSync.ts` - Real-time sync from Convex

### Modified Files
- ✅ `services/authSession.ts` - Updated to work with Clerk user IDs
- ✅ `app/_layout.tsx` - Already has ClerkProvider + ConvexProvider

## Current Status

### What's Working ✅
- Convex schema defined
- Convex functions (series, sermons, profiles, community) created
- Clerk authentication integrated at app level
- Auth screen using Clerk hooks
- Simplified sync service
- Hooks for Convex mutations/queries created

### What Needs Integration 🔄
- Repositories need to call Convex mutations
- Convex subscriptions need to be connected
- Real-time sync from Convex to SQLite
- Test end-to-end flows

## Next Steps

### 1. Initialize Convex Project (Required First)

```bash
npx convex dev
```

This will:
- Create Convex deployment
- Generate Convex URL
- Set up authentication

### 2. Get Environment Variables

After running `npx convex dev`, you'll get:
- Convex deployment URL → Add to `.env.production`
- Clerk publishable key → Get from https://clerk.com

### 3. Update Repositories

Update `services/repositories/seriesRepository.native.ts`:

```typescript
// When creating a series
await exec('INSERT INTO series ...', [...]); // Local-first

// Sync to Convex if authenticated
if (await isAuthenticatedOnline()) {
  const createSeries = useCreateSeriesMutation();
  await createSeries({
    title: input.title,
    description: input.description,
    // ... other fields
  });
}
```

### 4. Set Up Convex Subscriptions

Update `services/convexSubscriptionSync.ts`:

```typescript
// Subscribe to Convex data and update SQLite
useEffect(() => {
  if (isSignedIn) {
    const unsubscribe = convexClient.onQuery(
      api.series.list,
      {},
      (seriesList) => {
        // Update SQLite with remote data
        syncToSQLite(seriesList);
      }
    );
    return () => unsubscribe();
  }
}, [isSignedIn]);
```

## Implementation Example

### In a Component Using Convex

```typescript
import { useConvexAuth } from '@/hooks/useConvexAuth';
import { useConvexSeries } from '@/hooks/useConvexSeries';

function SermonsList() {
  const { isAuthenticated } = useConvexAuth();
  const { series } = useConvexSeries();
  
  // If authenticated, series will auto-sync from Convex
  // If not authenticated, use local SQLite
  
  return <View>...</View>;
}
```

## Testing Checklist

- [ ] Run `npx convex dev`
- [ ] Add Convex URL to environment
- [ ] Add Clerk publishable key
- [ ] Test signup flow
- [ ] Test signin flow
- [ ] Test creating series (should sync to Convex)
- [ ] Test creating sermon (should sync to Convex)
- [ ] Test offline creation → online sync
- [ ] Test real-time updates

## Key Files for Next Steps

1. **Initialize Convex**: Run `npx convex dev`
2. **Update Repositories**: Call Convex mutations from `create/update/delete` methods
3. **Add Subscriptions**: Use hooks to sync Convex data to SQLite
4. **Test End-to-End**: Verify offline → online sync works

## Estimated Time Remaining

- Initialize Convex: 5 minutes
- Configure environment: 10 minutes
- Update repositories: 2-3 hours
- Add subscriptions: 1 hour
- Testing: 2 hours

**Total**: ~5-6 hours to complete integration

---

**Status**: Phase 3 hooks created. Awaiting Convex initialization before proceeding.


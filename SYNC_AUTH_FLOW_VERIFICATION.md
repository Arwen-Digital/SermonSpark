# Sync Button Authentication Flow - Verification

## Current Implementation Status

All three sync button locations are properly configured to show Clerk login modal when user is not authenticated.

### ✅ Files Configured

1. **`components/sync/SyncStatusDashboard.tsx`** (Line 126-164)
   - `handleManualSync()` checks `if (!isSignedIn)` → shows modal
   - Modal state: `const [showClerkSignIn, setShowClerkSignIn] = useState(false);` (Line 40)
   - Modal rendered at lines 291-295

2. **`app/(tabs)/sermons.tsx`** (Line 96-134)
   - `handleSyncNow()` checks `if (!isSignedIn)` → shows modal
   - Modal state: `const [showClerkSignIn, setShowClerkSignIn] = useState(false);` (Line 18)
   - Modal rendered at lines 152-156

3. **`components/series/SeriesListScreen.tsx`** (Line 83-120)
   - `handleSyncNow()` checks `if (!isSignedIn)` → shows modal
   - Modal state: `const [showClerkSignIn, setShowClerkSignIn] = useState(false);` (Line 48)
   - Modal rendered at lines 321-325

### ✅ Flow Verification

**Step 1: User clicks sync button**
- Handler checks `isSignedIn` from `useAuth()` hook
- If `false` → sets `setShowClerkSignIn(true)`

**Step 2: Clerk login modal opens**
- Modal shows inline email/password inputs
- User can sign in without leaving screen
- OR user can click "Or use full sign-in screen →" link

**Step 3: After successful login**
- Clerk `isSignedIn` becomes `true`
- `useEffect` in modal detects auth state change (Line 26-31)
- Calls `handleAuthSuccess()` callback
- Handler triggers sync automatically (Line 163, 119, 133)

**Step 4: Sync proceeds**
- Calls `syncToConvex()` function
- Shows success/error alerts
- Modal closes

## Authentication Check Logic

All handlers use the same pattern:

```typescript
const handleSyncNow = async () => {
  // Check if user is authenticated
  if (!isSignedIn) {
    setShowClerkSignIn(true);  // Show modal
    return;
  }

  // Proceed with sync...
  setIsSyncing(true);
  const result = await syncToConvex();
  // ...
};
```

## Expected Behavior

### ✅ When User is NOT Authenticated
1. Click "Sync Now" button
2. Modal appears with inline sign-in form
3. User enters email/password
4. After successful login, sync automatically triggers
5. Modal closes, sync completes

### ✅ When User IS Authenticated
1. Click "Sync Now" button
2. Sync proceeds immediately
3. No modal shown

## Testing Checklist

- [x] All three sync buttons check `isSignedIn` before syncing
- [x] All three components have `showClerkSignIn` state
- [x] All three render `<ClerkSignInModal>` component
- [x] Modal has inline email/password inputs
- [x] Modal auto-triggers sync after successful login
- [x] All handlers call `onAuthSuccess()` callback
- [x] Fallback link to full auth screen is available
- [x] Loading states and error handling in place

## Potential Issues to Watch

1. **Clerk not configured**: If `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing, Clerk auth will fail
2. **Convex not running**: If `npx convex dev` hasn't been run, sync will return stub message
3. **Auth state lag**: Small delay between Clerk auth completing and `isSignedIn` updating

## Implementation Complete ✅

The sync button authentication flow is fully implemented and ready for testing. When user is not authenticated with Clerk, the login modal will appear with inline sign-in form. After successful login, sync will trigger automatically.


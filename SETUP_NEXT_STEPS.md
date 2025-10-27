# Next Steps for Convex Setup

## ✅ Current Status

- ✅ Schema fixed and validated
- ✅ Convex functions ready (11:11:19)
- ✅ Need to run interactive dev server
- ✅ Need to get deployment URL

## Immediate Next Steps

### 1. Run Convex in Interactive Mode

Open a new terminal and run:

```bash
npx convex dev
```

This will:
- Start the interactive development server
- Show your deployment URL (e.g., `https://colorful-ox-168.convex.cloud`)
- Watch for file changes
- Auto-reload when you modify Convex functions

### 2. Get Your Convex Deployment URL

Once `npx convex dev` is running, you'll see output like:

```
✔ 11:11:19 Convex deployment is ready!

Deployment URL: https://[deployment].convex.cloud
```

Copy this URL.

### 3. Add to Environment Variables

Add to `.env.production` or your environment:

```bash
EXPO_PUBLIC_CONVEX_URL=https://[your-deployment].convex.cloud
```

### 4. Get Clerk Publishable Key

1. Visit https://clerk.com
2. Create an account (if you don't have one)
3. Create a new application
4. Copy the publishable key
5. Add to environment:

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 5. Configure Clerk for Convex

Update `convex/auth.config.ts` with your Clerk issuer domain:

```typescript
export default {
  providers: [
    {
      domain: "https://[your-clerk-domain].clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
```

You'll find your issuer domain in the Clerk dashboard → Settings → JWT Templates

## Testing the Setup

After configuration:

1. **Test Convex connection:**
   ```typescript
   import { convexClient } from '@/services/convexClient';
   ```

2. **Test Clerk authentication:**
   - Open the app
   - Try signing up
   - Verify Clerk auth works

3. **Test Convex + Clerk together:**
   - Sign in with Clerk
   - Check if Convex queries work

## Files Ready for Integration

All these files are ready to use once Convex is properly initialized:

- ✅ `hooks/useConvexAuth.ts` - Combined Clerk + Convex
- ✅ `hooks/useConvexSeries.ts` - Series mutations
- ✅ `hooks/useConvexSermons.ts` - Sermon mutations
- ✅ `services/clerkAuth.ts` - Clerk utilities
- ✅ `services/convexSubscriptionSync.ts` - Real-time sync

## Example Usage

### In a Component:

```typescript
import { useConvexAuth } from '@/hooks/useConvexAuth';
import { useConvexSeries } from '@/hooks/useConvexSeries';

function MyComponent() {
  const { isAuthenticated } = useConvexAuth();
  const { series } = useConvexSeries();
  
  // series automatically syncs from Convex
  return <View>...</View>;
}
```

### In a Repository:

```typescript
import { useCreateSeriesMutation } from '@/hooks/useConvexSeries';

const createSeries = useCreateSeriesMutation();
await createSeries({ title: 'New Series', ... });
```

## Current Files Status

### ✅ Working
- All Convex schema files
- All Convex function files
- All hooks created
- Clerk integration ready

### ⚠️ Pending Configuration
- `services/convexClient.ts` needs deployment URL
- `app/_layout.tsx` needs Clerk publishable key
- Repositories need to integrate Convex mutations

### 🎯 Next Action

**Run this command:**

```bash
npx convex dev
```

Then follow the steps above to complete the setup.


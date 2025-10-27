# Convex + Clerk Authentication Setup Checklist

## Current Status
- ✅ ConvexProviderWithClerk is configured in `app/_layout.tsx`
- ✅ Environment variables are set in `.env.local`
- ✅ `convex_id_mapping` table creation is in sync handler
- ⚠️ "Not authenticated" errors persist

## Issues Found

### 1. Convex "Not authenticated" Errors
**Symptoms**: Convex queries return "Not authenticated" even when user is logged in with Clerk

**Possible Causes**:
1. Clerk JWT template not created or misconfigured
2. Convex auth.config.ts doesn't match Clerk issuer URL
3. Token not being sent from app to Convex

### 2. Clerk JWT Template Setup
You need to create a JWT template in Clerk dashboard:
1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to: **JWT Templates** → **Create**
4. Name it: `convex`
5. Set the issuer URL
6. Add any necessary claims

### 3. Convex Auth Configuration
The `convex/auth.config.ts` should match your Clerk issuer URL

Current config:
```typescript
domain: "https://wired-prawn-63.clerk.accounts.dev",
applicationID: "convex",
```

**Action Required**: Verify this matches your Clerk dashboard issuer URL

## Verification Steps

### Step 1: Check if `npx convex dev` is running
```bash
# Should see Convex functions ready message
npx convex dev
```

### Step 2: Verify environment variables are loaded
The app should pick up:
- `EXPO_PUBLIC_CONVEX_URL` ✅ Set to: https://colorful-ox-168.convex.cloud
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` ✅ Set to: pk_test_...

### Step 3: Test Clerk authentication
1. Sign in with Clerk in the app
2. Check if Clerk session exists: `const { userId } = useAuth()` should return a valid ID
3. Verify `useConvexAuth` shows `isAuthenticated: true`

### Step 4: Test Convex query with auth
The issue is that Convex functions check auth at line 7-8:
```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Not authenticated");
```

This means `ctx.auth.getUserIdentity()` is returning `null`.

## Recommended Fix

The problem is likely that `ConvexProviderWithClerk` expects the Clerk auth to be properly configured. Let's verify:

1. Check if `convex/react-clerk` package is installed
2. Verify ClerkProvider wraps ConvexProviderWithClerk
3. Ensure Clerk keys are correct

## Next Steps

1. **Create Clerk JWT template** (if not done)
2. **Restart `npx convex dev`** after any auth config changes
3. **Test sync again** and check if errors persist

## Testing Commands

```bash
# Start Convex dev server
npx convex dev

# In another terminal, check logs
tail -f node_modules/.convex/logs

# Verify environment
echo $EXPO_PUBLIC_CONVEX_URL
echo $EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
```


# Setup Instructions for Convex & Clerk Integration

## Current Status ✅
- ✅ Convex deployment configured: `https://colorful-ox-168.convex.cloud`
- ✅ Convex schema and functions created
- ✅ Clerk provider integrated in app
- ⚠️ Missing: Clerk publishable key

## Next Steps

### 1. Get Your Clerk Publishable Key

1. Go to https://clerk.com and sign up/login
2. Create a new application (or use existing one)
3. Go to **API Keys** section in the dashboard
4. Copy your **Publishable Key** (starts with `pk_...`)

### 2. Update Environment Variables

Add your Clerk publishable key to `.env.local`:

```bash
# Edit .env.local and replace with your actual key:
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
```

### 3. Configure Clerk Issuer URL

Update `convex/auth.config.ts` with your Clerk issuer URL:

1. In Clerk dashboard, go to **Settings** → **Advanced**
2. Copy your **Frontend API** URL (e.g., `https://your-app.clerk.accounts.dev`)
3. Update `convex/auth.config.ts`:

```typescript
export const CLERK_ISSUER_URL = "https://your-app.clerk.accounts.dev";
```

### 4. Start Convex in Development Mode

In a **new terminal**, run:

```bash
npx convex dev
```

This will:
- Watch for changes to your Convex functions
- Generate TypeScript types
- Push schema changes
- Enable real-time features

### 5. Start Your App

In the original terminal:

```bash
npm start
```

## Testing the Integration

Once the app loads without errors:

1. **Test Offline Mode**: The app should work locally with SQLite
2. **Test Authentication**: Try to sign in/sign up (will require Clerk key)
3. **Test Convex Sync**: Once authenticated, data should sync to Convex

## Current Features Status

### ✅ Working (Local-First)
- SQLite database operations
- Offline data storage
- Series and Sermons CRUD
- Data persistence

### ⚠️ In Progress
- Clerk authentication (needs publishable key)
- Convex real-time sync
- Community features (stubbed for now)

### 🔜 Todo
- Implement Convex subscriptions for real-time sync
- Connect repositories to Convex mutations
- Add community posts/comments integration
- Test bidirectional sync

## Troubleshooting

### "Missing publishableKey" Error
- Solution: Add your Clerk publishable key to `.env.local`

### Convex Connection Failed
- Solution: Make sure `npx convex dev` is running in a separate terminal
- Check that `EXPO_PUBLIC_CONVEX_URL` is correct

### Type Errors
- Solution: Run `npx convex dev` to generate TypeScript types
- Restart your Expo dev server after Convex generates types

## Need Help?

- Convex docs: https://docs.convex.dev
- Clerk docs: https://clerk.com/docs
- Expo docs: https://docs.expo.dev


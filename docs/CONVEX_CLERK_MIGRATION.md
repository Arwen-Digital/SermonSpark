# Convex + Clerk Migration Summary

## Overview

This document summarizes the migration from Supabase/Express backend to Convex.dev with Clerk authentication.

## What Changed

### Removed Services
- ✅ All Supabase service files (`supabaseClient.ts`, `supabaseAuthService.ts`, etc.)
- ✅ All Express backend service files (backend is in separate repo)
- ✅ Complex bidirectional sync service (2000+ lines → ~200 lines)
- ✅ Web-specific repositories that called Express APIs
- ✅ Backend-related test files
- ✅ Old documentation files

### Added Services
- ✅ Convex schema (`convex/schema.ts`)
- ✅ Convex functions (`convex/series.ts`, `convex/sermons.ts`, `convex/profiles.ts`, `convex/community.ts`)
- ✅ Convex client setup (`services/convexClient.ts`)
- ✅ Clerk auth integration in `app/_layout.tsx`
- ✅ Simplified sync service (`services/sync/syncService.native.ts`)

## Key Improvements

### 1. Simpler Backend
- **Before**: Express.js + MySQL + complex sync logic (~3000 lines)
- **After**: Convex schema + functions (~500 lines)
- **Reduction**: ~83% less code

### 2. Automatic Syncing
- **Before**: Manual queue management, conflict resolution, bidirectional sync coordination
- **After**: Convex handles offline mutations automatically
- **Benefit**: No more manual sync coordination code

### 3. Real-Time Updates
- **Before**: Manual polling or refresh triggers
- **After**: Automatic real-time subscriptions via Convex
- **Benefit**: UI updates automatically when data changes on other devices

### 4. Better Auth Flow
- **Before**: Express Passport.js or Supabase auth
- **After**: Clerk with OAuth providers built-in
- **Benefit**: Modern auth UI, email verification, password reset out of the box

## What's Preserved

### Local-First Architecture
- ✅ SQLite database on mobile (instant reads/writes)
- ✅ Anonymous user support for offline mode
- ✅ Repository pattern abstraction
- ✅ Local data migration when user signs up

## Setup Instructions

### 1. Install Dependencies

```bash
npm install convex @clerk/clerk-expo
npx convex dev --once
```

### 2. Configure Environment Variables

Add to `.env.production`:

```bash
EXPO_PUBLIC_CONVEX_URL=your_convex_deployment_url
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### 3. Set Up Convex

```bash
npx convex dev
```

This will:
- Generate Convex deployment URL
- Set up Clerk authentication
- Create database tables based on schema

### 4. Configure Clerk

1. Create account at https://clerk.com
2. Create new application
3. Copy publishable key to environment
4. Configure OAuth providers (optional)
5. Set up JWT issuer domain for Convex

### 5. Deploy

```bash
# Deploy Convex functions
npx convex deploy

# Build and deploy app
eas build --profile production
```

## Migration Status

### ✅ Completed
- Removed Supabase files
- Removed Express service files
- Created Convex schema
- Created Convex functions
- Integrated Clerk auth
- Simplified sync service
- Updated package.json dependencies

### 🔄 In Progress
- Repository integration with Convex mutations
- Sync service connection to Convex
- Real-time subscription setup
- Anonymous → authenticated user migration

### 📋 TODO
- Test offline-first flows
- Test real-time sync
- Test anonymous user upgrade
- Update UI components to use Convex hooks
- Add error handling for Convex connection failures
- Document Convex deployment process

## Architecture

### Data Flow

```
┌──────────────┐
│  React App   │
│  Components  │
└──────┬───────┘
       │
       ├─── Read: Local SQLite (instant)
       └─── Write: Local SQLite → Convex (queued if offline)
                    ↓
              Convex Sync
                    ↓
              Other Devices
```

### Sync Strategy

1. **Local Write**: Write to SQLite immediately (optimistic update)
2. **Sync to Convex**: Queue mutation to Convex (automatic if offline)
3. **Real-Time Update**: Convex subscription updates SQLite when remote changes occur
4. **Conflict Resolution**: Convex handles conflicts automatically

## Key Files

- `convex/schema.ts` - Database schema
- `convex/series.ts` - Series queries and mutations
- `convex/sermons.ts` - Sermon queries and mutations
- `convex/profiles.ts` - Profile management
- `convex/community.ts` - Community posts and comments
- `services/convexClient.ts` - Convex client initialization
- `services/sync/syncService.native.ts` - Simplified sync service
- `app/_layout.tsx` - Clerk + Convex providers

## Next Steps

1. Complete repository integration
2. Add Convex subscriptions for real-time updates
3. Test all local-first flows
4. Deploy to production
5. Monitor Convex usage and costs



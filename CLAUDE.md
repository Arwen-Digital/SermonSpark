# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YouPreacher is a **React Native (Expo) sermon preparation app** with a local-first architecture. It uses **SQLite for offline storage** and **Convex.dev for real-time cloud sync**, with **Clerk** for authentication. The app supports iOS, Android, and Web platforms.

## Tech Stack

- **Framework**: Expo/React Native with Expo Router (file-based routing)
- **Language**: TypeScript with strict mode
- **Backend**: Convex.dev (managed, serverless, real-time)
- **Auth**: Clerk authentication
- **Database**: SQLite (local-first) + Convex (cloud sync)
- **UI Libraries**: React Native Paper, React Navigation, Expo components
- **Testing**: Jest + Testing Library
- **Linting**: ESLint (Expo config)
- **Build**: EAS Build for production builds

## Architecture Overview

### Local-First with Cloud Sync

```
┌──────────────┐
│   UI Layer   │
│ (Components) │
└──────┬───────┘
       │
       ├─── Read: SQLite (instant) or Convex (when authenticated)
       │
       └─── Write: SQLite → Convex (automatic sync when online)
                    ↓
              Real-time updates from other devices
```

### Provider Hierarchy (app/_layout.tsx)

1. **SafeAreaProvider** - Platform-safe area context
2. **ClerkProvider** - Authentication
3. **ConvexProvider** - Backend with real-time subscriptions
4. **ThemeProvider** - Navigation theming

### Path Aliases

- `@/*` maps to root directory (e.g., `@/services/authSession` → `/services/authSession`)

## Common Development Commands

### Starting Development

```bash
# Start Expo dev server
npm start

# In a separate terminal: Start Convex dev server (REQUIRED for backend features)
npx convex dev
```

### Running on Platforms

```bash
# Start with platform selection
npm start

# Platform-specific
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
```

### Building for Production

```bash
# Build preview builds
npm run preview:android
npm run preview:ios
npm run preview:all

# Build web for production
npm run web:build

# Docker deployment (web)
npm run docker:build
npm run docker:run
```

### Code Quality

```bash
# Lint code
npm run lint

# Run tests
npm test
npm run test:watch  # Watch mode
```

### Utility Scripts

```bash
# Reset Expo project structure
npm run reset-project

# Reset local SQLite data
npm run reset-local-data

# Fresh app initialization
npm run fresh-start
```

### Running Single Tests

```bash
# Run specific test file
npm test -- authSession.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="anonymous user"
```

## Environment Configuration

### Required Environment Variables (.env.local)

```bash
# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Convex Backend
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

See `env.production.example` for production variables and `SETUP_INSTRUCTIONS.md` for detailed setup.

## Directory Structure

### app/ - File-based Routing (Expo Router)

```
app/
├── _layout.tsx                 # Root layout with providers
├── (tabs)/                    # Tab navigation group
│   ├── _layout.tsx            # Tab configuration
│   ├── index.tsx              # Home screen
│   ├── home.tsx               # Home (alternative?)
│   ├── sermons.tsx            # Sermons list
│   ├── research.tsx           # Research tools hub
│   ├── community.tsx          # Community feed
│   ├── profile.tsx            # User profile
│   └── debug.tsx              # Debug screen
├── auth.tsx                   # Authentication screen
├── signup.tsx                 # Sign up screen
├── sermon/
│   ├── [id].tsx               # View sermon
│   ├── create.tsx             # Create sermon
│   └── edit/[id].tsx          # Edit sermon
├── series/
│   ├── index.tsx              # Series list
│   ├── [id].tsx               # View series
│   ├── create.tsx             # Create series
│   └── [id]/edit.tsx          # Edit series
└── research/                  # Research tools
    ├── sermon-title-generator.tsx
    ├── outline-generator.tsx
    ├── illustration-finder.tsx
    ├── historical-context.tsx
    ├── original-language-study.tsx
    ├── discussion-questions.tsx
    ├── topic-explorer.tsx
    ├── social-media-post-ideas.tsx
    └── blog-post-ideas.tsx
```

### components/ - UI Components

```
components/
├── auth/                      # Authentication components
├── common/                    # Shared UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── LoadingIndicator.tsx
│   ├── FeatureGateWrapper.tsx
│   ├── AuthenticationPrompt.tsx
│   └── RichHtml.tsx
├── Collapsible.tsx            # Collapsible view
└── debug/                     # Debug components
```

### services/ - Business Logic

```
services/
├── authSession.ts             # Auth session management
├── clerkAuth.ts               # Clerk utilities
├── clerkTokenCache.ts         # Token caching
├── convexClient.ts            # Convex client + Clerk sync
├── convexMutations.ts         # Convex mutation helpers
├── errorHandler.ts            # Error handling
├── featureGate.ts             # Feature flags
├── db/                        # SQLite (local-first)
│   ├── sqlite.native.ts       # Native SQLite
│   └── index.native.ts        # DB initialization
└── repositories/              # Data access layer
    ├── sermonRepository.native.ts
    └── seriesRepository.native.ts
```

### hooks/ - React Hooks

```
hooks/
├── useConvexAuth.ts           # Auth hook (Clerk + Convex)
├── useConvexSeries.ts         # Series CRUD hooks
├── useConvexSermons.ts        # Sermon CRUD hooks
├── useFeatureGate.ts          # Feature flag hook
└── useThemeColor.ts           # Theme color hook
```

### convex/ - Backend (Convex.dev)

```
convex/
├── schema.ts                  # Database schema
├── series.ts                  # Series CRUD functions
├── sermons.ts                 # Sermon CRUD functions
├── profiles.ts                # User profiles
├── community.ts               # Community posts/comments
├── bible.ts                   # Bible API integration
└── functions/                 # AI-powered research tools
    ├── generateSermonTitles.ts
    ├── generateOutline.ts
    ├── generateIllustration.ts
    └── ...
```

## Key Services & Patterns

### Authentication Flow

**File**: `app/_layout.tsx:22-79`

- `useConvexClerkAuth()` syncs Clerk tokens with Convex
- Anonymous users work offline (`anon_*` IDs)
- Real users sync to Convex cloud
- Session recovery handled in SQLite

### Data Layer

**Local-First Repositories**:
- `services/repositories/sermonRepository.native.ts`
- `services/repositories/seriesRepository.native.ts`
- Write to SQLite immediately (optimistic)
- Sync to Convex when authenticated

**Convex Hooks**:
- `hooks/useConvexSeries.ts` - Series queries/mutations
- `hooks/useConvexSermons.ts` - Sermon queries/mutations
- Auto-updates via Convex subscriptions

### Sync Architecture

**Services**:
- `services/convexClient.ts` - Client initialization
- `services/convexSyncAdapter.ts` - Sync logic
- `services/sync/syncService.native.ts` - Sync orchestration

**Pattern**:
```typescript
// Write locally
await sermonRepository.create(data);

// Sync to cloud (automatic when online)
if (isAuthenticated) {
  await syncSermonToConvex(data);
}
```

## Using Convex in Components

```typescript
import { useConvexAuth } from '@/hooks/useConvexAuth';
import { useConvexSeries } from '@/hooks/useConvexSeries';

function SermonsList() {
  const { isAuthenticated } = useConvexAuth();
  const { series } = useConvexSeries();

  // series auto-updates from Convex
  return series.map(s => <SeriesCard key={s.id} data={s} />);
}
```

## Testing

**Test Setup**: `jest.config.js` + `jest.setup.js`

- Jest with React Native preset
- Testing Library for React Native
- Path mapping: `@/*` → root
- Mocks for Expo modules, Reanimated, AsyncStorage

**Test Patterns**:
```typescript
import authSession from '@/services/authSession';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');

describe('authSession', () => {
  it('should generate anonymous user', async () => {
    const id = await generateAnonymousUserId();
    expect(id).toMatch(/^anon_\d+_[a-z0-9]{9}$/);
  });
});
```

## Known Issues (see Bugs.md)

### High Priority
- 🔴 **Sermon editor crashes on Android** (Fixed)
- 🔴 **Sermon editor not functional offline** - CKEditor loads from CDN, needs bundling

### Medium Priority
- 🟡 **Android landscape mode not responsive** - Locked to portrait in app.json

## Recent Changes

**Latest**: cfdc52b - Enhanced DiscussionQuestionsPage with sermon selection and API integration

Recent commits show active development of:
- Research tools (sermon title generation, outlines, illustrations, etc.)
- Discussion question generation
- Historical context and language studies
- UI/UX improvements

## Convex Development

### Start Convex Dev Server

```bash
npx convex dev
```

This runs in a **separate terminal** from `npm start`. It will:
- Watch for schema/function changes
- Generate TypeScript types
- Push schema updates
- Enable real-time features

### Convex Functions

**CRUD Operations** (convex/series.ts, convex/sermons.ts):
- `list` - Query all user data
- `get` - Get single item
- `create` - Create new
- `update` - Update existing
- `remove` - Soft delete

**Research Functions** (convex/functions/):
- Powered by Eden AI/OpenRouter
- Generate sermon titles, outlines, etc.
- Cache results in bible_cache table

## Build & Deployment

### EAS Build

```bash
# Configure eas.json first
eas build --profile preview --platform android
eas build --profile preview --platform ios
eas build --profile preview --platform all
```

### Web Deployment

```bash
# Build web
npm run web:build

# Deploy with Docker
npm run docker:build
npm run docker:run

# Or deploy dist/ folder to hosting
```

## Development Tips

### 1. Always Run Convex Dev
Most features require `npx convex dev` running in a separate terminal. Without it:
- Authentication won't work
- Data won't sync
- Real-time updates disabled

### 2. Environment Setup
- Copy `.env.example` to `.env.local`
- Get Clerk publishable key from clerk.com
- Convex URL provided in setup docs

### 3. Testing Flow
```bash
npm test              # Run all tests
npm run test:watch   # Watch mode for TDD
npm test -- <pattern>  # Specific test
```

### 4. Platform Testing
```bash
# Test all platforms
npm start

# Or specific
npm run android
npm run ios
npm run web
```

### 5. Code Quality
```bash
npm run lint    # Check linting
npm start       # TypeScript checking via Expo
```

## Key Documentation Files

- `SETUP_INSTRUCTIONS.md` - Initial setup guide
- `MIGRATION_COMPLETE_FINAL.md` - Convex/Clerk migration summary
- `Bugs.md` - Known issues and bugs
- `CONVEX_SETUP_CHECKLIST.md` - Convex configuration checklist
- `package.json` - Dependencies and scripts

## Component Libraries

- **Expo UI**: `@expo/vector-icons`, `expo-linear-gradient`, `expo-blur`, `expo-clipboard`
- **Navigation**: `@react-navigation/native`, `@react-navigation/bottom-tabs`
- **UI**: `react-native-paper`, `react-native-safe-area-context`
- **Backend**: `convex`, `@clerk/clerk-expo`
- **Storage**: `@react-native-async-storage/async-storage`, `expo-sqlite`

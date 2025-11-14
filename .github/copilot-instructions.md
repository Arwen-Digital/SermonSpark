<!-- Auto-generated guidance for AI coding agents. Keep concise and actionable. -->
# Copilot instructions for contributors and AI agents

This repository is a React Native (Expo) local-first app with a Convex backend and Clerk authentication. Use these concise rules to make productive, low-risk code changes.

- **Big picture**: UI in `app/` (file-based routing via Expo Router) → local-first data flows through `services/repositories/*` (SQLite) → syncs to cloud via `convex/` and `services/convexSyncAdapter.ts` when authenticated.
- **Key providers**: `app/_layout.tsx` sets provider order (SafeArea → Clerk → Convex → Theme). Preserve provider ordering when modifying layout or auth flows.

- **Important directories**:
  - `app/` — screens and routes (Expo Router). Example: `app/sermon/create.tsx`, `app/series/[id].tsx`.
  - `components/` — shared UI, small focused components (e.g. `components/common/RichHtml.tsx`).
  - `services/` — business logic, auth (`services/authSession.ts`), Convex client (`services/convexClient.ts`), and local repositories (`services/repositories/sermonRepository.native.ts`).
  - `convex/` — cloud functions and schema. Convex functions live in `convex/functions/` and are the cloud-side entrypoints.
  - `hooks/` — preferred place to encapsulate data access and Convex subscriptions (e.g. `hooks/useConvexSermons.ts`).

- **Path aliases & typings**: imports use `@/*` (root). TypeScript is strict — keep types coherent and update Convex-generated types after changing `convex/schema.ts`.

- **Local-first pattern (explicit)**:
  - Write immediately to local SQLite via repository helpers (optimistic updates).
  - Trigger cloud sync via `services/convexSyncAdapter.ts` or `syncService.native.ts` when online/authenticated.
  - Example workflow: `await sermonRepository.create(data)` → local write → `syncSermonToConvex(data)` when authenticated.

- **Run & debug (must-do steps for feature work)**:
  - Start app: `npm start` (or `npx expo start`).
  - In a separate terminal run Convex dev server: `npx convex dev` — many features and types depend on this.
  - Platform helpers: `npm run android`, `npm run ios`, `npm run web`.

- **Build / deploy**:
  - EAS builds: `eas build --profile preview --platform android|ios`.
  - Web build & Docker: `npm run web:build`, `npm run docker:build` / `npm run docker:run`.

- **Tests & linting**:
  - Run tests: `npm test` (use `npm test -- <file>` for single files).
  - Jest config: `jest.config.js`; tests mock Expo native modules and AsyncStorage — follow existing test mocks.
  - Lint: `npm run lint`.

- **Convex-specific guidance**:
  - Edit `convex/functions/*` to add server behavior. Run `npx convex dev` to push changes and regenerate types.
  - Convex functions are used for research/AI tools (see `convex/functions/generateOutline.ts` type examples).

- **Env & secrets**:
  - Copy `env.production.example` / `.env.example` to `.env.local` and set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_CONVEX_URL`.

- **Code conventions & patterns**:
  - Prefer small focused hooks in `hooks/` for data access, and use `services/repositories/*` for local persistence logic.
  - Use optimistic updates: write to local DB first, sync afterwards.
  - Keep UI components presentational; business logic belongs in `services/` or `hooks/`.
  - When adding platform-specific DB code, follow naming pattern `*.native.ts` (e.g. `sqlite.native.ts`).

- **When editing auth or provider logic**: inspect `app/_layout.tsx` and `hooks/useConvexAuth.ts` / `services/clerkAuth.ts`. Token sync between Clerk and Convex is implemented — avoid breaking order or lifecycle hooks.

- **Quick examples**:
  - Querying Convex in UI: `const { series } = useConvexSeries()` — hook returns live-updating arrays from Convex subscriptions.
  - Local repo write: `await sermonRepository.create({ title, body })` then ensure sync is triggered.

- **Where to look for guidance**: `CLAUDE.md`, `SETUP_INSTRUCTIONS.md`, and `docs/` contain deeper project-specific notes and known issues.

If anything here is unclear or you need more examples (tests, CI scripts, or deployment steps), tell me which area to expand and I'll iterate.

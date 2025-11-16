```instructions
# Copilot Instructions
## Core Architecture (short)
- Expo Router app: `app/_layout.tsx` composes Clerk -> Convex -> Theme providers. Ensure SafeArea + SQLite init completes before rendering screens.
- Local-first persistence: use `services/repositories/*.native.ts` which call `services/db/sqlite.native.ts`. Repositories mark `dirty`/`op` and then enqueue sync — do not bypass this.
- Auth: cached offline in `services/authSession.ts`; prefer `getEffectiveUserId()` and accept `anon_*` IDs until Clerk upgrades them.
- Convex: central client in `services/convexClient.ts` and generated types in `convex/_generated/api`. UI should use hooks in `hooks/` (e.g., `useConvexSermons.ts`).
- Feature gating: `services/featureGate.ts` + `hooks/useFeatureGate.ts`. Use `handleFeatureRequest()` to show upgrade UX instead of hiding routes.

## Sync & Offline (short)
- Sync pipeline: SQLite -> `convex_id_mapping` -> Convex. Core handler: `services/sync/convexSyncHandler.ts`.
- Use `services/sync/syncService.native.ts` for orchestration and progress callbacks (`setSyncProgressCallback`).
- Keep `app/auth.tsx` behavior: run `syncToConvex()` after sign-in so offline edits push when user logs in.

## For AI Coding Agents (actionable rules)
- Preserve local-first: always persist through repository helpers in `services/repositories/*.native.ts`. Direct Convex writes from UI are not allowed.
- When editing auth code, use `getEffectiveUserId()` and ensure `anon_*` handling is unchanged.
- After Convex schema or server-function changes, run `npx convex dev` to regenerate `convex/_generated/api` before compiling or testing.
- When adding a new entity type, update three places: 1) `convex/schema.ts` (+ server fns), 2) SQLite table + `services/repositories/*.native.ts`, 3) sync logic in `services/sync/convexSyncHandler.ts` and `services/sync/syncService.native.ts`.

## Developer Workflows & Commands (explicit)
- Local dev:
	- `npm install`
	- `npm start` (Expo)
	- In another terminal: `npx convex dev` (keeps Convex schema & types in sync)
- Tests: `npm test` (Jest + React Native Testing Library)
- Lint/typecheck: `npm run lint` and rely on Expo bundler during `npm start`.
- DB scripts: use scripts in `scripts/` (e.g., `debug-series-db.js`, `reset-local-data`) to inspect or reset local state.
- Env: populate `.env.local` (see `env.production.example`) and set at minimum `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_CONVEX_URL`.

## Patterns & Concrete Examples
- Path alias: import with `@/*` (see `tsconfig.json`) so Metro/Jest resolve correctly.
- Hook-first UI: prefer modifying or adding hooks under `hooks/` rather than placing Convex queries across UI components.
- Editor integration: `components/sermon-editor/**` uses CKEditor (web) or WebView (native) — follow existing `postMessage` contract and debounce patterns.
- Research/LLM: See `convex/functions/*` and `convex/bibleCache.ts` for prompt caching and pattern examples.

## When touching data models (step-by-step)
1. Update `convex/schema.ts` and related server functions (e.g., `convex/sermons.ts`).
2. Run `npx convex dev` and let the generated types update `convex/_generated/api`.
3. Update SQLite schema and repository logic in `services/db/sqlite.native.ts` and `services/repositories/*.native.ts`.
4. Extend sync handlers in `services/sync/convexSyncHandler.ts` and `services/sync/syncService.native.ts` to push/pull the new fields and manage `convex_id_mapping`.
5. Update hooks (`hooks/`) and screens (`app/`) to use the new model.

## Common Pitfalls & Quick Checks
- Do not bypass repository layer — it breaks offline-first guarantees.
- Always regenerate Convex types: `npx convex dev` after schema/server changes.
- Verify `syncToConvex()` remains invoked after sign-in changes in `app/auth.tsx`.

## Key files to inspect
- App entry & routing: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/auth.tsx`
- Auth & client: `services/authSession.ts`, `services/convexClient.ts`
- DB & repos: `services/db/sqlite.native.ts`, `services/repositories/*.native.ts`
- Sync: `services/sync/convexSyncHandler.ts`, `services/sync/syncService.native.ts`
- Convex: `convex/schema.ts`, `convex/sermons.ts`, `convex/functions/*`, `convex/bibleCache.ts`
- Editor: `components/sermon-editor/**`

---
If you want, I can:
- scan the codebase for direct Convex writes (to detect repository bypasses), or
- add a PR checklist template for changes touching Convex/schema or sync.

Please tell me which to prioritize.
```

# MVP Release TODO

## Backend configuration
- Add Expo/CI secrets for `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and implement durable web session storage so the Supabase client stops throwing at startup and keeps users signed in after refreshes. 【F:services/supabaseClient.ts†L4-L76】
- Migrate the Supabase project to match the frontend contracts (tables, columns like `deleted_at`, and series/sermon relations) and add row-level-security policies that allow each pastor to read/write only their own data, otherwise every CRUD call in the repositories will fail. 【F:services/supabaseSermonService.ts†L53-L191】【F:services/supabaseSeriesService.ts†L34-L183】【F:services/supabaseCommunityService.ts†L203-L427】

## Core product gaps
- Replace the mock “AI” research tools with real data: load the catalog from Supabase (instead of hard-coded arrays), integrate the sermon title generator with the user’s actual sermons, and call the chosen AI provider while enforcing premium access instead of the `useState(true)` stub. 【F:app/(tabs)/research.tsx†L11-L113】【F:app/research/sermon-title-generator.tsx†L20-L166】
- Swap the hard-coded Bible verse dictionary for a real scripture search API and surface its errors in the editor UI. 【F:components/sermon-editor/SermonEditor.tsx†L12-L42】
- Wire the auto-save routine to the repository/offline layer (and eventually sync) instead of logging to the console so drafts survive navigation or crashes. 【F:components/sermon-editor/SermonEditor.tsx†L134-L161】
- Align the sermon data model so the UI’s series badge uses a real `seriesTitle`/`seriesId` field rather than accessing an undefined `sermon.series`. 【F:components/file-management/SermonCard.tsx†L91-L149】【F:types/index.ts†L1-L18】
- Update the home dashboard to read sermons and posts through the repository/offline layer (not the Supabase-only services) so the native build works offline as designed. 【F:app/(tabs)/home.tsx†L1-L63】

## Authentication & community
- Implement (or hide) the Google/Apple/Facebook buttons—currently they just wait one second and call `onAuthenticated`. 【F:components/auth/AuthScreen.tsx†L129-L135】
- Populate the “Posting as …” card on the community composer with the signed-in pastor’s profile instead of the hard-coded “Pastor Arnold” placeholder. 【F:app/community/create.tsx†L141-L149】
- Harden community like/unlike flows by handling “no row” responses (use `maybeSingle()` or check for `PGRST116`) so toggling likes does not throw when a row is missing. 【F:services/supabaseCommunityService.ts†L323-L393】

## Offline sync & resilience
- Hook the sync engine into connectivity/app lifecycle events (see the planned use of `expo-network` in the offline notes) so data pushes/pulls happen automatically instead of only when the user taps “Sync now.” 【F:services/sync/syncService.native.ts†L1-L120】【F:docs/offline-deps-and-patterns.md†L1-L14】

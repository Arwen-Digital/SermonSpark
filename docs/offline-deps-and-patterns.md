Offline Dependencies and Patterns

Libraries to install (native only usage)
- expo-sqlite: Local persistent storage for offline CRUD.
- expo-network: Check connectivity and trigger sync on regain.
- expo-file-system: Optional caching for images/media.
- @react-native-async-storage/async-storage: Persist session + last sync state (already installed).

Install commands
- npm: npm install expo-sqlite expo-network expo-file-system

Patterns
- Repositories: Platform-gated implementations under services/repositories/*.native.ts and *.web.ts.
- Native: SQLite-backed repositories with per-user scoping and sync.
- Web: Direct Supabase services; repository is a thin adapter.
- Types: Normalized DTOs in services/repositories/types.ts; offline shapes in types/offline.ts.
- Sync: Push dirty rows first, then pull by updated_at; last-write-wins.

Notes
- Do not import expo-sqlite from web bundles; platform files prevent this.
- SQLite JSON fields are stored as TEXT (JSON.stringify/parse).
- All timestamps are ISO strings.


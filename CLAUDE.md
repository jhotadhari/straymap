# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Straymap is an offline Android mapping app for cyclists/hikers, built with React Native around `react-native-mapsforge-vtm` (a fork of mapsforge/vtm, also maintained by this author). Privacy-first: no trackers, all data stays on-device except optional `online-raster-xyz` raster tile requests.

## Commands

```bash
yarn start          # Metro bundler (run from project root)
yarn android         # Build & run on connected device/emulator (run in a second terminal while Metro is running)
yarn typecheck       # tsc, no emit
yarn lint            # eslint .
yarn test            # jest
yarn test <pattern>  # run a single test file/suite
yarn format          # prettier . --write
yarn sortI18n        # sort all i18n JSON files (app + per-feature) to match the fallback language's key structure
yarn publish         # release automation: bump versions, merge branches, create GitHub release
```

The pull request base/development branch is `development` (not `main`).

Drizzle (SQLite schema/migrations):
```bash
yarn drizzle-kit generate   # generate a new migration from schema changes (check drizzle.config.ts for invocation details)
```

## Architecture

### Redux store and the "feature" convention

`src/store/store.ts` wires together one reducer per slice in `src/store/features/`: `appearance`, `general`, `dbLoader`, `dirs`, `ui`, `dashboard`, `baseMap`, `drawers`, `routing`, `updater`, `lang`, `lines`. `devTools` is disabled (doesn't work in RN). A custom `listenerMiddleware` (`src/store/listenerMiddleware.ts`) is prepended before the serializability check middleware, since listener effects can carry functions — this is the mechanism for side effects like persisting to storage or reacting to other slices' state changes.

Each feature directory typically follows the same shape: `slice.ts`, `selectors.ts`, `types.ts`, `index.ts` (implements the `AppFeature` interface from `src/types.ts`), plus optional `hooks/`, `db/`, `connectStorage.ts`, and `assets/i18n/{en,de}.json`. The `AppFeature` interface (`src/types.ts`) is the contract each feature exposes to the app shell: `selectInitialized`, `translation` (merged into i18next resources), an optional `initializeFromStorage(store)`, and an optional `onSetDbPath` thunk hook fired when the database path changes.

`AppThunk<T>` (defined in `src/store/store.ts`) is the standard thunk type across the codebase — use it instead of raw `ThunkAction`.

App init sequence (`src/store/utils.ts: initializeAppState`, invoked once at the bottom of `store.ts`): lang → dbLoader → updater → remaining features, each via their `initializeFromStorage`/storage-restore path. `src/components/App.tsx` blocks rendering of `AppView` until all features report initialized, the db has migrated, and the initial map position is resolved.

### Database layer (drizzle + op-sqlite + libspatialite)

The DB stack is new/in-progress (see recent commits around making `dbPath` dynamic). Key pieces:

- `drizzle.config.ts` discovers schema files via a glob across `src/store/features/*/db/schema/`, dialect `sqlite`, driver `expo`; migrations are emitted to `/drizzle/`.
- `src/store/features/dbLoader/DBConnection.ts` is a singleton wrapping the `@op-engineering/op-sqlite` connection and the drizzle ORM instance. It loads the `libspatialite` extension and runs migrations on `initialize(dbPath)`.
- Per-feature schemas live at `src/store/features/{lines,routing}/db/schema/schema.ts` and are aggregated in `src/store/features/dbLoader/schema.ts`. Spatial columns use custom `lineString()`/`point()` column types (geometry stored as LINESTRINGZ/POINTZ, SRID 4326) — see migration `0001_initSpatial.sql` for the libspatialite metadata bootstrap.
- Per-feature DB actions (CRUD via drizzle) live under `src/store/features/{lines,routing}/db/actions*.ts`.
- **Dynamic db path**: the path is stored in the `dbLoader` slice, persisted via `react-native-default-preference` (see `src/store/features/dbLoader/connectStorage.ts` and the analogous `src/store/features/dirs/connectStorage.ts`), and changing it currently requires telling the user to restart the app (per recent commit history) — features that care about the db path implement `onSetDbPath` on their `AppFeature`.

### Native Android bridge

Custom native modules live in `android/app/src/main/java/com/jhotadhari/straymap/`:
- `HelperModule.java` — exposes app directories (internal, external media/file/cache dirs) to JS and auto-creates the app's subdirectories (`dem`, `mapfiles`, `databases`, `mapstyles`, `export`, `marker`, `cursor`).
- `FsModule.java` — filesystem listing/info operations, with extension filtering (`MatchExtensionsPredicate.java`).
- `ReactNativePackage.java` — registers the native modules with React Native.
- `MainActivity.kt` / `MainApplication.kt` — standard RN entry points.

### Map and routing

- `react-native-mapsforge-vtm` (the map rendering library, this author's own package) provides `MapContainer` and related layer/event types; `src/components/AppView.tsx` composes it with drawers, dashboard, and cursor-center UI.
- `react-native-brouter` is consumed via `.yalc` (`file:.yalc/react-native-brouter` in `package.json` — a locally-linked package, not a registry release). Routing logic lives in `src/store/features/routing/utils.ts` (`getTrackFromParams`), which calls into brouter and flattens the resulting GeoJSON into coordinate arrays.
- The `routing` and `lines` slices are the two features backed by the SQLite/drizzle db (routes/points and lines/tags respectively).

#### Map position and altitude APIs

The library provides three tiers for consuming map position and one for altitude:

| Tier | API | Bridge crossings | React re-renders | Best for |
|---|---|---|---|---|
| Callback | `MapContainer.onMapUpdate` with `mapUpdateInterval` (ms, default 40) | ~25/sec (native→JS) | ~25/sec | centerAltitude polling, debug overlays, one-shot reactions |
| Shared values | `useMapPosition()` from `/reanimated` | 0 for reads (UI thread) | 0 | Smooth 60fps coordinate displays, worklet-driven overlays |
| Imperative | `useMap().getPosition()` | 2 per call (round-trip) | 0–1 | Button-triggered snapshots |
| Altitude | `useMap().getAltitudeAtPosition(lng, lat)` | 2 per call (round-trip) | 0–1 | Tap-to-query, one-shot elevation lookups |

**`mapUpdateInterval`**: The prop on `MapContainer` (in `general` slice) controls the interval in milliseconds between `onMapUpdate` events. It was renamed from `mapEventRate` — the old name suggested Hz but the value is actually milliseconds.

**Altitude in `onMapUpdate`**: The `center` array in `MapEventResponse` is `[lng, lat, alt?]` — the 3rd element is present iff `hgtDirPath` is set on `MapContainer`. The lookup is powered by an `LruCache`-backed `ElevationReader` (10-tile cap, ~29MB max).

**Removed props** (no longer exist on `MapContainer`):
- `hgtInterpolation` — bilinear interpolation is now always on
- `hgtReadFileRate` — rate-limiting is unnecessary with on-demand reads
- `hgtFileInfoPurgeThreshold` — replaced by Android's built-in `LruCache`

**`useMapPosition()`** from `react-native-mapsforge-vtm/reanimated`:
```typescript
const { centerSv, zoomSv, bearingSv, tiltSv, handleMapUpdate } = useMapPosition();
<MapContainer onMapUpdate={handleMapUpdate} ...>
```
`centerSv` is a `SharedValue<[number, number] | null>` readable from worklets at 60fps with zero bridge crossings.

### i18n

`src/assets/i18n/i18n.ts` configures i18next with `en`/`de` resources, falling back to `en`; `'system'` as a language selection resolves to the device locale. Each feature contributes its own translations via its `AppFeature.translation` export, merged into the i18next resources at init. Run `yarn sortI18n` (`scripts/sortI18n/index.js`) after editing any translation JSON — it keeps every language file's key order in sync with the fallback language, across both `src/assets/i18n/` and each feature's `assets/i18n/`.

### Script infrastructure

Project scripts under `scripts/` use a hybrid module pattern:
- A thin **CJS entry point** (`index.js`) with a shebang, using `tsx/cjs/api` to load the TypeScript module at runtime.
- An **ESM TypeScript module** (`.ts`) with the actual logic, using `import.meta.url` + `fileURLToPath` for `__dirname`.

`tsx` (v4.21.0, devDependency) handles transpilation on the fly — scripts are not compiled by `tsc`. Both `scripts/sortI18n/` and `scripts/publish/` follow this pattern.

### Publish / release pipeline

`yarn publish` (`scripts/publish/index.js`) automates the full release workflow:

1. Validates: semver version (supports pre-releases: `1.0.0-alpha.1`), clean working tree, `[Unreleased]` in CHANGELOG.md, branch starts with `release`, typecheck passes
2. Bumps `version` in `package.json` and `versionName` + `versionCode` in `android/app/build.gradle`
3. Auto-generates `versionCode` from semver: `major*1M + minor*10K + patch*100 + offset` (alpha:0, beta:33, rc:66, release:99)
4. Releases the `[Unreleased]` section in CHANGELOG.md via `keep-a-changelog` API
5. Commits, checks out `main`, merges release branch (--no-ff), tags `v<version>`, pushes
6. Creates/updates GitHub release via `@octokit/rest` (needs `GITHUB_TOKEN` env var)
7. Checks out `development`, merges release branch, adds fresh `[Unreleased]` section, pushes

**Dependencies**: `semver` (version parsing), `simple-git` (git ops), `@octokit/rest` (GitHub releases), `keep-a-changelog` (changelog parser/writer).

**CI** (`.github/workflows/release.yml`): triggers on `v*` tags → builds APK + AAB → attaches both to the GitHub release. AAB is required for Google Play Store submission.

### Build/transform quirks

- `metro.config.js` adds a custom transformer for `.md` assets and adds `.sql` to `sourceExts` (paired with `babel-plugin-inline-import` in `babel.config.js` to inline SQL at build time); the reanimated metro wrapper is applied last.
- `babel.config.js`: `react-native-reanimated/plugin` must remain the last plugin in the list.
- `react-native.config.js` links custom font assets from `src/assets/fonts/` and `src/assets/icons/icomoon/fonts/`.
- Prettier is configured with tabs (`tabWidth: 4`), single quotes, and SQL-aware plugins (`prettier-plugin-sql` targets `sqlite` dialect) — run `yarn format` rather than hand-formatting SQL/embedded query strings.

# AGENTS.md

This file provides guidance to OpenCode when working with code in this repository.

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
yarn buildIcons       # regenerate the custom icon font from SVGs in src/assets/icons/
yarn publish         # release automation: bump versions, merge branches, create GitHub release
```

The pull request base/development branch is `development` (not `main`).

Drizzle (SQLite schema/migrations):
```bash
yarn drizzle-kit generate   # generate a new migration from schema changes (check drizzle.config.ts for invocation details)
```

## Architecture

### Redux store and the "feature" convention

`src/store/store.ts` wires together one reducer per slice in `src/features/`: `appearance`, `general`, `dbLoader`, `dirs`, `ui`, `dashboard`, `baseMap`, `drawers`, `routing`, `updater`, `lang`, `lines`. `devTools` is disabled (doesn't work in RN). A custom `listenerMiddleware` (`src/store/listenerMiddleware.ts`) is prepended before the serializability check middleware, since listener effects can carry functions — this is the mechanism for side effects like persisting to storage or reacting to other slices' state changes.

Each feature directory follows a consistent shape:

```
<feature>/
  index.ts              — registers extension points (implements AppFeature from src/types.ts)
  slice.ts              — Redux Toolkit slice
  selectors.ts          — state selectors
  types.ts              — feature-specific types
  connectStorage.ts     — persistence via react-native-default-preference
  assets/i18n/          — en/de/es/pt translation JSON
  dashboardWidgets/     — dashboard widget definitions
  drawerPanels/         — drawer panel definitions
  uiItems/              — UiItem components (settings pages, etc. Everything that can be fullscreen rendered by `UiItemComponent`)
  mapComponents/        — components rendered inside MapContainer
  appOverlays/          — components rendered as sibling overlays above the map
  components/           — shared/internal components (controls, modals, etc.)
  hooks/                — custom hooks
  db/                   — drizzle schema, actions, query functions
```

The `AppFeature` interface (`src/types.ts`) is the contract each feature exposes to the app shell: `selectInitialized`, `translation` (merged into i18next resources), an optional `initializeFromStorage(store)`, and an optional `onSetDbPath` thunk. Features also contribute to these extension points, all collected by the singleton `FeatureRegistry` and sorted by priority:

| Field(s) | Type | Directory | Rendered |
|---|---|---|---|
| `uiItems` + `settingsPageKeys` | `UiItem[]` | `uiItems/` | Navigation stack pages; only those whose key is in `settingsPageKeys` appear as rows in the main Settings list |
| `settingsControls` | `SettingsControlFragment[]` | (any) | Settings → Controls page |
| `dashboardWidgets` | `DashboardWidget[]` | `dashboardWidgets/` | Dashboard overlay on map |
| `drawerPanels` | `DrawerPanel[]` | `drawerPanels/` | Side drawers |
| `mapComponents` | `MapComponentDescriptor[]` | `mapComponents/` | Inside MapContainer |
| `appOverlays` | `AppOverlayDescriptor[]` | `appOverlays/` | Sibling overlays above map |

`AppThunk<T>` (defined in `src/store/store.ts`) is the standard thunk type across the codebase — use it instead of raw `ThunkAction`.

App init sequence (`src/store/utils.ts: initializeAppState`, invoked once at the bottom of `store.ts`): lang → dbLoader → updater → remaining features, each via their `initializeFromStorage`/storage-restore path. `src/components/App.tsx` blocks rendering of `AppView` until all features report initialized, the db has migrated, and the initial map position is resolved.

### Database layer (drizzle + op-sqlite + libspatialite)

The DB stack is new/in-progress (see recent commits around making `dbPath` dynamic). Key pieces:

- `drizzle.config.ts` discovers schema files via a glob across `src/features/*/db/schema/`, dialect `sqlite`, driver `expo`; migrations are emitted to `/drizzle/`.
- `src/features/dbLoader/DBConnection.ts` is a singleton wrapping the `@op-engineering/op-sqlite` connection and the drizzle ORM instance. It loads the `libspatialite` extension and runs migrations on `initialize(dbPath)`.
- Per-feature schemas live at `src/features/{lines,routing}/db/schema/schema.ts` and are aggregated in `src/features/dbLoader/schema.ts`. Spatial columns use custom `lineString()`/`point()` column types (geometry stored as LINESTRINGZ/POINTZ, SRID 4326) — see migration `0001_initSpatial.sql` for the libspatialite metadata bootstrap.
- Per-feature DB actions (CRUD via drizzle) live under `src/features/{lines,routing}/db/actions*.ts`.
- **Dynamic db path**: the path is stored in the `dbLoader` slice, persisted via `react-native-default-preference` (see `src/features/dbLoader/connectStorage.ts` and the analogous `src/features/dirs/connectStorage.ts`), and changing it currently requires telling the user to restart the app (per recent commit history) — features that care about the db path implement `onSetDbPath` on their `AppFeature`.

### Native Android bridge

Custom native modules live in `android/app/src/main/java/com/jhotadhari/straymap/`:
- `HelperModule.java` — exposes app directories (internal, external media/file/cache dirs) to JS and auto-creates the app's subdirectories (`dem`, `mapfiles`, `databases`, `mapstyles`, `export`, `marker`, `cursor`).
- `FsModule.java` — filesystem listing/info operations, with extension filtering (`MatchExtensionsPredicate.java`).
- `ReactNativePackage.java` — registers the native modules with React Native.
- `MainActivity.kt` / `MainApplication.kt` — standard RN entry points.

### Map and routing

- `react-native-mapsforge-vtm` (the map rendering library, this author's own package) provides `MapContainer` and related layer/event types; `src/components/AppView.tsx` composes it with drawers, dashboard, and cursor-center UI.
- `react-native-brouter` is consumed via `.yalc` (`file:.yalc/react-native-brouter` in `package.json` — a locally-linked package, not a registry release). Routing logic lives in `src/features/routing/utils.ts` (`getTrackFromParams`), which calls into brouter and flattens the resulting GeoJSON into coordinate arrays.
- The `routing` and `lines` slices are the two features backed by the SQLite/drizzle db (routes/points and lines/tags respectively).

#### Map position and altitude APIs

The library provides three tiers for consuming map position and one for altitude:

| Tier | API | Bridge crossings | React re-renders | Best for |
|---|---|---|---|---|
| Callback | `MapContainer.onMapUpdate` with `mapUpdateInterval` (ms, default 40) | ~25/sec (native→JS) | ~25/sec | Coordinate tracking, debug overlays, one-shot reactions |
| Shared values | `useMapPosition()` from `/reanimated` | 0 for reads (UI thread) | 0 | Smooth 60fps coordinate displays, worklet-driven overlays |
| Imperative | `useMap().getPosition()` | 2 per call (round-trip) | 0–1 | Button-triggered snapshots |
| Altitude | `useMap().getAltitudeAtPosition(lng, lat)` | 2 per call (round-trip) | 0–1 | Debounced center-altitude polling, tap-to-query, one-shot elevation lookups |

**`mapUpdateInterval`**: The prop on `MapContainer` (in `general` slice) controls the interval in milliseconds between `onMapUpdate` events. It was renamed from `mapEventRate` — the old name suggested Hz but the value is actually milliseconds.

**Altitude**: The `center` array in `MapEventResponse` is `[lng, lat]` when the HGT tile isn't cached, or `[lng, lat, altitude]` when the `ElevationReader` has the tile in its LRU cache — `MapFragment.getResponseBase()` queries elevation on every map update. `useMap().getAltitudeAtPosition(lng, lat)` is the explicit JS API; it runs on the Native Modules thread (not the render thread) to avoid map-movement jank. The native `ElevationReader` (LruCache-backed, 10-tile cap, ~29MB max) loads tiles on demand via a single-thread `PRELOAD_EXECUTOR` — cache-miss preloads triggered from the render-hot-path (`getResponseBase`) during rapid panning can overwhelm this executor.

**Removed props** (no longer exist on `MapContainer`):
- `hgtInterpolation` — bilinear interpolation is now always on
- `hgtReadFileRate` — rate-limiting is unnecessary with on-demand reads
- `hgtFileInfoPurgeThreshold` — replaced by Android's built-in `LruCache`

**DEM directory resolution**: `hgtDirPath` can be set at two levels: a global
default in the `baseMap` slice (`hgtDirPath`), and a per-layer override in each
hillshading layer's options. `LayerRendererHillshading` resolves via
`opts.hgtDirPath ?? appHgtDirPath`, rendering nothing when neither is set.
`HgtSourceRowControl` supports a `fallbackAppHgt` mode that offers a "Use
global" option driven by the store.

**`useMapPosition()`** from `react-native-mapsforge-vtm/reanimated`:
```typescript
const { centerSv, zoomSv, bearingSv, tiltSv, handleMapUpdate } = useMapPosition();
<MapContainer onMapUpdate={handleMapUpdate} ...>
```
`centerSv` is a `SharedValue<[number, number] | null>` readable from worklets at 60fps with zero bridge crossings.

### i18n

`src/assets/i18n/i18n.ts` configures i18next with `en`/`de` resources, falling back to `en`; `'system'` as a language selection resolves to the device locale. Each feature contributes its own translations via its `AppFeature.translation` export, merged into the i18next resources at init. Run `yarn sortI18n` (`scripts/sortI18n/index.js`) after editing any translation JSON — it keeps every language file's key order in sync with the fallback language, across both `src/assets/i18n/` and each feature's `assets/i18n/`.

### Script infrastructure

See `scripts/AGENTS.md` for an overview. Key scripts:

- `yarn sortI18n` — sort i18n JSON keys to match fallback language
- `yarn buildIcons` — rebuild custom icon font from SVGs in `src/assets/icons/`
- `yarn organizeImports` — organize imports into external/internal blocks

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

### Date/time formatting

- **`src/lib/dayjs.ts`** is the pre-configured dayjs singleton used throughout the app — always import from here instead of `import dayjs from 'dayjs'`. It extends `customParseFormat` and registers locale bundles for all `SUPPORTED_LANGUAGES` (`de`, `en`, `es`, `pt`) from `src/assets/i18n/constants.ts`. The `setDayjsLocale(lang)` export is called by `src/features/lang/connectStorage.ts` on every language change so that format tokens like `MMMM` / `dddd` render in the user's language. A dev-mode mismatching check warns when `SUPPORTED_LANGUAGES` and the loaded locale map drift apart.
- Date/time display format is user-configurable via `selectDateTimeFormat` (Redux `general` slice, default `YYYY-MM-DD HH:mm:ss`). Use `dayjs(value).format(dateTimeFormat)` wherever dates are rendered.
- `DateTimePickerControl` (`src/components/generic/controls/`) is the reusable date+time picker: `ButtonHighlight` opens `DatePickerModal`, confirm chains to `TimePickerModal`, combined result returned via `onUpdate`.

### Build/transform quirks

- `metro.config.js` adds a custom transformer for `.md` assets and adds `.sql` to `sourceExts` (paired with `babel-plugin-inline-import` in `babel.config.js` to inline SQL at build time); the reanimated metro wrapper is applied last.
- `babel.config.js`: `react-native-reanimated/plugin` must remain the last plugin in the list.
- `react-native.config.js` links custom font assets from `src/assets/fonts/`, `src/assets/icons/build/`, and the `font-gis` third-party font.
- Prettier is configured with tabs (`tabWidth: 4`), single quotes, and SQL-aware plugins (`prettier-plugin-sql` targets `sqlite` dialect) — run `yarn format` rather than hand-formatting SQL/embedded query strings.

### Import feature

`src/features/import/` imports GPX, KML, and GeoJSON files into the local
SQLite database. Full architecture in `src/features/import/AGENTS.md`.

Step flow: `idle → scanning/parsing → configuration → importing → result`.

### React Query `useMutation` pattern

When mutation callbacks need fresh context/Redux values on every render
but `useMutation` should see stable option references, use a ref updated
each render with stable `useCallback` wrappers:

```typescript
const mutationFnRef = useRef<() => Promise<void>>(async () => {});
mutationFnRef.current = async () => { /* fresh scope each render */ };
const onSuccessRef = useRef<(...args: any) => void>(() => {});
onSuccessRef.current = () => { /* fresh scope */ };

const mutation = useMutation({
    mutationFn: useCallback(async () => mutationFnRef.current(), []),
    onSuccess:   useCallback((data, vars, ctx) => onSuccessRef.current(data, vars, ctx), []),
});
```

Inline callbacks in `useMutation` options capture stale closure values
from the render they were created in. When Redux/context state changes
between renders, the callbacks won't see updated values. The ref pattern
ensures callbacks always read fresh state at invocation time. The same
pattern applies to `onMutate`, `onError`, and `onSettled` callbacks.

### Performance conventions

- **`useDirsInfo` array deps**: Pass `navDirs` and `extensions` via
  `useMemo` to prevent the effect from re-firing with new array
  references every render.
- **`Dimensions.get('window')`**: Always wrap in
  `useMemo(() => Dimensions.get('window'), [])` inside component bodies.
  A bare call recomputes on every render.

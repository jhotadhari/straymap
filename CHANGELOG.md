# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.4] - 2026-08-09

### Changed

- Upgrade `react-native-mapsforge-vtm` from `0.8.1` to `0.8.3`. Layer-order hardening: fixes z-order drift where shared `VectorLayer` paths could render behind raster tile layers due to incorrect indexing in the LIS-based `reorderMinimalMoves` algorithm.

## [0.3.3] - 2026-08-08

### Changed

- Upgrade `react-native-mapsforge-vtm` from `0.8.0` to `0.8.1`. Fixes the
  `strip-vtm-classes.gradle` script that resolves DEX duplicate-class errors
  on CI (fresh Gradle cache) when the extension's shadowed `LineBucket`/
  `RenderBuckets` classes collide with the vtm JAR's copies.
- Upgrade `react-native-mapsforge-vtm-ext-path-color-ramp` from `0.1.0` to
  `0.1.1`.

## [0.3.2] - 2026-08-08

### Fixed

- CI release workflow: commit icon build output so Metro can resolve glyph maps.

## [0.3.1] - 2026-08-08

### Fixed

- CI release workflow: bump Node.js from 22 to 24 for engine compatibility.
- Release config: set `github.attachment` to `false` so CI handles artifact uploads.

## [0.3.0] - 2026-08-08

Complete rewrite with no backwards compatibility to previous versions.  The app has been rebuilt around a spatial SQLite database and a Redux store with substantial performance improvements across the board, a new side-drawer panel system, and a new customizable dashboard.  New capabilities include BRouter offline routing, full line management with tags, and Lines and Tags data browsers.

### Added

- Feature-based plugin architecture — 14 production features each contributing UI items, drawer panels, dashboard widgets, map components, and app overlays via a shared `AppFeature` contract and priority-sorted `FeatureRegistry`.
- Redux Toolkit with 16 slices and a custom listener middleware for side-effect-driven persistence, state reactions, and cross-feature coordination.
- Spatial SQLite database layer with drizzle-orm, op-sqlite, and libspatialite — LINESTRINGZ/POINTZ geometry columns (SRID 4326), R*Tree spatial indexes, React Query caching (`staleTime: Infinity`), drizzle-kit migrations, and dynamic database path configuration.
- Centralized database error handling with `withDbErrorHandling` wrapper — try/catch + error toast + log across all DB actions.
- Line management — full CRUD for geographic lines with tags (many-to-many, cascade deletes), per-line colours, multi-column filtering, bulk actions, batch export to GPX/KML/GeoJSON, system-protected tags, and data-table browsers.
- BRouter offline routing — waypoint-based via `react-native-brouter` with per-point profile inheritance, segment-change optimization, DEM-based elevation enrichment, slope colour-ramp visualization, and route persistence across restarts.
- GPX/KML/GeoJSON import — multi-step wizard with single-file and batch-directory modes, date extraction from 18 preset filename patterns, title and tag extraction via regex, overwrite handling (create/skip/replace), dry-run preview, and background processing via foreground service.
- Shared foreground service — native `BackgroundTaskService` with thread-safe task registry, progress notifications, and auto-stop when idle.
- Side drawers — left/right panels with reanimated gesture handling, sortable drag-and-drop ordering, and programmatic expand/collapse.
- `BidirectionalScrollHost` — custom Fabric native view for simultaneous horizontal drawer drag and vertical list scrolling with native fling handling.
- Dashboard — configurable widget grid with drag-to-reorder editing, per-widget visibility/font/size/unit controls, and widgets for coordinates, altitude, and zoom level.
- Cache manager — lists all tile caches with sizes, per-layer associations, individual deletion, and sweep-all-unused action.
- App updater — version comparison on app start with plugin-style migration callbacks, downgrade detection, and splash-screen progress.
- Generic component library — controls (numeric, toggle, file-picker, colour, date-time), info-label wrappers, primitives (buttons, icons, badges, links), and layout wrappers (keyboard-avoiding modals, menus, lists).
- User-configurable date/time display format via Day.js singleton with locale bundles for all 4 languages.
- Native Android splash screen with dark/light theme variants and custom font title.
- Custom icon font with automated build pipeline (`yarn buildIcons`) plus third-party `font-gis` icon set.
- `yarn sortI18n` script keeping translation key order in sync across all languages.
- `yarn organizeImports` script sorting TypeScript imports into external/internal blocks.
- GitHub Actions CI/CD — builds APK+AAB on `v*` tags, signs with keystore secrets, attaches artefacts to the GitHub release.
- Release automation via `yarn publish` — bumps versions, generates semver-based `versionCode`, releases the changelog, creates GitHub release, merges to main/development.
- `PRIVACY.md` — permission disclosures, GDPR rights, data storage description, and contact info.

### Changed

- Architecture — restructured from flat component tree to self-contained feature modules, each with its own Redux slice, selectors, i18n, and extension-point registration.
- State management — introduced Redux Toolkit with 16 slices and listener middleware for side-effect coordination.
- Map rendering — migrated to `react-native-mapsforge-vtm` 0.8.0 with `useMapPosition()` Reanimated hook for 60fps coordinate reads at zero bridge cost, native GNSS filter on `MapContainer`, and DEM-based elevation enrichment.
- i18n — expanded to 4 languages (en, de, es, pt) with per-feature translation files.
- Performance — comprehensive `React.memo`/`useCallback`/`useMemo` sweep across all components. Per-line colour paint objects shared by reference (≤11 total). `BidirectionalScrollHost` native fling handling. `TextInputNativeMultiline` zero-layout-cycle auto-resize.
- UI — settings panels and modals rebuilt on the generic component library with `ModalWrapper` keyboard-avoidance and blur backdrop. Paper `Button` styling standardized via `useButtonProps` composable.
- Layers and profiles — sortable drag-and-drop lists with temp/commit editing to avoid map re-creation on every keystroke.
- Database — React Query `staleTime: Infinity` (no auto-refetch, only manual invalidation after writes). `withDbTransaction` for atomic multi-statement writes.
- Date/time — pre-configured Day.js singleton with user-configurable display format applied globally. Never bare `dayjs` imports.
- Android permissions — added foreground-service, location, and notification permissions; storage permissions capped at SDK 28.
- Build — `targetSdkVersion`/`compileSdkVersion` bumped from 34 to 36. `metro.config.js` transforms `.md`/`.sql` files. `babel-plugin-inline-import` for SQL. `drizzle.config.ts` auto-discovers schema files.
- Logging — centralized error handling with toast notifications, no bare `console` calls anywhere.

## [0.2.1] - 2025-04-06

### Changed

- Changed font: Use system font for normal text.

### Fixed

- Fix app doesn't start up on very first start of the app.
- Fix overlapping list items About page.
- Fix Dashboard out of viewport on some devices.
- Fix CacheManager: doesn't fetch directories on first expand.
- Fix *Edit mapsforge profile*: Cache renderStyles so they don't have to be parsed every time the Modal opens.

## [0.2.0] - 2025-04-05

In love with mountains.

### Changed

- Update `react-native-mapsforge-vtm` dependency, that uses `com.github.mapsforge.vtm` version `0.25.0` and all the new fancy hillshading features.
    - Hillshading is now much faster, stable and the generated tiles are more accurate.
    - Implemented all the new *Clear Asymmetry* shading algorithms that came with this update.
- Change the cache filename for `hillshading` layer: That makes previous caches obsolete.
- Elevation data can now be interpolated. And reading the DEMs is now multithreaded, better performance and doesn't block the UI.
- Change *Digital Elevation Model* Control
    - Move it to *General Settings*
    - Add settings for *Interpolate Elevation* and *DEM in Memory*
- Add `CacheManager`: Displays all cache directories, their sizes and allows to delete them.
- DashboardControl *Map Center Altitude*: Add warning if *Digital Elevation Model* is unset.
- Add more info texts.

### Removed

- Remove built in mapsforge themes `MOTORIDER_DARK` and `OSMAGRAY`. Because they are not existing anymore in latest version of `com.github.mapsforge.vtm`.

### Fixed

- Fix some weird zoom changes when the app is storing the current map position.
- Fix Unhandled SoftException com.facebook.react.bridge.ReactNoCrashSoftException
- Fix possible NullPointerException on non existing externalCacheDir
- Small UI fixes: Some buttons or options-drop-down where out viewport.

## [0.1.0] - 2025-03-26

### Added

- Add Opacity setting for map layer `online-raster-xyz`.
- Add *Mapsforge General Settings* to *Settings / Maps*. To control `lineScale`, `textScale` and `symbolScale` of all mapsforge layers. Changes require a restart of the app.
- Added new mapsforge-profile settings, whether to show buildings and labels or not.
- Add some debug/commit information to *About* page in app debug mode.
- Update routine on app start. Compares current version with last installed version and maybe run several updates until the settings structure meets the structure of the current version.
- More source options for layer `online-raster-xyz`:
    - *Esri World StreetMap*
    - *Esri World TopoMap*
    - *Esri World GrayCanvas*
    - *Esri World Terrain*
    - *Esri World ShadedRelief*
    - *Esri World Physical*
    - *Esri Ocean Basemap*
    - *Esri NatGeo World Map*
    - *Google Hybrid*
    - *Google Satellite*
    - Rename *Google Maps* to *Google Road*

### Changed

- Each cache has its own directory now. Makes it easier to control the size and clear each cache individually. The old cache directory and files are obsolete now.
- Option to select the cache base-directory for each layer that supports caching. Options include the internal cache directory and the external directories.
- Some info texts and added more external download links.

### Fixed

- File picker controls should search recursive in nested directories.
- Save map position and zoom level every half minute.

## [0.0.2] - 2025-03-19

Basic app structure and map viewer functionality.

### Added

- Logo and design with multiple themes.
- Multilingual.
- Map viewer with different layers that can be stacked on top of each other.
- Layers: `online-raster-xyz`, `mapsforge`, `raster-MBtiles`, `hillshading`.
- Dashboard with different elements.
- Topbar with breadcrumbs and a menu.
- Structure for settings and some settings pages.

[Unreleased]: https://github.com/jhotadhari/straymap/compare/v0.3.4...HEAD
[0.3.4]: https://github.com/jhotadhari/straymap/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/jhotadhari/straymap/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/jhotadhari/straymap/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/jhotadhari/straymap/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/jhotadhari/straymap/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/jhotadhari/straymap/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/jhotadhari/straymap/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/jhotadhari/straymap/compare/v0.0.2...v0.1.0
[0.0.2]: https://github.com/jhotadhari/straymap/releases/tag/v0.0.2

# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/jhotadhari/straymap/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/jhotadhari/straymap/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/jhotadhari/straymap/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/jhotadhari/straymap/compare/v0.0.2...v0.1.0
[0.0.2]: https://github.com/jhotadhari/straymap/releases/tag/v0.0.2

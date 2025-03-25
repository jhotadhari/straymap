# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]
### Added
- *Mapsforge General Settings* to *Settings / Maps*. To control `lineScale`, `textScale` and `symbolScale` of all mapsforge layers. Changes require a restart of the app.
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
- Some info texts and added more external download links.

### Fixed
- File picker controls should search recursive in nested directories.

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

[Unreleased]: https://github.com/jhotadhari/straymap/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/jhotadhari/straymap/releases/tag/v0.0.2

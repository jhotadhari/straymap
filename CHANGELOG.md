# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]
### Added
- *Mapsforge General Settings* to *Settings / Maps*. To control `lineScale`, `textScale` and `symbolScale` of all mapsforge layers. Changes require a restart of the app.
- Add some debug/commit information to *About* page in app debug mode.

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

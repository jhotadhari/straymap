# Privacy Policy

*Last updated: 2026-08-07*

## Overview

Straymap is designed with privacy as a core principle. It contains **no trackers**
of any kind. All data stays on-device — nothing is collected, uploaded, or
shared with third parties.

## Data Controller

The developer of Straymap is the data controller. Contact:
<straymap@waterproof-webdesign.de>.

## What Data We Collect

Straymap does **not** collect, store on remote servers, or transmit any personal
data. All information you create or import (GPS tracks, routes, imported line
data, user preferences) is stored exclusively in local files and a local SQLite
database on your device.

## Permissions

The app declares the following Android permissions. Each is required for a
specific feature and none are used for tracking or advertising.

| Permission | Purpose |
|---|---|
| `INTERNET` | Required only for the optional `online-raster-xyz` map layer. If you configure an online tile source, the app fetches raster tiles from that URL. Without this permission, the app works entirely offline. |
| `ACCESS_FINE_LOCATION` | Used to display your current position on the map and to record GPS tracks (if you start a recording). Location data never leaves your device. |
| `ACCESS_COARSE_LOCATION` | Fallback for approximate device location when fine location is unavailable or not granted. |
| `FOREGROUND_SERVICE` | Required by Android for apps that need to continue work while not in the foreground. |
| `FOREGROUND_SERVICE_LOCATION` | Required to access location while a foreground service is active (e.g., recording a GPS track with the screen off). |
| `FOREGROUND_SERVICE_SPECIAL_USE` | Used by the `BackgroundTaskService` for importing geospatial data files (GPX, KML, GeoJSON) and recording GPS tracks. Android requires a visible, non-dismissible notification for any foreground service. |
| `POST_NOTIFICATIONS` | Required on Android 13+ to show the notification associated with foreground services. No other notifications are sent. |
| `READ_EXTERNAL_STORAGE` | Required only on Android 9 (SDK 28) and below to read map files, elevation data, and render styles from shared storage. On Android 10+ the app uses scoped storage, which does not require this permission. |
| `WRITE_EXTERNAL_STORAGE` | Required only on Android 9 (SDK 28) and below to export data (e.g., GPX files) to shared storage. On Android 10+ the app uses scoped storage. |

## Third-Party Services

The app works entirely offline by default. The only third-party network
interaction occurs when you explicitly enable the `online-raster-xyz` map layer
and configure a tile server URL. In that case:

- Tile requests (HTTP/HTTPS) are sent to the server you specify.
- Any HTTP request inherently transmits your IP address to the target server —
  this is a technical requirement of the protocol and is not under the app's
  control.

The app does **not** integrate any third-party analytics, crash-reporting, or
advertising SDKs.

## In-App Package Queries

The app declares a `<queries>` element for `btools.routingapp` (the BRouter
companion app). When you use the routing feature, Straymap sends waypoints
to the BRouter engine and receives the calculated route back. All data
exchange happens locally on-device between the two apps — no route data is
sent to remote servers by Straymap or BRouter.

## Where Data Is Stored

All app data resides exclusively on your device.

- **Map files, elevation models, and render styles**: Straymap does not generate
  these — you download them externally and place them yourself. Stored under the
  app's directories on shared/external storage. The media directory is
  recommended.
- **GPS tracks, routes, imported line data**: stored in a local SQLite/spatialite
  database under the app's internal storage by default. You may optionally
  configure the database location to use other app directories, including the
  public media directory.
- **User preferences**: stored using Android's `SharedPreferences` via
  `react-native-default-preference`.

### Caches

The app maintains temporary caches on disk to improve map rendering
performance:

- **Hillshading raster tile cache**: generated hillshading raster tiles are
  cached on disk for faster reloading.
- **XYZ raster tile cache**: if you use the `online-raster-xyz` layer,
  downloaded raster tiles are cached on disk for faster reloading.

The app provides a cache manager (in Settings → Maps) that lists all caches
with their sizes and allows you to clear them individually or sweep all unused
caches at once.

## Your Rights (GDPR)

Under the GDPR, you have the right to access, rectify, and erase your personal
data. Since Straymap stores all data exclusively on your device:

- **Access**: All your data is accessible through the app itself (tracks, routes,
  imported files) or directly on your device's filesystem.
- **Rectification**: You can edit or delete data within the app at any time.
- **Erasure**: Uninstalling the app and deleting its data directories removes all
  data. The app does not retain any data on remote servers.
- **Data portability**: You can export your data as GPX, KML, or GeoJSON files
  through the app.

There is no server-side data, so there are no server-side copies to request.

## Children's Privacy

Straymap does not knowingly collect data from children under 13. The app
contains no user accounts, no sign-in, and no age-gated features.

## Changes to This Policy

This privacy policy may be updated. Changes will be reflected in this document.
Significant changes will be noted in the app's changelog.

## Contact

- **Bug reports & feature requests**: [GitHub Issues](https://github.com/jhotadhari/straymap/issues)
- **Questions & discussions**: [GitHub Discussions](https://github.com/jhotadhari/straymap/discussions)
- **Private inquiries**: <straymap@waterproof-webdesign.de>

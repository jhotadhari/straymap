# mapContextMenu feature

Tap/long-press context menus on the map, with actions contributed by
other features via the `mapContextMenuSources` extension point.

## Architecture

- **`controller.ts`** — module-level event hub (no Redux): `emitMapContextMenu`
  / `subscribeMapContextMenu` for press events, plus a share-position store
  (`openSharePosition(lng, lat, zoomLevel?)` / `subscribeSharePosition`).
  Menu state is transient UI state and intentionally not persisted.
- **`MapContextMenuOverlay.tsx`** — the `appOverlays` entry (priority 1000,
  rendered above map and drawers). On a press it mounts the registered
  sources, collects their option groups, and renders a plain View-based
  menu (no Modal popover — opens instantly, no animation) at the tap
  position, with dividers between groups and edge clamping. When no source
  resolves options, the menu is suppressed entirely.
- **`SharePositionModal.tsx`** — share modal for the long-press "Share
  position" action. Lists value rows (disabled text field + copy/share
  `IconButtonHighlight`s): coordinates in the user's configured format,
  plain decimal coordinates, and map links (OSM, OpenTopoMap, Google Maps,
  Organic Maps, OsmAnd, geo URI). Copy uses `@react-native-clipboard/clipboard`
  (icon swaps to a check for ~1.5s), share uses RN core `Share.share`.
- **`shareRows.ts`** — pure `buildShareRows(lng, lat, zoomLevel, unitPref,
  t)` row builder (unit-tested in `__tests__/shareRows.test.ts`). Falls
  back to `DEFAULT_SHARE_ZOOM` (18) when no zoom was captured.
- **`mapContextMenuSources/MapGeneralSource.tsx`** — the feature's own
  long-press source (general map actions). Future slots: add waypoint,
  measure distance.

## Extension point

`AppFeature.mapContextMenuSources: MapContextMenuSource[]` —
`{ key, press: 'short' | 'long', SourceComponent }`. Collected by
`FeatureRegistry.getMapContextMenuSources()` in registration order (group
order = divider order).

A `SourceComponent` receives `{ context, onOptions }`:

```ts
interface MapContextMenuContext {
	press: 'short' | 'long';
	lng: number; lat: number;      // tap geo position
	x: number; y: number;          // tap position (physical px, map-local)
	windowX: number; windowY: number; // tap position (window dp) — overlay anchoring
	zoomLevel?: number; tileSize?: number; // live map state for zoom-aware resolution
	hits: MapTapHit[];             // library hit-aggregation (paths/shapes/markers/…)
}
```

The source resolves its options with hooks and reports them via
`onOptions(options | null)` in an effect (null = group omitted). `onOptions`
is stable per source (memoized `SourceHost`), and the overlay compares
reports by key/cb identity — sources must keep their callbacks stable
(see the ref pattern in `routing/hooks/usePointActions.ts`), otherwise the
update loop protection will churn.

## Sources (registered by features)

| Source | Press | Feature | Actions |
|---|---|---|---|
| `routingMoving` | short | routing | Drop point here, Discard moving (overrides all while `movedPointId` is set) |
| `routingWaypoint` | short | routing | Move point, Delete point |
| `routingSegment` | short | routing | Cut segment (disabled when a waypoint is under the tap) |
| `routingMap` | short | routing | Append routing point (empty map) |
| `linesLine` | long | lines | Route details, Fly to, Change color, Remove from map (color/remove disabled for system lines) |
| `mapGeneral` | long | mapContextMenu | Share position (opens `SharePositionModal` with lng/lat/zoomLevel) |

## Correlation with tapped entities

Layer hits carry native entry uuids. Features maintain uuid → entity maps
fed by `onCreate`/`onRemove` callbacks in their map components:
`routing/layerRegistry.ts` (segments + markers),
`lines/layerRegistry.ts` (LayerPath entries). The routing sources also
fall back to screen-distance (dp) resolution from the finger position via
`getNearestPointHitAtTap` (30 dp, zoom-aware) — independent of the native
hit payload.

## Wiring

`AppView.handleMapPress` (tap + long-press) parses the library's
`hits` JSON, computes `windowX/windowY` via `measureInWindow` of the map
wrapper, and emits through the controller. Drawer-close behavior on map
presses lives in the same handler.

## Deferred / TODOs

- Waypoint feature ("Add waypoint here" action) — future, DB-backed like lines
- Measure-distance action in the general long-press menu
- Long-press feature-specific menus (hits are already in the payload)
- Marker finger-drag gestures

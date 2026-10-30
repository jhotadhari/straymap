# Lines feature

Tracks and routes stored in the local SQLite database, rendered on the
map via `react-native-mapsforge-vtm`. Each line has a GeoJSON LineString
geometry, an envelope (bounding box computed by SpatiaLite), optional
title and tags, and cached statistics.

## Data model

```
Line {
  id: number;            // autoincrement PK
  title: string | null;
  geometry: LineString;  // GeoJSON LineString (SRID 4326, LINESTRINGZ)
  envelope: Polygon;     // GeoJSON Polygon from ST_Envelope()
  created_at: string;    // ISO-8601, default current_timestamp
  modified_at: string;   // ISO-8601, default current_timestamp
  custom_date: string | null;  // ISO-8601, default current_timestamp
  tags: Tag[];           // many-to-many via tagsToLinesTable
  data: any;             // arbitrary JSON (import metadata etc.)
  stats: LineStats;      // Partial<{ length, uphill, downhill, minZ, maxZ }>
}
```

`LinePartial` is `WithRequired<Partial<Line>, 'id'>` — all fields optional
except `id`. Used by most queries because geometry is fetched separately via
`['lineGeom', lineId]` for map rendering.
**Envelope is included in both** — `envelope` is computed at query time via
`ST_Envelope()` (no physical column), and it's part of the default field set.
Queries that use `fieldsExclude: ['geometry']` still return `envelope` because
only `geometry` is excluded, not `'envelope'`.

## Redux state (`lines/slice.ts`)

```ts
LinesState extends SliceSettingsBase, LinesSettings {
  // From SliceSettingsBase:
  initialized: boolean;
  // LinesSettings:
  selected: number[];                              // line IDs currently on the map
  tagBadgeMode: 'outlined' | 'contained';         // badge visual style
  linesTable: LinesTableSettings;                 // columns, sort, filters, filterLogic
  tagsTable: TagsTableSettings;                   // columns, sort, filters, filterLogic
  lineColors: Record<number, string>;             // lineId → palette hex colour (persisted)
  lineRamps: Record<number, RampKey>;            // lineId → user-assigned ramp kind, 'slope' (persisted)
  lineWidth: number;                             // stroke width (dp) for all ordinary lines (persisted, clamped)
  // LinesState only:
  lineTemp?: LinePartial;                         // draft being edited in LineEditModal
  tagTemp?: { id: number; ... } | null;           // draft tag being edited
}
```

### Key thunks

| Thunk                                | What it does                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `setLineSelected(id, isSelected?)`   | Toggle-adds/removes a single line from `selected[]`                                  |
| `setLinesSelected(newIds: number[])` | Bulk-replaces `selected[]` (no-op if unchanged)                                      |
| `toggleLinesSort(columnKey)`         | Toggle sort direction or switch to a new column                                      |
| `toggleTagsSort(columnKey)`          | Same for the tags table                                                              |
| `randomizeLineColors(lineIds)`     | Assigns random `PALETTE_COLORS` to the given lines, avoiding same-adjacent-colour |
| `setLinesColor(color, lineIds)`    | Sets the given lines to the same palette colour                                    |
| `setLinesWidth(width)`             | Sets the shared ordinary-line stroke width (clamped)                               |
| `onSetDbPath()`                    | Clears `selected[]` when the db path changes (user must restart)                   |

### Key reducers (also exported as actions)

| Reducer              | What it does                                         |
| -------------------- | ---------------------------------------------------- |
| `setLineTemp(line?)` | Sets/clears the draft line being edited in the modal |
| `setTagTemp(tag?)`   | Sets/clears the draft tag being edited               |
| `upsertLinesFilter`  | Add or merge a filter on the lines table             |
| `removeLinesFilter`  | Remove a single filter from the lines table          |
| `resetLinesFilters`  | Clear all line filters                               |
| `upsertTagsFilter`   | Add or merge a filter on the tags table              |
| `removeTagsFilter`   | Remove a single filter from the tags table           |
| `resetTagsFilters`   | Clear all tag filters                                |
| `setLineColor`       | Set the palette colour for one line                  |
| `setLineColors`      | Bulk-set palette colours for multiple lines          |
| `removeLineColors`   | Remove colour entries for given line IDs             |
| `setLineWidth`       | Set the shared ordinary-line stroke width (clamped)  |
| `setLineRamp`        | Assign a ramp kind (or `null` to clear) for one line |
| `setLineRamps`       | Bulk-replace the lineRamps record (storage restore)  |
| `removeLineRamps`    | Remove ramp entries for given line IDs               |

### Key selectors

| Selector                  | Returns                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `selectSelected`          | `number[]` (deduplicated in reducer)                          |
| `selectLineTemp`          | `LinePartial \| undefined`                                    |
| `selectTagTemp`           | `{ id, label?, notes?, data? } \| null \| undefined`          |
| `selectTagBadgeMode`      | `'outlined' \| 'contained'`                                   |
| `selectLinesTableColumns` | `TableColumn[]` (auto-adds new columns, removes removed ones) |
| `selectLinesSort`         | `SortState \| null`                                           |
| `selectLinesFilters`      | `ColumnFilter[]`                                              |
| `selectLinesFilterLogic`  | `'and' \| 'or'`                                               |
| `selectTagsTableColumns`  | `TableColumn[]` (same auto-sync behavior)                     |
| `selectTagsSort`          | `SortState \| null`                                           |
| `selectTagsFilters`       | `ColumnFilter[]`                                              |
| `selectTagsFilterLogic`   | `'and' \| 'or'`                                               |
| `selectLineColors`        | `Record<number, string>` (lineId → hex colour)                |
| `selectLineColor(lineId)` | `string \| undefined` (single line's colour)                  |
| `selectLineRamps`         | `Record<number, RampKey>` (lineId → user-assigned ramp kind)  |
| `selectLineWidth`         | `number` (shared ordinary-line stroke width)                  |

## React Query layer

Query families and helpers defined in `db/queryFns.ts`:

| Query key                                           | fetcher                   | What it returns                                               |
| --------------------------------------------------- | ------------------------- | ------------------------------------------------------------- |
| `['lines']` / `['lines', ids]` / `['lines', { … }]` | `queryLinesWithoutGeom`   | `LinePartial[]` (no geometry, **includes envelope**, no tags) |
| `['lineGeom', lineId]`                              | `queryLineGeom`           | Single line with geometry + envelope, no tags                 |
| `['lineGeomsBatch', ids, simplify, bbox]`           | `queryLineGeomsBatch`     | Batch geometry fetch with spatial MbrIntersects pre-filter    |
| `['tags']`                                          | `queryAllTags`            | `Tag[]`                                                       |
| `['tagsTable']` / `['tagsTable', { … }]`            | `queryTagsWithLineCounts` | `(Tag & { line_count })[]`                                    |

### Global defaults (set in `dbLoader/DBConnection.ts`)

`staleTime: Infinity` — never auto-refetches. Must manually `invalidateQueries`
after writes. Individual queries can override this (e.g. `FilterTagsModal` uses
`staleTime: 0`).

`gcTime: 0` — cache is cleared when the last observer unmounts. Most queries
override this to longer values (`1000 * 60 * 5` for tables, `1000 * 10` for
map views) to keep data alive across component mounts.

### Invalidation / cancellation helpers

Also in `queryFns.ts`:

| Helper                          | Purpose                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| `invalidateLinesQueries(qc)`    | Invalidate + refetch all `['lines', …]` queries              |
| `invalidateLineGeomQueries(qc)` | Invalidate all `['lineGeom', …]` and `['lineGeomsBatch', …]` |
| `invalidateTagsTable(qc)`       | Invalidate + refetch all `['tagsTable']` queries             |
| `cancelLinesQueries(qc)`        | Cancel in-flight `['lines', …]` queries (use in `onMutate`)  |
| `cancelLineGeomQueries(qc)`     | Cancel in-flight `['lineGeom', …]` / `['lineGeomsBatch', …]` |

Places that create/update/delete lines MUST call `invalidateLinesQueries` AND
`invalidateLineGeomQueries`. Tag changes also need `invalidateTagsTable`.

## Selection / "on map" flow

Two paths converge on Redux `state.lines.selected`:

### Path A: AppView (lines not in table)

```
User selects line → dispatch(setLineSelected(id, bool)) → Redux updated directly
```

### Path B: LinesTable (lines in table view)

```
User toggles row checkbox → setOnMapIdsTemp(local state) → row re-renders
  … user may toggle many lines …
LinesTable unmounts → cleanup effect → dispatch(setLinesSelected(onMapIdsTemp)) → Redux
```

The **local `onMapIdsTemp`** buffer allows instant UI feedback without a
Redux dispatch per toggle. The flush happens once on unmount.

### Consumers of Redux `selected`

- **LinesMapView** — renders `<LayerPath>` for each selected line
- **DrawerTopBar** — shows count of selected lines
- **SelectedLinesList** — list of selected lines with visibility toggles
- **LineEditModal rows** — `RowToggleOnMap` reads `selectSelected` to show dynamic label

## LineEditModal

Rendered by two `LineEditModalWrapper` components:

- `/components/LineEditModalWrapper.tsx` — standalone wrapper for non-table
  contexts (DrawerTopBar, SelectedLinesList). Calls `dispatch(setLineSelected)` directly.
- `LinesTable.tsx` (local `LineEditModalWrapper`) — table-context wrapper that
  updates both `onMapIdsTemp` (local state) and Redux, plus cleans up
  `checkedIds` on delete via `onDeleteSuccess`.

Opens when `lineTemp` is set (via `dispatch(setLineTemp({ id }))`).

### Context (`LineEditModalContext`)

```
{
  line?: LinePartial | null;     // from ['lines', [lineId]] query
  route?: Route | null;          // from ['routeForLine', lineId] query
  selectLine: (id, isSelected) => void;  // updates both onMapIdsTemp and Redux
  onDismiss: () => void;         // saves changes or clears lineTemp
  onDeleteSuccess?: (lineId?) => void;   // cleans up checkedIds in table
}
```

### Rows (in render order)

| Row              | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| `RowName`        | Edits line title (dispatches `setLineTemp`)                |
| `RowTags`        | Manage tags attached to this line (add/remove)             |
| `RowCustomDate`  | Edit the `custom_date` field                               |
| `RowFlyTo`       | Smooth fly to line's bounding box (disabled if not on map) |
| `RowToggleOnMap` | Toggle line visibility with dynamic icon/label             |
| `RowRouting`     | Load/activate routing for this line                        |
| `RowStats`       | Show aggregated statistics                                 |
| `RowApplyDem`    | Apply DEM elevation data (disabled for system lines)       |
| `RowExport`      | Export to GPX/KML/GeoJSON via shared 3-phase modal         |
| `RowDelete`      | Delete single line with confirmation modal                 |

## Bulk actions (`LinesTable/useBulkActions/`)

Each action is a hook returning `MenuActionOption { key, cb, label, leadingIcon, modalNode? }`.
All return values are memoized with `useMemo`. The aggregator (`index.ts`) composes them
into a `Record<string, MenuActionOption>` — also memoized.

| Action          | Hook               | Modal? |
| --------------- | ------------------ | ------ |
| Show on map     | `useAddToMap`      | No     |
| Remove from map | `useRemoveFromMap` | No     |
| Fly to          | `useFlyTo`         | No     |
| Add tag         | `useAddTag`        | No     |
| Remove tag      | `useRemoveTag`     | No     |
| Export          | `useExport`        | Yes    |
| Show stats      | `useShowStats`     | Yes    |
| Delete lines    | `useDeleteLines`   | Yes    |

### Consumer memo chain

```
useBulkActions() → useMemo'd Record
  → BulkActions.tsx: useMemo(Object.values(actions))
    → PopoverMenuItems (React.memo'd) → PopoverMenuItem (React.memo'd)
```

`Object.values()` is memoized so the `React.memo` on `PopoverMenuItems` can
actually bail out of re-renders when the underlying action objects haven't
changed.

## Export

Shared hook `hooks/useExportCbModal.tsx` handles both single-line and bulk export.
Follows the `useDeleteLinesCbModal` pattern — returns `{ cb, modalNode }`.

### Consumers

| Consumer    | Location                                  | Hook call                                        |
| ----------- | ----------------------------------------- | ------------------------------------------------ |
| Single line | `LineEditModal/RowExport.tsx`             | `useExportCbModal({ type: 'single', line })`     |
| Bulk lines  | `LinesTable/useBulkActions/useExport.tsx` | `useExportCbModal({ type: 'bulk', checkedIds })` |

### Modal phases

| Phase        | Content                                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'format'`   | Radio buttons (GPX/KML/GeoJSON) + "Export" button                                                                                                     |
| `'progress'` | `LoadingIndicator` + text (single: `lines.exporting`, bulk: `lines.exportProgress` "Exporting X of Y...") + (bulk) "Stop" button with `isDestructive` |
| `'result'`   | Icon (check/warning/error) + summary header + file-paths list. Dismissable via backdrop or back arrow — no explicit button needed                     |

`dismissDisabled={true}` during `'progress'` — backdrop tap and back arrow blocked.
The "Stop" button sets a `stoppedRef` flag; bulk write loop checks it between batches
(20 files per `Promise.allSettled` chunk) and transitions to result with the partial
written-files list.

### Error reporting

All outcomes shown inline in the result phase — no `ErrorToastContext` / `showError`
calls. Result paths:

- **No geometry**: `exportNoGeom`
- **Permission denied**: `exportPermissionDenied`
- **All success**: `exportSuccess` ("Exported X of Y routes.") + full file-paths list
- **Partial**: `exportPartial` ("Exported X of Y routes. Failed: …") + failed paths
- **All failed**: `exportNoFilesWritten`
- **Stopped**: `exportStopped` ("Stopped. Exported X of Y routes.") + written paths
- **Generic error**: `errorGeneric`

### Date field

Filenames use `custom_date` with fallback to `created_at`. The default template is
`{{title}}_{{id}}_{{custom_date}}` (`utils/filenameTemplate.ts`). GeoJSON metadata
`timestamp` property also uses the resolved date.

## Filters

Column filters for LinesTable and TagsTable. Full architecture
documented at [`components/FilterModals/AGENTS.md`](components/FilterModals/AGENTS.md).

Key points:

- **Numeric/date filters merge per column** — at most one filter per
  column, displayed as a single range badge.
- **String/tags filters coexist** — multiple filters per column with
  different operator/value combos.
- **All string/tags values normalized to lowercase** at input, Redux
  upsert, and SQL levels.
- **Conflict detection** surfaces impossible filter combinations as a
  warning icon in the table header.

## Per-line colours

Line stroke colours are stored in Redux (`lineColors: Record<number, string>`),
NOT in the database. The key maps `lineId` to a hex colour from
`PALETTE_COLORS` (defined in `src/constants.ts`). Persisted via
`connectStorage`.

User-assigned colour ramps (`lineRamps: Record<number, RampKey>`,
`RampKey = 'slope'`) are the Redux counterpart that switches a line to
ramp rendering instead of the palette colour — also persisted, and never
written to the DB. The lines feature registers them via its own
`AppFeature.selectLineColorRamps` (`LINE_RAMPS` in `index.ts`, mapping
`slope` → the routing feature's `SLOPE_COLOR_RAMP`), merged with
feature-declared ramps by `FeatureRegistry.getLineColorRamps()`. There
is deliberately **no bulk ramp action** — every ramp line costs its own
`linePathCoords` query + native color-ramp layer, so ramps are only
assigned per line.

### LinesMapView

`LinesMapView` subscribes to `selectLineColors` and `selectLineWidth`. A
`useMemo`'d `Map<colorHex, paintObject>` (at most 11 entries — 10 palette
+ 1 default `PALETTE_COLORS[0].bg`) caches paints by colour; each paint
carries the shared `lineWidth` (default `DEFAULT_LINE_WIDTH`), rebuilt when
`lineWidth` changes. Each `<LayerPath>` looks up its line's paint via
`paintByColor.get(lineColors[lineId] ?? FALLBACK_COLOR)`. Paint objects are
shared when colours repeat, so per-line colour has no per-element allocation
cost. Stroke width is shared across all ordinary lines (not per-line).

### ListRow colour column

The colour column (`colorColumnInner`) in `ListRow` shows a vertical
2px-wide bar. Background reads from Redux: `lineColors[line.id]` fallback
`PALETTE_COLORS[0].bg`. Tapping opens a `Popover` (raw `react-native-popover-view`,
no placement — auto-positions) with one `MenuItem` per palette colour
showing an unlabelled coloured circle. Selecting dispatches
`setLineColor({ lineId, color })` and clears any ramp
(`setLineRamp(…, null)`).

Lines rendered with `LayerPathColorRamp` instead show a multi-coloured
legend column: `ListRow` reads the aggregated per-line ramp declarations
(`useLineColorRamps()` → `FeatureRegistry.getLineColorRamps()`, fed by
each feature's `AppFeature.selectLineColorRamps`) and renders
`ColorRampColumn` — a vertical `react-native-svg` gradient whose stop
offsets are normalized in the ramp's effective value domain (percent
stops converted to degrees first, mirroring `usePathColorRamp`).

The popover is fully disabled only for **system lines** (feature-rendered,
no user colour controls). For non-system lines it additionally offers a
"Slope color ramp" `MenuItem` (gradient thumbnail, `active` when ramped)
that toggles `setLineRamp`; the item is hidden when the line has no
elevation (`stats.minZ == null`) and no active ramp — slope colouring is
meaningless without Z.

### Ramp-rendered lines (LinesMapView)

Non-system selected lines with a registered colour ramp are excluded
from the solid `LayerPath` batch and rendered as `LayerPathColorRamp`
via the memoized `LineColorRampPath` subcomponent (slope metric,
`calculateSlope` + `usePathColorRamp`, `strokeWidth` 6 — matching the
routing ramp). Geometry comes from the per-line `['linePathCoords',
lineId]` query (turf-simplified at fixed tolerance 0.00004, Z-preserving,
cache-shared with the chart feature), not from `lineGeomsBatch` — the
zoom-dependent DB simplification would drop Z and re-trigger slow ramp
re-renders. Uuids still register in `linesLayerRegistry`, so context-menu
hit resolution works unchanged. System lines with a ramp (the routing
line) render themselves — their declaration only drives the list legend.

## DrawerTopBar actions popover

Follows the same `useActions` aggregator pattern as
`RoutingActionsButton` (`src/features/routing/components/DrawerTopBar/useActions/`).

### Files

```
DrawerTopBar/
├── DrawerTopBar.tsx           # calls useActions, renders LinesActionsButton
├── LinesActionsButton.tsx     # tri-mode Popover (actions ↔ colour palette ↔ width picker)
└── useActions/
    ├── index.ts               # aggregator → { showStats, ordinary[], ordinaryCount, ordinaryLineIds }
    ├── useActionClearLines.tsx # confirmation modal → setSelected(system-only IDs)
    ├── useActionRandomizeColors.tsx # dispatches randomizeLineColors(ordinaryLineIds)
    ├── useActionSetEqualColors.tsx  # switches popover to colour-picker mode
    ├── useActionSetLineWidth.tsx    # switches popover to width-picker mode
    └── useActionShowStats.tsx       # aggregated-statistics modal
```

### LinesActionsButton tri-mode popover

Uses a raw `Popover` (not `ButtonHighlightMenuControl`) because the popover
must stay open and swap between three content sets:

1. **Actions menu**: `showStats` (applies to every selected line) followed by
   a `Divider`, a heading `lines.ordinaryRoutes` ("Ordinary routes %d", where
   `%d` is `ordinaryCount`), then the ordinary-only actions
   (`setLineWidth`, `randomizeColors`, `setEqualColors`, `clearLines`) — each
   disabled when `ordinaryCount === 0`.
2. **Colour picker** (10 items): one per `PALETTE_COLORS`, unlabelled circles.
3. **Width picker**: a vertical `LineWidthControl` menu of preset widths
   (`LINE_WIDTH_MIN`..`MAX` in `LINE_WIDTH_STEP` half-steps — 15 items from
   1..8), the current width marked `active` and the default (`DEFAULT_LINE_WIDTH`)
   suffixed with `lineWidthDefaultSuffix`. Tapping an entry dispatches
   `setLinesWidth(width)`.

"set equal colours" / "set line width" set `colorPickerActive` /
`widthPickerActive` without closing the popover. Selecting a colour calls
`handleColorSelect` which dispatches `setLinesColor(color, ordinaryLineIds)`;
applying a width dispatches `setLinesWidth(width)` — both then `dismissMenu()`.

Button styling is shared with the "Lines browser" button via `buttonProps`
typed as `ReturnType<typeof useButtonProps>` (destructured from
`nestedIconColor`). `paddingHorizontal` is toggled dynamically via
`onLayout` overflow detection: if both buttons don't fit in the row,
`contentFits` flips to `false` (one-way), removing horizontal padding.

## Gotchas

- **Bulk delete must update Redux**: `useDeleteLines.onSuccess` dispatches
  `setLinesSelected(without(selectedIds, ...checkedIds))` to immediately sync
  Redux after DB deletion. Without this, the map and DrawerTopBar show stale
  data because they read from Redux, not React Query.

- **`envelope` is included in `queryLinesWithoutGeom`**: only `geometry` is
  excluded. `envelope` is always available for fly-to / bounding box operations
  without a separate query.

- **`selected` Redux state drives map rendering**: `LinesMapView` reads
  `selectSelected`, not React Query. Any code that removes lines from existence
  (deletion, hiding) must also update Redux — not just invalidate caches.

- **`selectLine` in `LineEditModalWrapper` updates both**: it calls
  `setOnMapIdsTemp` (local) AND `dispatch(setLineSelected(id, isSelected))`
  (Redux). This is the canonical way to toggle a line. Use it, don't
  dispatch `setLineSelected` directly unless you also update any local
  `onMapIdsTemp` state.

- **Import convention**: Feature-level `AGENTS.md` documents architecture.
  The root `AGENTS.md` covers project-wide commands and conventions.

- **Line colours are Redux-only, not DB**: `lineColors` lives in Redux and
  is persisted via `DefaultPreference`. It is never written to the lines
  table. `LinesMapView` reads `selectLineColors`, not React Query. This
  avoids coupling geometry batch queries to colour data.

## Map context menu + under-center highlight

- **`LinesLineSource`** (`mapContextMenuSources/`) — long-press source for
  selected lines: Route details (`setLineTemp` → LineEditModal), Fly to,
  Change color (modal with uniform rows: slope-ramp toggle + palette
  colours, disabled for system lines),
  Remove from map (disabled for system lines via `useSystemLineIds`).
  Resolves the tapped line through `linesLayerRegistry` (uuid → lineId,
  fed by LinesMapView `onCreate`).
- **`LineColorPickerModal`** (`components/`) + `lineColorPickerStore` — the
  always-mounted host (lines mapComponent) for the color picker; the store
  pattern keeps the modal alive after the context menu closes. Selecting a
  swatch dispatches `setLineColor({ lineId, color })` and clears any ramp.
  A "Slope color ramp" `MenuItem` (shown when the line has elevation or an
  active ramp) toggles `setLineRamp`; the source passes `rampActive` /
  `rampEnabled` through `openLineColorPicker`.
- **`useLineIdUnderCenter`** (`hooks/`) — returns the Set of selected line
  ids whose rendered geometry is under the map center (point-to-segment
  screen distance, `LINES_HOVER_THRESHOLD_DP` = 4 dp, zoom-aware). Reuses
  the `lineGeomsBatch` viewport query (cache-shared with LinesMapView —
  SQL-side `MbrIntersects` keeps candidates on-screen only). `SelectedLinesList`
  scales each hit row's color bar to double width (animated `scaleX` from the
  left edge, fixed-width column — no layout shift). Scale rather than width:
  reanimated width changes bypass Yoga, so the ramp legend's SVG child would
  keep its laid-out 2px size and not grow.
- **`layerRegistry.ts`** — module-level `pathUuidByLineId` fed by
  LinesMapView's `onCreate`/`onRemove`; consumed by the context-menu source.

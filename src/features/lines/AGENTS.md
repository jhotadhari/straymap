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
  // LinesState only:
  lineTemp?: LinePartial;                         // draft being edited in LineEditModal
  tagTemp?: { id: number; ... } | null;           // draft tag being edited
}
```

### Key thunks

| Thunk                                | What it does                                                     |
| ------------------------------------ | ---------------------------------------------------------------- |
| `setLineSelected(id, isSelected?)`   | Toggle-adds/removes a single line from `selected[]`              |
| `setLinesSelected(newIds: number[])` | Bulk-replaces `selected[]` (no-op if unchanged)                  |
| `toggleLinesSort(columnKey)`         | Toggle sort direction or switch to a new column                  |
| `toggleTagsSort(columnKey)`          | Same for the tags table                                          |
| `randomizeLineColors()`              | Assigns random `PALETTE_COLORS` to all selected lines, avoiding same-adjacent-colour |
| `setLinesColor(color)`               | Sets all selected lines to the same palette colour               |
| `onSetDbPath()`                      | Clears `selected[]` when the db path changes (user must restart) |

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
| `RowExport`      | Export GPX                                                 |
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
| Export          | `useExport`        | No     |
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

### LinesMapView

`LinesMapView` subscribes to `selectLineColors`. A `useMemo`'d
`Map<colorHex, paintObject>` (at most 11 entries — 10 palette + 1 default
`PALETTE_COLORS[0].bg`) is created once. Each `<LayerPath>` looks up its
line's paint via `paintByColor.get(lineColors[lineId] ?? FALLBACK_COLOR)`.
Paint objects are shared when colours repeat, so per-line colour has no
per-element allocation cost.

### ListRow colour column

The colour column (`colorColumnInner`) in `ListRow` shows a vertical
2px-wide bar. Background reads from Redux: `lineColors[line.id]` fallback
`PALETTE_COLORS[0].bg`. Tapping opens a `Popover` (raw `react-native-popover-view`,
no placement — auto-positions) with one `MenuItem` per palette colour
showing an unlabelled coloured circle. Selecting dispatches
`setLineColor({ lineId, color })`.

## DrawerTopBar actions popover

Follows the same `useActions` aggregator pattern as
`RoutingActionsButton` (`src/features/routing/components/DrawerTopBar/useActions/`).

### Files

```
DrawerTopBar/
├── DrawerTopBar.tsx           # calls useActions, renders LinesActionsButton
├── LinesActionsButton.tsx     # dual-mode Popover (actions ↔ colour palette)
└── useActions/
    ├── index.ts               # aggregator → Record<string, MenuActionOption>
    ├── useActionClearLines.tsx # confirmation modal → setSelected(system-only IDs)
    ├── useActionRandomizeColors.tsx # dispatches randomizeLineColors()
    ├── useActionSetEqualColors.tsx  # switches popover to colour-picker mode
    └── useActionShowStats.tsx       # aggregated-statistics modal
```

### LinesActionsButton dual-mode popover

Uses a raw `Popover` (not `ButtonHighlightMenuControl`) because the popover
must stay open and swap between two content sets:

1. **Actions menu** (3 items): clearLines, randomizeColors, setEqualColors
2. **Colour picker** (10 items): one per `PALETTE_COLORS`, unlabelled circles

"set equal colours" sets `colorPickerActive = true` without closing the
popover. Selecting a colour calls `handleColorSelect` which dispatches
`setLinesColor(color)` and calls `dismissMenu()` (closing both).

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

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
  timestamp: string;     // ISO-8601
  tags: Tag[];           // many-to-many via tagsToLinesTable
  data: any;             // arbitrary JSON (import metadata etc.)
  stats: LineStats;      // { length, uphill, downhill, minZ, maxZ }
}
```

`LinePartial` is `Omit<Line, 'geometry'>` — used by most queries because
geometry is fetched separately via `['lineGeom', lineId]` for map rendering.
**Envelope is included in both** — it's fetched by the default field set and
only excluded by explicit `fieldsExclude: ['geometry']` (not `['envelope']`).

## Redux state (`lines/slice.ts`)

```ts
LinesState {
  initialized: boolean;
  selected: number[];  // line IDs currently on the map
  lineTemp?: LinePartial;                         // draft being edited in LineEditModal
}
```

### Key thunks

| Thunk                                | What it does                                                    |
| ------------------------------------ | --------------------------------------------------------------- |
| `setLineSelected(id, isSelected?)`   | Toggle-adds/removes a single line from `selected[]`             |
| `setLinesSelected(newIds: number[])` | Bulk-replaces `selected[]`                                     |
| `setLineTemp(linePartial?)`          | Sets/clears the draft line being edited in the modal            |

### Key selectors

| Selector              | Returns                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `selectSelected`      | `number[]` (deduplicated)                                       |
| `selectLineTemp`      | `LinePartial \| undefined`                                       |

## React Query layer

Two query families defined in `db/queryFns.ts`:

| Query key                      | fetcher                 | What it returns                                       |
| ------------------------------ | ----------------------- | ----------------------------------------------------- |
| `['lines']` / `['lines', ids]` | `queryLinesWithoutGeom` | `LinePartial[]` (no geometry, **includes envelope**)  |
| `['lineGeom', lineId]`         | `queryLineGeom`         | Single line with geometry only (no envelope, no tags) |

`staleTime: Infinity` — never auto-refetches. Must manually `invalidateQueries`
after writes. Places that create/update/delete lines MUST invalidate both
`['lines', …]` and `['lineGeom', …]` keys.

`gcTime: 0` — cache is cleared when the last observer unmounts, forcing a
fresh fetch on next mount (e.g. when LineEditModal reopens).

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

Rendered by `LineEditModalWrapper` (in `LinesTable.tsx`). Opens when
`lineTemp` is set (via `dispatch(setLineTemp({ id }))`).

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
| `RowFlyTo`       | Smooth fly to line's bounding box (disabled if not on map) |
| `RowToggleOnMap` | Toggle line visibility with dynamic icon/label             |
| `RowRouting`     | Load/activate routing for this line                        |
| `RowStats`       | Show aggregated statistics                                 |
| `RowExport`      | Export GPX (stub)                                          |
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

- **Import convention**: Feature-level `CLAUDE.md` documents architecture.
  The root `CLAUDE.md` covers project-wide commands and conventions.

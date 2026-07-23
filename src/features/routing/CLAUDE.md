# Routing feature

Turn-by-turn routing powered by `react-native-brouter` (offline routing engine).
Users create a route, place waypoints on the map, and the brouter engine
computes path segments between consecutive waypoints. The resulting line
geometry is stored in the `lines` table and linked to the route via `line_id`.

## Data model

```
Route {
  id: number;            // autoincrement PK
  point_order: number[]; // ordered list of routing point IDs
  line_id: number | null; // FK → lines.id (ON DELETE SET NULL)
  stats?: LineStats;     // copied from the linked line's geometry stats
  points: RoutingPoint[];
}

RoutingPoint {
  id: number;
  geometry: Point;       // GeoJSON Point (SRID 4326, POINTZ)
  route_id: number;      // FK → routes.id (DB column only, not on the TS type)
  profile: RoutingProfile; // { provider: 'brouter' | 'straightLine', options: BrouterOptions | StraightLineOptions }
}
```

**Route ↔ Line relationship**: A route is created with `line_id = null`.
When the user adds waypoints and `processRouting` runs, it calls
`updateLineFromSegments` which:

1. Fetches brouter coordinates for each consecutive pair of waypoints
2. Creates a new line (or updates an existing one) with the combined geometry
3. Sets `route.line_id = newLine.id` via `updateRoute`

A route can exist with zero points — the `fetchRoutes` fallback handles this
(see below). Routes and points are **persistent** — stopping routing does not
delete them. They remain in the DB and can be re-loaded later.

## Redux state (`routing/slice.ts`)

```ts
RoutingState {
  initialized: boolean;
  brouterAvailable: null | boolean; // null = unchecked, boolean = availability check result
  isRouting: false | number;  // false = inactive; number = active route ID
  routingLineId: null | number; // line ID linked to the active route
  segments: Record<string, RoutingSegment>; // brouter-computed path segments
}
```

### Key thunks

| Thunk                                   | What it does                                                                  |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `setIsRouting(routeId \| false)`        | Sets `isRouting`. Listener auto-triggers `processRouting` when truthy.        |
| `setRoutingLineId(lineId)`              | Action creator. Sets `routingLineId`. Persisted to storage.                   |
| `processRouting(queryClient, options?)` | Fetches points, computes segments via brouter, creates/updates line geometry. |

### `processRouting` flow

```
1. Fetch route's points from DB (getPointsForRouteId)
2. For each consecutive pair → call brouter (getCoordsFromRouting) → resolve segments
3. If updateLine !== false:
     updateLineFromSegments(routeId, segments, queryClient):
       a. If no segment has usable positions → return {} (no line created)
       b. Fetch route to check existing line_id
       c. If line_id exists → updateLine(line_id, newGeometry)
       d. If line_id is null → createLines([newGeometry]) → updateRoute(routeId, { line_id: newId })
       e. Invalidate: ['route', routeId], ['lineGeom', lineId], ['lines', [lineId]], ['routeForLine', lineId]
   If updateLine === false (restore / re-load):
     Fetch route from DB, read line_id, re-select the line, invalidate route + line caches
4. Dispatch segments to store
```

`processRouting` is called with `updateLine: true` (default) when points are
added/deleted/reordered. It's called with `updateLine: false` by the listener
middleware when a persisted route is re-loaded via `setIsRouting(routeId)`.

## Listener middleware (`routing/connectStorage.ts`)

| Listener    | Trigger                                  | Effect                                                          |
| ----------- | ---------------------------------------- | --------------------------------------------------------------- |
| Persistence | `setIsRoutingAction`, `setRoutingLineId` | Saves settings to `DefaultPreference`                           |
| Auto-load   | `setIsRoutingAction` with truthy payload | Dispatches `processRouting(queryClient, { updateLine: false })` |

The auto-load listener means: **calling `dispatch(setIsRouting(routeId))` is
sufficient to re-load a persisted route.** The listener picks it up and
dispatches `processRouting` which fetches points and computes segments.

### Gotcha: `routingLineId` cleared on route switch

When `setIsRoutingAction` is dispatched, the reducer clears `routingLineId`
to `null`. The listener fires `processRouting` immediately after, but the
`initializeFromStorage` function dispatches `setIsRoutingAction` first,
then `setRoutingLineId` second — the listener fires on the first dispatch,
before the second has happened.

The `updateLine: false` branch works around this by fetching `line_id`
from the DB directly (via `queryRoute`), rather than reading the
potentially-stale `routingLineId` from Redux state.

The `RowRouting` button also calls `selectLine(lineTemp.id, true)` after
dispatching `setIsRouting(route.id)` for immediate UI feedback — the
asynchronous `processRouting` will also re-select the line when it completes,
but the synchronous call gives instant response.

## React Query layer

| Query key                  | fetcher             | What it returns                          |
| -------------------------- | ------------------- | ---------------------------------------- |
| `['route', routeId]`       | `queryRoute`        | Full `Route` with points, or `null`      |
| `['routeForLine', lineId]` | `queryRouteForLine` | Route whose `line_id` matches, or `null` |

### `fetchRoutes` fallback for zero-point routes

`fetchRoutes` starts from `routingPointsTable` and LEFT JOINs to `routesTable`.
A route with **zero points** produces zero rows from this join — it's invisible.
Two fallbacks exist:

1. **`routeId` fallback**: queries `routesTable` directly by `id`, returns a
   `Route` with empty `points[]` and `stats: {}`.
2. **`lineId` fallback** (same pattern): queries `routesTable` directly by
   `line_id`, returns a skeleton `Route`.

Without these, callers like `queryRouteForLine` would return `null` for
perfectly valid routes that just don't have any waypoints yet.

### Cache invalidation

All code paths that mutate route data or the route-line relationship MUST
invalidate these query keys:

- `['route', routeId]` — the route itself
- `['routeForLine', lineId]` — reverse lookup from line to route
- `['lineGeom', lineId]` — map rendering
- `['lines', [lineId]]` — line list queries
- `['lines']` (exact) — when a new line is created

These invalidations happen in `processRouting` after `updateLineFromSegments`
completes. If you add a new write path that changes `route.line_id` or
creates/deletes lines, you must add the corresponding invalidations.

## Route lifecycle

```
createRoute()              → INSERT route (line_id = NULL, point_order = [])
  → dispatch(setIsRouting(newId))

User adds waypoints       → createRoutingPoints(log)
  → dispatch(processRouting(queryClient))  [updateLine: true]
    → brouter computes segments → creates line → sets route.line_id

User edits/reorders       → dispatch(processRouting(queryClient))  [updateLine: true]
  → updates existing line geometry

User stops routing        → dispatch(setIsRouting(false))
  → route + points PERSIST in DB  (DO NOT DELETE — see note below)
  → user can re-load later via RowRouting button

User deletes line         → FK ON DELETE SET NULL → route.line_id = NULL
  → route is orphaned but still exists
  → rownting can still be re-loaded; the line can be re-created by processRouting

Bulk delete lines         → useDeleteLines calls deleteLines(ids)
  → must also dispatch setLinesSelected(…) to sync Redux
  → routes with line_id in deleted set become orphaned
```

### Persistence guarantee

Routes and points are **never automatically deleted**. The `deleteRoute`
function exists in `db/actionsRoute.ts` but is **not called** by any active
code path (it's available for future admin/cleanup functionality). The
`useToggleRouting` hook previously called it — this was a bug, fixed by
commit `00e770d`.

## Key components and hooks

| Component/Hook             | File                                     | Role                                            |
| -------------------------- | ---------------------------------------- | ----------------------------------------------- |
| `useToggleRouting`         | `components/DrawerTopBar/useToggleRouting.ts`       | Start/stop routing toggle                       |
| `useActions`               | `components/DrawerTopBar/useActions/index.ts`       | Composes routing action hooks                   |
| `useActionAppendPoint`     | `components/DrawerTopBar/useActions/useActionAppendPoint.ts`     | Add waypoint at current map center              |
| `useActionDeleteLastPoint` | `components/DrawerTopBar/useActions/useActionDeleteLastPoint.ts` | Remove last waypoint                            |
| `RoutingActionsButton`     | `components/RoutingActionsButton.tsx`               | Popover menu with routing actions               |
| `RowRouting`               | `../lines/components/LineEditModal/RowRouting.tsx`   | Load/activate a line's route from LineEditModal |
| `useRoute`                 | `hooks/useRoute.ts`                      | Fetch active route from Redux + React Query     |

## Gotchas

- **Routes are persistent**: stopping routing only clears `isRouting` in Redux.
  The route and its points stay in the DB. Re-load via `dispatch(setIsRouting(routeId))`
  or the `RowRouting` button in `LineEditModal`.

- **`route.line_id` is only set by `processRouting`**: no other code path
  writes it. It's set asynchronously after brouter returns coordinates. Until
  that completes, `line_id` is `null` and `queryRouteForLine` returns `null`.

- **`updateLine: false` means no line geometry update**: the restore/re-load
  path does not re-compute line geometry. It assumes the geometry is already
  correct from a prior `updateLine: true` call.

- **The `routingLineId` in Redux is cleared when switching routes**: the
  `setIsRoutingAction` reducer sets `routingLineId = null`. If you need the
  line association after switching routes, fetch the route and read its
  `line_id` field from the DB, don't rely on Redux state.

- **Cache invalidation**: `staleTime: Infinity` means queries never auto-refetch.
  Any code that mutates routes, points, or the route-line association MUST
  call `invalidateQueries` on the affected keys. The invalidation list in
  `processRouting` is the canonical reference.

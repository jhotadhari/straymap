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
  profile: RoutingProfile; // the route-level routing profile (NOT NULL, always present)
}

RoutingPoint {
  id: number;
  geometry: Point;                 // GeoJSON Point (SRID 4326, POINTZ)
  route_id: number;                // FK → routes.id (DB column only, not on the TS type)
  profile?: RoutingProfile;        // only meaningful when inheritMode === 'own', otherwise null
  inheritMode?: RoutingPointInheritMode; // defaults to 'route'
}
```

**Profile inheritance modes** (`RoutingPointInheritMode`):

| Mode      | Behavior                                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| `'route'` | Inherits from the Route's `profile`. The route always has a profile, so this always resolves.                    |
| `'prev'`  | Inherits from the previous point's resolved profile. If it's the first point, falls back to the Route's profile. |
| `'own'`   | Uses the point's own explicit `profile`. This is the only mode where `RoutingPoint.profile` is meaningful.       |

The default inherit mode for new points is `'route'` (`DEFAULT_INHERIT_MODE` constant).

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
  lastProfiles: LastProfiles;  // persisted "global" routing profiles per provider
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
1. Fetch route's points and profile from DB (getPointsForRouteId)
2. Use lastProfiles as fallback for routeProfile if it somehow missing
3. For each consecutive pair → resolve profile via resolveProfileForPoint → call brouter (getCoordsFromRouting)
4. If updateLine !== false:
     updateLineFromSegments(routeId, segments, queryClient):
       a. If no segment has usable positions → return {} (no line created)
       b. Fetch route to check existing line_id
       c. If line_id exists → updateLine(line_id, newGeometry)
       d. If line_id is null → createLines([newGeometry]) → updateRoute(routeId, { line_id: newId })
       e. Invalidate: ['route', routeId], ['lineGeom', lineId], ['lines', [lineId]], ['routeForLine', lineId]
   If updateLine === false (restore / re-load):
     Fetch route from DB, read line_id, re-select the line, invalidate route + line caches
5. Dispatch segments to store
```

`processRouting` is called with `updateLine: true` (default) when points are
added/deleted/reordered. It's called with `updateLine: false` by the listener
middleware when a persisted route is re-loaded via `setIsRouting(routeId)`.

## Profile inheritance system

### `resolveProfileForPoint` (`utils.ts`)

Resolves which `RoutingProfile` a point uses for its outgoing segment.
Called by `processRouting` (for each consecutive point pair) and by
components that display resolved profile info.

```
resolveProfileForPoint(point, index, points, routeProfile):
  mode = point.inheritMode ?? DEFAULT_INHERIT_MODE  // 'route'

  if mode === 'own'    → return point.profile
  if mode === 'route'  → return routeProfile
  if mode === 'prev':
    if index === 0     → return routeProfile (first point falls back to route)
    else               → recursively resolve the previous point
```

The function is **pure** — it does not access Redux state. Callers are
responsible for providing a valid `routeProfile` and handling the
`lastProfiles` → `DEFAULT_PROFILE` fallback chain themselves.

### Segment recalculation optimization (`getChangedSegmentIds`)

When a profile change occurs (route profile edit, or point inheritMode/profile
edit), the system avoids unnecessary BRouter recomputation by only deleting
segments whose **resolved profile actually changed**.

`getChangedSegmentIds(points, routeProfile, options)` walks points from
`startIdx` forward, comparing `resolveProfileForPoint` against old vs new
state. It stops on the first unchanged profile (`!isEqual`) — any subsequent
`'prev'` points inherit from that unchanged ancestor, so their segments also
haven't changed.

Used by both `EditPointModal` and `RouteProfileModal`. After computing the
segment IDs, they dispatch `deleteSegments(segmentIds)` + `processRouting()`.

### `setLastProfile` / `lastProfiles`

The Redux `lastProfiles` object serves as the "global routing profile" — it is
persisted across sessions and used to initialize the route profile when creating
a new route. Whenever the user saves a profile edit (point's own profile in
`EditPointModal`, or the route profile in `RouteProfileModal`), the system
dispatches `setLastProfile(profile)` to keep `lastProfiles` in sync.

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
createRoute(profile)       → INSERT route (line_id = NULL, point_order = [], profile = lastProfiles.current)
  → dispatch(setIsRouting(newId))

User adds waypoints       → createRoutingPoints({ inheritMode: 'route' })
  → dispatch(processRouting(queryClient))  [updateLine: true]
    → resolveProfileForPoint for each segment → brouter → creates line → sets route.line_id

User edits point profile  → EditPointModal (route/prev/own SegmentedButtons)
  → getChangedSegmentIds computes which segments actually changed
  → deleteSegments + processRouting

User edits route profile  → RouteProfileModal
  → getChangedSegmentIds with newRouteProfile
  → deleteSegments + setLastProfile + processRouting

User stops routing        → dispatch(setIsRouting(false))
  → route + points PERSIST in DB  (DO NOT DELETE — see note below)
  → user can re-load later via RowRouting button

User deletes line         → FK ON DELETE SET NULL → route.line_id = NULL
  → route is orphaned but still exists
  → routing can still be re-loaded; the line can be re-created by processRouting

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

| Component/Hook             | File                                                             | Role                                                                    |
| -------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `useToggleRouting`         | `components/DrawerTopBar/useToggleRouting.ts`                    | Start/stop routing toggle; creates route with profile from lastProfiles |
| `useActions`               | `components/DrawerTopBar/useActions/index.ts`                    | Composes routing action hooks                                           |
| `useActionAppendPoint`     | `components/DrawerTopBar/useActions/useActionAppendPoint.ts`     | Add waypoint (inheritMode: 'route') at current map center               |
| `useActionDeleteLastPoint` | `components/DrawerTopBar/useActions/useActionDeleteLastPoint.ts` | Remove last waypoint                                                    |
| `RoutingActionsButton`     | `components/RoutingActionsButton.tsx`                            | Popover menu with routing actions                                       |
| `RowRouting`               | `../lines/components/LineEditModal/RowRouting.tsx`               | Load/activate a line's route from LineEditModal                         |
| `useRoute`                 | `hooks/useRoute.ts`                                              | Fetch active route from Redux + React Query                             |
| `EditPointModal`           | `components/EditPointModal.tsx`                                  | Edit point profile/inheritMode; snapshotting on first 'own' switch      |
| `RouteProfileModal`        | `components/RouteProfileModal.tsx`                               | Edit route-level profile with point usage stats                         |
| `RoutingProfileInfo`       | `components/RoutingProfileInfo.tsx`                              | Read-only profile display (resolved profile + inheritMode label)        |
| `ProfileEditControls`      | `components/ProfileEditControls.tsx`                             | Reusable profile editing UI shared by both modals                       |

## Gotchas

- **Routes are persistent**: stopping routing only clears `isRouting` in Redux.
  The route and its points stay in the DB. Re-load via `dispatch(setIsRouting(routeId))`
  or the `RowRouting` button in `LineEditModal`.

- **`route.profile` is always required** (NOT NULL in schema). When a route is
  created, `useToggleRouting` sets it from `lastProfiles`. All profile
  resolution paths can safely assume it exists.

- **`RoutingPoint.profile` is only meaningful when `inheritMode === 'own'`**.
  For `'route'` and `'prev'` modes, the profile field is null/undefined in the DB.
  The resolved profile is computed at runtime via `resolveProfileForPoint`.

- **New points default to `inheritMode: 'route'`**. The `getNextProfile` logic
  is removed — the Route's profile is the source of truth for new points.

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

- **Don't delete segments blindly on profile changes**: use `getChangedSegmentIds`
  to compare resolved profiles before/after. This avoids expensive BRouter
  recomputation for segments whose effective profile didn't actually change.

- **`setLastProfile` dispatches are required** whenever a profile is saved
  (point's own profile or route profile), so `lastProfiles` in Redux stays in
  sync as the "global routing profile default".

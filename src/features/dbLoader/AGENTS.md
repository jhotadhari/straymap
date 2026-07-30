# Database layer: pipeline, layers, and conventions

This explains how SpatiaLite, op-sqlite, drizzle, TanStack React Query, and the
Redux store fit together for the `lines`/`routing` features, and the
conventions/gotchas to keep in mind when touching CRUD code here.

## The stack, bottom to top

```
SQLite file (op-sqlite)
  └─ libspatialite extension  (geometry columns, spatial functions, R*Tree index)
       └─ drizzle-orm/op-sqlite  (schema, query builder, migrations, parameterization)
            └─ feature db/actions*.ts  (writes)  +  db/fetch.ts (reads)
                 └─ db/queryFns.ts  (adapts fetch.ts to React Query's queryFn shape)
                      └─ TanStack React Query  (cache for data that lives in the db)
                           └─ Redux Toolkit  (app/UI state, orchestration, persisted settings)
```

Each layer has one job:

- **op-sqlite** (`@op-engineering/op-sqlite`) is the native SQLite binding. `DBConnection.ts`
  opens it and loads `libspatialite` via `op.loadExtension(...)`.
- **libspatialite** adds geometry columns/types (`AddGeometryColumn`, LINESTRINGZ/POINTZ,
  SRID 4326) and spatial SQL functions (`GeomFromGeoJSON`, `AsGeoJSON`, `GreatCircleLength`,
  `UphillHeight`, `ST_Envelope`, the R\*Tree-backed `CreateSpatialIndex`, etc). It's a SQL
  extension, not something the JS code talks to directly — drizzle just emits SQL that calls
  these functions.
- **drizzle-orm** is the only thing that talks to op-sqlite. It owns: the table schema
  (`db/schema/schema.ts` per feature, aggregated in `dbLoader/schema.ts`), the migration
  runner (`drizzle-kit generate` → `/drizzle/*.sql`, applied by `migrate()` in
  `DBConnection.setDbZ()`), and — importantly — **parameterization**. Every value passed to
  `.values()`/`.set()`/a `sql\`...\``template becomes a bound`?` parameter
(`drizzle-orm/op-sqlite/session.js`→`client.executeAsync(sql, params)`); nothing here
builds SQL by string concatenation. The custom `lineString()`/`point()`column types in`dbLoader/types.ts`follow the same rule:`GeomFromGeoJSON(${valueEpsgStr})` binds the
  GeoJSON string as a parameter, it does not splice it into the SQL text.
- **`db/actions*.ts`** (`lines/db/actionsLine.ts`, `actionsTag.ts`, `routing/db/actionsRoute.ts`,
  `actionsRoutingPoint.ts`) are the only place that writes. Plain async functions, not
  Redux thunks — they can be called from a thunk, a React Query `mutationFn`, or a component.
- **`db/fetch.ts`** is the only place that reads (joins lines+tags, routes+points, parses the
  `AsGeoJSON(...)` text columns back into GeoJSON via `dbLoader/utils.ts`'s
  `rowParseGeometryGeoJSON`/`rowParseEnvelopeGeoJSON`).
- **`db/queryFns.ts`** wraps `fetch.ts` functions into the `({ queryKey }) => Promise<T>` shape
  React Query expects, so the query key (e.g. `['lines', lineIds]`, `['route', routeId]`)
  is the single source of truth for what's being fetched.
- **React Query** (`dbConnection.queryClient`, created in `DBConnection.setQueryClient()` and
  provided via `QueryClientProvider` in `App.tsx`) is the cache for everything that lives in
  the db. `staleTime: Infinity` / `gcTime: 0` means it never auto-refetches — it only updates
  when the app explicitly calls `invalidateQueries`/`refetchQueries`/`fetchQuery` after a
  write. There is no server here, so `networkMode: 'always'` and no retry-on-network-error
  semantics apply.
- **Redux Toolkit** does not store db rows. It stores UI/app state (`lines.selected`,
  `routing.isRouting`, etc.) and orchestrates: a thunk calls an `actions*.ts` write function,
  then calls `queryClient.invalidateQueries(...)` to tell React Query that cached data is
  stale, and components re-render off `useQuery`/`useMutation`, not off the Redux store, for
  db-derived data.

## Read path

```
component useQuery({ queryKey: ['lines', ids], queryFn: queryLinesWithoutGeom })
  → queryFns.ts wraps the queryKey args
    → fetch.ts builds the drizzle select (joins, spatial SQL functions)
      → drizzle parameterizes + runs it via op-sqlite
        → rows come back with raw GeoJSON text columns
      → dbLoader/utils.ts parses those into GeoJSON objects
  → React Query caches the result under the queryKey
```

## Write path

```
component useMutation({ mutationFn: createLines, onSuccess, onError })
  → actions*.ts runs the drizzle insert/update/delete (try/catch + logError + showErrorToast
    + rethrow on the create* functions — see "Error handling" below)
  → onSuccess: queryClient.invalidateQueries({ queryKey: [...] })
  → some flows additionally dispatch a Redux thunk (e.g. processRouting in
    routing/slice.ts) that itself calls queryClient.fetchQuery/refetchQueries directly
    (not via a hook — thunks aren't components) to chain further db-derived work, then
    dispatches plain Redux actions to update UI state
```

`routing/slice.ts`'s `processRouting` is the clearest example of the bridge: a thunk that
reaches into `dbConnection.queryClient` imperatively because thunks can't call `useQuery`.

## Dynamic `dbPath`

The db file path lives in the `dbLoader` Redux slice, persisted via
`react-native-default-preference` (`dbLoader/connectStorage.ts`). Changing it
(`setDbPath` thunk in `dbLoader/slice.ts`) calls every feature's `onSetDbPath` hook and sets
`requireReload: true` — by design, the app asks the user to restart rather than tearing down
and recreating `DBConnection`/`queryClient` live. Don't try to make this hot-swappable; that
was an explicit decision, not an oversight.

## Security notes

- **SQL injection**: not present. drizzle parameterizes all values, including the geometry
  blob built by `lineString()`/`point()` in `dbLoader/types.ts`. There is no string
  concatenation into SQL anywhere in this codebase — confirmed by reading
  `drizzle-orm/op-sqlite/session.js`. The one place raw SQL strings are run directly
  (`dbOpExecute` in `dbLoader/utils.ts`) is only called with hardcoded spatial-function
  queries (`lib/utils.ts` for stats computation) — never with user input.
- **No app-level input sanitization on text fields** (`title`, `label`, `notes`) — and none is
  needed for SQL safety. The only residual risk is unbounded length (no `maxLength` on the
  `TextInput` in `RowName.tsx`) and the `params`/`profile` JSON columns being typed `any` with
  no runtime shape validation before being persisted. Low severity for a single-user,
  on-device app, but worth tightening if either field starts being fed by anything other than
  direct user typing (e.g. an import feature).
- **Foreign keys on `tags_to_lines` have `ON DELETE cascade`** at the schema level — deleting a
  line or tag automatically cleans up join rows. Other foreign keys (e.g. `routing_points`
  → `routes`, `lines` → `routes` on the `line_id` FK in `routing_points`) use `ON DELETE no
  action` / `ON DELETE set null`, so orphaned rows are still possible there and the app is
  expected to clean up manually.

## CRUD conventions and known gaps

- **Error handling is now consistent**: all exported write functions (`create*`, `update*`,
  `delete*`, `lineAddTag`, `lineRemoveTag`) are wrapped with `withDbErrorHandling()` from
  `dbLoader/utils.ts`, which provides try/catch + `logError` + `showErrorToast` + rethrow.
  The one exception is `ensureSystemTagsExist` (in `lines/db/actionsTag.ts`), which
  intentionally catches errors per-label so one failure doesn't skip the rest — its callee
  (`ensureTagByLabel`) is itself wrapped.
- **Transactions**: multi-statement writes (`createLines`, `createRoutes`, `createRoutingPoints`,
  `updateRoutingPoint`, `deleteRoute`, `createTrack` in `trackRecording/db/actionsTrack.ts`)
  use `withDbTransaction()` from `dbLoader/utils.ts`. If a later statement throws, earlier
  statements in the same transaction are rolled back — no partial writes.
- **Orphaned join rows on delete**: `tagsToLinesTable` foreign keys now have
  `onDelete: 'cascade'` at the schema level, so deleting a line/tag automatically cleans up
  join rows — no manual cleanup needed in `deleteLine`/`deleteTag`. `deleteRoute` manually
  cleans up `routingPointsTable` as well.
- **`forEach(async ...)` is unsafe and was previously used for tag-linking** in `createLines`
  and `updateLine`: `Array.prototype.forEach` doesn't await its callback, so the enclosing
  function returned before the tag relations finished writing, and any error thrown inside
  those callbacks became an unhandled rejection that bypassed the function's own try/catch.
  Fixed to use `Promise.all(...)`/sequential `await` inside a `.map(...)` instead — if you add
  more per-row async work in these files, use the same pattern, not `forEach`.
- **`lineAddTag` had an inverted existence check**: it queried for the line by id only and
  treated "the line exists" as "the tag is already attached," so it skipped the insert almost
  every time it was called. Fixed to check whether `tagId` is actually present in the line's
  current tags.
- **Performance**: `createLines`' tag-linking does one `SELECT` per distinct `tagId` per call
  (deduped via the in-memory `tagIdsExisting` cache within a single call, but not across
  calls) to verify the tag exists before linking it — fine at current scale, but if bulk
  imports become a thing, consider a single `WHERE tag_id IN (...)` lookup instead of N
  selects.

## Persistence pattern (Redux ↔ DefaultPreference)

Every feature slice follows the same convention for persisting settings across app restarts:

1. **`slice.ts`** defines an `initialSettings` object with the subset of state that should
   survive app restarts (e.g. `isRouting`, `selected`, `mapUpdateInterval`). Only keys listed in
   `initialSettings` are persisted — everything else in the slice state is ephemeral.

2. **`connectStorage.ts`** (one per feature, e.g. `lines/connectStorage.ts`,
   `routing/connectStorage.ts`) provides three pieces:
    - **`initializeFromStorage(store)`** — called during app init (`store/utils.ts` →
      `initializeAppState`). Reads the persisted JSON blob from
      `react-native-default-preference`, parses it, and dispatches the appropriate Redux
      actions to restore the saved settings. Only runs once (gated by `selectInitialized`).
    - **`saveToStorage(state, actionType)`** — compares every key in `initialSettings`
      against its initial value and writes the diff to `DefaultPreference`. Called by the
      listener middleware whenever a tracked action fires.
    - **Listener middleware** (`startAppListening`) — watches for the actions that mutate
      settings (using `isAnyOf(...)` or `actionCreator`) and calls `saveToStorage` after
      the reducer has updated state.

3. **`index.ts`** (the feature's `AppFeature` export) includes `initializeFromStorage` so
   the app-init sequence knows to call it.

### Adding a new persisted setting

1. Add the field to the `*Settings` interface and to `initialSettings` in `slice.ts`.
2. Add a reducer for it (if it doesn't already exist).
3. Add the new action to the `isAnyOf(...)` matcher in `connectStorage.ts`'s
   `startAppListening` call so changes trigger a save.
4. If the setting needs to be restored on app start, add the corresponding dispatch to
   `initializeFromStorage`.

### Concrete example: `routingSettings`

```
initialSettings = { isRouting: false, routingLineId: null }
                              ↓
         saveToStorage compares state.routing.isRouting / state.routing.routingLineId
         against initialSettings, persists any differences to 'routingSettings'
                              ↓
         Listener: isAnyOf(setIsRoutingAction, setRoutingLineId) → saveToStorage
                              ↓
         On app start: initializeFromStorage reads 'routingSettings',
         dispatches setIsRoutingAction + setRoutingLineId to restore
```

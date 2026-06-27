# DB improvement plan (branch: `feature/dbImprove`)

This branch is dedicated to hardening the CRUD layer documented in
[`README.md`](./README.md) in this directory. It follows on from a
security/correctness review that fixed four tag-linking bugs in
`lines/db/actionsLine.ts` (commit `780dd16`: broken `forEach(async ...)` usage
in `createLines`/`updateLine`, an inverted tag-removal condition in
`updateLine`, and a wrong existence check in `lineAddTag`). That review
surfaced three further issues, tracked here with concrete plans.

No SQL injection risk was found — drizzle parameterizes everything, including
the custom `lineString()`/`point()` geometry columns. See `README.md` for the
full architecture writeup.

## Status

- [x] #1 Consistent error handling on update/delete functions
- [x] #2 Orphaned `tags_to_lines` rows on delete
- [x] #3 No db transactions on multi-statement writes (spike no longer
      needed — confirmed broken upstream, see issue 3 below)
- [x] #4 Adopt RQB for `fetchRoutes` (opportunity, not a bug — lowest
      priority)

(Numbered in suggested work order — see "Suggested order of work" below for why.)

---

## Issue 1: Inconsistent error handling on update/delete

Functions with **no** try/catch/log/toast today: `updateTag`, `updateRoute`,
`updateRoutingPoint`, `lineAddTag`, `lineRemoveTag`, `deleteLine`,
`deleteLines`, `deleteTag`, `deleteRoute`, `deleteRoutingPoint`. The four
`create*` functions and `updateLine` already follow the pattern (try/catch +
`logError` + `showErrorToast` + rethrow), added when the app-wide error-toast
system was introduced.

None of the unhandled functions currently swallow errors — they have no
try/catch at all, so drizzle errors already propagate as rejected promises.
Adding the pattern is purely additive (log + toast on top of the existing
rejection), it doesn't change what callers observe on failure.

### Steps

1. Extract a small wrapper instead of copy-pasting the same 4-line try/catch
   block 10 more times (15 total across the db layer). Put it in
   `dbLoader/utils.ts` next to `logError`:
    ```ts
    const withDbErrorHandling =
    	<Args extends any[], T>(context: string, fn: (...args: Args) => Promise<T>) =>
    	async (...args: Args): Promise<T> => {
    		try {
    			return await fn(...args);
    		} catch (error) {
    			logError(context, error);
    			showErrorToast(
    				sprintf(i18n.t('errorGeneric'), (error as Error)?.message ?? String(error))
    			);
    			throw error;
    		}
    	};
    ```
2. Wrap all 10 functions listed above with it, e.g.
   `export const updateTag = withDbErrorHandling('lines/actionsTag.updateTag', async (id, newTag) => {...})`.
3. Optionally retrofit the existing 5 (`createLines`, `createTags`,
   `createRoutes`, `createRoutingPoints`, `updateLine`) to use the same
   wrapper instead of inline try/catch, for one consistent pattern.
4. `yarn typecheck` / `yarn lint`.
5. Smoke-test a few failure paths if feasible (e.g. temporarily reference a
   bad column to force an error and confirm the toast fires), otherwise just
   confirm success paths are unaffected.

---

## Issue 2: Orphaned `tags_to_lines` rows on delete

`deleteLine`/`deleteTag` only delete from `lines`/`tags` (there's already a
`// ??? do that with schema` comment admitting the gap in `actionsLine.ts`),
and the FK in `drizzle/0000_elite_nitro.sql` is `ON DELETE no action` — SQLite
won't clean up for you. Every line/tag delete leaves a dangling row in
`tags_to_lines`. Not a wrong-join risk (ids are autoincrement, never reused),
but unbounded storage growth and a footgun for any future `COUNT`/stats query
over that table.

### Open question (decide before/while implementing)

Two ways to fix it:

- **Schema-level cascade** (recommended): add `{ onDelete: 'cascade' }` to
  both FKs on `tagsToLinesTable` (already sketched/commented out in
  `lines/db/schema/schema.ts`).
- **App-level cleanup**: explicitly delete from `tagsToLinesTable` inside
  `deleteLine`/`deleteLines`/`deleteTag`, mirroring what `deleteRoute` already
  does for `routingPointsTable`. Cheaper short-term, but it's the same
  "remember to do this everywhere" pattern that caused the gap in the first
  place.

This also surfaces a related, separate product question: should deleting a
`line` cascade-delete its `route` (via `routesTable.line_id`, currently
nullable with no `onDelete`)? Or should the route's `line_id` just be set to
null? **Needs a decision before touching the routing-side schema** — not just
plumbing, it's a product behavior call.

### Steps

1. Decide cascade-vs-manual for `tags_to_lines`, and decide the line→route
   question above.
2. Update the FK definitions in `lines/db/schema/schema.ts` (and
   `routing/db/schema/schema.ts` if the line→route question calls for it).
3. Run `yarn drizzle-kit generate`, review the generated migration SQL
   (SQLite can't `ALTER` an FK in place, so expect a table-rebuild migration:
   create new table, copy rows, drop old, rename — worth checking it's
   correct before applying). Per existing project convention, no need to
   preserve data carefully — the db is dummy data only at this stage.
4. Remove the now-stale `// ??? do that with schema` comments in
   `deleteLine`/`deleteLines`.
5. Manual check: create a line + tag + relation, delete the line, confirm
   `tags_to_lines` has no leftover row (ad-hoc query, similar to the existing
   `DebugBla.tsx` debug-helper pattern).

---

## Issue 3: No db transactions on multi-statement writes

Where it bites today:

- `createLines`: inserts a line, then separately inserts `tagsToLinesTable`
  rows. If the second step throws, the line is left committed with no tags.
- `updateLine`: updates the line row, then runs separate add/remove
  tag-relation queries.
- `createRoutingPoints`: inserts a point, then separately calls `updateRoute`
  to rewrite `point_order`. If that update fails, the point exists but isn't
  in the route's order.
- `deleteRoute`: deletes `routing_points` rows, then deletes the `routes`
  row — two independent statements.

### Research update: transaction bug confirmed, not fixed on any current/upcoming drizzle version

Researched whether a drizzle-orm upgrade (1.0 is at `rc.3` as of this writing,
`0.45.2` is still `latest`) fixes this. It does not — confirmed by diffing
`op-sqlite/session.ts` between `0.45.2` and current `main`: `transaction()` is
structurally unchanged, `begin`/the callback/`commit` are still never
awaited. Tracked upstream as
[drizzle-orm#2275](https://github.com/drizzle-team/drizzle-orm/issues/2275)
("sqlite transactions can't be async for 4 of 5 implementations"), open since
May 2024, explicitly naming op-sqlite, not part of either active v1 rewrite
effort (drizzle-kit rewrite, RQB v2). **Decision: skip the "verify via spike"
step below — go straight to the native `op.transaction()` helper described
in step 2. Don't upgrade drizzle-orm for this reason; no stable 1.0 exists
yet and it wouldn't help if it did.** Revisit only if drizzle-orm#2275 is
closed in a future release.

### Original finding: drizzle's op-sqlite transaction may not be safe to rely on

Reading `node_modules/drizzle-orm/op-sqlite/session.js`'s `transaction()`
method (drizzle-orm `0.45.2`, op-sqlite `16.1.0` — see `package.json`):

```js
transaction(transaction, config = {}) {
  const tx = new OPSQLiteTransaction(...);
  this.run(sql.raw(`begin...`));   // not awaited
  try {
    const result = transaction(tx); // if your callback is async, this is a
                                     // Promise, not awaited
    this.run(sql`commit`);          // fires immediately, before the body
                                     // actually finishes
    return result;
  } catch (err) {
    this.run(sql`rollback`);        // can't catch errors from an unawaited
                                     // async callback
    throw err;
  }
}
```

`run()` returns a promise (op-sqlite is fully async) but nothing here
`await`s it. So `commit` can fire before the inserts inside an
`async (tx) => {...}` callback actually complete, and an error thrown inside
that callback becomes an unhandled rejection the `catch` block never sees.
Confirmed unfixed upstream (see research update above) — no need to spike/
verify, go straight to building around it.

### Steps

1. Build a thin transaction helper on top of the _native_ op-sqlite
   transaction API instead of `dbConnection.drizzle.transaction(...)` —
   `dbConnection.op.transaction(async (tx) => { await tx.execute(sql, params); ... })`,
   which is genuinely async and is already used safely in `dbOpExecute`
   (`dbLoader/utils.ts`). Get the parameterized SQL out of drizzle via
   `db.insert(...).values(...).toSQL()` (`{ sql, params }`) and run it through
   `tx.execute(sql, params)` instead of `await db.insert(...)`.
2. Apply to the four call sites above, in this order (simplest first):
   `deleteRoute` → `createRoutingPoints` → `createLines` → `updateLine`.
3. Re-test each affected flow manually (create a line with tags, edit a
   route, delete a route) since this changes execution semantics even when
   the end result looks the same.

---

## Issue 4 (opportunity, not a bug): adopt drizzle relational queries (RQB) where it actually helps

Researched whether drizzle's relational query API (`db.query.<table>.findMany(...)`,
available because `drizzle(this.op, { schema })` is already initialized with
`schema` — the `relations()` calls in `lines/db/schema/schema.ts` are declared
but currently unused for querying) could replace the manual `.select()` +
join + JS `.reduce()` aggregation in `lines/db/fetch.ts` and
`routing/db/fetch.ts`.

**Findings:**

- RQB's `with: { tags: { with: { tag: true } } }` does dedupe/nest
  one-to-many/many-to-many results internally — this is exactly the step
  `fetchLinesWithTags`/`fetchRoutes` currently do by hand via `.reduce()`
  into a `Map`/`Record`.
- RQB supports mixing in raw SQL columns via `extras`, which is what we need
  for the SpatiaLite function calls (`AsGeoJSON`, `GreatCircleLength`,
  `ST_Envelope`, etc.):
    ```ts
    db.query.linesTable.findMany({
    	extras: (table, { sql }) => ({
    		geometryGeoJSON: sql<string>`AsGeoJSON (${table.geometry})`.as('geometryGeoJSON'),
    	}),
    	with: { tags: { with: { tag: true } } },
    });
    ```
- **The blocker**: RQB's `with` only _attaches_ relations, it never _filters_
  which rows come back. `fetchLinesWithTags`'s `tagId` parameter and its
  `allLines`/`allTags` toggle rely on real SQL `rightJoin`/`leftJoin`
  inclusion semantics (e.g. "only lines that have this specific tag") that
  RQB has no equivalent for. So `fetchLinesWithTags` can't fully move to RQB
  without losing that filtering, or reimplementing it as a JS post-filter
  (which defeats the point).
- `fetchRoutes` (`routesTable` ⟕ `routingPointsTable` ⟕ `linesTable`, plain
  `leftJoin`s, no toggle/filter) has no such blocker — a clean RQB candidate.
- This doesn't change with a drizzle-orm 1.0 upgrade: 1.0's "RQB v2" renames
  the access path (`db._query.*` instead of `db.query.*`, via
  `drizzle-orm/_relations`) but doesn't add inclusion-filtering on `with`,
  and we're not upgrading anyway (see issue 3's research update).

### Steps

1. Add `relations()` declarations for `routesTable`/`routingPointsTable` in
   `routing/db/schema/schema.ts` (not yet declared — only the `lines`/`tags`
   side has them today).
2. Rewrite `fetchRoutes` using `db.query.routesTable.findMany({ with: { points: true }, extras: {...} })`,
   dropping the manual joins and the `.reduce()` into `Record<routeId, Route>`.
   Keep the existing post-fetch `sortArrayByOrderArray` call — `point_order`
   sorting isn't something RQB does for you.
3. Leave `fetchLinesWithTags` on manual `.select()` — don't force RQB onto a
   function whose core job (toggleable join direction + tag filtering) RQB
   can't express. Optionally split it later: an RQB path for the common
   "give me lines with all their tags" case, manual SQL kept only for the
   `tagId`-filtered / `allLines=false` / `allTags=false` cases — but only if
   that split is shown to actually reduce code, not just add a second code
   path for the same data.
4. Re-test `fetchRoutes` call sites (`queryRoute`, `queryRouteForLine` in
   `routing/db/queryFns.ts`) after the rewrite — same return shape, but
   confirm the stats (`length`/`uphill`/`downhill`/`minZ`/`maxZ`) `extras`
   come back as the same string-to-parse-as-float shape `parseRows`/
   `mapValues(pick(...), parseFloat)` currently expects.

---

## Suggested order of work

1. **Issue 1** first — low risk, mechanical, makes failures visible while we
   touch the riskier stuff below.
2. **Issue 2** next — needs a schema/product decision, then a migration.
3. **Issue 3** next — no longer blocked on a spike (confirmed broken
   upstream), and benefits from issue 2's cascade semantics already being
   settled.
4. **Issue 4** whenever — independent of the other three, lowest priority
   since it's a simplification, not a bug fix. Good candidate for a quiet
   afternoon once 1–3 are done.

## Drizzle version note

Stay on `drizzle-orm ^0.45.2` for now. Researched upgrading to the 1.0 line
(at `1.0.0-rc.3` as of this writing, not yet stable) specifically to see if
it fixes the op-sqlite transaction bug behind issue 3 — it doesn't (confirmed
via source diff against `main`, tracked upstream as
[drizzle-orm#2275](https://github.com/drizzle-team/drizzle-orm/issues/2275),
unfixed, not part of the active v1 rewrite work). No other upgrade driver
exists right now. Revisit if #2275 closes or 1.0 reaches a stable release
with relevant op-sqlite fixes.
